// ============================================
// WHAT THIS FILE DOES (plain English):
// After two people finish the reveal, suggest friends across the new bridge
// (prefer a reciprocal pair). Also powers reveal Screen 3 with up to 3 FoF
// cards. Never runs until beat 0 (how-you-met) is saved.
// ============================================
import { BadRequestException, Injectable } from '@nestjs/common';
import type { Json, MatchingSuggestionDto } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { MatchingConfigService } from './matching-config.service';
import { MatchingEligibilityService } from './matching-eligibility.service';
import { MatchingFeedbackService } from './matching-feedback.service';
import { MatchingScorerService } from './matching-scorer.service';

export type RevealBridgeSuggestion = {
  personId: string;
  viaFriendId?: string;
  sharedThread: string;
  signals: string[];
  score: number;
};

@Injectable()
export class MatchingBridgeService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: MatchingConfigService,
    private readonly eligibility: MatchingEligibilityService,
    private readonly scorer: MatchingScorerService,
    private readonly feedback: MatchingFeedbackService
  ) {}

  async suggestForConnection(
    requesterId: string,
    connectionId: string
  ): Promise<MatchingSuggestionDto | null> {
    const { data: conn } = await this.supabase.admin
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .eq('status', 'accepted')
      .maybeSingle();
    if (!conn) throw new BadRequestException('Connection not found');
    if (conn.user_a !== requesterId && conn.user_b !== requesterId) {
      throw new BadRequestException('Not your connection');
    }
    // Beat 0 must have set a tier (met_context present).
    if (!conn.met_context) {
      throw new BadRequestException(
        'Finish how-you-met before bridge suggestions'
      );
    }

    const cfg = await this.config.getActive();
    const other = conn.user_a === requesterId ? conn.user_b : conn.user_a;

    // Cooldown: any recent bridge suggestion for this connection.
    const since = new Date();
    since.setDate(since.getDate() - cfg.bridgeCooldownDays);
    const { data: recent } = await this.supabase.admin
      .from('matching_suggestions')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('surface', 'bridge')
      .gte('created_at', since.toISOString())
      .limit(1);
    if (recent?.length) return null;

    const forRequester = await this.eligibility.listFofCandidates(requesterId);
    // Prefer candidates who are friends of `other` (true bridge).
    const otherFriends = await this.eligibility.listConnectedIds(other);
    const bridgePool = forRequester.filter((c) =>
      otherFriends.has(c.candidateId)
    );
    const pool = bridgePool.length ? bridgePool : forRequester;

    let best: {
      candidateId: string;
      viaFriendId?: string;
      result: Awaited<ReturnType<MatchingScorerService['scorePair']>>;
    } | null = null;

    for (const c of pool) {
      if (c.candidateId === other) continue;
      const scored = await this.scorer.scorePair(requesterId, c, cfg, {
        surface: 'bridge',
        reciprocalBonus: bridgePool.some((x) => x.candidateId === c.candidateId)
          ? 0.85
          : 0.45
      });
      if (!scored) continue;
      if (!best || scored.score > best.result!.score) {
        best = {
          candidateId: c.candidateId,
          viaFriendId: c.viaFriendId,
          result: scored
        };
      }
    }
    if (!best?.result) return null;

    const r = best.result;
    const { data: row, error } = await this.supabase.admin
      .from('matching_suggestions')
      .insert({
        viewer_id: requesterId,
        candidate_id: best.candidateId,
        surface: 'bridge',
        connection_id: connectionId,
        via_friend_id: best.viaFriendId ?? null,
        score: r.score,
        breakdown: r.contribs as unknown as Json,
        evidence: r.evidence as unknown as Json,
        is_exploration: false,
        is_spotlight: r.isSpotlight,
        feature_snapshot: r.snapshot as unknown as Json
      })
      .select('id')
      .single();
    if (error) throw error;

    await this.feedback.recordOutcome({
      userA: requesterId,
      userB: best.candidateId,
      outcome: 'impressed',
      surface: 'bridge',
      suggestionId: row.id,
      snapshot: r.snapshot
    });

    return {
      id: row.id,
      personId: best.candidateId,
      viaFriendId: best.viaFriendId,
      sharedThread: r.evidence[0]?.title ?? 'You might click',
      signals: r.evidence.map((e) => e.title).slice(0, 3),
      score: r.score,
      isSpotlight: r.isSpotlight,
      isExploration: false,
      bothOptedIn: true
    };
  }

  /**
   * Reveal Screen 3: up to `limit` FoF who pass the threshold.
   * Prefer friends of the newly connected person (true bridge). Returns empty
   * suggestions (with discoverable:false) when the viewer has matching off.
   */
  async suggestManyForPerson(
    requesterId: string,
    personId: string,
    limit = 3
  ): Promise<{
    discoverable: boolean;
    suggestions: RevealBridgeSuggestion[];
  }> {
    const discoverable = await this.eligibility.isDiscoverable(requesterId);
    if (!discoverable) {
      return { discoverable: false, suggestions: [] };
    }

    const conn = await this.findAcceptedPair(requesterId, personId);
    if (!conn?.met_context) {
      return { discoverable, suggestions: [] };
    }

    const cfg = await this.config.getActive();
    const pool0 = await this.eligibility.listFofCandidates(requesterId);
    const otherFriends = await this.eligibility.listConnectedIds(personId);
    const bridgePool = pool0.filter((c) => otherFriends.has(c.candidateId));
    const pool = bridgePool.length ? bridgePool : pool0;

    const scored: Array<{
      candidateId: string;
      viaFriendId?: string;
      result: NonNullable<
        Awaited<ReturnType<MatchingScorerService['scorePair']>>
      >;
    }> = [];

    for (const c of pool) {
      if (c.candidateId === personId) continue;
      const result = await this.scorer.scorePair(requesterId, c, cfg, {
        surface: 'bridge',
        reciprocalBonus: bridgePool.some((x) => x.candidateId === c.candidateId)
          ? 0.85
          : 0.45
      });
      if (!result) continue;
      scored.push({
        candidateId: c.candidateId,
        viaFriendId: c.viaFriendId,
        result
      });
    }

    scored.sort((a, b) => b.result.score - a.result.score);
    const kept = scored.slice(0, Math.max(1, Math.min(3, limit)));

    const suggestions: RevealBridgeSuggestion[] = [];
    for (const item of kept) {
      const r = item.result;
      const { data: row, error } = await this.supabase.admin
        .from('matching_suggestions')
        .insert({
          viewer_id: requesterId,
          candidate_id: item.candidateId,
          surface: 'bridge',
          connection_id: conn.id,
          via_friend_id: item.viaFriendId ?? null,
          score: r.score,
          breakdown: r.contribs as unknown as Json,
          evidence: r.evidence as unknown as Json,
          is_exploration: false,
          is_spotlight: r.isSpotlight,
          feature_snapshot: r.snapshot as unknown as Json
        })
        .select('id')
        .single();
      if (error) throw error;

      await this.feedback.recordOutcome({
        userA: requesterId,
        userB: item.candidateId,
        outcome: 'impressed',
        surface: 'bridge',
        suggestionId: row.id,
        snapshot: r.snapshot
      });

      suggestions.push({
        personId: item.candidateId,
        viaFriendId: item.viaFriendId,
        sharedThread: r.evidence[0]?.title ?? 'You might click',
        signals: r.evidence.map((e) => e.title).slice(0, 3),
        score: r.score
      });
    }

    return { discoverable, suggestions };
  }

  private async findAcceptedPair(a: string, b: string) {
    const { data } = await this.supabase.admin
      .from('connections')
      .select('id, met_context, user_a, user_b')
      .eq('status', 'accepted')
      .or(`and(user_a.eq.${a},user_b.eq.${b}),and(user_a.eq.${b},user_b.eq.${a})`)
      .maybeSingle();
    return data;
  }
}
