// ============================================
// WHAT THIS FILE DOES (plain English):
// Receives RevenueCat webhooks when someone buys, renews, cancels, or loses
// co-op membership. Verifies a shared Authorization secret, then updates
// coop_memberships + plan_state. The app_user_id on the event is our Bridger
// user id (set when the SDK logs in).
//
// PAYMENT: this is the durable source of truth for Apple / Google renewals.
// The mobile client also mirrors a join after a successful paywall so perks
// unlock immediately; this webhook keeps renewals / expirations in sync.
//
// Product events: coop_renewed (RENEWAL / UNCANCELLATION) and coop_expired
// (EXPIRATION / SUBSCRIPTION_PAUSED) fire here on confirmed provider outcomes.
// ============================================
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoopService } from './coop.service';
import { PosthogService } from '../posthog/posthog.service';

/** Entitlement id configured in RevenueCat for Bridger co-op. */
const COOP_ENTITLEMENT = 'social_bridger_app_pro';

type RcEvent = {
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  expiration_at_ms?: number | null;
  purchased_at_ms?: number | null;
  store?: string;
  entitlement_ids?: string[] | null;
  environment?: string;
  period_type?: string;
};

type RcWebhookBody = {
  api_version?: string;
  event?: RcEvent;
};

@Controller('coop/webhooks')
export class RevenueCatWebhookController {
  private readonly log = new Logger(RevenueCatWebhookController.name);

  constructor(
    private readonly coop: CoopService,
    private readonly config: ConfigService,
    private readonly posthog: PosthogService
  ) {}

  // THIS SECTION DOES: accept RevenueCat's POST, check the shared secret, apply.
  @Post('revenuecat')
  @HttpCode(200)
  async handle(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: RcWebhookBody
  ) {
    const expected = this.config.get<string>('REVENUECAT_WEBHOOK_SECRET')?.trim();
    if (!expected) {
      this.log.warn('REVENUECAT_WEBHOOK_SECRET missing; rejecting webhook.');
      throw new UnauthorizedException('Webhook not configured');
    }
    // RevenueCat sends Authorization: Bearer <secret> (or the raw secret).
    const got = (authorization ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!got || got !== expected) {
      throw new UnauthorizedException('Invalid webhook authorization');
    }

    const event = body?.event;
    const userId = event?.app_user_id || event?.original_app_user_id;
    if (!event?.type || !userId) {
      return { ok: true, ignored: true };
    }

    // Skip events that are not about our co-op entitlement (when listed).
    const ents = event.entitlement_ids;
    if (Array.isArray(ents) && ents.length > 0 && !ents.includes(COOP_ENTITLEMENT)) {
      return { ok: true, ignored: 'other_entitlement' };
    }

    const store = (event.store ?? '').toUpperCase();
    const method =
      store.includes('APP_STORE') || store.includes('MAC')
        ? 'apple'
        : store.includes('PLAY')
          ? 'google'
          : 'apple';
    const plan = planFromProductId(event.product_id);

    const paidThrough =
      typeof event.expiration_at_ms === 'number' && event.expiration_at_ms > 0
        ? new Date(event.expiration_at_ms).toISOString()
        : undefined;

    try {
      switch (event.type) {
        case 'INITIAL_PURCHASE':
        case 'NON_RENEWING_PURCHASE':
        case 'PRODUCT_CHANGE':
          // First join / product change: membership only. coop_joined fires on
          // the client after a confirmed purchase (avoids double-count).
          await this.coop.setMembershipFromProvider(userId, {
            join: true,
            provider: method,
            providerSubscriptionId: event.product_id ?? null,
            paidThrough: paidThrough ?? null
          });
          break;
        case 'RENEWAL':
        case 'UNCANCELLATION':
          await this.coop.setMembershipFromProvider(userId, {
            join: true,
            provider: method,
            providerSubscriptionId: event.product_id ?? null,
            paidThrough: paidThrough ?? null
          });
          await this.posthog.captureProduct(userId, 'coop_renewed', {
            method,
            provider: method,
            plan: plan ?? null
          });
          break;
        case 'CANCELLATION':
          // Keep perks until expiration; mark quiet cancel.
          await this.coop.cancelMembership(userId).catch(() => {
            // Already cancelled / not a member: fine.
          });
          break;
        case 'EXPIRATION':
        case 'SUBSCRIPTION_PAUSED':
          await this.coop.setMembershipFromProvider(userId, {
            join: false,
            provider: method,
            providerSubscriptionId: event.product_id ?? null,
            paidThrough: null
          });
          await this.posthog.captureProduct(userId, 'coop_expired', {
            method,
            provider: method
          });
          break;
        case 'BILLING_ISSUE':
          // Soft signal only: leave membership active until EXPIRATION.
          this.log.warn(`Billing issue for user ${userId}`);
          break;
        default:
          this.log.debug(`Unhandled RevenueCat event ${event.type}`);
      }
    } catch (err) {
      this.log.error(`RevenueCat webhook failed for ${event.type}`, err as Error);
      // Still 200 so RC does not hammer retries for permanent errors; log for ops.
    }

    return { ok: true };
  }
}

/** Guess monthly vs yearly from a store product id (never the receipt). */
function planFromProductId(
  productId: string | undefined
): 'monthly' | 'yearly' | undefined {
  if (!productId) return undefined;
  const p = productId.toLowerCase();
  if (p.includes('year') || p.includes('annual')) return 'yearly';
  if (p.includes('month')) return 'monthly';
  return undefined;
}
