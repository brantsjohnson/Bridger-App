// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake data for your own Profile tab in demo mode: the card fields (about me,
// hobbies, favs, places, this-or-that), Currently, the bucket list, and the
// story calendar. Screens never import this — they go through data/profile.ts.
// ============================================
import type { Accent, BucketItem, Tier } from '@bridger/shared';

/** Header extras that are not on the Person shape. */
export const ME_PROFILE = {
  city: 'Portland, OR',
  bio: 'Making zines nobody asked for. Always down for a walk.',
  song: { title: 'Archie, Marry Me', artist: 'Alvvays' },
  book: { title: 'Piranesi', author: 'Susanna Clarke' }
};

/** The weekly check-in card: one song, one book. */
export const PROFILE_CURRENTLY = {
  listening: { title: 'Blue Rev', artist: 'Alvvays', emoji: '💿' },
  reading: { title: 'Piranesi', author: 'Susanna Clarke', emoji: '📖' }
};

export type AboutField = {
  id: string;
  key: string;
  value: string;
  /** PRIVACY: who is allowed to see this field */
  tier: Tier;
};

export const ABOUT_ME_FIELDS: AboutField[] = [
  { id: 'ab1', key: 'Hometown', value: 'Missoula, MT', tier: 'acquaintance' },
  { id: 'ab2', key: 'Lives in', value: 'Portland, OR', tier: 'acquaintance' },
  { id: 'ab3', key: 'Work', value: 'Studio potter', tier: 'friend' },
  { id: 'ab4', key: 'Birthday', value: 'March 4', tier: 'friend' },
  { id: 'ab5', key: 'Allergies', value: 'Peanuts', tier: 'close' },
  { id: 'ab6', key: 'Love language', value: 'Acts of service', tier: 'close' }
];

export type Interest = {
  id: string;
  label: string;
  emoji: string;
  accent: Accent;
  shape?: number;
  /** PRIVACY: who can see this hobby (defaults wider) */
  tier?: Tier;
};

export const INTERESTS: Interest[] = [
  { id: 'galleries', label: 'Galleries', emoji: '🖼️', accent: 'purple', shape: 0 },
  { id: 'hot-food', label: 'Spicy food', emoji: '🌶️', accent: 'coral', shape: 1 },
  { id: 'jazz', label: 'Jazz', emoji: '🎷', accent: 'amber', shape: 2 },
  { id: 'hikes', label: 'Hikes', emoji: '🌄', accent: 'teal', shape: 3 },
  { id: 'open-mic', label: 'Open mic', emoji: '🎤', accent: 'pink', shape: 4 },
  { id: 'film', label: 'Film photos', emoji: '📷', accent: 'blue', shape: 5 },
  { id: 'animals', label: 'Animals', emoji: '🐻', accent: 'green', shape: 1 },
  { id: 'drives', label: 'Long drives', emoji: '🚗', accent: 'purple', shape: 0 },
  { id: 'plants', label: 'Plants', emoji: '🪴', accent: 'teal', shape: 2 },
  { id: 'markets', label: 'Flea markets', emoji: '🛍️', accent: 'coral', shape: 3 }
];

/**
 * Every hobby carries a follow-up question and answer — what turns a matched
 * label into something to actually talk about.
 */
export const HOBBY_FOLLOW_UPS: Record<string, { question: string; answer: string }> = {
  galleries: { question: 'Last show you loved?', answer: 'Ruth Asawa retrospective' },
  'hot-food': { question: 'How hot is too hot?', answer: 'Nothing is too hot' },
  jazz: { question: 'Who got you into it?', answer: 'My dad, endless Coltrane' },
  hikes: { question: 'Where do you go?', answer: 'Trail half in the fall' },
  'open-mic': { question: 'Perform or watch?', answer: 'Watch, one day perform' },
  film: { question: 'What do you shoot?', answer: 'Black and white, mostly portraits' },
  animals: { question: 'Which one is yours?', answer: 'Miso, a very loud cat' },
  drives: { question: 'Best road so far?', answer: 'Highway 1 at sunset' },
  plants: { question: 'How many, honestly?', answer: 'Thirty one. I counted' },
  markets: { question: 'Best find?', answer: 'A working 1970s radio' }
};

export type FavGroup = {
  group: string;
  emoji: string;
  items: string[];
  total: number;
};

export const FAVS: FavGroup[] = [
  {
    group: 'Food',
    emoji: '🍜',
    items: ['Tonkotsu ramen', 'Sour cherries', 'Burnt cheesecake', 'Green curry'],
    total: 22
  },
  {
    group: 'Entertainment',
    emoji: '🎬',
    items: ['Paddington 2', 'Fleabag', 'Columbo', 'Perfect Days'],
    total: 30
  },
  { group: 'Everyday', emoji: '🧺', items: ['Sunday laundry', 'Long walks', 'Library holds'], total: 12 },
  { group: 'Sports', emoji: '🚲', items: ['Track cycling', 'Bouldering'], total: 6 }
];

export type ThisOrThatRow = {
  id: string;
  a: string;
  b: string;
  pick: 'a' | 'b' | 'both';
  emoji: string;
  /** PRIVACY: who can see this pick */
  tier?: Tier;
};

