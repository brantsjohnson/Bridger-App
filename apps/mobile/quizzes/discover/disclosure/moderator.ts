// ============================================
// WHAT THIS FILE DOES (plain English):
// Rules for the AI around Behind the Scenes. This quiz is carefully authored
// and handles sensitive topics, so the AI stays out. Adaptation is off.
// Measurement quizzes use a confidence threshold instead (see QUIZ-ENGINE.md).
// ============================================

import type { AdaptationPolicy } from '@bridger/shared';

/**
 * AI never rewrites or inserts questions here.
 * adaptBelowConfidence: 1 means "never adapt" even if flags were flipped on.
 */
export const DISCLOSURE_ADAPTATION_POLICY: AdaptationPolicy = {
  mayReword: false,
  mayInsertClarifiers: false,
  maxInsertedQuestions: 0,
  mayReorder: false,
  adaptBelowConfidence: 1
};

/**
 * Moderator goal if a job ever runs (it should not for disclosure).
 * Sensitive intake: no symptom probes, no clarifiers about conditions.
 */
export const DISCLOSURE_MODERATOR_INSTRUCTIONS = `
Behind the Scenes is optional sensitive context, not a scored personality quiz.
Do NOT adapt, reword, insert, or reorder questions.
Do NOT ask symptom-probe follow-ups.
Do NOT set or invent scores.
If invoked by mistake, return empty adaptations and confidence 1.0 for all keys.
`.trim();

/**
 * Default threshold for well-authored measurement quizzes (humor / values /
 * personality / attachment). AI only steps in when confidence is clearly low.
 * Per-quiz floors in `_shared/thresholds.ts` are the source of truth (0.4).
 * ML may tune those later from quiz_adapted outcomes.
 */
export const MEASUREMENT_QUIZ_ADAPT_BELOW_CONFIDENCE = 0.4;
