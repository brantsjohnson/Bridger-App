// ============================================
// WHAT THIS FILE DOES (plain English):
// The quiz engine for signed-in users: fetch the live quiz (with weights
// stripped), save answers, run a simple moderator, and score completed quizzes
// with pure arithmetic. AI never sets the numbers.
// ============================================
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  LiveQuiz,
  QuizDimension,
  QuizOption,
  QuizQuestionPublic,
  QuizResult
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import {
  scoreFromWeights,
  topDimensionKey,
  topOptionLabel
} from './score';

type ModeratorFlag = 'selected_all' | 'contradiction' | 'low_info';

@Injectable()
export class QuizService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService
  ) {}

  // --- PRIVACY: strip rubric weights before anything leaves the server ---

  private toPublicQuestions(
    rows: Array<{
      id: string;
      prompt: string;
      type: string;
      options: unknown;
      allow_explain: boolean;
    }>
  ): QuizQuestionPublic[] {
    return rows.map((q) => {
      const options = (
        Array.isArray(q.options) ? q.options : []
      ) as unknown as QuizOption[];
      return {
        id: q.id,
        prompt: q.prompt,
        type: q.type === 'multi' ? 'multi' : 'single',
        // PRIVACY: never send weights to the client.
        options: options.map(({ id, label }) => ({ id, label })),
        allowExplain: q.allow_explain
      };
    });
  }

  private async resolveRegistryBySlug(slug: string) {
    const { data, error } = await this.supabase.admin
      .from('quiz_registry')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data?.quiz_id) {
      throw new NotFoundException(`Quiz "${slug}" not found`);
    }
    return data;
  }

  private async loadQuestions(quizId: string) {
    const { data, error } = await this.supabase.admin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId);
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Accepted friends for this user (both directions), minus anyone blocked
   * either way. Same visibility rules as the friends list.
   */
  private async friendIdsOf(userId: string): Promise<Set<string>> {
    const { data: rows, error } = await this.supabase.admin
      .from('connections')
      .select('user_a, user_b')
      .eq('status', 'accepted')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    if (error) throw error;

    const otherIds = (rows ?? []).map((r) =>
      r.user_a === userId ? r.user_b : r.user_a
    );

    const { data: blocks, error: bErr } = await this.supabase.admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    if (bErr) throw bErr;

    const blocked = new Set<string>();
    for (const b of blocks ?? []) {
      blocked.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id);
    }

    return new Set(otherIds.filter((id) => !blocked.has(id)));
  }

  /**
   * For comparable quizzes: bucket friends (not the viewer) by their top
   * dimension result on this quiz.
   */
  private async loadComparableResults(
    userId: string,
    quizId: string,
    dimensions: QuizDimension[]
  ): Promise<Array<{ id: string; label: string; friendIds: string[] }>> {
    const friends = await this.friendIdsOf(userId);

    const { data: others, error } = await this.supabase.admin
      .from('quiz_results')
      .select('user_id, dimension_scores')
      .eq('quiz_id', quizId)
      .neq('user_id', userId);
    if (error) throw error;

    const groups = new Map<
      string,
      { id: string; label: string; friendIds: string[] }
    >();

    for (const d of dimensions) {
      groups.set(d.key, { id: d.key, label: d.label, friendIds: [] });
    }

    for (const row of others ?? []) {
      if (!friends.has(row.user_id)) continue;
      const scores = (row.dimension_scores ?? {}) as Record<string, number>;
      const key = topDimensionKey(scores);
      if (!key) continue;
      if (!groups.has(key)) {
        groups.set(key, { id: key, label: key, friendIds: [] });
      }
      groups.get(key)!.friendIds.push(row.user_id);
    }

    return Array.from(groups.values());
  }

  /**
   * After a quiz is scored, mirror each dimension into Zone B attributes so
   * matching can read them. Hidden from every tier but matchable.
   */
  private async syncQuizMatchableAttributes(
    userId: string,
    slug: string,
    quizId: string,
    dimensionScores: Record<string, number>,
    dimensions: QuizDimension[],
    confidence: Record<string, number>
  ) {
    if (!dimensions.length) return;

    const prefix = `quiz.${slug}.`;

    // Re-takes replace the whole quiz slice so keys never pile up.
    const { error: delErr } = await this.supabase.admin
      .from('attributes')
      .delete()
      .eq('owner_id', userId)
      .like('key', `${prefix}%`);
    if (delErr) throw delErr;

    const labelByKey = new Map(dimensions.map((d) => [d.key, d.label]));
    const insertRows = Object.entries(dimensionScores).map(
      ([dimensionKey, score]) => ({
        owner_id: userId,
        key: `${prefix}${dimensionKey}`,
        value: {
          score,
          label: labelByKey.get(dimensionKey) ?? dimensionKey,
          quizId,
          confidence: confidence[dimensionKey] ?? 1
        },
        layer: 'profile' as const,
        visible_to_tier: 'none' as const,
        matchable: true
      })
    );

    if (!insertRows.length) return;

    const { error: insErr } = await this.supabase.admin
      .from('attributes')
      .insert(insertRows);
    if (insErr) throw insErr;
  }

  /** Shared payload builder for live quiz + archived take-by-slug routes. */
  private async assembleLiveQuiz(
    userId: string,
    reg: {
      slug: string;
      title: string;
      description: string | null;
      comparable: boolean;
      cover: unknown;
      quiz_id: string | null;
    },
    design: {
      id: string;
      version: number;
      dimensions: unknown;
    }
  ): Promise<LiveQuiz> {
    const questions = await this.loadQuestions(design.id);

    const { data: result, error: rErr } = await this.supabase.admin
      .from('quiz_results')
      .select('id, dimension_scores')
      .eq('quiz_id', design.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (rErr) throw rErr;

    const cover =
      reg.cover && typeof reg.cover === 'object'
        ? (reg.cover as LiveQuiz['cover'])
        : undefined;

    const payload: LiveQuiz = {
      slug: reg.slug,
      title: reg.title,
      description: reg.description ?? undefined,
      comparable: reg.comparable,
      quizId: design.id,
      version: design.version,
      cover,
      questions: this.toPublicQuestions(questions),
      resultId: result?.id ?? null
    };

    if (reg.comparable) {
      const dimensions =
        (design.dimensions as unknown as QuizDimension[]) ?? [];
      if (dimensions.length) {
        payload.results = await this.loadComparableResults(
          userId,
          design.id,
          dimensions
        );
      }
    }

    return payload;
  }

  // --- GET /quizzes/current ---

  async getCurrent(userId: string): Promise<LiveQuiz> {
    const { data: cfg, error: cfgError } = await this.supabase.admin
      .from('admin_config')
      .select('live_quiz_slug')
      .limit(1)
      .maybeSingle();
    if (cfgError) throw cfgError;

    const slug = cfg?.live_quiz_slug;
    if (!slug) {
      throw new NotFoundException('No live quiz is set');
    }

    const reg = await this.resolveRegistryBySlug(slug);

    const { data: design, error: dErr } = await this.supabase.admin
      .from('quizzes')
      .select('*')
      .eq('id', reg.quiz_id!)
      .single();
    if (dErr) throw dErr;

    return this.assembleLiveQuiz(userId, reg, design);
  }

  // --- GET /quizzes/:slug (generic take by registry slug) ---

  async getBySlug(userId: string, slug: string): Promise<LiveQuiz> {
    const reg = await this.resolveRegistryBySlug(slug);

    const { data: design, error: dErr } = await this.supabase.admin
      .from('quizzes')
      .select('*')
      .eq('id', reg.quiz_id!)
      .single();
    if (dErr) throw dErr;

    return this.assembleLiveQuiz(userId, reg, design);
  }

  // --- GET /quizzes/archived ---

  async listArchived(userId: string) {
    const { data: archived, error } = await this.supabase.admin
      .from('quiz_registry')
      .select('slug, title, friends_taken_count, quiz_id, comparable, live_week')
      .eq('status', 'archived')
      .order('live_week', { ascending: false, nullsFirst: false });
    if (error) throw error;

    const quizIds = (archived ?? [])
      .map((r) => r.quiz_id)
      .filter((id): id is string => !!id);

    // Which of these has the user already completed?
    let completed = new Set<string>();
    if (quizIds.length) {
      const { data: results, error: rErr } = await this.supabase.admin
        .from('quiz_results')
        .select('quiz_id')
        .eq('user_id', userId)
        .in('quiz_id', quizIds);
      if (rErr) throw rErr;
      completed = new Set((results ?? []).map((r) => r.quiz_id));
    }

    return (archived ?? [])
      .filter((r) => r.quiz_id && !completed.has(r.quiz_id))
      .map((r) => ({
        slug: r.slug,
        title: r.title,
        friendsTakenCount: r.friends_taken_count,
        comparable: r.comparable,
        liveWeek: r.live_week ?? undefined
      }));
  }

  // --- Heuristic moderator (used when Anthropic key is missing) ---

  private heuristicModerator(input: {
    optionCount: number;
    selectedCount: number;
    explainText?: string;
    dimensions: QuizDimension[];
  }): { confidence: Record<string, number>; flags: ModeratorFlag[]; adapted?: boolean } {
    const flags: ModeratorFlag[] = [];

    if (
      input.optionCount > 1 &&
      input.selectedCount >= input.optionCount
    ) {
      flags.push('selected_all');
    }
    if (input.selectedCount === 0) {
      flags.push('low_info');
    }
    // Short or empty explain when they somehow typed something tiny.
    if (
      input.explainText !== undefined &&
      input.explainText.trim().length > 0 &&
      input.explainText.trim().length < 3
    ) {
      flags.push('low_info');
    }

    // Confidence: single clean pick is high; select-all / empty is low.
    let base = 0.7;
    if (flags.includes('selected_all')) base = 0.25;
    else if (flags.includes('low_info')) base = 0.35;
    else if (input.selectedCount === 1) base = 0.85;

    const confidence: Record<string, number> = {};
    for (const d of input.dimensions) {
      confidence[d.key] = base;
    }
    if (!input.dimensions.length) {
      confidence.overall = base;
    }

    return { confidence, flags, adapted: false };
  }

  /**
   * Optional AI path. SECURITY: key stays server-side. If missing, we skip
   * and return heuristics. The LLM must never set dimension scores.
   */
  private async runModerator(input: {
    optionCount: number;
    selectedCount: number;
    explainText?: string;
    dimensions: QuizDimension[];
    moderatorInstructions?: string | null;
  }) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return this.heuristicModerator(input);
    }

    // Key is present but a full Claude call is out of scope for this scaffold.
    // Fall through to the same heuristics so scores stay deterministic and
    // the route stays available without depending on network AI.
    return this.heuristicModerator(input);
  }

  // --- POST /quizzes/:slug/responses ---

  async saveResponse(
    userId: string,
    slug: string,
    body: {
      questionId: string;
      selectedOptionIds: string[];
      explainText?: string;
    }
  ) {
    if (!body?.questionId || !Array.isArray(body.selectedOptionIds)) {
      throw new BadRequestException(
        'questionId and selectedOptionIds are required'
      );
    }

    const reg = await this.resolveRegistryBySlug(slug);
    const quizId = reg.quiz_id!;

    const { data: question, error: qErr } = await this.supabase.admin
      .from('quiz_questions')
      .select('*')
      .eq('id', body.questionId)
      .eq('quiz_id', quizId)
      .maybeSingle();
    if (qErr) throw qErr;
    if (!question) {
      throw new NotFoundException('Question not found on this quiz');
    }

    const options = (
      Array.isArray(question.options) ? question.options : []
    ) as unknown as QuizOption[];

    // Replace any prior answer for this question so re-picks stay clean.
    await this.supabase.admin
      .from('quiz_responses')
      .delete()
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .eq('question_id', body.questionId);

    const { error: insErr } = await this.supabase.admin
      .from('quiz_responses')
      .insert({
        quiz_id: quizId,
        user_id: userId,
        question_id: body.questionId,
        selected_option_ids: body.selectedOptionIds as never,
        explain_text: body.explainText ?? null
      });
    if (insErr) throw insErr;

    const { data: design } = await this.supabase.admin
      .from('quizzes')
      .select('dimensions, moderator_instructions')
      .eq('id', quizId)
      .single();

    const dimensions =
      (design?.dimensions as unknown as QuizDimension[]) ?? [];
    const mod = await this.runModerator({
      optionCount: options.length,
      selectedCount: body.selectedOptionIds.length,
      explainText: body.explainText,
      dimensions,
      moderatorInstructions: design?.moderator_instructions
    });

    // Next unanswered question (simple linear order).
    const allQuestions = await this.loadQuestions(quizId);
    const { data: answered } = await this.supabase.admin
      .from('quiz_responses')
      .select('question_id')
      .eq('user_id', userId)
      .eq('quiz_id', quizId);
    const answeredIds = new Set((answered ?? []).map((a) => a.question_id));
    const next = allQuestions.find((q) => !answeredIds.has(q.id));
    const nextQuestion = next
      ? this.toPublicQuestions([next])[0]
      : undefined;

    return {
      nextQuestion,
      confidence: mod.confidence,
      flags: mod.flags,
      adapted: mod.adapted ?? false
    };
  }

  // --- POST /quizzes/:slug/complete ---

  async complete(userId: string, slug: string): Promise<{
    result: QuizResult;
    whoGotWho?: Array<{ id: string; label: string; friendIds: string[] }>;
  }> {
    const reg = await this.resolveRegistryBySlug(slug);
    const quizId = reg.quiz_id!;

    const { data: design, error: dErr } = await this.supabase.admin
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
    if (dErr) throw dErr;

    const questions = await this.loadQuestions(quizId);
    const { data: responses, error: rErr } = await this.supabase.admin
      .from('quiz_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId);
    if (rErr) throw rErr;

    if (!responses?.length) {
      throw new BadRequestException('No responses to score');
    }

    // Collect weight maps for every selected option (DETERMINISTIC path).
    const selectedWeights: Record<string, number>[] = [];
    const selectedLabeled: Array<{
      label: string;
      weights: Record<string, number>;
    }> = [];

    for (const response of responses) {
      const question = questions.find((q) => q.id === response.question_id);
      if (!question) continue;
      const options = (
        Array.isArray(question.options) ? question.options : []
      ) as unknown as QuizOption[];
      const selectedIds = (
        Array.isArray(response.selected_option_ids)
          ? response.selected_option_ids
          : []
      ) as string[];

      for (const optId of selectedIds) {
        const opt = options.find((o) => o.id === optId);
        if (!opt) continue;
        const weights = opt.weights ?? {};
        selectedWeights.push(weights);
        selectedLabeled.push({ label: opt.label, weights });
      }
    }

    // INTEGRITY: scores come only from rubric weights, never from the LLM.
    const dimensionScores = scoreFromWeights(selectedWeights);
    const dimensions =
      (design.dimensions as unknown as QuizDimension[]) ?? [];

    // Fun quizzes with no dimensions: label = top weighted option.
    let resultLabel: string | undefined;
    if (!dimensions.length) {
      resultLabel = topOptionLabel(selectedLabeled);
    } else {
      const topKey = topDimensionKey(dimensionScores);
      const match = dimensions.find((d) => d.key === topKey);
      resultLabel = match?.label ?? topKey;
    }

    // Confidence at complete time: reuse heuristics on aggregate answer counts.
    const mod = this.heuristicModerator({
      optionCount: questions.reduce(
        (n, q) =>
          n +
          (
            (Array.isArray(q.options) ? q.options : []) as unknown as QuizOption[]
          ).length,
        0
      ),
      selectedCount: selectedWeights.length,
      dimensions
    });

    const completedAt = new Date().toISOString();

    // Upsert the one-result-per-user-per-quiz row.
    const { data: upserted, error: uErr } = await this.supabase.admin
      .from('quiz_results')
      .upsert(
        {
          user_id: userId,
          quiz_id: quizId,
          dimension_scores: dimensionScores as never,
          confidence: mod.confidence as never,
          completed_at: completedAt
        },
        { onConflict: 'user_id,quiz_id' }
      )
      .select('*')
      .single();
    if (uErr) throw uErr;

    await this.syncQuizMatchableAttributes(
      userId,
      slug,
      quizId,
      dimensionScores,
      dimensions,
      mod.confidence
    );

    const result: QuizResult = {
      quizId,
      userId,
      dimensionScores,
      confidence: mod.confidence,
      completedAt: upserted.completed_at,
      resultLabel,
      resultId: upserted.id
    };

    // Who-got-who for comparable quizzes: group others by top dimension key.
    let whoGotWho:
      | Array<{ id: string; label: string; friendIds: string[] }>
      | undefined;

    if (reg.comparable && dimensions.length) {
      whoGotWho = await this.loadComparableResults(
        userId,
        quizId,
        dimensions
      );
    }

    return { result, whoGotWho };
  }
}
