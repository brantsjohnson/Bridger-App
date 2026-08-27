// ============================================
// WHAT THIS FILE DOES (plain English):
// Short event ideas for the Events marketing gate wall. Not real events.
// Decorative only — never prefill the create wizard from these.
// ============================================

import type { Accent } from '@bridger/shared';

export type EventIdea = {
  id: string;
  title: string;
  emoji: string;
  accent: Accent;
  /** 'idea' = event chip; 'touch_grass' = miniature TG mark in the wall */
  kind: 'idea' | 'touch_grass';
};

export const EVENT_IDEAS: EventIdea[] = [
  // FIRST: political / share-ideas (product priority)
  {
    id: 'activism',
    title: 'Political activism meeting',
    emoji: '📣',
    accent: 'coral',
    kind: 'idea'
  },
  {
    id: 'ideas',
    title: 'Share ideas night',
    emoji: '💡',
    accent: 'purple',
    kind: 'idea'
  },
  {
    id: 'tg-1',
    title: 'Touch grass',
    emoji: '🌱',
    accent: 'green',
    kind: 'touch_grass'
  },
  {
    id: 'book',
    title: 'Book club',
    emoji: '📚',
    accent: 'blue',
    kind: 'idea'
  },
  {
    id: 'game',
    title: 'Game night',
    emoji: '🎲',
    accent: 'teal',
    kind: 'idea'
  },
  {
    id: 'sunday',
    title: 'Sunday dinner',
    emoji: '🍲',
    accent: 'coral',
    kind: 'idea'
  },
  {
    id: 'tg-2',
    title: 'Who is free?',
    emoji: '🌱',
    accent: 'green',
    kind: 'touch_grass'
  },
  {
    id: 'cocktail',
    title: "I don't have anything to wear this to",
    emoji: '🍸',
    accent: 'purple',
    kind: 'idea'
  },
  {
    id: 'movie',
    title: 'Movie night',
    emoji: '🎬',
    accent: 'blue',
    kind: 'idea'
  },
  {
    id: 'poetry',
    title: 'Poetry reading',
    emoji: '✒️',
    accent: 'purple',
    kind: 'idea'
  },
  {
    id: 'sketch',
    title: 'Sketch night',
    emoji: '✏️',
    accent: 'purple',
    kind: 'idea'
  },
  {
    id: 'tg-3',
    title: 'Free tonight',
    emoji: '🌱',
    accent: 'green',
    kind: 'touch_grass'
  },
  {
    id: 'walk',
    title: 'Neighborhood walk',
    emoji: '🚶',
    accent: 'green',
    kind: 'idea'
  },
  {
    id: 'potluck',
    title: 'Potluck',
    emoji: '🥗',
    accent: 'teal',
    kind: 'idea'
  },
  {
    id: 'vinyl',
    title: 'Vinyl swap',
    emoji: '🎧',
    accent: 'blue',
    kind: 'idea'
  },
  {
    id: 'brunch',
    title: 'Lazy brunch',
    emoji: '🥞',
    accent: 'coral',
    kind: 'idea'
  }
];
