// ============================================
// WHAT THIS FILE DOES (plain English):
// The Friend Zone questions: friendship scenes, not romance. Each option leans
// on anxiety, avoidance, and/or SES (social-evaluation sensitivity). The AI
// never invents these numbers. Pair a13+a14 is special-cased in score.ts.
// ============================================

export type AttachmentOption = {
  id: string;
  label: string;
  /** Evidence points 0–2 toward anxiety / avoidance / ses. */
  weights: { anxiety?: number; avoidance?: number; ses?: number };
};

export type AttachmentQuestion = {
  id: string;
  prompt: string;
  measures: string[];
  /** Multi-select soft cap. */
  maxSelect: number;
  /** Importance multiplier (vulnerability / dependence items weigh more). */
  weight: number;
  /** Control item — mostly SES, light on attachment. */
  control?: boolean;
  /** Global cross-check — never dominates the result. */
  crosscheck?: boolean;
  /** Paired support items: uncertain vs safe availability. */
  pair?: 'support_uncertain' | 'support_safe';
  options: AttachmentOption[];
};

export const ATTACHMENT_INSTRUCTIONS = {
  title: 'The Friend Zone',
  headline: 'How are you with your people?',
  lead: 'There are no good or bad answers here. Pick what feels most like your first reaction, even if another answer could fit too.',
  rules: [
    'If two really fit, you can choose two.',
    "Don't overthink it.",
    'Optional: text a short why under your picks — like a chat bubble.'
  ]
} as const;

