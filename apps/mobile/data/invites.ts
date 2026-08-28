// ============================================
// WHAT THIS FILE DOES (plain English):
// Creates the invite payloads used by Share-link and the QR block. Live mode
// calls the API (invite_links for share, short-lived qr_tokens for QR). Demo
// mode builds the same URL shape in memory so you can share, paste, and redeem
// without a server — proving the path that live mode uses.
//
// URL shape (same in demo + live):
//   bridger://invite/<uuid>           ← share link
//   bridger://invite/<uuid>?via=qr    ← QR (or https APP_LINK_BASE when set)
// ============================================
import * as Crypto from 'expo-crypto';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import { bumpDemoFriendCount, markDemoJoinedViaInvite } from './access';

export type InviteKind = 'link' | 'qr';

export type InvitePayload = {
  token: string;
  /** Full deep link (or https) a friend can open / scan */
  url: string;
  kind: InviteKind;
};

/** Optional https base for store / web invites; falls back to bridger:// */
function linkBase(): string {
  const raw = (process.env.EXPO_PUBLIC_APP_LINK_BASE ?? '').replace(/\/$/, '');
  return raw || 'bridger://';
}

function buildUrl(token: string, kind: InviteKind): string {
  const base = linkBase();
  // bridger:// needs "invite/TOKEN"; https://host needs "/invite/TOKEN".
  const path = base.endsWith('://') ? `invite/${token}` : `/invite/${token}`;
  const url = `${base}${path}`;
  return kind === 'qr' ? `${url}?via=qr` : url;
}

// --- DEMO: in-memory invite table (same redeem rules as the API) ---
type DemoInvite = { ownerId: string; kind: InviteKind; expiresAt: number | null };

const demoInvites = new Map<string, DemoInvite>();

/** Stable sample invite so one device can redeem "someone else's" code in demo. */
const DEMO_SAMPLE_TOKEN = '22222222-2222-4222-8222-222222222222';
const DEMO_SAMPLE_OWNER = 'fof-ana';

function ensureDemoSample(): void {
  if (!demoInvites.has(DEMO_SAMPLE_TOKEN)) {
    demoInvites.set(DEMO_SAMPLE_TOKEN, {
      ownerId: DEMO_SAMPLE_OWNER,
      kind: 'link',
      expiresAt: null
    });
  }
}

async function newDemoToken(): Promise<string> {
  // UUID v4 shape so paste/parse matches live tokens.
  return Crypto.randomUUID();
}

async function createDemoInvite(kind: InviteKind, ownerId: string): Promise<InvitePayload> {
  ensureDemoSample();
  const token = await newDemoToken();
  const expiresAt =
    kind === 'qr' ? Date.now() + 15 * 60 * 1000 : null;
  demoInvites.set(token, { ownerId, kind, expiresAt });
  return { token, url: buildUrl(token, kind), kind };
}

/**
 * Pull a shareable invite link for the signed-in user (or demo "me").
 * Onboarding's "invite 3 for free" always needs a link, even during demo week.
 */
export async function createShareInvite(opts?: {
  /** Skip demo-week "can invite" gate (onboarding free-access path). */
  forOnboarding?: boolean;
}): Promise<InvitePayload> {
  if (isDemoMode()) {
    if (!opts?.forOnboarding) {
      const { getInviteAccess } = await import('./access');
      const access = await getInviteAccess();
      if (access.demoWeekActive && !access.canInvite) {
        throw new Error('Invites are paused during the demo.');
      }
    }
    return createDemoInvite('link', 'me');
  }
  const res = await apiFetch<{ token: string; url: string }>(
    '/connections/invite-link',
    { method: 'POST', body: JSON.stringify({}) }
  );
  return { token: res.token, url: res.url, kind: 'link' };
}

/**
 * Pull a short-lived QR invite for the signed-in user (or demo "me").
 */
export async function createQrInvite(): Promise<InvitePayload> {
  if (isDemoMode()) {
    return createDemoInvite('qr', 'me');
  }
  const res = await apiFetch<{ token: string; url?: string }>(
    '/connections/qr-token',
    { method: 'POST', body: JSON.stringify({}) }
  );
  const url = res.url ?? buildUrl(res.token, 'qr');
  return { token: res.token, url, kind: 'qr' };
}

/**
 * Demo-only: a ready-made invite owned by Ana (not you) so Scan → Connect
 * works on one device and proves redeem → reveal.
 */
export function getDemoSampleInvite(): InvitePayload {
  ensureDemoSample();
  return {
    token: DEMO_SAMPLE_TOKEN,
    url: buildUrl(DEMO_SAMPLE_TOKEN, 'link'),
    kind: 'link'
  };
}

/**
 * Parse pasted text / a scanned URL into token + kind.
 * Accepts raw UUIDs, bridger://invite/…, and https …/invite/… links.
 */
export function parseInviteInput(raw: string): {
  token: string;
  kind: InviteKind;
} | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const viaQr = /(?:\?|&)via=qr\b/i.test(cleaned);
  const match = /(?:invite\/)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(
    cleaned
  );
  const token = match?.[1];
  if (!token) return null;
  if (viaQr) return { token, kind: 'qr' };
  // Full invite URL without via=qr → link; bare UUID (typed) → treat as qr/paste.
  if (/invite\//i.test(cleaned)) return { token, kind: 'link' };
  return { token, kind: 'qr' };
}

/**
 * Redeem an invite. Demo resolves against the in-memory table; live hits API.
 * OUTCOME site for friend_added (caller fires analytics after success).
 */
export async function redeemInvite(
  raw: string
): Promise<{ personId: string; method: InviteKind }> {
  const parsed = parseInviteInput(raw);
  if (!parsed) {
    throw new Error('Paste an invite code or link first.');
  }
  const { token, kind } = parsed;

  if (isDemoMode()) {
    ensureDemoSample();
    const row = demoInvites.get(token);
    if (!row) throw new Error('Invite not found');
    if (row.expiresAt != null && row.expiresAt < Date.now()) {
      throw new Error('QR expired');
    }
    if (row.ownerId === 'me') {
      throw new Error('Cannot redeem your own invite');
    }
    // One-shot QR tokens, matching live delete-on-redeem.
    if (row.kind === 'qr') demoInvites.delete(token);
    await markDemoJoinedViaInvite();
    await bumpDemoFriendCount();
    return { personId: row.ownerId, method: kind };
  }

  const res = await apiFetch<{ personId: string }>('/connections/redeem', {
    method: 'POST',
    body: JSON.stringify({ token, kind })
  });
  return { personId: res.personId, method: kind };
}
