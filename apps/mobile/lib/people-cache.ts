// ============================================
// WHAT THIS FILE DOES (plain English):
// An in-memory phone book of people you are connected to. Some screens call
// personById / getMe synchronously while rendering, so we cannot fetch on every
// lookup. This cache is filled once (and after any add / accept / re-tier /
// remove / block), then the sync helpers in people.ts read from it.
//
// Fields the database does not store (emoji, accent, handle, label) are made
// up deterministically from the person's id so cards never crash.
// ============================================
import type { Accent, Person, Tier } from '@bridger/shared';
import { apiFetch } from './api';

/** Shape returned by GET /connections. */
type ConnDto = {
  id: string;
  name: string;
  avatarUrl: string | null;
  tier: Tier;
  mutuals: number;
};

/** Shape returned by GET /me (we only need the display name). */
type MeDto = {
  name?: string | null;
};

const ACCENTS: Accent[] = [
  'purple',
  'coral',
  'teal',
  'amber',
  'pink',
  'blue',
  'green'
];

const cache = new Map<string, Person>();
let meCache: Person | null = null;
let loaded = false;
let loadPromise: Promise<void> | null = null;

/** Stable hash so the same id always gets the same accent. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function accentFor(id: string): Accent {
  return ACCENTS[hash(id) % ACCENTS.length];
}

function toPerson(d: ConnDto): Person {
  return {
    id: d.id,
    name: d.name || 'Friend',
    handle: '',
    emoji: '🙂',
    accent: accentFor(d.id),
    tier: d.tier,
    label: '',
    mutuals: d.mutuals
  };
}

/**
 * Pull the roster + my name from the API into the cache.
 * Safe to call often — concurrent callers share one in-flight request.
 */
export async function loadPeople(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const [conns, me] = await Promise.all([
        apiFetch<ConnDto[]>('/connections'),
        apiFetch<MeDto>('/me')
      ]);
      cache.clear();
      for (const c of conns ?? []) {
        cache.set(c.id, toPerson(c));
      }
      meCache = {
        id: 'me',
        name: me?.name || 'You',
        handle: '',
        emoji: '🙂',
        accent: 'purple',
        tier: 'close',
        label: '',
        mutuals: 0
      };
      loaded = true;
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
}

export function getCachedPerson(id: string): Person | undefined {
  if (id === 'me') return meCache ?? undefined;
  return cache.get(id);
}

export function getCachedPeople(): Person[] {
  return [...cache.values()];
}

export function getCachedMe(): Person | null {
  return meCache;
}

export function isPeopleLoaded(): boolean {
  return loaded;
}
