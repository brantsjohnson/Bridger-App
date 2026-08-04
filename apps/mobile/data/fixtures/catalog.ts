// ============================================
// WHAT THIS FILE DOES (plain English):
// The fake people, events, stories, and signals used only when demo mode is
// on. Screens never import this file — they go through data/*.ts so swapping
// to the live API later does not rewrite the UI.
// ============================================
import type {
  EventItem,
  GrassSignal,
  InsideJoke,
  Person,
  Reaction,
  Story,
  Tier,
  UpcomingItem
} from '@bridger/shared';

export const ME: Person = {
  id: 'me',
  name: 'Sandra Kim',
  handle: '@sandra',
  emoji: '🌸',
  accent: 'pink',
  tier: 'close',
  label: 'Portland',
  mutuals: 0
};

export const PEOPLE: Person[] = [
  {
    id: 'maya',
    name: 'Maya Ortiz',
    handle: '@maya',
    emoji: '🌻',
    accent: 'amber',
    tier: 'close',
    label: 'Ceramics',
    mutuals: 12,
    story: 'unseen'
  },
  {
    id: 'devon',
    name: 'Devon Park',
    handle: '@devon',
    emoji: '🎧',
    accent: 'blue',
    tier: 'friend',
    label: 'Vinyl club',
    mutuals: 8,
    story: 'unseen'
  },
  {
    id: 'ines',
    name: 'Inès Aubert',
    handle: '@ines',
    emoji: '🌿',
    accent: 'teal',
    tier: 'friend',
    label: 'Trails',
    mutuals: 5,
    story: 'seen'
  },
  {
    id: 'theo',
    name: 'Theo Blake',
    handle: '@theo',
    emoji: '🌮',
    accent: 'coral',
    tier: 'acquaintance',
    label: 'Hot sauce',
    mutuals: 3
  },
  {
    id: 'nour',
    name: 'Nour Haddad',
    handle: '@nour',
    emoji: '📷',
    accent: 'purple',
    tier: 'acquaintance',
    label: 'Film photos',
    mutuals: 2
  },
  {
    id: 'kit',
    name: 'Kit Alvarez',
    handle: '@kit',
    emoji: '🚲',
    accent: 'green',
    tier: 'friend',
    label: 'Rides at 6',
    mutuals: 9,
    story: 'seen'
  }
];

export const STORIES: Story[] = [
  {
    id: 's1',
    authorId: 'maya',
    authorName: 'Maya',
    emoji: '🌻',
    accent: 'amber',
    prompt: 'Golden hour',
    postedAt: '2h',
    seen: false,
    segments: 3
  },
  {
    id: 's2',
    authorId: 'devon',
    authorName: 'Devon',
    emoji: '🎧',
    accent: 'blue',
    prompt: 'Crate dig',
    postedAt: '4h',
    seen: false,
    segments: 2
  },
  {
    id: 's3',
    authorId: 'kit',
    authorName: 'Kit',
    emoji: '🚲',
    accent: 'green',
    prompt: 'Morning loop',
    postedAt: '7h',
    seen: true,
    segments: 1
  },
  {
    id: 's4',
    authorId: 'ines',
    authorName: 'Inès',
    emoji: '🌿',
    accent: 'teal',
    prompt: 'Ridge line',
    postedAt: '9h',
    seen: true,
    segments: 2
  }
];

export const MY_STORY: Story = {
  id: 'mine',
  authorId: 'me',
  authorName: 'You',
  emoji: '🍞',
  accent: 'green',
  prompt: 'Bread day',
  postedAt: '3h',
  seen: true,
  segments: 2
};

/** Sample calendar — Hosting / Going / Invited so the Events tab looks full. */
export const EVENTS: EventItem[] = [
  {
    id: 'e1',
    title: 'Sketch night',
    emoji: '✏️',
    cover: { kind: 'emoji', value: '✏️' },
    accent: 'purple',
    day: 'Fri 31 Jul',
    time: '18:30',
    place: 'Rowan Park',
    goingIds: ['maya', 'devon', 'ines'],
    invitedIds: ['theo', 'nour', 'kit'],
    hostId: 'me',
    coHostIds: ['maya'],
    role: 'host',
    countdown: 'in 2 days',
    cap: 35
  },
  {
    id: 'e2',
    title: 'Sunrise ride',
    emoji: '🚲',
    cover: { kind: 'emoji', value: '🚲' },
    accent: 'green',
    day: 'Sat 1 Aug',
    time: '06:30',
    place: 'Waterfront',
    goingIds: ['kit', 'maya', 'me'],
    invitedIds: ['devon'],
    hostId: 'kit',
    role: 'going',
    countdown: 'in 3 days',
    cap: 35
  },
  {
    id: 'e3',
    title: 'Vinyl swap',
    emoji: '🎧',
    cover: { kind: 'emoji', value: '🎧' },
    accent: 'blue',
    day: 'Sun 2 Aug',
    time: '15:00',
    place: 'Devons place',
    goingIds: ['devon', 'nour'],
    invitedIds: ['me', 'maya', 'theo'],
    hostId: 'devon',
    role: 'invited',
    countdown: 'in 4 days',
    cap: 35
  }
];

