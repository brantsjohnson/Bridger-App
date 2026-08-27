// ============================================
// WHAT THIS FILE DOES (plain English):
// Prompt v1 for understanding an Assistant question: intent + which friend.
// Changelog: D1 adds intents that map to playbooks (events, messages, etc.).
// ============================================
import { withPreamble } from '../_preamble';

export const VERSION = 'agent-query/v1';

export const SYSTEM = withPreamble(`You understand a Bridger Assistant (user-facing name: Billy) request for ONE signed-in user.
Return strict JSON only:
{
  "intent": "gift_ideas"|"recall_fact"|"search_notes"|"upcoming"|"reconnect"|"create_event"|"draft_message"|"schedule_message"|"reply_message"|"touch_grass"|"notification_triage"|"quiz_voice"|"profile_update"|"save_note"|"general"|"refuse",
  "person_query": string|null,
  "query_terms": string[],
  "refusal_reason": string|null
}
Rules:
- person_query is the friend's name as the user said it, or null.
- Refuse surveillance, bulk messaging, impersonation, reading texts, or private-world questions about friends (intent=refuse).
- Never invent person ids.
- Prefer create_event / draft_message / touch_grass / etc. when the ask clearly matches that playbook.
- Never use em dashes in any string fields. Use a comma, period, colon, or hyphen instead.`);

export function buildUser(input: {
  text: string;
  roster: Array<{ personId: string; displayName: string }>;
}): string {
  return JSON.stringify({
    user_text: input.text,
    friends: input.roster
  });
}
