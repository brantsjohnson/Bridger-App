// ============================================
// WHAT THIS FILE DOES (plain English):
// An in-memory phone book of people you are connected to. Some screens call
// personById / getMe synchronously while rendering, so we cannot fetch on every
// lookup. This cache is filled once (and after any add / accept / re-tier /
// remove / block), then the sync helpers in people.ts read from it.
//
// Fields the database does not store (emoji, accent, handle, label) are made
// up deterministically from the person's id so cards never crash.
// Signed photo links keep the URL we already drew when only the token changed,
// so faces do not look like they are loading again on every tab tap.
// ============================================
import type { Accent, Person, Tier } from '@bridger/shared';
import { apiFetch } from './api';
import { keepLoadedMediaUrl } from './media-url';

/** Shape returned by GET /connections. */
type ConnDto = {
  id: string;
  name: string;
  avatarUrl: string | null;
  tier: Tier;
  mutuals: number;
};

/** Shape returned by GET /me (we only need the display name + photo). */
type MeDto = {
  name?: string | null;
  avatarUrl?: string | null;
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
let loadedAt = 0;
let loadPromise: Promise<void> | null = null;

/** How long we treat the people book as "already fresh" (2 minutes). */
const PEOPLE_FRESH_MS = 2 * 60 * 1000;

/** Screens that show your face subscribe so they re-render when the cache fills. */
const listeners = new Set<() => void>();

function notifyPeopleListeners() {
  for (const cb of listeners) cb();
}

/** Call from a screen to re-render when loadPeople finishes (header photo, etc.). */
export function subscribePeople(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

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
    mutuals: d.mutuals,
    // Live photo URL from the API (signed). Avatar prefers this over emoji.
    avatarUrl: d.avatarUrl
  };
}

/**
 * Pull the roster + my name from the API into the cache.
 * Safe to call often — concurrent callers share one in-flight request unless
 * `force` is set (after add friend / retier) so we do not reuse a stale fetch
 * that started before the connection existed.
 */
export async function loadPeople(opts?: { force?: boolean }): Promise<void> {
  if (opts?.force) {
    // Drop any in-flight roster started before this connection existed.
    const prev = loadPromise;
    loadPromise = null;
    if (prev) {
      try {
        await prev;
      } catch {
        // ignore; we refetch below
      }
    }
  } else if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      // THIS SECTION DOES: load your face + name even if the friends list fails.
      let me: MeDto | null = null;
      try {
        me = await apiFetch<MeDto>('/me');
      } catch {
        me = null;
      }

      // THIS SECTION DOES: load the friends book (empty is fine for a new account).
      let conns: ConnDto[] = [];
      try {
        conns = (await apiFetch<ConnDto[]>('/connections')) ?? [];
      } catch {
        conns = [];
      }

      // Keep the face URL we already drew when only the signed token changed.
      const nextPeople = new Map<string, Person>();
      for (const c of conns) {
        const row = toPerson(c);
        const prev = cache.get(c.id);
        row.avatarUrl = keepLoadedMediaUrl(prev?.avatarUrl, row.avatarUrl);
        nextPeople.set(c.id, row);
      }
      cache.clear();
      for (const [id, row] of nextPeople) {
        cache.set(id, row);
      }
      meCache = {
        id: 'me',
        name: me?.name || 'You',
        handle: '',
        emoji: '🙂',
        accent: 'purple',
        tier: 'close',
        label: '',
        mutuals: 0,
        avatarUrl: keepLoadedMediaUrl(meCache?.avatarUrl, me?.avatarUrl ?? null)
      };
      loaded = true;
      loadedAt = Date.now();
      notifyPeopleListeners();
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

/** True when we already filled the book recently (skip a Home-focus refetch). */
export function isPeopleFresh(maxAgeMs = PEOPLE_FRESH_MS): boolean {
  return loaded && Date.now() - loadedAt < maxAgeMs;
}

/** PRIVACY: forget the in-memory people book (sign-out / leave demo). */
export function clearPeopleCache(): void {
  cache.clear();
  meCache = null;
  loaded = false;
  loadedAt = 0;
  loadPromise = null;
}
