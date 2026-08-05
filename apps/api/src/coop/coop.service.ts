// ============================================
// WHAT THIS FILE DOES (plain English):
// Co-op reads/writes for the app: published announcements, and whether the
// signed-in person is a member (join / leave). Dues display is a placeholder
// until real billing lands.
// ============================================
import { BadRequestException, Injectable } from '@nestjs/common';
import type { CoopAnnouncement, CoopMembership } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CoopService {
  constructor(private readonly supabase: SupabaseService) {}

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
      // Mobile widget uses "action" as the CTA copy alias.
      action: a.cta_label ?? undefined
    }));
  }

  // --- Membership status for the current user ---

  async getMembership(userId: string): Promise<CoopMembership> {
    const { data, error } = await this.supabase.admin
      .from('coop_memberships')
      .select('active, since')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;

    const member = !!data?.active;
    return {
      member,
      since: member ? data?.since : undefined,
      // Placeholder until IAP / billing wires real dues.
      dues: '$0'
    };
  }

  async setMembership(
    userId: string,
    body: { join: boolean }
  ): Promise<CoopMembership> {
    if (typeof body?.join !== 'boolean') {
      throw new BadRequestException('join (boolean) is required');
    }

    const now = new Date().toISOString();
    const { data, error } = await this.supabase.admin
      .from('coop_memberships')
      .upsert(
        {
          user_id: userId,
          active: body.join,
          // Keep "since" on re-join; first insert gets now via default / this set.
          ...(body.join ? { since: now } : {})
        },
        { onConflict: 'user_id' }
      )
      .select('active, since')
      .single();
    if (error) throw error;

    return {
      member: data.active,
      since: data.active ? data.since : undefined,
      dues: '$0'
    };
  }
}
