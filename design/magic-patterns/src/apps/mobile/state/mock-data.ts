import {
  ApprovalRequest,
  CatchUpItem,
  EventItem,
  Introduction,
  MeetSuggestion,
  Person,
  ProfileAttribute,
  BucketItem,
  GrassSignal,
  InsideJoke,
  Reaction,
  Story,
  StoryPost,
  Suggestion,
  ThemedPrompt } from
'../../../packages/shared';
import { Interest } from '../../../packages/ui';

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
    story: 'unseen',
    song: { title: 'Pink + White', artist: 'Frank Ocean' },
    book: { title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer' }
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
    story: 'unseen',
    song: { title: 'Pyramids', artist: 'Frank Ocean' },
    book: { title: 'The Overstory', author: 'Richard Powers' }
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
    story: 'seen',
    song: { title: 'Holocene', artist: 'Bon Iver' },
    book: { title: 'Bluets', author: 'Maggie Nelson' }
  },
  {
    id: 'theo',
    name: 'Theo Blake',
    handle: '@theo',
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
    name: 'Nour Haddad',
    handle: '@nour',
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
    name: 'Kit Alvarez',
    handle: '@kit',
    emoji: '🚲',
    accent: 'green',
    tier: 'friend',
    label: 'Rides at 6',
    mutuals: 9,
    story: 'seen',
    song: { title: 'Dreams', artist: 'Fleetwood Mac' },
    book: { title: 'Atomic Habits', author: 'James Clear' }
  }
];

export function personById(id: string): Person {
  return PEOPLE.find((p) => p.id === id) ?? ME;
}

/**
 * Every hobby carries a follow-up question and the person's answer.
 * This is what turns a matched label into something to actually talk about.
 */
export const HOBBY_FOLLOW_UPS: Record<string, {question: string;answer: string;}> = {
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
{ id: 'markets', label: 'Flea markets', emoji: '🛍️', accent: 'coral', shape: 3 }];


export const STORIES: Story[] = [
{ id: 's1', authorId: 'maya', authorName: 'Maya', emoji: '🌻', accent: 'amber', prompt: 'Golden hour', postedAt: '2h', seen: false, segments: 3 },
{ id: 's2', authorId: 'devon', authorName: 'Devon', emoji: '🎧', accent: 'blue', prompt: 'Crate dig', postedAt: '4h', seen: false, segments: 2 },
{ id: 's3', authorId: 'kit', authorName: 'Kit', emoji: '🚲', accent: 'green', prompt: 'Morning loop', postedAt: '7h', seen: true, segments: 1 },
{ id: 's4', authorId: 'ines', authorName: 'Inès', emoji: '🌿', accent: 'teal', prompt: 'Ridge line', postedAt: '9h', seen: true, segments: 2 }];


/** Your own story, so the tray always has your day in it. */
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

