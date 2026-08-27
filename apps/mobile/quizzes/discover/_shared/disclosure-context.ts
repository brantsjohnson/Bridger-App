// ============================================
// WHAT THIS FILE DOES (plain English):
// How Behind the Scenes rides along with every other Discover quiz. The AI
// moderator gets a short, de-identified summary (condition keys + impact +
// match weight only — never free-text notes) so it can ask: is this answer
// preference, or execution / symptom friction?
// ============================================

import type { DisclosureProfile } from '@bridger/shared';

/** Safe slice for the quiz moderator (no notes, no custom labels). */
export type DisclosureContextForQuiz = {
  status: DisclosureProfile['status'];
  matchWeightPreference?: DisclosureProfile['matchWeightPreference'];
  matchingEnabled: boolean;
  items: Array<{
    conditionKey: string;
    impactLevel?: number;
  }>;
};

/** Strip free text before anything touches an AI prompt. */
export function toDisclosureContextForQuiz(
  profile: DisclosureProfile | null | undefined
): DisclosureContextForQuiz | null {
  if (!profile || profile.status === 'pending') return null;
  if (profile.status === 'skipped' && profile.items.length === 0) {
    return {
      status: 'skipped',
      matchingEnabled: profile.matchingEnabled,
      items: []
    };
  }
  return {
    status: profile.status,
    matchWeightPreference: profile.matchWeightPreference,
    matchingEnabled: profile.matchingEnabled,
    items: profile.items
      .filter((i) => i.conditionKey !== 'prefer_not_list')
      .map((i) => ({
        conditionKey: i.conditionKey,
        impactLevel: i.impactLevel
      }))
  };
}

/**
 * Plain English block appended to every measurement-quiz moderator prompt.
 * Reminds the model: preference ≠ capacity; never invent diagnoses.
 */
export const DISCLOSURE_MODERATOR_PREAMBLE = `
DISCLOSURE CONTEXT (Behind the Scenes — private, never show to matches):
When disclosure items are present, treat them as possible explanations for
execution difficulty, avoidance, overwhelm, or sensory limits — NOT as the
person's preferred personality.
- Prefer asking (or weighting) "wanted to but couldn't" vs "didn't want to"
  before locking a trait score.
- High impact on ADHD / autism / anxiety / depression / OCD / PTSD may dampen
  Conscientiousness, Sociability, or Openness confidence when answers look like
  capacity limits rather than preference.
- Never diagnose. Never mention condition names back to the user in a clinical way.
- Never set numeric scores. Only confidence + optional clarifiers within policy.
- If disclosure is skipped or empty, score from quiz answers alone.
`.trim();
