// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake Discover data used only in demo mode: suggestions, connection requests,
// match modules, and "in common" lines. Screens never import this — they go
// through data/discover.ts so the live API can swap in later.
// ============================================
import type { Accent, ApprovalRequest, DiscoverSettings, Suggestion } from '@bridger/shared';

/** Demo starts opted in so localhost lands on the main Discover UI. */
export const DEFAULT_DISCOVER_SETTINGS: DiscoverSettings = {
  discoverable: true,
  sources: {
    aboutMe: true,
    onboardingQuiz: true,
    discoverMe: false
  }
};

export const SUGGESTIONS: Suggestion[] = [
  {
    id: 'g1',
    personId: 'nour',
    viaFriendId: 'devon',
    sharedThread: 'You both shoot film',
    signals: ['Film', 'Morning runs', 'Been to Japan'],
    accent: 'purple',
    bothOptedIn: true
  },
  {
    id: 'g2',
    personId: 'kit',
    viaFriendId: 'ines',
    sharedThread: 'Same morning loop',
    signals: ['Morning runs', 'Cyclocross'],
    accent: 'green',
    bothOptedIn: true
  },
  {
    id: 'g3',
    personId: 'theo',
    viaFriendId: 'maya',
    sharedThread: 'Chili tolerance: high',
    signals: ['Ramen', 'Night markets', 'Hot sauce'],
    accent: 'coral',
    bothOptedIn: true
  }
];

export const REQUESTS: ApprovalRequest[] = [
  { id: 'r1', personId: 'nour', viaFriendId: 'devon', createdAt: '1d' },
  { id: 'r2', personId: 'theo', viaFriendId: 'maya', createdAt: '3d' }
];

export type Commonality = {
  key: string;
  label: string;
  strongest?: boolean;
  hobbyId?: string;
  yours?: string;
  theirs?: string;
};

export const COMMONALITIES: Commonality[] = [
  { key: 'c1', label: 'Both at the Kettle open mic', strongest: true },
  {
    key: 'c3',
    label: 'You both run',
    hobbyId: 'hikes',
    yours: 'Trail half in the fall',
    theirs: 'Just started weekend trail runs'
  },
  {
    key: 'c4',
    label: 'You both shoot film',
    hobbyId: 'film',
    yours: 'Black and white, mostly portraits',
    theirs: 'Cheap point-and-shoot, no rules'
  }
];

/**
 * A compatibility score from a matching-only quiz — e.g. "95% in Humor".
 * These come from quizzes whose kind is 'quiz'; the number is how closely two
 * people line up on that dimension, not a shared result to display verbatim.
 * PRIVACY: only the dimension + score cross a connection, never the answers.
 */
export type QuizMatch = {
  key: string;
  /** The quiz this score is for (matches a MatchModule id where kind==='quiz') */
  quizId: string;
  /** Short human dimension, e.g. "Humor", "Values" */
  dimension: string;
  /** 0–100 compatibility */
  score: number;
  emoji: string;
  accent: Accent;
};

/** Demo compatibility scores shown in the reveal's "how you line up" section. */
export const QUIZ_MATCHES: QuizMatch[] = [
  { key: 'q-humor', quizId: 'humor', dimension: 'Humor', score: 95, emoji: '😂', accent: 'coral' },
  { key: 'q-values', quizId: 'values', dimension: 'Values', score: 72, emoji: '🧭', accent: 'purple' }
];

/** One question inside a private matching module. */
export type ModuleQuestion =
  | { id: string; ask: string; type: 'single'; options: string[]; emoji?: string }
  | { id: string; ask: string; type: 'multi'; options: string[]; emoji?: string }
  | { id: string; ask: string; type: 'text'; placeholder?: string; emoji?: string }
  | { id: string; ask: string; type: 'thisOrThat'; a: string; b: string; emoji?: string };

export type MatchModuleKind = 'module' | 'quiz';

export type MatchModule = {
  id: string;
  kind: MatchModuleKind;
  title: string;
  blurb: string;
  emoji: string;
  accent: Accent;
  questions: ModuleQuestion[];
};

/**
 * Matching modules at the top of Discover. Answers are never shared — they
 * only find more relevant friends of friends.
 */
