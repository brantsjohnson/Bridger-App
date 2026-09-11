// ============================================
// WHAT THIS FILE DOES (plain English):
// The Weekly Recap Podcast on the server. Everyone answers the same 5 questions
// by voice; this service serves the active week, stitches the answers into one
// playlist (grouped by question, tier-filtered so you only hear people who
// shared with your circle), takes recordings, and handles submitted questions.
//
// SELF-RUN (Monday UTC):
// - If admin already locked this Monday, that week stays.
// - If not, we lock rose / thorn / bud, then the two most-voted unused
//   suggestions, then short fill-ins (AI when the worker asks, canned bank
//   when a person opens Friend Pod so the tap never waits on a model).
//
// RETENTION (rolling 7 days, per person):
// - The podcast only includes clips recorded in the last 7 days.
// - You can re-record only once your own last recording is 7 days old.
// - Co-op members' clips are kept (expires_at null) and archived into their
//   Profile stories calendar; non-members' clips are purged after 7 days.
// - Co-op members can open an earlier locked week in the player. Free Lite
//   stays on this Monday only. Past-week lists hide weeks they cannot hear.
// - LAZY PURGE: each playlist fetch deletes recap_answers rows whose
//   expires_at is in the past (co-op null expires_at is never deleted).
// PRIVACY: audio is returned as a short-lived signed URL, never a storage path.
// AI: Job 10 (recap_podcast) is audio stitch only. Job 14 (recap_week_fill)
// writes leftover prompts from Bridger copy only, never a friend's typed text.
// ============================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  recapWeekFill,
  runJob,
  type AiConfigStore
} from '@bridger/ai';
import type {
  RecapAnswer,
  RecapAudience,
  RecapPlaylist,
  RecapQuestionSource,
  RecapSummaryDTO,
  RecapWeek,
  RecapWeekListItem,
  RecapWeekOrigin,
  RecapWeeksDTO,
  SubmittedQuestion,
  Tier
} from '@bridger/shared';
import { canViewTier, isBlocked, TIER_RANK } from '../common/visibility';
import { NestAiConfigStore } from '../ai/ai-config.store';
import { CoopService } from '../coop/coop.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ROSE_THORN_BUD,
  VOTED_SLOT_COUNT,
  canListenPastWeek,
  composeAutoWeek,
  isoWeekIndex,
  mondayUtc,
  needsRollover,
  pickTopVoted,
  weekOfLabel,
  type DraftRecapQuestion
} from './recap-week.math';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class RecapService {
  private readonly log = new Logger(RecapService.name);
  private readonly mediaBucket: string;
  /** How long a signed audio link stays valid (seconds). */
  private readonly signedUrlTtl = 60 * 60;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly coop: CoopService,
    private readonly aiConfig: NestAiConfigStore
  ) {
    this.mediaBucket =
      this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'media';
  }

  // --- The live week: lock one for this Monday if nobody in admin did ---

  /**
   * Make sure this Monday has a live week. Worker / admin may ask the model
   * for leftover prompts. Opening Friend Pod never waits on a model.
   */
  async ensureCurrentWeek(opts: { allowAi?: boolean } = {}): Promise<RecapWeek> {
    const monday = mondayUtc(new Date());
    const existing = await this.weekByStart(monday);
    if (existing && existing.questions.length > 0) {
      if (!existing.active) await this.activateWeek(existing.id, monday);
      return (await this.weekById(existing.id)) ?? existing;
    }

    const active = await this.activeWeek();
    if (active && !this.shouldReplace(active, monday)) {
      if (!active.weekStart) await this.stampWeekStart(active.id, monday);
      return (await this.weekById(active.id)) ?? active;
    }

    const built = await this.lockAutoWeek(monday, opts.allowAi === true);
    this.log.log(
      `recap week locked monday=${monday} origin=auto questions=${built.questions.length}`
    );
    return built;
  }

  // THIS SECTION DOES: admin "run now" uses the same Monday lock, with AI on.
  async rolloverNow(): Promise<RecapWeek> {
    return this.ensureCurrentWeek({ allowAi: true });
  }

  /** Make this week the only live one and give it this Monday. */
  async activateWeek(id: string, monday = mondayUtc(new Date())): Promise<void> {
    await this.supabase.admin
      .from('recap_weeks')
      .update({ week_start: null })
      .eq('week_start', monday)
      .neq('id', id);
    await this.supabase.admin
      .from('recap_weeks')
      .update({ active: false })
      .eq('active', true)
      .neq('id', id);
    const { error } = await this.supabase.admin
      .from('recap_weeks')
      .update({ active: true, week_start: monday })
      .eq('id', id);
    if (error) throw error;
  }

  // --- The active week (questions people record into) ---

  private async activeWeek(): Promise<RecapWeek | null> {
    const { data, error } = await this.supabase.admin
      .from('recap_weeks')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const { data: qs, error: qErr } = await this.supabase.admin
      .from('recap_questions')
      .select('*')
      .eq('week_id', data.id)
      .order('idx', { ascending: true });
    if (qErr) throw qErr;

    return this.toWeek(data, (qs ?? []).map((q) => q.text));
  }

  // THIS SECTION DOES: load a week by id or by its Monday.
  private async weekById(id: string): Promise<RecapWeek | null> {
    const { data, error } = await this.supabase.admin
      .from('recap_weeks')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return this.weekFromRow(data);
  }

  private async weekByStart(monday: string): Promise<RecapWeek | null> {
    const { data, error } = await this.supabase.admin
      .from('recap_weeks')
      .select('*')
      .eq('week_start', monday)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return this.weekFromRow(data);
  }

  private async weekFromRow(data: {
    id: string;
    week_of: string;
    active: boolean;
    week_start?: string | null;
    origin?: string | null;
  }): Promise<RecapWeek> {
    const { data: qs, error: qErr } = await this.supabase.admin
      .from('recap_questions')
      .select('*')
      .eq('week_id', data.id)
      .order('idx', { ascending: true });
    if (qErr) throw qErr;
    return this.toWeek(data, (qs ?? []).map((q) => q.text));
  }

  private toWeek(
    data: {
      id: string;
      week_of: string;
      active: boolean;
      week_start?: string | null;
      origin?: string | null;
    },
    questions: string[]
  ): RecapWeek {
    return {
      id: data.id,
      weekOf: data.week_of,
      active: data.active,
      weekStart: data.week_start ?? undefined,
      origin: (data.origin as RecapWeekOrigin | undefined) ?? undefined,
      questions
    };
  }

  // THIS SECTION DOES: keep a recent admin week; replace one from last Monday.
  private shouldReplace(week: RecapWeek, monday: string): boolean {
    if (week.weekStart) return needsRollover(week.weekStart, monday);
    return false;
  }

  private async stampWeekStart(id: string, monday: string): Promise<void> {
    await this.supabase.admin
      .from('recap_weeks')
      .update({ week_start: monday })
      .eq('id', id)
      .is('week_start', null);
  }

  // THIS SECTION DOES: build and save the Monday auto week.
  private async lockAutoWeek(monday: string, allowAi: boolean): Promise<RecapWeek> {
    const submitted = await this.unusedSubmitted();
    const weekIndex = isoWeekIndex(monday);
    const already = [
      ...ROSE_THORN_BUD,
      ...pickTopVoted(submitted, VOTED_SLOT_COUNT, [...ROSE_THORN_BUD]).map(
        (q) => q.text
      )
    ];
    const fillNeed = 5 - already.length;
    const aiFills =
      allowAi && fillNeed > 0 ? await this.askFillIns(already, fillNeed) : [];
    const drafts = composeAutoWeek({ submitted, aiFills, weekIndex });

    const created = await this.insertAutoWeek(monday, drafts);
    if (created) return created;

    const raced = await this.weekByStart(monday);
    if (raced) {
      if (!raced.active) await this.activateWeek(raced.id, monday);
      return (await this.weekById(raced.id)) ?? raced;
    }
    throw new BadRequestException('Could not lock this recap week');
  }

  // THIS SECTION DOES: ask the model for leftover prompts (Bridger copy only).
  private async askFillIns(already: string[], need: number): Promise<string[]> {
    if (need <= 0) return [];
    const subjectRef = 'opaque_recap_week';
    try {
    const result = await runJob(
      {
        job: 'recap_week_fill',
        subjectRef,
        payload: {
          subject_ref: subjectRef,
          user_prompt: recapWeekFill.buildUser({
            need,
            alreadyChosen: already
          })
        }
      },
      {
        configStore: this.aiConfig as AiConfigStore,
        secrets: {
          anthropicApiKey: this.config.get<string>('ANTHROPIC_API_KEY')
        }
      }
    );
    if (result.status !== 'ok' || result.value == null) return [];
    const questions = (result.value as { questions?: unknown }).questions;
    if (!Array.isArray(questions)) return [];
    return questions.filter((q): q is string => typeof q === 'string');
  } catch (err) {
    // Fail silent: canned bank still fills the leftover slots.
    this.log.warn(
      `recap fill-ins skipped: ${err instanceof Error ? err.message : 'unknown'}`
    );
    return [];
    }
  }

  private async insertAutoWeek(
    monday: string,
    drafts: DraftRecapQuestion[]
  ): Promise<RecapWeek | null> {
    const { data: week, error } = await this.supabase.admin
      .from('recap_weeks')
      .insert({
        week_of: weekOfLabel(monday),
        week_start: monday,
        active: false,
        origin: 'auto'
      })
      .select('*')
      .single();
    if (error) {
      // Another request already claimed this Monday.
      if (error.code === '23505') return null;
      throw error;
    }

    const rows = drafts.map((q, idx) => ({
      week_id: week.id,
      idx,
      text: q.text,
      source: q.source as RecapQuestionSource,
      author_id: q.authorId ?? null
    }));
    const { error: qErr } = await this.supabase.admin
      .from('recap_questions')
      .insert(rows as never);
    if (qErr) throw qErr;

    const usedIds = drafts
      .map((q) => q.submittedId)
      .filter((id): id is string => Boolean(id));
    if (usedIds.length) {
      const { error: usedErr } = await this.supabase.admin
        .from('recap_submitted_questions')
        .update({ used: true })
        .in('id', usedIds);
      if (usedErr) throw usedErr;
    }

    await this.activateWeek(week.id, monday);
    return (await this.weekById(week.id)) ?? this.toWeek(week, drafts.map((q) => q.text));
  }

  private async unusedSubmitted(): Promise<SubmittedQuestion[]> {
    const { data, error } = await this.supabase.admin
      .from('recap_submitted_questions')
      .select('*')
      .eq('used', false)
      .order('votes', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((q) => ({
      id: q.id,
      text: q.text,
      authorId: q.author_id,
      votes: q.votes,
      used: q.used
    }));
  }

  /** How the author has tiered a given viewer (null = no relationship). */
  private async tierMap(
    authorIds: string[],
    viewerId: string
  ): Promise<Map<string, Tier>> {
    const map = new Map<string, Tier>();
    if (authorIds.length === 0) return map;
    const { data, error } = await this.supabase.admin
      .from('tiers')
      .select('user_id, tier')
      .in('user_id', authorIds)
      .eq('other_id', viewerId);
    if (error) throw error;
    for (const t of data ?? []) map.set(t.user_id, t.tier as Tier);
    return map;
  }

  /** Turn a media row's storage path into a short-lived signed URL. */
  private async signAudio(storagePath: string): Promise<string> {
    const { data, error } = await this.supabase.admin.storage
      .from(this.mediaBucket)
      .createSignedUrl(storagePath, this.signedUrlTtl);
    if (error || !data) return '';
    return data.signedUrl;
  }

  // --- GET /recap/week : summary for the Friend Pod card ---

  async getWeek(userId: string): Promise<RecapSummaryDTO> {
    // Opening Friend Pod locks this Monday if admin did not (no model wait).
    const week = await this.ensureCurrentWeek({ allowAi: false });

    const playlist = await this.buildPlaylist(userId, week);
    const seconds = playlist.clips.reduce((n, c) => n + c.duration, 0);
    const lock = await this.recordLock(userId, week.id);

    return {
      week,
      voiceIds: playlist.voiceIds,
      minutes: Math.round(seconds / 60),
      questionCount: week.questions.length,
      hasMineThisWeek: lock.hasActive,
      canRecordAfter: lock.canRecordAfter
    };
  }

  // --- GET /recap/weeks : this week, plus older ones for co-op members ---

  async listWeeks(userId: string): Promise<RecapWeeksDTO> {
    const current = await this.ensureCurrentWeek({ allowAi: false });
    const isCoop = await this.coop.isActiveMember(userId);
    const currentItem: RecapWeekListItem = {
      id: current.id,
      weekOf: current.weekOf,
      weekStart: current.weekStart,
      isCurrent: true
    };
    if (!isCoop) {
      return { canBrowsePast: false, weeks: [currentItem] };
    }

    const { data: rows, error } = await this.supabase.admin
      .from('recap_weeks')
      .select('id, week_of, week_start, active, created_at')
      .order('week_start', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(52);
    if (error) throw error;

    const all = rows ?? [];
    const pastIds = all.map((w) => w.id).filter((id) => id !== current.id);
    const audible = pastIds.length
      ? await this.audibleWeekIds(userId, pastIds)
      : new Set<string>();

    const weeks: RecapWeekListItem[] = [currentItem];
    for (const w of all) {
      if (w.id === current.id) continue;
      if (!audible.has(w.id)) continue;
      weeks.push({
        id: w.id,
        weekOf: w.week_of,
        weekStart: w.week_start ?? undefined,
        isCurrent: false
      });
    }
    return { canBrowsePast: true, weeks };
  }

  // --- GET /recap/playlist : the one continuous listen ---

  async getPlaylist(userId: string, weekId?: string): Promise<RecapPlaylist> {
    // Drop expired free clips before building the listen (lazy purge job).
    await this.purgeExpired();
    const current = await this.ensureCurrentWeek({ allowAi: false });
    const isCoop = await this.coop.isActiveMember(userId);
    let week = current;
    if (weekId && weekId !== current.id) {
      if (!canListenPastWeek(isCoop, false)) {
        throw new ForbiddenException('Earlier weeks are a co-op perk');
      }
      const found = await this.weekById(weekId);
      if (!found) throw new NotFoundException('Recap week not found');
      week = found;
    }
    const isCurrent = week.id === current.id;
    if (!isCurrent) {
      const audible = await this.audibleWeekIds(userId, [week.id]);
      if (!audible.has(week.id)) {
        throw new NotFoundException('Recap week not found');
      }
    }
    const playlist = await this.buildPlaylist(userId, week, {
      rollingWindow: isCurrent
    });
    return { ...playlist, isCurrent, canBrowsePast: isCoop };
  }

  /**
   * Delete recap answers whose expires_at has passed. Co-op members keep
   * expires_at null, so their clips are never removed here.
   */
  private async purgeExpired(): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await this.supabase.admin
      .from('recap_answers')
      .delete()
      .not('expires_at', 'is', null)
      .lt('expires_at', now);
    if (error) throw error;
  }

  /** Week ids this listener can actually hear (tier + not expired). */
  private async audibleWeekIds(
    userId: string,
    weekIds: string[]
  ): Promise<Set<string>> {
    const now = new Date().toISOString();
    const { data: rows, error } = await this.supabase.admin
      .from('recap_answers')
      .select('week_id, author_id, visible_to_tier, expires_at')
      .in('week_id', weekIds);
    if (error) throw error;
    const answers = (rows ?? []).filter(
      (a) => !a.expires_at || a.expires_at > now
    );
    const authorIds = Array.from(new Set(answers.map((a) => a.author_id)));
    const tiers = await this.tierMap(authorIds, userId);
    const audible = new Set<string>();
    for (const a of answers) {
      if (a.author_id === userId) {
        audible.add(a.week_id);
        continue;
      }
      const myTier = tiers.get(a.author_id);
      if (!myTier) continue;
      if (TIER_RANK[myTier] >= TIER_RANK[a.visible_to_tier as Tier]) {
        audible.add(a.week_id);
      }
    }
    return audible;
  }

  /** Shared playlist builder: rolling window + tier filter + roundtable order. */
  private async buildPlaylist(
    userId: string,
    week: RecapWeek,
    opts: { rollingWindow?: boolean } = {}
  ): Promise<RecapPlaylist> {
    const rolling = opts.rollingWindow !== false;
    let query = this.supabase.admin
      .from('recap_answers')
      .select('*, media:media_id (storage_path)')
      .eq('week_id', week.id)
      .order('question_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (rolling) {
      const cutoff = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
      query = query.gte('created_at', cutoff);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const now = new Date().toISOString();
    const answers = (rows ?? []).filter(
      (a) => !a.expires_at || a.expires_at > now
    );
    const authorIds = Array.from(new Set(answers.map((a) => a.author_id)));
    const tiers = await this.tierMap(authorIds, userId);

    // Keep only clips shared with a tier this listener belongs to (or my own).
    const visible = answers.filter((a) => {
      if (a.author_id === userId) return true;
      const myTier = tiers.get(a.author_id);
      if (!myTier) return false;
      return TIER_RANK[myTier] >= TIER_RANK[a.visible_to_tier as Tier];
    });

    const clips: RecapAnswer[] = [];
    for (const a of visible) {
      const storagePath = (a as { media?: { storage_path?: string } }).media
        ?.storage_path;
      clips.push({
        id: a.id,
        weekId: a.week_id,
        authorId: a.author_id,
        questionIndex: a.question_index,
        audioUrl: storagePath ? await this.signAudio(storagePath) : '',
        duration: a.duration_seconds,
        visibleToTier: a.visible_to_tier as RecapAudience,
        createdAt: a.created_at,
        expiresAt: a.expires_at ?? undefined
      });
    }

    const voiceIds = Array.from(new Set(clips.map((c) => c.authorId)));
    return { week, clips, voiceIds };
  }

  // --- POST /recap/answers : record your 5 (with a re-record lock) ---

  async postAnswers(
    userId: string,
    body: {
      audience: RecapAudience;
      answers: Array<{ questionIndex: number; mediaId: string; duration?: number }>;
    }
  ): Promise<{ posted: number }> {
    const week = await this.activeWeek();
    if (!week) throw new BadRequestException('No active recap week');
    if (!body?.answers?.length) {
      throw new BadRequestException('No answers to post');
    }

    // Re-record lock: you cannot post again until your last set is 7 days old.
    const lock = await this.recordLock(userId, week.id);
    if (lock.hasActive) {
      throw new BadRequestException(
        `You can record again after ${lock.canRecordAfter}`
      );
    }

    const audience: RecapAudience = body.audience ?? 'friend';
    const isCoop = await this.coop.isActiveMember(userId);
    // Non-members' clips expire in 7 days; members keep theirs (archived).
    const expiresAt = isCoop
      ? null
      : new Date(Date.now() + SEVEN_DAYS_MS).toISOString();

    const rows = body.answers.map((a) => ({
      week_id: week.id,
      author_id: userId,
      question_index: a.questionIndex,
      media_id: a.mediaId,
      duration_seconds: Math.min(60, Math.max(0, Math.round(a.duration ?? 0))),
      visible_to_tier: audience as Tier,
      expires_at: expiresAt
    }));

    const { error } = await this.supabase.admin
      .from('recap_answers')
      .upsert(rows as never, { onConflict: 'week_id,author_id,question_index' });
    if (error) throw error;

    // Co-op members: archive each clip into their Profile stories calendar so
    // they can relisten after the rolling week ends.
    if (isCoop) {
      await this.archiveToStories(userId, audience, body.answers);
    }

    return { posted: rows.length };
  }

  /** Whether the user still has an active recording + when they can redo it. */
  private async recordLock(
    userId: string,
    weekId: string
  ): Promise<{ hasActive: boolean; canRecordAfter: string | null }> {
    const { data, error } = await this.supabase.admin
      .from('recap_answers')
      .select('created_at')
      .eq('author_id', userId)
      .eq('week_id', weekId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { hasActive: false, canRecordAfter: null };

    const unlockAt = new Date(
      new Date(data.created_at).getTime() + SEVEN_DAYS_MS
    );
    const hasActive = unlockAt.getTime() > Date.now();
    return {
      hasActive,
      canRecordAfter: hasActive ? unlockAt.toISOString() : null
    };
  }

  /** Drop a kept audio story so co-op members can relisten from Profile. */
  private async archiveToStories(
    userId: string,
    audience: RecapAudience,
    answers: Array<{ mediaId: string }>
  ): Promise<void> {
    const rows = answers.map((a) => ({
      author_id: userId,
      type: 'audio' as const,
      media_id: a.mediaId,
      theme_slug: 'recap',
      visible_to_tier: audience as Tier
    }));
    const { error } = await this.supabase.admin
      .from('stories')
      .insert(rows as never);
    if (error) throw error;
  }

  // --- Submitted questions (suggest + upvote) ---

  async listSubmittedQuestions(): Promise<SubmittedQuestion[]> {
    const { data, error } = await this.supabase.admin
      .from('recap_submitted_questions')
      .select('*')
      .eq('used', false)
      .order('votes', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((q) => ({
      id: q.id,
      text: q.text,
      authorId: q.author_id,
      votes: q.votes,
      used: q.used
    }));
  }

  async submitQuestion(
    userId: string,
    text: string
  ): Promise<SubmittedQuestion> {
    const clean = (text ?? '').trim();
    if (!clean) throw new BadRequestException('Question text is required');
    const { data, error } = await this.supabase.admin
      .from('recap_submitted_questions')
      .insert({ author_id: userId, text: clean })
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      text: data.text,
      authorId: data.author_id,
      votes: data.votes,
      used: data.used
    };
  }

  async voteQuestion(userId: string, questionId: string): Promise<void> {
    const { data: q, error: qErr } = await this.supabase.admin
      .from('recap_submitted_questions')
      .select('id, votes')
      .eq('id', questionId)
      .maybeSingle();
    if (qErr) throw qErr;
    if (!q) throw new NotFoundException('Question not found');

    // One vote per person. If the row already exists, do nothing.
    const { error: voteErr, count } = await this.supabase.admin
      .from('recap_question_votes')
      .upsert(
        { question_id: questionId, user_id: userId },
        { onConflict: 'question_id,user_id', ignoreDuplicates: true, count: 'exact' }
      );
    if (voteErr) throw voteErr;

    // Only bump the tally when this was a new vote.
    if (count && count > 0) {
      const { error: bumpErr } = await this.supabase.admin
        .from('recap_submitted_questions')
        .update({ votes: q.votes + 1 })
        .eq('id', questionId);
      if (bumpErr) throw bumpErr;
    }
  }

  // --- POST /recap/answers/:id/reactions : sticker/emoji on someone's clip ---

  async reactToAnswer(
    userId: string,
    answerId: string,
    emoji: string
  ): Promise<{ ok: true }> {
    const clean = (emoji ?? '').trim();
    if (!clean) throw new BadRequestException('Emoji is required');

    const { data: answer, error } = await this.supabase.admin
      .from('recap_answers')
      .select('id, author_id, visible_to_tier')
      .eq('id', answerId)
      .maybeSingle();
    if (error) throw error;
    if (!answer) throw new NotFoundException('Answer not found');

    // Never notify yourself; blocks are silent (no notification either way).
    if (answer.author_id === userId) return { ok: true };
    if (await isBlocked(this.supabase, userId, answer.author_id)) {
      return { ok: true };
    }

    // Listener must belong to a circle the clip was shared with.
    const allowed = await canViewTier(
      this.supabase,
      answer.author_id,
      userId,
      answer.visible_to_tier as Tier
    );
    if (!allowed) throw new NotFoundException('Answer not found');

    const { error: nErr } = await this.supabase.admin.from('notifications').insert({
      user_id: answer.author_id,
      kind: 'recap_reaction',
      payload: { from: userId, answer_id: answerId, emoji: clean } as never
    });
    if (nErr) throw nErr;

    return { ok: true };
  }
}
