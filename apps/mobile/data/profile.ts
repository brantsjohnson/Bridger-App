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
import type {
  Accent,
  BucketItem,
  FavoriteModule,
  ObsessionSquare,
  Person,
  PhotoBlock,
  Tier,
  Top5Item
} from '@bridger/shared';
import {
  DEFAULT_STORAGE_CONFIG,
  FREE_STORY_STORAGE_BYTES,
  buildStorageMeter,
  formatStorageBytes,
  includedBytesFromGb,
  overagePriceLabel,
  storageUsedPct,
  trackProduct
} from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMembership } from './coop';
import { PEOPLE } from './fixtures/catalog';
import {
  ABOUT_ME_FIELDS,
  BLOCKED_IDS,
  BUCKET_LIST as FIXTURE_BUCKET,
  CURRENT_OBSESSION,
  FAVS,
  HOBBY_FOLLOW_UPS as FIXTURE_FOLLOW_UPS,
  INTERESTS,
  ME_PROFILE,
  PROFILE_CURRENTLY,
  STORY_CALENDAR,
  THIS_OR_THAT,
  TOP_5,
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
  /** Signed URL for the profile photo (live). Demo uses fixtures instead. */
  avatarUrl?: string | null;
  /**
   * Which look is baked into avatarUrl (pop_art / comic / x_ray / sepia).
   * Null means the plain photo. Used by Edit to highlight the active pill.
   */
  avatarFilter?: 'pop_art' | 'comic' | 'x_ray' | 'sepia' | null;
  /**
   * Unfiltered source photo URL (signed live, or local demo URI). Edit re-bakes
   * from this when they switch looks.
   */
  avatarOriginalUrl?: string | null;
};

/**
 * Storage meter for Settings + Stories.
 * Co-op shows used vs included; free shows the rolling month bar.
 * overagePriceLabel is soft-stub copy (no real charge).
 */
export type StorageState = {
  usedPct: number;
  plan: 'free' | 'coop';
  usedBytes: number;
  includedBytes: number;
  overageBytes: number;
  label: string;
  overagePriceLabel: string | null;
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
let demoTop5: Top5Item[] = TOP_5.map((t) => ({
  id: t.id,
  text: t.text,
  emoji: t.emoji,
  order: t.order,
  visibleToTier: t.tier
}));
let demoObsession: ObsessionSquare[] = CURRENT_OBSESSION.map((o) => ({
  id: o.id,
  prompt: o.prompt,
  text: o.text,
  emoji: o.emoji,
  order: o.order,
  visibleToTier: o.tier
}));
/** One-time profile intro seen (demo session + device). */
let demoProfileIntroSeen = false;
/** AsyncStorage key so demo (and a live fallback) survive app reloads. */
const PROFILE_INTRO_SEEN_KEY = 'bridger.profile.intro_seen';
/** Co-op Greatest hits slots (≤3). Demo starts with one after About me. */
let demoGreatestHits: PhotoBlock[] = [
  {
    id: 'me-gh1',
    assetId: 'demo-me-1',
    order: 0,
    afterModule: 'aboutMe',
    visibleToTier: 'friend'
  }
];

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
  items: { key: string; value: unknown; visibleToTier?: Tier; matchable?: boolean }[]
): Promise<void> {
  await apiFetch('/me/attributes', {
    method: 'POST',
    body: JSON.stringify({
      replacePrefix: prefix,
      attributes: items.map((it) => ({
        key: it.key,
        value: it.value,
        layer: 'profile',
        visibleToTier: it.visibleToTier ?? 'friend',
        matchable: it.matchable ?? true
      }))
    })
  });
}

