// ============================================
// WHAT THIS FILE DOES (plain English):
// Delight (easter-egg) helpers: list enabled plugins, see pending gift
// triggers for the current user, send a gift, and mark one as played.
// ============================================
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import type { DelightEntry, DelightTrigger } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DelightService {
  constructor(private readonly supabase: SupabaseService) {}

  // --- Enabled delights (optionally within a schedule window) ---

  async listActive(): Promise<DelightEntry[]> {
    const { data, error } = await this.supabase.admin
      .from('delights')
      .select('*')
      .eq('enabled', true)
      .order('name', { ascending: true });
    if (error) throw error;

    const now = Date.now();
    return (data ?? [])
      .filter((d) => this.inSchedule(d.schedule, now))
      .map((d) => ({
        id: d.id,
        slug: d.slug ?? d.id,
        name: d.name,
        enabled: d.enabled,
        scope: d.scope,
        schedule: (d.schedule as { from?: string; to?: string }) ?? undefined
      }));
  }

  private inSchedule(schedule: unknown, nowMs: number): boolean {
    if (!schedule || typeof schedule !== 'object') return true;
    const s = schedule as { from?: string; to?: string };
    if (s.from) {
      const from = Date.parse(s.from);
      if (!Number.isNaN(from) && nowMs < from) return false;
    }
    if (s.to) {
      const to = Date.parse(s.to);
      if (!Number.isNaN(to) && nowMs > to) return false;
    }
    return true;
  }

  // --- Pending gifts for the current user ---

  async listTriggers(userId: string): Promise<DelightTrigger[]> {
    const { data, error } = await this.supabase.admin
      .from('delight_triggers')
      .select('*, delights ( slug )')
      .eq('to_user_id', userId)
      .eq('played', false)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return (data ?? []).map((t) => {
      const joined = t.delights as { slug: string | null } | null;
      return {
        id: t.id,
        delightId: t.delight_id,
        delightSlug: joined?.slug ?? undefined,
        fromUserId: t.from_user_id,
        toUserId: t.to_user_id,
        played: t.played
      };
    });
  }

  // --- Send a gift delight to someone ---

  async createTrigger(
    fromUserId: string,
    body: { delightId: string; toUserId: string }
  ): Promise<DelightTrigger> {
    if (!body?.delightId || !body?.toUserId) {
      throw new BadRequestException('delightId and toUserId are required');
    }

    const { data: delight, error: dErr } = await this.supabase.admin
      .from('delights')
      .select('id, slug, enabled')
      .eq('id', body.delightId)
      .maybeSingle();
    if (dErr) throw dErr;
    if (!delight) throw new NotFoundException('Delight not found');
    if (!delight.enabled) {
      throw new BadRequestException('This delight is not enabled');
    }

    const { data, error } = await this.supabase.admin
      .from('delight_triggers')
      .insert({
        delight_id: body.delightId,
        from_user_id: fromUserId,
        to_user_id: body.toUserId,
        played: false
      })
      .select('*')
      .single();
    if (error) throw error;

    return {
      id: data.id,
      delightId: data.delight_id,
      delightSlug: delight.slug ?? undefined,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      played: data.played
    };
  }

  // --- Mark a gift as played (recipient only) ---

  async markPlayed(userId: string, triggerId: string) {
    const { data, error } = await this.supabase.admin
      .from('delight_triggers')
      .update({ played: true })
      .eq('id', triggerId)
      .eq('to_user_id', userId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new NotFoundException(
        'Trigger not found or not addressed to you'
      );
    }

    return {
      id: data.id,
      delightId: data.delight_id,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      played: data.played
    };
  }
}
