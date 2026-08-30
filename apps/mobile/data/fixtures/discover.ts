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
  {
    key: 'q-humor',
    quizId: 'humor',
    dimension: 'Your Funny Bone',
    score: 95,
    emoji: '😂',
    accent: 'coral'
  },
  {
    key: 'q-values',
    quizId: 'values',
    dimension: 'What Gets You Going',
    score: 72,
    emoji: '🧭',
    accent: 'purple'
  }
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
 * Matching modules at the top of Discover (Connect Over).
 * Live set = Behind the Scenes + the four measurement quizzes as they land.
 * Answers are never shared — they only find more relevant friends of friends.
 * Disclosure uses its own DisclosureFlow (empty questions here on purpose).
 */
export const MATCH_MODULES: MatchModule[] = [
  {
    id: 'disclosure',
    kind: 'quiz',
    title: 'Behind the Scenes',
    blurb: 'A quiet, optional check-in. Private, and only once if you skip.',
    emoji: '🎬',
    accent: 'teal',
    questions: []
  },
  {
    id: 'humor',
    kind: 'quiz',
    title: 'Your Funny Bone',
    blurb: 'What makes you laugh, and how you joke with friends.',
    emoji: '😂',
    accent: 'coral',
    questions: []
  },
  {
    id: 'values',
    kind: 'quiz',
    title: 'What Gets You Going',
    blurb: 'What you care about when it actually counts.',
    emoji: '🧭',
    accent: 'purple',
    questions: []
  },
  {
    id: 'personality',
    kind: 'quiz',
    title: 'Your Vibe',
    blurb: 'How you move through people, plans, and energy.',
    emoji: '✨',
    accent: 'amber',
    questions: []
  },
  {
    id: 'attachment',
    kind: 'quiz',
    title: 'The Friend Zone',
    blurb: 'How you show up when friendship gets real.',
    emoji: '🤝',
    accent: 'blue',
    questions: []
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