export const ATTACHMENT_QUESTIONS: AttachmentQuestion[] = [

  {
    id: 'a01',
    prompt: "You send someone a personal message. You can see they read it, but they haven't answered yet.\nWhat happens inside?",
    measures: ["anxiety", "avoidance"],
    maxSelect: 2,
    weight: 1.0,
    options: [
      { id: 'a', label: 'I figure they\'ll answer when they can.', weights: {} },
      { id: 'b', label: 'I start wondering what they thought about it.', weights: { anxiety: 2, ses: 1 } },
      { id: 'c', label: 'I wish I hadn\'t sent something so personal.', weights: { avoidance: 2, ses: 1 } },
      { id: 'd', label: 'I feel better having a little space after sharing.', weights: { avoidance: 2 } },
    ]
  },
  {
    id: 'a02',
    prompt: "You've had a terrible day. Someone you trust notices and gives you their full attention.\nWhat feels strongest?",
    measures: ["avoidance", "anxiety"],
    maxSelect: 2,
    weight: 1.0,
    options: [
      { id: 'a', label: 'Relief — I can finally get it all out.', weights: {} },
      { id: 'b', label: 'Comfort — I\'m glad they\'re here.', weights: {} },
      { id: 'c', label: 'Awkwardness — I don\'t really want to be the focus.', weights: { avoidance: 2 } },
      { id: 'd', label: 'Nervousness — I wonder what they\'ll think of me afterward.', weights: { anxiety: 2, ses: 2 } },
    ]
  },
  {
    id: 'a03',
    prompt: "Someone you usually spend a lot of time with is suddenly really busy for a week.\nHow does the change feel?",
    measures: ["anxiety", "avoidance"],
    maxSelect: 2,
    weight: 1.0,
    options: [
      { id: 'a', label: 'A little sad, but basically okay.', weights: {} },
      { id: 'b', label: 'I start wondering if something changed between us.', weights: { anxiety: 2 } },
      { id: 'c', label: 'I actually enjoy having more time to myself.', weights: { avoidance: 1 } },
      { id: 'd', label: 'I miss them enough that it\'s hard not to think about it.', weights: { anxiety: 2 } },
    ]
  },
  {
    id: 'a04',
    prompt: "You need a small favor that someone you know could easily help with.\nWhat are you most likely to feel?",
    measures: ["avoidance", "anxiety"],
    maxSelect: 2,
    weight: 1.0,
    options: [
      { id: 'a', label: 'Fine asking them.', weights: {} },
      { id: 'b', label: 'I\'d rather try to handle it myself first.', weights: { avoidance: 2 } },
      { id: 'c', label: 'I hope they notice and offer.', weights: { anxiety: 1 } },
      { id: 'd', label: 'I worry about bothering them.', weights: { anxiety: 2 } },
    ]
  },
  {
    id: 'a05',
    prompt: "Someone gets to know you really well.\nWhich part feels biggest?",
    measures: ["anxiety", "avoidance"],
    maxSelect: 2,
    weight: 1.5,
    options: [
      { id: 'a', label: 'Being understood feels good.', weights: {} },
      { id: 'b', label: 'Being known that well feels exposing.', weights: { avoidance: 2, ses: 1 } },
      { id: 'c', label: 'I like it, but I wonder if they\'ll still like everything they learn.', weights: { anxiety: 2, ses: 1 } },
      { id: 'd', label: 'Part of me wants to keep some distance.', weights: { avoidance: 2 } },
    ]
  },
  {
    id: 'a06',
    prompt: "Someone important to you makes a new friend they seem to really like.\nWhat catches your attention first?",
    measures: ["anxiety"],
    maxSelect: 2,
    weight: 1.0,
    options: [
      { id: 'a', label: 'I want to meet this new person.', weights: {} },
      { id: 'b', label: 'I wonder if I\'ll be included too.', weights: { anxiety: 1 } },
      { id: 'c', label: 'I wonder if I\'ll matter less now.', weights: { anxiety: 2 } },
      { id: 'd', label: 'I mostly just keep doing my own thing.', weights: {} },
    ]
  },
  {
    id: 'a07',
    prompt: "You tell someone something embarrassing about yourself. They react kindly.\nLater that night, what lingers?",
    measures: ["anxiety", "avoidance", "ses"],
    maxSelect: 2,
    weight: 1.5,
    options: [
      { id: 'a', label: 'I\'m glad I told them.', weights: {} },
      { id: 'b', label: 'I still replay what I said.', weights: { anxiety: 1, ses: 2 } },
      { id: 'c', label: 'I feel closer to them now.', weights: {} },
      { id: 'd', label: 'I wish I\'d kept it to myself.', weights: { avoidance: 2 } },
    ]
  },
  {
    id: 'a08',
    prompt: "Someone says, \"I really like having you in my life.\"\nWhat lands first?",
    measures: ["anxiety", "avoidance", "ses"],
    maxSelect: 2,
    weight: 1.0,
    options: [
      { id: 'a', label: 'Happiness.', weights: {} },
      { id: 'b', label: 'Relief.', weights: { anxiety: 1 } },
      { id: 'c', label: 'Embarrassment.', weights: { avoidance: 1, ses: 2 } },
      { id: 'd', label: 'Doubt about whether they really mean it.', weights: { anxiety: 2 } },
    ]
  },
  {
    id: 'a09',
    prompt: "You're upset. Someone you trust says, \"I'm here. Tell me whatever you want.\"\nWhat feels most natural?",
    measures: ["avoidance", "anxiety"],
    maxSelect: 2,
    weight: 1.5,
    options: [
      { id: 'a', label: 'Talking until I\'ve gotten it out.', weights: {} },
      { id: 'b', label: 'Sharing some of it, then stopping.', weights: { avoidance: 1 } },
      { id: 'c', label: 'Appreciating them but wanting to handle it privately.', weights: { avoidance: 2 } },
      { id: 'd', label: 'Wanting to talk but worrying I\'ll be too much.', weights: { anxiety: 2 } },
    ]
  },
  {
    id: 'a10',
    prompt: "You invite someone to something and they can't come.\nAssume their reason makes sense.\nWhat's left afterward?",
    measures: ["anxiety"],
    maxSelect: 2,
    weight: 1.0,
    options: [
      { id: 'a', label: 'A little disappointment, then I\'m fine.', weights: {} },
      { id: 'b', label: 'I still wonder whether they actually wanted to come.', weights: { anxiety: 2 } },
      { id: 'c', label: 'I don\'t mind much and make other plans.', weights: {} },
      { id: 'd', label: 'It stings more than I think it should.', weights: { anxiety: 2 } },
    ]
  },
  {
    id: 'a11',
    prompt: "Someone you care about wants to spend a lot more time with you lately.\nHow does that feel?",
    measures: ["avoidance", "anxiety"],
    maxSelect: 2,
    weight: 1.0,
    options: [
      { id: 'a', label: 'Exciting.', weights: {} },
      { id: 'b', label: 'Nice, but I still want plenty of my own time.', weights: {} },
      { id: 'c', label: 'Like a little too much pressure.', weights: { avoidance: 2 } },
      { id: 'd', label: 'Great, because it shows how much I matter to them.', weights: { anxiety: 1 } },
    ]
  },
  {
    id: 'a12',
    prompt: "You realize you've become really attached to someone.\nWhich thought feels closest?",
    measures: ["anxiety", "avoidance"],
    maxSelect: 2,
    weight: 2.0,
    options: [
      { id: 'a', label: '"I\'m glad they\'re in my life."', weights: {} },
      { id: 'b', label: '"Wow, they could really hurt me now."', weights: { anxiety: 1, avoidance: 1 } },
      { id: 'c', label: '"I hope they care this much too."', weights: { anxiety: 2 } },
      { id: 'd', label: '"I don\'t love needing someone this much."', weights: { avoidance: 2 } },
    ]
  },
  {
    id: 'a13',
    prompt: "Someone you trust knows you need their support, but you don't know how they feel about helping.\nWhat is strongest?",
    measures: ["anxiety", "avoidance"],
    maxSelect: 2,
    weight: 2.0,
    pair: 'support_uncertain',
    options: [
      { id: 'a', label: 'I feel exposed.', weights: { anxiety: 2, ses: 1 } },
      { id: 'b', label: 'I worry I\'m asking too much.', weights: { anxiety: 2 } },
      { id: 'c', label: 'I\'m okay letting them decide what they can give.', weights: {} },
      { id: 'd', label: 'I wish they didn\'t know I needed anything.', weights: { avoidance: 2 } },
    ]
  },
  {
    id: 'a14',
    prompt: "Same situation \u2014 but now they make it completely clear they're happy to be there for you.\nWhat changes?",
    measures: ["anxiety", "avoidance"],
    maxSelect: 2,
    weight: 2.0,
    pair: 'support_safe',
    options: [
      { id: 'a', label: 'I relax and let them help.', weights: {} },
      { id: 'b', label: 'I\'m grateful, but I still feel uncomfortable needing them.', weights: { avoidance: 2 } },
      { id: 'c', label: 'I still worry they might secretly mind.', weights: { anxiety: 2 } },
      { id: 'd', label: 'I\'d still rather deal with it myself.', weights: { avoidance: 2 } },
    ]
  },
  {
    id: 'a15',
    prompt: "Someone important asks for a few days of space.\nAssume they tell you clearly that they aren't angry.\nWhat remains strongest?",
    measures: ["anxiety", "avoidance"],
    maxSelect: 2,
    weight: 1.5,
    options: [
      { id: 'a', label: 'I miss them, but I can give them the space.', weights: {} },
      { id: 'b', label: 'I still worry something is wrong between us.', weights: { anxiety: 2 } },
      { id: 'c', label: 'The space feels pretty comfortable to me.', weights: { avoidance: 1 } },
      { id: 'd', label: 'I have a hard time not reaching out.', weights: { anxiety: 2 } },
    ]
  },
  {
    id: 'a16',
    prompt: "You have a small disagreement with someone important to you. It's completely private.\nWhat do you want most?",
    measures: ["anxiety", "avoidance"],
    maxSelect: 2,
    weight: 1.0,
    options: [
      { id: 'a', label: 'Understand what happened.', weights: {} },
      { id: 'b', label: 'Know that we\'re still okay.', weights: { anxiety: 1 } },
      { id: 'c', label: 'Get some time alone before dealing with it.', weights: { avoidance: 1 } },
      { id: 'd', label: 'Fix it as quickly as possible.', weights: { anxiety: 2 } },
    ]
  },
  {
    id: 'a17',
    prompt: "Now imagine they tell several other people about that disagreement.\nWhat's hardest about that?",
    measures: ["ses"],
    maxSelect: 2,
    weight: 0.4,
    control: true,
    options: [
      { id: 'a', label: 'Feeling exposed.', weights: { ses: 2 } },
      { id: 'b', label: 'Wondering what everyone thinks of me.', weights: { anxiety: 1, ses: 2 } },
      { id: 'c', label: 'Losing trust in the person who shared it.', weights: {} },
      { id: 'd', label: 'Having something private become public.', weights: {} },
    ]
  },
  {
    id: 'a18',
    prompt: "You're crying and someone you trust notices.\nWhat would feel best?",
    measures: ["avoidance"],
    maxSelect: 2,
    weight: 0.8,
    options: [
      { id: 'a', label: 'Having them quietly stay with me.', weights: {} },
      { id: 'b', label: 'Talking through what\'s happening.', weights: {} },
      { id: 'c', label: 'Having some time alone first.', weights: { avoidance: 1 } },
      { id: 'd', label: 'Knowing they\'re available without having to talk yet.', weights: {} },
    ]
  },
  {
    id: 'a19',
    prompt: "You find out some people you like hung out without inviting you.\nWhat bothers you most?",
    measures: ["anxiety"],
    maxSelect: 2,
    weight: 0.7,
    options: [
      { id: 'a', label: 'Missing something that would\'ve been fun.', weights: {} },
      { id: 'b', label: 'Wondering why I wasn\'t included.', weights: { anxiety: 1 } },
      { id: 'c', label: 'Feeling like I wasn\'t wanted there.', weights: { anxiety: 2 } },
      { id: 'd', label: 'It doesn\'t bother me much this time.', weights: {} },
    ]
  },
  {
    id: 'a20',
    prompt: "Think about the people you're closest to. Which feels most like you?",
    measures: ["anxiety", "avoidance"],
    maxSelect: 2,
    weight: 0.5,
    crosscheck: true,
    options: [
      { id: 'a', label: 'I like being close to people and I\'m okay having my own space.', weights: {} },
      { id: 'b', label: 'I really value closeness and sometimes worry about losing it.', weights: { anxiety: 2 } },
      { id: 'c', label: 'I care about people but usually feel safest handling things myself.', weights: { avoidance: 2 } },
      { id: 'd', label: 'I want deep closeness, but being that vulnerable can also scare me.', weights: { anxiety: 1, avoidance: 1 } },
    ]
  },
];
