// ============================================
// WHAT THIS FILE DOES (plain English):
// Loads the active matching_config row (weights + thresholds). Admin can
// flip versions for rollback without redeploying code.
// ============================================
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MATCHING_FEATURES,
  MATCHING_V1_WEIGHTS,
  type MatchingFeature
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import type { ActiveMatchingConfig } from './matching.types';

@Injectable()
export class MatchingConfigService {
  constructor(private readonly supabase: SupabaseService) {}

  async getActive(): Promise<ActiveMatchingConfig> {
    const { data, error } = await this.supabase.admin
      .from('matching_config')
      .select('*')
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      // Fail closed to seed defaults if migration not applied yet.
      return this.fallback();
    }
    return this.mapRow(data);
  }

  async listVersions() {
    const { data, error } = await this.supabase.admin
      .from('matching_config')
      .select('*')
      .order('version', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.mapRow(r));
  }

  async putActive(patch: Partial<ActiveMatchingConfig> & { notes?: string }) {
    const current = await this.getActive();
    const nextVersion = current.version + 1;
    const weights = patch.weights ?? current.weights;

    await this.supabase.admin
      .from('matching_config')
      .update({ active: false })
      .eq('active', true);

    const { data, error } = await this.supabase.admin
      .from('matching_config')
      .insert({
        version: nextVersion,
        active: true,
        weights: weights as never,
        suggest_threshold: patch.suggestThreshold ?? current.suggestThreshold,
        spotlight_threshold:
          patch.spotlightThreshold ?? current.spotlightThreshold,
        min_shared_signals: patch.minSharedSignals ?? current.minSharedSignals,
        confidence_floor: patch.confidenceFloor ?? current.confidenceFloor,
        reveal_extras_max: patch.revealExtrasMax ?? current.revealExtrasMax,
        refresh_cap: patch.refreshCap ?? current.refreshCap,
        exploration_epsilon:
          patch.explorationEpsilon ?? current.explorationEpsilon,
        exploration_epsilon_cold:
          patch.explorationEpsilonCold ?? current.explorationEpsilonCold,
        bridge_cooldown_days:
          patch.bridgeCooldownDays ?? current.bridgeCooldownDays,
        ann_candidate_cap: patch.annCandidateCap ?? current.annCandidateCap,
        exposure_cap_pct: patch.exposureCapPct ?? current.exposureCapPct,
        exposure_hard_cap: patch.exposureHardCap ?? current.exposureHardCap,
        v2_enabled: patch.v2Enabled ?? current.v2Enabled,
        holdout_pct: patch.holdoutPct ?? current.holdoutPct,
        notes: patch.notes ?? `config v${nextVersion}`
      })
      .select('*')
      .single();
    if (error) throw error;
    return this.mapRow(data);
  }

  async activateVersion(version: number) {
    const { data: row, error } = await this.supabase.admin
      .from('matching_config')
      .select('id')
      .eq('version', version)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new NotFoundException('Config version not found');

    await this.supabase.admin
      .from('matching_config')
      .update({ active: false })
      .eq('active', true);
    await this.supabase.admin
      .from('matching_config')
      .update({ active: true })
      .eq('version', version);
    return this.getActive();
  }

  private mapRow(data: Record<string, unknown>): ActiveMatchingConfig {
    const raw = (data.weights ?? {}) as Record<string, number>;
    const weights = { ...MATCHING_V1_WEIGHTS };
    for (const f of MATCHING_FEATURES) {
      if (typeof raw[f] === 'number') weights[f] = raw[f]!;
    }
    return {
      id: String(data.id),
      version: Number(data.version),
      weights,
      suggestThreshold: Number(data.suggest_threshold ?? 0.55),
      spotlightThreshold: Number(data.spotlight_threshold ?? 0.75),
      minSharedSignals: Number(data.min_shared_signals ?? 3),
      confidenceFloor: Number(data.confidence_floor ?? 0.4),
      revealExtrasMax: Number(data.reveal_extras_max ?? 3),
      refreshCap: Number(data.refresh_cap ?? 5),
      explorationEpsilon: Number(data.exploration_epsilon ?? 0.1),
      explorationEpsilonCold: Number(data.exploration_epsilon_cold ?? 0.15),
      bridgeCooldownDays: Number(data.bridge_cooldown_days ?? 14),
      annCandidateCap: Number(data.ann_candidate_cap ?? 500),
      exposureCapPct: Number(data.exposure_cap_pct ?? 0.1),
      exposureHardCap: Number(data.exposure_hard_cap ?? 50),
      v2Enabled: Boolean(data.v2_enabled),
      holdoutPct: Number(data.holdout_pct ?? 0)
    };
  }

  private fallback(): ActiveMatchingConfig {
    return {
      id: 'fallback',
      version: 1,
      weights: { ...MATCHING_V1_WEIGHTS },
      suggestThreshold: 0.55,
      spotlightThreshold: 0.75,
      minSharedSignals: 3,
      confidenceFloor: 0.4,
      revealExtrasMax: 3,
      refreshCap: 5,
      explorationEpsilon: 0.1,
      explorationEpsilonCold: 0.15,
      bridgeCooldownDays: 14,
      annCandidateCap: 500,
      exposureCapPct: 0.1,
      exposureHardCap: 50,
      v2Enabled: false,
      holdoutPct: 0
    };
  }
}