export const EVENTS: EventItem[] = [
{
  id: 'e1',
  title: 'Sketch night',
  emoji: '✏️',
  cover: {
    kind: 'photo',
    url: "/3778bfc4-24f0-49a3-aeab-2c565d243068.jpg"
  },
  accent: 'purple',
  day: 'Fri 31 Jul',
  time: '18:30',
  place: 'Rowan Park',
  address: '1400 NE Rowan Ave, shelter #3 (by the tennis courts)',
  goingIds: ['maya', 'devon', 'ines', 'kit'],
  invitedIds: ['theo', 'nour', 'kit', 'jordyn'],
  /** Who invited whom (null/missing = host). Host planning only. */
  inviteByIds: {
    ines: 'maya',
    jordyn: 'kit'
  },
  hostId: 'me',
  coHostIds: ['maya'],
  role: 'host',
  countdown: 'in 2 days',
  bio: 'Pens, paper, no pressure. Bring a sketchbook if you have one.',
  bring: 'A sketchbook',
  chipInHandle: '@sandra-k',
  chipInAmount: '$5',
  chipInMethod: 'Venmo',
  chipInNote: 'Covers paper and a few spare pencils. Skip it if money is tight.',
  allowFriendsToInvite: true,
  cap: 35
},
{
  id: 'e2',
  title: 'Ramen crawl',
  emoji: '🍜',
  cover: { kind: 'emoji', value: '🍜' },
  accent: 'coral',
  day: 'Sat 01 Aug',
  time: '19:00',
  place: 'East side',
  address: 'Meet at Kettle Ramen, 219 SE 9th — we walk from there',
  goingIds: ['theo', 'maya'],
  invitedIds: ['devon'],
  hostId: 'theo',
  role: 'going',
  going: true,
  countdown: 'in 3 days',
  bio: 'Four shops, one night, one bowl split at each. We walk between them so wear something you can eat a lot in.',
  bring: 'Cash for splitting',
  chipInHandle: '@theo-b',
  chipInAmount: '$20',
  chipInMethod: 'Venmo',
  chipInNote: 'Rough cost of four split bowls. Settle up at the end if it comes in under.',
  cap: 35
},
{
  id: 'e3',
  title: 'Vinyl swap',
  emoji: '💿',
  accent: 'blue',
  day: 'Sun 02 Aug',
  time: '11:00',
  place: 'Loop Café',
  address: '82 Alberta St, back room — ring the bell if the door is shut',
  goingIds: ['devon', 'nour'],
  invitedIds: ['kit', 'ines', 'maya'],
  hostId: 'devon',
  coHostIds: ['nour'],
  role: 'invited',
  countdown: 'in 4 days',
  bio: 'Bring three records, leave with three records. Nothing precious — this is for the ones you have played twice. There is a turntable so we can hear anything before we trade.',
  bring: 'Records to trade',
  chipInHandle: '@devon-p',
  chipInAmount: '$4',
  chipInMethod: 'Cash App',
  chipInNote: 'Room rental split between everyone who comes. Cash is fine too.',
  cap: 35
}];


export const MEET_SUGGESTIONS: MeetSuggestion[] = [
{ personId: 'nour', thread: 'You both shoot film', status: 'going' },
{ personId: 'kit', thread: 'Same morning loop', status: 'invited' }];


export const INTRODUCTIONS: Introduction[] = [
{ a: 'maya', b: 'kit', why: 'Both ceramics + bikes' },
{ a: 'devon', b: 'nour', why: 'Both crate diggers' }];


export const SHARED_ALLERGIES = ['Peanuts (Maya)', 'Shellfish (Kit)'];

/** Now-playing style block in the Catch-Up. */
export const CURRENTLY = {
  listening: { title: 'Blue Rev', artist: 'Alvvays', emoji: '💿' },
  reading: { title: 'Piranesi', author: 'Susanna Clarke', emoji: '📖' }
};

/**
 * The week, as a photo per day. This is the thing people actually come back
 * for, so each day leads with a near-full-width square photo, the day name
 * large above it, and the caption underneath — not a subtle list row.
 */
export const WEEK_DAYS = [
{
  day: 'Sunday',
  note: 'Long walk',
  caption: 'Walked the whole river loop for no reason. Got a coffee at the end.',
  emoji: '🌤',
  accent: 'green' as const,
  photo: "/2452ce1e-723b-4046-9d65-dfa84d3f3354.jpg"
},
{
  day: 'Monday',
  note: 'Studio day',
  caption: 'Threw four mugs, kept two. The other two are now a lesson.',
  emoji: '🏺',
  accent: 'amber' as const,
  photo: "/082be9be-3b79-4d05-8803-62b07df48bfe.jpg"
},
{
  day: 'Tuesday',
  note: 'Rained out',
  caption: 'Ride cancelled. Sat by the window instead and did not hate it.',
  emoji: '🌧',
  accent: 'blue' as const,
  photo: "/9de9265e-822b-4e31-9252-240b38ca3192.jpg"
},
{
  day: 'Thursday',
  note: 'Ramen with Kit',
  caption: 'Kit picked the spicy one and regretted it out loud for an hour.',
  emoji: '🍜',
  accent: 'coral' as const,
  photo: "/34ac4edd-4101-4207-9134-ed0d82c19f6d.jpg"
}];


