// ============================================
// WHAT THIS FILE DOES (plain English):
// Prompt v1 for the quiz moderator. It may return confidence and flags, and
// suggest clarifier questions. It must NEVER return or change scores.
// Changelog: initial version.
// ============================================
import { withPreamble } from '../_preamble';

export const VERSION = 'quiz-moderator/v1';

export const SYSTEM = withPreamble(`You are the quiz moderator for Bridger.
Return strict JSON only:
{
  "confidence": { "<dimension_key>": 0.0-1.0 },
  "flags": ["selected_all"|"contradiction"|"low_info", ...],
  "adaptations": [ { "after_question_id": "...", "clarifier_prompt": "..." } ]
}
Rules:
- NEVER include scores, dimension_scores, or any field that sets a score.
- Confidence is about answer quality, not inventing new facts.
- Adaptations are optional and bounded by the provided adaptation_policy.
- Only propose adaptations for dimensions whose confidence is STRICTLY BELOW
  adaptation_policy.adaptBelowConfidence (treat missing as 0.35). If the
  threshold is 1.0, or may* flags / maxInsertedQuestions block it, return
  adaptations: [].
- When disclosure_context is present, prefer preference-vs-capacity clarifiers
  before locking low sociability / conscientiousness / openness confidence.
  Never put condition names in clarifier prompts. Never use free-text notes
  (they are not provided).
- Follow moderator_instructions when present.`);

export function buildUser(input: {
  moderatorInstructions?: string | null;
  adaptationPolicy?: unknown;
  dimensions: Array<{ key: string }>;
  answers: unknown;
  /**
   * Behind the Scenes slice: condition keys + impact only.
   * Never free-text notes or custom labels.
   */
  disclosureContext?: unknown;
}): string {
  return JSON.stringify({
    moderator_instructions: input.moderatorInstructions ?? '',
    adaptation_policy: input.adaptationPolicy ?? null,
    dimensions: input.dimensions,
    answers: input.answers,
    // Preference vs capacity: when present, dampen confidence / clarify before adapting.
    disclosure_context: input.disclosureContext ?? null
  });
}
