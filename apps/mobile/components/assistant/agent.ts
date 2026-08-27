// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared names and shapes for Billy (the opt-in assistant): status moods,
// suggestion chips, and draft/action types used by Widget, Screen, and Island.
// ============================================
import type { AssistantUiStatus } from '@bridger/shared';
import { BILLY_NAME } from '@bridger/shared';

export type AgentRole = 'you' | 'billy';

export interface AgentAction {
  id: string;
  label: string;
  detail?: string;
  kind: 'send' | 'open' | 'dismiss';
}

/** The real words Billy wrote, shown before you approve. */
export interface AgentDraft {
  id: string;
  /** e.g. "Message", "Invite" */
  kind: string;
  to: string;
  body: string;
  /** Links to a pending proposal when confirm goes through Nest. */
  proposalId?: string;
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  text: string;
  sources?: string[];
  actions?: AgentAction[];
  draft?: AgentDraft;
  at: string;
}

export type AgentStatus = AssistantUiStatus;

export const AGENT_NAME = BILLY_NAME;

/** Verbs shown when Billy is idle. */
export const AGENT_SUGGESTIONS = [
  'Who have I not seen in a while?',
  'Find a night the four of us are free',
  'What should I ask Devon about?',
  'Draft an invite for sketch night'
];

export const LISTENING_HINTS = [
  'Listening…',
  'Say what you want changed',
  'Or tap the mic to stop'
];
