// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything your own Profile tab needs: the card fields (about, hobbies,
// favs, places, this-or-that), the weekly Currently check-in, your bucket
// list, story-calendar archive, storage state, and blocked people. Demo mode
// keeps state in memory; live mode will call profiles / attributes APIs.
// ============================================
import type { BucketItem, Person, Tier } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { PEOPLE } from './fixtures/catalog';
import {
  ABOUT_ME_FIELDS,
  BLOCKED_IDS,
  BUCKET_LIST as FIXTURE_BUCKET,
  FAVS,
  HOBBY_FOLLOW_UPS,
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

export type {
  AboutField,
  FavGroup,
  Interest,
  ThisOrThatRow,
  TravelPlace
};
export { HOBBY_FOLLOW_UPS };

export type Currently = {
  listening: { title: string; artist: string; emoji: string };
  reading: { title: string; author: string; emoji: string };
  /** false once the week rolls over — the card asks for a fresh check-in */
  checkedIn: boolean;
};

export type MyProfileHeader = {
  city: string;
  bio: string;
  song: { title: string; artist: string };
};

export type StorageState = {
  usedPct: number;
  plan: 'free' | 'coop';
};

// --- demo state (so edits stick for the session) ---
let demoHeader: MyProfileHeader = { ...ME_PROFILE, song: { ...ME_PROFILE.song } };
let demoCurrently: Currently = {
  listening: { ...PROFILE_CURRENTLY.listening },
  reading: { ...PROFILE_CURRENTLY.reading },
  checkedIn: true
};
let demoBucket: BucketItem[] = FIXTURE_BUCKET.map((b) => ({ ...b, withIds: [...b.withIds] }));
let demoBlockedIds: string[] = [...BLOCKED_IDS];

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
  if (isDemoMode()) return ABOUT_ME_FIELDS.map((f) => ({ ...f }));
  // TODO: GET /me/attributes?kind=about
  return [];
}

export async function listHobbies(): Promise<Interest[]> {
  if (isDemoMode()) return INTERESTS.map((h) => ({ ...h }));
  // TODO: GET /me/attributes?kind=hobby
  return [];
}

export async function listFavs(): Promise<FavGroup[]> {
  if (isDemoMode()) return FAVS.map((g) => ({ ...g, items: [...g.items] }));
  // TODO: GET /me/attributes?kind=fav
  return [];
}

export async function listThisOrThat(): Promise<ThisOrThatRow[]> {
  if (isDemoMode()) return THIS_OR_THAT.map((t) => ({ ...t }));
  // TODO: GET /me/attributes?kind=thisOrThat
  return [];
}

export async function listTravelPlaces(): Promise<TravelPlace[]> {
  if (isDemoMode()) return TRAVEL_PLACES.map((p) => ({ ...p }));
  // TODO: GET /me/attributes?kind=place
  return [];
}

// --- Bucket list ---

export async function listBucket(): Promise<BucketItem[]> {
  if (isDemoMode()) return demoBucket.map((b) => ({ ...b, withIds: [...b.withIds] }));
  // TODO: GET /me/bucket
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
