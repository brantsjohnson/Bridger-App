// ============================================
// WHAT THIS FILE DOES (plain English):
// Writes labeled learning rows (matching_feedback) from domain outcomes.
// Never reads PostHog. Never stores message text or names.
// ============================================
import { Injectable } from '@nestjs/common';
import {
  MATCHING_LABEL_WEIGHTS,
  MATCHING_SEED_KNOBS,
  normalizePairFeaturesSnapshot,
  type MatchingOutcome,
  type MatchingSurface,
  type PairFeaturesSnapshot
} from '@bridger/shared';
import type { Json } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { MatchingConfigService } from './matching-config.service';
import { MatchingFeaturesService } from './matching-features.service';

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

@Injectable()
export class MatchingFeedbackService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly features: MatchingFeaturesService,
    private readonly config: MatchingConfigService
  ) {}

  async recordOutcome(opts: {
    userA: string;
    userB: string;
    outcome: MatchingOutcome;
    surface?: MatchingSurface;
    suggestionId?: string;
    snapshot?: PairFeaturesSnapshot;
  }) {
    const [opaque_a, opaque_b] = sortedPair(opts.userA, opts.userB);
    const snapshot = await this.hydrateSnapshot(opts);

    if (opts.outcome === 'blocked') {
      await this.supabase.admin
        .from('matching_feedback')
        .update({ superseded_at: new Date().toISOString() })
        .eq('opaque_a', opaque_a)
        .eq('opaque_b', opaque_b)
        .is('superseded_at', null);
    }

    const { error } = await this.supabase.admin.from('matching_feedback').insert({
      opaque_a,
      opaque_b,
      surface: opts.surface ?? null,
      suggestion_id: opts.suggestionId ?? null,
      pair_features_snapshot: snapshot as unknown as Json,
      outcome: opts.outcome,
      weight: MATCHING_LABEL_WEIGHTS[opts.outcome]
    });
    if (error) throw error;
  }

  /**
   * PRIVACY: snapshots are six numbers + quiz ids, never names or answers.
   * Prefer the Discover-time freeze. If they placed someone Close without a
   * card (already knew them), score the pair now so the label still teaches.
   */
  private async hydrateSnapshot(opts: {
    userA: string;
    userB: string;
    suggestionId?: string;
    snapshot?: PairFeaturesSnapshot;
  }): Promise<PairFeaturesSnapshot> {
    if (opts.snapshot) return normalizePairFeaturesSnapshot(opts.snapshot);

    if (opts.suggestionId) {
      const { data } = await this.supabase.admin
        .from('matching_suggestions')
        .select('feature_snapshot')
        .eq('id', opts.suggestionId)
        .maybeSingle();
      if (data?.feature_snapshot) {
        return normalizePairFeaturesSnapshot(
          data.feature_snapshot as PairFeaturesSnapshot
        );
      }
    }

    const { data: sug } = await this.supabase.admin
      .from('matching_suggestions')
      .select('feature_snapshot')
      .or(
        `and(viewer_id.eq.${opts.userA},candidate_id.eq.${opts.userB}),and(viewer_id.eq.${opts.userB},candidate_id.eq.${opts.userA})`
      )
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sug?.feature_snapshot) {
      return normalizePairFeaturesSnapshot(
        sug.feature_snapshot as PairFeaturesSnapshot
      );
    }

    try {
      const cfg = await this.config.getActive();
      const bundle = await this.features.computeOrganic(
        opts.userA,
        opts.userB,
        cfg
      );
      return normalizePairFeaturesSnapshot({
        features: bundle.features,
        contribs: bundle.features,
        score: 0,
        evidenceGatePassed: false,
        sharedQuizIds: bundle.details.quiz_alignment?.sharedQuizIds ?? [],
        sharedAttributeCount:
          bundle.details.shared_attributes?.sharedAttributeCount ?? 0,
        isExploration: false,
        configVersion: cfg.version
      });
    } catch {
      return normalizePairFeaturesSnapshot(null);
    }
  }

  async purgeOlderThanTtl() {
    const months = MATCHING_SEED_KNOBS.feedbackTtlMonths;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    await this.supabase.admin
      .from('matching_feedback')
      .delete()
      .lt('created_at', cutoff.toISOString());
  }

  async metrics() {
    const { data } = await this.supabase.admin
      .from('matching_feedback')
      .select('outcome, weight, created_at')
      .is('superseded_at', null)
      .order('created_at', { ascending: false })
      .limit(5000);

    const rows = data ?? [];
    const count = (o: string) => rows.filter((r) => r.outcome === o).length;
    const impressed = count('impressed');
    const added = count('added') + count('approved');
    const close = count('close');
    const dismissed = count('dismissed') + count('dont_suggest');
    const blocked = count('blocked');

    return {
      northStarAddToClose: added ? close / added : 0,
      suggestionToAdd: impressed ? added / impressed : 0,
      dismissRate: impressed ? dismissed / impressed : 0,
      blockRate: impressed ? blocked / impressed : 0,
      revealPlan: count('reveal_plan'),
      eventAttended: count('event_attended'),
      labeledPairs: rows.length,
      samples: rows.length
    };
  }
}
