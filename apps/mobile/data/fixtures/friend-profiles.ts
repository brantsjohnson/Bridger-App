// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake card data for each roster person, so opening a friend profile shows a
// real "About them" tab instead of empty sections. Varied from the own-profile
// fixtures so each person feels distinct. Screens never import this — they go
// through getPersonProfile in data/profile.ts.
// ============================================
import type {
  AboutField,
  FavGroup,
  Interest,
  ThisOrThatRow,
  TravelPlace
} from './profile';

export type FriendProfile = {
  about: AboutField[];
  hobbies: Interest[];
  /** Follow-up Q&A keyed by hobby id — what the hobbies widget peeks at. */
  hobbyFollowUps?: Record<string, { question: string; answer: string }>;
  favs: FavGroup[];
  thisOrThat: ThisOrThatRow[];
  places: TravelPlace[];
  header: {
    city: string;
    bio: string;
    song: { title: string; artist: string };
    book?: { title: string; author: string };
  };
};

/** Jade Watkins — close friend, ceramics + trails. */
const MAYA: FriendProfile = {
  header: {
    city: 'Portland, OR',
    bio: 'Clay under the nails. Always packing snacks for the trail.',
    song: { title: 'Pink + White', artist: 'Frank Ocean' },
    book: { title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer' }
  },
  about: [
    { id: 'm-ab1', key: 'Hometown', value: 'Bend, OR', tier: 'acquaintance' },
    { id: 'm-ab2', key: 'Lives in', value: 'Portland, OR', tier: 'acquaintance' },
    { id: 'm-ab3', key: 'Work', value: 'Studio potter', tier: 'friend' },
    { id: 'm-ab4', key: 'Birthday', value: 'June 12', tier: 'friend' },
    { id: 'm-ab5', key: 'Allergies', value: 'Shellfish', tier: 'close' }
  ],
  hobbies: [
    { id: 'pottery', label: 'Pottery', emoji: '🏺', accent: 'coral', shape: 0, tier: 'acquaintance' },
    { id: 'hiking', label: 'Hiking', emoji: '🥾', accent: 'teal', shape: 1, tier: 'acquaintance' },
    { id: 'gardening', label: 'Gardening', emoji: '🌱', accent: 'green', shape: 2, tier: 'friend' },
    { id: 'cooking', label: 'Cooking', emoji: '🍳', accent: 'amber', shape: 3, tier: 'friend' }
  ],
  hobbyFollowUps: {
    pottery: { question: 'Favorite thing you have made?', answer: 'A wonky mug that somehow pours' },
    hiking: { question: 'Favorite place to hike?', answer: 'Dog Mountain in the spring' },
    gardening: { question: "What's in your garden?", answer: 'Tomatoes and too many herbs' },
    cooking: { question: "What's your signature dish?", answer: 'Shakshuka for a crowd' }
  },
  favs: [
    {
      group: 'Food',
      emoji: '🍜',
      items: ['Miso soup', 'Heirloom tomatoes', 'Sourdough'],
      total: 14
    },
    {
      group: 'Entertainment',
      emoji: '🎬',
      items: ['The Bear', 'Studio Ghibli', 'Phantom Thread'],
      total: 18
    }
  ],
  thisOrThat: [
    { id: 'm-t1', a: 'Morning person', b: 'Night person', pick: 'a', emoji: '🌙' },
    { id: 'm-t2', a: 'Host', b: 'Guest', pick: 'a', emoji: '🏠' },
    { id: 'm-t3', a: 'Cozy night in', b: 'Night out', pick: 'a', emoji: '🛋' },
    { id: 'm-t4', a: 'Road trip', b: 'Flight', pick: 'a', emoji: '✈️' }
  ],
  places: [
    { id: 'm-p1', label: 'Oaxaca', note: 'Clay markets', x: 38, y: 66, emoji: '🌶', year: '2023' },
    { id: 'm-p2', label: 'Banff', note: 'Cold lake swim', x: 18, y: 30, emoji: '🏔', year: '2022' },
    { id: 'm-p3', label: 'Lisbon', note: 'Tile hunting', x: 22, y: 48, emoji: '🟦', year: '2024' }
  ]
};

/** Kelton Burns — friend, vinyl + night owl. */
const DEVON: FriendProfile = {
  header: {
    city: 'Portland, OR',
    bio: 'Record store Saturdays. Looking for the next listen.',
    song: { title: 'Pyramids', artist: 'Frank Ocean' },
    book: { title: 'The Overstory', author: 'Richard Powers' }
  },
  about: [
    { id: 'd-ab1', key: 'Hometown', value: 'Seattle, WA', tier: 'acquaintance' },
    { id: 'd-ab2', key: 'Lives in', value: 'Portland, OR', tier: 'acquaintance' },
    { id: 'd-ab3', key: 'Work', value: 'Audio engineer', tier: 'friend' },
    { id: 'd-ab4', key: 'Birthday', value: 'November 2', tier: 'close' }
  ],
  hobbies: [
    {
      id: 'vinyl-collecting',
      label: 'Vinyl collecting',
      emoji: '💿',
      accent: 'purple',
      shape: 0,
      tier: 'acquaintance'
    },
    {
      id: 'going-to-concerts',
      label: 'Going to concerts',
      emoji: '🎟',
      accent: 'pink',
      shape: 1,
      tier: 'friend'
    },
    { id: 'coffee', label: 'Coffee', emoji: '☕️', accent: 'amber', shape: 2, tier: 'acquaintance' },
    {
      id: 'photography',
      label: 'Photography',
      emoji: '📷',
      accent: 'blue',
      shape: 3,
      tier: 'friend'
    }
  ],
  hobbyFollowUps: {
    'vinyl-collecting': { question: 'Favorite vinyl you own?', answer: 'Blue Rev, first press' },
    'going-to-concerts': { question: "Best artist you've ever seen?", answer: 'Thundercat, tiny room' },
    coffee: { question: "What's your coffee order?", answer: 'Oat flat white, always' },
    photography: { question: 'What style of photography do you shoot?', answer: 'Night streets' }
  },
  favs: [
    {
      group: 'Entertainment',
      emoji: '🎬',
      items: ['Twin Peaks', 'Columbo', 'Perfect Days'],
      total: 22
    },
    { group: 'Everyday', emoji: '🧺', items: ['Late-night diner coffee', 'Thrift runs'], total: 8 }
  ],
  thisOrThat: [
    { id: 'd-t1', a: 'Morning person', b: 'Night person', pick: 'b', emoji: '🌙' },
    { id: 'd-t2', a: 'Movies', b: 'TV shows', pick: 'both', emoji: '🎬' },
    { id: 'd-t3', a: 'Rewatch', b: 'Watch new', pick: 'a', emoji: '🔄' }
  ],
  places: [
    { id: 'd-p1', label: 'Tokyo', note: 'Record hunting in Shimokitazawa', x: 82, y: 42, emoji: '🎶', year: '2023' },
    { id: 'd-p2', label: 'Berlin', note: 'Three clubs, one night', x: 52, y: 28, emoji: '🪩', year: '2019' }
  ]
};

/** Janna Allred — friend, trails. */
const INES: FriendProfile = {
  header: {
    city: 'Hood River, OR',
    bio: 'Up before the sun. Trails first, texts later.',
    song: { title: 'Holocene', artist: 'Bon Iver' },
    book: { title: 'Bluets', author: 'Maggie Nelson' }
  },
  about: [
    { id: 'i-ab1', key: 'Hometown', value: 'Boise, ID', tier: 'acquaintance' },
    { id: 'i-ab2', key: 'Lives in', value: 'Hood River, OR', tier: 'acquaintance' },
    { id: 'i-ab3', key: 'Work', value: 'Park ranger', tier: 'friend' },
    { id: 'i-ab4', key: 'Pets', value: 'A very muddy dog named Moss', tier: 'friend' }
  ],
  hobbies: [
    { id: 'hiking', label: 'Hiking', emoji: '🥾', accent: 'teal', shape: 0, tier: 'acquaintance' },
    { id: 'camping', label: 'Camping', emoji: '⛺️', accent: 'green', shape: 1, tier: 'friend' },
    { id: 'running', label: 'Running', emoji: '🏃‍♂️', accent: 'coral', shape: 2, tier: 'friend' },
    { id: 'dogs', label: 'Dogs', emoji: '🐕', accent: 'amber', shape: 3, tier: 'acquaintance' }
  ],
  favs: [
    {
      group: 'Food',
      emoji: '🍜',
      items: ['Trail mix', 'Campfire chili', 'Huckleberries'],
      total: 10
    },
    { group: 'Sports', emoji: '🚲', items: ['Trail running', 'Bouldering'], total: 5 }
  ],
  thisOrThat: [
    { id: 'i-t1', a: 'Sunrise', b: 'Sunset', pick: 'a', emoji: '🌅' },
    { id: 'i-t2', a: 'Road trip', b: 'Flight', pick: 'a', emoji: '✈️' },
    { id: 'i-t3', a: 'Sightseeing', b: 'Relaxing', pick: 'a', emoji: '🏖' }
  ],
  places: [
    { id: 'i-p1', label: 'Banff', note: 'Backpacked the Rockies', x: 18, y: 30, emoji: '🏔', year: '2021' },
    { id: 'i-p2', label: 'Patagonia', note: 'Wind that never stopped', x: 42, y: 88, emoji: '💨', year: '2024' }
  ]
};

/** Ben Chamberlin — acquaintance, hot sauce. Less visible at acquaintance tier. */
const THEO: FriendProfile = {
  header: {
    city: 'Austin, TX',
    bio: 'If it is not spicy, I am not interested.',
    song: { title: 'Levitating', artist: 'Dua Lipa' },
    book: { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin' }
  },
  about: [
    { id: 't-ab1', key: 'Hometown', value: 'Austin, TX', tier: 'acquaintance' },
    { id: 't-ab2', key: 'Lives in', value: 'Austin, TX', tier: 'acquaintance' },
    { id: 't-ab3', key: 'Work', value: 'Chef', tier: 'friend' },
    { id: 't-ab4', key: 'Allergies', value: 'None, somehow', tier: 'close' }
  ],
  hobbies: [
    { id: 'cooking', label: 'Cooking', emoji: '🍳', accent: 'coral', shape: 0, tier: 'acquaintance' },
    {
      id: 'trying-restaurants',
      label: 'Trying restaurants',
      emoji: '🍽',
      accent: 'amber',
      shape: 1,
      tier: 'friend'
    },
    {
      id: 'stand-up-comedy',
      label: 'Stand up comedy',
      emoji: '🎤',
      accent: 'pink',
      shape: 2,
      tier: 'friend'
    }
  ],
  favs: [
    {
      group: 'Food',
      emoji: '🍜',
      items: ['Carolina Reaper salsa', 'Breakfast tacos', 'Birria'],
      total: 20
    }
  ],
  thisOrThat: [
    { id: 't-t1', a: 'Spicy', b: 'Mild', pick: 'a', emoji: '🌶️' },
    { id: 't-t2', a: 'Host', b: 'Guest', pick: 'a', emoji: '🏠' }
  ],
  places: [
    { id: 't-p1', label: 'Oaxaca', note: 'Mole school', x: 38, y: 66, emoji: '🌶', year: '2022' }
  ]
};

/** Ceci Sumsion — acquaintance, film photos. */
const NOUR: FriendProfile = {
  header: {
    city: 'Portland, OR',
    bio: 'Black and white, mostly. Developing in the bathroom.',
    song: { title: 'Motion Picture Soundtrack', artist: 'Radiohead' },
    book: { title: 'Stoner', author: 'John Williams' }
  },
  about: [
    { id: 'n-ab1', key: 'Hometown', value: 'Vancouver, BC', tier: 'acquaintance' },
    { id: 'n-ab2', key: 'Lives in', value: 'Portland, OR', tier: 'acquaintance' },
    { id: 'n-ab3', key: 'Work', value: 'Photographer', tier: 'friend' }
  ],
  hobbies: [
    {
      id: 'photography',
      label: 'Photography',
      emoji: '📷',
      accent: 'blue',
      shape: 0,
      tier: 'acquaintance'
    },
    {
      id: 'film',
      label: 'Film photos',
      emoji: '🎞',
      accent: 'purple',
      shape: 1,
      tier: 'acquaintance'
    },
    {
      id: 'thrifting',
      label: 'Thrifting',
      emoji: '🛍',
      accent: 'coral',
      shape: 2,
      tier: 'friend'
    }
  ],
  favs: [
    {
      group: 'Entertainment',
      emoji: '🎬',
      items: ['Perfect Days', 'Portrait of a Lady on Fire'],
      total: 12
    },
    { group: 'Everyday', emoji: '🧺', items: ['Sunday darkroom', 'Library holds'], total: 6 }
  ],
  thisOrThat: [
    { id: 'n-t1', a: 'Sunrise', b: 'Sunset', pick: 'b', emoji: '🌅' },
    { id: 'n-t2', a: 'Cozy night in', b: 'Night out', pick: 'a', emoji: '🛋' }
  ],
  places: [
    { id: 'n-p1', label: 'Kyoto', note: 'Temple mornings', x: 78, y: 44, emoji: '⛩', year: '2019' },
    { id: 'n-p2', label: 'Reykjavík', note: 'Saw the lights', x: 46, y: 22, emoji: '🌌', year: '2024' }
  ]
};

export const FRIEND_PROFILES: Record<string, FriendProfile> = {
  maya: MAYA,
  devon: DEVON,
  ines: INES,
  theo: THEO,
  nour: NOUR
};
