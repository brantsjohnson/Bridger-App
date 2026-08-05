// ============================================
// WHAT THIS FILE DOES (plain English):
// The Weekly Recap Podcast on the server. Everyone answers the same 5 questions
// by voice; this service serves the active week, stitches the answers into one
// playlist (grouped by question, tier-filtered so you only hear people who
// shared with your circle), takes recordings, and handles submitted questions.
//
// RETENTION (rolling 7 days, per person):
// - The podcast only includes clips recorded in the last 7 days.
// - You can re-record only once your own last recording is 7 days old.
// - Co-op members' clips are kept (expires_at null) and archived into their
//   Profile stories calendar; non-members' clips are purged after 7 days.
// PRIVACY: audio is returned as a short-lived signed URL, never a storage path.
// ============================================
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  RecapAnswer,
  RecapAudience,
  RecapPlaylist,
  RecapSummaryDTO,
  RecapWeek,
  SubmittedQuestion,
  Tier
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

const TIER_RANK: Record<Tier, number> = {
  close: 3,
  friend: 2,
  acquaintance: 1,
  none: 0
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class RecapService {
  private readonly mediaBucket: string;
  /** How long a signed audio link stays valid (seconds). */
  private readonly signedUrlTtl = 60 * 60;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService
  ) {
    this.mediaBucket =
      this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'media';
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

    return {
      id: data.id,
      weekOf: data.week_of,
      active: data.active,
      questions: (qs ?? []).map((q) => q.text)
    };
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
    const week = await this.activeWeek();
    if (!week) {
      return {
        week: { id: '', weekOf: '', questions: [] },
        voiceIds: [],
        minutes: 0,
        questionCount: 0,
        hasMineThisWeek: false,
        canRecordAfter: null
      };
    }

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

  // --- GET /recap/playlist : the one continuous listen ---

  async getPlaylist(userId: string): Promise<RecapPlaylist> {
    const week = await this.activeWeek();
    if (!week) {
      return { week: { id: '', weekOf: '', questions: [] }, clips: [], voiceIds: [] };
    }
    return this.buildPlaylist(userId, week);
  }

  /** Shared playlist builder: rolling window + tier filter + roundtable order. */
  private async buildPlaylist(
    userId: string,
    week: RecapWeek
  ): Promise<RecapPlaylist> {
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

    const { data: rows, error } = await this.supabase.admin
      .from('recap_answers')
      .select('*, media:media_id (storage_path)')
      .eq('week_id', week.id)
      .gte('created_at', cutoff)
      .order('question_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;

    const answers = rows ?? [];
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
    const isCoop = await this.isCoopMember(userId);
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

  private async isCoopMember(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.admin
      .from('coop_memberships')
      .select('active')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data?.active);
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
}