export const MATCH_MODULES: MatchModule[] = [
  {
    id: 'weekends',
    kind: 'module',
    title: 'How you spend a weekend',
    blurb: 'Finds people whose free time looks like yours.',
    emoji: '🗓',
    accent: 'teal',
    questions: [
      {
        id: 'weekend-shape',
        ask: 'What does a good Saturday look like?',
        type: 'single',
        options: ['Out early, doing something', 'Slow morning, then out', 'One long plan', 'No plans at all'],
        emoji: '☀️'
      },
      {
        id: 'weekend-with',
        ask: 'Who is usually there?',
        type: 'single',
        options: ['Just me', 'One friend', 'A few people', 'A crowd'],
        emoji: '👥'
      },
      {
        id: 'weekend-do',
        ask: 'Pick what you actually do, not what you mean to.',
        type: 'multi',
        options: ['Walk somewhere', 'Cook', 'Gym or sport', 'Read', 'Make something', 'Go out', 'Games', 'Nothing'],
        emoji: '🎯'
      }
    ]
  },
  {
    id: 'social-battery',
    kind: 'module',
    title: 'Your social battery',
    blurb: 'Matches you with people who want the same amount of company.',
    emoji: '🔋',
    accent: 'amber',
    questions: [
      {
        id: 'battery-size',
        ask: 'How often do you want to see people?',
        type: 'single',
        options: ['Most days', 'A couple times a week', 'Once a week', 'A few times a month'],
        emoji: '📆'
      },
      {
        id: 'battery-when',
        ask: 'Morning person or night owl?',
        type: 'thisOrThat',
        a: 'Morning',
        b: 'Night',
        emoji: '🌗'
      },
      {
        id: 'battery-plans',
        ask: 'Plans made ahead, or same-day?',
        type: 'thisOrThat',
        a: 'Made ahead',
        b: 'Same-day',
        emoji: '📱'
      }
    ]
  },
  {
    id: 'humor',
    kind: 'quiz',
    title: 'What you find funny',
    blurb: 'The fastest way to tell whether two people will get on.',
    emoji: '😂',
    accent: 'coral',
    questions: [
      {
        id: 'humor-kind',
        ask: 'Which lands hardest?',
        type: 'single',
        options: ['Dry and deadpan', 'Absurd and silly', 'Sharp and mean-ish', 'Warm and goofy'],
        emoji: '🎭'
      },
      {
        id: 'humor-bit',
        ask: 'Do you commit to a bit?',
        type: 'thisOrThat',
        a: 'Ride it into the ground',
        b: 'Let it go',
        emoji: '🎤'
      }
    ]
  },
  {
    id: 'food',
    kind: 'module',
    title: 'How you eat',
    blurb: 'Most first hangouts are a meal. This makes them easier.',
    emoji: '🍜',
    accent: 'green',
    questions: [
      {
        id: 'food-adventure',
        ask: 'New place or the usual?',
        type: 'thisOrThat',
        a: 'Somewhere new',
        b: 'The usual',
        emoji: '🍽'
      },
      {
        id: 'food-no',
        ask: 'Anything you avoid?',
        type: 'multi',
        options: ['Meat', 'Dairy', 'Gluten', 'Shellfish', 'Nuts', 'Alcohol', 'Nothing'],
        emoji: '🚫'
      }
    ]
  },
  {
    id: 'moving',
    kind: 'module',
    title: 'How you move',
    blurb: 'Walks, climbs, runs, or none of it. Finds a pace that fits.',
    emoji: '🥾',
    accent: 'blue',
    questions: [
      {
        id: 'move-what',
        ask: 'What do you actually enjoy?',
        type: 'multi',
        options: [
          'Walking',
          'Running',
          'Climbing',
          'Cycling',
          'Swimming',
          'Lifting',
          'Team sport',
          'Yoga',
          'None of it'
        ],
        emoji: '🏃'
      },
      {
        id: 'move-pace',
        ask: 'Push hard or take it easy?',
        type: 'thisOrThat',
        a: 'Push hard',
        b: 'Take it easy',
        emoji: '📈'
      }
    ]
  },
  {
    id: 'values',
    kind: 'quiz',
    title: 'What matters to you',
    blurb: 'The deeper signal. Worth doing once you have the others out of the way.',
    emoji: '🧭',
    accent: 'purple',
    questions: [
      {
        id: 'values-pick',
        ask: 'Pick the three you would not compromise on.',
        type: 'multi',
        options: [
          'Honesty',
          'Loyalty',
          'Curiosity',
          'Ambition',
          'Kindness',
          'Independence',
          'Humor',
          'Steadiness'
        ],
        emoji: '💎'
      },
      {
        id: 'values-friend',
        ask: 'A good friend is someone who...',
        type: 'single',
        options: ['Shows up', 'Tells you the truth', 'Makes you laugh', 'Leaves you be'],
        emoji: '🤝'
      }
    ]
  }
];

/** Categories shown in Discover settings (visible about-me signals). */
export const ABOUT_ME_CATEGORIES = [
  'Foods',
  'Hobbies',
  'Hometown',
  'Places traveled',
  'Morning or night'
];
