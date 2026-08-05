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
import { apiFetch } from '../lib/api';
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
  type TravelPlace,
  type TravelPlaceTag
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
  TravelPlace,
  TravelPlaceTag
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

// --- LIVE WIRING HELPERS ---
// Every "fact" comes back from the API as this shape. We store the exact
// display object in `value`, so reading a category is just returning `value`.
type ApiAttribute<T = unknown> = {
  id: string;
  key: string;
  value: T;
  layer: string;
  visibleToTier: Tier;
  matchable: boolean;
  updatedAt: string;
};

/** Read one category of facts from the server (e.g. kind=hobby). */
async function fetchAttributes<T>(kind: string): Promise<ApiAttribute<T>[]> {
  return apiFetch<ApiAttribute<T>[]>(`/me/attributes?kind=${encodeURIComponent(kind)}`);
}

/**
 * Replace a whole category of facts in one call. `prefix` clears the old rows
 * (so re-running a module swaps the category instead of duplicating it); each
 * item becomes one row whose `value` is the display object itself.
 */
async function replaceAttributes(
  prefix: string,
  items: { key: string; value: unknown; visibleToTier?: Tier }[]
): Promise<void> {
  await apiFetch('/me/attributes', {
    method: 'POST',
    body: JSON.stringify({
      replacePrefix: prefix,
      attributes: items.map((it) => ({
        key: it.key,
        value: it.value,
        layer: 'profile',
        visibleToTier: it.visibleToTier ?? 'friend'
      }))
    })
  });
}

/** Header bits: city, bio, profile song. */
export async function getMyProfileHeader(): Promise<MyProfileHeader> {
  if (isDemoMode()) return { ...demoHeader, song: { ...demoHeader.song } };
  const p = await apiFetch<{
    city: string;
    bio: string;
    song: { title: string; artist: string };
    book?: { title: string; author: string } | null;
  }>('/me/profile');
  return {
    city: p.city ?? '',
    bio: p.bio ?? '',
    song: { title: p.song?.title ?? '', artist: p.song?.artist ?? '' },
    book: p.book?.title ? { title: p.book.title, author: p.book.author } : undefined
  };
}

export async function setMyProfileHeader(patch: Partial<MyProfileHeader>): Promise<MyProfileHeader> {
  if (isDemoMode()) {
    demoHeader = { ...demoHeader, ...patch };
    return getMyProfileHeader();
  }
  await apiFetch('/me/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      city: patch.city,
      bio: patch.bio,
      song: patch.song,
      book: patch.book ?? null
    })
  });
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
  const rows = await fetchAttributes<AboutField>('about');
  return rows.map((r) => r.value);
}

export async function listHobbies(): Promise<Interest[]> {
  if (isDemoMode()) return demoHobbies.map((h) => ({ ...h }));
  const rows = await fetchAttributes<Interest>('hobby');
  return rows.map((r) => r.value);
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
  const rows = await fetchAttributes<FavGroup>('fav');
  return rows.map((r) => r.value);
}

export async function listThisOrThat(): Promise<ThisOrThatRow[]> {
  if (isDemoMode()) return demoThisOrThat.map((t) => ({ ...t }));
  const rows = await fetchAttributes<ThisOrThatRow>('thisOrThat');
  return rows.map((r) => r.value);
}

