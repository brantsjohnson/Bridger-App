// ============================================
// WHAT THIS FILE DOES (plain English):
// Names and shapes for Bridge playbooks: the per-task manuals the agent reads
// (humans write them; the agent never edits them at runtime).
// ============================================

/** Stable file stem under guide-docs/playbooks/ (no .md). */
export type PlaybookId =
  | 'event-creation'
  | 'friend-questions'
  | 'notes-and-dates'
  | 'profile-update'
  | 'notification-triage'
  | 'messages'
  | 'touch-grass'
  | 'reconnect'
  | 'quiz-voice'
  | 'out-of-scope';

export interface PlaybookDocument {
  id: PlaybookId;
  version: string;
  /** Full markdown body (no PII; method only). */
  body: string;
}

/** Intent strings from agent_query → which playbook to inject. */
export const INTENT_TO_PLAYBOOK: Record<string, PlaybookId> = {
  create_event: 'event-creation',
  draft_event: 'event-creation',
  gift_ideas: 'friend-questions',
  recall_fact: 'friend-questions',
  search_notes: 'friend-questions',
  save_note: 'notes-and-dates',
  set_reminder: 'notes-and-dates',
  profile_update: 'profile-update',
  notification_triage: 'notification-triage',
  draft_message: 'messages',
  schedule_message: 'messages',
  reply_message: 'messages',
  touch_grass: 'touch-grass',
  reconnect: 'reconnect',
  upcoming: 'reconnect',
  quiz_voice: 'quiz-voice',
  refuse: 'out-of-scope',
  general: 'friend-questions'
};

export const ALL_PLAYBOOK_IDS: PlaybookId[] = [
  'event-creation',
  'friend-questions',
  'notes-and-dates',
  'profile-update',
  'notification-triage',
  'messages',
  'touch-grass',
  'reconnect',
  'quiz-voice',
  'out-of-scope'
];