export const FREE_SIGNALS: GrassSignal[] = [
  {
    id: 'fs1',
    personId: 'kit',
    when: 'Tonight',
    note: 'anything outside',
    what: 'Walking the loop at Rowan Park, then maybe tacos. No plan beyond that.',
    where: 'Rowan Park',
    inIds: ['maya'],
    audience: 'Friends',
    postedAt: '20m ago'
  },
  {
    id: 'fs2',
    personId: 'devon',
    when: 'Now',
    note: 'coffee, one hour',
    what: 'Sitting at Loop Café until about 4. Come sit, bring nothing.',
    where: 'Loop Café',
    inIds: [],
    audience: 'Close friends',
    postedAt: '1h ago'
  }
];

export const STORY_REPLIES: Reaction[] = [
  { id: 'x1', postId: 'sp1', authorId: 'devon', kind: 'text', text: 'that sky is unreal', at: '1h' },
  { id: 'x2', postId: 'sp1', authorId: 'kit', kind: 'circleVideo', at: '58m' },
  { id: 'x3', postId: 'sp1', authorId: 'ines', kind: 'sticker', stickerId: '🔥', at: '40m' },
  { id: 'x5', postId: 'sp1', authorId: 'nour', kind: 'text', text: 'the mug is coming along', at: '12m' }
];

export const NOTIFICATIONS: Array<{ id: string; personId: string; text: string; time: string }> = [
  { id: 'n1', personId: 'maya', text: 'replied to your story', time: '12m' },
  { id: 'n2', personId: 'nour', text: 'wants to connect', time: '1h' },
  { id: 'n3', personId: 'kit', text: 'is free tonight', time: '3h' }
];

export const COMING_UP: UpcomingItem[] = [
  { id: 'u1', kind: 'birthday', label: "Devon's birthday", when: 'Today', personId: 'devon' },
  { id: 'u2', kind: 'birthday', label: "Maya's birthday", when: 'Friday', personId: 'maya' },
  { id: 'u3', kind: 'note', label: "Maya's graduation", when: 'in 1 week', personId: 'maya' }
];

export const COOP_ANNOUNCEMENTS = [
  {
    id: 'ca1',
    title: 'Voting closes Sunday',
    body: 'Three things on the ballot for next quarter. One member, one vote.',
    action: 'Open the portal'
  },
  {
    id: 'ca2',
    title: "This quarter's books are up",
    body: 'Where every dollar of dues went, line by line.',
    action: 'See the numbers'
  }
];

export const WEEKLY_ACTIVITY = {
  id: 'act-band-tee',
  title: 'Band Tee Week',
  prompt: 'Your favorite band tee',
  closesIn: 'ends Sunday',
  accent: 'amber' as const,
  posts: [
    { id: 'ap1', personId: 'maya', emoji: '👕', caption: 'Thrifted in 2016' },
    { id: 'ap2', personId: 'kit', emoji: '🎸', caption: 'Still fits' },
    { id: 'ap3', personId: 'devon', emoji: '🥁', caption: 'Tour merch' },
    { id: 'ap4', personId: 'ines', emoji: '🎤', caption: 'Front row' },
    { id: 'ap5', personId: 'theo', emoji: '🎹', caption: "Dad's old one" }
  ]
};

export const QUIZ = {
  id: 'road-trip',
  title: 'Which road trip are you?',
  comparable: true,
  results: [
    {
      id: 'coastal',
      label: 'Coastal cruiser',
      accent: 'teal' as const,
      friendIds: ['maya', 'devon', 'ines']
    },
    {
      id: 'mountain',
      label: 'Mountain roamer',
      accent: 'amber' as const,
      friendIds: ['kit', 'nour']
    },
    {
      id: 'desert',
      label: 'Desert wanderer',
      accent: 'coral' as const,
      friendIds: ['theo']
    }
  ]
};

