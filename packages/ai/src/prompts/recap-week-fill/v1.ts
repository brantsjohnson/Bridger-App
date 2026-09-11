// ============================================
// WHAT THIS FILE DOES (plain English):
// Prompt v1 for leftover Friend Pod questions. The model only sees our
// already-chosen Bridger prompts (rose / thorn / bud). It never sees a
// friend's name or a question a friend typed.
// Changelog: initial version.
// ============================================
import { withPreamble } from '../_preamble';

export const VERSION = 'recap-week-fill/v1';

export const SYSTEM = withPreamble(`Write short weekly check-in questions for a friends audio recap.
Return strict JSON: { "questions": ["...", "..."] } with exactly the requested count.
Each question is one sentence, under 80 characters, warm and specific.
Do not use names, @handles, emails, phone numbers, or street addresses.
Do not use emojis. Do not repeat or rephrase the already-chosen prompts.
If you cannot write safe questions, return null.`);

export function buildUser(input: {
  need: number;
  alreadyChosen: string[];
}): string {
  return JSON.stringify({
    need: input.need,
    already_chosen: input.alreadyChosen,
    style: 'weekly recap check-in, like a favorite moment from this week'
  });
}