/** "Both" is a first-class answer. Plenty of people genuinely are. */
export const THIS_OR_THAT: ThisOrThatRow[] = [
  { id: 't1', a: 'Coffee', b: 'Tea', pick: 'a', emoji: '☕' },
  { id: 't2', a: 'Beach', b: 'Mountain', pick: 'b', emoji: '⛰' },
  { id: 't3', a: 'Early', b: 'Late', pick: 'both', emoji: '🌙' },
  { id: 't4', a: 'Call', b: 'Text', pick: 'b', emoji: '💬' },
  { id: 't5', a: 'Sweet', b: 'Salty', pick: 'both', emoji: '🍬' },
  { id: 't6', a: 'Plan', b: 'Wing it', pick: 'a', emoji: '🗓' }
];

export type TravelPlaceTag = 'visited' | 'lived' | 'want';

export type TravelPlace = {
  id: string;
  label: string;
  note: string;
  /** WGS84 latitude */
  lat: number;
  /** WGS84 longitude */
  lng: number;
  /** ISO 3166-1 alpha-2, uppercase, e.g. "PT" */
  countryCode: string;
  emoji: string;
  year?: string;
  /** PRIVACY: who can see this place */
  tier?: Tier;
  /** Optional tags from PROFILE-MODULES Module 3 */
  tags?: TravelPlaceTag[];
};

export const TRAVEL_PLACES: TravelPlace[] = [
  {
    id: 'pl1',
    label: 'Lisbon',
    note: 'Ate custard tarts daily',
    lat: 38.7223,
    lng: -9.1393,
    countryCode: 'PT',
    emoji: '🥮',
    year: '2023',
    tags: ['visited']
  },
  {
    id: 'pl2',
    label: 'Oaxaca',
    note: 'Mezcal + markets',
    lat: 17.0732,
    lng: -96.7266,
    countryCode: 'MX',
    emoji: '🌶',
    year: '2022',
    tags: ['visited']
  },
  {
    id: 'pl3',
    label: 'Reykjavík',
    note: 'Saw the lights',
    lat: 64.1466,
    lng: -21.9426,
    countryCode: 'IS',
    emoji: '🌌',
    year: '2024',
    tags: ['visited']
  },
  {
    id: 'pl4',
    label: 'Kyoto',
    note: 'Temple mornings',
    lat: 35.0116,
    lng: 135.7681,
    countryCode: 'JP',
    emoji: '⛩',
    year: '2019',
    tags: ['visited']
  },
  {
    id: 'pl5',
    label: 'Banff',
    note: 'Cold lake swim',
    lat: 51.1784,
    lng: -115.5708,
    countryCode: 'CA',
    emoji: '🏔',
    year: '2021',
    tags: ['visited']
  }
];

/** Profile-only module. Solo wants and things to do with specific people. */
export const BUCKET_LIST: BucketItem[] = [
  { id: 'b1', text: 'Learn to surf', withIds: [], done: false, isPrivate: false },
  { id: 'b2', text: 'Hike the Inca Trail', withIds: ['maya', 'devon'], done: false, isPrivate: false },
  { id: 'b3', text: 'See the northern lights', withIds: ['kit'], done: false, isPrivate: true },
  { id: 'b4', text: 'Swim in the Adriatic', withIds: [], done: true, isPrivate: false }
];

/** Which days this month had a story, and what it looked like. */
export const STORY_CALENDAR: Record<number, string> = {
  3: '🌇',
  4: '🏺',
  8: '🍜',
  12: '🌤',
  13: '🎸',
  19: '📷',
  22: '🚲',
  26: '🌻'
};

/** Ids of people you've blocked (demo default matches Magic Patterns). */
export const BLOCKED_IDS = ['theo'];

/** Top 5 — "things anyone who knows you well needs to know." */
export const TOP_5: Array<{
  id: string;
  text: string;
  emoji?: string;
  order: number;
  tier: Tier;
}> = [
  { id: 't5-1', text: 'Twin sister, we finish sentences', emoji: '👯', order: 0, tier: 'friend' },
  { id: 't5-2', text: 'Recovering perfectionist', emoji: '🎯', order: 1, tier: 'friend' },
  { id: 't5-3', text: 'Will drive 3 hrs for good tacos', emoji: '🌮', order: 2, tier: 'friend' },
  { id: 't5-4', text: 'Grew up on a dairy farm', emoji: '🐄', order: 3, tier: 'friend' },
  {
    id: 't5-5',
    text: 'Terrified of, and obsessed with, AI',
    emoji: '🤖',
    order: 4,
    tier: 'friend'
  }
];

/** Current Obsession squares (who you are today). */
export const CURRENT_OBSESSION: Array<{
  id: string;
  prompt: string;
  text: string;
  emoji: string;
  order: number;
  tier: Tier;
}> = [
  { id: 'ob1', prompt: 'Reading…', text: 'Tomorrow, and Tomorrow', emoji: '📖', order: 0, tier: 'friend' },
  { id: 'ob2', prompt: 'Building:', text: 'a kiln in the garage', emoji: '🛠', order: 1, tier: 'friend' },
  { id: 'ob3', prompt: 'Training for…', text: 'a 10k', emoji: '🏃', order: 2, tier: 'friend' },
  { id: 'ob4', prompt: 'Listening…', text: 'boygenius', emoji: '🎧', order: 3, tier: 'friend' },
  { id: 'ob5', prompt: 'Obsessed with…', text: 'custard tarts', emoji: '🥮', order: 4, tier: 'friend' }
];
