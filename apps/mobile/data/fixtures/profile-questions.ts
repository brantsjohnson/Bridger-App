// ============================================
// WHAT THIS FILE DOES (plain English):
// The Profile question bank — the source of truth for every fill-module
// question, translated from PROFILE-MODULES.md. ProfileCard builds its
// ModuleFlow screens from this file. Screens never invent questions on the
// fly; they read from here so the bank and the UI stay in sync.
// ============================================
import type { Accent, Tier } from '@bridger/shared';

/** Turn a hobby label into a stable id ("Rock climbing" → "rock-climbing"). */
export function hobbyId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// --- Module 1A · Hobby groups ---

export type HobbyGroup = {
  group: string;
  /** Three flair emojis that sit next to the category name. */
  emojis: string[];
  hobbies: string[];
};

export const HOBBY_GROUPS: HobbyGroup[] = [
  {
    group: 'Creativity',
    emojis: ['🎨', '✨', '🖌️'],
    hobbies: [
      'Acting',
      'Animation',
      'Blogging',
      'Calligraphy',
      'Creative Writing',
      'Digital Art',
      'Drawing',
      'Fashion Design',
      'Filmmaking',
      'Graphic design',
      'Illustration',
      'Jewelry Making',
      'Painting',
      'Photography',
      'Poetry',
      'Pottery',
      'Sculpting',
      'Storytelling',
      'Videography',
      'Writing',
      'Collecting'
    ]
  },
  {
    group: 'Crafts',
    emojis: ['🧶', '🛠️', '✂️'],
    hobbies: [
      'DIY',
      'Embroidery',
      'Home Decor',
      'Interior Design',
      'Knitting',
      'Quilting',
      'Sewing',
      'Thrifting',
      'Woodworking'
    ]
  },
  {
    group: 'Education',
    emojis: ['🌍', '📚', '🧠'],
    hobbies: [
      'Art History',
      'Book club',
      'Civic Engagement',
      'Genealogy',
      'History',
      'Learning languages',
      'Museum Visits',
      'Philosophy',
      'Reading'
    ]
  },
  {
    group: 'Entertainment',
    emojis: ['🎬', '🎮', '🎭'],
    hobbies: [
      'Anime',
      'Binge-watching',
      'Board games',
      'Broadway',
      'Card Games',
      'Chess',
      'Cosplay',
      'Documentaries',
      'Disney',
      'D and D and TTRPGs',
      'Drag',
      'Escape Rooms',
      'Gaming',
      'Improv',
      'Karaoke',
      'Magic Tricks',
      'Marvel',
      'Movies',
      'Netflix',
      'Podcasts',
      'Puzzles',
      'Reality TV',
      'Stand up comedy',
      'Star Wars',
      'Thrillers',
      'TikTok',
      'Trivia',
      'True crime',
      'TV shows',
      'Video games',
      'YouTube'
    ]
  },
  {
    group: 'Fitness',
    emojis: ['💪', '🏃', '🧘'],
    hobbies: [
      'Martial arts',
      'Biking',
      'Boxing',
      'CrossFit',
      'Dancing',
      'Gym',
      'Hiking',
      'Yoga',
      'Pilates',
      'Rock climbing',
      'Running',
      'Surfing',
      'Swimming',
      'Skiing',
      'Tennis',
      'Volleyball',
      'Weightlifting'
    ]
  },
  {
    group: 'Food & Drink',
    emojis: ['🍔', '🍷', '🍳'],
    hobbies: [
      'Baking',
      'BBQ',
      'Brunch',
      'Coffee',
      'Cooking',
      'Foodie',
      'Ice Cream',
      'Pizza',
      'Sushi',
      'Tea',
      'Wine',
      'Beer and breweries',
      'Cocktails',
      'Trying restaurants',
      'Vegan',
      'Vegetarian'
    ]
  },
  {
    group: 'Music',
    emojis: ['🎵', '🎸', '🎤'],
    hobbies: [
      'Christian Music',
      'DJing',
      'EDM',
      'Going to concerts',
      'Guitar',
      'Jazz',
      'K-pop',
      'Metal',
      'Music Composition',
      'Music Production',
      'Music festivals',
      'Musicals and theatre',
      'Piano',
      'Playing an instrument',
      'Pop',
      'Rap',
      'Rock',
      'Singing',
      'Vinyl collecting'
    ]
  },
  {
    group: 'Outdoors',
    emojis: ['🌳', '🏔️', '🌅'],
    hobbies: [
      'Backpacking',
      'Beach Activities',
      'Bird Watching',
      'Camping',
      'Cycling',
      'Fishing',
      'Foraging',
      'Gardening',
      'Hunting',
      'Kayaking',
      'Nature Exploration',
      'Roller Skating',
      'Sailing',
      'Scuba diving',
      'Snowboarding',
      'Stargazing',
      'Sunsets',
      'Urban Exploring'
    ]
  },
  {
    group: 'Social',
    emojis: ['🤝', '✊', '🌠'],
    hobbies: [
      'Activism',
      'Astrology',
      'Clubbing',
      'Conservative',
      'Debate',
      'Environmentalism',
      'Fashion',
      'House Parties',
      'LGBTQ+ Advocacy',
      'Non-political',
      'Personality Tests',
      'Politics',
      'Progressive',
      'Spirituality',
      'Tattoos',
      'Volunteering'
    ]
  },
  {
    group: 'Tech',
    emojis: ['💻', '🤖', '📱'],
    hobbies: [
      '3D printing',
      'AI',
      'App Design',
      'Coding',
      'Crypto',
      'Cybersecurity',
      'Game Streaming',
      'NFTs',
      'Stock Trading',
      'Productivity',
      'Programming',
      'UI/UX Design',
      'Web Design',
      'Web3'
    ]
  },
  {
    group: 'Wellness',
    emojis: ['🧘‍♀️', '💚', '🔮'],
    hobbies: [
      'Biohacking',
      'Cold Plunge',
      'Crystals',
      'Journaling',
      'Meditation',
      'Mental Health',
      'Mindfulness',
      'Saunas',
      'Supplements',
      'Tarot Reading',
      'Therapy'
    ]
  },
  {
    group: 'Sports',
    emojis: ['⚽', '🏀', '🏅'],
    hobbies: [
      'Soccer',
      'Basketball',
      'Football',
      'Baseball',
      'Hockey',
      'Pickleball',
      'Golf',
      'Track and Field'
    ]
  },
  {
    group: 'Animals',
    emojis: ['🐕', '🐈', '🐴'],
    hobbies: ['Dogs', 'Cats', 'Horseback riding', 'Houseplants', 'Farming']
  },
  {
    group: 'Travel',
    emojis: ['✈️', '🚗', '🗺️'],
    hobbies: ['Road trips', 'Solo travel']
  }
];

