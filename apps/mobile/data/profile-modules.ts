// ============================================
// WHAT THIS FILE DOES (plain English):
// Builds the ModuleFlow question lists for every Profile fill module from
// the PROFILE-MODULES.md question bank. ProfileCard opens these; it never
// invents questions itself. Module ids match analytics product events.
// ============================================
import type { ProfileModuleId as SharedModuleId, Tier } from '@bridger/shared';
import { OBSESSION_PROMPTS, SENSITIVE_ABOUT_KEYS } from '@bridger/shared';
import type { ModuleQuestion } from '@bridger/ui';
import {
  FAV_ITEMS,
  HOBBY_FOLLOWUP_QUESTIONS,
  PERSONAL_QUESTIONS,
  PLACE_QUESTIONS,
  THIS_OR_THAT_PROMPTS,
  catalogHobbyOptions
} from './fixtures/profile-questions';

/** Includes legacy short ids so older call sites still typecheck during migration. */
export type ProfileModuleId = SharedModuleId | 'about' | 'favs' | 'tot' | 'notes';

export type ProfileModule = {
  id: ProfileModuleId;
  label: string;
  emoji: string;
  line: string;
  /** estimated minutes for the module menu card */
  minutes: number;
  defaultTier: Tier;
  sensitiveKeys?: string[];
  questions: ModuleQuestion[];
};

const aboutBasicsIds = new Set([
  'about-birthday',
  'about-nicknames',
  'about-pronouns',
  'about-from',
  'about-lives',
  'about-high-school',
  'about-college',
  'about-studied',
  'about-job',
  'about-dream-job',
  'about-allergies',
  'about-dietary',
  'about-pets',
  'about-pet-names',
  'about-zodiac-sun',
  'about-zodiac-moon',
  'about-zodiac-rising'
]);

const aboutDeeperIds = new Set([
  'about-middle-name',
  'about-family',
  'about-ethnicity',
  'about-relationship',
  'about-sexuality',
  'about-religion',
  'about-important-dates',
  'about-anything-else'
]);

function textQs(
  rows: Array<{ id: string; ask: string; placeholder?: string }>,
  emoji: string
): ModuleQuestion[] {
  return rows.map((q) => ({
    id: q.id,
    ask: q.ask,
    type: 'text' as const,
    placeholder: q.placeholder,
    emoji
  }));
}

function favQs(group: string): ModuleQuestion[] {
  return FAV_ITEMS.filter((f) => f.group === group || f.group.includes(group)).map((f) => ({
    id: f.id,
    ask: `Favorite ${f.label.toLowerCase()}?`,
    type: 'text' as const,
    placeholder: f.label,
    emoji: f.emoji
  }));
}

