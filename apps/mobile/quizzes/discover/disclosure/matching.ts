// ============================================
// WHAT THIS FILE DOES (plain English):
// Rules for how Behind the Scenes may affect matching. Additive only. Never
// a filter. The person's Screen 4 choice is the hard control.
// ============================================

import type { DisclosureMatchWeight } from '@bridger/shared';

/** How much matching may lean on disclosure, given their preference. */
export const MATCH_WEIGHT_STRENGTH: Record<DisclosureMatchWeight, number> = {
  use: 1,
  a_little: 0.4,
  barely: 0
};

/**
 * Matching rules (enforced in the scorer when wired):
 * 1. Additive only. Never hide, downrank, or exclude someone because of a
 *    disclosure. Disability / health context must not become a filter.
 * 2. Two uses only: shared-experience affinity (opt-in via match weight) and
 *    soft expectation-setting (pace), never exclusion.
 * 3. Honor match_weight_preference as a hard control. "barely" ≈ store only.
 * 4. Same-condition pairs where both marked impact 4 ("a lot"): keep affinity
 *    light. Do not engineer two people in acute crisis as each other's support.
 * 5. Never surface condition keys, notes, or custom labels as reveal evidence
 *    titles. Silent Zone B only.
 */
export const DISCLOSURE_MATCHING_RULES = {
  additiveOnly: true,
  neverFilter: true,
  highImpactSameConditionMaxAffinity: 0.25,
  visibleAsEvidence: false
} as const;
