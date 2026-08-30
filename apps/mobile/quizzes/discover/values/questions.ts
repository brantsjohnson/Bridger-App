// ============================================
// WHAT THIS FILE DOES (plain English):
// What Gets You Going — 30 forced-choice scenes. Each option maps to one
// Schwartz value (equal coverage: 12 chances each). Matching dials are built
// from these in score.ts. Politics-word-free. Loyalty/honesty friendship
// add-on questions land in a later pack (separate from these ten scores).
// ============================================

export const SCHWARTZ_VALUES = [
  'self_direction',
  'stimulation',
  'hedonism',
  'achievement',
  'power',
  'security',
  'conformity',
  'tradition',
  'benevolence',
  'universalism'
] as const;

export type SchwartzValue = (typeof SCHWARTZ_VALUES)[number];

export type ValuesOption = {
  id: string;
  label: string;
  /** Which Schwartz value this pick awards one point to. */
  value: SchwartzValue;
};

export type ValuesQuestion = {
  id: string;
  prompt: string;
  /** Authored order A–D; UI shuffles per session. */
  options: ValuesOption[];
};

export const VALUES_INSTRUCTIONS = {
  title: 'What Gets You Going',
  headline: 'What would you miss most?',
  lead: 'Go with your gut. One pick only.',
  rules: [
    'You can skip up to three.',
    'Add a short note if you want.',
    'No wrong answers.'
  ],
  maxSkips: 3
} as const;

