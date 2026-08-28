// ============================================
// WHAT THIS FILE DOES (plain English):
// The server side of connecting people: list your accepted friends, pending
// requests, invite links / QR codes, redeeming those (instant friends), saving
// how you met, removing a friend, and blocking.
//
// SECURITY: the API uses the service-role key (bypasses row-level security), so
// every read re-checks blocks by hand. Caps and tiers go through TiersService.
//
// PRIVACY: how-you-met place is coarse only; notes stay between the two people;
// blocking is silent and removes the person as a mutual bridge (Discover will
// enforce graph-bridge exclusion when matching ships).
// ============================================
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type {
  ApprovalRequest,
  HowYouMet,
  MeetContext,
  Person,
  Tier
} from '@bridger/shared';
import { MatchingFeedbackService } from '../matching/matching-feedback.service';
import { DemoWeekService } from '../demo-week/demo-week.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SupabaseService } from '../supabase/supabase.service';
import { TiersService } from '../tiers/tiers.service';

/** One person on the Friends roster (accepted connection). */
export type ConnectionPersonDto = {
  id: string;
  name: string;
  avatarUrl: string | null;
  tier: Tier;
  mutuals: number;
};

@Injectable()
export class ConnectionsService {
  private readonly mediaBucket: string;
  private readonly signedUrlTtl = 60 * 60;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly tiers: TiersService,
    private readonly matchingFeedback: MatchingFeedbackService,
    private readonly demoWeek: DemoWeekService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService
  ) {
    this.mediaBucket =
      this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'media';
  }

  // THIS SECTION DOES: turn a stored media id into a short-lived photo URL
  // the app can put in an Avatar (never send the raw storage path).
  private async signAvatarMediaIds(
    mediaIds: Array<string | null | undefined>
  ): Promise<Map<string, string>> {
    const ids = [...new Set(mediaIds.filter((id): id is string => !!id))];
    const out = new Map<string, string>();
    if (ids.length === 0) return out;
    const { data: mediaRows, error } = await this.supabase.admin
      .from('media')
      .select('id, storage_path')
      .in('id', ids);
    if (error || !mediaRows?.length) return out;
    await Promise.all(
      mediaRows.map(async (row) => {
        if (!row.storage_path) return;
        const { data, error: signErr } = await this.supabase.admin.storage
          .from(this.mediaBucket)
          .createSignedUrl(row.storage_path, this.signedUrlTtl);
        if (!signErr && data?.signedUrl) out.set(row.id, data.signedUrl);
      })
    );
    return out;
  }

  // --- helpers ---

  /** Is there a block either direction between two people? */
  private async isBlocked(a: string, b: string): Promise<boolean> {
    const { data, error } = await this.supabase.admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(
        `and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`
      );
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }

  /** Find the connection row for a pair (either order). */
  private async findPair(a: string, b: string) {
    const { data, error } = await this.supabase.admin
      .from('connections')
      .select('*')
      .or(`and(user_a.eq.${a},user_b.eq.${b}),and(user_a.eq.${b},user_b.eq.${a})`)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Quiet-remove the connection + both tiers for a pair. */
  private async wipeConnectionAndTiers(me: string, other: string): Promise<void> {
    const pair = await this.findPair(me, other);
    if (pair) {
      const { error } = await this.supabase.admin
        .from('connections')
        .delete()
        .eq('id', pair.id);
      if (error) throw error;
    }
    const { error: t1 } = await this.supabase.admin
      .from('tiers')
      .delete()
      .eq('user_id', me)
      .eq('other_id', other);
    if (t1) throw t1;
    const { error: t2 } = await this.supabase.admin
      .from('tiers')
      .delete()
      .eq('user_id', other)
      .eq('other_id', me);
    if (t2) throw t2;
  }

  private formatDate(iso: string | null | undefined): string {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // --- LIST accepted friends ---

  async list(userId: string): Promise<ConnectionPersonDto[]> {
    const { data: rows, error } = await this.supabase.admin
      .from('connections')
      .select('id, user_a, user_b')
      .eq('status', 'accepted')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    if (error) throw error;
    if (!rows?.length) return [];

    const otherIds = rows.map((r) =>
      r.user_a === userId ? r.user_b : r.user_a
    );

    // Drop anyone blocked either way.
    const { data: blocks, error: bErr } = await this.supabase.admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    if (bErr) throw bErr;
    const blocked = new Set<string>();
    for (const b of blocks ?? []) {
      blocked.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id);
    }
    const visibleIds = otherIds.filter((id) => !blocked.has(id));
    if (visibleIds.length === 0) return [];

    const { data: identities, error: iErr } = await this.supabase.admin
      .from('user_identity')
      .select('user_id, display_name, avatar_media_id')
      .in('user_id', visibleIds);
    if (iErr) throw iErr;
    const nameById = new Map(
      (identities ?? []).map((i) => [i.user_id, i.display_name ?? 'Friend'])
    );
    const avatarMediaByUser = new Map(
      (identities ?? []).map((i) => [i.user_id, i.avatar_media_id as string | null])
    );
    // Resolve media ids → signed https URLs so Avatars can actually load.
    const signedByMediaId = await this.signAvatarMediaIds(
      [...avatarMediaByUser.values()]
    );

    const { data: tierRows, error: tErr } = await this.supabase.admin
      .from('tiers')
      .select('other_id, tier')
      .eq('user_id', userId)
      .in('other_id', visibleIds);
    if (tErr) throw tErr;
    const tierById = new Map(
      (tierRows ?? []).map((t) => [t.other_id, t.tier as Tier])
    );

    // Mutuals: for each other, count shared accepted neighbors with me.
    // TODO: optimize with an RPC once the roster grows.
    const mySet = new Set(visibleIds);
    const mutualsById = new Map<string, number>();
    for (const other of visibleIds) {
      const { data: theirConns, error: cErr } = await this.supabase.admin
        .from('connections')
        .select('user_a, user_b')
        .eq('status', 'accepted')
        .or(`user_a.eq.${other},user_b.eq.${other}`);
      if (cErr) throw cErr;
      let n = 0;
      for (const c of theirConns ?? []) {
        const neighbor = c.user_a === other ? c.user_b : c.user_a;
        if (neighbor !== userId && mySet.has(neighbor)) n += 1;
      }
      mutualsById.set(other, n);
    }

    return visibleIds.map((id) => {
      const mediaId = avatarMediaByUser.get(id);
      return {
        id,
        name: nameById.get(id) ?? 'Friend',
        avatarUrl: mediaId ? signedByMediaId.get(mediaId) ?? null : null,
        tier: tierById.get(id) ?? 'acquaintance',
        mutuals: mutualsById.get(id) ?? 0
      };
    });
  }

  // --- REQUESTS ---

  async listRequests(userId: string): Promise<ApprovalRequest[]> {
    const { data, error } = await this.supabase.admin
      .from('connections')
      .select('id, user_a, mutual_friend_id, created_at')
      .eq('user_b', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      personId: r.user_a,
      viaFriendId: r.mutual_friend_id ?? undefined,
      createdAt: r.created_at
    }));
  }

  async createPending(
    userId: string,
    body: { targetId: string; madeVia?: string; viaFriendId?: string }
  ): Promise<{ ok: true }> {
    const targetId = body.targetId;
    if (!targetId || targetId === userId) {
      throw new BadRequestException('Invalid target');
    }
    if (await this.isBlocked(userId, targetId)) {
      throw new ConflictException('Blocked');
    }
    const existing = await this.findPair(userId, targetId);
    if (existing) {
      throw new ConflictException('Connection already exists');
    }

    const madeVia =
      body.madeVia === 'suggestion' ||
      body.madeVia === 'link' ||
      body.madeVia === 'qr' ||
      body.madeVia === 'add'
        ? body.madeVia
        : 'add';

    const { error } = await this.supabase.admin.from('connections').insert({
      user_a: userId,
      user_b: targetId,
      status: 'pending',
      made_via: madeVia,
      mutual_friend_id: body.viaFriendId ?? null
    });
    if (error) throw error;

    // Prefs gate: skip when they turned connection requests off.
    await this.notifications.notifyIfAllowed({
      userId: targetId,
      kind: 'connect_request',
      payload: { from: userId } as never
    });

    return { ok: true };
  }

  async acceptRequest(
    userId: string,
    requestId: string
  ): Promise<{ personId: string }> {
    const { data, error } = await this.supabase.admin
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('user_b', userId)
      .eq('status', 'pending')
      .select('user_a')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Request not found');

    const { error: nErr } = await this.supabase.admin.from('notifications').insert({
      user_id: data.user_a,
      kind: 'connection_accepted',
      payload: { from: userId } as never
    });
    if (nErr) throw nErr;

    await this.matchingFeedback
      .recordOutcome({
        userA: userId,
        userB: data.user_a,
        outcome: 'added',
        surface: 'discover'
      })
      .catch(() => undefined);

    return { personId: data.user_a };
  }

  async declineRequest(userId: string, requestId: string): Promise<{ ok: true }> {
    const { data, error } = await this.supabase.admin
      .from('connections')
      .delete()
      .eq('id', requestId)
      .eq('user_b', userId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Request not found');
    return { ok: true };
  }

  // --- INVITE LINK / QR / REDEEM ---

  async createInviteLink(userId: string): Promise<{ token: string; url: string }> {
    await this.assertInviteAllowed(userId);
    const token = randomUUID();
    const { error } = await this.supabase.admin.from('invite_links').insert({
      token,
      owner_id: userId,
      expires_at: null
    });
    if (error) throw error;
    const base = (process.env.APP_LINK_BASE ?? '').replace(/\/$/, '');
    const url = base ? `${base}/invite/${token}` : `bridger://invite/${token}`;
    return { token, url };
  }

  async createQrToken(userId: string): Promise<{ token: string; url: string }> {
    await this.assertInviteAllowed(userId);
    const token = randomUUID();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);
    const { error } = await this.supabase.admin.from('qr_tokens').insert({
      token,
      owner_id: userId,
      expires_at: expires.toISOString()
    });
    if (error) throw error;
    const base = (process.env.APP_LINK_BASE ?? '').replace(/\/$/, '');
    const path = base ? `${base}/invite/${token}` : `bridger://invite/${token}`;
    const url = `${path}?via=qr`;
    return { token, url };
  }

  async redeem(
    userId: string,
    body: { token: string; kind: 'link' | 'qr' }
  ): Promise<{ personId: string }> {
    const kind = body.kind === 'qr' ? 'qr' : 'link';
    const token = body.token?.trim();
    if (!token) throw new BadRequestException('Missing token');

    let ownerId: string | null = null;
    if (kind === 'link') {
      const { data, error } = await this.supabase.admin
        .from('invite_links')
        .select('owner_id, expires_at')
        .eq('token', token)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new NotFoundException('Invite not found');
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new BadRequestException('Invite expired');
      }
      ownerId = data.owner_id;
    } else {
      const { data, error } = await this.supabase.admin
        .from('qr_tokens')
        .select('owner_id, expires_at')
        .eq('token', token)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new NotFoundException('QR not found');
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new BadRequestException('QR expired');
      }
      ownerId = data.owner_id;
    }

    if (!ownerId || ownerId === userId) {
      throw new BadRequestException('Cannot redeem your own invite');
    }
    if (await this.isBlocked(userId, ownerId)) {
      throw new ConflictException('Blocked');
    }

    const existing = await this.findPair(userId, ownerId);
    if (existing?.status === 'accepted') {
      // Already friends — still send them to reveal.
      if (kind === 'qr') {
        await this.supabase.admin.from('qr_tokens').delete().eq('token', token);
      }
      return { personId: ownerId };
    }
    if (existing) {
      // Pending → flip to accepted (both parties acted via redeem).
      const { error: upErr } = await this.supabase.admin
        .from('connections')
        .update({ status: 'accepted', made_via: kind })
        .eq('id', existing.id);
      if (upErr) throw upErr;
    } else {
      const { error: insErr } = await this.supabase.admin.from('connections').insert({
        user_a: userId,
        user_b: ownerId,
        status: 'accepted',
        made_via: kind
      });
      if (insErr) throw insErr;
    }

    if (kind === 'qr') {
      await this.supabase.admin.from('qr_tokens').delete().eq('token', token);
    }

    // Demo week: invitees may use the app but cannot invite others.
    await this.demoWeek.markJoinedViaInvite(userId);

    // THIS SECTION DOES: tell the person who shared the invite that their
    // friend joined (same in-app row as accepting a request). Copy says
    // "Joined from your invite."
    try {
      await this.supabase.admin.from('notifications').insert({
        user_id: ownerId,
        kind: 'connection_accepted',
        payload: { from: userId, via: 'invite' } as never,
        read: false
      });
    } catch {
      // Never fail redeem because the alert row could not write.
    }

    return { personId: ownerId };
  }

  /** Demo week blocks invite links for people who joined via someone else. */
  private async assertInviteAllowed(userId: string): Promise<void> {
    try {
      await this.demoWeek.assertCanCreateInvite(userId);
    } catch {
      throw new ForbiddenException(
        'Invites are paused during the demo. Ask your friend to add you, or wait until the public launch.'
      );
    }
  }

  // --- HOW YOU MET ---

  async saveHowYouMet(
    userId: string,
    personId: string,
    body: {
      context: MeetContext;
      recordPlace: boolean;
      meetNote?: string;
      tier?: Tier | null;
      placeLabel?: string;
      viaFriendId?: string;
    }
  ): Promise<{ tier: Tier; recordedWhere: boolean; addedNote: boolean }> {
    const pair = await this.findPair(userId, personId);
    if (!pair || pair.status !== 'accepted') {
      throw new NotFoundException('Connection not found');
    }

    // SECURITY: just-met always starts as Acquaintances.
    const desiredTier: Tier =
      body.context === 'just-met'
        ? 'acquaintance'
        : body.tier === 'close' || body.tier === 'friend' || body.tier === 'acquaintance'
          ? body.tier
          : 'friend';

    const { landedIn } = await this.tiers.setTier(userId, personId, desiredTier);

    const note = body.meetNote?.trim().slice(0, 200) ?? '';
    const addedNote = note.length > 0;
    const patch: Record<string, unknown> = {
      met_at: new Date().toISOString()
    };

    if (body.viaFriendId) {
      patch.met_context = 'mutual';
      patch.mutual_friend_id = body.viaFriendId;
    }
    if (body.recordPlace) {
      // PRIVACY: coarse place only — never GPS / street.
      patch.met_context = patch.met_context ?? 'place';
      patch.met_place_label = (body.placeLabel ?? 'Nearby').slice(0, 80);
    }
    if (addedNote) {
      patch.met_note = note;
    }

    const { error } = await this.supabase.admin
      .from('connections')
      .update(patch as never)
      .eq('id', pair.id);
    if (error) throw error;

    return {
      tier: landedIn,
      recordedWhere: !!body.recordPlace,
      addedNote
    };
  }

  async getHowYouMet(userId: string, personId: string): Promise<HowYouMet[]> {
    const pair = await this.findPair(userId, personId);
    if (!pair) return [];

    const date = this.formatDate(pair.met_at ?? pair.created_at);
    const out: HowYouMet[] = [];

    if (pair.mutual_friend_id) {
      const { data: via } = await this.supabase.admin
        .from('user_identity')
        .select('display_name')
        .eq('user_id', pair.mutual_friend_id)
        .maybeSingle();
      out.push({
        kind: 'via',
        label: via?.display_name ?? 'a friend',
        date
      });
    }

    if (pair.met_place_label) {
      out.push({
        kind: 'place',
        label: pair.met_place_label,
        date,
        approximate: true
      });
    }

    if (pair.met_note) {
      out.push({
        kind: 'note',
        label: pair.met_note,
        date
      });
    }

    if (pair.met_event_id) {
      const { data: event } = await this.supabase.admin
        .from('events')
        .select('title')
        .eq('id', pair.met_event_id)
        .maybeSingle();
      out.push({
        kind: 'event',
        label: event?.title ?? 'an event',
        date
      });
    }

    return out;
  }

  // --- REMOVE ---

  async remove(userId: string, personId: string): Promise<{ ok: true }> {
    await this.wipeConnectionAndTiers(userId, personId);
    // Learning: removed friendship is a strong negative (domain table, not analytics).
    await this.matchingFeedback
      .recordOutcome({
        userA: userId,
        userB: personId,
        outcome: 'removed'
      })
      .catch(() => undefined);
    return { ok: true };
  }

  // --- BLOCK ---

  async listBlocked(userId: string): Promise<Person[]> {
    const { data, error } = await this.supabase.admin
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);
    if (error) throw error;
    const ids = (data ?? []).map((b) => b.blocked_id);
    if (ids.length === 0) return [];

    const { data: identities, error: iErr } = await this.supabase.admin
      .from('user_identity')
      .select('user_id, display_name')
      .in('user_id', ids);
    if (iErr) throw iErr;
    const nameById = new Map(
      (identities ?? []).map((i) => [i.user_id, i.display_name ?? 'Person'])
    );

    // Minimal Person shape for Settings → Blocked (no vanity fields).
    return ids.map((id) => ({
      id,
      name: nameById.get(id) ?? 'Person',
      handle: '',
      emoji: '🙂',
      accent: 'purple' as const,
      tier: 'acquaintance' as const,
      label: '',
      mutuals: 0
    }));
  }

  async block(userId: string, personId: string): Promise<{ ok: true }> {
    if (!personId || personId === userId) {
      throw new BadRequestException('Invalid person');
    }

    // Insert the hard wall.
    const { error: bErr } = await this.supabase.admin.from('blocks').upsert(
      { blocker_id: userId, blocked_id: personId },
      { onConflict: 'blocker_id,blocked_id' }
    );
    if (bErr) throw bErr;

    // Wipe the friendship both ways.
    await this.wipeConnectionAndTiers(userId, personId);

    // Soft "don't suggest" both directions so matching never re-surfaces them.
    // Graph-bridge exclusion in Discover is enforced when matching ships.
    const { error: s1 } = await this.supabase.admin.from('suggestion_skips').upsert(
      { blocker_id: userId, skipped_id: personId },
      { onConflict: 'blocker_id,skipped_id' }
    );
    if (s1) throw s1;
    const { error: s2 } = await this.supabase.admin.from('suggestion_skips').upsert(
      { blocker_id: personId, skipped_id: userId },
      { onConflict: 'blocker_id,skipped_id' }
    );
    if (s2) throw s2;

    // Learning: block is the strongest negative; retroactively supersedes prior rows.
    await this.matchingFeedback
      .recordOutcome({
        userA: userId,
        userB: personId,
        outcome: 'blocked'
      })
      .catch(() => undefined);

    return { ok: true };
  }

  async unblock(userId: string, personId: string): Promise<{ ok: true }> {
    const { error } = await this.supabase.admin
      .from('blocks')
      .delete()
      .eq('blocker_id', userId)
      .eq('blocked_id', personId);
    if (error) throw error;
    // Unblock never auto-reconnects.
    return { ok: true };
  }
}
