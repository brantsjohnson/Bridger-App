// ============================================
// WHAT THIS FILE DOES (plain English):
// Runs one Billy chat turn: check gates + Billy allowance, load the matching
// playbook, run the fill loop (slots / abandon), understand the question, read
// your notes through the permission layer, answer briefly, and maybe propose an
// act that still needs your confirm tap.
//
// --- SECURITY / PRIVACY ---
// Sync path with principalId on every gateway call. Never logs query text to
// analytics. Context is discarded when the session closes. Playbook ids/versions
// are logged (method metadata), never content.
// ============================================
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
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
  AssistantFillState,
  AssistantProposal,
  AssistantToolName,
  AssistantTurnResponse,
  AssistantUiStatus,
  GrassWhen,
  Json
} from '@bridger/shared';
import { NestAiConfigStore } from '../ai/ai-config.store';
import { NotesService } from '../notes/notes.service';
import { TouchGrassService } from '../touchgrass/touchgrass.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AssistantContextService } from './assistant-context.service';
import { AssistantGateService } from './assistant-gate.service';
import { BillyBillingService } from './billy-billing.service';
import { FillLoopService } from './fill-loop.service';
import { PlaybookLoaderService } from './playbook-loader.service';

/** Act tools that write or hand off. New D1 tools stay admin-off. */
const ACT_TOOLS: AssistantToolName[] = [
  'save_note',
  'set_reminder',
  'draft_message',
  'draft_event',
  'add_calendar_entry',
  'suggest_reconnect_nudge',
  'send_touch_grass',
  'schedule_message',
  'reply_message',
  'run_notification_triage',
  'take_quiz_voice',
  'attach_photo'
];

