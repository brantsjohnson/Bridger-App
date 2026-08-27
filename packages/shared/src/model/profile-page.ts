// ============================================
// WHAT THIS FILE DOES (plain English):
// The shapes for a Spotify-style Bridger profile page: header, Top 5,
// About me, Current Obsession squares, Favorites modules, places, and
// co-op Greatest hits. The page is composed from attributes; this file
// is the typed "view model" both own and friend profiles share.
// ============================================
import type { MusicPlayable } from './music';
import { Tier } from './tier';

/** Analytics + ModuleFlow ids for every fill-out module (PROFILE-MODULES.md). */
export type ProfileModuleId =
  | 'about_basics'
  | 'about_deeper'
  | 'hobbies'
  | 'food_drinks'
  | 'entertainment'
  | 'everyday'
  | 'sports'
  | 'this_or_that'
  | 'places'
  | 'top5'
  | 'obsession'
  | 'timeline'
  | 'recommendations'
  | 'goals';

/** Prompt palette for Current Obsession squares (PROFILE.md §7). */
export const OBSESSION_PROMPTS = [
  'Reading…',
  'Watching…',
  'Listening…',
  'Obsessed with…',
  'Working on…',
  'Traveling to…',
  'Training for…',
  'Currently watching…',
  'Building:',
  'Writing:',
  'Learning:',
  'Launching:'
] as const;

export type ObsessionPrompt = (typeof OBSESSION_PROMPTS)[number] | string;

/** One of the up-to-5 "things to know about me" rows. */
export interface Top5Item {
  id: string;
  text: string;
  imageId?: string;
  emoji?: string;
  order: number;
  visibleToTier: Tier;
  matchable?: boolean;
}

/** A "who you are today" square (Reading… / Building… / etc.). */
export interface ObsessionSquare {
  id: string;
  prompt: ObsessionPrompt;
  text?: string;
  imageId?: string;
  emoji?: string;
  order: number;
  visibleToTier: Tier;
  matchable?: boolean;
  /** When prompt is Listening…, optional catalog fields for preview / open. */
  music?: MusicPlayable;
}

/** One About-me field on the expanded grid. */
export interface AboutFieldView {
  attributeId: string;
  key: string;
  value: string;
  visibleToTier: Tier;
  matchable?: boolean;
}

/** Album-style Favorites tile (food, entertainment, this-or-that, …). */
export interface FavoriteModule {
  id: ProfileModuleId | string;
  label: string;
  emoji: string;
  /** how many answers are filled */
  answeredCount: number;
  /** true when the owner has not finished this module yet */
  empty: boolean;
  previewLines?: string[];
}

/** Co-op Greatest hits photo block, insertable between sections. */
export interface PhotoBlock {
  id: string;
  /** media row id (Bridger-hosted only) */
  assetId: string;
  /** short-lived signed URL for display (server fills; never store long-term) */
  url?: string;
  /** which movable module this sits after (layout slot) */
  afterModule?: string;
  /** placement index 0..2 (max three slots) */
  order: number;
  visibleToTier: Tier;
}

/** Header chrome shared by own and friend profiles. */
export interface ProfileHeaderView {
  name: string;
  city?: string;
  headerPhotoId?: string;
  hasRecap: boolean;
  currentStoryId?: string;
  bio?: string;
  bioPhotoId?: string;
}

/** Coarse where-you-met line on a friend profile (opt-in, mutual). */
export interface WhereMetView {
  label: string;
  via?: string;
}

/**
 * The composed Spotify-order page. Own and friend render the same shape;
 * the client filters by tier and hides edit-only rows (Favorites to-start).
 */
export interface ProfilePage {
  header: ProfileHeaderView;
  top5: Top5Item[];
  about: AboutFieldView[];
  bio?: { text?: string; photoId?: string };
  currentObsession: ObsessionSquare[];
  favorites: FavoriteModule[];
  greatestHits?: PhotoBlock[];
  whereMet?: WhereMetView;
}

/** Attribute key prefixes for each kind (server KIND_PREFIX mirror). */
export const ATTRIBUTE_KIND_PREFIX: Record<string, string> = {
  about: 'about:',
  hobby: 'hobby:',
  fav: 'fav:',
  food: 'food:',
  ent: 'ent:',
  everyday: 'everyday:',
  sports: 'sports:',
  thisOrThat: 'tot:',
  place: 'place:',
  top5: 'top5:',
  obsession: 'obsession:',
  timeline: 'timeline:',
  rec: 'rec:',
  goal: 'goal:',
  currently: 'currently_'
};

/** Module 2 keys that must never be bulk-matchable. */
export const SENSITIVE_ABOUT_KEYS = [
  'ethnicity',
  'relationship_status',
  'sexuality',
  'religion',
  'middle_name'
] as const;
