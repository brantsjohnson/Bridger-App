// ============================================
// WHAT THIS FILE DOES (plain English):
// All the write/read helpers the admin console needs: Home defaults, themed
// prompts, live quiz, quiz registry + design, weekly activity, co-op
// announcements + members, and delights. Uses the service-role Supabase client
// (bypasses RLS); AdminGuard is the human gate.
// ============================================
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import type {
  AdaptationPolicy,
  Cover,
  DelightScope,
  HomeDefaults,
  QuizDimension,
  QuizQuestion,
  ThemedPrompt
} from '@bridger/shared';
import { DEFAULT_HOME_LAYOUT } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

/** Turn a jsonb cover column into the shared Cover type (or skip if empty). */
function asCover(value: unknown): Cover | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const kind = (value as { kind?: string }).kind;
  if (
    kind === 'photo' ||
    kind === 'emoji' ||
    kind === 'text' ||
    kind === 'color' ||
    kind === 'sticker'
  ) {
    return value as Cover;
  }
  return undefined;
}

const DEFAULT_ADAPTATION: AdaptationPolicy = {
  mayReword: true,
  mayInsertClarifiers: true,
  maxInsertedQuestions: 2,
  mayReorder: false
};

@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  // --- Config helpers ---

  private async getOrCreateConfig() {
    const { data, error } = await this.supabase.admin
      .from('admin_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;

    const { data: created, error: createError } = await this.supabase.admin
      .from('admin_config')
      .insert({
        home_defaults: { layout: DEFAULT_HOME_LAYOUT } as never,
        themed_prompts: [
          { slug: 'ootd', label: 'OOTD', icon: '👕' },
          { slug: 'take-05', label: 'Take 0.5', icon: '🤳' },
          { slug: 'hot-take', label: 'Hot take', icon: '🌶️' }
        ] as never
      })
      .select('*')
      .single();
    if (createError) throw createError;
    return created;
  }

  async getHomeDefaults(): Promise<HomeDefaults> {
    const row = await this.getOrCreateConfig();
    const raw = row.home_defaults as { layout?: HomeDefaults['layout'] } | null;
    return { layout: raw?.layout ?? DEFAULT_HOME_LAYOUT };
  }

  async putHomeDefaults(homeDefaults: HomeDefaults) {
    const row = await this.getOrCreateConfig();
    const { error } = await this.supabase.admin
      .from('admin_config')
      .update({ home_defaults: homeDefaults as never })
      .eq('id', row.id);
    if (error) throw error;
    return homeDefaults;
  }

  async getThemedPrompts(): Promise<ThemedPrompt[]> {
    const row = await this.getOrCreateConfig();
    const prompts = row.themed_prompts;
    return Array.isArray(prompts) ? (prompts as unknown as ThemedPrompt[]) : [];
  }

  async putThemedPrompts(prompts: ThemedPrompt[]) {
    const row = await this.getOrCreateConfig();
    const { error } = await this.supabase.admin
      .from('admin_config')
      .update({ themed_prompts: prompts as never })
      .eq('id', row.id);
    if (error) throw error;
    return prompts;
  }

  async setLiveQuiz(slug: string, goLiveDate?: string) {
    const { data: entry, error: findError } = await this.supabase.admin
      .from('quiz_registry')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (findError) throw findError;
    if (!entry) throw new NotFoundException(`Quiz "${slug}" not found`);

    // Demote any currently live quiz to archived.
    await this.supabase.admin
      .from('quiz_registry')
      .update({ status: 'archived' })
      .eq('status', 'live');

    // Go live date is stored on live_week (YYYY-MM-DD). Defaults to today.
    const liveWeek =
      goLiveDate && /^\d{4}-\d{2}-\d{2}/.test(goLiveDate)
        ? goLiveDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const { error: liveError } = await this.supabase.admin
      .from('quiz_registry')
      .update({ status: 'live', live_week: liveWeek })
      .eq('slug', slug);
    if (liveError) throw liveError;

    const row = await this.getOrCreateConfig();
    const { error: cfgError } = await this.supabase.admin
      .from('admin_config')
      .update({ live_quiz_slug: slug })
      .eq('id', row.id);
    if (cfgError) throw cfgError;

    return { slug, liveWeek, goLiveDate: liveWeek };
  }

  // --- Quizzes ---

  async listQuizzes() {
    const { data, error } = await this.supabase.admin
      .from('quiz_registry')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      slug: r.slug,
      title: r.title,
      description: r.description ?? undefined,
      status: r.status,
      liveWeek: r.live_week ?? undefined,
      friendsTakenCount: r.friends_taken_count,
      webTakeable: r.web_takeable,
      comparable: r.comparable,
      quizId: r.quiz_id ?? undefined,
      cover: asCover(r.cover)
    }));
  }

  async createQuiz(slug: string, title: string) {
    if (!slug || !title) {
      throw new BadRequestException('slug and title are required');
    }
    const { data: design, error: designError } = await this.supabase.admin
      .from('quizzes')
      .insert({
        goal: '',
        dimensions: [],
        moderator_instructions: '',
        adaptation_policy: DEFAULT_ADAPTATION as never
      })
      .select('*')
      .single();
    if (designError) throw designError;

    // Starter question so the editor is never empty.
    await this.supabase.admin.from('quiz_questions').insert({
      quiz_id: design.id,
      prompt: 'First question (edit me)',
      type: 'single',
      options: [
        { id: 'a', label: 'Option A', weights: {} },
        { id: 'b', label: 'Option B', weights: {} }
      ] as never,
      allow_explain: false
    });

    const { data: reg, error: regError } = await this.supabase.admin
      .from('quiz_registry')
      .insert({
        slug,
        title,
        status: 'draft',
        quiz_id: design.id,
        web_takeable: true,
        comparable: false
      })
      .select('*')
      .single();
    if (regError) throw regError;

    return {
      slug: reg.slug,
      title: reg.title,
      description: reg.description ?? undefined,
      status: reg.status,
      quizId: reg.quiz_id ?? undefined,
      webTakeable: reg.web_takeable,
      comparable: reg.comparable,
      friendsTakenCount: reg.friends_taken_count,
      cover: asCover(reg.cover)
    };
  }

  async patchQuiz(
    slug: string,
    patch: {
      title?: string;
      description?: string | null;
      status?: 'live' | 'draft' | 'archived';
      comparable?: boolean;
      webTakeable?: boolean;
      cover?: Cover | null;
    }
  ) {
    const update: Record<string, unknown> = {};
    if (patch.title !== undefined) update.title = patch.title;
    if (patch.description !== undefined) update.description = patch.description;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.comparable !== undefined) update.comparable = patch.comparable;
    if (patch.webTakeable !== undefined) update.web_takeable = patch.webTakeable;
    if (patch.cover !== undefined) update.cover = patch.cover;

    const { data, error } = await this.supabase.admin
      .from('quiz_registry')
      .update(update as never)
      .eq('slug', slug)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException(`Quiz "${slug}" not found`);

    if (patch.status === 'live') {
      await this.setLiveQuiz(slug);
    }

    return {
      slug: data.slug,
      title: data.title,
      description: data.description ?? undefined,
      status: data.status,
      comparable: data.comparable,
      webTakeable: data.web_takeable,
      friendsTakenCount: data.friends_taken_count,
      quizId: data.quiz_id ?? undefined,
      cover: asCover(data.cover)
    };
  }

  async getQuizDesign(slug: string) {
    const { data: reg, error } = await this.supabase.admin
      .from('quiz_registry')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!reg?.quiz_id) throw new NotFoundException(`Quiz "${slug}" not found`);

    const { data: design, error: dErr } = await this.supabase.admin
      .from('quizzes')
      .select('*')
      .eq('id', reg.quiz_id)
      .single();
    if (dErr) throw dErr;

    const { data: questions, error: qErr } = await this.supabase.admin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', reg.quiz_id);
    if (qErr) throw qErr;

    return {
      slug: reg.slug,
      title: reg.title,
      quizId: design.id,
      version: design.version,
      goal: design.goal ?? '',
      dimensions: (design.dimensions as unknown as QuizDimension[]) ?? [],
      moderatorInstructions: design.moderator_instructions ?? '',
      adaptationPolicy:
        (design.adaptation_policy as unknown as AdaptationPolicy) ?? DEFAULT_ADAPTATION,
      questions: (questions ?? []).map((q) => ({
        id: q.id,
        prompt: q.prompt,
        type: q.type,
        options: (q.options as unknown as QuizQuestion['options']) ?? [],
        allowExplain: q.allow_explain
      }))
    };
  }

  async putQuizDesign(
    slug: string,
    body: {
      goal?: string;
      dimensions?: QuizDimension[];
      moderatorInstructions?: string;
      adaptationPolicy?: AdaptationPolicy;
      questions?: QuizQuestion[];
    }
  ) {
    const current = await this.getQuizDesign(slug);

    const { data: updated, error } = await this.supabase.admin
      .from('quizzes')
      .update({
        goal: body.goal ?? current.goal,
        dimensions: (body.dimensions ?? current.dimensions) as never,
        moderator_instructions:
          body.moderatorInstructions ?? current.moderatorInstructions,
        adaptation_policy: (body.adaptationPolicy ??
          current.adaptationPolicy) as never,
        version: current.version + 1
      })
      .eq('id', current.quizId)
      .select('*')
      .single();
    if (error) throw error;

    if (body.questions) {
      // Replace questions wholesale for a clean editor save.
      await this.supabase.admin
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', current.quizId);

      if (body.questions.length) {
        const { error: insErr } = await this.supabase.admin
          .from('quiz_questions')
          .insert(
            body.questions.map((q) => ({
              id: q.id || undefined,
              quiz_id: current.quizId,
              prompt: q.prompt,
              type: q.type,
              options: q.options as never,
              allow_explain: q.allowExplain
            }))
          );
        if (insErr) throw insErr;
      }
    }

    return this.getQuizDesign(slug);
  }

  // --- Weekly activities ---

  async listActivities() {
    const { data, error } = await this.supabase.admin
      .from('weekly_activities')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((a) => this.mapActivity(a));
  }

  /** Shared shape for admin activity rows. */
  private mapActivity(a: {
    id: string;
    title: string;
    prompt: string | null;
    active: boolean;
    starts_at: string | null;
    ends_at: string | null;
    closes_in?: string | null;
    emoji?: string | null;
    cover?: unknown;
  }) {
    return {
      id: a.id,
      title: a.title,
      prompt: a.prompt ?? '',
      active: a.active,
      startsAt: a.starts_at ?? undefined,
      endsAt: a.ends_at ?? undefined,
      closesIn: a.closes_in ?? undefined,
      emoji: a.emoji ?? undefined,
      cover: asCover(a.cover)
    };
  }

  async createActivity(body: {
    title: string;
    prompt: string;
    closesIn?: string;
    emoji?: string;
    cover?: Cover;
  }) {
    const { data, error } = await this.supabase.admin
      .from('weekly_activities')
      .insert({
        title: body.title,
        prompt: body.prompt,
        active: false,
        closes_in: body.closesIn ?? 'ends Sunday',
        emoji: body.emoji ?? null,
        cover: (body.cover ?? null) as never
      })
      .select('*')
      .single();
    if (error) throw error;
    return this.mapActivity(data);
  }

  async patchActivity(
    id: string,
    patch: {
      title?: string;
      prompt?: string;
      active?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      closesIn?: string | null;
      emoji?: string | null;
      cover?: Cover | null;
    }
  ) {
    // Only one activity may be active at a time.
    if (patch.active === true) {
      await this.supabase.admin
        .from('weekly_activities')
        .update({ active: false })
        .eq('active', true);
    }

    const update: Record<string, unknown> = {};
    if (patch.title !== undefined) update.title = patch.title;
    if (patch.prompt !== undefined) update.prompt = patch.prompt;
    if (patch.active !== undefined) update.active = patch.active;
    if (patch.startsAt !== undefined) update.starts_at = patch.startsAt;
    if (patch.endsAt !== undefined) update.ends_at = patch.endsAt;
    if (patch.closesIn !== undefined) update.closes_in = patch.closesIn;
    if (patch.emoji !== undefined) update.emoji = patch.emoji;
    if (patch.cover !== undefined) update.cover = patch.cover;

    const { data, error } = await this.supabase.admin
      .from('weekly_activities')
      .update(update as never)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Activity not found');
    return this.mapActivity(data);
  }

  // --- Co-op ---

  async listAnnouncements() {
    const { data, error } = await this.supabase.admin
      .from('coop_announcements')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data ?? []).map((a) => ({
      id: a.id,
      title: a.title ?? '',
      body: a.body,
      ctaLabel: a.cta_label ?? undefined,
      ctaUrl: a.cta_url ?? undefined,
      publishedAt: a.published_at ?? undefined
    }));
  }

  async createAnnouncement(body: {
    title: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
  }) {
    const { data, error } = await this.supabase.admin
      .from('coop_announcements')
      .insert({
        title: body.title,
        body: body.body,
        cta_label: body.ctaLabel ?? null,
        cta_url: body.ctaUrl ?? null,
        published_at: null
      })
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title ?? '',
      body: data.body,
      ctaLabel: data.cta_label ?? undefined,
      ctaUrl: data.cta_url ?? undefined,
      publishedAt: data.published_at ?? undefined
    };
  }

  async patchAnnouncement(
    id: string,
    patch: {
      title?: string;
      body?: string;
      ctaLabel?: string | null;
      ctaUrl?: string | null;
    }
  ) {
    const update: Record<string, unknown> = {};
    if (patch.title !== undefined) update.title = patch.title;
    if (patch.body !== undefined) update.body = patch.body;
    if (patch.ctaLabel !== undefined) update.cta_label = patch.ctaLabel;
    if (patch.ctaUrl !== undefined) update.cta_url = patch.ctaUrl;

    const { data, error } = await this.supabase.admin
      .from('coop_announcements')
      .update(update as never)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Announcement not found');
    return {
      id: data.id,
      title: data.title ?? '',
      body: data.body,
      ctaLabel: data.cta_label ?? undefined,
      ctaUrl: data.cta_url ?? undefined,
      publishedAt: data.published_at ?? undefined
    };
  }

  async publishAnnouncement(id: string) {
    const { data, error } = await this.supabase.admin
      .from('coop_announcements')
      .update({ published_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Announcement not found');
    return {
      id: data.id,
      title: data.title ?? '',
      body: data.body,
      ctaLabel: data.cta_label ?? undefined,
      ctaUrl: data.cta_url ?? undefined,
      publishedAt: data.published_at ?? undefined
    };
  }

  async listMembers() {
    const { data, error } = await this.supabase.admin
      .from('coop_memberships')
      .select(
        'user_id, active, since, dues_paid_through, cancel_at_period_end, cancelled_at'
      )
      .eq('active', true)
      .order('since', { ascending: false });
    if (error) throw error;
    const members = (data ?? []).map((m) => ({
      userId: m.user_id,
      since: m.since,
      duesPaidThrough: m.dues_paid_through ?? undefined,
      cancelAtPeriodEnd: !!m.cancel_at_period_end,
      cancelledAt: m.cancelled_at ?? undefined
    }));
    return { count: members.length, members };
  }

  // --- Delights ---

  async listDelights() {
    const { data, error } = await this.supabase.admin
      .from('delights')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((d) => ({
      id: d.id,
      slug: d.slug ?? d.id,
      name: d.name,
      enabled: d.enabled,
      scope: d.scope,
      schedule: (d.schedule as { from?: string; to?: string }) ?? {}
    }));
  }

  async createDelight(input: {
    slug: string;
    name: string;
    scope: DelightScope;
  }) {
    const { data, error } = await this.supabase.admin
      .from('delights')
      .insert({
        slug: input.slug,
        name: input.name,
        scope: input.scope,
        enabled: false,
        schedule: {}
      })
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      slug: data.slug ?? input.slug,
      name: data.name,
      enabled: data.enabled,
      scope: data.scope,
      schedule: {}
    };
  }

  async patchDelight(
    id: string,
    patch: {
      enabled?: boolean;
      scope?: DelightScope;
      schedule?: { from?: string; to?: string };
      name?: string;
    }
  ) {
    const update: Record<string, unknown> = {};
    if (patch.enabled !== undefined) update.enabled = patch.enabled;
    if (patch.scope !== undefined) update.scope = patch.scope;
    if (patch.schedule !== undefined) update.schedule = patch.schedule;
    if (patch.name !== undefined) update.name = patch.name;

    const { data, error } = await this.supabase.admin
      .from('delights')
      .update(update as never)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Delight not found');
    return {
      id: data.id,
      slug: data.slug ?? data.id,
      name: data.name,
      enabled: data.enabled,
      scope: data.scope,
      schedule: (data.schedule as { from?: string; to?: string }) ?? {}
    };
  }

  // --- Weekly recap (the podcast questions) ---

  /** All recap weeks, newest first, each with its 5 questions in order. */
  async listRecapWeeks() {
    const { data: weeks, error } = await this.supabase.admin
      .from('recap_weeks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const weekIds = (weeks ?? []).map((w) => w.id);
    const byWeek = new Map<string, { idx: number; text: string }[]>();
    if (weekIds.length) {
      const { data: qs, error: qErr } = await this.supabase.admin
        .from('recap_questions')
        .select('week_id, idx, text')
        .in('week_id', weekIds)
        .order('idx', { ascending: true });
      if (qErr) throw qErr;
      for (const q of qs ?? []) {
        const arr = byWeek.get(q.week_id) ?? [];
        arr.push({ idx: q.idx, text: q.text });
        byWeek.set(q.week_id, arr);
      }
    }

    return (weeks ?? []).map((w) => ({
      id: w.id,
      weekOf: w.week_of,
      active: w.active,
      questions: (byWeek.get(w.id) ?? []).map((q) => q.text)
    }));
  }

  /** Create a week with its 5 questions. Only one week is active at a time. */
  async createRecapWeek(body: { weekOf: string; questions: string[] }) {
    const questions = (body.questions ?? []).slice(0, 5);
    if (questions.length !== 5) {
      throw new BadRequestException('A recap week needs exactly 5 questions');
    }

    const { data: week, error } = await this.supabase.admin
      .from('recap_weeks')
      .insert({ week_of: body.weekOf, active: false })
      .select('*')
      .single();
    if (error) throw error;

    const rows = questions.map((text, idx) => ({
      week_id: week.id,
      idx,
      text,
      source: 'admin'
    }));
    const { error: qErr } = await this.supabase.admin
      .from('recap_questions')
      .insert(rows as never);
    if (qErr) throw qErr;

    return {
      id: week.id,
      weekOf: week.week_of,
      active: week.active,
      questions
    };
  }

  /** Update a week's questions and/or make it the live one. */
  async patchRecapWeek(
    id: string,
    patch: { weekOf?: string; questions?: string[]; active?: boolean }
  ) {
    if (patch.active === true) {
      // Only one live week at a time.
      await this.supabase.admin
        .from('recap_weeks')
        .update({ active: false })
        .eq('active', true);
    }

    const update: Record<string, unknown> = {};
    if (patch.weekOf !== undefined) update.week_of = patch.weekOf;
    if (patch.active !== undefined) update.active = patch.active;
    if (Object.keys(update).length) {
      const { error } = await this.supabase.admin
        .from('recap_weeks')
        .update(update as never)
        .eq('id', id);
      if (error) throw error;
    }

    // Replace the 5 questions wholesale when provided.
    if (patch.questions) {
      const questions = patch.questions.slice(0, 5);
      if (questions.length !== 5) {
        throw new BadRequestException('A recap week needs exactly 5 questions');
      }
      await this.supabase.admin
        .from('recap_questions')
        .delete()
        .eq('week_id', id);
      const rows = questions.map((text, idx) => ({
        week_id: id,
        idx,
        text,
        source: 'admin'
      }));
      const { error: qErr } = await this.supabase.admin
        .from('recap_questions')
        .insert(rows as never);
      if (qErr) throw qErr;
    }

    const { data: week, error: readErr } = await this.supabase.admin
      .from('recap_weeks')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!week) throw new NotFoundException('Recap week not found');

    const { data: qs } = await this.supabase.admin
      .from('recap_questions')
      .select('text')
      .eq('week_id', id)
      .order('idx', { ascending: true });

    return {
      id: week.id,
      weekOf: week.week_of,
      active: week.active,
      questions: (qs ?? []).map((q) => q.text)
    };
  }

  /** Friend-submitted questions (to pull into a week), most-voted first. */
  async listRecapSubmittedQuestions() {
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
}
