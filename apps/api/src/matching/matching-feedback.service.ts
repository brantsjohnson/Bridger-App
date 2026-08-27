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

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

@Injectable()
export class MatchingFeedbackService {
  constructor(private readonly supabase: SupabaseService) {}

  async recordOutcome(opts: {
    userA: string;
    userB: string;
    outcome: MatchingOutcome;
    surface?: MatchingSurface;
    suggestionId?: string;
    snapshot?: PairFeaturesSnapshot;
  }) {
    const [opaque_a, opaque_b] = sortedPair(opts.userA, opts.userB);
    let raw = opts.snapshot;

    // THIS SECTION DOES: pull the frozen snapshot from the suggestion row when
    // the caller only has a suggestion id (e.g. dismiss / later outcomes).
    if (!raw && opts.suggestionId) {
      const { data } = await this.supabase.admin
        .from('matching_suggestions')
        .select('feature_snapshot')
        .eq('id', opts.suggestionId)
        .maybeSingle();
      raw = (data?.feature_snapshot ?? undefined) as
        | PairFeaturesSnapshot
        | undefined;
    }

    // THIS SECTION DOES: always write all six feature values + contribs
    // (missing keys become 0). Empty placeholder covers block/remove hard negatives.
    const snapshot = normalizePairFeaturesSnapshot(raw);

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
