// ============================================
// WHAT THIS FILE DOES (plain English):
// Delight helpers: list live standalone plugins, pending gift triggers, send a
// gift (friends only), and mark one played after it animates.
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

  // THIS SECTION DOES: map a DB row into the shared DelightEntry shape.
  private mapEntry(d: {
    id: string;
    slug: string | null;
    name: string;
    status?: string | null;
    kind?: string | null;
    notes?: string | null;
    enabled: boolean;
    scope: DelightEntry['scope'];
    schedule: unknown;
  }): DelightEntry {
    return {
      id: d.id,
      slug: d.slug ?? d.id,
      name: d.name,
      status: (d.status as DelightEntry['status']) ?? 'idea',
      kind: (d.kind as DelightEntry['kind']) ?? 'standalone',
      notes: d.notes ?? '',
      enabled: d.enabled,
      scope: d.scope,
      schedule: (d.schedule as { from?: string; to?: string }) ?? undefined
    };
  }

  // --- Live standalone delights the host may mount ---

  async listActive(): Promise<DelightEntry[]> {
    const { data, error } = await this.supabase.admin
      .from('delights')
      .select('*')
      .eq('enabled', true)
      .eq('status', 'live')
      .eq('kind', 'standalone')
      .order('name', { ascending: true });
    if (error) throw error;

    const now = Date.now();
    return (data ?? [])
      .filter((d) => this.inSchedule(d.schedule, now))
      .map((d) => this.mapEntry(d));
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

    const fromIds = [...new Set((data ?? []).map((t) => t.from_user_id))];
    const nameById = await this.firstNamesFor(fromIds);

    return (data ?? []).map((t) => {
      const joined = t.delights as { slug: string | null } | null;
      return {
        id: t.id,
        delightId: t.delight_id,
        delightSlug: joined?.slug ?? undefined,
        fromUserId: t.from_user_id,
        toUserId: t.to_user_id,
        played: t.played,
        fromName: nameById.get(t.from_user_id)
      };
    });
  }

  // THIS SECTION DOES: look up first names for gift attribution (UI only).
  private async firstNamesFor(userIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (!userIds.length) return map;
    const { data, error } = await this.supabase.admin
      .from('user_identity')
      .select('user_id, display_name')
      .in('user_id', userIds);
    if (error) throw error;
    for (const u of data ?? []) {
      const first = (u.display_name ?? '').trim().split(/\s+/)[0];
      if (first) map.set(u.user_id, first);
    }
    return map;
  }

  // --- Send a gift delight to a friend ---

  async createTrigger(
    fromUserId: string,
    body: { delightId: string; toUserId: string }
  ): Promise<DelightTrigger> {
    if (!body?.delightId || !body?.toUserId) {
      throw new BadRequestException('delightId and toUserId are required');
    }
    if (fromUserId === body.toUserId) {
      throw new BadRequestException('You cannot gift yourself');
    }

    const { data: delight, error: dErr } = await this.supabase.admin
      .from('delights')
      .select('id, slug, enabled, status, kind, scope')
      .eq('id', body.delightId)
      .maybeSingle();
    if (dErr) throw dErr;
    if (!delight) throw new NotFoundException('Delight not found');
    if (
      delight.kind !== 'standalone' ||
      delight.status !== 'live' ||
      !delight.enabled ||
      delight.scope !== 'gift'
    ) {
      throw new BadRequestException('This delight is not available to send');
    }

    const friends = await this.friendIdsOf(fromUserId);
    if (!friends.has(body.toUserId)) {
      throw new BadRequestException('You can only gift friends');
    }

    const { data: existing, error: exErr } = await this.supabase.admin
      .from('delight_triggers')
      .select('id')
      .eq('delight_id', body.delightId)
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', body.toUserId)
      .eq('played', false)
      .maybeSingle();
    if (exErr) throw exErr;
    if (existing) {
      throw new BadRequestException('Already waiting to play');
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

    // THIS SECTION DOES: tell the recipient something fun is waiting (Home).
    const { error: nErr } = await this.supabase.admin.from('notifications').insert({
      user_id: body.toUserId,
      kind: 'delight_gift',
      payload: {
        delightId: delight.id,
        delightSlug: delight.slug,
        fromUserId
      } as never
    });
    if (nErr) throw nErr;

    const names = await this.firstNamesFor([fromUserId]);
    return {
      id: data.id,
      delightId: data.delight_id,
      delightSlug: delight.slug ?? undefined,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      played: data.played,
      fromName: names.get(fromUserId)
    };
  }

  // THIS SECTION DOES: accepted friends both ways, minus blocks.
  private async friendIdsOf(userId: string): Promise<Set<string>> {
    const { data: rows, error } = await this.supabase.admin
      .from('connections')
      .select('user_a, user_b')
      .eq('status', 'accepted')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    if (error) throw error;

    const otherIds = (rows ?? []).map((r) =>
      r.user_a === userId ? r.user_b : r.user_a
    );

    const { data: blocks, error: bErr } = await this.supabase.admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    if (bErr) throw bErr;

    const blocked = new Set<string>();
    for (const b of blocks ?? []) {
      blocked.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id);
    }

    return new Set(otherIds.filter((id) => !blocked.has(id)));
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
