// ============================================
// WHAT THIS FILE DOES (plain English):
// Talks to the opt-in Assistant API: open a session, send a text or voice turn,
// confirm/cancel proposed acts. Never puts query text into analytics.
// On localhost demo mode, Settings shows the toggle and chat uses a local stub
// so you can walk the UI without a live API key. The demo opt-in is saved on
// the device so leaving Settings does not turn it back off.
// ============================================
import type {
  AssistantProposal,
  AssistantTurnResponse,
  AssistantActivityItem,
  BillyStatusDto
} from '@bridger/shared';
import { trackProduct } from '@bridger/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, ApiHttpError } from '../lib/api';
import { isDemoMode } from '../lib/demo';

export type SettingsAssistantFlags = {
  assistantEnabled: boolean;
  assistantEligible: boolean;
  assistantVisible: boolean;
};

/** Device key for the demo Assistant switch (survives leaving Settings). */
const DEMO_ASSISTANT_KEY = 'bridger.demo.assistant_enabled';

// THIS SECTION DOES: keep a fast in-memory copy after the first AsyncStorage read.
let demoAssistantEnabled: boolean | null = null;

async function readDemoAssistantEnabled(): Promise<boolean> {
  if (demoAssistantEnabled !== null) return demoAssistantEnabled;
  const raw = await AsyncStorage.getItem(DEMO_ASSISTANT_KEY);
  demoAssistantEnabled = raw === '1';
  return demoAssistantEnabled;
}

export async function fetchAssistantSettings(): Promise<SettingsAssistantFlags> {
  if (isDemoMode()) {
    const enabled = await readDemoAssistantEnabled();
    return {
      assistantEnabled: enabled,
      assistantEligible: true,
      assistantVisible: true
    };
  }
  // THIS SECTION DOES: stay quiet when nobody is signed in (Welcome / Sign in),
  // or when the API address is missing / the server is down. Home calls this on
  // every focus; a throw here used to crash cold start before any screen painted.
  try {
    const s = await apiFetch<SettingsAssistantFlags>('/me/settings');
    return {
      assistantEnabled: Boolean(s.assistantEnabled),
      assistantEligible: Boolean(s.assistantEligible),
      assistantVisible: Boolean(s.assistantVisible)
    };
  } catch (err) {
    if (err instanceof ApiHttpError) {
      return {
        assistantEnabled: false,
        assistantEligible: false,
        assistantVisible: false
      };
    }
    console.warn('[bridger] fetchAssistantSettings failed softly', err);
    return {
      assistantEnabled: false,
      assistantEligible: false,
      assistantVisible: false
    };
  }
}

export async function setAssistantEnabled(enabled: boolean): Promise<void> {
  if (isDemoMode()) {
    demoAssistantEnabled = enabled;
    await AsyncStorage.setItem(DEMO_ASSISTANT_KEY, enabled ? '1' : '0');
    trackProduct(enabled ? 'assistant_enabled' : 'assistant_disabled', {
      method: 'setting'
    });
    return;
  }
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ assistantEnabled: enabled })
  });
  trackProduct(enabled ? 'assistant_enabled' : 'assistant_disabled', {
    method: 'setting'
  });
}

export async function openAssistantSession(): Promise<string> {
  if (isDemoMode()) {
    const enabled = await readDemoAssistantEnabled();
    if (!enabled) {
      throw new Error('Assistant is off in Settings');
    }
    return `demo-session-${Date.now()}`;
  }
  const res = await apiFetch<{ sessionId: string }>('/assistant/sessions', {
    method: 'POST',
    body: '{}'
  });
  return res.sessionId;
}

export async function closeAssistantSession(sessionId: string): Promise<void> {
  if (isDemoMode()) return;
  await apiFetch(`/assistant/sessions/${encodeURIComponent(sessionId)}/close`, {
    method: 'POST',
    body: '{}'
  });
}

export async function assistantTurn(
  sessionId: string,
  text: string
): Promise<AssistantTurnResponse> {
  if (isDemoMode()) {
    trackProduct('assistant_query', { mode: 'text' });
    return {
      sessionId,
      reply:
        "Demo mode: I'm a local stub. On a live API I'd answer from your saved notes. Try reconnect, birthday, or save a note when you're signed in.",
      proposedActs: []
    };
  }
  const res = await apiFetch<AssistantTurnResponse>(
    `/assistant/sessions/${encodeURIComponent(sessionId)}/turn`,
    {
      method: 'POST',
      body: JSON.stringify({ text })
    }
  );
  trackProduct('assistant_query', { mode: 'text' });
  for (const act of res.proposedActs ?? []) {
    trackProduct('assistant_tool_proposed', { tool: act.tool });
  }
  return res;
}

