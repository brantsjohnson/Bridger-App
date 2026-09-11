// ============================================
// WHAT THIS FILE DOES (plain English):
// Co-op membership + announcements. Joining syncs plan_state. Cancel is
// period-end: perks stay until dues_paid_through, then reconcile flips to free
// (rolling ~30-day story storage).
//
// PAYMENT: soft-join sets provisional dues_paid_through; Apple / Google arrive
// through PurchaseGateway after RevenueCat confirms, and renewals via webhook.
// Display dues are "$6/mo".
// ============================================
import { BadRequestException, Injectable } from '@nestjs/common';
import type { CoopAnnouncement, CoopMembership } from '@bridger/shared';
import {
  FREE_STORY_STORAGE_BYTES,
  buildStorageMeter,
  formatStorageBytes,
  includedBytesFromGb,
  overagePriceLabel,
  parseStorageConfig,
  storageUsedPct
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

const DISPLAY_DUES = '$6/mo';

type MembershipRow = {
  active: boolean;
  since: string;
  dues_paid_through: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
};

/** Result of reconcile — row after any flip + one-shot period-end signal. */
type ReconcileResult = {
  row: MembershipRow | null;
  endedThisRead: boolean;
};

@Injectable()
export class CoopService {
  constructor(private readonly supabase: SupabaseService) {}

  private planStateFor(member: boolean) {
    if (member) {
      return {
        plan: 'coop' as const,
        storage: 'unlimited' as const,
        video: true,
        summary: 'daily' as const,
        event_cap: 100,
        circle_caps: {
          close: 25,
          friend: 125,
          acquaintance: null
        }
      };
    }
    return {
      plan: 'free' as const,
      storage: 'rolling30' as const,
      video: false,
      summary: 'weekly' as const,
      event_cap: 35,
      circle_caps: {
        close: 5,
        friend: 30,
        acquaintance: null
      }
    };
  }

  private async loadPlan(userId: string) {
    const { data } = await this.supabase.admin
      .from('plan_state')
      .select('plan, storage, video, event_cap, used_bytes')
      .eq('user_id', userId)
      .maybeSingle();
    return data;
  }

  private async loadMembership(userId: string): Promise<MembershipRow | null> {
    const { data, error } = await this.supabase.admin
      .from('coop_memberships')
      .select(
        'active, since, dues_paid_through, cancel_at_period_end, cancelled_at'
      )
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as MembershipRow | null;
  }

  private async syncPlan(userId: string, member: boolean) {
    const { error } = await this.supabase.admin.from('plan_state').upsert(
      {
        user_id: userId,
        ...this.planStateFor(member)
      } as never,
      { onConflict: 'user_id' }
    );
    if (error) throw error;
  }

  /**
   * If the paid year ended, flip to free. Called on every membership read /
   * member check so we do not need a cron for v1.
   * endedThisRead is true only on the read where active flipped true → false.
   */
  async reconcileMembership(userId: string): Promise<ReconcileResult> {
    const row = await this.loadMembership(userId);
    if (!row) return { row: null, endedThisRead: false };

    const paidThrough = row.dues_paid_through
      ? new Date(row.dues_paid_through).getTime()
      : null;
    const expired = paidThrough != null && paidThrough < Date.now();

    if (row.active && expired) {
      const { data, error } = await this.supabase.admin
        .from('coop_memberships')
        .update({
          active: false,
          cancel_at_period_end: false,
          cancelled_at: row.cancelled_at ?? new Date().toISOString(),
          dues_paid_through: null
        })
        .eq('user_id', userId)
        .select(
          'active, since, dues_paid_through, cancel_at_period_end, cancelled_at'
        )
        .single();
      if (error) throw error;
      await this.syncPlan(userId, false);
      return { row: data as MembershipRow, endedThisRead: true };
    }

    return { row, endedThisRead: false };
  }

  // --- Published announcements only (drafts stay out of the app) ---

  async listAnnouncements(): Promise<CoopAnnouncement[]> {
    const { data, error } = await this.supabase.admin
      .from('coop_announcements')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((a) => ({
      id: a.id,
      title: a.title ?? '',
      body: a.body,
      ctaLabel: a.cta_label ?? undefined,
      ctaUrl: a.cta_url ?? undefined,
      publishedAt: a.published_at ?? undefined,
      action: a.cta_label ?? undefined
    }));
  }

  private toMembershipDto(data: MembershipRow | null): CoopMembership {
    const member = !!data?.active;
    const renews = data?.dues_paid_through
      ? new Date(data.dues_paid_through).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        })
      : undefined;

    return {
      member,
      since: member ? data?.since : undefined,
      renews: member ? renews : undefined,
      dues: DISPLAY_DUES,
      cancelAtPeriodEnd: member ? !!data?.cancel_at_period_end : false
    };
  }

  async getMembership(userId: string): Promise<CoopMembership> {
    const { row, endedThisRead } = await this.reconcileMembership(userId);
    const base = this.toMembershipDto(row);
    const plan = await this.loadPlan(userId);
    return {
      ...base,
      ...(endedThisRead ? { endedThisRead: true } : {}),
      plan: (plan?.plan as 'free' | 'coop') ?? (base.member ? 'coop' : 'free'),
      storage:
        (plan?.storage as 'rolling30' | 'unlimited') ??
        (base.member ? 'unlimited' : 'rolling30'),
      eventCap: plan?.event_cap ?? (base.member ? 100 : 35),
      video: plan?.video ?? base.member
    };
  }

  async setMembership(
    userId: string,
    body: { join: boolean }
  ): Promise<CoopMembership> {
    return this.setMembershipFromProvider(userId, {
      join: body.join,
      provider: body.join ? 'soft' : null,
      providerSubscriptionId: null,
      paidThrough: null
    });
  }

  /**
   * Grant or revoke membership from a payment provider (RevenueCat webhook,
   * Stripe webhook, or soft join). When joining without a paidThrough date we
   * default to +1 year so soft / promo still work.
   */
  async setMembershipFromProvider(
    userId: string,
    input: {
      join: boolean;
      provider?: string | null;
      providerSubscriptionId?: string | null;
      paidThrough?: string | null;
      stripeCustomerId?: string | null;
    }
  ): Promise<CoopMembership> {
    if (typeof input?.join !== 'boolean') {
      throw new BadRequestException('join (boolean) is required');
    }

    if (!input.join) {
      await this.supabase.admin.from('coop_memberships').upsert(
        {
          user_id: userId,
          active: false,
          cancel_at_period_end: false,
          cancelled_at: new Date().toISOString(),
          dues_paid_through: null,
          provider: input.provider ?? null,
          provider_subscription_id: input.providerSubscriptionId ?? null
        },
        { onConflict: 'user_id' }
      );
      await this.syncPlan(userId, false);
      return this.getMembership(userId);
    }

    const now = new Date();
    let paidThroughIso = input.paidThrough;
    if (!paidThroughIso) {
      const paidThrough = new Date(now);
      paidThrough.setUTCFullYear(paidThrough.getUTCFullYear() + 1);
      paidThroughIso = paidThrough.toISOString();
    }

    const { error } = await this.supabase.admin.from('coop_memberships').upsert(
      {
        user_id: userId,
        active: true,
        since: now.toISOString(),
        dues_paid_through: paidThroughIso,
        cancel_at_period_end: false,
        cancelled_at: null,
        provider: input.provider ?? 'soft',
        provider_subscription_id: input.providerSubscriptionId ?? null,
        stripe_customer_id: input.stripeCustomerId ?? null
      },
      { onConflict: 'user_id' }
    );
    if (error) throw error;

    // PAYMENT ledger: one row per confirmed join / renewal charge when we have
    // a provider ref (skip soft so demo noise does not fill the table).
    if (input.provider && input.provider !== 'soft') {
      await this.supabase.admin.from('payments').insert({
        user_id: userId,
        kind: 'coop_dues',
        amount: null,
        provider_ref: input.providerSubscriptionId ?? input.provider
      });
    }

    await this.syncPlan(userId, true);
    return this.getMembership(userId);
  }

  /** Quiet cancel: keep perks until dues_paid_through. */
  async cancelMembership(userId: string): Promise<CoopMembership> {
    await this.reconcileMembership(userId);
    const row = await this.loadMembership(userId);
    if (!row?.active) {
      throw new BadRequestException('Not an active member');
    }
    const { error } = await this.supabase.admin
      .from('coop_memberships')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    if (error) throw error;
    return this.getMembership(userId);
  }

  /**
   * Storage meter for Settings + Stories bar.
   * Co-op: used vs included GB (admin_config.storage). Overage price is soft-stub.
   * Free: rolling ~30-day story allotment (FREE_STORY_STORAGE_BYTES).
   */
  async getStorage(userId: string): Promise<{
    plan: 'free' | 'coop';
    usedPct: number;
    usedBytes: number;
    includedBytes: number;
    overageBytes: number;
    limitBytes: number | null;
    label: string;
    overagePriceLabel: string | null;
  }> {
    await this.reconcileMembership(userId);
    const plan = await this.loadPlan(userId);
    const isCoop = plan?.plan === 'coop';
    const usedBytes = Number(plan?.used_bytes ?? 0);
    const storageConfig = await this.loadStorageConfig();

    if (isCoop) {
      const includedBytes = includedBytesFromGb(storageConfig.includedGb);
      const meter = buildStorageMeter({ usedBytes, includedBytes });
      const usedPct = storageUsedPct(meter);
      const usedLabel = formatStorageBytes(meter.usedBytes);
      const includedLabel = formatStorageBytes(meter.includedBytes);
      return {
        plan: 'coop',
        usedPct,
        usedBytes: meter.usedBytes,
        includedBytes: meter.includedBytes,
        overageBytes: meter.overageBytes,
        limitBytes: meter.includedBytes,
        label: `${usedLabel} of ${includedLabel} included`,
        // Soft stub: show the price so members know overage is opt-in; no charge yet.
        overagePriceLabel: overagePriceLabel(storageConfig.overageCentsPerGb)
      };
    }

    // Free plan: meter by finished posts in the last 30 days, not raw media
    // rows. One scrapbook page can spawn many media files (photos + preview +
    // voice), so media*5% made a single post look ~45% full.
    // plans.used_bytes is not maintained for free, so ignore it here.
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 30);
    const { count } = await this.supabase.admin
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId)
      .gte('created_at', since.toISOString());
    // ~2% per post → about 50 posts (~a month of daily posting) before 100%.
    const usedPct = Math.min(100, (count ?? 0) * 2);
    const effectiveUsed = Math.round((usedPct / 100) * FREE_STORY_STORAGE_BYTES);

    const meter = buildStorageMeter({
      usedBytes: effectiveUsed,
      includedBytes: FREE_STORY_STORAGE_BYTES
    });

    return {
      plan: 'free',
      usedPct,
      usedBytes: meter.usedBytes,
      includedBytes: meter.includedBytes,
      overageBytes: meter.overageBytes,
      limitBytes: FREE_STORY_STORAGE_BYTES,
      label:
        usedPct >= 100
          ? 'Your free month is full. Older posts will roll off.'
          : 'Story media older than 30 days rolls off.',
      overagePriceLabel: null
    };
  }

  // THIS SECTION DOES: read included GB + overage stub price from admin_config.
  private async loadStorageConfig() {
    const { data } = await this.supabase.admin
      .from('admin_config')
      .select('storage')
      .limit(1)
      .maybeSingle();
    return parseStorageConfig(data?.storage);
  }

  /** Shared helper: reconcile first, then true only if still active. */
  async isActiveMember(userId: string): Promise<boolean> {
    const { row } = await this.reconcileMembership(userId);
    return !!row?.active;
  }

  /** Alias for isActiveMember — portal guards and older call sites. */
  async isMember(userId: string): Promise<boolean> {
    return this.isActiveMember(userId);
  }

  /** Read Stripe customer id for Checkout / Customer Portal. */
  async getStripeCustomerId(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.admin
      .from('coop_memberships')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data?.stripe_customer_id ?? null;
  }

  /**
   * Remember a Stripe customer id without changing active membership.
   * Creates a quiet inactive row if none exists yet.
   */
  async rememberStripeCustomer(
    userId: string,
    stripeCustomerId: string
  ): Promise<void> {
    const existing = await this.loadMembership(userId);
    if (existing) {
      const { error } = await this.supabase.admin
        .from('coop_memberships')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('user_id', userId);
      if (error) throw error;
      return;
    }
    const { error } = await this.supabase.admin.from('coop_memberships').insert({
      user_id: userId,
      active: false,
      stripe_customer_id: stripeCustomerId,
      dues_paid_through: null
    });
    if (error) throw error;
  }

  async memberCount(): Promise<number> {
    const { count } = await this.supabase.admin
      .from('coop_memberships')
      .select('user_id', { count: 'exact', head: true })
      .eq('active', true);
    return count ?? 0;
  }
}
