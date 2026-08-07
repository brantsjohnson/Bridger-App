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
- Follow moderator_instructions when present.`);

export function buildUser(input: {
  moderatorInstructions?: string | null;
  adaptationPolicy?: unknown;
  dimensions: Array<{ key: string }>;
  answers: unknown;
}): string {
  return JSON.stringify({
    moderator_instructions: input.moderatorInstructions ?? '',
    adaptation_policy: input.adaptationPolicy ?? null,
    dimensions: input.dimensions,
    answers: input.answers
  });
}
