// ============================================
// WHAT THIS FILE DOES (plain English):
// The New-onboarding map from Magic Patterns: which idea a screen belongs
// to (one color per idea), the ⓘ explanations, and the ten features you
// can pick for the tour. Copy for each screen lives in onboarding-new-copy.ts.
// ============================================
import type { Accent } from '@bridger/shared';
import { ACCENT_HEX } from '@bridger/ui';

/** Which room a screen sits in. One color per room, never per screen. */
export type NewConcept = 'basics' | 'why' | 'privacy' | 'coop' | 'product' | 'arrival';

/** Heading color: action is always blue. Info uses the concept, never blue. */
export function headingColorFor(
  tone: 'action' | 'info',
  accent: Accent,
  onDark: boolean
): string {
  if (tone === 'action') return ACCENT_HEX.blue;
  if (accent === 'blue') return ACCENT_HEX.teal;
  if (accent === 'purple' && onDark) return '#B195F8';
  return ACCENT_HEX[accent];
}

export const CONCEPT: Record<NewConcept, { accent: Accent; label: string }> = {
  basics: { accent: 'blue', label: 'Getting started' },
  // Pink, not coral: inverted info screens make coral type look muddy.
  why: { accent: 'pink', label: 'Why Bridger' },
  privacy: { accent: 'blue', label: 'Your privacy' },
  coop: { accent: 'teal', label: 'The co-op' },
  product: { accent: 'purple', label: 'What it does' },
  arrival: { accent: 'amber', label: 'All set' }
};

/** How many required ticks the progress bar counts. */
export const NEW_PROGRESS_TOTAL = 6;

/** ⓘ panel copy. Claims get a tap, not a paragraph. */
export const INFO = {
  privacy:
    'Choose who can see it. If you pick "Friends," your Close Friends can see it too. If you pick "Acquaintances," all your friends can see it.',
  noAds:
    'Ad-supported apps profit from attention, so the algorithm optimizes for keeping you scrolling. Bridger is funded by members instead, so it optimizes for your actual friendships.',
  coops:
    'A co-op is a business owned by the people who use it, not by outside investors. Profits and decisions stay with members instead of shareholders.',
  touchGrass:
    "Touch Grass is how Bridger turns 'we should hang out' into a real plan. Mark yourself free and friends who are also free light up.",
  notesPrivate:
    "Notes you add here are visible only to you, even though they live on your friend's profile. They never show up on their side.",
  scrapbook:
    'Photos, tagged friends, places, and a caption all live on one page you can look back on, instead of scattered across your camera roll and texts.',
  discover:
    'Bridger only surfaces people who share a mutual friend with you. No public search, no strangers with no connection to you.'
};

/** Which picture a feature tour screen shows. */
export type FeatureVisualKind =
  | 'availability'
  | 'notes'
  | 'scrapbook'
  | 'mutuals'
  | 'suggestions'
  | 'birthdays'
  | 'event'
  | 'dates'
  | 'interests'
  | 'group';

export type FeatureSpec = {
  id: string;
  chip: string;
  emoji: string;
  header: string;
  sub?: string;
  visual: FeatureVisualKind;
  info?: { label: string; body: string };
  more?: boolean;
};

