// ============================================
// WHAT THIS FILE DOES (plain English):
// Co-op membership + announcements. Joining syncs plan_state. Cancel is
// period-end: perks stay until dues_paid_through, then reconcile flips to free
// (rolling ~30-day story storage).
//
// PAYMENT: soft-join sets provisional dues_paid_through; real IAP goes through
// PurchaseGateway later. Display dues are always "$24/year".
// ============================================
import { BadRequestException, Injectable } from '@nestjs/common';
import type { CoopAnnouncement, CoopMembership } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

const DISPLAY_DUES = '$24/year';
const FREE_STORY_BYTES = 500_000_000;

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
          close: null,
          friend: null,
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
        close: 10,
        friend: 25,
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
    if (typeof body?.join !== 'boolean') {
      throw new BadRequestException('join (boolean) is required');
    }

    if (!body.join) {
      // Immediate leave (legacy / admin). Prefer cancelMembership for UX.
      await this.supabase.admin.from('coop_memberships').upsert(
        {
          user_id: userId,
          active: false,
          cancel_at_period_end: false,
          cancelled_at: new Date().toISOString(),
          dues_paid_through: null
        },
        { onConflict: 'user_id' }
      );
      await this.syncPlan(userId, false);
      return this.getMembership(userId);
    }

    const now = new Date();
    const paidThrough = new Date(now);
    paidThrough.setUTCFullYear(paidThrough.getUTCFullYear() + 1);

    const { error } = await this.supabase.admin.from('coop_memberships').upsert(
      {
        user_id: userId,
        active: true,
        since: now.toISOString(),
        dues_paid_through: paidThrough.toISOString(),
        cancel_at_period_end: false,
        cancelled_at: null
      },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
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

  /** Story storage bar for Profile calendar. */
  async getStorage(userId: string): Promise<{
    plan: 'free' | 'coop';
    usedPct: number;
    usedBytes: number;
    limitBytes: number | null;
    label: string;
  }> {
    await this.reconcileMembership(userId);
    const plan = await this.loadPlan(userId);
    const isCoop = plan?.plan === 'coop';
    const usedBytes = Number(plan?.used_bytes ?? 0);

    if (isCoop) {
      return {
        plan: 'coop',
        usedPct: 0,
        usedBytes,
        limitBytes: null,
        label: 'Members keep everything'
      };
    }

    let usedPct = 0;
    if (usedBytes > 0) {
      usedPct = Math.min(
        100,
        Math.round((usedBytes / FREE_STORY_BYTES) * 100)
      );
    } else {
      const since = new Date();
      since.setUTCDate(since.getUTCDate() - 30);
      const { count } = await this.supabase.admin
        .from('media')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .gte('created_at', since.toISOString());
      usedPct = Math.min(100, (count ?? 0) * 5);
    }

    return {
      plan: 'free',
      usedPct,
      usedBytes,
      limitBytes: FREE_STORY_BYTES,
      label:
        usedPct >= 100
          ? 'Your free month is full. Older posts will roll off.'
          : 'Story media older than 30 days rolls off.'
    };
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

  async memberCount(): Promise<number> {
    const { count } = await this.supabase.admin
      .from('coop_memberships')
      .select('user_id', { count: 'exact', head: true })
      .eq('active', true);
    return count ?? 0;
  }
}