/** Flat list of every hobby label in the bank. */
export const ALL_HOBBIES: string[] = HOBBY_GROUPS.flatMap((g) => g.hobbies);

/** A small emoji for each hobby so the tiles feel playful. */
export const HOBBY_EMOJI: Record<string, string> = {
  hiking: '🥾',
  camping: '🏕️',
  backpacking: '🎒',
  skiing: '⛷️',
  snowboarding: '🏂',
  surfing: '🏄',
  'rock-climbing': '🧗',
  cycling: '🚴',
  fishing: '🎣',
  hunting: '🦌',
  kayaking: '🛶',
  sailing: '⛵️',
  'scuba-diving': '🤿',
  stargazing: '🌌',
  soccer: '⚽️',
  basketball: '🏀',
  football: '🏈',
  baseball: '⚾️',
  hockey: '🏒',
  tennis: '🎾',
  pickleball: '🏓',
  golf: '⛳️',
  volleyball: '🏐',
  'martial-arts': '🤸',
  'track-and-field': '🏃',
  yoga: '🧘',
  pilates: '🧘‍♀️',
  weightlifting: '🏋️',
  crossfit: '🔥',
  boxing: '🥊',
  swimming: '🏊',
  meditation: '🧘',
  running: '🏃',
  painting: '🎨',
  drawing: '✏️',
  photography: '📷',
  videography: '🎥',
  pottery: '🏺',
  knitting: '🧶',
  sewing: '🧵',
  woodworking: '🪵',
  diy: '🛠️',
  'graphic-design': '🖼️',
  journaling: '📔',
  collecting: '🗂',
  'playing-an-instrument': '🎸',
  singing: '🎶',
  'going-to-concerts': '🎟',
  'music-festivals': '🎪',
  podcasts: '🎧',
  djing: '🎧',
  'vinyl-collecting': '📀',
  'musicals-and-theatre': '🎭',
  cooking: '🧑‍🍳',
  baking: '🧁',
  'trying-restaurants': '🍽',
  coffee: '☕️',
  wine: '🍷',
  'beer-and-breweries': '🍺',
  cocktails: '🍸',
  tea: '🍵',
  movies: '🎬',
  'tv-shows': '📺',
  'stand-up-comedy': '🎤',
  anime: '🎌',
  'video-games': '🕹️',
  'board-games': '🎲',
  'd-and-d-and-ttrpgs': '🎲',
  chess: '♟️',
  reading: '📖',
  writing: '✍️',
  'book-club': '📚',
  coding: '💻',
  '3d-printing': '🖨',
  dogs: '🐕',
  cats: '🐈',
  'horseback-riding': '🐴',
  gardening: '🪴',
  houseplants: '🪴',
  farming: '🚜',
  dancing: '💃',
  karaoke: '🎤',
  volunteering: '🙌',
  thrifting: '🛍',
  fashion: '👗',
  tattoos: '🖋',
  astrology: '🌠',
  politics: '🏛',
  'learning-languages': '🗣️',
  history: '📜',
  'true-crime': '🕵️',
  'road-trips': '🚗',
  'solo-travel': '✈️',
  acting: '🎭',
  animation: '🎬',
  blogging: '✍️',
  calligraphy: '✒️',
  'creative-writing': '✒️',
  'digital-art': '🖌️',
  'fashion-design': '👗',
  filmmaking: '🎬',
  illustration: '✏️',
  'jewelry-making': '💍',
  poetry: '📝',
  sculpting: '✨',
  storytelling: '📚',
  embroidery: '🧶',
  'home-decor': '🏡',
  'interior-design': '🪑',
  quilting: '🧵',
  'art-history': '🖼️',
  'civic-engagement': '🏛️',
  genealogy: '🧬',
  'museum-visits': '🏛️',
  philosophy: '🧠',
  'binge-watching': '📺',
  broadway: '🎭',
  'card-games': '🃏',
  cosplay: '🧝',
  documentaries: '🎬',
  disney: '🏰',
  drag: '👠',
  'escape-rooms': '🚪',
  gaming: '🎮',
  improv: '🎭',
  'magic-tricks': '🎩',
  marvel: '🦸',
  netflix: '📺',
  puzzles: '🧩',
  'reality-tv': '📸',
  'star-wars': '🚀',
  thrillers: '🔪',
  tiktok: '📱',
  trivia: '🎲',
  youtube: '▶️',
  biking: '🚴',
  gym: '💪',
  bbq: '🍖',
  brunch: '🍳',
  foodie: '🍽️',
  'ice-cream': '🍦',
  pizza: '🍕',
  sushi: '🍣',
  vegan: '🥗',
  vegetarian: '🥗',
  'christian-music': '🎶',
  edm: '🎚️',
  guitar: '🎸',
  jazz: '🎷',
  'k-pop': '🎤',
  metal: '🤘',
  'music-composition': '🎹',
  'music-production': '🎹',
  piano: '🎹',
  pop: '🎤',
  rap: '🎤',
  rock: '🎸',
  'beach-activities': '🏖️',
  'bird-watching': '🐦',
  foraging: '🌿',
  'nature-exploration': '🔭',
  'roller-skating': '🛼',
  sunsets: '🌅',
  'urban-exploring': '🏙️',
  activism: '✊',
  clubbing: '🥳',
  conservative: '🐘',
  debate: '💬',
  environmentalism: '♻️',
  'house-parties': '🎉',
  'lgbtq-advocacy': '🏳️‍🌈',
  'non-political': '🗳️',
  'personality-tests': '✨',
  progressive: '🫏',
  spirituality: '🙏',
  ai: '🤖',
  'app-design': '📱',
  crypto: '💰',
  cybersecurity: '🛡️',
  'game-streaming': '📺',
  nfts: '🖼️',
  'stock-trading': '📈',
  productivity: '📅',
  programming: '💻',
  'ui-ux-design': '🎨',
  'web-design': '🌐',
  web3: '🌐',
  biohacking: '🧬',
  'cold-plunge': '❄️',
  crystals: '🔮',
  'mental-health': '💚',
  mindfulness: '🕊️',
  saunas: '🔥',
  supplements: '💊',
  'tarot-reading': '🃏',
  therapy: '🛋️'
};

