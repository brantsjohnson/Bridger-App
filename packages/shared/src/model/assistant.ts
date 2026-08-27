// ============================================
// WHAT THIS FILE DOES (plain English):
// Shapes for the opt-in relationship Assistant (user-facing name: Billy):
// admin access flag, per-tool kill switches, chat turns, fill-loop session
// state, UI status signals, and act proposals that wait for your confirm.
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
  | 'suggest_reconnect_nudge'
  // Phase D1 catalog (admin default OFF; propose/handoff only until wired).
  | 'send_touch_grass'
  | 'schedule_message'
  | 'reply_message'
  | 'run_notification_triage'
  | 'take_quiz_voice'
  | 'attach_photo';

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
    // Phase D2 act tools (still killable from admin).
    save_note: true,
    set_reminder: true,
    draft_message: true,
    draft_event: true,
    add_calendar_entry: true,
    suggest_reconnect_nudge: true,
    send_touch_grass: true,
    schedule_message: true,
    reply_message: true,
    // Phase D3 later: stay off until built.
    run_notification_triage: false,
    take_quiz_voice: false,
    attach_photo: false
  },
  allowlist: []
};

/** User-facing product name for the opt-in assistant. */
export const BILLY_NAME = 'Billy';

/**
 * UI status for Widget / Island / Screen.
 * Often client-derived from busy + proposals + mic, not a server enum.
 */
export type AssistantUiStatus =
  | 'idle'
  | 'thinking'
  | 'listening'
  | 'result'
  | 'needs-you'
  | 'background';

/** Derive Widget/Island mood from what the client already knows. */
export function deriveAssistantUiStatus(input: {
  busy: boolean;
  listening: boolean;
  hasProposals: boolean;
  hasUnreadResult?: boolean;
  /** True when work continues after leaving the Billy room. */
  background?: boolean;
}): AssistantUiStatus {
  if (input.listening) return 'listening';
  if (input.busy && input.background) return 'background';
  if (input.busy) return 'thinking';
  if (input.hasProposals) return 'needs-you';
  if (input.hasUnreadResult) return 'result';
  return 'idle';
}

/** One-question-at-a-time fill state stored on assistant_sessions.fill_state. */
export interface AssistantFillState {
  playbookId?: string | null;
  playbookVersion?: string | null;
  goal?: string | null;
  /** Slot name → value (or null when still empty). */
  slots?: Record<string, unknown>;
  /** filling | awaiting_confirm | abandoned | idle */
  status?: 'idle' | 'filling' | 'awaiting_confirm' | 'abandoned';
  lastAsk?: string | null;
  interruptPending?: boolean;
}

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
  /** Which playbook (if any) guided this turn. */
  playbookId?: string | null;
  playbookVersion?: string | null;
  /** Latest fill-loop snapshot for the client preview. */
  fillState?: AssistantFillState | null;
  /** Hint for Widget/Island; client may also derive from busy/proposals. */
  statusHint?: AssistantUiStatus;
}

export interface AssistantActivityItem {
  id: string;
  tool: string;
  summary: string;
  createdAt: string;
  undoneAt?: string | null;
  playbookId?: string | null;
  playbookVersion?: string | null;
}
