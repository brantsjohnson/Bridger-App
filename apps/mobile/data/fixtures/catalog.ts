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
  Introduction,
  MeetSuggestion,
  Person,
  Reaction,
  Story,
  Tier,
  UpcomingItem
} from '@bridger/shared';

export const ME: Person = {
  id: 'me',
  name: 'Brant Johnson',
  handle: '@brant',
  emoji: '🌸',
  accent: 'pink',
  tier: 'close',
  label: 'Portland',
  mutuals: 0,
  // Demo: you have a live update today — ring shows on your Profile photo.
  story: 'unseen'
};

export const PEOPLE: Person[] = [
  {
    id: 'maya',
    name: 'Jade Watkins',
    handle: '@jade',
    emoji: '🌻',
    accent: 'amber',
    tier: 'close',
    label: 'Ceramics',
    mutuals: 12,
    story: 'unseen',
    song: { title: 'Pink + White', artist: 'Frank Ocean' },
    book: { title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer' }
  },
  {
    id: 'devon',
    name: 'Kelton Burns',
    handle: '@kelton',
    emoji: '🎧',
    accent: 'blue',
    tier: 'friend',
    label: 'Vinyl club',
    mutuals: 8,
    story: 'unseen',
    song: { title: 'Pyramids', artist: 'Frank Ocean' },
    book: { title: 'The Overstory', author: 'Richard Powers' }
  },
  {
    id: 'ines',
    name: 'Janna Allred',
    handle: '@janna',
    emoji: '🌿',
    accent: 'teal',
    tier: 'friend',
    label: 'Trails',
    mutuals: 5,
    story: 'seen',
    song: { title: 'Holocene', artist: 'Bon Iver' },
    book: { title: 'Bluets', author: 'Maggie Nelson' }
  },
  {
    id: 'theo',
    name: 'Ben Chamberlin',
    handle: '@ben',
    emoji: '🌮',
    accent: 'coral',
    tier: 'acquaintance',
    label: 'Hot sauce',
    mutuals: 3,
    song: { title: 'Levitating', artist: 'Dua Lipa' },
    book: { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin' }
  },
  {
    id: 'nour',
    name: 'Ceci Sumsion',
    handle: '@ceci',
    emoji: '📷',
    accent: 'purple',
    tier: 'acquaintance',
    label: 'Film photos',
    mutuals: 2,
    song: { title: 'Motion Picture Soundtrack', artist: 'Radiohead' },
    book: { title: 'Stoner', author: 'John Williams' }
  },
  {
    id: 'kit',
    name: 'Levi Williams',
    handle: '@levi',
    emoji: '🚲',
    accent: 'green',
    tier: 'friend',
    label: 'Rides at 6',
    mutuals: 9,
    story: 'seen',
    song: { title: 'Dreams', artist: 'Fleetwood Mac' },
    book: { title: 'Atomic Habits', author: 'James Clear' }
  },
  {
    id: 'jordyn',
    name: 'Jordyn Bristol',
    handle: '@jordyn',
    emoji: '✨',
    accent: 'pink',
    tier: 'friend',
    label: 'Weekend plans',
    mutuals: 4,
    story: 'unseen',
    song: { title: 'Good Days', artist: 'SZA' },
    book: { title: 'Circe', author: 'Madeline Miller' }
  }
];

export const STORIES: Story[] = [
  {
    id: 's1',
    authorId: 'maya',
    authorName: 'Jade',
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
    authorName: 'Kelton',
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
    authorName: 'Levi',
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
    authorName: 'Janna',
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
    cover: { kind: 'emoji', value: '✏️', bg: '#9B5DE5' },
    accent: 'purple',
    day: 'Fri 31 Jul',
    time: '18:30',
    place: 'Rowan Park',
    address: '120 Rowan Park Rd',
    bio: 'Pens, paper, no pressure. Bring a sketchbook if you have one.',
    goingIds: ['maya', 'devon', 'ines', 'kit'],
    invitedIds: ['theo', 'nour', 'kit', 'jordyn'],
    /** Guest-of-guest via bring-a-friend (host planning only) */
    broughtIds: ['jordyn'],
    hostId: 'me',
    coHostIds: ['maya'],
    role: 'host',
    countdown: 'in 2 days',
    cap: 35,
    allowFriendsToInvite: true,
    remindDay: true,
    remindHours: true,
    chipInAmount: '$5',
    chipInMethod: 'Venmo',
    chipInHandle: '@maya-r',
    chipInNote: 'for snacks',
    assignments: [
      { id: 'a1', label: 'Extra pens', assigneeId: 'maya' },
      { id: 'a2', label: 'Blank paper pack', assigneeId: undefined },
      { id: 'a3', label: 'Bluetooth speaker', assigneeId: 'me', done: false }
    ]
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
    place: "Kelton's place",
    goingIds: ['devon', 'nour'],
    invitedIds: ['me', 'maya', 'theo'],
    hostId: 'devon',
    role: 'invited',
    countdown: 'in 4 days',
    cap: 35
  }
];

// --- WHO YOU SHOULD MEET at events (demo) ---
// Friends-of-friends at an event you are hosting or going to. Shown on the
// Home "This week" event tile next to friends who are already coming.
export const MEET_SUGGESTIONS: MeetSuggestion[] = [
  { personId: 'nour', thread: 'You both shoot film', status: 'invited' },
  { personId: 'kit', thread: 'Same morning loop', status: 'going' },
  { personId: 'theo', thread: 'Both at the Kettle open mic', status: 'invited' }
];

/** Host Introductions for Sketch night — pairs among invited + going. */
export const EVENT_INTRODUCTIONS: Record<string, Introduction[]> = {
  e1: [
    { a: 'devon', b: 'nour', why: 'Both shoot film' },
    { a: 'maya', b: 'theo', why: 'Both at the Kettle open mic' },
    { a: 'ines', b: 'kit', why: 'Same morning loop' }
  ]
};

export const FREE_SIGNALS: GrassSignal[] = [
  {
    id: 'fs1',
    personId: 'kit',
    when: 'Tonight',
    note: 'walk the loop, then tacos',
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
    note: 'coffee at Loop Café',
    what: 'Sitting at Loop Café until about 4. Come sit, bring nothing.',
    where: 'Loop Café',
    inIds: [],
    audience: 'Close friends',
    postedAt: '1h ago'
  }
];

/** Replies to *your* update (Home "What people said"). postId matches STORY_POSTS for me. */
export const STORY_REPLIES: Reaction[] = [
  { id: 'x1', postId: 'sp-me-1', authorId: 'devon', kind: 'text', text: 'that sky is unreal', at: '1h' },
  { id: 'x2', postId: 'sp-me-1', authorId: 'kit', kind: 'circleVideo', at: '58m' },
  { id: 'x3', postId: 'sp-me-1', authorId: 'ines', kind: 'sticker', stickerId: '🔥', at: '40m' },
  { id: 'x5', postId: 'sp-me-1', authorId: 'nour', kind: 'text', text: 'the mug is coming along', at: '12m' }
];

export const NOTIFICATIONS: Array<{
  id: string;
  kind:
    | 'story_reply'
    | 'connect_request'
    | 'touch_grass_signal'
    | 'recap_reaction'
    | 'mutual_connection'
    | 'event_invite';
  personId: string;
  text: string;
  time: string;
  unread?: boolean;
  target?: {
    authorId?: string;
    requestId?: string;
    signalId?: string;
    eventId?: string;
    personId?: string;
  };
}> = [
  {
    id: 'n1',
    kind: 'story_reply',
    personId: 'maya',
    text: 'replied to your story',
    time: '12m',
    unread: true,
    target: { authorId: 'me' }
  },
  {
    id: 'n2',
    kind: 'connect_request',
    personId: 'nour',
    text: 'wants to connect',
    time: '1h',
    unread: true,
    target: { requestId: 'r1', personId: 'nour' }
  },
  {
    id: 'n3',
    kind: 'touch_grass_signal',
    personId: 'kit',
    text: 'is free tonight',
    time: '3h',
    unread: true,
    target: { signalId: 'tg-kit', personId: 'kit' }
  }
];

export const COMING_UP: UpcomingItem[] = [
  // Row color = friend's circle (green Close / blue Friends / orange Acquaintances).
  // personIds still match the catalog ids (maya = Jade, devon = Kelton).
  // Weekday chips omit daysUntil so sort uses today's calendar.
  { id: 'u1', kind: 'birthday', label: "Kelton's birthday", when: 'Today', personId: 'devon', daysUntil: 0 },
  { id: 'u2', kind: 'birthday', label: "Jade's birthday", when: 'Friday', personId: 'maya' },
  { id: 'u3', kind: 'note', label: "Jade's graduation", when: 'in 7 days', personId: 'maya', daysUntil: 7 }
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
  emoji: '👕',
  // Cover fills the Home card the same way event covers do.
  cover: { kind: 'emoji' as const, value: '👕', bg: '#FFB515' },
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
  description: 'Pick your vibe and see who matches.',
  comparable: true,
  cover: { kind: 'emoji' as const, value: '🧭', bg: '#4D96FF' },
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
    fromName: 'Kelton',
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
    fromName: 'Jade',
    postedById: 'kit',
    postedAt: 'last week',
    accent: 'pink'
  },
  {
    id: 'q3',
    text: 'Can parallel park on the first try.',
    quotedId: 'kit',
    fromName: 'Levi',
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
