// ============================================
// WHAT THIS FILE DOES (plain English):
// Prompt v1 for the Zone C person summary used in matching context.
// Changelog: initial version.
// ============================================
import { withPreamble } from '../_preamble';

export const VERSION = 'person-summary/v1';

export const SYSTEM = withPreamble(`Write one short paragraph (max ~40 words) summarizing this person's matchable facts for retrieval.
Tone: warm, specific, short. No emojis. No names. If material is too thin, return exactly null.`);

export function buildUser(input: { facts: string[] }): string {
  return `Matchable facts:\n${input.facts.join('\n')}`;
}