@Injectable()
export class AssistantService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly gate: AssistantGateService,
    private readonly context: AssistantContextService,
    private readonly notes: NotesService,
    private readonly touchGrass: TouchGrassService,
    private readonly aiConfigStore: NestAiConfigStore,
    private readonly playbooks: PlaybookLoaderService,
    private readonly fillLoop: FillLoopService,
    private readonly billing: BillyBillingService
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
      .insert({
        user_id: userId,
        status: 'open',
        fill_state: this.fillLoop.empty() as unknown as Json
      })
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
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        fill_state: this.fillLoop.empty() as unknown as Json
      })
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
    // THIS SECTION DOES: make sure they still have Billy time left this period.
    await this.billing.assertCanStartTurn(userId);
    const trimmed = text.trim();
    if (!trimmed) throw new BadRequestException('text is required');

    const { data: session } = await this.supabase.admin
      .from('assistant_sessions')
      .select('id, status, fill_state')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!session || session.status !== 'open') {
      throw new NotFoundException('Session not found');
    }

    let fillState = this.fillLoop.parse(session.fill_state);

    // THIS SECTION DOES: drop a half-built action when the user says stop.
    if (this.fillLoop.isAbandon(trimmed)) {
      fillState = this.fillLoop.abandoned(fillState);
      await this.persistFillState(sessionId, fillState);
      const reply =
        "Okay, I stopped. Nothing was saved or sent. What else can I help with?";
      await this.saveAssistantTurn(sessionId, 'user', trimmed, fillState);
      await this.saveAssistantTurn(sessionId, 'assistant', reply, fillState);
      return {
        reply,
        proposedActs: [],
        sessionId,
        playbookId: fillState.playbookId,
        playbookVersion: fillState.playbookVersion,
        fillState,
        statusHint: 'idle'
      };
    }

    await this.saveAssistantTurn(sessionId, 'user', trimmed, fillState);

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
        const playbook = this.playbooks.forIntent('refuse');
        fillState = {
          ...fillState,
          playbookId: playbook.id,
          playbookVersion: playbook.version
        };
        await this.persistFillState(sessionId, fillState);
        const reply =
          q.refusal_reason ||
          "I can only help with what you've saved and what friends share with you. I won't guess about someone's private world.";
        await this.saveAssistantTurn(sessionId, 'assistant', reply, fillState);
        return {
          reply,
          proposedActs: [],
          sessionId,
          playbookId: playbook.id,
          playbookVersion: playbook.version,
          fillState,
          statusHint: 'idle'
        };
      }
    }

    // THIS SECTION DOES: load the matching playbook for this intent.
    const playbook = this.playbooks.forIntent(intent);

    // Resolve friend name → id (ask if ambiguous).
    const focusIds = resolvePersonIds(personQuery, friends);
    if (personQuery && focusIds.length > 1) {
      const names = focusIds
        .map((id) => friends.find((f) => f.personId === id)?.displayName)
        .filter(Boolean)
        .join(' or ');
      const reply = `Which ${personQuery}: ${names}?`;
      fillState = {
        ...fillState,
        playbookId: playbook.id,
        playbookVersion: playbook.version,
        status: 'filling',
        lastAsk: reply
      };
      await this.persistFillState(sessionId, fillState);
      await this.saveAssistantTurn(sessionId, 'assistant', reply, fillState);
      return {
        reply,
        proposedActs: [],
        sessionId,
        playbookId: playbook.id,
        playbookVersion: playbook.version,
        fillState,
        statusHint: 'needs-you'
      };
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
      enabledActTools: enabledActs,
      playbookId: playbook.id,
      playbookVersion: playbook.version,
      playbookBody: playbook.body,
      fillStateJson: JSON.stringify(fillState)
    });

    const reasonRaw = await this.runAgentJob(
      'agent_reasoning',
      userId,
      reasonPrompt
    );

    const parsed = parseReasoning(reasonRaw);
    fillState = this.fillLoop.merge({
      prev: fillState,
      playbookId: playbook.id,
      playbookVersion: playbook.version,
      goal: intent,
      fillUpdate: parsed.fillUpdate
    });
    await this.persistFillState(sessionId, fillState);

    const proposedActs = await this.persistProposals(
      userId,
      sessionId,
      parsed.proposedActs.filter((a) => enabledActs.includes(a.tool))
    );

    await this.saveAssistantTurn(
      sessionId,
      'assistant',
      parsed.reply,
      fillState
    );

    const statusHint: AssistantUiStatus =
      proposedActs.length > 0
        ? 'needs-you'
        : fillState.status === 'filling'
          ? 'result'
          : 'idle';

    return {
      reply: parsed.reply,
      proposedActs,
      sessionId,
      playbookId: playbook.id,
      playbookVersion: playbook.version,
      fillState,
      statusHint
    };
  }

  /** Voice: STT then same turn pipeline. Transcript never logged to analytics. */
  async voiceTurn(
    userId: string,
    sessionId: string,
    audioBase64: string,
    filename: string
  ): Promise<AssistantTurnResponse & { transcript: string }> {
    await this.requireUse(userId);
    await this.billing.assertCanStartTurn(userId);
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
    if (stt.status === 'fail_silent' && isVendorOutageReason(stt.reason)) {
      await this.billing.recordOpsAlert({
        source: 'openai',
        code: stt.reason.includes('billing') ? 'hard_limit' : 'vendor_429',
        detail: stt.reason,
        job: 'agent_voice'
      });
      throw vendorOutageException();
    }
    if (stt.status === 'ok') {
      await this.billing.debit(userId, stt.cost.estimatedUsd, 'agent_voice');
    }
    const transcript =
      stt.status === 'ok'
        ? String((stt.value as { text?: string })?.text ?? '')
        : '';
    if (!transcript.trim()) {
      return {
        reply: "I couldn't hear that clearly. Try again?",
        proposedActs: [],
        sessionId,
        transcript: '',
        statusHint: 'idle'
      };
    }
    const turn = await this.turn(userId, sessionId, transcript);
    return { ...turn, transcript };
  }

  async confirmAction(
    userId: string,
    proposalId: string,
    /** Optional edits from DraftPreview / EventPreview (draft body, sendAt, etc.). */
    argsPatch?: Record<string, unknown>
  ) {
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

    // THIS SECTION DOES: merge on-screen edits into the stored proposal args.
    const baseArgs = (proposal.args ?? {}) as Record<string, unknown>;
    const args =
      argsPatch && Object.keys(argsPatch).length > 0
        ? { ...baseArgs, ...argsPatch }
        : baseArgs;
    if (args !== baseArgs) {
      await this.supabase.admin
        .from('assistant_proposals')
        .update({ args: args as Json })
        .eq('id', proposalId);
    }

    const result = await this.executeAct(userId, tool, args);

    await this.supabase.admin
      .from('assistant_proposals')
      .update({
        status: 'confirmed',
        resolved_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    // Stamp playbook from the open session if present.
    let playbookId: string | null = null;
    let playbookVersion: string | null = null;
    if (proposal.session_id) {
      const { data: sess } = await this.supabase.admin
        .from('assistant_sessions')
        .select('fill_state')
        .eq('id', proposal.session_id)
        .maybeSingle();
      const fs = this.fillLoop.parse(sess?.fill_state);
      playbookId = fs.playbookId ?? null;
      playbookVersion = fs.playbookVersion ?? null;
    }

    const { data: log } = await this.supabase.admin
      .from('assistant_activity_log')
      .insert({
        user_id: userId,
        tool,
        summary: proposal.preview,
        undo_payload: (result.undoPayload ?? null) as Json,
        playbook_id: playbookId,
        playbook_version: playbookVersion
      })
      .select('id, tool, summary, created_at')
      .single();

    // THIS SECTION DOES: link a queued schedule row to the activity log for undo.
    const scheduledId =
      typeof result.undoPayload?.scheduledId === 'string'
        ? result.undoPayload.scheduledId
        : null;
    if (log?.id && scheduledId) {
      await this.supabase.admin
        .from('assistant_scheduled_messages')
        .update({ activity_id: log.id })
        .eq('id', scheduledId)
        .eq('user_id', userId);
    }

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
      .select(
        'id, tool, summary, created_at, undone_at, playbook_id, playbook_version'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []).map((r) => ({
      id: r.id,
      tool: r.tool,
      summary: r.summary,
      createdAt: r.created_at,
      undoneAt: r.undone_at,
      playbookId: r.playbook_id ?? null,
      playbookVersion: r.playbook_version ?? null
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

    const undo = data.undo_payload as {
      noteId?: string;
      scheduledId?: string;
    } | null;
    if (undo?.noteId) {
      try {
        await this.notes.remove(userId, undo.noteId);
      } catch {
        // already gone
      }
    }
    // THIS SECTION DOES: cancel a queued Bridge message before it fires.
    if (undo?.scheduledId) {
      await this.supabase.admin
        .from('assistant_scheduled_messages')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', undo.scheduledId)
        .eq('user_id', userId)
        .eq('status', 'queued');
    }
    await this.supabase.admin
      .from('assistant_activity_log')
      .update({ undone_at: new Date().toISOString() })
      .eq('id', activityId);
    return { ok: true };
  }

  private async persistFillState(
    sessionId: string,
    fillState: AssistantFillState
  ) {
    await this.supabase.admin
      .from('assistant_sessions')
      .update({ fill_state: fillState as unknown as Json })
      .eq('id', sessionId);
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
        intent === 'general' ||
        intent === 'friend_questions') &&
      opts.focusIds[0] &&
      (await this.gate.isToolEnabled('recall_friend'))
    ) {
      results.recall_friend = await this.context.recallFriend(
        userId,
        opts.focusIds[0]
      );
    }
    if (
      (intent === 'search_notes' ||
        intent === 'save_note' ||
        opts.queryTerms.length) &&
      (await this.gate.isToolEnabled('search_notes'))
    ) {
      const q = opts.queryTerms.join(' ') || opts.personQuery || '';
      if (q) results.search_notes = await this.context.searchNotes(userId, q);
    }
    if (
      (intent === 'upcoming' || intent === 'create_event') &&
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
  ): Promise<{
    undoPayload?: Record<string, unknown>;
    handoff?: Record<string, unknown>;
  }> {
    // Refuse bulk messaging: one person per confirm.
    const personIds = Array.isArray(args.personIds)
      ? args.personIds.filter((x): x is string => typeof x === 'string')
      : [];
    if (
      personIds.length > 1 ||
      (tool === 'draft_message' && personIds.length > 1)
    ) {
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

    if (
      tool === 'save_note' ||
      tool === 'set_reminder' ||
      tool === 'suggest_reconnect_nudge'
    ) {
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
            ? ((args.cadence as 'week' | 'biweek' | 'month') ?? 'biweek')
            : undefined
      });
      await this.supabase.admin.from('assistant_memory_chunks').insert({
        user_id: userId,
        kind: 'note',
        ref_id: note.id,
        text: `${note.kind}: ${note.body}`
      });
      return { undoPayload: { noteId: note.id } };
    }

    if (tool === 'draft_message' || tool === 'reply_message') {
      const personId = String(args.personId ?? '');
      const draft = String(args.draft ?? args.text ?? '');
      return {
        handoff: {
          type: tool === 'reply_message' ? 'reply_message' : 'draft_message',
          personId,
          draft
        }
      };
    }

    if (tool === 'schedule_message') {
      // Queue only after approve of full draft + exact send time (never auto-send).
      const personId = String(args.personId ?? '');
      const body = String(args.draft ?? args.text ?? '').trim();
      const sendAtRaw = String(args.sendAt ?? args.send_at ?? '').trim();
      if (!personId || !body) {
        throw new BadRequestException('person and draft are required');
      }
      if (!sendAtRaw) {
        throw new BadRequestException(
          'Exact send time is required before scheduling'
        );
      }
      const sendAt = new Date(sendAtRaw);
      if (Number.isNaN(sendAt.getTime())) {
        throw new BadRequestException('sendAt must be a valid time');
      }
      if (sendAt.getTime() <= Date.now()) {
        throw new BadRequestException('sendAt must be in the future');
      }
      const { data: row, error } = await this.supabase.admin
        .from('assistant_scheduled_messages')
        .insert({
          user_id: userId,
          person_id: personId,
          body,
          send_at: sendAt.toISOString(),
          status: 'queued'
        })
        .select('id, send_at')
        .single();
      if (error || !row) throw error ?? new BadRequestException('Could not queue');
      return {
        undoPayload: { scheduledId: row.id },
        handoff: {
          type: 'schedule_message',
          personId,
          draft: body,
          sendAt: row.send_at,
          queued: true
        }
      };
    }

    if (tool === 'draft_event') {
      // Handoff into Bridger create-event (one fixed template preview on client).
      return {
        handoff: {
          type: 'draft_event',
          prefill: args.prefill ?? args
        }
      };
    }

    if (tool === 'send_touch_grass') {
      // Real Touch Grass create after confirm (audience + when already previewed).
      const whoRaw = String(
        args.who ?? args.audience ?? args.circle ?? 'friends'
      ).toLowerCase();
      // Touch Grass never blasts acquaintances. Unknown / "everyone" becomes Friends.
      const who = whoRaw === 'close' ? 'close' : 'friends';
      const whenRaw = String(args.when ?? args.when_window ?? 'tonight').toLowerCase();
      const when = (
        whenRaw === 'now' || whenRaw === 'tonight' || whenRaw === 'weekend'
          ? whenRaw
          : 'tonight'
      ) as GrassWhen;
      const note =
        typeof args.note === 'string'
          ? args.note
          : typeof args.why === 'string'
            ? args.why
            : undefined;
      const signal = await this.touchGrass.create(userId, { who, when, note });
      return {
        undoPayload: { touchGrassId: signal.id },
        handoff: {
          type: 'send_touch_grass',
          signalId: signal.id,
          who,
          when,
          sent: true
        }
      };
    }

    if (tool === 'run_notification_triage') {
      return {
        handoff: {
          type: 'run_notification_triage',
          mode: String(args.mode ?? 'newest_first')
        }
      };
    }

    if (tool === 'take_quiz_voice') {
      return {
        handoff: {
          type: 'take_quiz_voice',
          quizSlug: String(args.quizSlug ?? args.quiz_slug ?? '')
        }
      };
    }

    if (tool === 'attach_photo') {
      return {
        handoff: {
          type: 'attach_photo',
          mediaId: String(args.mediaId ?? args.media_id ?? ''),
          target: String(args.target ?? 'event_cover')
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
    acts: Array<{
      tool: AssistantToolName;
      preview: string;
      args: Record<string, unknown>;
    }>
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

  private async saveAssistantTurn(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    fillState?: AssistantFillState
  ) {
    await this.supabase.admin.from('assistant_turns').insert({
      session_id: sessionId,
      role,
      content,
      playbook_id: fillState?.playbookId ?? null,
      playbook_version: fillState?.playbookVersion ?? null
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
    if (result.status === 'ok') {
      // THIS SECTION DOES: charge Billy time only after a successful model call.
      await this.billing.debit(userId, result.cost.estimatedUsd, job);
      if (typeof result.value === 'string') {
        try {
          return JSON.parse(result.value);
        } catch {
          return { reply: result.value, proposed_acts: [] };
        }
      }
      return result.value;
    }
    if (result.status === 'fail_silent' && isVendorOutageReason(result.reason)) {
      await this.billing.recordOpsAlert({
        source: 'anthropic',
        code: result.reason.includes('billing') ? 'hard_limit' : 'vendor_429',
        detail: result.reason,
        job
      });
      throw vendorOutageException();
    }
    if (result.status === 'disabled') {
      await this.billing.recordOpsAlert({
        source: 'ai_budget',
        code: 'job_budget',
        detail: `Job ${job} disabled (budget or kill switch).`,
        job
      });
      throw vendorOutageException();
    }
    if (job === 'agent_query') {
      return { intent: 'general', person_query: null, query_terms: [] };
    }
    return {
      reply:
        "I couldn't look that up right now. Try again in a moment, or check the notes on their profile.",
      proposed_acts: []
    };
  }
}

function isVendorOutageReason(reason: string): boolean {
  return (
    reason.startsWith('provider_failed:rate_limit') ||
    reason.startsWith('provider_failed:billing')
  );
}

function vendorOutageException() {
  return new HttpException(
    {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'billy_vendor_outage',
      message: 'Billy is temporarily unavailable. Try again later.'
    },
    HttpStatus.SERVICE_UNAVAILABLE
  );
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
  fillUpdate: {
    slots?: Record<string, unknown>;
    status?: AssistantFillState['status'];
    last_ask?: string | null;
  } | null;
} {
  let obj: Record<string, unknown> = {};
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { reply: raw, proposedActs: [], fillUpdate: null };
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
    .filter(
      (a): a is Record<string, unknown> => a != null && typeof a === 'object'
    )
    .map((a) => ({
      tool: a.tool as AssistantToolName,
      preview: String(a.preview ?? ''),
      args: (a.args && typeof a.args === 'object'
        ? a.args
        : {}) as Record<string, unknown>
    }))
    .filter((a) => a.tool && a.preview);

  let fillUpdate: {
    slots?: Record<string, unknown>;
    status?: AssistantFillState['status'];
    last_ask?: string | null;
  } | null = null;
  const fu = obj.fill_update;
  if (fu && typeof fu === 'object') {
    const f = fu as Record<string, unknown>;
    fillUpdate = {
      slots:
        f.slots && typeof f.slots === 'object'
          ? (f.slots as Record<string, unknown>)
          : undefined,
      status:
        f.status === 'idle' ||
        f.status === 'filling' ||
        f.status === 'awaiting_confirm' ||
        f.status === 'abandoned'
          ? f.status
          : undefined,
      last_ask: typeof f.last_ask === 'string' ? f.last_ask : null
    };
  }

  return { reply, proposedActs, fillUpdate };
}