export const FEATURES: FeatureSpec[] = [
  {
    id: 'plans',
    chip: 'Make plans',
    emoji: '🗓',
    header: 'Make plans',
    visual: 'availability',
    info: { label: "What's Touch Grass?", body: INFO.touchGrass }
  },
  {
    id: 'keep-up',
    chip: 'Keep up with friends',
    emoji: '📝',
    header: 'Keep up with friends',
    visual: 'notes',
    info: { label: "What's private?", body: INFO.notesPrivate }
  },
  {
    id: 'memories',
    chip: 'Save memories',
    emoji: '📷',
    header: 'Save memories',
    sub: 'Photos, people, places, jokes and more.',
    visual: 'scrapbook',
    info: { label: 'What can I add?', body: INFO.scrapbook }
  },
  {
    id: 'new-friends',
    chip: 'Make new friends',
    emoji: '👋',
    header: 'Make new friends',
    visual: 'mutuals',
    info: { label: 'How Discover works', body: INFO.discover }
  },
  {
    id: 'things-to-do',
    chip: 'Find things to do',
    emoji: '🎪',
    header: 'Find things to do',
    visual: 'suggestions',
    info: {
      label: 'How suggestions work',
      body: 'Suggestions come from what your friends have said they are into and what is actually happening near you this week. Nothing sponsored, ever.'
    },
    more: true
  },
  {
    id: 'birthdays',
    chip: 'Remember birthdays',
    emoji: '🎂',
    header: 'Remember birthdays',
    visual: 'birthdays',
    info: {
      label: 'How reminders work',
      body: 'Bridger nudges you a few days ahead, not the morning of, so you have time to actually do something about it.'
    },
    more: true
  },
  {
    id: 'events',
    chip: 'Plan events',
    emoji: '🎉',
    header: 'Plan events',
    visual: 'event',
    info: {
      label: "What's an event?",
      body: 'Anything from a birthday dinner to a Tuesday walk. You pick who is invited, and they see the address only once they are on the list.'
    },
    more: true
  },
  {
    id: 'dates',
    chip: 'Keep track of important dates',
    emoji: '📌',
    header: 'Keep track of important dates',
    visual: 'dates',
    info: {
      label: 'What counts as a date?',
      body: 'Anything you would want reminding about: an anniversary, a friend\'s interview, the day they move. These notes are private to you.'
    },
    more: true
  },
  {
    id: 'likes',
    chip: 'Know what friends like',
    emoji: '⭐️',
    header: 'Know what friends like',
    visual: 'interests',
    info: {
      label: 'Where does this come from?',
      body: 'Only from what your friends chose to put on their own profile, at the audience they picked. Nothing is inferred and nothing is scraped.'
    },
    more: true
  },
  {
    id: 'groups',
    chip: 'Stay connected with groups',
    emoji: '👥',
    header: 'Stay connected with groups',
    visual: 'group',
    info: {
      label: "What's a group?",
      body: 'A named circle you make yourself: a book club, a band, a family thread. Posts to a group only go to that group.'
    },
    more: true
  }
];

export const FEATURE_IDS = FEATURES.map((f) => f.id);

export function featureById(id: string): FeatureSpec | undefined {
  return FEATURES.find((f) => f.id === id);
}

/** Old help-interest ids from the previous New flow, mapped to the new ones. */
export const LEGACY_HELP_INTEREST: Record<string, string> = {
  see_friends: 'plans',
  keep_up: 'keep-up',
  memories: 'memories',
  meet_people: 'new-friends'
};

/** Saved step keys from the previous New flow, mapped to the current ones. */
export const RESUME_ALIASES: Record<string, string> = {
  'first-name': 'name',
  'last-name': 'name',
  'why-1': 'why-scattered',
  'why-2': 'why-together',
  'privacy-1': 'privacy-choose',
  'privacy-2': 'privacy-choose',
  'privacy-3': 'privacy-birthday',
  'privacy-4': 'privacy-control',
  'privacy-5': 'privacy-control',
  'privacy-7': 'product-picks',
  'groups-1': 'privacy-choose',
  'groups-2': 'privacy-control',
  'groups-3': 'privacy-control',
  'custom-groups-1': 'coop-benefits',
  'coop-1': 'coop-no-ads',
  'coop-2': 'coop-who-pays',
  'coop-3': 'coop-what',
  'coop-4': 'coop-say',
  'coop-5': 'coop-benefits',
  'coop-6': 'coop-matters',
  'product-1': 'why-together',
  'product-2': 'product-picks',
  'plans-1': 'feature-plans',
  'plans-2': 'feature-plans',
  'plans-3': 'feature-plans',
  'friends-1': 'feature-keep-up',
  'friends-2': 'feature-keep-up',
  'friends-3': 'feature-keep-up',
  'memories-1': 'feature-memories',
  'memories-2': 'feature-memories',
  'memories-3': 'feature-memories',
  'memories-4': 'feature-memories',
  'discover-1': 'feature-new-friends',
  'discover-2': 'feature-new-friends',
  'discover-3': 'feature-new-friends',
  'route-custom-groups': 'coop-matters',
  'route-vote': 'coop-matters',
  'route-no-ads': 'coop-matters',
  'coop-join': 'coop-join',
  'welcome-in': 'coop-join',
  'free-1': 'coop-join'
};
