// ============================================
// WHAT THIS FILE DOES (plain English):
// Shapes for "Behind the Scenes" (internal id: disclosure). This is optional
// context people can share so matching can go at their pace. It is NEVER shown
// on a profile or to a match. Answers stay owner-only.
// ============================================

/** Named items on the multi-select list (plus free-text "other"). */
export const DISCLOSURE_CONDITION_KEYS = [
  'adhd',
  'anxiety',
  'depression',
  'ocd',
  'bipolar',
  'autistic',
  'ptsd',
  'other',
  'prefer_not_list'
] as const;

export type DisclosureConditionKey = (typeof DISCLOSURE_CONDITION_KEYS)[number];

/**
 * How much this shapes day to day (their own read).
 * 1 = barely … 4 = a lot.
 */
export type DisclosureImpactLevel = 1 | 2 | 3 | 4;

/**
 * How strongly matching may use this (Screen 4).
 * PRIVACY: "barely" means store it but basically do not match on it.
 */
export type DisclosureMatchWeight = 'use' | 'a_little' | 'barely';

export type DisclosureStatus = 'pending' | 'skipped' | 'completed';

/** One selected item + optional impact / note. */
export type DisclosureItem = {
  conditionKey: DisclosureConditionKey;
  /** Only when conditionKey is `other`. Never put in analytics. */
  customLabel?: string;
  impactLevel?: DisclosureImpactLevel;
  /** Optional free text. Never put in analytics. Never show to matches. */
  contextNote?: string;
};

/** What we store after someone finishes or skips with partial answers. */
export type DisclosureProfile = {
  version: number;
  status: DisclosureStatus;
  matchWeightPreference?: DisclosureMatchWeight;
  /** Soft off-switch: stop using in matching without deleting the rows. */
  matchingEnabled: boolean;
  items: DisclosureItem[];
  completedAt?: string;
  updatedAt?: string;
};

/** Payload the client posts when saving Behind the Scenes. */
export type DisclosureSaveInput = {
  version: number;
  status: Exclude<DisclosureStatus, 'pending'>;
  matchWeightPreference?: DisclosureMatchWeight;
  items: DisclosureItem[];
};