/** Header bits: city, bio, profile song, avatar + look. */
export async function getMyProfileHeader(): Promise<MyProfileHeader> {
  if (isDemoMode()) return { ...demoHeader, song: { ...demoHeader.song } };
  const p = await apiFetch<{
    city: string;
    bio: string;
    song: { title: string; artist: string };
    book?: { title: string; author: string } | null;
    avatarUrl?: string | null;
    avatarFilter?: 'pop_art' | 'comic' | 'x_ray' | 'sepia' | null;
    avatarOriginalUrl?: string | null;
  }>('/me/profile');
  return {
    city: p.city ?? '',
    bio: p.bio ?? '',
    song: { title: p.song?.title ?? '', artist: p.song?.artist ?? '' },
    book: p.book?.title ? { title: p.book.title, author: p.book.author } : undefined,
    avatarUrl: p.avatarUrl ?? null,
    avatarFilter: p.avatarFilter ?? null,
    avatarOriginalUrl: p.avatarOriginalUrl ?? null
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
  // Prefer the tier stored inside the value; fall back to the row's
  // visible_to_tier so old / partial writes still show on your own profile.
  return rows.map((r) => {
    const v = r.value ?? ({} as AboutField);
    return {
      ...v,
      id: v.id || String((r.value as { id?: string } | null)?.id ?? r.id),
      key: v.key || 'Detail',
      value: typeof v.value === 'string' ? v.value : String(v.value ?? ''),
      tier: v.tier ?? r.visibleToTier ?? 'friend'
    };
  });
}

/**
 * Save a new display order for About me fields (own profile Edit mode).
 * Demo keeps the order in memory; live rewrites the about: batch in order.
 */
export async function reorderAboutFields(ordered: AboutField[]): Promise<AboutField[]> {
  if (isDemoMode()) {
    // Keep custom notes out of the reorder list if it was appended for display.
    const note = demoCustomNotes;
    demoAbout = ordered
      .filter((f) => f.id !== 'about-notes')
      .map((f) => ({ ...f }));
    if (note) {
      // notes stay at the end unless they were in the ordered list intentionally
    }
    return listAboutFields();
  }
  await replaceAttributes(
    'about:',
    ordered.map((f, i) => ({
      key: `about:${f.id}`,
      value: { ...f, order: i },
      visibleToTier: f.tier
    }))
  );
  return listAboutFields();
}

/** In-memory follow-ups loaded with the last listHobbies() live fetch. */
let liveHobbyFollowUps: Record<string, HobbyFollowUp> = {};

export async function listHobbies(): Promise<Interest[]> {
  if (isDemoMode()) return demoHobbies.map((h) => ({ ...h }));
  const rows = await fetchAttributes<Interest & { followUp?: HobbyFollowUp }>('hobby');
  // Rebuild follow-up lookup from each hobby row (live saves tuck it on the value).
  const followUps: Record<string, HobbyFollowUp> = {};
  const hobbies: Interest[] = [];
  for (const r of rows) {
    const v = r.value;
    if (!v?.id) continue;
    if (v.followUp?.question) {
      followUps[v.id] = {
        question: v.followUp.question,
        answer: v.followUp.answer ?? ''
      };
    }
    const { followUp: _fu, ...interest } = v;
    hobbies.push({
      ...interest,
      tier: interest.tier ?? r.visibleToTier ?? 'friend'
    });
  }
  liveHobbyFollowUps = followUps;
  return hobbies;
}

/** Follow-up Q&A keyed by hobby id — what the hobbies widget peeks at. */
export function getHobbyFollowUps(): Record<string, HobbyFollowUp> {
  if (isDemoMode()) {
    return Object.fromEntries(
      Object.entries(demoHobbyFollowUps).map(([k, v]) => [k, { ...v }])
    );
  }
  // Live: filled when listHobbies runs (was always {} before, so Answers looked empty).
  return { ...liveHobbyFollowUps };
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

/** Top 5 ordered identity lines. */
export async function listTop5(): Promise<Top5Item[]> {
  if (isDemoMode()) return demoTop5.map((t) => ({ ...t }));
  const rows = await fetchAttributes<Top5Item>('top5');
  return rows.map((r) => r.value).sort((a, b) => a.order - b.order);
}

/** Attach Listening catalog fields onto obsession squares when we have a pick. */
async function withListeningMusic(squares: ObsessionSquare[]): Promise<ObsessionSquare[]> {
  try {
    const { fetchListeningNow } = await import('./music');
    const pick = await fetchListeningNow();
    if (!pick) return squares;
    const music = {
      pickId: pick.id,
      spotifyId: pick.spotifyId,
      spotifyUri: pick.spotifyUri,
      title: pick.title,
      artistName: pick.artistName,
      artworkUrl: pick.artworkUrl,
      previewUrl: pick.previewUrl
    };
    let found = false;
    const next = squares.map((o) => {
      if (!/^listening/i.test(String(o.prompt))) return o;
      found = true;
      return {
        ...o,
        text: o.text || `${pick.title} · ${pick.artistName}`,
        music
      };
    });
    if (found) return next;
    // No Listening square yet: prepend one from the pick.
    return [
      {
        id: `listening-${pick.id}`,
        prompt: 'Listening…',
        text: `${pick.title} · ${pick.artistName}`,
        emoji: '🎧',
        order: -1,
        visibleToTier: pick.visibleToTier,
        matchable: pick.matchable,
        music
      },
      ...next
    ];
  } catch {
    return squares;
  }
}

/** Current Obsession squares (who you are today). */
export async function listObsession(): Promise<ObsessionSquare[]> {
  if (isDemoMode()) {
    // Migrate legacy Currently song/book into Listening/Reading if empty.
    if (demoObsession.length === 0 && demoCurrently.checkedIn) {
      return withListeningMusic([
        {
          id: 'legacy-listening',
          prompt: 'Listening…',
          text: `${demoCurrently.listening.title} · ${demoCurrently.listening.artist}`,
          emoji: demoCurrently.listening.emoji,
          order: 0,
          visibleToTier: 'friend'
        },
        {
          id: 'legacy-reading',
          prompt: 'Reading…',
          text: `${demoCurrently.reading.title} · ${demoCurrently.reading.author}`,
          emoji: demoCurrently.reading.emoji,
          order: 1,
          visibleToTier: 'friend'
        }
      ]);
    }
    return withListeningMusic(demoObsession.map((o) => ({ ...o })));
  }
  const rows = await fetchAttributes<ObsessionSquare>('obsession');
  let squares = rows.map((r) => r.value).sort((a, b) => a.order - b.order);

  // THIS SECTION DOES: surface the canonical currently_song as a Listening
  // square when obsession modules haven't filled one yet (onboarding seed).
  try {
    const header = await getMyProfileHeader();
    if (header.song?.title?.trim()) {
      const songText = header.song.artist?.trim()
        ? `${header.song.title.trim()} · ${header.song.artist.trim()}`
        : header.song.title.trim();
      let found = false;
      squares = squares.map((o) => {
        if (!/^listening/i.test(String(o.prompt))) return o;
        found = true;
        return { ...o, text: o.text || songText };
      });
      if (!found) {
        squares = [
          {
            id: 'from-currently-song',
            prompt: 'Listening…',
            text: songText,
            emoji: '🎧',
            order: -1,
            visibleToTier: 'friend'
          },
          ...squares
        ];
      }
    }
  } catch {
    // Header fetch failed: still return obsession rows + music overlay.
  }

  return withListeningMusic(squares);
}

/**
 * Album-style Favorites modules for the grid (filled + to-start on own).
 * Built from which fav groups / modules have answers.
 */
/** Co-op Greatest hits (≤3 Bridger-hosted photo slots). */
export async function listGreatestHits(): Promise<PhotoBlock[]> {
  if (isDemoMode()) {
    return demoGreatestHits.map((p) => ({ ...p }));
  }
  return apiFetch<PhotoBlock[]>('/me/greatest-hits');
}

/**
 * Replace all Greatest hits slots (co-op only on the server).
 * placementIndex is 0..2; afterModule places the photo between sections.
 */
export async function saveGreatestHits(
  slots: Array<{
    mediaId: string;
    placementIndex: number;
    afterModule?: string | null;
    visibleToTier?: Tier;
  }>
): Promise<PhotoBlock[]> {
  if (isDemoMode()) {
    demoGreatestHits = slots.slice(0, 3).map((s, i) => ({
      id: `me-gh-${s.placementIndex}`,
      assetId: s.mediaId,
      order: s.placementIndex ?? i,
      afterModule: s.afterModule ?? undefined,
      visibleToTier: s.visibleToTier ?? 'friend'
    }));
    return listGreatestHits();
  }
  return apiFetch<PhotoBlock[]>('/me/greatest-hits', {
    method: 'PUT',
    body: JSON.stringify({ slots })
  });
}

export async function listFavoriteModules(own: boolean): Promise<FavoriteModule[]> {
  const favs = await listFavs();
  const tot = await listThisOrThat();
  const catalog: Array<{ id: string; label: string; emoji: string; count: number }> = [
    {
      id: 'food_drinks',
      label: 'Food & drinks',
      emoji: '🍜',
      count: favs.find((g) => g.group === 'Food')?.total ?? 0
    },
    {
      id: 'entertainment',
      label: 'Entertainment',
      emoji: '🎬',
      count: favs.find((g) => g.group === 'Entertainment')?.total ?? 0
    },
    {
      id: 'everyday',
      label: 'Everyday',
      emoji: '🧺',
      count: favs.find((g) => g.group === 'Everyday')?.total ?? 0
    },
    {
      id: 'sports',
      label: 'Sports',
      emoji: '🚲',
      count: favs.find((g) => g.group === 'Sports')?.total ?? 0
    },
    {
      id: 'this_or_that',
      label: 'This or that',
      emoji: '⚖️',
      count: tot.length
    }
  ];
  return catalog
    .map((m) => ({
      id: m.id,
      label: m.label,
      emoji: m.emoji,
      answeredCount: m.count,
      empty: m.count === 0
    }))
    .filter((m) => own || !m.empty);
}

export async function getProfileIntroSeen(): Promise<boolean> {
  // THIS SECTION DOES: check if they already tapped Hell yeah on the intro.
  if (isDemoMode()) {
    if (demoProfileIntroSeen) return true;
    try {
      const v = await AsyncStorage.getItem(PROFILE_INTRO_SEEN_KEY);
      demoProfileIntroSeen = v === '1';
      return demoProfileIntroSeen;
    } catch {
      return false;
    }
  }
  try {
    const s = await apiFetch<{ profileIntroSeen?: boolean }>('/me/settings');
    return Boolean(s.profileIntroSeen);
  } catch {
    // Fallback: local device flag if settings cannot be read yet.
    try {
      return (await AsyncStorage.getItem(PROFILE_INTRO_SEEN_KEY)) === '1';
    } catch {
      return false;
    }
  }
}

export async function setProfileIntroSeen(): Promise<void> {
  // THIS SECTION DOES: mark the intro done so Profile never shows it again.
  demoProfileIntroSeen = true;
  try {
    await AsyncStorage.setItem(PROFILE_INTRO_SEEN_KEY, '1');
  } catch {
    // Device storage failed; live path still tries the server below.
  }
  if (isDemoMode()) return;
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ profileIntroSeen: true })
  });
}