export const POLL_RESULTS: Record<string, number[]> = {
  c1: [62, 38]
};

export const SUGGESTIONS: Suggestion[] = [
{ id: 'g1', personId: 'nour', viaFriendId: 'devon', sharedThread: 'You both shoot film', signals: ['Film', 'Morning runs', 'Been to Japan'], accent: 'purple', bothOptedIn: true },
{ id: 'g2', personId: 'kit', viaFriendId: 'ines', sharedThread: 'Same morning loop', signals: ['Morning runs', 'Cyclocross'], accent: 'green', bothOptedIn: true },
{ id: 'g3', personId: 'theo', viaFriendId: 'maya', sharedThread: 'Chili tolerance: high', signals: ['Ramen', 'Night markets', 'Hot sauce'], accent: 'coral', bothOptedIn: true }];


export const REQUESTS: ApprovalRequest[] = [
{ id: 'r1', personId: 'nour', viaFriendId: 'devon', createdAt: '1d' },
{ id: 'r2', personId: 'theo', viaFriendId: 'maya', createdAt: '3d' }];


export const THEMED_PROMPTS: ThemedPrompt[] = [
{ slug: 'ootd', label: 'OOTD', icon: '👕' },
{ slug: 'take-05', label: 'Take 0.5', icon: '🤳' },
{ slug: 'hot-take', label: 'Hot take', icon: '🌶️' }];


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
  caption: 'Split it with Kit.',
  createdAt: '1h'
}];


export const STORY_REPLIES: Reaction[] = [
{ id: 'x1', postId: 'sp1', authorId: 'devon', kind: 'text', text: 'that sky is unreal', at: '1h' },
{ id: 'x2', postId: 'sp1', authorId: 'kit', kind: 'circleVideo', at: '58m' },
{ id: 'x3', postId: 'sp1', authorId: 'ines', kind: 'sticker', stickerId: '🔥', at: '40m' },
{ id: 'x4', postId: 'sp1', authorId: 'theo', kind: 'text', text: 'where is this', parentReactionId: 'x1', at: '32m' },
{ id: 'x5', postId: 'sp1', authorId: 'nour', kind: 'text', text: 'the mug is coming along', at: '12m' }];


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
  detail: 'Thu 20:00 · Maya\u2019s place',
  accent: 'teal',
  emoji: '🎲',
  /* the same cover art the event wears everywhere else */
  cover: { kind: 'photo', url: "/3778bfc4-24f0-49a3-aeab-2c565d243068.jpg" },
  /** minutes until it starts, for the live countdown after you say yes */
  startsInMinutes: 2 * 24 * 60 + 137
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
}];


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
}];


export const NOTIFICATIONS: Array<{
  id: string;
  personId: string;
  text: string;
  time: string;
}> = [
{ id: 'n1', personId: 'maya', text: 'replied to your story', time: '12m' },
{ id: 'n2', personId: 'nour', text: 'wants to connect', time: '1h' },
{ id: 'n3', personId: 'kit', text: 'is free tonight', time: '3h' }];


/** Sample of the one core type — a fact tagged twice. */
export const MY_ATTRIBUTES: ProfileAttribute[] = [
{ id: 'a1', ownerId: 'me', key: 'favorite_candy', value: 'Sour cherries', layer: 'profile', visibleToTier: 'friend', matchable: true, updatedAt: '2026-07-01' },
{ id: 'a2', ownerId: 'me', key: 'love_language', value: 'Acts of service', layer: 'connection', visibleToTier: 'none', matchable: true, updatedAt: '2026-07-04' },
{ id: 'a3', ownerId: 'me', key: 'city', value: 'Portland', layer: 'essential', visibleToTier: 'acquaintance', matchable: true, updatedAt: '2026-06-20' },
{ id: 'a4', ownerId: 'me', key: 'currently_reading', value: 'Piranesi', layer: 'profile', visibleToTier: 'close', matchable: false, updatedAt: '2026-07-28' }];


