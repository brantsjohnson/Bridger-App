// ============================================
// WHAT THIS FILE DOES (plain English):
// Routes for co-op announcements and membership. Membership never gates what
// you can see; it only changes what you can create (see COOP.md).
//
// PAYMENT: apple/google go through PurchaseGateway after RevenueCat confirms.
// Card opens Stripe Checkout (POST /coop/checkout/stripe); the webhook grants
// membership. Leave flips membership + plan_state back to free.
// ============================================
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { CoopService } from './coop.service';
import { PromoService } from './promo.service';
import { PurchaseGateway, type DuesMethod } from './purchase.gateway';
import { StripeService, type StripeCheckoutPlan } from './stripe.service';

@Controller('coop')
@UseGuards(SupabaseAuthGuard)
export class CoopController {
  constructor(
    private readonly coop: CoopService,
    private readonly purchases: PurchaseGateway,
    private readonly promo: PromoService,
    private readonly stripe: StripeService
  ) {}

  @Get('announcements')
  listAnnouncements() {
    return this.coop.listAnnouncements();
  }

  @Get('membership')
  getMembership(@CurrentUser() user: AuthUser) {
    return this.coop.getMembership(user.id);
  }

  @Post('membership')
  async setMembership(
    @CurrentUser() user: AuthUser,
    @Body() body: { join: boolean; method?: DuesMethod; cancel?: boolean }
  ) {
    // Quiet period-end cancel (keeps perks until renews date).
    if (body?.cancel === true) {
      return this.coop.cancelMembership(user.id);
    }
    if (body?.join === false) {
      return this.coop.setMembership(user.id, { join: false });
    }
    if (body?.join !== true) {
      return this.coop.setMembership(user.id, body);
    }
    const method = body.method ?? 'soft';
    if (method === 'soft') {
      return this.coop.setMembership(user.id, { join: true });
    }
    // Apple / Google: PurchaseGateway after store confirm. Card should use
    // /coop/checkout/stripe instead of this soft path.
    const result = await this.purchases.startAnnualDues(user.id, method);
    return result.membership;
  }

  @Post('membership/cancel')
  cancelMembership(@CurrentUser() user: AuthUser) {
    return this.coop.cancelMembership(user.id);
  }

  // Redeem an auth / promo code for a free year (no payment). The server checks
  // the code, grants membership, and records who used it.
  @Post('membership/redeem')
  redeem(@CurrentUser() user: AuthUser, @Body() body: { code: string }) {
    return this.promo.redeem(user.id, body?.code ?? '');
  }

  /**
   * Start Stripe Checkout for card membership (web / Android). Returns a URL
   * to open. Membership is granted from the Stripe webhook, not this response.
   */
  @Post('checkout/stripe')
  createStripeCheckout(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      plan?: StripeCheckoutPlan;
      successUrl?: string;
      cancelUrl?: string;
    }
  ) {
    return this.stripe.createMembershipCheckout({
      userId: user.id,
      email: user.email,
      plan: body?.plan ?? 'monthly',
      successUrl: body?.successUrl,
      cancelUrl: body?.cancelUrl
    });
  }

  /** Stripe Customer Portal (update card / cancel subscription). */
  @Post('checkout/stripe/portal')
  createStripePortal(
    @CurrentUser() user: AuthUser,
    @Body() body: { returnUrl?: string }
  ) {
    return this.stripe.createPortalSession({
      userId: user.id,
      returnUrl: body?.returnUrl
    });
  }

  @Get('storage')
  getStorage(@CurrentUser() user: AuthUser) {
    return this.coop.getStorage(user.id);
  }
}
