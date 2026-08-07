// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that a model's JSON answer matches the shape we expect for that job.
// Bad shape → one retry at the gateway; still bad → fail silent (null).
// Also checks day/week summaries are grounded in the person's own words.
// ============================================
import type { JobName } from '../jobs/types';

export type ValidateResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: string };

export function validateJobOutput(
  job: JobName,
  schemaId: string | null,
  raw: string,
  groundingSource?: string
): ValidateResult {
  if (schemaId == null) {
    // Free text: optional grounding for summaries.
    if (job === 'day_summary' || job === 'person_summary') {
      if (!raw.trim()) return { ok: false, reason: 'empty_text' };
      if (groundingSource && !isGrounded(raw, groundingSource)) {
        return { ok: false, reason: 'grounding_failed' };
      }
    }
    return { ok: true, value: raw };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }

  switch (schemaId) {
    case 'week_summary':
      return validateWeekSummary(parsed, groundingSource);
    case 'quiz_moderator':
      return validateQuizModerator(parsed);
    case 'module_notes':
      return validateModuleNotes(parsed);
    case 'freshness':
      return validateFreshness(parsed);
    case 'agent_query':
      return validateAgentQuery(parsed);
    default:
      return { ok: false, reason: `unknown_schema:${schemaId}` };
  }
}

/**
 * PRIVACY: every claim in a summary must map back to the person's own words.
 * Heuristic: each sentence must share a meaningful word with the source.
 */
export function isGrounded(summary: string, source: string): boolean {
  const sourceNorm = source.toLowerCase();
  const sentences = summary
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return false;
  for (const sentence of sentences) {
    const words = sentence
      .toLowerCase()
      .split(/[^a-z0-9']+/)
      .filter((w) => w.length >= 4);
    if (words.length === 0) continue;
    const hit = words.some((w) => sourceNorm.includes(w));
    if (!hit) return false;
  }
  return true;
}

function validateWeekSummary(
  parsed: unknown,
  groundingSource?: string
): ValidateResult {
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'week_summary_not_object' };
  }
  const obj = parsed as Record<string, unknown>;
  for (const [day, text] of Object.entries(obj)) {
    if (typeof text !== 'string' && text !== null) {
      return { ok: false, reason: `week_summary_bad_day:${day}` };
    }
    if (typeof text === 'string' && groundingSource && text.trim()) {
      if (!isGrounded(text, groundingSource)) {
        return { ok: false, reason: `grounding_failed:${day}` };
      }
    }
  }
  return { ok: true, value: obj };
}

function validateQuizModerator(parsed: unknown): ValidateResult {
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'quiz_moderator_not_object' };
  }
  const obj = parsed as Record<string, unknown>;
  // SECURITY: moderator must never return scores.
  if ('scores' in obj || 'score' in obj || 'dimension_scores' in obj) {
    return { ok: false, reason: 'quiz_moderator_has_scores' };
  }
  if (obj.confidence == null || typeof obj.confidence !== 'object') {
    return { ok: false, reason: 'quiz_moderator_missing_confidence' };
  }
  if (obj.flags != null && !Array.isArray(obj.flags)) {
    return { ok: false, reason: 'quiz_moderator_bad_flags' };
  }
  return { ok: true, value: obj };
}

function validateModuleNotes(parsed: unknown): ValidateResult {
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'module_notes_not_object' };
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.notes !== 'string' && !Array.isArray(obj.notes)) {
    return { ok: false, reason: 'module_notes_missing_notes' };
  }
  return { ok: true, value: obj };
}

function validateFreshness(parsed: unknown): ValidateResult {
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'freshness_not_object' };
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.attribute_id !== 'string' || typeof obj.question !== 'string') {
    return { ok: false, reason: 'freshness_missing_fields' };
  }
  return { ok: true, value: obj };
}

function validateAgentQuery(parsed: unknown): ValidateResult {
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'agent_query_not_object' };
  }
  const obj = parsed as Record<string, unknown>;
  const intents = [
    'gift_ideas',
    'recall_fact',
    'search_notes',
    'upcoming',
    'reconnect',
    'general',
    'refuse'
  ];
  if (typeof obj.intent !== 'string' || !intents.includes(obj.intent)) {
    return { ok: false, reason: 'agent_query_bad_intent' };
  }
  return { ok: true, value: parsed };
}
