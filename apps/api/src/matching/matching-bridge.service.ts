// ============================================
// WHAT THIS FILE DOES (plain English):
// After two people finish the reveal, suggest one friend across the new bridge
// (prefer a reciprocal pair). Never runs during the reveal itself.
// ============================================
import { BadRequestException, Injectable } from '@nestjs/common';
import type { Json, MatchingSuggestionDto } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { MatchingConfigService } from './matching-config.service';
import { MatchingEligibilityService } from './matching-eligibility.service';
import { MatchingFeedbackService } from './matching-feedback.service';
import { MatchingScorerService } from './matching-scorer.service';

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
      throw new BadRequestException('Finish how-you-met before bridge suggestions');
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
}
