// ============================================
// WHAT THIS FILE DOES (plain English):
// Documents the delete/opt-out contract for Zone C. Actual SQL is in Nest /
// migrations (ON DELETE CASCADE + discoverable=false cleanup).
// ============================================

/**
 * When a person turns off Discoverable or deletes their account, these Zone C
 * rows must drop in the same cascade:
 * - person_embeddings
 * - person_summaries
 * - module_moderator_notes (if present)
 * - freshness_prompts (if present)
 *
 * Nest writers must no-op when discoverable=false.
 */
export const ZONE_C_TABLES = [
  'person_embeddings',
  'person_summaries',
  'module_moderator_notes',
  'freshness_prompts'
] as const;
