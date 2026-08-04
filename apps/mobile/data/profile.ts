// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything your own Profile tab needs: the card fields (about, hobbies,
// favs, places, this-or-that), the weekly Currently check-in, your bucket
// list, story-calendar archive, storage state, and blocked people. Demo mode
// keeps state in memory so ModuleFlow answers stick for the session; live
// mode will call profiles / attributes APIs.
//
// PRIVACY: every written field carries its own visibleToTier. Friend profiles
// read through getPersonProfile and the card filters by the viewer's tier.
// ============================================
import type { Accent, BucketItem, Person, Tier } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { PEOPLE } from './fixtures/catalog';
import {
  ABOUT_ME_FIELDS,
  BLOCKED_IDS,
  BUCKET_LIST as FIXTURE_BUCKET,
  FAVS,
  HOBBY_FOLLOW_UPS as FIXTURE_FOLLOW_UPS,
  INTERESTS,
  ME_PROFILE,
  PROFILE_CURRENTLY,
  STORY_CALENDAR,
  THIS_OR_THAT,
  TRAVEL_PLACES,
  type AboutField,
  type FavGroup,
  type Interest,
  type ThisOrThatRow,
  type TravelPlace
} from './fixtures/profile';
import {
  ALL_HOBBIES,
  FAV_GROUP_DISPLAY,
  FAV_ITEMS,
  HOBBY_EMOJI,
  HOBBY_FOLLOWUP_QUESTIONS,
  PERSONAL_QUESTIONS,
  THIS_OR_THAT_PROMPTS,
  hobbyAccent,
  hobbyId,
  type FavItem
} from './fixtures/profile-questions';
import { FRIEND_PROFILES, type FriendProfile } from './fixtures/friend-profiles';

export type {
  AboutField,
  FavGroup,
  Interest,
  ThisOrThatRow,
  TravelPlace
};

export type Currently = {
  listening: { title: string; artist: string; emoji: string };
  reading: { title: string; author: string; emoji: string };
  /** false once the week rolls over — the card asks for a fresh check-in */
  checkedIn: boolean;
};

export type MyProfileHeader = {
  city: string;
  bio: string;
  /** what they have on repeat right now */
  song: { title: string; artist: string };
  /** what they're reading right now — same idea as the song, for books */
  book?: { title: string; author: string };
};

export type StorageState = {
  usedPct: number;
  plan: 'free' | 'coop';
};

export type HobbyFollowUp = { question: string; answer: string };

// --- demo state (so edits + ModuleFlow answers stick for the session) ---
let demoHeader: MyProfileHeader = { ...ME_PROFILE, song: { ...ME_PROFILE.song } };
let demoCurrently: Currently = {
  listening: { ...PROFILE_CURRENTLY.listening },
  reading: { ...PROFILE_CURRENTLY.reading },
  checkedIn: true
};
let demoBucket: BucketItem[] = FIXTURE_BUCKET.map((b) => ({ ...b, withIds: [...b.withIds] }));
let demoBlockedIds: string[] = [...BLOCKED_IDS];
let demoAbout: AboutField[] = ABOUT_ME_FIELDS.map((f) => ({ ...f }));
let demoHobbies: Interest[] = INTERESTS.map((h) => ({ ...h }));
let demoHobbyFollowUps: Record<string, HobbyFollowUp> = Object.fromEntries(
  Object.entries(FIXTURE_FOLLOW_UPS).map(([k, v]) => [k, { ...v }])
);
let demoFavs: FavGroup[] = FAVS.map((g) => ({ ...g, items: [...g.items] }));
let demoThisOrThat: ThisOrThatRow[] = THIS_OR_THAT.map((t) => ({ ...t }));
let demoPlaces: TravelPlace[] = TRAVEL_PLACES.map((p) => ({ ...p }));
let demoCustomNotes: string | null = null;

/** Header bits: city, bio, profile song. */
export async function getMyProfileHeader(): Promise<MyProfileHeader> {
  if (isDemoMode()) return { ...demoHeader, song: { ...demoHeader.song } };
  // TODO: GET /me/profile
  return { city: '', bio: '', song: { title: '', artist: '' } };
}

