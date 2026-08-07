// ============================================
// WHAT THIS FILE DOES (plain English):
// The server side of sorting friends into Close / Friends / Acquaintances.
// One person privately sorts another; that sort is what decides what they can
// see of each other's profile. Free members have caps (10 Close, 25 Friends);
// Acquaintances are never capped, and hitting a cap never blocks the
// connection — they just land in Acquaintances and the app can offer co-op.
// ============================================
import { BadRequestException, Injectable } from '@nestjs/common';
import type { Tier } from '@bridger/shared';
import { CoopService } from '../coop/coop.service';
import { MatchingFeedbackService } from '../matching/matching-feedback.service';
import { SupabaseService } from '../supabase/supabase.service';

/** Free-plan caps from FRIENDS.md. Acquaintances are never capped. */
const FREE_CAPS: Partial<Record<Tier, number>> = {
  close: 10,
  friend: 25
};

/** What the app gets back after a move. */
export type MoveTierResult = {
  landedIn: Tier;
  upsell: boolean;
};

@Injectable()
export class TiersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly coop: CoopService,
    private readonly matchingFeedback: MatchingFeedbackService
  ) {}

  /**
   * Move (or first-set) how I sort someone.
   * PAYMENT: free caps never block — they land in Acquaintances + upsell.
   */
  async setTier(
    userId: string,
    personId: string,
    target: Tier
  ): Promise<MoveTierResult> {
    if (personId === userId) {
      throw new BadRequestException('Cannot tier yourself');
    }
    if (target === 'none') {
      throw new BadRequestException('Tier cannot be none');
    }
    if (!['close', 'friend', 'acquaintance'].includes(target)) {
      throw new BadRequestException('Invalid tier');
    }

    // Co-op members lift the Close / Friends caps entirely (reconcile first).
    const isCoop = await this.coop.isActiveMember(userId);

    let landedIn: Tier = target;
    let upsell = false;

    // Cap only applies when adding into a capped circle (not when already there).
    if (!isCoop && FREE_CAPS[target] != null) {
      const { data: existing } = await this.supabase.admin
        .from('tiers')
        .select('tier')
        .eq('user_id', userId)
        .eq('other_id', personId)
        .maybeSingle();

      const alreadyInTarget = existing?.tier === target;
      if (!alreadyInTarget) {
        const { count, error: countErr } = await this.supabase.admin
          .from('tiers')
          .select('other_id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('tier', target)
          .neq('other_id', personId);
        if (countErr) throw countErr;
        if ((count ?? 0) >= (FREE_CAPS[target] as number)) {
          landedIn = 'acquaintance';
          upsell = true;
        }
      }
    }

    const { data: previous } = await this.supabase.admin
      .from('tiers')
      .select('tier')
      .eq('user_id', userId)
      .eq('other_id', personId)
      .maybeSingle();
    const fromTier = previous?.tier as Tier | undefined;

    const { error } = await this.supabase.admin.from('tiers').upsert(
      { user_id: userId, other_id: personId, tier: landedIn },
      { onConflict: 'user_id,other_id' }
    );
    if (error) throw error;

    // Learning labels: Close is gold; demote from Close is negative.
    if (landedIn === 'close' && fromTier !== 'close') {
      await this.matchingFeedback
        .recordOutcome({
          userA: userId,
          userB: personId,
          outcome: 'close'
        })
        .catch(() => undefined);
    } else if (
      fromTier === 'close' &&
      landedIn !== 'close'
    ) {
      await this.matchingFeedback
        .recordOutcome({
          userA: userId,
          userB: personId,
          outcome: 'demoted'
        })
        .catch(() => undefined);
    }

    return { landedIn, upsell };
  }
}
