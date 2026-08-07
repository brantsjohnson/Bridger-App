// ============================================
// WHAT THIS FILE DOES (plain English):
// Builds Discover suggestions for one person (on-demand or nightly): score FoF,
// apply exploration + exposure caps, store rows, freeze snapshots for learning.
// ============================================
import { Injectable } from '@nestjs/common';
import type { Json, MatchingSuggestionDto } from '@bridger/shared';
import { MATCHING_SEED_KNOBS } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { MatchingAnnService } from './matching-ann.service';
import { MatchingConfigService } from './matching-config.service';
import { MatchingEligibilityService } from './matching-eligibility.service';
import { MatchingFeedbackService } from './matching-feedback.service';
import { MatchingScorerService } from './matching-scorer.service';
import type { ScoreResult } from './matching.types';

type Ranked = ScoreResult & { candidateId: string };

@Injectable()
export class MatchingDiscoverService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: MatchingConfigService,
    private readonly eligibility: MatchingEligibilityService,
    private readonly ann: MatchingAnnService,
    private readonly scorer: MatchingScorerService,
    private readonly feedback: MatchingFeedbackService
  ) {}

  async listForViewer(viewerId: string): Promise<MatchingSuggestionDto[]> {
    const { data } = await this.supabase.admin
      .from('matching_suggestions')
      .select('*')
      .eq('viewer_id', viewerId)
      .eq('surface', 'discover')
      .is('dismissed_at', null)
      .order('score', { ascending: false })
      .limit(10);

    if (!data?.length) {
      await this.refreshForViewer(viewerId);
      const { data: again } = await this.supabase.admin
        .from('matching_suggestions')
        .select('*')
        .eq('viewer_id', viewerId)
        .eq('surface', 'discover')
        .is('dismissed_at', null)
        .order('score', { ascending: false })
        .limit(10);
      return (again ?? []).map(toDto);
    }
    return data.map(toDto);
  }

  async refreshForViewer(viewerId: string): Promise<MatchingSuggestionDto[]> {
    const cfg = await this.config.getActive();
    let candidates = await this.eligibility.listFofCandidates(viewerId);
    candidates = await this.ann.prefilter(
      viewerId,
      candidates,
      cfg.annCandidateCap
    );

    const ranked: Ranked[] = [];
    for (const c of candidates) {
      const scored = await this.scorer.scorePair(viewerId, c, cfg, {
        surface: 'discover'
      });
      if (!scored) continue;
      ranked.push({ ...scored, candidateId: c.candidateId });
    }
    ranked.sort((a, b) => b.score - a.score);

    const labeledApprox = await this.roughLabeledCount();
    const eps =
      labeledApprox < MATCHING_SEED_KNOBS.coldStartLabeledPairs
        ? cfg.explorationEpsilonCold
        : cfg.explorationEpsilon;

    const { picked, explorationIndexes } = this.scorer.applyExploration(
      ranked,
      eps,
      cfg.refreshCap
    );

    // Clear prior active discover suggestions for this viewer.
    await this.supabase.admin
      .from('matching_suggestions')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('viewer_id', viewerId)
      .eq('surface', 'discover')
      .is('dismissed_at', null);

    const expires = new Date();
    expires.setDate(expires.getDate() + 2);

    for (let i = 0; i < picked.length; i++) {
      const r = picked[i]!;
      const isExploration = explorationIndexes.has(i);
      const snapshot = { ...r.snapshot, isExploration };
      const { data: row, error } = await this.supabase.admin
        .from('matching_suggestions')
        .insert({
          viewer_id: viewerId,
          candidate_id: r.candidateId,
          surface: 'discover',
          via_friend_id: r.viaFriendId ?? null,
          score: r.score,
          breakdown: r.contribs as unknown as Json,
          evidence: r.evidence as unknown as Json,
          is_exploration: isExploration,
          is_spotlight: r.isSpotlight,
          feature_snapshot: snapshot as unknown as Json,
          expires_at: expires.toISOString()
        })
        .select('id')
        .single();
      if (error) throw error;

      await this.feedback.recordOutcome({
        userA: viewerId,
        userB: r.candidateId,
        outcome: 'impressed',
        surface: 'discover',
        suggestionId: row.id,
        snapshot
      });
    }

    return this.listForViewer(viewerId);
  }

  async dismiss(
    viewerId: string,
    candidateId: string,
    forever: boolean
  ): Promise<void> {
    const { data } = await this.supabase.admin
      .from('matching_suggestions')
      .select('id, feature_snapshot')
      .eq('viewer_id', viewerId)
      .eq('candidate_id', candidateId)
      .eq('surface', 'discover')
      .is('dismissed_at', null)
      .maybeSingle();

    if (data) {
      await this.supabase.admin
        .from('matching_suggestions')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', data.id);
    }

    await this.feedback.recordOutcome({
      userA: viewerId,
      userB: candidateId,
      outcome: forever ? 'dont_suggest' : 'dismissed',
      surface: 'discover',
      suggestionId: data?.id,
      snapshot: data?.feature_snapshot as never
    });

    if (forever) {
      await this.supabase.admin.from('suggestion_skips').upsert({
        blocker_id: viewerId,
        skipped_id: candidateId
      });
    }
  }

  /** Nightly batch helper — refresh a page of discoverable users. */
  async refreshBatch(limit = 50): Promise<number> {
    const { data } = await this.supabase.admin
      .from('user_settings')
      .select('user_id')
      .eq('discoverable', true)
      .limit(limit);
    let n = 0;
    for (const row of data ?? []) {
      try {
        await this.refreshForViewer(row.user_id);
        n += 1;
      } catch {
        // Fail soft per user so one bad graph doesn't stop the night.
      }
    }
    return n;
  }

  private async roughLabeledCount(): Promise<number> {
    const { count } = await this.supabase.admin
      .from('matching_feedback')
      .select('id', { count: 'exact', head: true })
      .neq('outcome', 'impressed');
    return count ?? 0;
  }
}

function toDto(row: {
  id: string;
  candidate_id: string;
  via_friend_id: string | null;
  evidence: unknown;
  score: number;
  is_spotlight: boolean;
  is_exploration: boolean;
}): MatchingSuggestionDto {
  const evidence = Array.isArray(row.evidence)
    ? (row.evidence as Array<{ title?: string }>)
    : [];
  const titles = evidence.map((e) => e.title).filter(Boolean) as string[];
  return {
    id: row.id,
    personId: row.candidate_id,
    viaFriendId: row.via_friend_id ?? undefined,
    sharedThread: titles[0] ?? 'You have friends in common',
    signals: titles.slice(0, 3),
    score: Number(row.score),
    isSpotlight: Boolean(row.is_spotlight),
    isExploration: Boolean(row.is_exploration),
    bothOptedIn: true
  };
}