export async function setMyProfileHeader(patch: Partial<MyProfileHeader>): Promise<MyProfileHeader> {
  if (isDemoMode()) {
    demoHeader = { ...demoHeader, ...patch };
    return getMyProfileHeader();
  }
  // TODO: PATCH /me/profile
  return getMyProfileHeader();
}

export async function getCurrently(): Promise<Currently> {
  if (isDemoMode()) {
    return {
      listening: { ...demoCurrently.listening },
      reading: { ...demoCurrently.reading },
      checkedIn: demoCurrently.checkedIn
    };
  }
  // TODO: GET /me/currently
  return demoCurrently;
}

export async function setCheckedIn(on: boolean): Promise<Currently> {
  if (isDemoMode()) {
    demoCurrently = { ...demoCurrently, checkedIn: on };
  }
  // TODO: POST /me/currently
  return getCurrently();
}

/** PRIVACY: every field carries its own visibleToTier. */
export async function listAboutFields(): Promise<AboutField[]> {
  if (isDemoMode()) {
    const rows = demoAbout.map((f) => ({ ...f }));
    // Surface custom notes as a regular About Me row when present.
    if (demoCustomNotes) {
      rows.push({
        id: 'about-notes',
        key: 'Notes',
        value: demoCustomNotes,
        tier: 'friend'
      });
    }
    return rows;
  }
  // TODO: GET /me/attributes?kind=about
  return [];
}

export async function listHobbies(): Promise<Interest[]> {
  if (isDemoMode()) return demoHobbies.map((h) => ({ ...h }));
  // TODO: GET /me/attributes?kind=hobby
  return [];
}

/** Follow-up Q&A keyed by hobby id — what the hobbies widget peeks at. */
export function getHobbyFollowUps(): Record<string, HobbyFollowUp> {
  if (isDemoMode()) {
    return Object.fromEntries(
      Object.entries(demoHobbyFollowUps).map(([k, v]) => [k, { ...v }])
    );
  }
  return {};
}

