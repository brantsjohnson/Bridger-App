// ============================================
// WHAT THIS FILE DOES (plain English):
// Scores friends-of-invitees for an event so guests see "{N} to meet" and
// hosts get guest suggestions. Replaces the empty meet-suggestions stub.
// ============================================
import { Injectable, NotFoundException } from '@nestjs/common';
import type { Json, MatchingSuggestionDto } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { MatchingConfigService } from './matching-config.service';
import { MatchingEligibilityService } from './matching-eligibility.service';
import { MatchingFeedbackService } from './matching-feedback.service';
import { MatchingScorerService } from './matching-scorer.service';

@Injectable()
export class MatchingEventService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: MatchingConfigService,
    private readonly eligibility: MatchingEligibilityService,
    private readonly scorer: MatchingScorerService,
    private readonly feedback: MatchingFeedbackService
  ) {}

  async meetSuggestions(
    viewerId: string,
    eventId: string
  ): Promise<MatchingSuggestionDto[]> {
    const { data: event } = await this.supabase.admin
      .from('events')
      .select('id, host_id')
      .eq('id', eventId)
      .maybeSingle();
    if (!event) throw new NotFoundException('Event not found');

    const { data: invites } = await this.supabase.admin
      .from('event_invites')
      .select('user_id, status')
      .eq('event_id', eventId);

    const attendeeIds = new Set<string>();
    attendeeIds.add(event.host_id);
    for (const inv of invites ?? []) {
      if (inv.status === 'going' || inv.status === 'invited') {
        attendeeIds.add(inv.user_id);
      }
    }
    if (!attendeeIds.has(viewerId) && event.host_id !== viewerId) {
      // Still allow host dashboard; guests must be invited.
      return [];
    }

    const cfg = await this.config.getActive();
    const fof = await this.eligibility.listFofCandidates(viewerId);
    // Prefer FoF who are also related to attendees (friends of invitees).
    const scored: MatchingSuggestionDto[] = [];

    for (const c of fof) {
      if (attendeeIds.has(c.candidateId)) continue;
      const result = await this.scorer.scorePair(viewerId, c, cfg, {
        surface: 'event',
        eventId,
        reciprocalBonus: 0.5
      });
      if (!result) continue;

      const { data: row, error } = await this.supabase.admin
        .from('matching_suggestions')
        .insert({
          viewer_id: viewerId,
          candidate_id: c.candidateId,
          surface: 'event',
          event_id: eventId,
          via_friend_id: c.viaFriendId,
          score: result.score,
          breakdown: result.contribs as unknown as Json,
          evidence: result.evidence as unknown as Json,
          is_exploration: false,
          is_spotlight: result.isSpotlight,
          feature_snapshot: result.snapshot as unknown as Json
        })
        .select('id')
        .single();
      if (error) continue;

      await this.feedback.recordOutcome({
        userA: viewerId,
        userB: c.candidateId,
        outcome: 'impressed',
        surface: 'event',
        suggestionId: row.id,
        snapshot: result.snapshot
      });

      scored.push({
        id: row.id,
        personId: c.candidateId,
        viaFriendId: c.viaFriendId,
        sharedThread: result.evidence[0]?.title ?? 'You might click at this event',
        signals: result.evidence.map((e) => e.title).slice(0, 3),
        score: result.score,
        isSpotlight: result.isSpotlight,
        isExploration: false,
        bothOptedIn: true
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, cfg.refreshCap);
  }
}
