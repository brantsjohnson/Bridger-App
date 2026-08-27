// ============================================
// WHAT THIS FILE DOES (plain English):
// The server side of sorting friends into Close / Friends / Acquaintances.
// One person privately sorts another; that sort is what decides what they can
// see of each other's profile. Free Lite caps 5 Close / 30 Friends; co-op
// caps 25 Close / 125 Friends. Acquaintances are never capped. Hitting a cap
// never blocks the connection: they land in Acquaintances (Free Lite can see co-op).
// ============================================
import { BadRequestException, Injectable } from '@nestjs/common';
import type { Tier } from '@bridger/shared';
import { CoopService } from '../coop/coop.service';
import { MatchingFeedbackService } from '../matching/matching-feedback.service';
import { SupabaseService } from '../supabase/supabase.service';

/** Circle caps from COOP.md / FRIENDS.md. Acquaintances are never capped. */
const FREE_CAPS: Partial<Record<Tier, number>> = {
  close: 5,
  friend: 30
};
const COOP_CAPS: Partial<Record<Tier, number>> = {
  close: 25,
  friend: 125
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

    // THIS SECTION DOES: load membership so we know which Close / Friends cap to use.
    const isCoop = await this.coop.isActiveMember(userId);
    const caps = isCoop ? COOP_CAPS : FREE_CAPS;

    let landedIn: Tier = target;
    let upsell = false;

    // Cap only applies when adding into a capped circle (not when already there).
    if (caps[target] != null) {
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
        if ((count ?? 0) >= (caps[target] as number)) {
          landedIn = 'acquaintance';
          // PAYMENT: only Free Lite gets the co-op upsell when a circle is full.
          upsell = !isCoop;
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