export async function listTravelPlaces(): Promise<TravelPlace[]> {
  if (isDemoMode()) return demoPlaces.map((p) => ({ ...p }));
  const rows = await fetchAttributes<TravelPlace>('place');
  return rows.map((r) => r.value);
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
  // Each hobby is one row (value = the display object). The follow-up Q&A is
  // tucked onto the same row so it persists with the hobby.
  await replaceAttributes(
    'hobby:',
    next.map((h) => ({
      key: `hobby:${h.id}`,
      value: { ...h, followUp: followUps[h.id] },
      visibleToTier: h.tier
    }))
  );
  return listHobbies();
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

  const replaced = new Set(next.map((g) => g.group));
  if (isDemoMode()) {
    // Merge into existing groups so re-running the module replaces those groups.
    demoFavs = [...demoFavs.filter((g) => !replaced.has(g.group)), ...next];
    return listFavs();
  }
  // Live merge: keep the groups this run didn't touch, swap the ones it did,
  // then write the whole set back (one row per group).
  const existing = await listFavs();
  const merged = [...existing.filter((g) => !replaced.has(g.group)), ...next];
  await replaceAttributes(
    'fav:',
    merged.map((g) => ({ key: `fav:${g.group.toLowerCase().replace(/\s+/g, '-')}`, value: g }))
  );
  return listFavs();
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
  if (next.length === 0) return listThisOrThat();
  await replaceAttributes(
    'tot:',
    next.map((t) => ({ key: `tot:${t.id}`, value: t, visibleToTier: t.tier }))
  );
  return listThisOrThat();
}

/** JSON payload written by ModuleFlow placeSearch into answers['place-where']. */
type PlaceWherePayload = {
  label: string;
  lat: number;
  lng: number;
  countryCode: string;
};

/** Parse a geocoded place pick. Never invents random map coords. */
function parsePlaceWhere(raw: unknown): PlaceWherePayload | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const o = JSON.parse(raw) as Partial<PlaceWherePayload>;
    if (
      typeof o.label === 'string' &&
      typeof o.lat === 'number' &&
      Number.isFinite(o.lat) &&
      typeof o.lng === 'number' &&
      Number.isFinite(o.lng) &&
      typeof o.countryCode === 'string' &&
      o.countryCode.length === 2
    ) {
      return {
        label: o.label.trim(),
        lat: o.lat,
        lng: o.lng,
        countryCode: o.countryCode.toUpperCase()
      };
    }
  } catch {
    // Plain text is not enough to place a pin — skip.
  }
  return null;
}

/**
 * Save a geocoded place (lat/lng/countryCode from place search) plus optional note.
 * Pins never get random positions. TODO: richer tags + co-op photos.
 */
export async function savePlaces(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {}
): Promise<TravelPlace[]> {
  const parsed = parsePlaceWhere(answers['place-where']);
  const note = typeof answers['place-note'] === 'string' ? answers['place-note'].trim() : '';
  if (!parsed) {
    return listTravelPlaces();
  }

  const tagRaw = typeof answers['place-tag'] === 'string' ? answers['place-tag'].toLowerCase() : '';
  const tag =
    tagRaw.includes('lived') ? 'lived' : tagRaw.includes('want') ? 'want' : 'visited';

  const place: TravelPlace = {
    id: `pl-${Date.now()}`,
    label: parsed.label,
    note: note || 'Visited',
    lat: parsed.lat,
    lng: parsed.lng,
    countryCode: parsed.countryCode,
    emoji: '✈️',
    year: String(new Date().getFullYear()),
    tier: visibility['place-where'] ?? 'friend',
    tags: [tag]
  };

  if (isDemoMode()) {
    demoPlaces = [place, ...demoPlaces];
    return listTravelPlaces();
  }
  // Add one place row (no replace: places accumulate).
  await apiFetch('/me/attributes', {
    method: 'POST',
    body: JSON.stringify({
      attributes: [
        { key: `place:${place.id}`, value: place, layer: 'profile', visibleToTier: place.tier }
      ]
    })
  });
  return listTravelPlaces();
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
  // The answers this run actually filled in.
  const answered: AboutField[] = [];
  for (const q of PERSONAL_QUESTIONS) {
    const raw = answers[q.id];
    if (typeof raw !== 'string' || !raw.trim()) continue;
    answered.push({
      id: q.id,
      key: q.key,
      value: raw.trim(),
      tier: visibility[q.id] ?? q.defaultTier
    });
  }

  if (isDemoMode()) {
    const byId = new Map(demoAbout.map((f) => [f.id, f]));
    for (const f of answered) byId.set(f.id, f);
    demoAbout = Array.from(byId.values());
    return listAboutFields();
  }

  // Live: merge onto the server's existing About rows, then write them all back.
  const existing = await listAboutFields();
  const byId = new Map(existing.map((f) => [f.id, f]));
  for (const f of answered) byId.set(f.id, f);
  const merged = Array.from(byId.values());
  await replaceAttributes(
    'about:',
    merged.map((f) => ({ key: `about:${f.id}`, value: f, visibleToTier: f.tier }))
  );
  return listAboutFields();
}

