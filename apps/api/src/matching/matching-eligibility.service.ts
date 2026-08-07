// ============================================
// WHAT THIS FILE DOES (plain English):
// Decides who may even be scored as a suggestion for you: friends-of-friends
// only, minus blocks, skips, existing friends, and people who turned Discover
// off or have almost nothing filled in.
// ============================================
import { Injectable } from '@nestjs/common';
import { MATCHING_SEED_KNOBS, DISCOVER_QUIZ_IDS } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

export type FofCandidate = {
  candidateId: string;
  viaFriendId: string;
  viaTier: 'close' | 'friend' | 'acquaintance';
};

@Injectable()
export class MatchingEligibilityService {
  constructor(private readonly supabase: SupabaseService) {}

  async isDiscoverable(userId: string): Promise<boolean> {
    const { data } = await this.supabase.admin
      .from('user_settings')
      .select('discoverable')
      .eq('user_id', userId)
      .maybeSingle();
    return Boolean(data?.discoverable);
  }

  async meetsCompleteness(userId: string): Promise<boolean> {
    const { count: attrCount } = await this.supabase.admin
      .from('attributes')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('matchable', true)
      .eq('visible_to_tier', 'acquaintance');

    if ((attrCount ?? 0) >= MATCHING_SEED_KNOBS.minEveryoneMatchableAttrs) {
      return true;
    }

    const { data: regs } = await this.supabase.admin
      .from('quiz_registry')
      .select('quiz_id, slug')
      .in('slug', [...DISCOVER_QUIZ_IDS]);
    const quizIds = (regs ?? [])
      .map((r) => r.quiz_id)
      .filter((id): id is string => Boolean(id));
    if (!quizIds.length) return false;

    const { count } = await this.supabase.admin
      .from('quiz_results')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('quiz_id', quizIds);
    return (count ?? 0) >= 1;
  }

  async listBlockedIds(userId: string): Promise<Set<string>> {
    const { data } = await this.supabase.admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    const out = new Set<string>();
    for (const row of data ?? []) {
      out.add(row.blocker_id === userId ? row.blocked_id : row.blocker_id);
    }
    return out;
  }

  async listSkipIds(userId: string): Promise<Set<string>> {
    const { data } = await this.supabase.admin
      .from('suggestion_skips')
      .select('skipped_id')
      .eq('blocker_id', userId);
    return new Set((data ?? []).map((r) => r.skipped_id));
  }

  async listConnectedIds(userId: string): Promise<Set<string>> {
    const { data } = await this.supabase.admin
      .from('connections')
      .select('user_a, user_b, status')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'accepted');
    const out = new Set<string>();
    for (const row of data ?? []) {
      out.add(row.user_a === userId ? row.user_b : row.user_a);
    }
    return out;
  }

  /**
   * Friends-of-friends candidates with a via path.
   * SECURITY: excludes blocks, skips, existing connections, non-discoverable.
   */
  async listFofCandidates(viewerId: string): Promise<FofCandidate[]> {
    if (!(await this.isDiscoverable(viewerId))) return [];
    if (!(await this.meetsCompleteness(viewerId))) return [];

    const blocked = await this.listBlockedIds(viewerId);
    const skips = await this.listSkipIds(viewerId);
    const connected = await this.listConnectedIds(viewerId);

    // Direct friends (1st degree).
    const friends = [...connected].filter((id) => !blocked.has(id));
    if (!friends.length) return [];

    const { data: friendTiers } = await this.supabase.admin
      .from('tiers')
      .select('other_id, tier')
      .eq('user_id', viewerId)
      .in('other_id', friends);
    const tierByFriend = new Map(
      (friendTiers ?? []).map((t) => [t.other_id, t.tier as FofCandidate['viaTier']])
    );

    // 2nd degree: friends of each friend (batch per friend to keep queries simple).
    const candidates = new Map<string, FofCandidate>();
    const friendSet = new Set(friends);
    for (const via of friends) {
      const { data: hops } = await this.supabase.admin
        .from('connections')
        .select('user_a, user_b')
        .eq('status', 'accepted')
        .or(`user_a.eq.${via},user_b.eq.${via}`);
      for (const hop of hops ?? []) {
        const candidateId = hop.user_a === via ? hop.user_b : hop.user_a;
        if (
          candidateId === viewerId ||
          friendSet.has(candidateId) ||
          connected.has(candidateId) ||
          blocked.has(candidateId) ||
          skips.has(candidateId) ||
          blocked.has(via)
        ) {
          continue;
        }
        const nextTier = tierByFriend.get(via) ?? 'friend';
        const existing = candidates.get(candidateId);
        if (!existing) {
          candidates.set(candidateId, {
            candidateId,
            viaFriendId: via,
            viaTier: nextTier
          });
        } else {
          const rank = { close: 3, friend: 2, acquaintance: 1 };
          if (rank[nextTier] > rank[existing.viaTier]) {
            candidates.set(candidateId, {
              candidateId,
              viaFriendId: via,
              viaTier: nextTier
            });
          }
        }
      }
    }

    // Drop non-discoverable / incomplete candidates.
    const out: FofCandidate[] = [];
    for (const c of candidates.values()) {
      if (!(await this.isDiscoverable(c.candidateId))) continue;
      if (!(await this.meetsCompleteness(c.candidateId))) continue;
      // Bridge path invalid if mutual blocked the candidate.
      if (await this.pairBlocked(c.viaFriendId, c.candidateId)) continue;
      out.push(c);
    }
    return out;
  }

  private async pairBlocked(a: string, b: string): Promise<boolean> {
    const { data } = await this.supabase.admin
      .from('blocks')
      .select('blocker_id')
      .or(
        `and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`
      )
      .limit(1);
    return (data?.length ?? 0) > 0;
  }
}
