// ============================================
// WHAT THIS FILE DOES (plain English):
// Easter-egg delights (emoji bombs, etc.): which ones are turned on, pending
// gift triggers waiting for you, sending a gift, and marking one played after
// it animates. Demo returns a quiet empty set so Home stays calm unless you
// seed a trigger locally for QA.
// ============================================
import type { DelightEntry, DelightTrigger } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';

/** Demo-only pending triggers (empty by default; QA can push into this). */
let demoTriggers: DelightTrigger[] = [];

/** Enabled delight plugins the app should be ready to mount. */
export async function listActive(): Promise<DelightEntry[]> {
  if (isDemoMode()) {
    // Demo ships emoji-bomb as always-on so the host can mount it for gifts.
    return [
      {
        id: 'delight-emoji-bomb',
        slug: 'emoji-bomb',
        name: 'Emoji bomb',
        enabled: true,
        scope: 'gift'
      }
    ];
  }
  return apiFetch('/delights/active');
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
    // In demo we do not auto-queue for the sender; QA can inject into demoTriggers.
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

/** QA helper: queue a demo gift so DelightHost can show it. */
export function __demoQueueTrigger(trigger: DelightTrigger): void {
  demoTriggers = [...demoTriggers, trigger];
}
