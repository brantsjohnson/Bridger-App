// ============================================
// WHAT THIS FILE DOES (plain English):
// Builds the ModuleFlow question lists for each Profile fill module from the
// question bank. ProfileCard opens these; it never invents questions itself.
// ============================================
import type { ModuleQuestion } from '@bridger/ui';
import {
  ALL_HOBBIES,
  CUSTOM_NOTES,
  FAV_ITEMS,
  HOBBY_EMOJI,
  HOBBY_FOLLOWUP_QUESTIONS,
  PERSONAL_QUESTIONS,
  PLACE_QUESTIONS,
  THIS_OR_THAT_PROMPTS,
  hobbyId
} from './fixtures/profile-questions';

export type ProfileModuleId =
  | 'hobbies'
  | 'about'
  | 'favs'
  | 'places'
  | 'tot'
  | 'notes';

export type ProfileModule = {
  id: ProfileModuleId;
  label: string;
  emoji: string;
  line: string;
  questions: ModuleQuestion[];
};

/** The modules a person can add from the Profile card. */
export const PROFILE_MODULES: ProfileModule[] = [
  {
    id: 'hobbies',
    label: 'Hobbies',
    emoji: '🎛',
    line: 'Pick a few, then one follow-up each',
    questions: [
      {
        id: 'hobbies',
        ask: 'Select your hobbies',
        type: 'hobbySelect',
        emoji: '🎛',
        options: ALL_HOBBIES.map((label) => {
          const id = hobbyId(label);
          return { id, label, emoji: HOBBY_EMOJI[id] ?? '✨' };
        }),
        followups: HOBBY_FOLLOWUP_QUESTIONS
      }
    ]
  },
  {
    id: 'about',
    label: 'About me',
    emoji: '🪪',
    line: 'Hometown, work, birthday, and more',
    questions: PERSONAL_QUESTIONS.map((q) => ({
      id: q.id,
      ask: q.ask,
      type: 'text' as const,
      placeholder: q.placeholder,
      emoji: '🪪'
    }))
  },
  {
    id: 'favs',
    label: 'List of favs',
    emoji: '⭐️',
    line: 'Food, films, everyday',
    questions: FAV_ITEMS.map((f) => ({
      id: f.id,
      ask: `Favorite ${f.label.toLowerCase()}?`,
      type: 'text' as const,
      placeholder: f.label,
      emoji: f.emoji
    }))
  },
  {
    id: 'places',
    label: 'Places traveled',
    emoji: '🗺',
    line: 'Pin where you have been',
    // TODO: richer place editor (tags, per-place visibility, co-op photos)
    questions: PLACE_QUESTIONS.map((p) => ({
      id: p.id,
      ask: p.ask,
      type: 'text' as const,
      placeholder: p.placeholder,
      emoji: p.emoji
    }))
  },
  {
    id: 'tot',
    label: 'This or that',
    emoji: '⚖️',
    line: `${THIS_OR_THAT_PROMPTS.length} quick picks`,
    questions: THIS_OR_THAT_PROMPTS.map((t) => ({
      id: t.id,
      ask: `${t.a} or ${t.b}?`,
      type: 'thisOrThat' as const,
      a: t.a,
      b: t.b,
      allowBoth: true,
      emoji: t.emoji
    }))
  },
  {
    id: 'notes',
    label: 'Custom notes',
    emoji: '📝',
    line: "Anything that didn't fit elsewhere",
    questions: [
      {
        id: CUSTOM_NOTES.id,
        ask: CUSTOM_NOTES.ask,
        type: 'text' as const,
        placeholder: CUSTOM_NOTES.placeholder,
        emoji: '📝'
      }
    ]
  }
];
