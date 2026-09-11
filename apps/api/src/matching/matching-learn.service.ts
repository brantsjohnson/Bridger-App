// ============================================
// WHAT THIS FILE DOES (plain English):
// Reads matching_feedback (who became Close / Friends, who was skipped)
// and proposes new matching_config weights. Nest does this, not an Edge
// Function. Until there are enough Close labels, it only previews so
// Discover does not jump around on a handful of people.
// ============================================
import { Injectable, Logger } from '@nestjs/common';
import {
  MATCHING_SEED_KNOBS,
  normalizePairFeaturesSnapshot,
  type MatchingOutcome,
  type PairFeaturesSnapshot
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { MatchingConfigService } from './matching-config.service';
import {
  proposeMatchingWeights,
  shouldActivateLearnedWeights,
  type LearnRow,
  type ProposedWeights
} from './matching-learn.math';

@Injectable()
export class MatchingLearnService {
  private readonly log = new Logger(MatchingLearnService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: MatchingConfigService
  ) {}

  async preview(): Promise<ProposedWeights & { wouldActivate: boolean }> {
    const rows = await this.loadRows();
    const current = await this.config.getActive();
    const proposed = proposeMatchingWeights(
      rows,
      current.weights,
      MATCHING_SEED_KNOBS.v2DataFloor
    );
    return {
      ...proposed,
      wouldActivate: shouldActivateLearnedWeights(
        proposed,
        MATCHING_SEED_KNOBS.v2DataFloor
      )
    };
  }

  async runNightly(opts?: {
    apply?: boolean;
  }): Promise<{ proposed: ProposedWeights; applied: boolean; version?: number }> {
    const proposed = await this.preview();
    const apply =
      opts?.apply === true ||
      (opts?.apply !== false && proposed.wouldActivate);

    if (!apply) {
      this.log.log(
        `matching learn: preview only (labeled=${proposed.labeled} close=${proposed.closeCount})`
      );
      return { proposed, applied: false };
    }

    const next = await this.config.putActive({
      weights: proposed.weights,
      v2Enabled: true,
      notes: `learned from ${proposed.labeled} labels (${proposed.closeCount} Close, ${proposed.friendCount} Friends). shrink=${proposed.shrink.toFixed(2)}`
    });
    this.log.log(`matching learn: activated config v${next.version}`);
    return { proposed, applied: true, version: next.version };
  }

  private async loadRows(): Promise<LearnRow[]> {
    const { data, error } = await this.supabase.admin
      .from('matching_feedback')
      .select('outcome, weight, pair_features_snapshot')
      .is('superseded_at', null)
      .limit(20000);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      outcome: r.outcome as MatchingOutcome,
      weight: Number(r.weight) || 0,
      snapshot: normalizePairFeaturesSnapshot(
        r.pair_features_snapshot as PairFeaturesSnapshot
      )
    }));
  }
}