/** Back-compat export used by HobbiesWidget. */
export const HOBBY_FOLLOW_UPS = new Proxy({} as Record<string, HobbyFollowUp>, {
  get(_t, prop: string) {
    return getHobbyFollowUps()[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(getHobbyFollowUps());
  },
  getOwnPropertyDescriptor(_t, prop) {
    const v = getHobbyFollowUps()[prop as string];
    if (v == null) return undefined;
    return { configurable: true, enumerable: true, value: v };
  }
});

export async function listFavs(): Promise<FavGroup[]> {
  if (isDemoMode()) return demoFavs.map((g) => ({ ...g, items: [...g.items] }));
  // TODO: GET /me/attributes?kind=fav
  return [];
}

export async function listThisOrThat(): Promise<ThisOrThatRow[]> {
  if (isDemoMode()) return demoThisOrThat.map((t) => ({ ...t }));
  // TODO: GET /me/attributes?kind=thisOrThat
  return [];
}

export async function listTravelPlaces(): Promise<TravelPlace[]> {
  if (isDemoMode()) return demoPlaces.map((p) => ({ ...p }));
  // TODO: GET /me/attributes?kind=place
  return [];
}

// --- ModuleFlow writers (demo session + live TODOs) ---

/**
 * Save hobbies + their follow-up answers from the hobbies ModuleFlow.
 * answers['hobbies'] = selected hobby ids; answers['followup:id'] = text.
 * PRIVACY: each hobby inherits the visibility of its select step (or follow-up).
 */
export async function saveHobbies(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {}
): Promise<Interest[]> {
  const selected = (answers.hobbies as string[]) ?? [];
  const tier = visibility.hobbies ?? 'friend';

  const next: Interest[] = selected.map((id, i) => {
    const label =
      ALL_HOBBIES.find((h) => hobbyId(h) === id) ??
      id
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    return {
      id,
      label,
      emoji: HOBBY_EMOJI[id] ?? '✨',
      accent: hobbyAccent(i) as Accent,
      shape: i % 6,
      tier
    };
  });

  const followUps: Record<string, HobbyFollowUp> = {};
  for (const id of selected) {
    const answer = (answers[`followup:${id}`] as string) ?? '';
    followUps[id] = {
      question: HOBBY_FOLLOWUP_QUESTIONS[id] ?? `Tell me more about ${id}`,
      answer: answer.trim() || '—'
    };
  }

  if (isDemoMode()) {
    demoHobbies = next;
    demoHobbyFollowUps = { ...demoHobbyFollowUps, ...followUps };
    return listHobbies();
  }
  // TODO: POST /me/attributes (hobby rows + follow-ups)
  return next;
}

/**
 * Save fav answers. Each answered "Favorite {item}?" becomes a group item.
 * PRIVACY: per-item tier stored; card groups by category for display.
 */
export async function saveFavs(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {}
): Promise<FavGroup[]> {
  const byGroup = new Map<FavItem['group'], string[]>();
  for (const item of FAV_ITEMS) {
    const raw = answers[item.id];
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const list = byGroup.get(item.group) ?? [];
    list.push(raw.trim());
    byGroup.set(item.group, list);
    void visibility; // reserved for per-item tier once the card shows it
  }

  const next: FavGroup[] = [];
  for (const [group, items] of byGroup) {
    const display = FAV_GROUP_DISPLAY[group];
    next.push({
      group: display.label,
      emoji: display.emoji,
      items,
      total: items.length
    });
  }

  if (isDemoMode()) {
    // Merge into existing groups so re-running the module replaces those groups.
    const replaced = new Set(next.map((g) => g.group));
    demoFavs = [...demoFavs.filter((g) => !replaced.has(g.group)), ...next];
    return listFavs();
  }
  // TODO: POST /me/attributes?kind=fav
  return next;
}

/**
 * Save this-or-that picks. "Both" is a first-class answer.
 */
export async function saveThisOrThat(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {}
): Promise<ThisOrThatRow[]> {
  const next: ThisOrThatRow[] = [];
  for (const prompt of THIS_OR_THAT_PROMPTS) {
    const raw = answers[prompt.id];
    if (typeof raw !== 'string' || !raw) continue;
    const pick: 'a' | 'b' | 'both' =
      raw === 'Both' ? 'both' : raw === prompt.b ? 'b' : 'a';
    next.push({
      id: prompt.id,
      a: prompt.a,
      b: prompt.b,
      pick,
      emoji: prompt.emoji,
      tier: visibility[prompt.id] ?? 'acquaintance'
    });
  }

  if (isDemoMode()) {
    demoThisOrThat = next.length > 0 ? next : demoThisOrThat;
    return listThisOrThat();
  }
  // TODO: POST /me/attributes?kind=thisOrThat
  return next;
}

/**
 * Save a simple place add (where / note / next). Richer place editor is next.
 * TODO: replace with tags + per-place visibility + co-op photos.
 */
export async function savePlaces(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {}
): Promise<TravelPlace[]> {
  const where = typeof answers['place-where'] === 'string' ? answers['place-where'].trim() : '';
  const note = typeof answers['place-note'] === 'string' ? answers['place-note'].trim() : '';
  if (!where) {
    return listTravelPlaces();
  }

  const place: TravelPlace = {
    id: `pl-${Date.now()}`,
    label: where,
    note: note || 'Visited',
    x: 20 + Math.round(Math.random() * 60),
    y: 20 + Math.round(Math.random() * 50),
    emoji: '✈️',
    year: String(new Date().getFullYear()),
    tier: visibility['place-where'] ?? 'friend'
  };

  if (isDemoMode()) {
    demoPlaces = [place, ...demoPlaces];
    return listTravelPlaces();
  }
  // TODO: POST /me/attributes?kind=place
  return [place];
}

/**
 * Save About Me personal questions into AboutField rows.
 * PRIVACY: uses the per-question visibility from the review step, falling
 * back to each question's defaultTier from the bank.
 */
export async function saveAboutFields(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {}
): Promise<AboutField[]> {
  const byId = new Map(demoAbout.map((f) => [f.id, f]));

  for (const q of PERSONAL_QUESTIONS) {
    const raw = answers[q.id];
    if (typeof raw !== 'string' || !raw.trim()) continue;
    byId.set(q.id, {
      id: q.id,
      key: q.key,
      value: raw.trim(),
      tier: visibility[q.id] ?? q.defaultTier
    });
  }

  const next = Array.from(byId.values());
  if (isDemoMode()) {
    demoAbout = next;
    return listAboutFields();
  }
  // TODO: POST /me/attributes?kind=about
  return next;
}

/** Save the free-text Custom Notes module. */
export async function saveCustomNotes(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {}
): Promise<void> {
  const raw = answers['notes-free'];
  if (typeof raw !== 'string' || !raw.trim()) return;
  if (isDemoMode()) {
    demoCustomNotes = raw.trim();
    // Also stash the chosen tier on a synthetic about row next read.
    void visibility;
    return;
  }
  // TODO: POST /me/attributes?kind=notes
}

// --- Friend profiles ---

/**
 * Load another person's card data. Demo mode serves fixtures; live mode will
 * fetch attributes filtered by the caller's tier on the server (RLS).
 */
export async function getPersonProfile(personId: string): Promise<FriendProfile | null> {
  if (isDemoMode()) {
    return FRIEND_PROFILES[personId] ?? null;
  }
  // TODO: GET /people/:id/profile
  return null;
}

// --- Bucket list ---

export async function listBucket(): Promise<BucketItem[]> {
  if (isDemoMode()) return demoBucket.map((b) => ({ ...b, withIds: [...b.withIds] }));
  // TODO: GET /me/bucket
  return [];
}

/**
 * Someone else's bucket list, for their profile page.
 * PRIVACY: private lines belong to the owner only, so they are filtered out
 * here as well as in the UI. Demo mode reuses the seeded list so a friend's
 * profile has something to show; live mode will fetch that person's items.
 */
export async function listPersonBucket(_personId: string): Promise<BucketItem[]> {
  if (isDemoMode()) {
    return demoBucket
      .filter((b) => !b.isPrivate)
      .map((b) => ({ ...b, withIds: [...b.withIds] }));
  }
  // TODO: GET /people/:id/bucket
  return [];
}

export type AddBucketInput = {
  text: string;
  withIds: string[];
  isPrivate: boolean;
};

export async function addBucketItem(input: AddBucketInput): Promise<BucketItem> {
  const item: BucketItem = {
    id: `b-${Date.now()}`,
    text: input.text.trim(),
    withIds: input.withIds,
    done: false,
    isPrivate: input.isPrivate
  };
  if (isDemoMode()) {
    demoBucket = [item, ...demoBucket];
    return { ...item };
  }
  // TODO: POST /me/bucket
  return item;
}

export async function toggleBucketItem(id: string): Promise<void> {
  if (isDemoMode()) {
    demoBucket = demoBucket.map((b) => (b.id === id ? { ...b, done: !b.done } : b));
    return;
  }
  // TODO: PATCH /me/bucket/:id
}

// --- Story archive ---

/** Day of month -> story thumbnail emoji, for the calendar. */
export async function listStoryDays(_month?: string): Promise<Record<number, string>> {
  if (isDemoMode()) return { ...STORY_CALENDAR };
  // TODO: GET /me/stories/archive?month=
  return {};
}

export async function getStorageState(): Promise<StorageState> {
  if (isDemoMode()) return { usedPct: 100, plan: 'free' };
  // TODO: GET /me/storage
  return { usedPct: 0, plan: 'free' };
}

// --- Blocked people (Settings → Blocked) ---

export async function listBlocked(): Promise<Person[]> {
  if (isDemoMode()) {
    return PEOPLE.filter((p) => demoBlockedIds.includes(p.id)).map((p) => ({ ...p }));
  }
  // TODO: GET /me/blocked
  return [];
}

/** Silent + reversible. Unblocking never auto-reconnects. */
export async function unblock(personId: string): Promise<void> {
  if (isDemoMode()) {
    demoBlockedIds = demoBlockedIds.filter((id) => id !== personId);
    return;
  }
  // TODO: DELETE /me/blocked/:id
}

/** Which tiers can see a field, ranked so filtering is one comparison. */
export const TIER_RANK: Record<Tier, number> = {
  none: 0,
  acquaintance: 1,
  friend: 2,
  close: 3
};
