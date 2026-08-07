// ============================================
// WHAT THIS FILE DOES (plain English):
// Prompt v1 for understanding an Assistant question: intent + which friend.
// Changelog: initial version for AGENT plan.
// ============================================
import { withPreamble } from '../_preamble';

export const VERSION = 'agent-query/v1';

export const SYSTEM = withPreamble(`You understand a Bridger Assistant request for ONE signed-in user.
Return strict JSON only:
{
  "intent": "gift_ideas"|"recall_fact"|"search_notes"|"upcoming"|"reconnect"|"general"|"refuse",
  "person_query": string|null,
  "query_terms": string[],
  "refusal_reason": string|null
}
Rules:
- person_query is the friend's name as the user said it, or null.
- Refuse surveillance, bulk messaging, impersonation, reading texts, or private-world questions about friends (intent=refuse).
- Never invent person ids.`);

export function buildUser(input: {
  text: string;
  roster: Array<{ personId: string; displayName: string }>;
}): string {
  return JSON.stringify({
    user_text: input.text,
    friends: input.roster
  });
}
