import { ModuleQuestion } from '../../../packages/ui';

/**
 * MATCHING MODULES — the admin-editable registry behind the Discover tab.
 *
 * This array IS the admin surface: add an entry and it appears at the top of
 * Discover for everyone; remove one and it disappears. Nothing else needs to
 * change. Order here is the order people see, so put the highest-signal
 * modules first.
 *
 * Two kinds:
 *  - 'module' — a short set of questions in the standard one-per-screen flow.
 *  - 'quiz'   — the same flow, framed as a quiz with a result.
 *
 * The rule for every entry, enforced by ModuleFlow's private mode: answers are
 * never shown to anyone and never appear on a profile. They exist only to find
 * people worth knowing. Nobody has to take them all, or any.
 */
export type MatchModuleKind = 'module' | 'quiz';

export interface MatchModule {
  id: string;
  kind: MatchModuleKind;
  title: string;
  /** why it helps, in one line — shown on the card and the privacy screen */
  blurb: string;
  emoji: string;
  accent: 'purple' | 'teal' | 'coral' | 'amber' | 'blue' | 'pink' | 'green';
  questions: ModuleQuestion[];
}

export const MATCH_MODULES: MatchModule[] = [
{
  id: 'weekends',
  kind: 'module',
  title: 'How you spend a weekend',
  blurb: 'Finds people whose free time looks like yours.',
  emoji: '🗓',
  accent: 'teal',
  questions: [
  {
    id: 'weekend-shape',
    ask: 'What does a good Saturday look like?',
    type: 'single',
    options: ['Out early, doing something', 'Slow morning, then out', 'One long plan', 'No plans at all'],
    emoji: '☀️'
  },
  {
    id: 'weekend-with',
    ask: 'Who is usually there?',
    type: 'single',
    options: ['Just me', 'One friend', 'A few people', 'A crowd'],
    emoji: '👥'
  },
  {
    id: 'weekend-do',
    ask: 'Pick what you actually do, not what you mean to.',
    type: 'multi',
    options: ['Walk somewhere', 'Cook', 'Gym or sport', 'Read', 'Make something', 'Go out', 'Games', 'Nothing'],
    emoji: '🎯'
  }]

},
{
  id: 'social-battery',
  kind: 'module',
  title: 'Your social battery',
  blurb: 'Matches you with people who want the same amount of company.',
  emoji: '🔋',
  accent: 'amber',
  questions: [
  {
    id: 'battery-size',
    ask: 'How often do you want to see people?',
    type: 'single',
    options: ['Most days', 'A couple times a week', 'Once a week', 'A few times a month'],
    emoji: '📆'
  },
  { id: 'battery-when', ask: 'Morning person or night owl?', type: 'thisOrThat', a: 'Morning', b: 'Night', emoji: '🌗' },
  {
    id: 'battery-plans',
    ask: 'Plans made ahead, or same-day?',
    type: 'thisOrThat',
    a: 'Made ahead',
    b: 'Same-day',
    emoji: '📱'
  }]

},
{
  id: 'humor',
  kind: 'quiz',
  title: 'What you find funny',
  blurb: 'The fastest way to tell whether two people will get on.',
  emoji: '😂',
  accent: 'coral',
  questions: [
  {
    id: 'humor-kind',
    ask: 'Which lands hardest?',
    type: 'single',
    options: ['Dry and deadpan', 'Absurd and silly', 'Sharp and mean-ish', 'Warm and goofy'],
    emoji: '🎭'
  },
  {
    id: 'humor-bit',
    ask: 'Do you commit to a bit?',
    type: 'thisOrThat',
    a: 'Ride it into the ground',
    b: 'Let it go',
    emoji: '🎤'
  }]

},
{
  id: 'food',
  kind: 'module',
  title: 'How you eat',
  blurb: 'Most first hangouts are a meal. This makes them easier.',
  emoji: '🍜',
  accent: 'green',
  questions: [
  {
    id: 'food-adventure',
    ask: 'New place or the usual?',
    type: 'thisOrThat',
    a: 'Somewhere new',
    b: 'The usual',
    emoji: '🍽'
  },
  {
    id: 'food-no',
    ask: 'Anything you avoid?',
    type: 'multi',
    options: ['Meat', 'Dairy', 'Gluten', 'Shellfish', 'Nuts', 'Alcohol', 'Nothing'],
    emoji: '🚫'
  }]

},
{
  id: 'moving',
  kind: 'module',
  title: 'How you move',
  blurb: 'Walks, climbs, runs, or none of it. Finds a pace that fits.',
  emoji: '🥾',
  accent: 'blue',
  questions: [
  {
    id: 'move-what',
    ask: 'What do you actually enjoy?',
    type: 'multi',
    options: ['Walking', 'Running', 'Climbing', 'Cycling', 'Swimming', 'Lifting', 'Team sport', 'Yoga', 'None of it'],
    emoji: '🏃'
  },
  {
    id: 'move-pace',
    ask: 'Push hard or take it easy?',
    type: 'thisOrThat',
    a: 'Push hard',
    b: 'Take it easy',
    emoji: '📈'
  }]

},
{
  id: 'values',
  kind: 'quiz',
  title: 'What matters to you',
  blurb: 'The deeper signal. Worth doing once you have the others out of the way.',
  emoji: '🧭',
  accent: 'purple',
  questions: [
  {
    id: 'values-pick',
    ask: 'Pick the three you would not compromise on.',
    type: 'multi',
    options: ['Honesty', 'Loyalty', 'Curiosity', 'Ambition', 'Kindness', 'Independence', 'Humor', 'Steadiness'],
    emoji: '💎'
  },
  {
    id: 'values-friend',
    ask: 'A good friend is someone who...',
    type: 'single',
    options: ['Shows up', 'Tells you the truth', 'Makes you laugh', 'Leaves you be'],
    emoji: '🤝'
  }]

}];