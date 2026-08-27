// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake story posts, Catch-Up items, week days, themed capture prompts, and
// poll-result percentages used only in demo mode. Screens never import this —
// they go through data/stories.ts so the live API can replace it later.
// ============================================
import type {
  Accent,
  CatchUpItem,
  Reaction,
  StoryPost,
  ThemedPrompt
} from '@bridger/shared';

/** One day in someone's week hero (Catch-Up). Caption is text-only — AI never sees the photo. */
export type WeekDay = {
  day: string;
  note: string;
  /** PRIVACY: summary text comes from this field only, never photo analysis */
  caption: string;
  emoji: string;
  accent: Accent;
};

/** Currently listening / reading — shared with Profile Currently in spirit. */
export const STORY_CURRENTLY = {
  listening: {
    title: 'Blue Rev',
    artist: 'Alvvays',
    emoji: '💿',
    previewUrl: null as string | null,
    spotifyId: null as string | null,
    spotifyUri: null as string | null,
    artworkUrl: null as string | null
  },
  reading: { title: 'Piranesi', author: 'Susanna Clarke', emoji: '📖' }
};

/** Day-by-day week photos for the Catch-Up hero. */
export const WEEK_DAYS: WeekDay[] = [
  {
    day: 'Sunday',
    note: 'Long walk',
    caption: 'Walked the whole river loop before lunch.',
    emoji: '🌤',
    accent: 'green'
  },
  {
    day: 'Monday',
    note: 'Studio day',
    caption: 'Threw four mugs. One of them might survive.',
    emoji: '🏺',
    accent: 'amber'
  },
  {
    day: 'Tuesday',
    note: 'Rained out',
    caption: 'Ride cancelled. Made soup instead.',
    emoji: '🌧',
    accent: 'blue'
  },
  {
    day: 'Thursday',
    note: 'Ramen with Levi',
    caption: 'Levi picked the spicy one. Regrets were had.',
    emoji: '🍜',
    accent: 'coral'
  }
];

/** Percent bars after you answer a poll — never shown again on the settled rail. */
export const POLL_RESULTS: Record<string, number[]> = {
  c1: [62, 38]
};

/** Capture screen themed-post squares. */
export const THEMED_PROMPTS: ThemedPrompt[] = [
  { slug: 'ootd', label: 'OOTD', icon: '👕' },
  { slug: 'take-05', label: 'Take 0.5', icon: '🤳' },
  { slug: 'hot-take', label: 'Hot take', icon: '🌶️' }
];

/** Per-author posts (up to 3/day). Demo seeds Maya + You. */
export const STORY_POSTS: StoryPost[] = [
  {
    id: 'sp1',
    authorId: 'maya',
    type: 'photo',
    emoji: '🌇',
    accent: 'amber',
    overlayText: 'made it out',
    caption: 'Walked the long way home.',
    themeSlug: 'take-05',
    createdAt: '2h'
  },
  {
    id: 'sp2',
    authorId: 'maya',
    type: 'video',
    emoji: '🏺',
    accent: 'coral',
    caption: 'Third attempt at this mug.',
    createdAt: '2h'
  },
  {
    id: 'sp3',
    authorId: 'maya',
    type: 'photo',
    emoji: '🍜',
    accent: 'purple',
    overlayText: 'dinner!!',
    caption: 'Split it with Levi.',
    createdAt: '1h'
  },
  {
    id: 'sp-me-1',
    authorId: 'me',
    type: 'photo',
    emoji: '🍞',
    accent: 'green',
    overlayText: 'loaf',
    caption: 'Bread day. The kitchen smells like a bakery.',
    createdAt: '3h'
  },
  {
    id: 'sp-me-2',
    authorId: 'me',
    type: 'photo',
    emoji: '☕️',
    accent: 'amber',
    caption: 'Coffee before the loaf cooled.',
    createdAt: '3h'
  },
  {
    id: 'sp-devon-1',
    authorId: 'devon',
    type: 'photo',
    emoji: '🎧',
    accent: 'blue',
    caption: 'Found a crate of 7"s downtown.',
    createdAt: '4h'
  },
  {
    id: 'sp-kit-1',
    authorId: 'kit',
    type: 'photo',
    emoji: '🚲',
    accent: 'green',
    caption: 'Morning loop before work.',
    createdAt: '7h'
  },
  {
    id: 'sp-ines-1',
    authorId: 'ines',
    type: 'photo',
    emoji: '🌿',
    accent: 'teal',
    caption: 'Ridge line before the fog rolled in.',
    createdAt: '9h'
  }
];

/**
 * Catch-Up items. Actionable ones float to the top; answered ones sink as quiet
 * receipts with results hidden (STORIES.md).
 */
export const CATCH_UP: CatchUpItem[] = [
  {
    id: 'c1',
    kind: 'poll',
    title: 'Pizza or noodles Friday?',
    actionable: true,
    countdown: 'closes in 2 days',
    options: ['Pizza', 'Noodles'],
    accent: 'purple',
    emoji: '🗳'
  },
  {
    id: 'c2',
    kind: 'event',
    title: 'Game night',
    actionable: true,
    countdown: 'in 2 days',
    detail: "Thu 20:00 · Jade's place",
    accent: 'teal',
    emoji: '🎲',
    cover: { kind: 'emoji', value: '🎲' },
    startsInMinutes: 2 * 24 * 60 + 137
  },
  {
    id: 'c3',
    kind: 'question',
    title: 'What are you cooking this weekend?',
    actionable: true,
    accent: 'amber',
    emoji: '💬'
  },
  {
    id: 'c6',
    kind: 'question',
    title: 'Best thing you ate this week?',
    actionable: false,
    answeredByViewer: true,
    accent: 'coral',
    emoji: '💬'
  },
  {
    id: 'c7',
    kind: 'poll',
    title: 'Camping or cabin in September?',
    actionable: false,
    answeredByViewer: true,
    options: ['Camping', 'Cabin'],
    accent: 'blue',
    emoji: '🏕'
  }
];

/** Nested reply sample (parent = x1) — catalog STORY_REPLIES is the flat list. */
export const STORY_REPLY_EXTRA: Reaction = {
  id: 'x4',
  postId: 'sp-me-1',
  authorId: 'theo',
  kind: 'text',
  text: 'where is this',
  parentReactionId: 'x1',
  at: '32m'
};

/** Seed replies on Maya's first post so the friend viewer also has a thread. */
export const MAYA_STORY_REPLIES: Reaction[] = [
  {
    id: 'mx1',
    postId: 'sp1',
    authorId: 'devon',
    kind: 'text',
    text: 'that sky is unreal',
    at: '1h'
  },
  {
    id: 'mx2',
    postId: 'sp1',
    authorId: 'kit',
    kind: 'circleVideo',
    at: '58m'
  },
  {
    id: 'mx3',
    postId: 'sp1',
    authorId: 'me',
    kind: 'sticker',
    stickerId: '🔥',
    at: '40m'
  }
];
