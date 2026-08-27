// ============================================
// WHAT THIS FILE DOES (plain English):
// Every Your Vibe question, what it measures, and how each option leans on
// the Big Five dials (with Extraversion split into sociability + assertiveness).
// Weights are the rubric. The AI never invents these numbers.
// Keys starting with "_" are symptom flags for the scorer (not traits).
// ============================================

export type PersonalityOption = {
  id: string;
  label: string;
  /**
   * Trait leans (-3..+3) plus optional symptom flags (`_execution_block`, …)
   * that score.ts uses to lower confidence — not matching dimensions.
   */
  weights: Record<string, number>;
};

export type PersonalityQuestion = {
  id: string;
  prompt: string;
  /** Primary dials this item is meant to pull on. */
  measures: string[];
  /** Multi-select soft cap (instructions: try not more than two). */
  maxSelect: number;
  /** Follow-ups that separate preference from symptom / execution. */
  followup?: boolean;
  options: PersonalityOption[];
};

export const PERSONALITY_INSTRUCTIONS = {
  title: 'Your Vibe',
  lead: 'Answer based on what you are usually like when your mental-health symptoms are relatively manageable.',
  rules: [
    'Choose the answer that feels closest most often.',
    'You may choose two answers when they are genuinely tied. Try not to choose more than two.',
    'There are no good or bad answers.',
    'Choose "None of these" when none of the answers fit.',
    'Optional: text a short why under your picks — like a chat bubble.'
  ]
} as const;