/** Accent colors cycle so hobby tiles look like the Magic Patterns grid. */
const HOBBY_ACCENTS: Accent[] = [
  'teal',
  'purple',
  'coral',
  'amber',
  'pink',
  'blue',
  'green'
];

export function hobbyAccent(index: number): Accent {
  return HOBBY_ACCENTS[index % HOBBY_ACCENTS.length];
}

// --- Module 1B · One follow-up per hobby ---

export const HOBBY_FOLLOWUP_QUESTIONS: Record<string, string> = {
  hiking: 'Favorite place to hike?',
  camping: "What's the best part of camping?",
  backpacking: "What's unnecessary to pack but you bring anyway?",
  skiing: 'Where do you typically ski?',
  snowboarding: 'Where do you typically snowboard?',
  surfing: 'How long have you been surfing?',
  'rock-climbing': 'Where do you climb?',
  cycling: "What's your next cycling goal?",
  running: "What's your next running goal?",
  fishing: "Where's your dream fishing trip?",
  hunting: 'What do you like to hunt?',
  kayaking: 'Favorite waterway?',
  sailing: 'Who got you into sailing?',
  'scuba-diving': 'Best dive site?',
  stargazing: 'Favorite constellation?',
  soccer: "Who's your soccer team?",
  basketball: "Who's your basketball team?",
  football: "Who's your football team?",
  baseball: "Who's your baseball team?",
  hockey: "Who's your hockey team?",
  tennis: 'Favorite thing about tennis?',
  pickleball: 'Favorite thing about pickleball?',
  golf: "Favorite course you've played?",
  volleyball: 'Favorite position to play?',
  'martial-arts': 'Which discipline?',
  'track-and-field': "What's your event?",
  yoga: 'Favorite style?',
  pilates: 'What do you like about it?',
  weightlifting: 'Favorite muscle to hit?',
  crossfit: 'Best thing about CrossFit?',
  boxing: 'What got you into boxing?',
  swimming: 'Favorite stroke?',
  meditation: 'What style of meditation?',
  painting: "What's your preferred painting style?",
  drawing: 'What do you like to draw?',
  photography: 'What style of photography do you shoot?',
  videography: 'What video are you most proud of?',
  pottery: 'Favorite thing you have made?',
  knitting: 'Go-to item to knit?',
  sewing: "Favorite thing you've sewn?",
  woodworking: "Favorite thing you've built?",
  diy: "Favorite DIY project you've done?",
  'graphic-design': 'How would you describe your design style?',
  journaling: 'Where do you like to journal?',
  collecting: 'What do you collect?',
  'playing-an-instrument': 'What do you play?',
  singing: 'Go-to song to sing?',
  'going-to-concerts': "Best artist you've ever seen?",
  'music-festivals': 'Favorite festival?',
  podcasts: 'Top podcast you listen to?',
  djing: 'Favorite spot to DJ?',
  'vinyl-collecting': 'Favorite vinyl you own?',
  'musicals-and-theatre': "Favorite show you've seen?",
  cooking: "What's your signature dish?",
  baking: "What's your favorite thing to bake?",
  'trying-restaurants': 'Restaurant you always recommend?',
  coffee: "What's your coffee order?",
  wine: 'Go-to wine?',
  'beer-and-breweries': 'Favorite brewery?',
  cocktails: 'Go-to drink?',
  tea: "What's your go-to tea?",
  movies: 'What movie do you always recommend?',
  'tv-shows': 'Show you always recommend?',
  'stand-up-comedy': 'Favorite comedian?',
  anime: 'Favorite series?',
  'video-games': 'What game are you never bored of?',
  'board-games': 'Favorite board game?',
  'd-and-d-and-ttrpgs': "Longest campaign you've done?",
  chess: 'What skill level are you?',
  reading: 'A book you always recommend?',
  writing: 'What genre do you write?',
  'book-club': "Favorite book you've read?",
  coding: 'Best language, in your opinion?',
  '3d-printing': "Biggest thing you've printed?",
  dogs: 'What kind of dog?',
  cats: 'What kind of cat?',
  'horseback-riding': 'What do you love about riding?',
  gardening: "What's in your garden?",
  houseplants: 'Best type of houseplant?',
  farming: 'What do you grow or raise?',
  dancing: 'Where do you like to dance?',
  karaoke: 'Your go-to song?',
  volunteering: 'Where do you like to volunteer?',
  thrifting: 'Best thrift find?',
  fashion: 'How would you describe your style?',
  tattoos: 'Your first tattoo?',
  astrology: 'Your big three (sun, moon, star)?',
  politics: 'How would you describe your politics?',
  'learning-languages': 'What language are you learning?',
  history: 'Favorite era to study?',
  'true-crime': 'Go-to true crime podcast?',
  'road-trips': "Route you'd do again?",
  'solo-travel': "Favorite place you've traveled?",
  acting: 'Favorite role you have played?',
  animation: 'What do you like to animate?',
  blogging: 'What do you write about?',
  calligraphy: 'Favorite thing to letter?',
  'creative-writing': 'What genre do you write?',
  'digital-art': 'How would you describe your style?',
  'fashion-design': 'What do you like to design?',
  filmmaking: 'What film are you most proud of?',
  illustration: 'What do you like to illustrate?',
  'jewelry-making': 'Favorite piece you have made?',
  poetry: 'A poem you always come back to?',
  sculpting: 'Favorite thing you have sculpted?',
  storytelling: 'What kind of stories do you tell?',
  embroidery: 'Go-to thing to stitch?',
  'home-decor': 'What room did you redo last?',
  'interior-design': 'How would you describe your style?',
  quilting: 'Favorite quilt you have made?',
  'art-history': 'Favorite period or artist?',
  'civic-engagement': 'What cause are you closest to?',
  genealogy: 'Coolest thing you found in your family tree?',
  'museum-visits': 'Favorite museum?',
  philosophy: 'A question you keep chewing on?',
  'binge-watching': 'Show you always recommend?',
  broadway: 'Favorite show you have seen?',
  'card-games': 'Go-to card game?',
  cosplay: 'Favorite costume you have made?',
  documentaries: 'One that stuck with you?',
  disney: 'Favorite Disney movie?',
  drag: 'What do you love about drag?',
  'escape-rooms': 'Best room you have done?',
  gaming: 'What are you playing right now?',
  improv: 'Where do you like to play?',
  'magic-tricks': 'First trick you learned?',
  marvel: 'Favorite hero?',
  netflix: 'Show you always put on?',
  puzzles: 'Favorite kind of puzzle?',
  'reality-tv': 'Guilty-pleasure show?',
  'star-wars': 'Favorite movie or show?',
  thrillers: 'One that actually got you?',
  tiktok: 'What do you watch there?',
  trivia: 'Your strongest category?',
  youtube: 'Channel you always recommend?',
  biking: 'Favorite route?',
  gym: 'Favorite kind of workout?',
  bbq: 'Signature thing on the grill?',
  brunch: 'Go-to brunch order?',
  foodie: 'Restaurant you always recommend?',
  'ice-cream': 'Go-to flavor?',
  pizza: 'Favorite topping combo?',
  sushi: 'Go-to roll?',
  vegan: 'Favorite vegan spot?',
  vegetarian: 'Favorite vegetarian dish?',
  'christian-music': 'Artist you always put on?',
  edm: 'Favorite festival or DJ?',
  guitar: 'What do you like to play?',
  jazz: 'Favorite artist or era?',
  'k-pop': 'Bias group right now?',
  metal: 'Band you always come back to?',
  'music-composition': 'What do you like to write?',
  'music-production': 'What do you like to make?',
  piano: 'Piece you love to play?',
  pop: 'Song you have on repeat?',
  rap: 'Album you always recommend?',
  rock: 'Band that got you into it?',
  'beach-activities': 'Favorite thing to do at the beach?',
  'bird-watching': 'Coolest bird you have spotted?',
  foraging: 'Best thing you have found?',
  'nature-exploration': 'Favorite place to wander?',
  'roller-skating': 'Where do you like to skate?',
  sunsets: 'Best sunset you have seen?',
  'urban-exploring': 'Favorite spot you have found?',
  activism: 'What are you working toward?',
  clubbing: 'Favorite night out spot?',
  conservative: 'What does that mean for you?',
  debate: 'Favorite topic to argue?',
  environmentalism: 'What do you do about it day to day?',
  'house-parties': 'What makes a good one?',
  'lgbtq-advocacy': 'What work matters most to you?',
  'non-political': 'What do you like to talk about instead?',
  'personality-tests': 'Your favorite result?',
  progressive: 'What does that mean for you?',
  spirituality: 'What practice grounds you?',
  ai: 'What do you like to make with it?',
  'app-design': 'App you are most proud of?',
  crypto: 'What got you into it?',
  cybersecurity: 'What part of it do you love?',
  'game-streaming': 'What do you stream?',
  nfts: 'What do you collect or make?',
  'stock-trading': 'What got you started?',
  productivity: 'System you actually stick to?',
  programming: 'Best language, in your opinion?',
  'ui-ux-design': 'How would you describe your style?',
  'web-design': 'Site you are proud of?',
  web3: 'What are you building or following?',
  biohacking: 'What are you trying right now?',
  'cold-plunge': 'How long can you stay in?',
  crystals: 'Which one do you keep close?',
  'mental-health': 'What helps you most?',
  mindfulness: 'When do you practice?',
  saunas: 'Favorite spot?',
  supplements: 'One you actually notice?',
  'tarot-reading': 'Favorite deck?',
  therapy: 'What do you like about it?'
};

