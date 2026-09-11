// ============================================
// WHAT THIS FILE DOES (plain English):
// The matching feature dictionary and label weights — one source of truth
// shared by Nest scoring, config seeds, and matching_feedback snapshots.
// Changing a feature or label = edit MACHINE-LEARNING.md §8 + this file +
// the matching_config seed together.
//
// B1 privacy: evidence / shared_attributes = Everyone (acquaintance) + matchable.
// Silent none+matchable may feed embeddings + quiz_alignment only, never evidence titles.
// ============================================

/** Named Mode 1 score components — always present; 0 when the pair lacks data. */
export const MATCHING_FEATURES = [
  'quiz_alignment',
  'embedding_similarity',
  'shared_attributes',
  'moderator_notes_affinity',
  'mutual_warmth',
  'context_fit'
] as const;

export type MatchingFeature = (typeof MATCHING_FEATURES)[number];

/** Outcome labels written to matching_feedback (domain tables only, never analytics). */
export const MATCHING_LABEL_WEIGHTS = {
  impressed: 0,
  close: 1.0,
  /** Placed in Friends (weaker gold than Close; still a real bond). */
  friend: 0.55,
  added: 0.3,
  approved: 0.3,
  reveal_plan: 0.4,
  event_attended: 0.4,
  dismissed: -0.3,
  dont_suggest: -0.5,
  demoted: -0.5,
  removed: -0.7,
  blocked: -1.0
} as const;

export type MatchingOutcome = keyof typeof MATCHING_LABEL_WEIGHTS;

/** Outcomes that mean "this pair worked" (used to lift feature weights). */
export const MATCHING_LEARN_POSITIVE: readonly MatchingOutcome[] = [
  'close',
  'friend',
  'added',
  'approved',
  'reveal_plan',
  'event_attended'
];

/** Outcomes that mean "this pair did not work." */
export const MATCHING_LEARN_NEGATIVE: readonly MatchingOutcome[] = [
  'dismissed',
  'dont_suggest',
  'demoted',
  'removed',
  'blocked'
];

/** Discover quiz internal ids (marketing titles live on quiz_registry.title). */
export const DISCOVER_QUIZ_IDS = [
  'personality',
  'values',
  'humor',
  'attachment'
] as const;

export type DiscoverQuizId = (typeof DISCOVER_QUIZ_IDS)[number];

/** Seeded v1 weights (sum = 1.0). */
export const MATCHING_V1_WEIGHTS: Record<MatchingFeature, number> = {
  shared_attributes: 0.3,
  quiz_alignment: 0.25,
  embedding_similarity: 0.15,
  mutual_warmth: 0.15,
  moderator_notes_affinity: 0.1,
  context_fit: 0.05
};

/** Seeded knobs (admin can change later; do not invent new defaults in code). */
export const MATCHING_SEED_KNOBS = {
  minSharedSignals: 3,
  suggestThreshold: 0.55,
  spotlightThreshold: 0.75,
  confidenceFloor: 0.4,
  revealExtrasMax: 3,
  refreshCap: 5,
  annCandidateCap: 500,
  explorationEpsilon: 0.1,
  explorationEpsilonCold: 0.15,
  bridgeCooldownDays: 14,
  maxBridgePerConnection: 1,
  feedbackTtlMonths: 18,
  v2DataFloor: 3000,
  /** Min Everyone+matchable attrs OR one completed Discover quiz. */
  minEveryoneMatchableAttrs: 3,
  exposureCapPct: 0.1,
  exposureHardCap: 50,
  coldStartLabeledPairs: 500
} as const;

export type MatchingSurface = 'discover' | 'bridge' | 'event';

/** Frozen feature snapshot shape stored on suggestions + feedback. */
export type PairFeaturesSnapshot = {
  features: Record<MatchingFeature, number>;
  /** Weighted contribution of each feature to the final score. */
  contribs: Record<MatchingFeature, number>;
  score: number;
  evidenceGatePassed: boolean;
  sharedQuizIds: string[];
  sharedAttributeCount: number;
  isExploration: boolean;
  configVersion: number;
};

/** All six features start at 0 (zero-by-absence baseline). */
export function emptyMatchingFeatureRecord(): Record<MatchingFeature, number> {
  return {
    quiz_alignment: 0,
    embedding_similarity: 0,
    shared_attributes: 0,
    moderator_notes_affinity: 0,
    mutual_warmth: 0,
    context_fit: 0
  };
}

/**
 * THIS SECTION DOES: make sure a learning snapshot always has every feature
 * and every weighted contribution filled in (missing → 0), so trainers never
 * see a sparse row.
 */
export function normalizePairFeaturesSnapshot(
  input: Partial<PairFeaturesSnapshot> | null | undefined
): PairFeaturesSnapshot {
  const features = emptyMatchingFeatureRecord();
  const contribs = emptyMatchingFeatureRecord();
  for (const f of MATCHING_FEATURES) {
    features[f] = Number(input?.features?.[f] ?? 0) || 0;
    contribs[f] = Number(input?.contribs?.[f] ?? 0) || 0;
  }
  return {
    features,
    contribs,
    score: Number(input?.score ?? 0) || 0,
    evidenceGatePassed: Boolean(input?.evidenceGatePassed),
    sharedQuizIds: Array.isArray(input?.sharedQuizIds)
      ? [...input.sharedQuizIds]
      : [],
    sharedAttributeCount: Number(input?.sharedAttributeCount ?? 0) || 0,
    isExploration: Boolean(input?.isExploration),
    configVersion: Number(input?.configVersion ?? 0) || 0
  };
}

export type MatchingEvidenceItem = {
  kind: 'hobby' | 'this_or_that' | 'place' | 'event' | 'attribute' | 'quiz';
  title: string;
};

export type MatchingSuggestionDto = {
  id: string;
  personId: string;
  viaFriendId?: string;
  sharedThread: string;
  signals: string[];
  score: number;
  isSpotlight: boolean;
  isExploration: boolean;
  bothOptedIn: true;
};