export type HomePoll = {
  id: string;
  kind: 'poll' | 'question';
  authorId: string;
  prompt: string;
  audience: string;
  myVote?: string;
  replies?: number;
  askedIds?: string[];
  options: Array<{ id: string; label: string; votes: number; voterIds?: string[] }>;
};

export const HOME_POLLS: HomePoll[] = [
  {
    id: 'p1',
    kind: 'poll',
    authorId: 'me',
    prompt: 'Best taco spot?',
    audience: 'Friends',
    askedIds: ['maya', 'devon', 'kit', 'ines', 'nour', 'theo'],
    options: [
      { id: 'o1', label: 'El Rey', votes: 3, voterIds: ['maya', 'devon', 'kit'] },
      { id: 'o2', label: 'La Playa', votes: 1, voterIds: ['ines'] },
      { id: 'o3', label: 'Nixta', votes: 1, voterIds: ['nour'] }
    ]
  }
];

// --- FRIENDS TAB FIXTURES ---
// Birthdays only appear when the friend shared theirs with your tier.

/** Birthday info from each friend's own shared attribute — never typed by you. */
export const BIRTHDAYS: Record<string, { date: string; today?: boolean; inDays: number }> = {
  maya: { date: 'Friday', inDays: 3 },
  devon: { date: 'Today', today: true, inDays: 0 }
};

/** Quotes friends wrote on sticky notes (about people / events). */
export const INSIDE_JOKES: InsideJoke[] = [
  {
    id: 'q1',
    text: 'She brought a thermos to a rave.',
    quotedId: 'devon',
    fromName: 'Devon',
    postedById: 'maya',
    postedAt: '2 days ago',
    accent: 'amber',
    taggedIds: ['maya'],
    eventName: 'Warehouse night'
  },
  {
    id: 'q2',
    text: 'Named her sourdough starter Bruce.',
    quotedId: 'maya',
    fromName: 'Maya',
    postedById: 'kit',
    postedAt: 'last week',
    accent: 'pink'
  },
  {
    id: 'q3',
    text: 'Can parallel park on the first try.',
    quotedId: 'kit',
    fromName: 'Kit',
    postedById: 'devon',
    postedAt: '3 weeks ago',
    accent: 'teal',
    taggedIds: ['devon', 'kit']
  }
];

/** Inside jokes that quote you (or that you wrote down). */
export const INSIDE_JOKES_BY_ME: InsideJoke[] = [
  {
    id: 'qm1',
    text: 'Bread is just a warm friend.',
    quotedId: 'me',
    fromName: 'You',
    postedById: 'ines',
    postedAt: '5 days ago',
    accent: 'green',
    eventName: 'Ramen crawl'
  },
  {
    id: 'qm2',
    text: 'I peaked at the spelling bee.',
    quotedId: 'me',
    fromName: 'You',
    postedById: 'me',
    postedAt: 'last month',
    accent: 'blue'
  }
];

/** One week of Friend Pod questions (same 5 for everyone). */
export type RecapWeek = {
  id: string;
  weekOf: string;
  questions: string[];
};

export type RecapAnswer = {
  weekId: string;
  authorId: string;
  questionIndex: number;
  audioUrl: string;
  duration: number;
  visibleToTier: Tier;
};

export const RECAP_WEEK: RecapWeek = {
  id: 'w31',
  weekOf: 'Week of 27 Jul',
  questions: [
    'High of the week?',
    'Best thing this week?',
    'What are you stuck on?',
    'Who did you see?',
    'Next week, one plan?'
  ]
};

const RECAP_SPEAKERS = ['ines', 'maya', 'devon', 'kit', 'nour'];

/** Roundtable order: everyone on Q1, then everyone on Q2, and so on. */
export const RECAP_ANSWERS: RecapAnswer[] = RECAP_WEEK.questions.flatMap((_, qi) =>
  RECAP_SPEAKERS.map((authorId, si) => ({
    weekId: RECAP_WEEK.id,
    authorId,
    questionIndex: qi,
    audioUrl: `bridger://recap/${RECAP_WEEK.id}/${authorId}/${qi}`,
    duration: 28 + ((si * 7 + qi * 5) % 18),
    visibleToTier: (si === 4 ? 'close' : 'friend') as Tier
  }))
);

/** Questions friends suggested for a future Friend Pod week. */
export const SUBMITTED_QUESTIONS = [
  { id: 'sq1', text: 'What made you laugh this week?', authorId: 'maya', votes: 6 },
  { id: 'sq2', text: 'Best thing you ate?', authorId: 'kit', votes: 4 }
];
