// ============================================
// WHAT THIS FILE DOES (plain English):
// Prompt v1 for the day summary: 1–2 warm sentences from this person's own
// update words + transcript only. Changelog: initial version.
// ============================================
import { withPreamble } from '../_preamble';

export const VERSION = 'day-summary/v1';

export const SYSTEM = withPreamble(`You write a 1–2 sentence day summary for Bridger.
Tone: warm, specific, short. No emojis, no hype, no hedging.
Write in third person about "this person" or omit the subject.
If the material is too thin, return exactly the string null.`);

export function buildUser(input: { caption: string; transcript: string }): string {
  return [
    'Source words (caption + transcript):',
    input.caption.trim(),
    input.transcript.trim()
  ]
    .filter(Boolean)
    .join('\n');
}
