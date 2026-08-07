// ============================================
// WHAT THIS FILE DOES (plain English):
// Optional pgvector pre-filter: keep at most ~500 FoF candidates closest to
// the viewer in embedding space before full scoring. No LLM.
// ============================================
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { FofCandidate } from './matching-eligibility.service';

@Injectable()
export class MatchingAnnService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Cap candidates by embedding similarity when the FoF set is large.
   * Falls back to the input list when embeddings are missing.
   */
  async prefilter(
    viewerId: string,
    candidates: FofCandidate[],
    cap: number
  ): Promise<FofCandidate[]> {
    if (candidates.length <= cap) return candidates;

    const { data: viewerEmb } = await this.supabase.admin
      .from('person_embeddings')
      .select('embedding')
      .eq('user_id', viewerId)
      .maybeSingle();
    if (!viewerEmb?.embedding) return candidates.slice(0, cap);

    const ids = candidates.map((c) => c.candidateId);
    const { data: embs } = await this.supabase.admin
      .from('person_embeddings')
      .select('user_id, embedding')
      .in('user_id', ids);

    const byId = new Map(
      (embs ?? []).map((e) => [e.user_id, toVec(e.embedding)])
    );
    const viewer = toVec(viewerEmb.embedding);
    if (!viewer.length) return candidates.slice(0, cap);

    const scored = candidates.map((c) => {
      const v = byId.get(c.candidateId);
      const sim = v ? cosine(viewer, v) : 0;
      return { c, sim };
    });
    scored.sort((a, b) => b.sim - a.sim);
    return scored.slice(0, cap).map((s) => s.c);
  }
}

function toVec(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw.map(Number);
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map(Number);
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
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