/** One chip row for the hobbies picker, with its category attached. */
export type HobbyCatalogItem = {
  id: string;
  label: string;
  emoji: string;
  group: string;
  groupEmojis: string[];
};

/** Flat chip list the hobbies module reads so the picker stays in sync. */
export function catalogHobbyOptions(): HobbyCatalogItem[] {
  return HOBBY_GROUPS.flatMap((g) =>
    g.hobbies.map((label) => {
      const id = hobbyId(label);
      return {
        id,
        label,
        emoji: HOBBY_EMOJI[id] ?? '✨',
        group: g.group,
        groupEmojis: g.emojis
      };
    })
  );
}

/** Fallback follow-up for a custom "+ Add your own" hobby. */
export function customHobbyFollowup(label: string): string {
  return `Tell me more about ${label}`;
}

// --- Module 2 · List of favs ---

export type FavItem = {
  id: string;
  group: 'Food and Drink' | 'Entertainment' | 'Everyday Favorites' | 'Sports';
  label: string;
  emoji: string;
};

export const FAV_ITEMS: FavItem[] = [
  // Food and Drink
  { id: 'fav-candy', group: 'Food and Drink', label: 'Candy', emoji: '🍬' },
  { id: 'fav-cuisine', group: 'Food and Drink', label: 'Cuisine', emoji: '🍜' },
  { id: 'fav-ice-cream', group: 'Food and Drink', label: 'Ice cream', emoji: '🍦' },
  { id: 'fav-pizza', group: 'Food and Drink', label: 'Pizza flavor', emoji: '🍕' },
  { id: 'fav-breakfast', group: 'Food and Drink', label: 'Breakfast', emoji: '🥞' },
  { id: 'fav-drink', group: 'Food and Drink', label: 'Drink of choice', emoji: '🥤' },
  { id: 'fav-coffee', group: 'Food and Drink', label: 'Coffee order', emoji: '☕️' },
  { id: 'fav-restaurant', group: 'Food and Drink', label: 'Restaurant', emoji: '🍽' },
  { id: 'fav-order', group: 'Food and Drink', label: 'Order you get there', emoji: '🧾' },
  { id: 'fav-snack', group: 'Food and Drink', label: 'Snack', emoji: '🍿' },
  { id: 'fav-dessert', group: 'Food and Drink', label: 'Dessert', emoji: '🍰' },
  { id: 'fav-fruit', group: 'Food and Drink', label: 'Fruit', emoji: '🍓' },
  { id: 'fav-comfort-food', group: 'Food and Drink', label: 'Comfort food', emoji: '🍲' },
  { id: 'fav-late-night', group: 'Food and Drink', label: 'Late-night snack', emoji: '🌙' },
  // Entertainment
  { id: 'fav-movie', group: 'Entertainment', label: 'Movie', emoji: '🎬' },
  { id: 'fav-tv', group: 'Entertainment', label: 'TV show', emoji: '📺' },
  { id: 'fav-comfort-show', group: 'Entertainment', label: 'Comfort show', emoji: '🛋' },
  { id: 'fav-comfort-movie', group: 'Entertainment', label: 'Comfort movie', emoji: '🎥' },
  { id: 'fav-play', group: 'Entertainment', label: 'Play or musical', emoji: '🎭' },
  { id: 'fav-book', group: 'Entertainment', label: 'Book', emoji: '📚' },
  { id: 'fav-artist', group: 'Entertainment', label: 'Musical artist', emoji: '🎤' },
  { id: 'fav-album', group: 'Entertainment', label: 'Album', emoji: '💿' },
  { id: 'fav-song', group: 'Entertainment', label: 'Song', emoji: '🎵' },
  { id: 'fav-podcast', group: 'Entertainment', label: 'Podcast', emoji: '🎧' },
  { id: 'fav-game', group: 'Entertainment', label: 'Video game', emoji: '🎮' },
  { id: 'fav-board', group: 'Entertainment', label: 'Board game', emoji: '🎲' },
  { id: 'fav-comedian', group: 'Entertainment', label: 'Comedian', emoji: '😂' },
  // Everyday Favorites
  { id: 'fav-city', group: 'Everyday Favorites', label: 'City', emoji: '🏙' },
  { id: 'fav-lived', group: 'Everyday Favorites', label: "Place you've lived", emoji: '🏡' },
  { id: 'fav-store', group: 'Everyday Favorites', label: 'Store to shop at', emoji: '🛍' },
  { id: 'fav-color', group: 'Everyday Favorites', label: 'Color', emoji: '🎨' },
  { id: 'fav-season', group: 'Everyday Favorites', label: 'Season', emoji: '🍂' },
  { id: 'fav-holiday', group: 'Everyday Favorites', label: 'Holiday', emoji: '🎄' },
  { id: 'fav-smell', group: 'Everyday Favorites', label: 'Smell', emoji: '👃' },
  { id: 'fav-flower', group: 'Everyday Favorites', label: 'Flower', emoji: '🌸' },
  { id: 'fav-animal', group: 'Everyday Favorites', label: 'Animal', emoji: '🐻' },
  { id: 'fav-quote', group: 'Everyday Favorites', label: 'Quote', emoji: '💬' },
  // Sports
  { id: 'fav-team', group: 'Sports', label: 'Sports team', emoji: '🏟' },
  { id: 'fav-watch', group: 'Sports', label: 'Sport to watch', emoji: '📺' },
  { id: 'fav-play-sport', group: 'Sports', label: 'Sport to play', emoji: '⚽️' }
];

