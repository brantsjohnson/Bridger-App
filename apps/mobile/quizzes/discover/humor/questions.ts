// ============================================
// WHAT THIS FILE DOES (plain English):
// Your Funny Bone questions in three phases: what you laugh at (incl. media),
// how you're funny (style hints for later), and hidden separators. Options
// carry axis leans and optional style tags. Media picks use fingerprints
// from media.ts. Free-text "other" never goes to analytics.
// ============================================

import type { HumorAxisKey } from './media';

export type HumorOption = {
  id: string;
  /** Big flair glyph on the tile. */
  emoji?: string;
  label: string;
  /** Axis leans (-2..+2 toward the high pole). */
  weights?: Partial<Record<HumorAxisKey, number>>;
  /** Links to a media fingerprint when this is a title pick. */
  mediaId?: string;
  /** Future humor-style layer (not matching today). */
  style?: string;
  /** Needs optional free text; not scored from the label. */
  other?: boolean;
};

export type HumorQuestion = {
  id: string;
  phase: 1 | 2 | 3;
  prompt: string;
  maxSelect: number;
  mediaKind?: 'tv' | 'movie' | 'comedian' | 'character';
  options: HumorOption[];
};

export const HUMOR_INSTRUCTIONS = {
  title: 'Your Funny Bone',
  headline: 'What makes you laugh?',
  lead: 'Pick what actually cracks you up.',
  rules: [
    'More than one is fine.',
    'Shows and movies: favorites only.',
    'Add a note anytime.'
  ]
} as const;

