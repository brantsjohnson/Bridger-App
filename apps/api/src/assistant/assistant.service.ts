// ============================================
// WHAT THIS FILE DOES (plain English):
// Runs one Assistant chat turn: check gates, understand the question, read
// your notes/friends through the permission layer, answer briefly, and maybe
// propose an act that still needs your confirm tap.
//
// --- SECURITY / PRIVACY ---
// Sync path with principalId on every gateway call. Never logs query text to
// analytics. Context is discarded when the session closes.
// ============================================
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  runJob,
  agentQuery,
  agentReasoning,
  type AiConfigStore
} from '@bridger/ai';
import type {
  AssistantProposal,
  AssistantToolName,
  AssistantTurnResponse,
  Json
} from '@bridger/shared';
import { NestAiConfigStore } from '../ai/ai-config.store';
import { NotesService } from '../notes/notes.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AssistantContextService } from './assistant-context.service';
import { AssistantGateService } from './assistant-gate.service';

const ACT_TOOLS: AssistantToolName[] = [
  'save_note',
  'set_reminder',
  'draft_message',
  'draft_event',
  'add_calendar_entry',
  'suggest_reconnect_nudge'
];

@Injectable()
export class AssistantService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly gate: AssistantGateService,
    private readonly context: AssistantContextService,
    private readonly notes: NotesService,
    private readonly aiConfigStore: NestAiConfigStore
  ) {}

  private async requireUse(userId: string) {
    if (!(await this.gate.canUse(userId))) {
      throw new ForbiddenException('Assistant is not available');
    }
  }

  async openSession(userId: string) {
    await this.requireUse(userId);
    const { data, error } = await this.supabase.admin
      .from('assistant_sessions')
      .insert({ user_id: userId, status: 'open' })
      .select('id')
      .single();
    if (error) throw error;
    return { sessionId: data.id };
  }

  async closeSession(userId: string, sessionId: string) {
    await this.requireUse(userId);
    await this.supabase.admin
      .from('assistant_turns')
      .delete()
      .eq('session_id', sessionId);
    await this.supabase.admin
      .from('assistant_sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', userId);
    return { ok: true };
  }

  async turn(
    userId: string,
    sessionId: string,
    text: string
  ): Promise<AssistantTurnResponse> {
    await this.requireUse(userId);
    const trimmed = text.trim();
    if (!trimmed) throw new BadRequestException('text is required');

    const { data: session } = await this.supabase.admin
      .from('assistant_sessions')
      .select('id, status')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!session || session.status !== 'open') {
      throw new NotFoundException('Session not found');
    }

    await this.supabase.admin.from('assistant_turns').insert({
      session_id: sessionId,
      role: 'user',
      content: trimmed
    });

    const friends = await this.context.listConnections(userId);
    const roster = friends.map((f) => ({
      personId: f.personId,
      displayName: f.displayName
    }));

    // Step 1: understand intent (fast model).
    const queryPrompt = agentQuery.buildUser({ text: trimmed, roster });
    const queryResult = await this.runAgentJob(
      'agent_query',
      userId,
      queryPrompt
    );

    let intent = 'general';
    let personQuery: string | null = null;
    let queryTerms: string[] = [];
    if (queryResult && typeof queryResult === 'object') {
      const q = queryResult as {
        intent?: string;
        person_query?: string | null;
        query_terms?: string[];
        refusal_reason?: string | null;
      };
      intent = q.intent ?? 'general';
      personQuery = q.person_query ?? null;
      queryTerms = Array.isArray(q.query_terms) ? q.query_terms : [];
      if (intent === 'refuse') {
        const reply =
          q.refusal_reason ||
          "I can only help with what you've saved and what friends share with you. I won't guess about someone's private world.";
        await this.saveAssistantTurn(sessionId, reply);
        return { reply, proposedActs: [], sessionId };
      }
    }

    // Resolve friend name → id (ask if ambiguous).
    const focusIds = resolvePersonIds(personQuery, friends);
    if (personQuery && focusIds.length > 1) {
      const names = focusIds
        .map((id) => friends.find((f) => f.personId === id)?.displayName)
        .filter(Boolean)
        .join(' or ');
      const reply = `Which ${personQuery} — ${names}?`;
      await this.saveAssistantTurn(sessionId, reply);
      return { reply, proposedActs: [], sessionId };
    }

    // Step 2: run read tools Nest-side (re-auth on every call).
    const toolResults = await this.runReadTools(userId, intent, {
      focusIds,
      queryTerms,
      personQuery
    });

    const contextBlock = await this.context.buildDelimitedContext(
      userId,
      focusIds
    );
    const enabledActs: AssistantToolName[] = [];
    for (const t of ACT_TOOLS) {
      if (await this.gate.isToolEnabled(t)) enabledActs.push(t);
    }

    const reasonPrompt = agentReasoning.buildUser({
      userText: trimmed,
      context: contextBlock,
      toolResults: JSON.stringify(toolResults),
      enabledActTools: enabledActs
    });

    const reasonRaw = await this.runAgentJob(
      'agent_reasoning',
      userId,
      reasonPrompt
    );

    const parsed = parseReasoning(reasonRaw);
    const proposedActs = await this.persistProposals(
      userId,
      sessionId,
      parsed.proposedActs.filter((a) => enabledActs.includes(a.tool))
    );

    await this.saveAssistantTurn(sessionId, parsed.reply);
    return { reply: parsed.reply, proposedActs, sessionId };
  }

  /** Voice: STT then same turn pipeline. Transcript never logged to analytics. */
  async voiceTurn(
    userId: string,
    sessionId: string,
    audioBase64: string,
    filename: string
  ): Promise<AssistantTurnResponse & { transcript: string }> {
    await this.requireUse(userId);
    const stt = await runJob(
      {
        job: 'agent_voice',
        subjectRef: userId,
        principalId: userId,
        payload: {
          subject_ref: userId,
          audio_base64: audioBase64,
          filename
        }
      },
      {
        configStore: this.aiConfigStore as AiConfigStore,
        secrets: {
          anthropicApiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
          openaiApiKey: this.config.get<string>('OPENAI_API_KEY')
        }
      }
    );
    const transcript =
      stt.status === 'ok'
        ? String((stt.value as { text?: string })?.text ?? '')
        : '';
    if (!transcript.trim()) {
      return {
        reply: "I couldn't hear that clearly. Try again?",
        proposedActs: [],
        sessionId,
        transcript: ''
      };
    }
    const turn = await this.turn(userId, sessionId, transcript);
    return { ...turn, transcript };
  }

  async confirmAction(userId: string, proposalId: string) {
    await this.requireUse(userId);
    const { data: proposal } = await this.supabase.admin
      .from('assistant_proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    if (!proposal) throw new NotFoundException('Proposal not found');

    const tool = proposal.tool as AssistantToolName;
    if (!(await this.gate.isToolEnabled(tool))) {
      throw new ForbiddenException('Tool disabled');
    }

    const args = (proposal.args ?? {}) as Record<string, unknown>;
    const result = await this.executeAct(userId, tool, args);

    await this.supabase.admin
      .from('assistant_proposals')
      .update({
        status: 'confirmed',
        resolved_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    const { data: log } = await this.supabase.admin
      .from('assistant_activity_log')
      .insert({
        user_id: userId,
        tool,
        summary: proposal.preview,
        undo_payload: (result.undoPayload ?? null) as Json
      })
      .select('id, tool, summary, created_at')
      .single();

    return {
      ok: true,
      handoff: result.handoff ?? null,
      activityId: log?.id
    };
  }

  async cancelAction(userId: string, proposalId: string) {
    await this.requireUse(userId);
    await this.supabase.admin
      .from('assistant_proposals')
      .update({
        status: 'cancelled',
        resolved_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .eq('user_id', userId);
    return { ok: true };
  }

  async listActivity(userId: string) {
    await this.requireUse(userId);
    const { data } = await this.supabase.admin
      .from('assistant_activity_log')
      .select('id, tool, summary, created_at, undone_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []).map((r) => ({
      id: r.id,
      tool: r.tool,
      summary: r.summary,
      createdAt: r.created_at,
      undoneAt: r.undone_at
    }));
  }

  async undoActivity(userId: string, activityId: string) {
    await this.requireUse(userId);
    const { data } = await this.supabase.admin
      .from('assistant_activity_log')
      .select('*')
      .eq('id', activityId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!data || data.undone_at) throw new NotFoundException('Not found');

    const undo = data.undo_payload as { noteId?: string } | null;
    if (undo?.noteId) {
      try {
        await this.notes.remove(userId, undo.noteId);
      } catch {
        // already gone
      }
    }
    await this.supabase.admin
      .from('assistant_activity_log')
      .update({ undone_at: new Date().toISOString() })
      .eq('id', activityId);
    return { ok: true };
  }

  private async runReadTools(
    userId: string,
    intent: string,
    opts: {
      focusIds: string[];
      queryTerms: string[];
      personQuery: string | null;
    }
  ) {
    const results: Record<string, unknown> = {};
    if (
      (intent === 'gift_ideas' ||
        intent === 'recall_fact' ||
        intent === 'general') &&
      opts.focusIds[0] &&
      (await this.gate.isToolEnabled('recall_friend'))
    ) {
      results.recall_friend = await this.context.recallFriend(
        userId,
        opts.focusIds[0]
      );
    }
    if (
      (intent === 'search_notes' || opts.queryTerms.length) &&
      (await this.gate.isToolEnabled('search_notes'))
    ) {
      const q = opts.queryTerms.join(' ') || opts.personQuery || '';
      if (q) results.search_notes = await this.context.searchNotes(userId, q);
    }
    if (
      intent === 'upcoming' &&
      (await this.gate.isToolEnabled('list_upcoming'))
    ) {
      results.list_upcoming = await this.context.listUpcoming(userId);
    }
    if (
      intent === 'reconnect' &&
      (await this.gate.isToolEnabled('who_to_reconnect'))
    ) {
      results.who_to_reconnect = await this.context.whoToReconnect(userId);
    }
    return results;
  }

  private async executeAct(
    userId: string,
    tool: AssistantToolName,
    args: Record<string, unknown>
  ): Promise<{ undoPayload?: Record<string, unknown>; handoff?: Record<string, unknown> }> {
    // Refuse bulk messaging: one person per confirm.
    const personIds = Array.isArray(args.personIds)
      ? args.personIds.filter((x): x is string => typeof x === 'string')
      : [];
    if (personIds.length > 1 || (tool === 'draft_message' && personIds.length > 1)) {
      throw new BadRequestException(
        'Confirm one person at a time. I can draft a few separately if you want.'
      );
    }

    // Fail closed: personId must be in U's graph when present.
    if (typeof args.personId === 'string') {
      const friends = await this.context.listConnections(userId);
      if (!friends.some((f) => f.personId === args.personId)) {
        throw new ForbiddenException('That person is not in your circle');
      }
    }

    if (tool === 'save_note' || tool === 'set_reminder' || tool === 'suggest_reconnect_nudge') {
      const personId = String(args.personId ?? '');
      const text = String(args.text ?? args.body ?? '');
      const kind =
        tool === 'suggest_reconnect_nudge'
          ? 'check_in'
          : tool === 'set_reminder'
            ? 'date'
            : 'text';
      const note = await this.notes.create(userId, {
        personId,
        kind: kind as 'text' | 'date' | 'check_in',
        text,
        date: typeof args.date === 'string' ? args.date : undefined,
        cadence:
          tool === 'suggest_reconnect_nudge'
            ? (args.cadence as 'week' | 'biweek' | 'month') ?? 'biweek'
            : undefined
      });
      // Index into private memory chunks (keyword; embed optional later).
      await this.supabase.admin.from('assistant_memory_chunks').insert({
        user_id: userId,
        kind: 'note',
        ref_id: note.id,
        text: `${note.kind}: ${note.body}`
      });
      return { undoPayload: { noteId: note.id } };
    }

    if (tool === 'draft_message') {
      const personId = String(args.personId ?? '');
      const draft = String(args.draft ?? args.text ?? '');
      // Handoff only — agent never sends.
      return {
        handoff: {
          type: 'draft_message',
          personId,
          draft
        }
      };
    }

    if (tool === 'draft_event') {
      return {
        handoff: {
          type: 'draft_event',
          prefill: args.prefill ?? args
        }
      };
    }

    if (tool === 'add_calendar_entry') {
      return {
        handoff: {
          type: 'add_calendar_entry',
          title: String(args.title ?? ''),
          date: String(args.date ?? ''),
          notes: typeof args.notes === 'string' ? args.notes : undefined
        }
      };
    }

    throw new BadRequestException(`Unsupported tool ${tool}`);
  }

  private async persistProposals(
    userId: string,
    sessionId: string,
    acts: Array<{ tool: AssistantToolName; preview: string; args: Record<string, unknown> }>
  ): Promise<AssistantProposal[]> {
    const out: AssistantProposal[] = [];
    for (const act of acts) {
      const { data, error } = await this.supabase.admin
        .from('assistant_proposals')
        .insert({
          user_id: userId,
          session_id: sessionId,
          tool: act.tool,
          preview: act.preview,
          args: act.args as Json,
          status: 'pending'
        })
        .select('id, tool, preview, args')
        .single();
      if (error || !data) continue;
      out.push({
        id: data.id,
        tool: data.tool as AssistantToolName,
        preview: data.preview,
        args: (data.args ?? {}) as Record<string, unknown>
      });
    }
    return out;
  }

  private async saveAssistantTurn(sessionId: string, reply: string) {
    await this.supabase.admin.from('assistant_turns').insert({
      session_id: sessionId,
      role: 'assistant',
      content: reply
    });
  }

  private async runAgentJob(
    job: 'agent_query' | 'agent_reasoning',
    userId: string,
    userPrompt: string
  ): Promise<unknown> {
    const result = await runJob(
      {
        job,
        subjectRef: userId,
        principalId: userId,
        payload: {
          subject_ref: userId,
          user_prompt: userPrompt
        }
      },
      {
        configStore: this.aiConfigStore as AiConfigStore,
        secrets: {
          anthropicApiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
          openaiApiKey: this.config.get<string>('OPENAI_API_KEY')
        }
      }
    );
    if (result.status !== 'ok') {
      // Fail silent → helpful fallback without inventing friend facts.
      if (job === 'agent_query') {
        return { intent: 'general', person_query: null, query_terms: [] };
      }
      return {
        reply:
          "I couldn't look that up right now. Try again in a moment, or check the notes on their profile.",
        proposed_acts: []
      };
    }
    if (typeof result.value === 'string') {
      try {
        return JSON.parse(result.value);
      } catch {
        return { reply: result.value, proposed_acts: [] };
      }
    }
    return result.value;
  }
}

function resolvePersonIds(
  personQuery: string | null,
  friends: Array<{ personId: string; displayName: string }>
): string[] {
  if (!personQuery) return [];
  const q = personQuery.trim().toLowerCase();
  return friends
    .filter((f) => {
      const name = f.displayName.toLowerCase();
      return name === q || name.startsWith(q) || name.includes(` ${q}`);
    })
    .map((f) => f.personId);
}

function parseReasoning(raw: unknown): {
  reply: string;
  proposedActs: Array<{
    tool: AssistantToolName;
    preview: string;
    args: Record<string, unknown>;
  }>;
} {
  let obj: Record<string, unknown> = {};
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { reply: raw, proposedActs: [] };
    }
  } else if (raw && typeof raw === 'object') {
    obj = raw as Record<string, unknown>;
  }
  const reply =
    typeof obj.reply === 'string'
      ? obj.reply
      : "I don't have enough saved info to answer that yet.";
  const actsRaw = Array.isArray(obj.proposed_acts) ? obj.proposed_acts : [];
  const proposedActs = actsRaw
    .filter((a): a is Record<string, unknown> => a != null && typeof a === 'object')
    .map((a) => ({
      tool: a.tool as AssistantToolName,
      preview: String(a.preview ?? ''),
      args: (a.args && typeof a.args === 'object'
        ? a.args
        : {}) as Record<string, unknown>
    }))
    .filter((a) => a.tool && a.preview);
  return { reply, proposedActs };
}