/** Short group labels used on the Profile card. */
export const FAV_GROUP_DISPLAY: Record<FavItem['group'], { label: string; emoji: string }> = {
  'Food and Drink': { label: 'Food', emoji: '🍜' },
  Entertainment: { label: 'Entertainment', emoji: '🎬' },
  'Everyday Favorites': { label: 'Everyday', emoji: '🧺' },
  Sports: { label: 'Sports', emoji: '🚲' }
};

// --- Module 4 · This or that ---

export type ThisOrThatPrompt = {
  id: string;
  a: string;
  b: string;
  emoji: string;
};

export const THIS_OR_THAT_PROMPTS: ThisOrThatPrompt[] = [
  { id: 'tot-morning-night', a: 'Morning person', b: 'Night person', emoji: '🌙' },
  { id: 'tot-pancakes-waffles', a: 'Pancakes', b: 'Waffles', emoji: '🥞' },
  { id: 'tot-pizza-burgers', a: 'Pizza', b: 'Burgers', emoji: '🍕' },
  { id: 'tot-cookies-brownies', a: 'Cookies', b: 'Brownies', emoji: '🍪' },
  { id: 'tot-spicy-mild', a: 'Spicy', b: 'Mild', emoji: '🌶️' },
  { id: 'tot-fries-onion', a: 'Fries', b: 'Onion rings', emoji: '🍟' },
  { id: 'tot-sunrise-sunset', a: 'Sunrise', b: 'Sunset', emoji: '🌅' },
  { id: 'tot-spring-fall', a: 'Spring', b: 'Fall', emoji: '🍂' },
  { id: 'tot-host-guest', a: 'Host', b: 'Guest', emoji: '🏠' },
  { id: 'tot-movies-tv', a: 'Movies', b: 'TV shows', emoji: '🎬' },
  { id: 'tot-horror-romcom', a: 'Horror', b: 'Romcom', emoji: '👻' },
  { id: 'tot-subtitles', a: 'Subtitles on', b: 'Subtitles off', emoji: '💬' },
  { id: 'tot-rewatch-new', a: 'Rewatch', b: 'Watch new', emoji: '🔄' },
  { id: 'tot-road-flight', a: 'Road trip', b: 'Flight', emoji: '✈️' },
  { id: 'tot-window-aisle', a: 'Window seat', b: 'Aisle', emoji: '🪟' },
  { id: 'tot-sightsee-relax', a: 'Sightseeing', b: 'Relaxing', emoji: '🏖' },
  { id: 'tot-cozy-out', a: 'Cozy night in', b: 'Night out', emoji: '🛋' }
];

