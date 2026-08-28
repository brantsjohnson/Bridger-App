// ============================================
// WHAT THIS FILE DOES (plain English):
// The only door for "pay annual / monthly dues." Apple and Google arrive here
// after RevenueCat confirms a purchase on device (and again via webhook). Soft
// is demo / free-path only. Card uses Stripe Checkout + webhook, not this soft
// grant path.
//
// PAYMENT: never process peer Venmo/Cash App here. Co-op dues are the membership
// SKU only (see COOP.md).
// ============================================
import { BadRequestException, Injectable } from '@nestjs/common';
import { CoopService } from './coop.service';

export type DuesMethod = 'apple' | 'google' | 'card' | 'soft';

@Injectable()
export class PurchaseGateway {
  constructor(private readonly coop: CoopService) {}

  /**
   * Start membership after a confirmed store purchase (or soft join).
   * Webhooks also call CoopService.setMembershipFromProvider for renewals.
   */
  async startAnnualDues(
    userId: string,
    method: DuesMethod
  ): Promise<{
    status: 'soft_joined' | 'store_joined' | 'pending_iap';
    membership: Awaited<ReturnType<CoopService['setMembershipFromProvider']>>;
  }> {
    if (method === 'soft') {
      const membership = await this.coop.setMembershipFromProvider(userId, {
        join: true,
        provider: 'soft'
      });
      return { status: 'soft_joined', membership };
    }

    // Card must go through POST /coop/checkout/stripe (Checkout Session).
    // Do not soft-grant membership from this endpoint.
    if (method === 'card') {
      throw new BadRequestException(
        'Use POST /coop/checkout/stripe for card membership.'
      );
    }

    // Apple / Google: client already verified entitlement via RevenueCat; mirror
    // onto Bridger.
    const membership = await this.coop.setMembershipFromProvider(userId, {
      join: true,
      provider: method
    });
    return {
      status: 'store_joined',
      membership
    };
  }
}