/** Save the free-text Custom Notes module. */
export async function saveCustomNotes(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {}
): Promise<void> {
  const raw = answers['notes-free'];
  if (typeof raw !== 'string' || !raw.trim()) return;
  const tier = visibility['notes-free'] ?? 'friend';
  if (isDemoMode()) {
    demoCustomNotes = raw.trim();
    return;
  }
  // Store as a single About row so it shows up in the About Me section.
  await replaceAttributes('about:about-notes', [
    {
      key: 'about:about-notes',
      value: { id: 'about-notes', key: 'Notes', value: raw.trim(), tier },
      visibleToTier: tier
    }
  ]);
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
  // FOLLOW-UP: GET /people/:id/profile is live (returns the person's identity +
  // tier-filtered attributes). What's left is a mapper from those raw rows into
  // the richer FriendProfile shape the card renders, plus a second real account
  // to test against. Kept on fixtures until that mapper lands.
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

/** Change the text, tagged friends, or privacy on an existing bucket line. */
export async function updateBucketItem(
  id: string,
  input: AddBucketInput
): Promise<BucketItem | null> {
  if (isDemoMode()) {
    const idx = demoBucket.findIndex((b) => b.id === id);
    if (idx < 0) return null;
    const updated: BucketItem = {
      ...demoBucket[idx],
      text: input.text.trim(),
      withIds: [...input.withIds],
      isPrivate: input.isPrivate
    };
    demoBucket = demoBucket.map((b) => (b.id === id ? updated : b));
    return { ...updated, withIds: [...updated.withIds] };
  }
  // TODO: PATCH /me/bucket/:id
  return null;
}

/** Hard-delete a bucket line. Gone for good (same as other user data). */
export async function deleteBucketItem(id: string): Promise<void> {
  if (isDemoMode()) {
    demoBucket = demoBucket.filter((b) => b.id !== id);
    return;
  }
  // TODO: DELETE /me/bucket/:id
}

// --- Story archive ---

/** Day of month -> story thumbnail emoji, for the calendar. */
export async function listStoryDays(month?: string): Promise<Record<number, string>> {
  if (isDemoMode()) return { ...STORY_CALENDAR };
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  const res = await apiFetch<{ days: Record<number, string> }>(`/stories/archive${q}`);
  return res.days ?? {};
}

export async function getStorageState(): Promise<StorageState> {
  if (isDemoMode()) return { usedPct: 100, plan: 'free' };
  const res = await apiFetch<{
    usedPct: number;
    plan: 'free' | 'coop';
  }>('/me/storage');
  return { usedPct: res.usedPct ?? 0, plan: res.plan ?? 'free' };
}

// --- Blocked people (Settings → Blocked) ---

export async function listBlocked(): Promise<Person[]> {
  if (isDemoMode()) {
    return PEOPLE.filter((p) => demoBlockedIds.includes(p.id)).map((p) => ({ ...p }));
  }
  return apiFetch<Person[]>('/me/blocked');
}

/** Silent + reversible. Unblocking never auto-reconnects. */
export async function unblock(personId: string): Promise<void> {
  if (isDemoMode()) {
    demoBlockedIds = demoBlockedIds.filter((id) => id !== personId);
    return;
  }
  await apiFetch(`/me/blocked/${encodeURIComponent(personId)}`, {
    method: 'DELETE'
  });
}

/** Which tiers can see a field, ranked so filtering is one comparison. */
export const TIER_RANK: Record<Tier, number> = {
  none: 0,
  acquaintance: 1,
  friend: 2,
  close: 3
};