// --- Module 1E · Personal questions (simple subset) ---

export type PersonalQuestion = {
  id: string;
  key: string;
  ask: string;
  placeholder?: string;
  /** PRIVACY: default who can see this answer */
  defaultTier: Tier;
  multiline?: boolean;
};

/**
 * The simple About Me questions (no Family multi-entry, birth-order drag, or
 * Zodiac auto-fill — those exotic step types land in a follow-on).
 * Basics default wider; sensitive default Close friends.
 */
export const PERSONAL_QUESTIONS: PersonalQuestion[] = [
  {
    id: 'about-birthday',
    key: 'Birthday',
    ask: 'When is your birthday?',
    placeholder: 'March 4',
    defaultTier: 'friend'
  },
  {
    id: 'about-nicknames',
    key: 'Nicknames',
    ask: 'Any nicknames?',
    placeholder: 'Sandy',
    defaultTier: 'friend'
  },
  {
    id: 'about-middle-name',
    key: 'Middle name',
    ask: "What's your middle name?",
    placeholder: 'Optional',
    defaultTier: 'close'
  },
  {
    id: 'about-from',
    key: 'Hometown',
    ask: 'Where are you from?',
    placeholder: 'Missoula, MT',
    defaultTier: 'acquaintance'
  },
  {
    id: 'about-town',
    key: 'Lives in',
    ask: 'What town do you live in now?',
    placeholder: 'Portland, OR',
    defaultTier: 'acquaintance'
  },
  {
    id: 'about-high-school',
    key: 'High school',
    ask: 'Where did you go to high school?',
    placeholder: 'Optional',
    defaultTier: 'friend'
  },
  {
    id: 'about-college',
    key: 'College',
    ask: 'Where did you go to college?',
    placeholder: 'Optional',
    defaultTier: 'friend'
  },
  {
    id: 'about-study',
    key: 'Studied',
    ask: 'What did you study?',
    placeholder: 'Optional',
    defaultTier: 'friend'
  },
  {
    id: 'about-job',
    key: 'Work',
    ask: "What's your current job title?",
    placeholder: 'Studio potter',
    defaultTier: 'friend'
  },
  {
    id: 'about-dream-job',
    key: 'Dream job',
    ask: "What's your dream job?",
    placeholder: 'Optional',
    defaultTier: 'friend'
  },
  {
    id: 'about-pets',
    key: 'Pets',
    ask: 'What pets do you have?',
    placeholder: 'Type or breed',
    defaultTier: 'friend'
  },
  {
    id: 'about-pet-names',
    key: 'Pet names',
    ask: "What are your pets' names?",
    placeholder: 'Miso',
    defaultTier: 'friend'
  },
  {
    id: 'about-allergies',
    key: 'Allergies',
    ask: 'Any food allergies?',
    placeholder: 'Peanuts',
    defaultTier: 'close'
  },
  {
    id: 'about-dietary',
    key: 'Dietary',
    ask: 'Any dietary restrictions?',
    placeholder: 'Vegetarian',
    defaultTier: 'close'
  },
  {
    id: 'about-ethnicity',
    key: 'Heritage',
    ask: 'Ethnicity or heritage?',
    placeholder: 'Optional',
    defaultTier: 'close'
  },
  {
    id: 'about-relationship',
    key: 'Relationship',
    ask: 'Relationship status?',
    placeholder: 'Optional',
    defaultTier: 'close'
  },
  {
    id: 'about-sexuality',
    key: 'Sexuality',
    ask: 'Sexuality?',
    placeholder: 'Optional',
    defaultTier: 'close'
  },
  {
    id: 'about-pronouns',
    key: 'Pronouns',
    ask: 'Pronouns?',
    placeholder: 'she/her',
    defaultTier: 'acquaintance'
  },
  {
    id: 'about-religion',
    key: 'Beliefs',
    ask: 'Religion or beliefs?',
    placeholder: 'Optional',
    defaultTier: 'close'
  },
  {
    id: 'about-else',
    key: 'Also remember',
    ask: 'Anything else friends should remember?',
    placeholder: 'Optional',
    defaultTier: 'friend',
    multiline: true
  }
];

// --- Module 5 · Custom notes ---

export const CUSTOM_NOTES = {
  id: 'notes-free',
  ask: "Anything that didn't fit elsewhere?",
  placeholder: 'Free text — a habit, a bit, a soft spot…',
  defaultTier: 'friend' as Tier
};

// --- Places (search → pin on the world map) ---

/** Place-add questions. First step geocodes so the map gets real lat/lng. */
export const PLACE_QUESTIONS = [
  {
    id: 'place-where',
    ask: 'Where have you been?',
    placeholder: 'Search a city or country',
    emoji: '✈️',
    type: 'placeSearch' as const
  },
  {
    id: 'place-tag',
    ask: 'How do you know it?',
    emoji: '🏷',
    type: 'single' as const,
    options: ['Visited', 'Lived there', 'Want to go']
  },
  {
    id: 'place-note',
    ask: 'What do you remember most?',
    placeholder: 'Custard tarts, daily',
    emoji: '📝',
    type: 'text' as const
  },
  {
    id: 'place-next',
    ask: 'Where next?',
    placeholder: 'Anywhere with trains',
    emoji: '🗺',
    type: 'text' as const
  }
] as const;