export const PERSONALITY_QUESTIONS: PersonalityQuestion[] = [

  {
    id: 'p01',
    prompt: "You are alone at a casual event. Someone nearby is also alone. What do you usually do?",
    measures: ["sociability", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Start talking to them', weights: { sociability: 3, assertiveness: 2 } },
      { id: 'b', label: 'Wait for eye contact', weights: { sociability: 1 } },
      { id: 'c', label: 'Stay focused on the event', weights: { sociability: -2 } },
      { id: 'd', label: 'Hope they approach you', weights: { sociability: -1, assertiveness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p02',
    prompt: "You planned to do laundry today. Nothing is forcing you to do it. What usually happens?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I do it around the planned time', weights: { conscientiousness: 3 } },
      { id: 'b', label: 'I do it later that day', weights: { conscientiousness: 1 } },
      { id: 'c', label: 'I do it when I need clean clothes', weights: { conscientiousness: -1 } },
      { id: 'd', label: 'I move it to another day', weights: { conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p03',
    prompt: "A friend recommends a restaurant you have never heard of. What do you usually say?",
    measures: ["openness", "agreeableness", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: '"Let\'s try it."', weights: { openness: 3, agreeableness: 1 } },
      { id: 'b', label: '"Let me see the menu."', weights: { openness: 1 } },
      { id: 'c', label: '"Can we pick somewhere familiar?"', weights: { openness: -2 } },
      { id: 'd', label: '"You decide."', weights: { agreeableness: 2, assertiveness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p04',
    prompt: "Someone makes a small negative comment about you. What usually happens afterward?",
    measures: ["neuroticism"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I stop thinking about it quickly', weights: { neuroticism: -3 } },
      { id: 'b', label: 'It returns to my mind a few times', weights: {} },
      { id: 'c', label: 'It affects the rest of my day', weights: { neuroticism: 2 } },
      { id: 'd', label: 'It affects me beyond that day', weights: { neuroticism: 3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p05',
    prompt: "A friend suggests something you strongly dislike. What do you usually do?",
    measures: ["assertiveness", "agreeableness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Say clearly that I dislike it', weights: { assertiveness: 3, agreeableness: -1 } },
      { id: 'b', label: 'Suggest something else politely', weights: { assertiveness: 1, agreeableness: 2 } },
      { id: 'c', label: 'Go along with it', weights: { assertiveness: -2, agreeableness: 2 } },
      { id: 'd', label: 'Ask what everyone else wants', weights: { assertiveness: -1, agreeableness: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p06',
    prompt: "You arrive at a gathering where you only know one person. What do you do first?",
    measures: ["sociability", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Talk to whoever is nearby', weights: { sociability: 3, assertiveness: 2 } },
      { id: 'b', label: 'Find the person I know', weights: {} },
      { id: 'c', label: 'Look around before joining anyone', weights: { sociability: -1 } },
      { id: 'd', label: 'Wait for someone to include me', weights: { sociability: -2, assertiveness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p07',
    prompt: "You have a task due Friday. Nobody will check on you before then. When do you usually begin?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Several days early', weights: { conscientiousness: 3 } },
      { id: 'b', label: 'One or two days early', weights: { conscientiousness: 2 } },
      { id: 'c', label: 'On Friday', weights: { conscientiousness: -1 } },
      { id: 'd', label: 'When the pressure becomes uncomfortable', weights: { conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p08',
    prompt: "You find a shirt you like in a color you have never worn. What do you usually do?",
    measures: ["openness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Buy the unfamiliar color', weights: { openness: 3 } },
      { id: 'b', label: 'Try the unfamiliar color first', weights: { openness: 2 } },
      { id: 'c', label: 'Choose a familiar color', weights: { openness: -2 } },
      { id: 'd', label: 'Leave without buying it', weights: { openness: -1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p09',
    prompt: "You send a message that receives no reply all day. Nothing upsetting happened beforehand. What do you usually do?",
    measures: ["neuroticism", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Assume they are occupied', weights: { neuroticism: -2 } },
      { id: 'b', label: 'Wonder whether something happened', weights: { neuroticism: 2 } },
      { id: 'c', label: 'Send another message', weights: { assertiveness: 1, neuroticism: 1 } },
      { id: 'd', label: 'Keep checking for a reply', weights: { neuroticism: 3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p10',
    prompt: "Someone asks for your honest opinion. You know they may dislike your answer. What do you usually do?",
    measures: ["assertiveness", "agreeableness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Give the honest answer directly', weights: { assertiveness: 3, agreeableness: -1 } },
      { id: 'b', label: 'Give the honest answer gently', weights: { assertiveness: 2, agreeableness: 2 } },
      { id: 'c', label: 'Soften the answer considerably', weights: { assertiveness: -1, agreeableness: 2 } },
      { id: 'd', label: 'Avoid giving a clear opinion', weights: { assertiveness: -2, agreeableness: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p11',
    prompt: "You are waiting beside someone you do not know. They make a casual comment. What do you usually do?",
    measures: ["sociability", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Turn it into a conversation', weights: { sociability: 3, assertiveness: 2 } },
      { id: 'b', label: 'Respond briefly', weights: { sociability: 1 } },
      { id: 'c', label: 'Smile without continuing', weights: { sociability: -1 } },
      { id: 'd', label: 'Pretend not to hear', weights: { sociability: -3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p12',
    prompt: "You notice a small mess that takes two minutes to clean. What usually happens?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I clean it immediately', weights: { conscientiousness: 3 } },
      { id: 'b', label: 'I clean it later that day', weights: { conscientiousness: 1 } },
      { id: 'c', label: 'I clean it during a larger cleanup', weights: {} },
      { id: 'd', label: 'I leave it until it becomes annoying', weights: { conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p13',
    prompt: "You hear an unusual idea that could possibly be true. What do you usually do first?",
    measures: ["openness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Think through how it might work', weights: { openness: 3 } },
      { id: 'b', label: 'Look for evidence', weights: { openness: 2 } },
      { id: 'c', label: 'Share it with someone', weights: { openness: 2, sociability: 1 } },
      { id: 'd', label: 'Dismiss it unless there is proof', weights: { openness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p14',
    prompt: "You realize you made an embarrassing mistake. Nobody else mentions it. How long does it usually stay with you?",
    measures: ["neuroticism"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'A few minutes', weights: { neuroticism: -3 } },
      { id: 'b', label: 'A few hours', weights: {} },
      { id: 'c', label: 'Until the next day', weights: { neuroticism: 2 } },
      { id: 'd', label: 'Longer than a day', weights: { neuroticism: 3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p15',
    prompt: "Someone says something you believe is clearly incorrect. What do you usually do?",
    measures: ["assertiveness", "agreeableness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Correct them directly', weights: { assertiveness: 3, agreeableness: -2 } },
      { id: 'b', label: 'Ask how they reached that conclusion', weights: { assertiveness: 1, agreeableness: 1 } },
      { id: 'c', label: 'Let it pass', weights: { assertiveness: -2, agreeableness: 2 } },
      { id: 'd', label: 'Mention it privately later', weights: { agreeableness: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p16',
    prompt: "You have a free evening after spending the day around people. What sounds most appealing?",
    measures: ["sociability"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Going somewhere social', weights: { sociability: 3 } },
      { id: 'b', label: 'Calling one person', weights: { sociability: 1 } },
      { id: 'c', label: 'Being alone near other people', weights: { sociability: -1 } },
      { id: 'd', label: 'Having quiet time alone', weights: { sociability: -3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p17',
    prompt: "You finish using scissors. What usually happens?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I return them immediately', weights: { conscientiousness: 3 } },
      { id: 'b', label: 'I leave them nearby temporarily', weights: {} },
      { id: 'c', label: 'I put them away during cleanup', weights: { conscientiousness: 1 } },
      { id: 'd', label: 'I leave them where I used them', weights: { conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p18',
    prompt: "You see an unfamiliar snack that looks interesting. What do you usually choose?",
    measures: ["openness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'The unfamiliar snack', weights: { openness: 3 } },
      { id: 'b', label: 'A new version of something familiar', weights: { openness: 1 } },
      { id: 'c', label: 'Something I already know I like', weights: { openness: -2 } },
      { id: 'd', label: 'Whatever looks most appealing in that moment', weights: { openness: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p19',
    prompt: "Someone important sends you a critical message. What do you usually do first?",
    measures: ["neuroticism", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Reply immediately', weights: { assertiveness: 2, neuroticism: 1 } },
      { id: 'b', label: 'Reread it carefully', weights: { neuroticism: 1 } },
      { id: 'c', label: 'Ask someone else what they think', weights: { neuroticism: 2, assertiveness: -1 } },
      { id: 'd', label: 'Wait until I feel calmer', weights: {} },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p20',
    prompt: "A friend needs help with something mildly inconvenient. What do you usually do?",
    measures: ["agreeableness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Help immediately', weights: { agreeableness: 3 } },
      { id: 'b', label: 'Find a solution that works for both of us', weights: { agreeableness: 2 } },
      { id: 'c', label: 'Help only when it is easy', weights: {} },
      { id: 'd', label: 'Say I cannot help', weights: { agreeableness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p21',
    prompt: "You enter a room where several conversations are already happening. What do you usually do?",
    measures: ["sociability", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Join the nearest conversation', weights: { sociability: 3, assertiveness: 2 } },
      { id: 'b', label: 'Find someone familiar', weights: {} },
      { id: 'c', label: 'Listen until there is an opening', weights: { sociability: -1 } },
      { id: 'd', label: 'Wait for someone to approach', weights: { sociability: -2, assertiveness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p22',
    prompt: "You planned to clean at 10:00. At 10:00, you do not feel motivated. What usually happens?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I begin anyway', weights: { conscientiousness: 3 } },
      { id: 'b', label: 'I delay it briefly', weights: { conscientiousness: 1 } },
      { id: 'c', label: 'I switch to something else', weights: { conscientiousness: -1 } },
      { id: 'd', label: 'I postpone it to another day', weights: { conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p23',
    prompt: "You visit a city you have never seen before. How do you prefer to explore it?",
    measures: ["openness", "conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Wander without a plan', weights: { openness: 3, conscientiousness: -2 } },
      { id: 'b', label: 'Choose a few places beforehand', weights: { openness: 1, conscientiousness: 1 } },
      { id: 'c', label: 'Follow a detailed schedule', weights: { openness: -1, conscientiousness: 3 } },
      { id: 'd', label: 'Stay near familiar-looking areas', weights: { openness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p24',
    prompt: "You wake up feeling stressed for no clear reason. What is usually true by lunchtime?",
    measures: ["neuroticism"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'The feeling has mostly passed', weights: { neuroticism: -3 } },
      { id: 'b', label: 'It comes back occasionally', weights: {} },
      { id: 'c', label: 'It remains strong', weights: { neuroticism: 2 } },
      { id: 'd', label: 'It has become stronger', weights: { neuroticism: 3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p25',
    prompt: "A friend tells you that something you did bothered them. What do you usually do first?",
    measures: ["agreeableness", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Ask what bothered them', weights: { agreeableness: 2, assertiveness: 1 } },
      { id: 'b', label: 'Explain what I meant', weights: { assertiveness: 2 } },
      { id: 'c', label: 'Apologize immediately', weights: { agreeableness: 3, assertiveness: -1 } },
      { id: 'd', label: 'Become defensive', weights: { agreeableness: -2, assertiveness: 2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p26',
    prompt: "You receive an invitation involving mostly unfamiliar people. What is your first reaction?",
    measures: ["sociability"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I want to go', weights: { sociability: 3 } },
      { id: 'b', label: 'I want more details', weights: { sociability: 1 } },
      { id: 'c', label: 'I hope someone familiar attends', weights: { sociability: -1 } },
      { id: 'd', label: 'I would rather decline', weights: { sociability: -3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p27',
    prompt: "Your laundry finishes drying. What usually happens next?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I fold it immediately', weights: { conscientiousness: 3 } },
      { id: 'b', label: 'I fold it later that day', weights: { conscientiousness: 1 } },
      { id: 'c', label: 'I move it into a basket', weights: {} },
      { id: 'd', label: 'I leave it in the dryer', weights: { conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p28',
    prompt: "An app you use changes its entire layout. What do you usually do?",
    measures: ["openness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Explore the new layout', weights: { openness: 3 } },
      { id: 'b', label: 'Look for the features I already used', weights: { openness: -1 } },
      { id: 'c', label: 'Read about what changed', weights: { openness: 1 } },
      { id: 'd', label: 'Avoid using it temporarily', weights: { openness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p29',
    prompt: "Someone sounds irritated with you. What do you usually do first?",
    measures: ["neuroticism", "agreeableness", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Ask what is wrong', weights: { agreeableness: 2, assertiveness: 1 } },
      { id: 'b', label: 'Explain yourself', weights: { assertiveness: 2 } },
      { id: 'c', label: 'Give them space', weights: { agreeableness: 1 } },
      { id: 'd', label: 'Become irritated too', weights: { agreeableness: -2, neuroticism: 2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p30',
    prompt: "A group is deciding where to eat. You have a strong preference. What do you usually do?",
    measures: ["assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'State my preference clearly', weights: { assertiveness: 3 } },
      { id: 'b', label: 'Suggest my preference casually', weights: { assertiveness: 1 } },
      { id: 'c', label: 'Wait to hear everyone else', weights: { assertiveness: -1 } },
      { id: 'd', label: 'Accept whatever the group chooses', weights: { assertiveness: -3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p31',
    prompt: "You have been alone for most of the day. What usually happens by evening?",
    measures: ["sociability"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I seek out people', weights: { sociability: 3 } },
      { id: 'b', label: 'I message or call someone', weights: { sociability: 2 } },
      { id: 'c', label: 'I am content staying alone', weights: { sociability: -2 } },
      { id: 'd', label: 'I feel relieved to remain alone', weights: { sociability: -3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p32',
    prompt: "You agree to meet someone at 6:00. When do you usually arrive?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Before 5:55', weights: { conscientiousness: 3 } },
      { id: 'b', label: 'Between 5:55 and 6:00', weights: { conscientiousness: 2 } },
      { id: 'c', label: 'Between 6:01 and 6:10', weights: { conscientiousness: -1 } },
      { id: 'd', label: 'After 6:10', weights: { conscientiousness: -3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p33',
    prompt: "You begin a hobby that feels difficult on the first try. What usually happens?",
    measures: ["conscientiousness", "openness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I practice again soon', weights: { conscientiousness: 3, openness: 1 } },
      { id: 'b', label: 'I try it a few more times', weights: { conscientiousness: 2 } },
      { id: 'c', label: 'I return only when I feel interested', weights: { conscientiousness: -1 } },
      { id: 'd', label: 'I lose interest', weights: { conscientiousness: -2, openness: -1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p34',
    prompt: "You spill something on your clothing before leaving home. How long does it usually bother you?",
    measures: ["neuroticism"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Less than a minute', weights: { neuroticism: -3 } },
      { id: 'b', label: 'A few minutes', weights: { neuroticism: -1 } },
      { id: 'c', label: 'Much of the morning', weights: { neuroticism: 2 } },
      { id: 'd', label: 'Much of the day', weights: { neuroticism: 3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p35',
    prompt: "Someone presents a viewpoint you strongly oppose. What do you usually do?",
    measures: ["assertiveness", "agreeableness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Challenge it directly', weights: { assertiveness: 3, agreeableness: -2 } },
      { id: 'b', label: 'Ask why they believe it', weights: { assertiveness: 1, agreeableness: 1, openness: 1 } },
      { id: 'c', label: 'Change the subject', weights: { assertiveness: -1, agreeableness: 1 } },
      { id: 'd', label: 'Keep my reaction private', weights: { assertiveness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p36',
    prompt: "You have an unexpected free hour. What do you usually do first?",
    measures: ["sociability", "conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Contact someone', weights: { sociability: 3 } },
      { id: 'b', label: 'Leave the house', weights: { sociability: 1, openness: 1 } },
      { id: 'c', label: 'Start a task', weights: { conscientiousness: 2 } },
      { id: 'd', label: 'Relax by myself', weights: { sociability: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p37',
    prompt: "You notice your phone is almost dead while you are at home. What do you usually do?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Charge it immediately', weights: { conscientiousness: 3 } },
      { id: 'b', label: 'Charge it when convenient', weights: { conscientiousness: 1 } },
      { id: 'c', label: 'Wait until it is nearly dead', weights: { conscientiousness: -1 } },
      { id: 'd', label: 'Keep using it until it dies', weights: { conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p38',
    prompt: "A restaurant offers something you have never eaten. It sounds reasonably appealing. What do you usually do?",
    measures: ["openness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Order it', weights: { openness: 3 } },
      { id: 'b', label: 'Ask someone about it', weights: { openness: 1 } },
      { id: 'c', label: 'Choose something familiar', weights: { openness: -2 } },
      { id: 'd', label: 'Save it for another time', weights: { openness: -1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p39',
    prompt: "You realize you forgot an important deadline. What happens first?",
    measures: ["neuroticism", "conscientiousness", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I immediately begin fixing it', weights: { conscientiousness: 2, assertiveness: 2, neuroticism: -1 } },
      { id: 'b', label: 'I contact the person involved', weights: { assertiveness: 2, conscientiousness: 1 } },
      { id: 'c', label: 'I become overwhelmed before acting', weights: { neuroticism: 3, conscientiousness: -1 } },
      { id: 'd', label: 'I avoid dealing with it temporarily', weights: { neuroticism: 2, conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p40',
    prompt: "A friend has a problem you think they caused themselves. What do you usually do?",
    measures: ["agreeableness", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Tell them directly what they did', weights: { assertiveness: 2, agreeableness: -2 } },
      { id: 'b', label: 'Help them solve it without focusing on blame', weights: { agreeableness: 3 } },
      { id: 'c', label: 'Comfort them before discussing it', weights: { agreeableness: 3 } },
      { id: 'd', label: 'Stay out of it', weights: {} },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p41',
    prompt: "Someone invites you somewhere with one hour of notice. The activity is affordable. What do you usually do?",
    measures: ["sociability", "openness", "conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Go unless I already have plans', weights: { sociability: 2, openness: 2 } },
      { id: 'b', label: 'Decide based on whether it sounds enjoyable', weights: { openness: 1 } },
      { id: 'c', label: 'Prefer more notice', weights: { conscientiousness: 1, openness: -1 } },
      { id: 'd', label: 'Decline most of the time', weights: { sociability: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p42',
    prompt: "You have several chores available. What determines which one you start?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'A planned order', weights: { conscientiousness: 3 } },
      { id: 'b', label: 'Importance', weights: { conscientiousness: 2 } },
      { id: 'c', label: 'Ease', weights: { conscientiousness: -1 } },
      { id: 'd', label: 'Whatever catches my attention', weights: { conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p43',
    prompt: "You are given vague instructions for a task. What do you usually do?",
    measures: ["openness", "assertiveness", "conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Begin and figure it out', weights: { openness: 2, assertiveness: 2 } },
      { id: 'b', label: 'Ask for clarification', weights: { assertiveness: 1, conscientiousness: 1 } },
      { id: 'c', label: 'Look at an example', weights: { openness: 1 } },
      { id: 'd', label: 'Delay starting', weights: { conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p44',
    prompt: "You hear that plans have changed at the last minute. What do you feel first?",
    measures: ["openness", "neuroticism", "conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Interested in the new plan', weights: { openness: 3 } },
      { id: 'b', label: 'Annoyed by the change', weights: { conscientiousness: 1, neuroticism: 1 } },
      { id: 'c', label: 'Relieved', weights: {} },
      { id: 'd', label: 'Unbothered', weights: { neuroticism: -2, openness: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p45',
    prompt: "Someone cuts ahead of several people in line. What do you usually do?",
    measures: ["assertiveness", "agreeableness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Say something directly', weights: { assertiveness: 3, agreeableness: -1 } },
      { id: 'b', label: 'Alert an employee', weights: { assertiveness: 1 } },
      { id: 'c', label: 'Mention it quietly to someone nearby', weights: {} },
      { id: 'd', label: 'Let it go', weights: { assertiveness: -2, agreeableness: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p46',
    prompt: "At a party, you realize you have not spoken for several minutes. What usually happens?",
    measures: ["sociability", "assertiveness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'I start a conversation', weights: { sociability: 3, assertiveness: 2 } },
      { id: 'b', label: 'I move toward someone familiar', weights: { sociability: 1 } },
      { id: 'c', label: 'I continue listening', weights: { sociability: -1 } },
      { id: 'd', label: 'I consider leaving', weights: { sociability: -3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p47',
    prompt: "You make a plan for yourself that does not work. What do you usually do?",
    measures: ["conscientiousness", "openness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Try another approach immediately', weights: { conscientiousness: 2, openness: 2 } },
      { id: 'b', label: 'Think about why it failed', weights: { conscientiousness: 1, openness: 1 } },
      { id: 'c', label: 'Ask someone for help', weights: { sociability: 1 } },
      { id: 'd', label: 'Drop it for now', weights: { conscientiousness: -2 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p48',
    prompt: "You hear a song you have never heard before. You like it immediately. What do you usually do?",
    measures: ["openness", "sociability"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Replay it', weights: { openness: 1 } },
      { id: 'b', label: 'Save it', weights: { openness: 1 } },
      { id: 'c', label: 'Send it to someone', weights: { sociability: 2, openness: 1 } },
      { id: 'd', label: 'Explore more music by the artist', weights: { openness: 3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p49',
    prompt: "You notice a typo in an important message after sending it. Editing is no longer available. What do you usually do?",
    measures: ["neuroticism", "conscientiousness"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Send a correction', weights: { conscientiousness: 2, assertiveness: 1 } },
      { id: 'b', label: 'Leave it alone', weights: { neuroticism: -2 } },
      { id: 'c', label: 'Reread the message for other mistakes', weights: { neuroticism: 1, conscientiousness: 1 } },
      { id: 'd', label: 'Keep thinking about it afterward', weights: { neuroticism: 3 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p50',
    prompt: "A friend cancels plans one hour beforehand. What do you usually do next?",
    measures: ["sociability", "openness", "neuroticism"],
    maxSelect: 2,
    options: [
      { id: 'a', label: 'Make different plans', weights: { sociability: 2, openness: 2 } },
      { id: 'b', label: 'Ask someone else to meet', weights: { sociability: 2 } },
      { id: 'c', label: 'Stay home', weights: { sociability: -1 } },
      { id: 'd', label: 'Continue preparing as though I may go out', weights: { neuroticism: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p51',
    prompt: "When you fail to complete a task, what is most often true?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    followup: true,
    options: [
      { id: 'a', label: 'I did not care enough about it', weights: { conscientiousness: -2 } },
      { id: 'b', label: 'I wanted to do it but could not start', weights: { _execution_block: 1 } },
      { id: 'c', label: 'I started but lost focus', weights: { _focus_drift: 1 } },
      { id: 'd', label: 'I became overwhelmed', weights: { _overwhelm: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p52',
    prompt: "When you avoid a social situation, what is most often true?",
    measures: ["sociability"],
    maxSelect: 2,
    followup: true,
    options: [
      { id: 'a', label: 'I do not want social contact', weights: { sociability: -3 } },
      { id: 'b', label: 'I expect to feel anxious', weights: { _social_anxiety: 1 } },
      { id: 'c', label: 'The environment feels overstimulating', weights: { _overstimulation: 1 } },
      { id: 'd', label: 'I lack the energy', weights: { _low_energy: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p53',
    prompt: "When you choose something familiar, what is most often true?",
    measures: ["openness"],
    maxSelect: 2,
    followup: true,
    options: [
      { id: 'a', label: 'Familiar things genuinely appeal to me more', weights: { openness: -2 } },
      { id: 'b', label: 'New things create anxiety', weights: { _novelty_anxiety: 1 } },
      { id: 'c', label: 'New things require too much effort', weights: { _effort_cost: 1 } },
      { id: 'd', label: 'I dislike sensory surprises', weights: { _sensory: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p54',
    prompt: "When you organize something carefully, what is most often true?",
    measures: ["conscientiousness"],
    maxSelect: 2,
    followup: true,
    options: [
      { id: 'a', label: 'I enjoy order', weights: { conscientiousness: 3 } },
      { id: 'b', label: 'I want to avoid mistakes', weights: { conscientiousness: 1, neuroticism: 1 } },
      { id: 'c', label: 'I feel distressed unless it is done correctly', weights: { neuroticism: 2, _rigidity: 1 } },
      { id: 'd', label: 'I am compensating for forgetfulness', weights: { _compensation: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
  {
    id: 'p55',
    prompt: "When you react strongly to criticism, what is most often true?",
    measures: ["neuroticism", "agreeableness"],
    maxSelect: 2,
    followup: true,
    options: [
      { id: 'a', label: 'I feel embarrassed', weights: { neuroticism: 2 } },
      { id: 'b', label: 'I fear the relationship is damaged', weights: { neuroticism: 2, agreeableness: 1 } },
      { id: 'c', label: 'I become angry at being misunderstood', weights: { agreeableness: -1, assertiveness: 1 } },
      { id: 'd', label: 'It confirms negative thoughts I already had', weights: { neuroticism: 3, _negative_bias: 1 } },
      { id: 'e', label: 'None of these', weights: {} },
    ]
  },
];


export function getPersonalityQuestion(id: string): PersonalityQuestion | undefined {
  return PERSONALITY_QUESTIONS.find((q) => q.id === id);
}
