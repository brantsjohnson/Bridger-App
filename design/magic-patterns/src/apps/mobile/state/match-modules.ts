import { ModuleQuestion } from '../../../packages/ui';

/**
 * MATCHING MODULES — Connect Over on Discover.
 *
 * Live Bridger set: Behind the Scenes + four measurement quizzes.
 * Production app: disclosure uses DisclosureFlow; the others land as packs.
 * This Magic Patterns file keeps the same titles/ids for design parity.
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
    id: 'disclosure',
    kind: 'quiz',
    title: 'Behind the Scenes',
    blurb: 'A quiet, optional check-in. Private, and only once if you skip.',
    emoji: '🎬',
    accent: 'teal',
    // Design preview only. Production uses DisclosureFlow (custom screens).
    questions: [
      {
        id: 'preview-share',
        ask: 'Want to share a little private context so matches can go at your pace?',
        type: 'single',
        options: ['Share a little', 'Skip for now'],
        emoji: '🤝'
      }
    ]
  },
  {
    id: 'humor',
    kind: 'quiz',
    title: 'Your Funny Bone',
    blurb: 'What makes you laugh, and how you joke with friends.',
    emoji: '😂',
    accent: 'coral',
    // Design preview. Production uses HumorFlow (20 concrete + media picks).
    questions: [
      {
        id: 'preview-laugh',
        ask: 'Which moments make you laugh the hardest?',
        type: 'multi',
        options: [
          'Someone confidently being wrong',
          'Perfectly timed sarcasm',
          'Awkward social situations',
          'Complete chaos'
        ],
        emoji: '😂'
      }
    ]
  },
  {
    id: 'values',
    kind: 'quiz',
    title: 'What Gets You Going',
    blurb: 'What you care about when it actually counts.',
    emoji: '🧭',
    accent: 'purple',
    // Design preview. Production uses ValuesFlow (30 forced-choice + skips).
    questions: [
      {
        id: 'preview-castle',
        ask: 'You inherit a tiny castle. What excites you most?',
        type: 'single',
        options: [
          'Redesigning every room',
          'Exploring the hidden passages',
          'Being known as the castle owner',
          'Hosting the same feast yearly'
        ],
        emoji: '🏰'
      }
    ]
  },
  {
    id: 'personality',
    kind: 'quiz',
    title: 'Your Vibe',
    blurb: 'How you move through people, plans, and energy.',
    emoji: '✨',
    accent: 'amber',
    // Design preview. Production uses PersonalityFlow (55 items + text explain).
    questions: [
      {
        id: 'preview-alone',
        ask: 'You are alone at a casual event. Someone nearby is also alone. What do you usually do?',
        type: 'multi',
        options: [
          'Start talking to them',
          'Wait for eye contact',
          'Stay focused on the event',
          'Hope they approach you',
          'None of these'
        ],
        emoji: '👋'
      }
    ]
  },
  {
    id: 'attachment',
    kind: 'quiz',
    title: 'The Friend Zone',
    blurb: 'How you show up when friendship gets real.',
    emoji: '🤝',
    accent: 'blue',
    // Design preview. Production uses AttachmentFlow (20 scenes + text explain).
    questions: [
      {
        id: 'preview-read',
        ask: 'You send someone a personal message. They read it but have not answered yet. What happens inside?',
        type: 'multi',
        options: [
          "I figure they'll answer when they can.",
          'I start wondering what they thought about it.',
          "I wish I hadn't sent something so personal.",
          'I feel better having a little space after sharing.'
        ],
        emoji: '💬'
      }
    ]
  }
];