export const HUMOR_QUESTIONS: HumorQuestion[] = [
  {
    id: 'h01',
    phase: 1,
    prompt: "Which moments make you laugh the hardest?",
    maxSelect: 4,
    options: [
      { id: 'a', emoji: '🤦', label: "Someone confidently being wrong.", weights: { absurdity: -0.5, irony: 0.5, craft: 0.3 } },      { id: 'b', emoji: '😏', label: "Perfectly timed sarcasm.", weights: { register: 1.0, irony: 1.0, craft: 0.8 } },      { id: 'c', emoji: '😬', label: "Awkward social situations.", weights: { absurdity: 0.2, edge: 0.2, register: 0.5 } },      { id: 'd', emoji: '🔤', label: "Clever wordplay.", weights: { craft: 1.5, absurdity: 0.2 } },      { id: 'e', emoji: '🤸', label: "Physical comedy.", weights: { craft: -1.5, absurdity: 0.3, register: -0.8 } },      { id: 'f', emoji: '🌪️', label: "Complete chaos.", weights: { absurdity: 1.5, edge: 0.4, register: -0.8 } },      { id: 'g', emoji: '😐', label: "Dead-serious reactions to ridiculous situations.", weights: { absurdity: 1.2, register: 1.5, irony: 0.6 } },      { id: 'h', emoji: '✨', label: "Something else.", other: true },    ]
  },
  {
    id: 'h02',
    phase: 1,
    prompt: "Which emotion do you enjoy most while laughing?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '😮', label: "\"I can't believe they said that.\"", weights: { edge: 1.0, irony: 0.6 } },      { id: 'b', emoji: '🧠', label: "\"That was so clever.\"", weights: { craft: 1.5, absurdity: -0.2 } },      { id: 'c', emoji: '🪞', label: "\"This is painfully relatable.\"", weights: { absurdity: -1.0, irony: -0.5, edge: -0.3 } },      { id: 'd', emoji: '🌀', label: "\"Everything is spiraling.\"", weights: { absurdity: 1.5, register: -0.6 } },      { id: 'e', emoji: '🎤', label: "\"That delivery was perfect.\"", weights: { register: 1.2, craft: 0.5 } },    ]
  },
  {
    id: 'h03',
    phase: 1,
    prompt: "Which matters most?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '⏱️', label: "Timing", weights: { register: 0.8 } },      { id: 'b', emoji: '🎙️', label: "Delivery", weights: { register: 1.2 } },      { id: 'c', emoji: '✍️', label: "Writing", weights: { craft: 1.5 } },      { id: 'd', emoji: '🎭', label: "Characters", weights: { absurdity: 0.2, irony: -0.2 } },      { id: 'e', emoji: '🎉', label: "Surprise", weights: { absurdity: 1.0, irony: 0.4 } },    ]
  },
  {
    id: 'h04',
    phase: 1,
    prompt: "Which usually ruins a joke?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '😓', label: "Trying too hard.", weights: { register: 0.5, irony: 0.3 } },      { id: 'b', emoji: '📢', label: "Explaining it.", weights: { craft: 0.8, register: 0.5 } },      { id: 'c', emoji: '🔁', label: "Repeating it.", weights: { absurdity: -0.2 } },      { id: 'd', emoji: '💔', label: "Being mean.", weights: { edge: -1.5 } },      { id: 'e', emoji: '🥱', label: "Predictability.", weights: { absurdity: 0.8, irony: 0.3 } },    ]
  },
  {
    id: 'h05',
    phase: 1,
    prompt: "Which TV shows do you genuinely love? (Pick up to 8.)",
    maxSelect: 8,
    mediaKind: 'tv',
    options: [
      { id: 'parks', emoji: '🏞️', label: "Parks and Recreation", mediaId: 'parks' },      { id: 'veep', emoji: '🏛️', label: "Veep", mediaId: 'veep' },      { id: 'fleabag', emoji: '👗', label: "Fleabag", mediaId: 'fleabag' },      { id: 'office', emoji: '📎', label: "The Office", mediaId: 'office' },      { id: 'arrested', emoji: '🍌', label: "Arrested Development", mediaId: 'arrested' },      { id: 'community', emoji: '🏫', label: "Community", mediaId: 'community' },      { id: 'sunny', emoji: '🍺', label: "It's Always Sunny", mediaId: 'sunny' },      { id: 'curb', emoji: '🤷', label: "Curb Your Enthusiasm", mediaId: 'curb' },      { id: 'itysl', emoji: '🚪', label: "I Think You Should Leave", mediaId: 'itysl' },      { id: 'nathan', emoji: '🛒', label: "Nathan for You", mediaId: 'nathan' },      { id: 'b99', emoji: '👮', label: "Brooklyn Nine-Nine", mediaId: 'b99' },      { id: 'newgirl', emoji: '🏠', label: "New Girl", mediaId: 'newgirl' },      { id: 'schitts', emoji: '🏰', label: "Schitt's Creek", mediaId: 'schitts' },      { id: 'modern', emoji: '👨‍👩‍👧', label: "Modern Family", mediaId: 'modern' },      { id: 'derry', emoji: '☘️', label: "Derry Girls", mediaId: 'derry' },      { id: 'abbott', emoji: '✏️', label: "Abbott Elementary", mediaId: 'abbott' },      { id: 'other', emoji: '📺', label: "Other", other: true },    ]
  },
  {
    id: 'h06',
    phase: 1,
    prompt: "Which comedy movies do you love? (Pick up to 8.)",
    maxSelect: 8,
    mediaKind: 'movie',
    options: [
      { id: 'mitchells', emoji: '🤖', label: "The Mitchells vs. the Machines", mediaId: 'mitchells' },      { id: 'bottoms', emoji: '🏐', label: "Bottoms", mediaId: 'bottoms' },      { id: 'airplane', emoji: '✈️', label: "Airplane!", mediaId: 'airplane' },      { id: 'hotfuzz', emoji: '🔫', label: "Hot Fuzz", mediaId: 'hotfuzz' },      { id: 'niceguys', emoji: '🕵️', label: "The Nice Guys", mediaId: 'niceguys' },      { id: 'gamenight', emoji: '🎲', label: "Game Night", mediaId: 'gamenight' },      { id: 'superbad', emoji: '🍻', label: "Superbad", mediaId: 'superbad' },      { id: 'meangirls', emoji: '💅', label: "Mean Girls", mediaId: 'meangirls' },      { id: 'clue', emoji: '🔪', label: "Clue", mediaId: 'clue' },      { id: 'python', emoji: '🥥', label: "Monty Python and the Holy Grail", mediaId: 'python' },      { id: 'groove', emoji: '🦙', label: "The Emperor's New Groove", mediaId: 'groove' },      { id: 'cloudy', emoji: '🍖', label: "Cloudy with a Chance of Meatballs", mediaId: 'cloudy' },      { id: 'other', emoji: '🎬', label: "Other", other: true },    ]
  },
  {
    id: 'h07',
    phase: 1,
    prompt: "Which comedians do you actually enjoy?",
    maxSelect: 6,
    mediaKind: 'comedian',
    options: [
      { id: 'conan', emoji: '🍊', label: "Conan O'Brien", mediaId: 'conan' },      { id: 'nate', emoji: '🧊', label: "Nate Bargatze", mediaId: 'nate' },      { id: 'mulaney', emoji: '🎩', label: "John Mulaney", mediaId: 'mulaney' },      { id: 'taylor', emoji: '🎙️', label: "Taylor Tomlinson", mediaId: 'taylor' },      { id: 'bo', emoji: '🎹', label: "Bo Burnham", mediaId: 'bo' },      { id: 'norm', emoji: '🐸', label: "Norm Macdonald", mediaId: 'norm' },      { id: 'tig', emoji: '🪨', label: "Tig Notaro", mediaId: 'tig' },      { id: 'ali', emoji: '🔥', label: "Ali Wong", mediaId: 'ali' },      { id: 'demetri', emoji: '✏️', label: "Demetri Martin", mediaId: 'demetri' },      { id: 'acaster', emoji: '🇬🇧', label: "James Acaster", mediaId: 'acaster' },      { id: 'none', emoji: '🚫', label: "None" },      { id: 'other', emoji: '🎤', label: "Other", other: true },    ]
  },
  {
    id: 'h08',
    phase: 1,
    prompt: "Which fictional character is funniest?",
    maxSelect: 3,
    mediaKind: 'character',
    options: [
      { id: 'ron', emoji: '🥩', label: "Ron Swanson", mediaId: 'ron' },      { id: 'april', emoji: '🖤', label: "April Ludgate", mediaId: 'april' },      { id: 'selina', emoji: '👠', label: "Selina Meyer", mediaId: 'selina' },      { id: 'fleabag_c', emoji: '👁️', label: "Fleabag", mediaId: 'fleabag_c' },      { id: 'michael', emoji: '😅', label: "Michael Scott", mediaId: 'michael' },      { id: 'gob', emoji: '🪄', label: "Gob Bluth", mediaId: 'gob' },      { id: 'abed', emoji: '📼', label: "Abed Nadir", mediaId: 'abed' },      { id: 'jean', emoji: '💅', label: "Jean-Ralphio", mediaId: 'jean' },      { id: 'moss', emoji: '💻', label: "Moss (The IT Crowd)", mediaId: 'moss' },      { id: 'other', emoji: '🦸', label: "Someone else", other: true },    ]
  },
  {
    id: 'h09',
    phase: 2,
    prompt: "What usually gets the biggest laugh from you?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '😏', label: "Sarcastic observation.", weights: { irony: 1.0, register: 0.6, craft: 0.6 }, style: 'sarcastic' },      { id: 'b', emoji: '📖', label: "Story.", weights: { craft: 0.5, absurdity: -0.2 }, style: 'storyteller' },      { id: 'c', emoji: '🔗', label: "Callback.", weights: { craft: 0.8, irony: 0.5 }, style: 'callback' },      { id: 'd', emoji: '⚡', label: "One-liner.", weights: { craft: 1.2, register: 0.4 }, style: 'one_liner' },      { id: 'e', emoji: '🤸', label: "Physical bit.", weights: { craft: -1.5, register: -0.8 }, style: 'physical' },      { id: 'f', emoji: '🪞', label: "Self-deprecating joke.", weights: { irony: 0.3, edge: 0.2 }, style: 'self_deprecating' },    ]
  },
  {
    id: 'h10',
    phase: 2,
    prompt: "What usually happens before you make a joke?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '🚪', label: "Someone gives me an opening.", style: 'reactive' },      { id: 'b', emoji: '👀', label: "I notice something weird.", weights: { absurdity: 0.5 }, style: 'observational' },      { id: 'c', emoji: '😶', label: "Awkward silence.", weights: { register: 0.5 }, style: 'reactive' },      { id: 'd', emoji: '🚀', label: "I intentionally start it.", style: 'instigator' },      { id: 'e', emoji: '🤪', label: "Someone says something ridiculous.", weights: { absurdity: 0.6 }, style: 'reactive' },    ]
  },
  {
    id: 'h11',
    phase: 2,
    prompt: "What's your goal?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '🥳', label: "Make everyone laugh.", weights: { register: -0.8 }, style: 'broad' },      { id: 'b', emoji: '🤝', label: "Make one person laugh.", weights: { register: 0.6 }, style: 'intimate' },      { id: 'c', emoji: '🕊️', label: "Break tension.", style: 'social_glue' },      { id: 'd', emoji: '💬', label: "Keep conversation moving.", style: 'social_glue' },      { id: 'e', emoji: '🎁', label: "Surprise people.", weights: { absurdity: 0.6, irony: 0.4 }, style: 'surprise' },    ]
  },
  {
    id: 'h12',
    phase: 2,
    prompt: "If people laugh, what do you do?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '🛑', label: "Stop.", style: 'precise' },      { id: 'b', emoji: '📈', label: "Keep building.", weights: { absurdity: 0.4 }, style: 'escalator' },      { id: 'c', emoji: '🔥', label: "Double down.", weights: { absurdity: 0.6, edge: 0.3 }, style: 'escalator' },      { id: 'd', emoji: '↪️', label: "Change topics.", style: 'precise' },      { id: 'e', emoji: '😂', label: "Laugh too.", weights: { irony: -0.3 }, style: 'warm' },    ]
  },
  {
    id: 'h13',
    phase: 2,
    prompt: "Friends describe your humor as:",
    maxSelect: 3,
    options: [
      { id: 'a', emoji: '🏜️', label: "Dry.", weights: { register: 1.5 }, style: 'dry' },      { id: 'b', emoji: '😏', label: "Sarcastic.", weights: { irony: 1.2, register: 0.6 }, style: 'sarcastic' },      { id: 'c', emoji: '🎲', label: "Random.", weights: { absurdity: 1.5 }, style: 'chaos' },      { id: 'd', emoji: '🧩', label: "Clever.", weights: { craft: 1.5 }, style: 'clever' },      { id: 'e', emoji: '🌪️', label: "Chaotic.", weights: { absurdity: 1.5, register: -0.8 }, style: 'chaos' },      { id: 'f', emoji: '🔭', label: "Observational.", weights: { absurdity: -0.8, craft: 0.5 }, style: 'observational' },      { id: 'g', emoji: '😐', label: "Deadpan.", weights: { register: 1.8 }, style: 'deadpan' },      { id: 'h', emoji: '❓', label: "I don't know.", style: 'unknown' },    ]
  },
  {
    id: 'h14',
    phase: 2,
    prompt: "Which reaction do you get most?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '⏱️', label: "\"You always have the best timing.\"", weights: { register: 0.8 }, style: 'timing' },      { id: 'b', emoji: '💭', label: "\"I was thinking that!\"", weights: { absurdity: -0.6 }, style: 'observational' },      { id: 'c', emoji: '😳', label: "\"That was out of pocket.\"", weights: { edge: 1.2 }, style: 'edgy' },      { id: 'd', emoji: '⚡', label: "\"You're so quick.\"", weights: { craft: 0.6 }, style: 'quick' },      { id: 'e', emoji: '🕵️', label: "\"That was subtle.\"", weights: { register: 1.2, irony: 0.5 }, style: 'subtle' },    ]
  },
  {
    id: 'h15',
    phase: 2,
    prompt: "Which sentence sounds most like you?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '😐', label: "\"Well\u2026 that happened.\"", weights: { register: 1.2, irony: 0.4 }, style: 'deadpan' },      { id: 'b', emoji: '♟️', label: "\"Bold strategy.\"", weights: { irony: 1.0, craft: 0.5 }, style: 'sarcastic' },      { id: 'c', emoji: '🤨', label: "\"We're pretending this is normal?\"", weights: { absurdity: 0.8, irony: 0.8 }, style: 'meta' },      { id: 'd', emoji: '🤦', label: "\"This seemed smarter five minutes ago.\"", weights: { absurdity: 0.5, irony: 0.6 }, style: 'self_deprecating' },      { id: 'e', emoji: '🧐', label: "\"Interesting decision.\"", weights: { register: 1.0, irony: 0.8 }, style: 'dry' },    ]
  },
  {
    id: 'h16',
    phase: 3,
    prompt: "Which conversation role feels most natural?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '👀', label: "Observer.", weights: { register: 0.6 }, style: 'observer' },      { id: 'b', emoji: '😈', label: "Instigator.", weights: { absurdity: 0.5, edge: 0.3 }, style: 'instigator' },      { id: 'c', emoji: '📖', label: "Storyteller.", weights: { craft: 0.4 }, style: 'storyteller' },      { id: 'd', emoji: '🔥', label: "Roaster.", weights: { edge: 1.0, irony: 0.6 }, style: 'roaster' },      { id: 'e', emoji: '🗿', label: "Straight man.", weights: { register: 1.2, irony: -0.2 }, style: 'straight_man' },      { id: 'f', emoji: '🦎', label: "Chaos gremlin.", weights: { absurdity: 1.6, register: -1.0 }, style: 'chaos' },    ]
  },
  {
    id: 'h17',
    phase: 3,
    prompt: "Which joke lasts longest?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '💎', label: "One perfect line.", weights: { craft: 0.8, register: 0.5 }, style: 'precise' },      { id: 'b', emoji: '🏃', label: "Running bit.", weights: { absurdity: 0.6 }, style: 'running_bit' },      { id: 'c', emoji: '🔗', label: "Callback.", weights: { craft: 0.6, irony: 0.4 }, style: 'callback' },      { id: 'd', emoji: '📈', label: "Escalation.", weights: { absurdity: 1.0 }, style: 'escalator' },      { id: 'e', emoji: '🚫', label: "None.", style: 'unknown' },    ]
  },
  {
    id: 'h18',
    phase: 3,
    prompt: "Which do you notice first?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '😬', label: "Social awkwardness.", weights: { absurdity: -0.3, register: 0.3 } },      { id: 'b', emoji: '⚖️', label: "Contradictions.", weights: { craft: 0.6, irony: 0.5 } },      { id: 'c', emoji: '🎭', label: "Hypocrisy.", weights: { edge: 0.4, irony: 0.6 } },      { id: 'd', emoji: '🧮', label: "Bad logic.", weights: { craft: 1.0 } },      { id: 'e', emoji: '👽', label: "Weird behavior.", weights: { absurdity: 1.0 } },    ]
  },
  {
    id: 'h19',
    phase: 3,
    prompt: "Which compliment feels most accurate?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '😄', label: "You're funny.", weights: { register: -0.3 } },      { id: 'b', emoji: '🧠', label: "You're witty.", weights: { craft: 1.2 } },      { id: 'c', emoji: '⚡', label: "You're quick.", weights: { craft: 0.6, register: 0.3 } },      { id: 'd', emoji: '⏱️', label: "Your timing is incredible.", weights: { register: 1.0 } },      { id: 'e', emoji: '✨', label: "You make everything funnier.", weights: { absurdity: 0.3, irony: -0.2 } },    ]
  },
  {
    id: 'h20',
    phase: 3,
    prompt: "Which best describes your humor?",
    maxSelect: 2,
    options: [
      { id: 'a', emoji: '📋', label: "Planned.", weights: { craft: 0.5 }, style: 'planned' },      { id: 'b', emoji: '🎯', label: "Reactive.", style: 'reactive' },      { id: 'c', emoji: '🎭', label: "Character-based.", weights: { absurdity: 0.4, irony: 0.3 }, style: 'character' },      { id: 'd', emoji: '🔭', label: "Observational.", weights: { absurdity: -0.8 }, style: 'observational' },      { id: 'e', emoji: '🎲', label: "Improvised.", weights: { absurdity: 0.5 }, style: 'improvised' },    ]
  },
];
