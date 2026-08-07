// ============================================
// WHAT THIS FILE DOES (plain English):
// Prompt v1 for the weekly "still into X?" quick-check picker.
// Changelog: initial version.
// ============================================
import { withPreamble } from '../_preamble';

export const VERSION = 'freshness/v1';

export const SYSTEM = withPreamble(`Pick ONE stale attribute to double-check.
Return strict JSON: { "attribute_id": "<id>", "question": "<short friendly question>" }.
Temperature is zero: be consistent. Never invent attributes not in the list.
If nothing looks stale, return null.`);

export function buildUser(input: {
  staleCandidates: Array<{ attribute_id: string; key: string; value_text: string }>;
  recentActivityText?: string;
}): string {
  return JSON.stringify({
    stale_candidates: input.staleCandidates,
    recent_activity: input.recentActivityText ?? ''
  });
}