/** The hosted weekly activity — everyone posts to one shared collage. */
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
  { id: 'ap5', personId: 'theo', emoji: '🎹', caption: 'Dad\u2019s old one' }]

};

/** Profile card content — the same shape drives your card and a friend's. */
export const PROFILE_CURRENTLY = {
  listening: { title: 'Blue Rev', artist: 'Alvvays', emoji: '💿' },
  reading: { title: 'Piranesi', author: 'Susanna Clarke', emoji: '📖' },
  song: { title: 'Archie, Marry Me', artist: 'Alvvays' }
};

export const PLACES = [
{ id: 'pl1', label: 'Lisbon', note: 'Ate custard tarts daily', lat: 38.7223, lng: -9.1393, countryCode: 'PT', emoji: '🥮', year: '2023' },
{ id: 'pl2', label: 'Oaxaca', note: 'Mezcal + markets', lat: 17.0732, lng: -96.7266, countryCode: 'MX', emoji: '🌶', year: '2022' },
{ id: 'pl3', label: 'Reykjavík', note: 'Saw the lights', lat: 64.1466, lng: -21.9426, countryCode: 'IS', emoji: '🌌', year: '2024' },
{ id: 'pl4', label: 'Kyoto', note: 'Temple mornings', lat: 35.0116, lng: 135.7681, countryCode: 'JP', emoji: '⛩', year: '2019' },
{ id: 'pl5', label: 'Banff', note: 'Cold lake swim', lat: 51.1784, lng: -115.5708, countryCode: 'CA', emoji: '🏔', year: '2021' }];


/**
 * You and a friend have both been somewhere. Your photos from that place
 * surface together. A co-op feature, because photos are the expressive layer.
 */
export const SHARED_PLACES = [
{
  id: 'sp1',
  place: 'Lisbon',
  yours: { emoji: '🥮', caption: 'Belém, 8am', accent: 'amber' as const },
  theirs: { emoji: '🚋', caption: 'Tram 28', accent: 'teal' as const }
},
{
  id: 'sp2',
  place: 'Kyoto',
  yours: { emoji: '⛩', caption: 'Fushimi Inari', accent: 'coral' as const },
  theirs: { emoji: '🍡', caption: 'Nishiki market', accent: 'pink' as const }
}];


/** "Both" is a first-class answer. Plenty of people genuinely are. */
export const THIS_OR_THAT = [
{ id: 't1', a: 'Coffee', b: 'Tea', pick: 'a' as const, emoji: '☕' },
{ id: 't2', a: 'Beach', b: 'Mountain', pick: 'b' as const, emoji: '⛰' },
{ id: 't3', a: 'Early', b: 'Late', pick: 'both' as const, emoji: '🌙' },
{ id: 't4', a: 'Call', b: 'Text', pick: 'b' as const, emoji: '💬' },
{ id: 't5', a: 'Sweet', b: 'Salty', pick: 'both' as const, emoji: '🍬' },
{ id: 't6', a: 'Plan', b: 'Wing it', pick: 'a' as const, emoji: '🗓' }];


export const ABOUT_ME_FIELDS = [
{ id: 'ab1', key: 'Hometown', value: 'Missoula, MT', tier: 'acquaintance' as const },
{ id: 'ab2', key: 'Lives in', value: 'Portland, OR', tier: 'acquaintance' as const },
{ id: 'ab3', key: 'Work', value: 'Studio potter', tier: 'friend' as const },
{ id: 'ab4', key: 'Birthday', value: 'March 4', tier: 'friend' as const },
{ id: 'ab5', key: 'Allergies', value: 'Peanuts', tier: 'close' as const },
{ id: 'ab6', key: 'Love language', value: 'Acts of service', tier: 'close' as const }];


