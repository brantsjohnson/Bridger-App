// ============================================
// WHAT THIS FILE DOES (plain English):
// Reads the admin "demo week" window and each person's invite-access flags.
// During demo week, seed users must invite someone to use the app; people who
// joined via invite cannot create new invite links.
// ============================================
import { Injectable } from '@nestjs/common';
import {
  type DemoWeekConfig,
  type InviteAccessStatus,
  DEFAULT_DEMO_WEEK,
  isDemoWeekActive,
  parseDemoWeekConfig
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DemoWeekService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Load demo week config from admin_config (or defaults). */
  async getConfig(): Promise<DemoWeekConfig> {
    const { data, error } = await this.supabase.admin
      .from('admin_config')
      .select('demo_week')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return parseDemoWeekConfig(data?.demo_week ?? DEFAULT_DEMO_WEEK);
  }

  /** Save demo week config (admin console). */
  async putConfig(config: DemoWeekConfig): Promise<DemoWeekConfig> {
    const row = await this.getOrCreateAdminRow();
    const payload = {
      enabled: !!config.enabled,
      starts_at: config.startsAt ?? null,
      ends_at: config.endsAt ?? null
    };
    const { error } = await this.supabase.admin
      .from('admin_config')
      .update({ demo_week: payload })
      .eq('id', row.id);
    if (error) throw error;
    return parseDemoWeekConfig(payload);
  }

  /** Is demo week on right now? */
  async isActive(at: Date = new Date()): Promise<boolean> {
    const config = await this.getConfig();
    return isDemoWeekActive(config, at);
  }

  /** Invite-access snapshot for the signed-in user. */
  async getAccessStatus(userId: string): Promise<InviteAccessStatus> {
    const config = await this.getConfig();
    const demoWeekActive = isDemoWeekActive(config);

    const { data: settings } = await this.supabase.admin
      .from('user_settings')
      .select('can_invite, demo_invite_sent_at')
      .eq('user_id', userId)
      .maybeSingle();

    const canInvite = settings?.can_invite !== false;
    const demoInviteSent = !!settings?.demo_invite_sent_at;

    const friendCount = await this.countAcceptedFriends(userId);

    let accessGranted = true;
    if (demoWeekActive) {
      accessGranted = friendCount > 0 || demoInviteSent;
    }

    return {
      demoWeekActive,
      canInvite: demoWeekActive ? canInvite : true,
      friendCount,
      accessGranted,
      demoInviteSent
    };
  }

  /** Record that this person sent an invite during demo week (unlocks access). */
  async markDemoInviteSent(userId: string): Promise<void> {
    const { error } = await this.supabase.admin.from('user_settings').upsert(
      {
        user_id: userId,
        demo_invite_sent_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
  }

  /**
   * After redeeming someone's invite during demo week, this person may use the
   * app (they are connected) but cannot invite others until demo week ends.
   */
  async markJoinedViaInvite(userId: string): Promise<void> {
    const active = await this.isActive();
    if (!active) return;
    const { error } = await this.supabase.admin.from('user_settings').upsert(
      {
        user_id: userId,
        can_invite: false
      },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
  }

  /** Block invite-link creation when demo week is on and can_invite is false. */
  async assertCanCreateInvite(userId: string): Promise<void> {
    const status = await this.getAccessStatus(userId);
    if (status.demoWeekActive && !status.canInvite) {
      throw new Error('INVITE_LOCKED_DEMO_WEEK');
    }
  }

  private async countAcceptedFriends(userId: string): Promise<number> {
    const { count, error } = await this.supabase.admin
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    if (error) throw error;
    return count ?? 0;
  }

  private async getOrCreateAdminRow() {
    const { data, error } = await this.supabase.admin
      .from('admin_config')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
    const { data: created, error: createError } = await this.supabase.admin
      .from('admin_config')
      .insert({
        home_defaults: { layout: [] },
        themed_prompts: [],
        demo_week: DEFAULT_DEMO_WEEK
      })
      .select('id')
      .single();
    if (createError) throw createError;
    return created;
  }
}
