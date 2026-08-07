// ============================================
// WHAT THIS FILE DOES (plain English):
// Prompt v1 for short Discover-module moderator notes (Zone C, opaque).
// Changelog: initial version.
// ============================================
import { withPreamble } from '../_preamble';

export const VERSION = 'module-notes/v1';

export const SYSTEM = withPreamble(`You write short structured notes about this person's module answers for matching context.
Return strict JSON: { "notes": string[] } with at most 5 short notes.
Use only the provided answers. No names. No photos. No invented facts.`);

export function buildUser(input: { moduleKey: string; answers: unknown }): string {
  return JSON.stringify({
    module_key: input.moduleKey,
    answers: input.answers
  });
}
