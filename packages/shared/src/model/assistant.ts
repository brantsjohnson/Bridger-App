// ============================================
// WHAT THIS FILE DOES (plain English):
// Shapes for the opt-in relationship Assistant: admin access flag, per-tool
// kill switches, chat turns, and act proposals that wait for your confirm.
// ============================================

/** Who may even see the Assistant setting. Default ships founder_only. */
export type AssistantAccess =
  | 'off'
  | 'founder_only'
  | 'allowlist'
  | 'coop'
  | 'everyone';

/** Tools the assistant may use when the admin switch is on. */
export type AssistantToolName =
  | 'recall_friend'
  | 'search_notes'
  | 'list_upcoming'
  | 'who_to_reconnect'
  | 'save_note'
  | 'set_reminder'
  | 'draft_message'
  | 'draft_event'
  | 'add_calendar_entry'
  | 'suggest_reconnect_nudge';

export type AssistantToolFlags = Record<AssistantToolName, boolean>;

export interface AssistantAdminConfig {
  access: AssistantAccess;
  tools: AssistantToolFlags;
  /** Opaque user ids when access = allowlist. */
  allowlist: string[];
}

export const DEFAULT_ASSISTANT_ADMIN: AssistantAdminConfig = {
  access: 'founder_only',
  tools: {
    recall_friend: true,
    search_notes: true,
    list_upcoming: true,
    who_to_reconnect: true,
    save_note: false,
    set_reminder: false,
    draft_message: false,
    draft_event: false,
    add_calendar_entry: false,
    suggest_reconnect_nudge: false
  },
  allowlist: []
};

/** One proposed act waiting for an on-screen confirm. */
export interface AssistantProposal {
  id: string;
  tool: AssistantToolName;
  preview: string;
  args: Record<string, unknown>;
}

export interface AssistantTurnResponse {
  reply: string;
  proposedActs: AssistantProposal[];
  sessionId: string;
}

export interface AssistantActivityItem {
  id: string;
  tool: string;
  summary: string;
  createdAt: string;
  undoneAt?: string | null;
}
