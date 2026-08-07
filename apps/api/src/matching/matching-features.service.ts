// ============================================
// WHAT THIS FILE DOES (plain English):
// Computes the six named matching features for one pair. Missing data → 0
// (zero-by-absence), never a disabled phase.
//
// B1: shared_attributes uses Everyone+matchable only (can be shown as evidence).
// quiz_alignment + embeddings may use silent none+matchable / Zone C; never as titles.
// ============================================
import { Injectable } from '@nestjs/common';
import { DISCOVER_QUIZ_IDS, type MatchingFeature } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { MatchingIdfService } from './matching-idf.service';
import type {
  ActiveMatchingConfig,
  FeatureBundle,
  FeatureDetail,
  ScoreContext
} from './matching.types';
import type { FofCandidate } from './matching-eligibility.service';

@Injectable()
export class MatchingFeaturesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly idf: MatchingIdfService
  ) {}

  async compute(
    viewerId: string,
    candidate: FofCandidate,
    cfg: ActiveMatchingConfig,
    ctx: ScoreContext
  ): Promise<FeatureBundle> {
    const details: Partial<Record<MatchingFeature, FeatureDetail>> = {};

    const quiz = await this.quizAlignment(viewerId, candidate.candidateId, cfg);
    details.quiz_alignment = quiz;

    const emb = await this.embeddingSimilarity(
      viewerId,
      candidate.candidateId
    );
    details.embedding_similarity = emb;

    const shared = await this.sharedAttributes(
      viewerId,
      candidate.candidateId
    );
    details.shared_attributes = shared;

    const notes = await this.moderatorNotesAffinity(
      viewerId,
      candidate.candidateId
    );
    details.moderator_notes_affinity = notes;

    const warmth = this.mutualWarmth(candidate);
    details.mutual_warmth = warmth;

    const context = await this.contextFit(viewerId, candidate, ctx);
    details.context_fit = context;

    const features = {
      quiz_alignment: quiz.value,
      embedding_similarity: emb.value,
      shared_attributes: shared.value,
      moderator_notes_affinity: notes.value,
      mutual_warmth: warmth.value,
      context_fit: context.value
    } satisfies Record<MatchingFeature, number>;

    return { features, details };
  }

  // --- quiz_alignment: intersection of completed matchable quizzes ---
  private async quizAlignment(
    a: string,
    b: string,
    cfg: ActiveMatchingConfig
  ): Promise<FeatureDetail> {
    const { data: regs } = await this.supabase.admin
      .from('quiz_registry')
      .select('slug, quiz_id')
      .in('slug', [...DISCOVER_QUIZ_IDS]);
    const byQuizId = new Map(
      (regs ?? [])
        .filter((r) => r.quiz_id)
        .map((r) => [r.quiz_id as string, r.slug as string])
    );
    if (!byQuizId.size) return { value: 0, sharedQuizIds: [] };

    const quizIds = [...byQuizId.keys()];
    const { data: results } = await this.supabase.admin
      .from('quiz_results')
      .select('user_id, quiz_id, dimension_scores, confidence')
      .in('user_id', [a, b])
      .in('quiz_id', quizIds);

    const aMap = new Map<string, { scores: Record<string, number>; conf: Record<string, number> }>();
    const bMap = new Map<string, { scores: Record<string, number>; conf: Record<string, number> }>();
    for (const r of results ?? []) {
      const entry = {
        scores: (r.dimension_scores ?? {}) as Record<string, number>,
        conf: (r.confidence ?? {}) as Record<string, number>
      };
      if (r.user_id === a) aMap.set(r.quiz_id, entry);
      if (r.user_id === b) bMap.set(r.quiz_id, entry);
    }

    const sharedQuizIds: string[] = [];
    const quizScores: number[] = [];
    for (const [quizId, slug] of byQuizId) {
      const ar = aMap.get(quizId);
      const br = bMap.get(quizId);
      if (!ar || !br) continue;
      sharedQuizIds.push(slug);
      const dims = new Set([
        ...Object.keys(ar.scores),
        ...Object.keys(br.scores)
      ]);
      let sum = 0;
      let n = 0;
      for (const d of dims) {
        const ca = Number(ar.conf[d] ?? 1);
        const cb = Number(br.conf[d] ?? 1);
        if (ca < cfg.confidenceFloor || cb < cfg.confidenceFloor) continue;
        const sa = Number(ar.scores[d] ?? 0);
        const sb = Number(br.scores[d] ?? 0);
        const sim = 1 - Math.min(1, Math.abs(sa - sb));
        const w = Math.min(ca, cb);
        sum += sim * w;
        n += w;
      }
      if (n > 0) quizScores.push(sum / n);
    }

    if (!quizScores.length) return { value: 0, sharedQuizIds };
    const value =
      quizScores.reduce((x, y) => x + y, 0) / quizScores.length;
    return { value: clamp01(value), sharedQuizIds };
  }

  private async embeddingSimilarity(
    a: string,
    b: string
  ): Promise<FeatureDetail> {
    const { data } = await this.supabase.admin
      .from('person_embeddings')
      .select('user_id, embedding')
      .in('user_id', [a, b]);
    const va = data?.find((r) => r.user_id === a)?.embedding;
    const vb = data?.find((r) => r.user_id === b)?.embedding;
    if (!va || !vb) return { value: 0 };
    const aa = toNumberVec(va);
    const bb = toNumberVec(vb);
    if (!aa.length || aa.length !== bb.length) return { value: 0 };
    return { value: clamp01(cosine(aa, bb)) };
  }

  /** Mode 1 evidence pool: acquaintance + matchable only. */
  private async sharedAttributes(
    a: string,
    b: string
  ): Promise<FeatureDetail> {
    const { data } = await this.supabase.admin
      .from('attributes')
      .select('owner_id, key, value')
      .in('owner_id', [a, b])
      .eq('matchable', true)
      .eq('visible_to_tier', 'acquaintance');

    const aKeys = new Map<string, string>();
    const bKeys = new Map<string, string>();
    for (const row of data ?? []) {
      const label = attrLabel(row.key, row.value);
      const fingerprint = `${row.key}::${label}`;
      if (row.owner_id === a) aKeys.set(fingerprint, label);
      else bKeys.set(fingerprint, label);
    }

    let weighted = 0;
    let maxW = 0;
    let count = 0;
    for (const [fp] of aKeys) {
      if (!bKeys.has(fp)) continue;
      count += 1;
      const key = fp.split('::')[0]!;
      const w = await this.idf.weightForKey(key);
      weighted += w;
      maxW += 1;
    }
    if (!count) return { value: 0, sharedAttributeCount: 0 };
    return {
      value: clamp01(weighted / Math.max(1, maxW)),
      sharedAttributeCount: count
    };
  }

  private async moderatorNotesAffinity(
    a: string,
    b: string
  ): Promise<FeatureDetail> {
    const { data } = await this.supabase.admin
      .from('module_moderator_notes')
      .select('user_id, notes')
      .in('user_id', [a, b]);
    const na = data?.find((r) => r.user_id === a)?.notes;
    const nb = data?.find((r) => r.user_id === b)?.notes;
    if (!na || !nb) return { value: 0 };
    // Cheap token Jaccard over stringified notes (never displayed).
    const ta = tokenize(JSON.stringify(na));
    const tb = tokenize(JSON.stringify(nb));
    if (!ta.size || !tb.size) return { value: 0 };
    let inter = 0;
    for (const t of ta) if (tb.has(t)) inter += 1;
    const union = ta.size + tb.size - inter;
    return { value: clamp01(inter / Math.max(1, union)) };
  }

  private mutualWarmth(candidate: FofCandidate): FeatureDetail {
    const tierScore =
      candidate.viaTier === 'close'
        ? 1
        : candidate.viaTier === 'friend'
          ? 0.7
          : 0.4;
    return {
      value: tierScore,
      viaFriendId: candidate.viaFriendId
    };
  }

  private async contextFit(
    _viewerId: string,
    _candidate: FofCandidate,
    ctx: ScoreContext
  ): Promise<FeatureDetail> {
    if (ctx.surface === 'discover') return { value: 0 };
    if (ctx.surface === 'bridge') {
      return { value: clamp01(ctx.reciprocalBonus ?? 0.5) };
    }
    // event: light bonus if candidate shares Everyone+matchable keys with event tags later
    return { value: clamp01(ctx.reciprocalBonus ?? 0.4) };
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function toNumberVec(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw.map(Number);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(Number);
    } catch {
      return [];
    }
  }
  return [];
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  // map cosine [-1,1] → [0,1]
  return (dot / (Math.sqrt(na) * Math.sqrt(nb)) + 1) / 2;
}

function attrLabel(key: string, value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (typeof v.label === 'string') return v.label;
    if (typeof v.title === 'string') return v.title;
    if (typeof v.text === 'string') return v.text;
  }
  if (typeof value === 'string') return value;
  return key;
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}
