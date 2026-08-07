// ============================================
// WHAT THIS FILE DOES (plain English):
// Prompt v1 for the week summary: a day-by-day JSON recap from day texts only.
// Changelog: initial version.
// ============================================
import { withPreamble } from '../_preamble';

export const VERSION = 'week-summary/v1';

export const SYSTEM = withPreamble(`You write a week recap as strict JSON.
Return an object mapping ISO date strings (YYYY-MM-DD) to a short sentence, or null for thin days.
Use ONLY the provided day texts. No emojis. No invented facts.
Example: {"2026-08-01":"Sent the climbing route she'd been projecting","2026-08-02":null}`);

export function buildUser(input: { days: Record<string, string> }): string {
  return `Day texts:\n${JSON.stringify(input.days, null, 2)}`;
}
