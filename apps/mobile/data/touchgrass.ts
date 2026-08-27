// ============================================
// WHAT THIS FILE DOES (plain English):
// Touch Grass signals: list who's free, send your own signal, join someone
// else's. Demo mode mutates a local list so Home and Events stay in sync for
// the session. Live mode calls the Nest /touchgrass API.
// ============================================
import type { GrassSignal, GrassWhen } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
import { FREE_SIGNALS as FIXTURE_SIGNALS } from './fixtures/catalog';

let demoSignals: GrassSignal[] = FIXTURE_SIGNALS.map((s) => ({
  ...s,
  inIds: s.inIds ? [...s.inIds] : []
}));

/** Your own live signal after you tap Send (demo only for now). */
let demoMyLive: { when: string; inIds: string[] } | null = null;

function cloneSignals(): GrassSignal[] {
  return demoSignals.map((s) => ({ ...s, inIds: s.inIds ? [...s.inIds] : [] }));
}

/** Turn the sheet's "who" label into the audience the API expects. */
function whoToAudience(who: string): string {
  const key = who.toLowerCase();
  if (key.startsWith('close')) return 'close';
  if (key.startsWith('friend')) return 'friends';
  // Unknown labels fall back to Friends, never Everyone.
  return 'friends';
}

/** Turn the sheet's "when" label into the API window value. */
function whenToWindow(when: string): GrassWhen {
  const key = when.toLowerCase();
  if (key.includes('tonight')) return 'tonight';
  if (key.includes('weekend')) return 'weekend';
  return 'now';
}

export async function listSignals(): Promise<GrassSignal[]> {
  if (isDemoMode()) {
    return cloneSignals();
  }
  return apiFetch<GrassSignal[]>('/touchgrass');
}

export type SendSignalInput = {
  who: string;
  when: string;
  note?: string;
};

/** Broadcast that you're free. Demo flips the Events "live" strip. */
export async function sendSignal(input: SendSignalInput): Promise<void> {
  if (isDemoMode()) {
    demoMyLive = { when: input.when, inIds: [] };
    const mine: GrassSignal = {
      id: `fs-me-${Date.now()}`,
      personId: 'me',
      when: input.when,
      note: input.note || 'free',
      what: input.note,
      audience: input.who,
      inIds: [],
      postedAt: 'just now',
      mine: true
    };
    demoSignals = [mine, ...demoSignals];
    return;
  }
  await apiFetch('/touchgrass', {
    method: 'POST',
    body: JSON.stringify({
      who: whoToAudience(input.who),
      when: whenToWindow(input.when),
      note: input.note
    })
  });
}

export async function joinSignal(id: string): Promise<void> {
  if (isDemoMode()) {
    demoSignals = demoSignals.map((s) => {
      if (s.id !== id) return s;
      const inIds = s.inIds ?? [];
      if (inIds.includes('me')) return s;
      return { ...s, inIds: [...inIds, 'me'] };
    });
    return;
  }
  await apiFetch(`/touchgrass/${encodeURIComponent(id)}/join`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function dismissSignal(id: string): Promise<void> {
  if (isDemoMode()) {
    demoSignals = demoSignals.filter((s) => s.id !== id);
    return;
  }
  await apiFetch(`/touchgrass/${encodeURIComponent(id)}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function endMySignal(): Promise<void> {
  if (isDemoMode()) {
    demoMyLive = null;
    demoSignals = demoSignals.filter((s) => s.personId !== 'me');
    return;
  }
  await apiFetch('/touchgrass/me', { method: 'DELETE' });
}

export async function getMyLiveSignal(): Promise<{ when: string; inIds: string[] } | null> {
  if (isDemoMode()) {
    return demoMyLive ? { ...demoMyLive, inIds: [...demoMyLive.inIds] } : null;
  }
  const mine = await apiFetch<GrassSignal | null>('/touchgrass/me');
  if (!mine) return null;
  return { when: mine.when, inIds: mine.inIds ?? [] };
}