export const VALUES_QUESTIONS: ValuesQuestion[] = [

  {
    id: 'v01',
    prompt: "You inherit a tiny castle. What excites you most?",
    options: [
      { id: 'a', label: 'Redesigning every room', value: 'self_direction' },
      { id: 'b', label: 'Exploring the hidden passages', value: 'stimulation' },
      { id: 'c', label: 'Being known as the castle owner', value: 'power' },
      { id: 'd', label: 'Hosting the same feast yearly', value: 'tradition' },
    ]
  },
  {
    id: 'v02',
    prompt: "A surprise free Saturday appears. What sounds best?",
    options: [
      { id: 'a', label: 'Trying something unfamiliar', value: 'stimulation' },
      { id: 'b', label: 'Maximum relaxation', value: 'hedonism' },
      { id: 'c', label: 'Knowing the whole plan', value: 'security' },
      { id: 'd', label: 'Spending it with someone close', value: 'benevolence' },
    ]
  },
  {
    id: 'v03',
    prompt: "You win control of a parade float. What matters most?",
    options: [
      { id: 'a', label: 'Having fun on it', value: 'hedonism' },
      { id: 'b', label: 'Making it impressive', value: 'achievement' },
      { id: 'c', label: 'Following the parade theme', value: 'conformity' },
      { id: 'd', label: 'Representing many kinds of people', value: 'universalism' },
    ]
  },
  {
    id: 'v04',
    prompt: "You enter a sandcastle contest. What feels best?",
    options: [
      { id: 'a', label: 'Building the strongest entry', value: 'achievement' },
      { id: 'b', label: 'Getting the most attention', value: 'power' },
      { id: 'c', label: 'Recreating a childhood design', value: 'tradition' },
      { id: 'd', label: 'Making something completely yours', value: 'self_direction' },
    ]
  },
  {
    id: 'v05',
    prompt: "Your group rents a giant cabin. Which feature wins?",
    options: [
      { id: 'a', label: 'The fanciest bedroom', value: 'power' },
      { id: 'b', label: 'Reliable heating', value: 'security' },
      { id: 'c', label: 'Space for everyone', value: 'benevolence' },
      { id: 'd', label: 'A strange room upstairs', value: 'stimulation' },
    ]
  },
  {
    id: 'v06',
    prompt: "You receive a magical backpack. Which power wins?",
    options: [
      { id: 'a', label: 'Protecting everything inside', value: 'security' },
      { id: 'b', label: 'Enforcing its packing rules', value: 'conformity' },
      { id: 'c', label: 'Producing supplies for anyone', value: 'universalism' },
      { id: 'd', label: 'Producing unlimited snacks', value: 'hedonism' },
    ]
  },
  {
    id: 'v07',
    prompt: "Your group invents a handshake. What matters most?",
    options: [
      { id: 'a', label: 'Everyone performs it correctly', value: 'conformity' },
      { id: 'b', label: 'It lasts for years', value: 'tradition' },
      { id: 'c', label: 'Yours stays slightly different', value: 'self_direction' },
      { id: 'd', label: 'It looks impressive', value: 'achievement' },
    ]
  },
  {
    id: 'v08',
    prompt: "You open a neighborhood caf\u00e9. What becomes its signature?",
    options: [
      { id: 'a', label: 'A weekly ritual', value: 'tradition' },
      { id: 'b', label: 'Remembering regular customers', value: 'benevolence' },
      { id: 'c', label: 'Unexpected menu items', value: 'stimulation' },
      { id: 'd', label: 'Being the coolest café nearby', value: 'power' },
    ]
  },
  {
    id: 'v09',
    prompt: "A friendly alien visits Earth. What do you show first?",
    options: [
      { id: 'a', label: 'Your closest people', value: 'benevolence' },
      { id: 'b', label: 'Different human cultures', value: 'universalism' },
      { id: 'c', label: 'Your favorite fun activity', value: 'hedonism' },
      { id: 'd', label: 'A very safe location', value: 'security' },
    ]
  },
  {
    id: 'v10',
    prompt: "You design a school club. What matters most?",
    options: [
      { id: 'a', label: 'Everyone feels included', value: 'universalism' },
      { id: 'b', label: 'Members choose their own projects', value: 'self_direction' },
      { id: 'c', label: 'The club wins awards', value: 'achievement' },
      { id: 'd', label: 'Members respect club rules', value: 'conformity' },
    ]
  },
  {
    id: 'v11',
    prompt: "You receive a blank island. What sounds best?",
    options: [
      { id: 'a', label: 'Designing it your way', value: 'self_direction' },
      { id: 'b', label: 'Discovering what is there', value: 'stimulation' },
      { id: 'c', label: 'Becoming island royalty', value: 'power' },
      { id: 'd', label: 'Creating annual island customs', value: 'tradition' },
    ]
  },
  {
    id: 'v12',
    prompt: "A mystery box arrives. What makes it worthwhile?",
    options: [
      { id: 'a', label: 'The surprise', value: 'stimulation' },
      { id: 'b', label: 'Something enjoyable', value: 'hedonism' },
      { id: 'c', label: 'Something dependable', value: 'security' },
      { id: 'd', label: 'Something chosen by a friend', value: 'benevolence' },
    ]
  },
  {
    id: 'v13',
    prompt: "You direct a ridiculous movie. What matters most?",
    options: [
      { id: 'a', label: 'The cast has fun', value: 'hedonism' },
      { id: 'b', label: 'The movie succeeds', value: 'achievement' },
      { id: 'c', label: 'The crew follows your vision', value: 'conformity' },
      { id: 'd', label: 'Many audiences feel represented', value: 'universalism' },
    ]
  },
  {
    id: 'v14',
    prompt: "You build a robot assistant. What feature wins?",
    options: [
      { id: 'a', label: 'Excellent performance', value: 'achievement' },
      { id: 'b', label: 'Instant respect from other robots', value: 'power' },
      { id: 'c', label: 'Familiar household routines', value: 'tradition' },
      { id: 'd', label: 'A unique personality', value: 'self_direction' },
    ]
  },
  {
    id: 'v15',
    prompt: "You become mayor of a pillow fort. What matters most?",
    options: [
      { id: 'a', label: 'Having the final say', value: 'power' },
      { id: 'b', label: 'Keeping the fort secure', value: 'security' },
      { id: 'c', label: 'Taking care of the residents', value: 'benevolence' },
      { id: 'd', label: 'Adding secret tunnels', value: 'stimulation' },
    ]
  },
  {
    id: 'v16',
    prompt: "You manage a dragon sanctuary. What matters most?",
    options: [
      { id: 'a', label: 'Strong protective walls', value: 'security' },
      { id: 'b', label: 'Clear sanctuary rules', value: 'conformity' },
      { id: 'c', label: 'Space for every dragon type', value: 'universalism' },
      { id: 'd', label: 'Dragon playtime', value: 'hedonism' },
    ]
  },
  {
    id: 'v17',
    prompt: "You create a new holiday. What matters most?",
    options: [
      { id: 'a', label: 'Everyone follows the custom', value: 'conformity' },
      { id: 'b', label: 'People celebrate it yearly', value: 'tradition' },
      { id: 'c', label: 'Each person celebrates differently', value: 'self_direction' },
      { id: 'd', label: 'It becomes famous', value: 'achievement' },
    ]
  },
  {
    id: 'v18',
    prompt: "You plan a reunion. What matters most?",
    options: [
      { id: 'a', label: 'Keeping familiar traditions', value: 'tradition' },
      { id: 'b', label: 'Making people feel remembered', value: 'benevolence' },
      { id: 'c', label: 'Adding a surprise', value: 'stimulation' },
      { id: 'd', label: 'Making it look impressive', value: 'power' },
    ]
  },
  {
    id: 'v19',
    prompt: "You control a giant garden. What feels best?",
    options: [
      { id: 'a', label: 'Growing plants for loved ones', value: 'benevolence' },
      { id: 'b', label: 'Supporting many plant species', value: 'universalism' },
      { id: 'c', label: 'Creating the nicest picnic spot', value: 'hedonism' },
      { id: 'd', label: 'Keeping every path predictable', value: 'security' },
    ]
  },
  {
    id: 'v20',
    prompt: "You create a video game guild. What matters most?",
    options: [
      { id: 'a', label: 'Welcoming many player types', value: 'universalism' },
      { id: 'b', label: 'Letting members choose their roles', value: 'self_direction' },
      { id: 'c', label: 'Reaching the top ranking', value: 'achievement' },
      { id: 'd', label: 'Following guild expectations', value: 'conformity' },
    ]
  },
  {
    id: 'v21',
    prompt: "You receive a personal theme song. What matters most?",
    options: [
      { id: 'a', label: 'It sounds uniquely yours', value: 'self_direction' },
      { id: 'b', label: 'It feels exciting', value: 'stimulation' },
      { id: 'c', label: 'People recognize it instantly', value: 'power' },
      { id: 'd', label: 'It connects to your past', value: 'tradition' },
    ]
  },
  {
    id: 'v22',
    prompt: "Your group discovers a new hangout. What makes it perfect?",
    options: [
      { id: 'a', label: 'It feels different', value: 'stimulation' },
      { id: 'b', label: 'It feels enjoyable', value: 'hedonism' },
      { id: 'c', label: 'It feels reliable', value: 'security' },
      { id: 'd', label: 'Your friends feel comfortable there', value: 'benevolence' },
    ]
  },
  {
    id: 'v23',
    prompt: "You host a costume party. What result feels best?",
    options: [
      { id: 'a', label: 'Everyone has fun', value: 'hedonism' },
      { id: 'b', label: 'Your costume wins', value: 'achievement' },
      { id: 'c', label: 'Everyone respects the theme', value: 'conformity' },
      { id: 'd', label: 'Many styles appear', value: 'universalism' },
    ]
  },
  {
    id: 'v24',
    prompt: "You enter a cooking competition. What feels best?",
    options: [
      { id: 'a', label: 'Mastering the challenge', value: 'achievement' },
      { id: 'b', label: 'Impressing the judges', value: 'power' },
      { id: 'c', label: 'Using a family recipe', value: 'tradition' },
      { id: 'd', label: 'Inventing your own dish', value: 'self_direction' },
    ]
  },
  {
    id: 'v25',
    prompt: "You command a spaceship. What matters most?",
    options: [
      { id: 'a', label: 'Holding authority', value: 'power' },
      { id: 'b', label: 'Returning safely', value: 'security' },
      { id: 'c', label: 'Protecting the crew', value: 'benevolence' },
      { id: 'd', label: 'Visiting unknown planets', value: 'stimulation' },
    ]
  },
  {
    id: 'v26',
    prompt: "You manage a magical zoo. What matters most?",
    options: [
      { id: 'a', label: 'Secure enclosures', value: 'security' },
      { id: 'b', label: 'Clear visitor rules', value: 'conformity' },
      { id: 'c', label: 'Protecting every creature type', value: 'universalism' },
      { id: 'd', label: 'Fun exhibits', value: 'hedonism' },
    ]
  },
  {
    id: 'v27',
    prompt: "You join a secret society. What matters most?",
    options: [
      { id: 'a', label: 'Members respect the code', value: 'conformity' },
      { id: 'b', label: 'The rituals continue', value: 'tradition' },
      { id: 'c', label: 'You keep personal freedom', value: 'self_direction' },
      { id: 'd', label: 'The society accomplishes big things', value: 'achievement' },
    ]
  },
  {
    id: 'v28',
    prompt: "You plan a yearly group trip. What matters most?",
    options: [
      { id: 'a', label: 'Returning to a meaningful place', value: 'tradition' },
      { id: 'b', label: 'Everyone feels considered', value: 'benevolence' },
      { id: 'c', label: 'The trip includes something new', value: 'stimulation' },
      { id: 'd', label: 'The trip looks impressive online', value: 'power' },
    ]
  },
  {
    id: 'v29',
    prompt: "You create a perfect park. What matters most?",
    options: [
      { id: 'a', label: 'Your favorite people enjoy it', value: 'benevolence' },
      { id: 'b', label: 'Many communities use it', value: 'universalism' },
      { id: 'c', label: 'It has excellent entertainment', value: 'hedonism' },
      { id: 'd', label: 'It feels calm', value: 'security' },
    ]
  },
  {
    id: 'v30',
    prompt: "You lead a treasure-hunting team. What matters most?",
    options: [
      { id: 'a', label: 'Everyone gets a fair chance', value: 'universalism' },
      { id: 'b', label: 'Each person chooses their method', value: 'self_direction' },
      { id: 'c', label: 'Your team finds the treasure first', value: 'achievement' },
      { id: 'd', label: 'Everyone follows the map rules', value: 'conformity' },
    ]
  },
];
