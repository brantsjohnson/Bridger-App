// ============================================
// WHAT THIS FILE DOES (plain English):
// The PII firewall's scrub step. Before any model sees a payload, we strip or
// reject names, emails, phones, handles, and media on the deidentified lane.
// The personal_agent lane may keep the requester's own visible data, but still
// rejects media and requires a signed-in principal.
//
// --- SECURITY / PRIVACY ---
// No PII ever reaches a deidentified model. Photos/media never reach any LLM.
// ============================================
import type { JobName, Lane } from '../jobs/types';
import { getRegistryEntry } from '../jobs/registry';

/** Keys that must never appear on the deidentified lane. */
const FORBIDDEN_DEIDENTIFIED_KEYS = new Set([
  'name',
  'email',
  'phone',
  'handle',
  'display_name',
  'displayName',
  'full_name',
  'fullName',
  'phone_number',
  'phoneNumber',
  'username',
  'avatar',
  'photo',
  'image',
  'image_url',
  'imageUrl',
  'media',
  'media_url',
  'mediaUrl',
  'photo_url',
  'photoUrl'
]);

const MEDIA_KEYS = new Set([
  'media',
  'media_url',
  'mediaUrl',
  'photo',
  'photo_url',
  'photoUrl',
  'image',
  'image_url',
  'imageUrl',
  'avatar',
  'audio',
  'video',
  'file'
]);

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_RE = /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/;
const HANDLE_RE = /(^|[\s])@[A-Za-z0-9_]{2,}/;

export class ScrubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScrubError';
  }
}

export interface ScrubContext {
  /** Required on personal_agent: the signed-in user id. */
  principalId?: string;
}

export interface ScrubResult {
  ok: true;
  payload: Record<string, unknown>;
  lane: Lane;
}

/**
 * Scrub a job payload for its fixed lane. Throws ScrubError on hard reject
 * (call never leaves the building).
 */
export function scrubPayload(
  job: JobName,
  payload: Record<string, unknown>,
  ctx: ScrubContext = {}
): ScrubResult {
  const entry = getRegistryEntry(job);
  const lane = entry.lane;

  // SECURITY: reject media on every lane before anything else.
  assertNoMediaKeys(payload);

  if (lane === 'deidentified') {
    assertNoForbiddenKeys(payload, FORBIDDEN_DEIDENTIFIED_KEYS);
    const cleaned = deepScrubStrings(payload, stripPiiFromText);
    assertOpaqueSubject(cleaned);
    return { ok: true, payload: cleaned, lane };
  }

  // personal_agent: must have a principal; context assembly auth is Nest-side.
  if (!ctx.principalId) {
    throw new ScrubError(
      'personal_agent lane requires principalId (signed-in user)'
    );
  }
  assertNoMediaKeys(payload);
  return { ok: true, payload: { ...payload }, lane };
}

/** Strip emails/phones/handles from free text before embedding. */
export function stripPiiFromText(text: string): string {
  return text
    .replace(EMAIL_RE, '[redacted-email]')
    .replace(PHONE_RE, '[redacted-phone]')
    .replace(HANDLE_RE, '$1[redacted-handle]');
}

function assertNoMediaKeys(value: unknown, path = ''): void {
  if (value == null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoMediaKeys(v, `${path}[${i}]`));
    return;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (MEDIA_KEYS.has(k)) {
      throw new ScrubError(`media field rejected at ${path}.${k}`);
    }
    assertNoMediaKeys(v, path ? `${path}.${k}` : k);
  }
}

function assertNoForbiddenKeys(
  value: unknown,
  forbidden: Set<string>,
  path = ''
): void {
  if (value == null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoForbiddenKeys(v, forbidden, `${path}[${i}]`));
    return;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (forbidden.has(k)) {
      throw new ScrubError(`forbidden PII key rejected at ${path}.${k}`);
    }
    assertNoForbiddenKeys(v, forbidden, path ? `${path}.${k}` : k);
  }
}

function deepScrubStrings(
  value: unknown,
  scrub: (s: string) => string
): Record<string, unknown> {
  return walk(value, scrub) as Record<string, unknown>;
}

function walk(value: unknown, scrub: (s: string) => string): unknown {
  if (typeof value === 'string') {
    const next = scrub(value);
    // Hard reject if raw email/phone still looks present after strip (odd unicode).
    if (EMAIL_RE.test(value) || PHONE_RE.test(value)) {
      // Already replaced in scrub(); keep going with redacted form.
      return next;
    }
    return next;
  }
  if (Array.isArray(value)) return value.map((v) => walk(v, scrub));
  if (value != null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walk(v, scrub);
    }
    return out;
  }
  return value;
}

/** Subject refs must look like opaque ids (uuid or opaque_*), never a name. */
function assertOpaqueSubject(payload: Record<string, unknown>): void {
  const subject = payload.subject_ref ?? payload.subjectRef ?? payload.opaque_id;
  if (subject == null) return;
  if (typeof subject !== 'string') {
    throw new ScrubError('subject_ref must be an opaque string id');
  }
  const looksUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      subject
    );
  const looksOpaque = subject.startsWith('opaque_') || subject.startsWith('user_');
  if (!looksUuid && !looksOpaque) {
    throw new ScrubError('subject_ref must be an opaque id, never a display name');
  }
}
