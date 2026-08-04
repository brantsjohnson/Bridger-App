// ============================================
// WHAT THIS FILE DOES (plain English):
// Touch Grass signals: list who's free, send your own signal, join someone
// else's. Demo mode mutates a local list so Home and Events stay in sync for
// the session. Live mode will hit the touchgrass API module.
// ============================================
import type { GrassSignal } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
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

export async function listSignals(): Promise<GrassSignal[]> {
  if (isDemoMode()) {
    return cloneSignals();
  }
  // TODO: GET /touchgrass
  return [];
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
      postedAt: 'just now'
    };
    demoSignals = [mine, ...demoSignals];
    return;
  }
  // TODO: POST /touchgrass
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
  // TODO: POST /touchgrass/:id/join
}

export async function dismissSignal(id: string): Promise<void> {
  if (isDemoMode()) {
    demoSignals = demoSignals.filter((s) => s.id !== id);
    return;
  }
  // TODO: POST /touchgrass/:id/dismiss
}

export async function endMySignal(): Promise<void> {
  if (isDemoMode()) {
    demoMyLive = null;
    demoSignals = demoSignals.filter((s) => s.personId !== 'me');
    return;
  }
  // TODO: DELETE /touchgrass/me
}

export async function getMyLiveSignal(): Promise<{ when: string; inIds: string[] } | null> {
  if (isDemoMode()) {
    return demoMyLive ? { ...demoMyLive, inIds: [...demoMyLive.inIds] } : null;
  }
  // TODO: GET /touchgrass/me
  return null;
}