// --- ModuleFlow writers (demo session + live TODOs) ---

/**
 * Save hobbies + their follow-up answers from the hobbies ModuleFlow.
 * answers['hobbies'] = selected hobby ids; answers['followup:id'] = text.
 * PRIVACY: each hobby inherits the visibility of its select step (or follow-up).
 */
export async function saveTop5(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {},
  matchable: Record<string, boolean> = {}
): Promise<Top5Item[]> {
  const items: Top5Item[] = [];
  for (let i = 1; i <= 5; i++) {
    const text = String(answers[`top5_${i}`] ?? '').trim();
    if (!text) continue;
    const key = `top5_${i}`;
    items.push({
      id: key,
      text,
      emoji: (answers[`top5_${i}_emoji`] as string) || '✨',
      order: items.length,
      visibleToTier: visibility[key] ?? 'friend',
      matchable: matchable[key] !== false
    });
  }
  if (isDemoMode()) {
    demoTop5 = items;
    return listTop5();
  }
  await replaceAttributes(
    'top5:',
    items.map((t) => ({
      key: `top5:${t.id}`,
      value: t,
      visibleToTier: t.visibleToTier,
      matchable: t.matchable
    }))
  );
  return listTop5();
}

export async function saveObsession(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {},
  matchable: Record<string, boolean> = {}
): Promise<ObsessionSquare[]> {
  const prompts = Object.keys(answers).filter((k) => k.startsWith('obsession:'));
  const items: ObsessionSquare[] = [];
  for (const key of prompts) {
    const text = String(answers[key] ?? '').trim();
    if (!text) continue;
    const prompt = key.replace(/^obsession:/, '');
    items.push({
      id: key,
      prompt,
      text,
      emoji: '✨',
      order: items.length,
      visibleToTier: visibility[key] ?? 'friend',
      matchable: matchable[key] !== false
    });
  }

  if (isDemoMode()) {
    demoObsession = items;
    return listObsession();
  }
  await replaceAttributes(
    'obsession:',
    items.map((o) => ({
      key: `obsession:${o.id}`,
      value: o,
      visibleToTier: o.visibleToTier,
      matchable: o.matchable
    }))
  );
  return listObsession();
}

