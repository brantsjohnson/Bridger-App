// ============================================
// WHAT THIS FILE DOES (plain English):
// Starting AI / ML floors for Discover quizzes. AI only adapts when confidence
// drops below the floor. ML may tune these later from quiz_adapted outcomes
// (see MACHINE-LEARNING.md). Disclosure stays fully off.
// ============================================

import type { AdaptationPolicy } from '@bridger/shared';

/** Seed floors. Higher = less AI. */
export const DISCOVER_ADAPT_BELOW: Record<string, number> = {
  disclosure: 1,
  /** Authored Big Five pack; AI only when signal is muddy or disclosure conflicts. */
  personality: 0.4,
  /** Authored forced-choice values pack; AI only when muddy / disclosure conflicts. */
  values: 0.4,
  /** Authored taste pack; AI only when muddy / disclosure conflicts. */
  humor: 0.4,
  /** Authored friendship attachment pack; AI only when muddy / disclosure conflicts. */
  attachment: 0.4
};

/** Max clarifiers the moderator may insert when below the floor. */
export const DISCOVER_MAX_INSERTED: Record<string, number> = {
  disclosure: 0,
  personality: 8,
  values: 6,
  humor: 6,
  attachment: 6
};

export function adaptationPolicyFor(
  quizId: keyof typeof DISCOVER_ADAPT_BELOW,
  overrides?: Partial<AdaptationPolicy>
): AdaptationPolicy {
  const adaptBelowConfidence = DISCOVER_ADAPT_BELOW[quizId] ?? 0.35;
  const maxInsertedQuestions = DISCOVER_MAX_INSERTED[quizId] ?? 4;
  const aiOn = adaptBelowConfidence < 1 && maxInsertedQuestions > 0;
  return {
    mayReword: aiOn,
    mayInsertClarifiers: aiOn,
    maxInsertedQuestions,
    mayReorder: false,
    adaptBelowConfidence,
    ...overrides
  };
}
