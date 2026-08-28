// ============================================
// WHAT THIS FILE DOES (plain English):
// Talks to Stripe for co-op membership paid by card. Creates a Checkout
// Session (subscription mode: monthly or yearly price), and applies webhook
// events so renewals / cancels update coop_memberships. Card numbers never
// touch Bridger; Stripe hosts the payment page.
//
// PAYMENT / APPLE 3.1.1: this path is for web (and optionally Android). The
// iOS app uses RevenueCat / StoreKit for digital membership, not Stripe.
//
// CONNECT: Bridger co-op dues are paid TO Bridger, not split to connected
// accounts. Peer chip-in (Venmo / Cash App) stays peer-to-peer text links we
// never process. Connect scaffolding is reserved for a future need; not used
// for membership here.
// ============================================
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CoopService } from './coop.service';
import { PosthogService } from '../posthog/posthog.service';

export type StripeCheckoutPlan = 'monthly' | 'yearly';

@Injectable()
export class StripeService {
  private readonly log = new Logger(StripeService.name);
  private client: Stripe | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly coop: CoopService,
    private readonly posthog: PosthogService
  ) {}

  /** Lazy Stripe client (secret key from env / Secrets Manager). */
  private getStripe(): Stripe {
    if (this.client) return this.client;
    const key = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    if (!key) {
      throw new BadRequestException(
        'Stripe is not configured (STRIPE_SECRET_KEY missing).'
      );
    }
    // Latest SDK: instantiate StripeClient-style constructor (not global apiKey).
    this.client = new Stripe(key);
    return this.client;
  }

  /** True when secret + at least one price id are set. */
  isConfigured(): boolean {
    const key = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    const monthly = this.config.get<string>('STRIPE_PRICE_MONTHLY')?.trim();
    const yearly = this.config.get<string>('STRIPE_PRICE_YEARLY')?.trim();
    return Boolean(key && (monthly || yearly));
  }

  private priceIdFor(plan: StripeCheckoutPlan): string {
    const monthly = this.config.get<string>('STRIPE_PRICE_MONTHLY')?.trim();
    const yearly = this.config.get<string>('STRIPE_PRICE_YEARLY')?.trim();
    const id = plan === 'yearly' ? yearly || monthly : monthly || yearly;
    if (!id) {
      throw new BadRequestException(
        'Stripe price ids missing (STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY).'
      );
    }
    return id;
  }

  /**
   * Start Stripe Checkout for co-op membership. Returns the hosted URL the
   * app opens. client_reference_id = Bridger user id so webhooks can grant.
   */
  async createMembershipCheckout(input: {
    userId: string;
    email?: string | null;
    plan?: StripeCheckoutPlan;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{ url: string; sessionId: string }> {
    const stripe = this.getStripe();
    const plan = input.plan ?? 'monthly';
    const priceId = this.priceIdFor(plan);

    const appWeb =
      this.config.get<string>('APP_WEB_URL')?.replace(/\/$/, '') ||
      'https://bridger.social';
    const successUrl =
      input.successUrl ||
      `${appWeb}/coop?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = input.cancelUrl || `${appWeb}/coop?checkout=cancel`;

    // Find or create a Stripe customer keyed to this Bridger user.
    const customerId = await this.ensureCustomer(input.userId, input.email);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: input.userId,
      // Do NOT pass payment_method_types — dynamic methods from Dashboard.
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          bridger_user_id: input.userId,
          bridger_plan: plan
        }
      },
      metadata: {
        bridger_user_id: input.userId,
        bridger_plan: plan
      }
    });

    if (!session.url) {
      throw new BadRequestException('Stripe did not return a Checkout URL.');
    }
    return { url: session.url, sessionId: session.id };
  }

  /** Open Stripe Customer Portal so they can cancel / update card. */
  async createPortalSession(input: {
    userId: string;
    returnUrl?: string;
  }): Promise<{ url: string }> {
    const stripe = this.getStripe();
    const customerId = await this.lookupCustomerId(input.userId);
    if (!customerId) {
      throw new BadRequestException('No Stripe customer for this account.');
    }
    const appWeb =
      this.config.get<string>('APP_WEB_URL')?.replace(/\/$/, '') ||
      'https://bridger.social';
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: input.returnUrl || `${appWeb}/coop/portal/manage`
    });
    return { url: session.url };
  }

  /**
   * Verify webhook signature and apply membership changes. rawBody is required.
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ ok: true }> {
    const stripe = this.getStripe();
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.trim();
    if (!secret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is missing.');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      this.log.warn(`Stripe webhook signature failed: ${String(err)}`);
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'unpaid') break;
        await this.fulfillCheckoutSession(session);
        break;
      }
      case 'checkout.session.async_payment_failed': {
        this.log.warn(
          `Checkout async payment failed: ${(event.data.object as Stripe.Checkout.Session).id}`
        );
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.onInvoicePaid(invoice);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await this.syncSubscription(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.endSubscription(sub);
        break;
      }
      default:
        this.log.debug(`Unhandled Stripe event ${event.type}`);
    }

    return { ok: true };
  }

  // THIS SECTION DOES: after Checkout succeeds, grant Bridger co-op membership.
  private async fulfillCheckoutSession(session: Stripe.Checkout.Session) {
    const userId =
      session.client_reference_id ||
      session.metadata?.bridger_user_id ||
      null;
    if (!userId) {
      this.log.warn(`Checkout ${session.id} missing bridger user id`);
      return;
    }

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? null;
    const subId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id ?? null;

    let paidThrough: string | null = null;
    if (subId) {
      const stripe = this.getStripe();
      const sub = await stripe.subscriptions.retrieve(subId);
      paidThrough = periodEndIso(sub);
    }

    await this.coop.setMembershipFromProvider(userId, {
      join: true,
      provider: 'stripe',
      providerSubscriptionId: subId,
      paidThrough,
      stripeCustomerId: customerId
    });
  }

  private async onInvoicePaid(invoice: Stripe.Invoice) {
    const subRef = (invoice as { subscription?: string | { id: string } | null })
      .subscription;
    const subId =
      typeof subRef === 'string' ? subRef : subRef?.id ?? null;
    if (!subId) return;
    const stripe = this.getStripe();
    const sub = await stripe.subscriptions.retrieve(subId);
    await this.syncSubscription(sub);

    // THIS SECTION DOES: emit coop_renewed only on a real renewal cycle, not the
    // first invoice (subscription_create), so we do not double-count joins.
    const reason = (invoice as { billing_reason?: string | null }).billing_reason;
    const userId = sub.metadata?.bridger_user_id;
    if (
      userId &&
      (reason === 'subscription_cycle' || reason === 'subscription_update')
    ) {
      await this.posthog.captureProduct(userId, 'coop_renewed', {
        method: 'card',
        provider: 'stripe',
        plan: planFromSubscription(sub) ?? null
      });
    }
  }

  private async syncSubscription(sub: Stripe.Subscription) {
    const userId = sub.metadata?.bridger_user_id;
    if (!userId) return;
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const active =
      sub.status === 'active' ||
      sub.status === 'trialing' ||
      sub.status === 'past_due';

    if (!active) {
      await this.coop.setMembershipFromProvider(userId, {
        join: false,
        provider: 'stripe',
        providerSubscriptionId: sub.id,
        paidThrough: null,
        stripeCustomerId: customerId
      });
      // canceled usually gets a follow-up customer.subscription.deleted which
      // emits coop_expired. Emit here only for other inactive statuses.
      if (sub.status !== 'canceled') {
        await this.posthog.captureProduct(userId, 'coop_expired', {
          method: 'card',
          provider: 'stripe'
        });
      }
      return;
    }

    await this.coop.setMembershipFromProvider(userId, {
      join: true,
      provider: 'stripe',
      providerSubscriptionId: sub.id,
      paidThrough: periodEndIso(sub),
      stripeCustomerId: customerId
    });

    if (sub.cancel_at_period_end) {
      await this.coop.cancelMembership(userId).catch(() => undefined);
    }
  }

  private async endSubscription(sub: Stripe.Subscription) {
    const userId = sub.metadata?.bridger_user_id;
    if (!userId) return;
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    await this.coop.setMembershipFromProvider(userId, {
      join: false,
      provider: 'stripe',
      providerSubscriptionId: sub.id,
      paidThrough: null,
      stripeCustomerId: customerId
    });
    await this.posthog.captureProduct(userId, 'coop_expired', {
      method: 'card',
      provider: 'stripe'
    });
  }

  private async ensureCustomer(
    userId: string,
    email?: string | null
  ): Promise<string> {
    const existing = await this.lookupCustomerId(userId);
    if (existing) return existing;

    const stripe = this.getStripe();
    const customer = await stripe.customers.create({
      email: email || undefined,
      metadata: { bridger_user_id: userId }
    });
    await this.coop.rememberStripeCustomer(userId, customer.id);
    return customer.id;
  }

  private async lookupCustomerId(userId: string): Promise<string | null> {
    return this.coop.getStripeCustomerId(userId);
  }
}

function periodEndIso(sub: Stripe.Subscription): string | null {
  const end = (sub as { current_period_end?: number }).current_period_end;
  if (typeof end !== 'number' || end <= 0) return null;
  return new Date(end * 1000).toISOString();
}

/** Guess monthly vs yearly from the subscription's price interval. */
function planFromSubscription(
  sub: Stripe.Subscription
): 'monthly' | 'yearly' | undefined {
  const item = sub.items?.data?.[0];
  const interval = item?.price?.recurring?.interval;
  if (interval === 'year') return 'yearly';
  if (interval === 'month') return 'monthly';
  const meta = sub.metadata?.bridger_plan;
  if (meta === 'yearly' || meta === 'monthly') return meta;
  return undefined;
}
