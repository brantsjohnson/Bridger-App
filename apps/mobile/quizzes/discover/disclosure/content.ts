// ============================================
// WHAT THIS FILE DOES (plain English):
// All the words and choices for Behind the Scenes (disclosure pre-quiz).
// Soft voice on purpose. No clinical tone. No em dashes. Copy matches
// prequiz_disclosure_v1.md.
// ============================================

import type {
  DisclosureConditionKey,
  DisclosureImpactLevel,
  DisclosureMatchWeight
} from '@bridger/shared';

export const DISCLOSURE_VERSION = 1;

/** Quiet support line on the close screen (region-agnostic pointer). */
export const DISCLOSURE_SUPPORT_URL = 'https://www.findahelpline.com/';

/** Intro micro-cards (one tap each). Skip is available on every card. */
export const INTRO_CARDS: { id: string; lines: string[] }[] = [
  {
    id: 'intro-1',
    lines: [
      'We match you by what makes you laugh, what you care about, who you are, and how you click with people.'
    ]
  },
  {
    id: 'intro-2',
    lines: ["But some parts of you aren't a choice."]
  },
  {
    id: 'intro-3',
    lines: [
      "Things like ADHD, anxiety, depression, OCD, or bipolar can change how you feel and act each day. You don't pick that. It's just part of you."
    ]
  },
  {
    id: 'intro-4',
    lines: [
      'You can tell us about it if you want. It helps us find people who fit you better. Like:',
      'people who go at your speed',
      'people who just get it'
    ]
  },
  {
    id: 'intro-5',
    lines: [
      "Don't want to? That's okay. You'll still get matches. We just won't know this part, so sometimes a match might feel a little off."
    ]
  },
  {
    id: 'intro-6',
    lines: [
      'What you share is private. We keep it off your profile. Your matches never see it. You can change it or turn it off anytime.'
    ]
  }
];

export type ConditionOption = {
  key: DisclosureConditionKey;
  label: string;
  /** Routes straight to match-weight (Screen 4), skipping impact. */
  routesToMatchWeight?: boolean;
  /** Needs a free-text name before impact. */
  needsCustomLabel?: boolean;
};

export const CONDITION_OPTIONS: ConditionOption[] = [
  { key: 'adhd', label: 'ADHD' },
  { key: 'anxiety', label: 'Anxiety' },
  { key: 'depression', label: 'Depression' },
  { key: 'ocd', label: 'OCD' },
  { key: 'bipolar', label: 'Bipolar' },
  { key: 'autistic', label: 'Autistic / on the spectrum' },
  { key: 'ptsd', label: 'PTSD or trauma related' },
  {
    key: 'other',
    label: 'Something else',
    needsCustomLabel: true
  },
  {
    key: 'prefer_not_list',
    label: "I'd rather not pick from a list",
    routesToMatchWeight: true
  }
];

export const CONDITIONS_PROMPT =
  "Pick anything you'd want us to know. Leave out anything you don't.";
export const CONDITIONS_HINT =
  'Nothing here is required, and you can choose as few or as many as you like.';

export const OTHER_LABEL_PLACEHOLDER = "Anything you'd like to name.";

export type ImpactOption = {
  level: DisclosureImpactLevel;
  label: string;
};

export const IMPACT_OPTIONS: ImpactOption[] = [
  { level: 1, label: "Barely. I've got a pretty good handle on it." },
  { level: 2, label: "Somewhat. It shows up, but it's manageable." },
  { level: 3, label: 'Quite a bit. It shapes a lot of my days.' },
  { level: 4, label: "A lot. It's a big part of how I move through life." }
];

export function impactPrompt(itemLabel: string): string {
  return `For ${itemLabel}, how much does it shape your day to day?`;
}

export const IMPACT_HINT =
  "This is just your own read on it. There's no right answer, and it's all relative to you.";

export const CONTEXT_NOTE_PROMPT =
  "Anything you'd want a good match to understand about this?";
export const CONTEXT_NOTE_PLACEHOLDER = 'Totally fine to leave blank.';

export type MatchWeightOption = {
  weight: DisclosureMatchWeight;
  label: string;
};

export const MATCH_WEIGHT_PROMPT =
  'How much do you want this to factor into who we match you with?';
export const MATCH_WEIGHT_HINT =
  'Sharing it and matching on it are two different things, so this part is up to you.';

export const MATCH_WEIGHT_OPTIONS: MatchWeightOption[] = [
  { weight: 'use', label: "Please use it. I'd love matches who get this." },
  { weight: 'a_little', label: "A little. It's part of the picture, not the main thing." },
  { weight: 'barely', label: 'Barely. I mostly just wanted you to have it on file.' }
];

export const CLOSE_TITLE = "That's it. Thank you for trusting us with this.";
export const CLOSE_BODY =
  "It stays private, it's yours to edit or remove anytime in Settings, and you can always add more later if something changes.";
export const CLOSE_CTA = 'Start the fun part';
export const SUPPORT_LINE = 'Going through a hard time? Support is here.';

export const SKIP_INTRO_TOAST =
  "All good. It's in Settings when you want it.";

/** Human label for an item (custom text for "other"). */
export function labelForCondition(
  key: DisclosureConditionKey,
  customLabel?: string
): string {
  if (key === 'other') return customLabel?.trim() || 'Something else';
  return CONDITION_OPTIONS.find((o) => o.key === key)?.label ?? key;
}
