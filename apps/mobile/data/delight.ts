// ============================================
// WHAT THIS FILE DOES (plain English):
// Easter-egg delights: which ones are on, pending gift triggers, sending a
// gift, marking one played, opt-in prefs, and demo QA helpers.
// ============================================
import type { DelightEntry, DelightTrigger } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';

/** Demo-only pending triggers (empty by default; QA can push into this). */
let demoTriggers: DelightTrigger[] = [];
/** Demo opt-in slugs. */
let demoOptIns: string[] = [];

type Listener = () => void;
const demoListeners = new Set<Listener>();

function notifyDemoListeners() {
  for (const l of demoListeners) l();
}

/** DelightHost subscribes so demo QA queues play without a full remount. */
export function subscribeDelightDemo(listener: Listener): () => void {
  demoListeners.add(listener);
  return () => {
    demoListeners.delete(listener);
  };
}

/**
 * Parked: emoji-bomb is built but off on profiles. Flip to true to bring
 * the gift button and overlay back.
 */
export const EMOJI_BOMB_LIVE = false;

const DEMO_ACTIVE: DelightEntry[] = [
  {
    id: 'delight-emoji-bomb',
    slug: 'emoji-bomb',
    name: 'Emoji bomb',
    status: 'built',
    kind: 'standalone',
    notes: 'Parked. Gift: friend sends; rains emojis on next open.',
    enabled: false,
    scope: 'gift'
  }
];

/** Enabled live standalone plugins the host should be ready to mount. */
export async function listActive(): Promise<DelightEntry[]> {
  const rows = isDemoMode()
    ? DEMO_ACTIVE.map((d) => ({ ...d }))
    : await apiFetch<DelightEntry[]>('/delights/active');
  // THIS SECTION DOES: keep parked gifts out of send UI and the overlay host.
  return rows.filter(
    (d) =>
      d.enabled &&
      d.status === 'live' &&
      (d.slug !== 'emoji-bomb' || EMOJI_BOMB_LIVE)
  );
}

/** Gift triggers waiting to play for the signed-in user. */
export async function listTriggers(): Promise<DelightTrigger[]> {
  if (isDemoMode()) {
    return demoTriggers.filter((t) => !t.played).map((t) => ({ ...t }));
  }
  return apiFetch('/delights/triggers');
}

/** Send a gift delight to a friend. */
export async function sendTrigger(input: {
  delightId: string;
  toUserId: string;
}): Promise<DelightTrigger> {
  if (isDemoMode()) {
    const created: DelightTrigger = {
      id: `dt-${Date.now()}`,
      delightId: input.delightId,
      delightSlug: 'emoji-bomb',
      fromUserId: 'me',
      toUserId: input.toUserId,
      played: false,
      fromName: 'You'
    };
    return created;
  }
  return apiFetch('/delights/triggers', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

/** Mark a gift as played so it does not loop on the next open. */
export async function markPlayed(triggerId: string): Promise<void> {
  if (isDemoMode()) {
    demoTriggers = demoTriggers.map((t) =>
      t.id === triggerId ? { ...t, played: true } : t
    );
    return;
  }
  await apiFetch(`/delights/triggers/${encodeURIComponent(triggerId)}/played`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

/** Opt-in plugin slugs for the current user. */
export async function fetchDelightOptIns(): Promise<string[]> {
  if (isDemoMode()) {
    return [...demoOptIns];
  }
  const settings = await apiFetch<{ delightOptIns?: string[] }>('/profiles/me/settings');
  return Array.isArray(settings.delightOptIns) ? settings.delightOptIns : [];
}

/** Replace opt-in plugin slugs. */
export async function setDelightOptIns(slugs: string[]): Promise<void> {
  if (isDemoMode()) {
    demoOptIns = [...slugs];
    notifyDemoListeners();
    return;
  }
  await apiFetch('/profiles/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ delightOptIns: slugs })
  });
}

/** QA helper: queue a demo gift so DelightHost can show it. */
export function __demoQueueTrigger(trigger: DelightTrigger): void {
  demoTriggers = [...demoTriggers, trigger];
  notifyDemoListeners();
}

/** Resolve the emoji-bomb delight id for send UI (demo or live). */
export async function resolveEmojiBombId(): Promise<string | null> {
  const active = await listActive();
  return active.find((d) => d.slug === 'emoji-bomb')?.id ?? null;
}
