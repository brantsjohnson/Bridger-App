// ============================================
// WHAT THIS FILE DOES (plain English):
// Saves a finished Discover "Connect Over" quiz (Your Funny Bone, Your Vibe,
// What Gets You Going, The Friend Zone). The phone already scored the answers
// on-device; this just stores the 0–1 dimension numbers + confidence, mirrors
// them into private matchable attributes, and queues embedding / summary jobs.
// PRIVACY: scores only — never answers or explain text.
// ============================================
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { DISCOVER_QUIZ_IDS, type DiscoverQuizId } from '@bridger/shared';
import { AiJobsService } from '../ai/ai-jobs.service';
import { SupabaseService } from '../supabase/supabase.service';

type CompleteBody = {
  dimensionScores?: Record<string, number>;
  confidence?: Record<string, number>;
  version?: number;
};

type QuizDimension = { key: string; label: string };

@Injectable()
export class DiscoverQuizService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly aiJobs: AiJobsService
  ) {}

  /**
   * Which Connect Over quizzes this person already finished.
   * PRIVACY: only returns internal slugs (humor, personality, …), never scores.
   */
  async listCompleted(userId: string): Promise<{ completed: string[] }> {
    // THIS SECTION DOES: look up the four Discover quiz ids in the registry.
    const { data: regs, error: regErr } = await this.supabase.admin
      .from('quiz_registry')
      .select('slug, quiz_id')
      .in('slug', [...DISCOVER_QUIZ_IDS]);
    if (regErr) throw regErr;

    const quizIdToSlug = new Map<string, string>();
    for (const r of regs ?? []) {
      if (r.quiz_id && typeof r.slug === 'string') {
        quizIdToSlug.set(r.quiz_id as string, r.slug);
      }
    }
    if (!quizIdToSlug.size) return { completed: [] };

    // THIS SECTION DOES: see which of those quizzes have a result for this user.
    const { data: results, error: resErr } = await this.supabase.admin
      .from('quiz_results')
      .select('quiz_id')
      .eq('user_id', userId)
      .in('quiz_id', [...quizIdToSlug.keys()]);
    if (resErr) throw resErr;

    const completed: string[] = [];
    for (const row of results ?? []) {
      const slug = quizIdToSlug.get(row.quiz_id as string);
      if (slug && !completed.includes(slug)) completed.push(slug);
    }
    return { completed };
  }

  async complete(userId: string, slug: string, body: CompleteBody) {
    // SECURITY: only the four Discover match quizzes may use this path.
    if (!isDiscoverQuizId(slug)) {
      throw new BadRequestException(`Unknown Discover quiz "${slug}"`);
    }

    const { data: reg, error: regErr } = await this.supabase.admin
      .from('quiz_registry')
      .select('slug, quiz_id, title')
      .eq('slug', slug)
      .maybeSingle();
    if (regErr) throw regErr;
    if (!reg?.quiz_id) {
      throw new NotFoundException(`Discover quiz "${slug}" is not seeded`);
    }

    const { data: design, error: dErr } = await this.supabase.admin
      .from('quizzes')
      .select('id, dimensions')
      .eq('id', reg.quiz_id)
      .single();
    if (dErr) throw dErr;

    const dimensions = (
      Array.isArray(design.dimensions) ? design.dimensions : []
    ) as QuizDimension[];
    const allowedKeys = new Set(
      dimensions.map((d) => d.key).filter((k) => typeof k === 'string')
    );

    // THIS SECTION DOES: keep only finite 0–1 scores for known dimensions.
    const rawScores = body?.dimensionScores ?? {};
    const rawConf = body?.confidence ?? {};
    const dimensionScores: Record<string, number> = {};
    const confidence: Record<string, number> = {};
    for (const [key, value] of Object.entries(rawScores)) {
      if (allowedKeys.size && !allowedKeys.has(key)) continue;
      if (!Number.isFinite(value)) continue;
      dimensionScores[key] = clamp01(Number(value));
      const c = Number(rawConf[key]);
      confidence[key] = Number.isFinite(c) ? clamp01(c) : 1;
    }
    if (!Object.keys(dimensionScores).length) {
      throw new BadRequestException('dimensionScores are required');
    }

    const completedAt = new Date().toISOString();
    const { error: uErr } = await this.supabase.admin.from('quiz_results').upsert(
      {
        user_id: userId,
        quiz_id: reg.quiz_id,
        dimension_scores: dimensionScores as never,
        confidence: confidence as never,
        completed_at: completedAt
      },
      { onConflict: 'user_id,quiz_id' }
    );
    if (uErr) throw uErr;

    // THIS SECTION DOES: mirror each dimension into Zone B (hidden, matchable).
    await this.syncMatchableAttributes(
      userId,
      slug,
      reg.quiz_id,
      dimensionScores,
      dimensions,
      confidence
    );

    // THIS SECTION DOES: rebuild embeddings + person summary from matchable facts
    // (write-time AI only — never on the matching hot path).
    void this.enqueueAiRefresh(userId);

    return { ok: true as const };
  }

  private async syncMatchableAttributes(
    userId: string,
    slug: string,
    quizId: string,
    dimensionScores: Record<string, number>,
    dimensions: QuizDimension[],
    confidence: Record<string, number>
  ) {
    const prefix = `quiz.${slug}.`;
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

  private async enqueueAiRefresh(userId: string) {
    try {
      const { data } = await this.supabase.admin
        .from('attributes')
        .select('key, value')
        .eq('owner_id', userId)
        .eq('matchable', true);
      const attrs = (data ?? []).map((r) => ({
        key: r.key as string,
        value: r.value
      }));
      const facts = attrs
        .map((a) => labelOf(a.key, a.value))
        .filter((s) => s.length > 0)
        .slice(0, 40);
      await this.aiJobs.enqueueEmbeddings({ userId, attributes: attrs });
      if (facts.length) {
        await this.aiJobs.enqueuePersonSummary({ userId, facts });
      }
    } catch {
      // AI refresh is best-effort; quiz result is already saved.
    }
  }
}

function isDiscoverQuizId(slug: string): slug is DiscoverQuizId {
  return (DISCOVER_QUIZ_IDS as readonly string[]).includes(slug);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function labelOf(key: string, value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (typeof v.label === 'string') return v.label;
    if (typeof v.title === 'string') return v.title;
  }
  if (typeof value === 'string') return value;
  return key;
}