/** The modules a person can add from the Profile card / Favorites to-start. */
export const PROFILE_MODULES: ProfileModule[] = [
  {
    id: 'about_basics',
    label: 'About Me Basics',
    emoji: '🪪',
    line: 'The simple stuff friends usually ask first',
    minutes: 4,
    defaultTier: 'friend',
    questions: textQs(
      PERSONAL_QUESTIONS.filter((q) => aboutBasicsIds.has(q.id) || q.id.startsWith('about-')),
      '🪪'
    ).slice(0, 12)
  },
  {
    id: 'about_deeper',
    label: 'About Me Deeper',
    emoji: '💜',
    line: 'The personal details worth remembering',
    minutes: 5,
    defaultTier: 'close',
    sensitiveKeys: [...SENSITIVE_ABOUT_KEYS, ...[...aboutDeeperIds]],
    questions: textQs(
      [
        {
          id: 'middle_name',
          ask: "What's your middle name?",
          placeholder: 'Optional'
        },
        {
          id: 'ethnicity',
          ask: 'Ethnicity or heritage?',
          placeholder: 'Optional'
        },
        {
          id: 'relationship_status',
          ask: 'Relationship status?',
          placeholder: 'Optional'
        },
        {
          id: 'sexuality',
          ask: 'Sexuality?',
          placeholder: 'Optional'
        },
        {
          id: 'religion',
          ask: 'Religion or beliefs?',
          placeholder: 'Optional'
        },
        {
          id: 'anything_else',
          ask: 'Anything else friends should remember?',
          placeholder: 'Optional'
        }
      ],
      '💜'
    )
  },
  {
    id: 'hobbies',
    label: 'Hobbies & Interests',
    emoji: '🎛',
    line: 'Pick a few, then one follow-up each',
    minutes: 6,
    defaultTier: 'acquaintance',
    questions: [
      {
        id: 'hobbies',
        ask: 'Select your hobbies',
        type: 'hobbySelect',
        emoji: '🎛',
        options: catalogHobbyOptions(),
        followups: HOBBY_FOLLOWUP_QUESTIONS
      }
    ]
  },
  {
    id: 'food_drinks',
    label: 'Favorite Food & Drinks',
    emoji: '🍜',
    line: 'Favorites, usual orders, go-to spots',
    minutes: 4,
    defaultTier: 'acquaintance',
    questions: favQs('Food').length
      ? favQs('Food')
      : FAV_ITEMS.filter((f) => f.group.includes('Food')).map((f) => ({
          id: f.id,
          ask: `Favorite ${f.label.toLowerCase()}?`,
          type: 'text' as const,
          placeholder: f.label,
          emoji: f.emoji
        }))
  },
  {
    id: 'entertainment',
    label: 'Favorite Entertainment',
    emoji: '🎬',
    line: 'What you watch, read, play, recommend',
    minutes: 4,
    defaultTier: 'acquaintance',
    questions: FAV_ITEMS.filter((f) =>
      /Entertainment|Movie|TV|Book|Music|Game|Comedy/i.test(f.group + f.label)
    ).map((f) => ({
      id: f.id,
      ask: `Favorite ${f.label.toLowerCase()}?`,
      type: 'text' as const,
      placeholder: f.label,
      emoji: f.emoji
    }))
  },
  {
    id: 'everyday',
    label: 'Everyday Favorites',
    emoji: '🧺',
    line: 'Small favorites that say a lot',
    minutes: 3,
    defaultTier: 'acquaintance',
    questions: FAV_ITEMS.filter((f) => /Everyday|City|Color|Season/i.test(f.group + f.label)).map(
      (f) => ({
        id: f.id,
        ask: `Favorite ${f.label.toLowerCase()}?`,
        type: 'text' as const,
        placeholder: f.label,
        emoji: f.emoji
      })
    )
  },
  {
    id: 'sports',
    label: 'Sports Favorites',
    emoji: '🚲',
    line: 'Teams and sports you follow or play',
    minutes: 2,
    defaultTier: 'acquaintance',
    questions: [
      {
        id: 'sports_team',
        ask: 'Favorite sports team?',
        type: 'text',
        placeholder: 'Optional',
        emoji: '⚽'
      },
      {
        id: 'sport_watch',
        ask: 'Favorite sport to watch?',
        type: 'text',
        placeholder: 'Optional',
        emoji: '📺'
      },
      {
        id: 'sport_play',
        ask: 'Favorite sport to play?',
        type: 'text',
        placeholder: 'Optional',
        emoji: '🏃'
      }
    ]
  },
  {
    id: 'this_or_that',
    label: 'This or That',
    emoji: '⚖️',
    line: 'Fast choices that show your personality',
    minutes: 3,
    defaultTier: 'acquaintance',
    questions: THIS_OR_THAT_PROMPTS.map((t) => ({
      id: t.id,
      ask: `${t.a} or ${t.b}?`,
      type: 'thisOrThat' as const,
      a: t.a,
      b: t.b,
      allowBoth: true,
      allowNeither: true,
      emoji: t.emoji
    }))
  },
  {
    id: 'places',
    label: "Places You've Been",
    emoji: '🗺',
    line: 'Lived, visited, want to go',
    minutes: 5,
    defaultTier: 'friend',
    questions: [
      {
        id: 'place-where',
        ask: PLACE_QUESTIONS[0]?.ask ?? 'Where have you been?',
        type: 'placeSearch',
        placeholder: 'Search a city or country',
        emoji: '✈️'
      },
      {
        id: 'place-status',
        ask: 'Have you been, lived there, or want to go?',
        type: 'single',
        options: ['Visited', 'Lived there', 'Want to go'],
        emoji: '📍'
      },
      {
        id: 'place-note',
        ask: 'Any note about this place?',
        type: 'text',
        placeholder: 'Optional memory or tip',
        emoji: '📝'
      }
    ]
  },
  {
    id: 'top5',
    label: 'Top 5',
    emoji: '⭐️',
    line: '5 things anyone who knows you well needs to know',
    minutes: 4,
    defaultTier: 'friend',
    questions: [1, 2, 3, 4, 5].map((n) => ({
      id: `top5_${n}`,
      ask: `Thing ${n}: what should people know?`,
      type: 'text' as const,
      placeholder: 'A short line',
      emoji: '⭐️'
    }))
  },
  {
    id: 'obsession',
    label: 'Current Obsession',
    emoji: '🔥',
    line: 'Who you are today — reading, building, training…',
    minutes: 3,
    defaultTier: 'friend',
    questions: OBSESSION_PROMPTS.slice(0, 8).map((prompt) => ({
      id: `obsession:${prompt}`,
      ask: `${prompt} (optional)`,
      type: 'text' as const,
      placeholder: 'What is it?',
      emoji: '🔥'
    }))
  },
  {
    id: 'timeline',
    label: 'Life Timeline',
    emoji: '📅',
    line: 'Education, jobs, cities, defining moments',
    minutes: 6,
    defaultTier: 'friend',
    questions: [
      {
        id: 'timeline_school',
        ask: 'A school or education moment?',
        type: 'text',
        placeholder: 'Optional',
        emoji: '🎓'
      },
      {
        id: 'timeline_job',
        ask: 'A job that shaped you?',
        type: 'text',
        placeholder: 'Optional',
        emoji: '💼'
      },
      {
        id: 'timeline_city',
        ask: 'A city that mattered?',
        type: 'text',
        placeholder: 'Optional',
        emoji: '🏙'
      },
      {
        id: 'timeline_moment',
        ask: 'A defining moment (not a CV brag)?',
        type: 'text',
        placeholder: 'e.g. Climbed Kilimanjaro',
        emoji: '⛰'
      }
    ]
  },
  {
    id: 'recommendations',
    label: 'Recommendations',
    emoji: '📣',
    line: 'Things people HAVE to do / read / watch',
    minutes: 4,
    defaultTier: 'acquaintance',
    questions: [
      'Books',
      'Movies',
      'Restaurants',
      'Games',
      'Music',
      'Podcasts'
    ].map((label) => ({
      id: `rec_${label.toLowerCase()}`,
      ask: `Recommend a ${label.toLowerCase().replace(/s$/, '')}?`,
      type: 'text' as const,
      placeholder: 'Optional',
      emoji: '📣'
    }))
  },
  {
    id: 'goals',
    label: 'Goals',
    emoji: '🎯',
    line: 'Big wants — feeds your Bucket List',
    minutes: 3,
    defaultTier: 'close',
    questions: [
      {
        id: 'goal_1',
        ask: 'A big goal or place you want to go?',
        type: 'text',
        placeholder: 'e.g. Travel to Japan',
        emoji: '🎯'
      },
      {
        id: 'goal_2',
        ask: 'Another goal?',
        type: 'text',
        placeholder: 'Optional',
        emoji: '✨'
      }
    ]
  },
  // Legacy aliases used by older empty-state CTAs during migration.
  {
    id: 'about',
    label: 'About me',
    emoji: '🪪',
    line: 'Hometown, work, birthday, and more',
    minutes: 4,
    defaultTier: 'friend',
    questions: textQs(
      PERSONAL_QUESTIONS.map((q) => ({ id: q.id, ask: q.ask, placeholder: q.placeholder })),
      '🪪'
    )
  },
  {
    id: 'favs',
    label: 'List of favs',
    emoji: '⭐️',
    line: 'Food, films, everyday',
    minutes: 4,
    defaultTier: 'acquaintance',
    questions: FAV_ITEMS.slice(0, 12).map((f) => ({
      id: f.id,
      ask: `Favorite ${f.label.toLowerCase()}?`,
      type: 'text' as const,
      placeholder: f.label,
      emoji: f.emoji
    }))
  },
  {
    id: 'tot',
    label: 'This or that',
    emoji: '⚖️',
    line: '12 quick picks',
    minutes: 3,
    defaultTier: 'acquaintance',
    questions: THIS_OR_THAT_PROMPTS.map((t) => ({
      id: t.id,
      ask: `${t.a} or ${t.b}?`,
      type: 'thisOrThat' as const,
      a: t.a,
      b: t.b,
      allowBoth: true,
      allowNeither: true,
      emoji: t.emoji
    }))
  },
  {
    id: 'notes',
    label: 'Custom notes',
    emoji: '📝',
    line: 'Anything else',
    minutes: 2,
    defaultTier: 'friend',
    questions: [
      {
        id: 'custom_notes',
        ask: 'Anything else to add?',
        type: 'text',
        placeholder: 'Optional',
        emoji: '📝'
      }
    ]
  }
];