export async function saveHobbies(
  answers: Record<string, string | string[]>,
  visibility: Record<string, Tier> = {}
): Promise<Interest[]> {
  const selected = (answers.hobbies as string[]) ?? [];
  const tier = visibility.hobbies ?? 'friend';

  const next: Interest[] = selected.map((id, i) => {
    const customLabel = answers[`customLabel:${id}`];
    const customEmoji = answers[`customEmoji:${id}`];
    const label =
      ALL_HOBBIES.find((h) => hobbyId(h) === id) ??
      (typeof customLabel === 'string' && customLabel.trim()
        ? customLabel.trim()
        : id
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '));
    return {
      id,
      label,
      emoji:
        HOBBY_EMOJI[id] ??
        (typeof customEmoji === 'string' && customEmoji.trim()
          ? customEmoji.trim()
          : '✨'),
      accent: hobbyAccent(i) as Accent,
      shape: i % 6,
      tier
    };
  });

  const followUps: Record<string, HobbyFollowUp> = {};
  for (const id of selected) {
    const answer = (answers[`followup:${id}`] as string) ?? '';
    const saved = next.find((h) => h.id === id);
    followUps[id] = {
      question:
        HOBBY_FOLLOWUP_QUESTIONS[id] ??
        `Tell me more about ${saved?.label ?? id}`,
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
  // THIS SECTION DOES: keep which question each answer came from (id + label),
  // so later features (like the website export) can split movies from books.
  const entriesByGroup = new Map<
    FavItem['group'],
    { id: string; label: string; value: string }[]
  >();
  for (const item of FAV_ITEMS) {
    const raw = answers[item.id];
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const list = byGroup.get(item.group) ?? [];
    list.push(raw.trim());
    byGroup.set(item.group, list);
    const entryList = entriesByGroup.get(item.group) ?? [];
    entryList.push({ id: item.id, label: item.label, value: raw.trim() });
    entriesByGroup.set(item.group, entryList);
    void visibility; // reserved for per-item tier once the card shows it
  }

  const next: FavGroup[] = [];
  for (const [group, items] of byGroup) {
    const display = FAV_GROUP_DISPLAY[group];
    next.push({
      group: display.label,
      emoji: display.emoji,
      items,
      total: items.length,
      entries: entriesByGroup.get(group) ?? []
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
    // Plain typed text used to be dropped with no error (TestFlight: pin gone).
    const raw = answers['place-where'];
    if (typeof raw === 'string' && raw.trim()) {
      throw new Error('Pick a place from the search list so we can pin it on your map.');
    }
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
 * Mark one travel place as the favorite (FAV star). Clears favorite on others
 * so there is only one starred pin. Live: rewrite the place: batch.
 */
export async function setFavoriteTravelPlace(placeId: string): Promise<TravelPlace[]> {
  const places = await listTravelPlaces();
  const next = places.map((p) => ({
    ...p,
    favorite: p.id === placeId
  }));
  if (isDemoMode()) {
    demoPlaces = next;
    trackProduct('place_favorited', {});
    return listTravelPlaces();
  }
  await replaceAttributes(
    'place:',
    next.map((p) => ({
      key: `place:${p.id}`,
      value: p,
      visibleToTier: p.tier ?? 'friend'
    }))
  );
  trackProduct('place_favorited', {});
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
 * Map tier-filtered attribute rows from GET /people/:id/profile into the
 * FriendProfile shape the card renders. PRIVACY: the server already filtered
 * by the owner's tier for this viewer; we only reshape.
 */
function mapPersonAttributes(
  attrs: ApiAttribute[]
): Omit<FriendProfile, 'greatestHits'> {
  const about: AboutField[] = [];
  const hobbies: Interest[] = [];
  const hobbyFollowUps: Record<string, HobbyFollowUp> = {};
  const favByGroup = new Map<string, FavGroup>();
  const thisOrThat: ThisOrThatRow[] = [];
  const places: TravelPlace[] = [];
  const top5: Top5Item[] = [];
  const obsession: ObsessionSquare[] = [];
  let bio = '';
  let song = { title: '', artist: '' };
  let book: { title: string; author: string } | undefined;
  let songMusic: ObsessionSquare['music'] | undefined;

  for (const a of attrs) {
    const key = a.key;
    const value = a.value as Record<string, unknown>;
    if (key === 'bio') {
      bio = typeof value?.text === 'string' ? value.text : '';
      continue;
    }
    if (key === 'currently_song') {
      song = {
        title: typeof value?.title === 'string' ? value.title : '',
        artist: typeof value?.artist === 'string' ? value.artist : ''
      };
      songMusic = {
        pickId: typeof value?.pickId === 'string' ? value.pickId : undefined,
        title: song.title,
        artistName: song.artist,
        previewUrl:
          typeof (value as { previewUrl?: string }).previewUrl === 'string'
            ? (value as { previewUrl: string }).previewUrl
            : null,
        spotifyId:
          typeof (value as { spotifyId?: string }).spotifyId === 'string'
            ? (value as { spotifyId: string }).spotifyId
            : null,
        spotifyUri:
          typeof (value as { spotifyUri?: string }).spotifyUri === 'string'
            ? (value as { spotifyUri: string }).spotifyUri
            : null,
        artworkUrl:
          typeof (value as { artworkUrl?: string }).artworkUrl === 'string'
            ? (value as { artworkUrl: string }).artworkUrl
            : null
      };
      continue;
    }
    if (key === 'currently_book' && value?.title) {
      book = {
        title: String(value.title),
        author: String(value.author ?? '')
      };
      continue;
    }
    if (key.startsWith('about:') && value && typeof value === 'object') {
      const f = value as unknown as AboutField;
      if (f.id && f.key) about.push({ ...f, tier: f.tier ?? a.visibleToTier });
      continue;
    }
    if (key.startsWith('hobby:') && value && typeof value === 'object') {
      const h = value as unknown as Interest & {
        followUp?: HobbyFollowUp;
      };
      if (h.id) {
        hobbies.push({
          id: h.id,
          label: h.label,
          emoji: h.emoji,
          accent: h.accent,
          shape: h.shape,
          tier: h.tier ?? a.visibleToTier
        });
        if (h.followUp) hobbyFollowUps[h.id] = { ...h.followUp };
      }
      continue;
    }
    if (key.startsWith('fav:') && value && typeof value === 'object') {
      const g = value as unknown as FavGroup;
      if (g.group) favByGroup.set(g.group, { ...g, items: [...(g.items ?? [])] });
      continue;
    }
    if (key.startsWith('tot:') && value && typeof value === 'object') {
      thisOrThat.push(value as unknown as ThisOrThatRow);
      continue;
    }
    if (key.startsWith('place:') && value && typeof value === 'object') {
      places.push(value as unknown as TravelPlace);
      continue;
    }
    if (key.startsWith('top5:') && value && typeof value === 'object') {
      const t = value as unknown as Top5Item;
      top5.push({
        ...t,
        visibleToTier: t.visibleToTier ?? a.visibleToTier
      });
      continue;
    }
    if (key.startsWith('obsession:') && value && typeof value === 'object') {
      const o = value as unknown as ObsessionSquare;
      obsession.push({
        ...o,
        visibleToTier: o.visibleToTier ?? a.visibleToTier
      });
    }
  }

  // THIS SECTION DOES: attach Spotify preview fields to Listening squares for friends.
  if (songMusic?.title) {
    let attached = false;
    for (let i = 0; i < obsession.length; i++) {
      const o = obsession[i]!;
      if (!/^listening/i.test(String(o.prompt))) continue;
      obsession[i] = {
        ...o,
        text: o.text || `${songMusic.title} · ${songMusic.artistName}`,
        music: o.music ?? songMusic
      };
      attached = true;
    }
    if (!attached) {
      obsession.push({
        id: 'from-currently-song',
        prompt: 'Listening…',
        text: `${songMusic.title} · ${songMusic.artistName}`,
        emoji: '🎧',
        order: -1,
        visibleToTier: 'friend',
        music: songMusic
      });
    }
  }

  return {
    about,
    hobbies,
    hobbyFollowUps,
    favs: Array.from(favByGroup.values()),
    thisOrThat,
    places,
    top5: top5.sort((a, b) => a.order - b.order),
    obsession: obsession.sort((a, b) => a.order - b.order),
    header: { city: '', bio, song, book }
  };
}

/**
 * Load another person's card data. Demo mode serves fixtures keyed by person
 * id. Live mode maps GET /people/:id/profile (tier-filtered attributes +
 * Greatest hits). Never falls back to the viewer's own Top 5 / Obsession.
 */
export async function getPersonProfile(personId: string): Promise<FriendProfile | null> {
  if (isDemoMode()) {
    const fixture = FRIEND_PROFILES[personId];
    if (!fixture) return null;
    return {
      ...fixture,
      about: fixture.about.map((f) => ({ ...f })),
      hobbies: fixture.hobbies.map((h) => ({ ...h })),
      hobbyFollowUps: fixture.hobbyFollowUps
        ? Object.fromEntries(
            Object.entries(fixture.hobbyFollowUps).map(([k, v]) => [k, { ...v }])
          )
        : undefined,
      favs: fixture.favs.map((g) => ({ ...g, items: [...g.items] })),
      thisOrThat: fixture.thisOrThat.map((t) => ({ ...t })),
      places: fixture.places.map((p) => ({ ...p })),
      top5: fixture.top5.map((t) => ({ ...t })),
      obsession: fixture.obsession.map((o) => ({ ...o })),
      greatestHits: fixture.greatestHits?.map((p) => ({ ...p })),
      header: {
        ...fixture.header,
        song: { ...fixture.header.song },
        book: fixture.header.book ? { ...fixture.header.book } : undefined
      }
    };
  }

  type PersonProfileApi = {
    id: string;
    name: string;
    avatarMediaId: string | null;
    avatarUrl?: string | null;
    viewerTier: Tier;
    attributes: ApiAttribute[];
    greatestHits?: PhotoBlock[];
  };

  const res = await apiFetch<PersonProfileApi | null>(
    `/people/${encodeURIComponent(personId)}/profile`
  );
  if (!res) return null;

  const mapped = mapPersonAttributes(res.attributes ?? []);
  // City often lives on settings; live friend cards may only have bio attrs.
  return {
    ...mapped,
    header: {
      ...mapped.header,
      city: mapped.header.city || '',
      avatarUrl: res.avatarUrl ?? null
    },
    greatestHits: (res.greatestHits ?? []).map((p) => ({ ...p }))
  };
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

/** Empty meter used while the Stories tab is still loading. */
export function emptyStorageState(): StorageState {
  return {
    plan: 'free',
    usedPct: 0,
    usedBytes: 0,
    includedBytes: FREE_STORY_STORAGE_BYTES,
    overageBytes: 0,
    label: 'Story storage',
    overagePriceLabel: null
  };
}

/**
 * Settings + Stories read the same helper.
 * Demo: free month looks full; after soft-join, shows ~1.2 GB of 3 GB + overage stub.
 */
export async function getStorageState(): Promise<StorageState> {
  if (isDemoMode()) {
    const membership = await getMembership();
    if (membership.member) {
      const includedBytes = includedBytesFromGb(DEFAULT_STORAGE_CONFIG.includedGb);
      // Demo numbers: about 1.2 GB used of the included allotment.
      const usedBytes = Math.round(1.2 * 1024 * 1024 * 1024);
      const meter = buildStorageMeter({ usedBytes, includedBytes });
      return {
        plan: 'coop',
        usedPct: storageUsedPct(meter),
        usedBytes: meter.usedBytes,
        includedBytes: meter.includedBytes,
        overageBytes: meter.overageBytes,
        label: `${formatStorageBytes(meter.usedBytes)} of ${formatStorageBytes(meter.includedBytes)} included`,
        overagePriceLabel: overagePriceLabel(DEFAULT_STORAGE_CONFIG.overageCentsPerGb)
      };
    }
    const meter = buildStorageMeter({
      // Demo free: nearly empty (one sample post), not "month already full".
      usedBytes: Math.round(FREE_STORY_STORAGE_BYTES * 0.02),
      includedBytes: FREE_STORY_STORAGE_BYTES
    });
    return {
      plan: 'free',
      usedPct: storageUsedPct(meter),
      usedBytes: meter.usedBytes,
      includedBytes: meter.includedBytes,
      overageBytes: 0,
      label: `${formatStorageBytes(meter.usedBytes)} of ${formatStorageBytes(meter.includedBytes)} this month`,
      overagePriceLabel: null
    };
  }

  const res = await apiFetch<{
    usedPct: number;
    plan: 'free' | 'coop';
    usedBytes?: number;
    includedBytes?: number;
    overageBytes?: number;
    label?: string;
    overagePriceLabel?: string | null;
  }>('/me/storage');

  const includedBytes =
    res.includedBytes ??
    (res.plan === 'coop'
      ? includedBytesFromGb(DEFAULT_STORAGE_CONFIG.includedGb)
      : FREE_STORY_STORAGE_BYTES);
  const usedBytes = res.usedBytes ?? 0;
  const meter = buildStorageMeter({ usedBytes, includedBytes });

  return {
    plan: res.plan ?? 'free',
    usedPct: res.usedPct ?? storageUsedPct(meter),
    usedBytes: meter.usedBytes,
    includedBytes: meter.includedBytes,
    overageBytes: res.overageBytes ?? meter.overageBytes,
    label: res.label ?? 'Storage',
    overagePriceLabel:
      res.overagePriceLabel ??
      (res.plan === 'coop'
        ? overagePriceLabel(DEFAULT_STORAGE_CONFIG.overageCentsPerGb)
        : null)
  };
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