export async function assistantVoiceTurn(
  sessionId: string,
  audioBase64: string,
  filename = 'voice.m4a'
): Promise<AssistantTurnResponse & { transcript: string }> {
  if (isDemoMode()) {
    void audioBase64;
    void filename;
    trackProduct('assistant_query', { mode: 'voice' });
    return {
      sessionId,
      transcript: '(demo voice)',
      reply:
        'Demo mode: voice turns need the live API and STT. Text chat works here as a stub.',
      proposedActs: []
    };
  }
  const res = await apiFetch<AssistantTurnResponse & { transcript: string }>(
    `/assistant/sessions/${encodeURIComponent(sessionId)}/voice`,
    {
      method: 'POST',
      body: JSON.stringify({ audioBase64, filename })
    }
  );
  trackProduct('assistant_query', { mode: 'voice' });
  return res;
}

export async function confirmAssistantAct(
  proposalId: string,
  /** Edits from DraftPreview / EventPreview before Nest runs the act. */
  argsPatch?: Record<string, unknown>
) {
  if (isDemoMode()) {
    void proposalId;
    void argsPatch;
    trackProduct('assistant_action_confirmed', {});
    return { ok: true, handoff: null };
  }
  const res = await apiFetch<{
    ok: boolean;
    handoff?: {
      type: string;
      personId?: string;
      draft?: string;
      prefill?: Record<string, unknown>;
      title?: string;
      date?: string;
      notes?: string;
      sendAt?: string;
      queued?: boolean;
      sent?: boolean;
      signalId?: string;
      who?: string;
      when?: unknown;
      audience?: unknown;
      mode?: string;
      quizSlug?: string;
      mediaId?: string;
      target?: string;
    } | null;
    activityId?: string;
  }>('/assistant/actions/confirm', {
    method: 'POST',
    body: JSON.stringify({ proposalId, argsPatch })
  });
  trackProduct('assistant_action_confirmed', {});
  return res;
}

export async function cancelAssistantAct(proposalId: string) {
  if (isDemoMode()) {
    void proposalId;
    trackProduct('assistant_action_cancelled', {});
    return;
  }
  await apiFetch('/assistant/actions/cancel', {
    method: 'POST',
    body: JSON.stringify({ proposalId })
  });
  trackProduct('assistant_action_cancelled', {});
}

export async function listAssistantActivity(): Promise<AssistantActivityItem[]> {
  if (isDemoMode()) return [];
  return apiFetch<AssistantActivityItem[]>('/assistant/activity');
}

export async function undoAssistantActivity(id: string): Promise<void> {
  if (isDemoMode()) return;
  await apiFetch(`/assistant/activity/${encodeURIComponent(id)}/undo`, {
    method: 'POST',
    body: '{}'
  });
  trackProduct('assistant_action_undone', {});
}

/** How much Billy time is left (USD of model cost). */
export async function fetchBillyStatus(): Promise<BillyStatusDto | null> {
  if (isDemoMode()) {
    return {
      plan: 'taste',
      status: 'active',
      balanceUsd: 0.5,
      grantUsdPerMonth: 0.5,
      rolloverCapUsd: 7,
      periodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      plusPriceUsd: 5,
      canStartTurn: true
    };
  }
  try {
    return await apiFetch<BillyStatusDto>('/assistant/billy/status');
  } catch {
    return null;
  }
}

export async function startBillyPlusStub(): Promise<BillyStatusDto | null> {
  if (isDemoMode()) {
    trackProduct('billy_plus_started', { method: 'stub' });
    return {
      plan: 'plus',
      status: 'active',
      balanceUsd: 3.5,
      grantUsdPerMonth: 3.5,
      rolloverCapUsd: 7,
      periodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      plusPriceUsd: 5,
      canStartTurn: true
    };
  }
  const res = await apiFetch<BillyStatusDto>('/assistant/billy/plus/stub', {
    method: 'POST',
    body: '{}'
  });
  trackProduct('billy_plus_started', { method: 'stub' });
  return res;
}

export async function cancelBillyPlus(): Promise<BillyStatusDto | null> {
  if (isDemoMode()) {
    trackProduct('billy_plus_cancel_scheduled', {});
    return null;
  }
  const res = await apiFetch<BillyStatusDto>('/assistant/billy/plus/cancel', {
    method: 'POST',
    body: '{}'
  });
  trackProduct('billy_plus_cancel_scheduled', {});
  return res;
}

export type { AssistantProposal };
