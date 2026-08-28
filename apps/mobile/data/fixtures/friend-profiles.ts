// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake card data for each roster person, so opening a friend profile shows a
// real "About them" tab instead of empty sections. Varied from the own-profile
// fixtures so each person feels distinct. Top 5 / Obsession are keyed by person
// id (never reuse the viewer's own fixtures). Screens never import this —
// they go through getPersonProfile in data/profile.ts.
// ============================================
import type { ObsessionSquare, PhotoBlock, Top5Item } from '@bridger/shared';
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
  /** Subject's Top 5 (tier-visible); never the viewer's. */
  top5: Top5Item[];
  /** Subject's Current Obsession squares. */
  obsession: ObsessionSquare[];
  /** Co-op Greatest hits when the subject has slots (demo stubs). */
  greatestHits?: PhotoBlock[];
  header: {
    /** Live profiles can provide a signed avatar address for this friend. */
    avatarUrl?: string | null;
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
    { id: 'm-p1', label: 'Oaxaca', note: 'Clay markets', lat: 17.0732, lng: -96.7266, countryCode: 'MX', emoji: '🌶', year: '2023' },
    { id: 'm-p2', label: 'Banff', note: 'Cold lake swim', lat: 51.1784, lng: -115.5708, countryCode: 'CA', emoji: '🏔', year: '2022' },
    { id: 'm-p3', label: 'Lisbon', note: 'Tile hunting', lat: 38.7223, lng: -9.1393, countryCode: 'PT', emoji: '🟦', year: '2024' }
  ],
  top5: [
    {
      id: 'maya-t1',
      text: 'Always packing trail snacks for the group',
      emoji: '🥜',
      order: 0,
      visibleToTier: 'friend'
    },
    {
      id: 'maya-t2',
      text: 'Clay under the nails is a lifestyle',
      emoji: '🏺',
      order: 1,
      visibleToTier: 'friend'
    },
    {
      id: 'maya-t3',
      text: 'Will drive for a good sunrise',
      emoji: '🌅',
      order: 2,
      visibleToTier: 'acquaintance'
    }
  ],
  obsession: [
    {
      id: 'maya-ob1',
      prompt: 'Building:',
      text: 'a set of wonky mugs',
      emoji: '☕️',
      order: 0,
      visibleToTier: 'friend'
    },
    {
      id: 'maya-ob2',
      prompt: 'Reading…',
      text: 'Braiding Sweetgrass',
      emoji: '📖',
      order: 1,
      visibleToTier: 'friend'
    }
  ],
  greatestHits: [
    {
      id: 'maya-gh1',
      assetId: 'demo-maya-1',
      order: 0,
      afterModule: 'aboutMe',
      visibleToTier: 'friend'
    }
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
    { id: 'd-p1', label: 'Tokyo', note: 'Record hunting in Shimokitazawa', lat: 35.6762, lng: 139.6503, countryCode: 'JP', emoji: '🎶', year: '2023' },
    { id: 'd-p2', label: 'Berlin', note: 'Three clubs, one night', lat: 52.52, lng: 13.405, countryCode: 'DE', emoji: '🪩', year: '2019' }
  ],
  top5: [
    {
      id: 'devon-t1',
      text: 'Record store Saturdays are non-negotiable',
      emoji: '💿',
      order: 0,
      visibleToTier: 'friend'
    },
    {
      id: 'devon-t2',
      text: 'Night owl, texts after midnight',
      emoji: '🌙',
      order: 1,
      visibleToTier: 'friend'
    }
  ],
  obsession: [
    {
      id: 'devon-ob1',
      prompt: 'Listening…',
      text: 'Blue Rev on vinyl',
      emoji: '🎧',
      order: 0,
      visibleToTier: 'friend'
    },
    {
      id: 'devon-ob2',
      prompt: 'Obsessed with…',
      text: 'thrift-store speakers',
      emoji: '🔊',
      order: 1,
      visibleToTier: 'acquaintance'
    }
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
    { id: 'i-p1', label: 'Banff', note: 'Backpacked the Rockies', lat: 51.1784, lng: -115.5708, countryCode: 'CA', emoji: '🏔', year: '2021' },
    { id: 'i-p2', label: 'Patagonia', note: 'Wind that never stopped', lat: -50.0, lng: -73.0, countryCode: 'AR', emoji: '💨', year: '2024' }
  ],
  top5: [
    {
      id: 'ines-t1',
      text: 'Up before the sun, trails first',
      emoji: '🥾',
      order: 0,
      visibleToTier: 'acquaintance'
    },
    {
      id: 'ines-t2',
      text: 'Dog named Moss comes everywhere',
      emoji: '🐕',
      order: 1,
      visibleToTier: 'friend'
    }
  ],
  obsession: [
    {
      id: 'ines-ob1',
      prompt: 'Training for…',
      text: 'a ridge run in Hood River',
      emoji: '🏃',
      order: 0,
      visibleToTier: 'friend'
    }
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
    { id: 't-p1', label: 'Oaxaca', note: 'Mole school', lat: 17.0732, lng: -96.7266, countryCode: 'MX', emoji: '🌶', year: '2022' }
  ],
  top5: [
    {
      id: 'theo-t1',
      text: 'If it is not spicy, I am not interested',
      emoji: '🌶️',
      order: 0,
      visibleToTier: 'acquaintance'
    }
  ],
  obsession: [
    {
      id: 'theo-ob1',
      prompt: 'Obsessed with…',
      text: 'Carolina Reaper salsa',
      emoji: '🔥',
      order: 0,
      visibleToTier: 'friend'
    }
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
    { id: 'n-p1', label: 'Kyoto', note: 'Temple mornings', lat: 35.0116, lng: 135.7681, countryCode: 'JP', emoji: '⛩', year: '2019' },
    { id: 'n-p2', label: 'Reykjavík', note: 'Saw the lights', lat: 64.1466, lng: -21.9426, countryCode: 'IS', emoji: '🌌', year: '2024' }
  ],
  top5: [
    {
      id: 'nour-t1',
      text: 'Black and white, mostly',
      emoji: '📷',
      order: 0,
      visibleToTier: 'acquaintance'
    },
    {
      id: 'nour-t2',
      text: 'Developing film in the bathroom',
      emoji: '🎞',
      order: 1,
      visibleToTier: 'friend'
    }
  ],
  obsession: [
    {
      id: 'nour-ob1',
      prompt: 'Working on…',
      text: 'a darkroom print series',
      emoji: '🖼',
      order: 0,
      visibleToTier: 'friend'
    }
  ]
};

export const FRIEND_PROFILES: Record<string, FriendProfile> = {
  maya: MAYA,
  devon: DEVON,
  ines: INES,
  theo: THEO,
  nour: NOUR
};