export const FAVS: Array<{
  group: string;
  emoji: string;
  items: string[];
  total: number;
}> = [
{ group: 'Food', emoji: '🍜', items: ['Tonkotsu ramen', 'Sour cherries', 'Burnt cheesecake', 'Green curry'], total: 22 },
{ group: 'Entertainment', emoji: '🎬', items: ['Paddington 2', 'Fleabag', 'Columbo', 'Perfect Days'], total: 30 },
{ group: 'Everyday', emoji: '🧺', items: ['Sunday laundry', 'Long walks', 'Library holds'], total: 12 },
{ group: 'Sports', emoji: '🚲', items: ['Track cycling', 'Bouldering'], total: 6 }];


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
}];


/** Profile-only module. Solo wants and things to do with specific people. */
export const BUCKET_LIST: BucketItem[] = [
{ id: 'b1', text: 'Learn to surf', withIds: [], done: false, isPrivate: false },
{ id: 'b2', text: 'Hike the Inca Trail', withIds: ['maya', 'devon'], done: false, isPrivate: false },
{ id: 'b3', text: 'See the northern lights', withIds: ['kit'], done: false, isPrivate: true },
{ id: 'b4', text: 'Swim in the Adriatic', withIds: [], done: true, isPrivate: false }];


/**
 * Friends broadcasting that they're free. Home shows only the newest one;
 * the full list lives under the touch grass button on Events, where each one
 * opens for the detail you'd otherwise have to text and ask for.
 */
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
},
{
  id: 'fs3',
  personId: 'ines',
  when: 'This weekend',
  note: 'ridge hike, early',
  what: 'Driving up for the ridge trail around 7am. Two seats in the car.',
  where: 'Ridge trailhead',
  inIds: ['nour', 'theo'],
  audience: 'Friends',
  postedAt: '3h ago'
}];


export const QUIZ = {
  id: 'road-trip',
  title: 'Which road trip are you?',
  comparable: true,
  questions: [
  { id: 'q1', text: 'Pick a soundtrack', options: ['Surf rock', 'Folk', 'Synth'] },
  { id: 'q2', text: 'Pick a stop', options: ['Diner', 'Trailhead', 'Hot spring'] },
  { id: 'q3', text: 'Pick a window seat', options: ['Ocean', 'Peaks', 'Open road'] }],

  results: [
  { id: 'coastal', label: 'Coastal cruiser', accent: 'teal' as const, friendIds: ['maya', 'devon', 'ines'] },
  { id: 'mountain', label: 'Mountain roamer', accent: 'amber' as const, friendIds: ['kit', 'nour'] },
  { id: 'desert', label: 'Desert wanderer', accent: 'coral' as const, friendIds: ['theo'] }]

};

/** Cutout stickers saved to your tray — reusable on any cover. */
export const SAVED_STICKERS = [
{
  id: 'st1',
  label: 'Biscuit',
  url: "/de0f24dd-5a1a-4ec5-9077-533ed300af2b.jpg"
},
{
  id: 'st2',
  label: 'Maya',
  url: "/b72d3d5b-4b81-4f5b-9fcd-51f7c2f64c4b.jpg"
},
{
  id: 'st3',
  label: 'Guitar',
  url: "/3fe337b9-635c-4959-b6a4-a0b02b2cd53e.jpg"
}];


export const EVENT_BANNER = "/3778bfc4-24f0-49a3-aeab-2c565d243068.jpg";


export const COMMONALITIES = [
{ key: 'c1', label: 'Both at the Kettle open mic', strongest: true },
{ key: 'c2', label: 'Same quiz result: Lighthouse' },
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
}];