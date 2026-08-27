// ============================================
// WHAT THIS FILE DOES (plain English):
// Scaffolding for Bridge's one-question-at-a-time fill loop: slots, interrupt,
// and abandon. State lives as JSON on assistant_sessions.fill_state.
// Read tools stay wired in AssistantService; new act tools stay admin-off.
// ============================================
import { Injectable } from '@nestjs/common';
import type { AssistantFillState } from '@bridger/shared';

/** Words that drop an in-progress action immediately. */
const ABANDON_RE =
  /^(never mind|nevermind|cancel|stop|forget it|scratch that)\b/i;

@Injectable()
export class FillLoopService {
  /** True when the user wants to drop the half-built action. */
  isAbandon(text: string): boolean {
    return ABANDON_RE.test(text.trim());
  }

  /** Empty fill state for a fresh session. */
  empty(): AssistantFillState {
    return {
      playbookId: null,
      playbookVersion: null,
      goal: null,
      slots: {},
      status: 'idle',
      lastAsk: null,
      interruptPending: false
    };
  }

  /** Normalize JSON from the DB into a typed fill state. */
  parse(raw: unknown): AssistantFillState {
    if (!raw || typeof raw !== 'object') return this.empty();
    const o = raw as Record<string, unknown>;
    const status = o.status;
    return {
      playbookId: typeof o.playbookId === 'string' ? o.playbookId : null,
      playbookVersion:
        typeof o.playbookVersion === 'string' ? o.playbookVersion : null,
      goal: typeof o.goal === 'string' ? o.goal : null,
      slots:
        o.slots && typeof o.slots === 'object'
          ? (o.slots as Record<string, unknown>)
          : {},
      status:
        status === 'filling' ||
        status === 'awaiting_confirm' ||
        status === 'abandoned' ||
        status === 'idle'
          ? status
          : 'idle',
      lastAsk: typeof o.lastAsk === 'string' ? o.lastAsk : null,
      interruptPending: Boolean(o.interruptPending)
    };
  }

  /** Clear everything after abandon (writes nothing). */
  abandoned(prev: AssistantFillState): AssistantFillState {
    return {
      ...this.empty(),
      playbookId: prev.playbookId ?? null,
      playbookVersion: prev.playbookVersion ?? null,
      status: 'abandoned'
    };
  }

  /**
   * Merge model fill_update + playbook stamp into session state.
   * Interrupt: any slot change while filling marks interruptPending briefly.
   */
  merge(input: {
    prev: AssistantFillState;
    playbookId: string;
    playbookVersion: string;
    goal?: string | null;
    fillUpdate?: {
      slots?: Record<string, unknown>;
      status?: AssistantFillState['status'];
      last_ask?: string | null;
    } | null;
  }): AssistantFillState {
    const nextSlots = {
      ...(input.prev.slots ?? {}),
      ...(input.fillUpdate?.slots ?? {})
    };
    const wasFilling =
      input.prev.status === 'filling' ||
      input.prev.status === 'awaiting_confirm';
    const slotsChanged =
      JSON.stringify(input.prev.slots ?? {}) !== JSON.stringify(nextSlots);

    return {
      playbookId: input.playbookId,
      playbookVersion: input.playbookVersion,
      goal: input.goal ?? input.prev.goal ?? null,
      slots: nextSlots,
      status: input.fillUpdate?.status ?? (wasFilling ? 'filling' : 'filling'),
      lastAsk:
        input.fillUpdate?.last_ask !== undefined
          ? input.fillUpdate.last_ask
          : input.prev.lastAsk ?? null,
      interruptPending: wasFilling && slotsChanged
    };
  }
}
