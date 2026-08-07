// ============================================
// WHAT THIS FILE DOES (plain English):
// Events on the server: create a hang, invite friends, RSVP, and snag
// Assignments (chips / drinks / etc.). Matching-powered "who you should meet"
// and FoF invite suggestions stay empty until matching ships.
//
// SECURITY: service-role bypasses RLS — every read re-checks host / co-host /
// invite. Caps: free 35, co-op 100. Hosting is never paywalled.
// PRIVACY: address only for host/co-host/invitees; allergies host-only;
// chip-in is a plain handle we never process (PAYMENT: peer-to-peer only).
// ============================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  Cover,
  EventAssignment,
  EventItem,
  EventRole,
  MeetSuggestion
} from '@bridger/shared';
import { accentForId, isBlocked } from '../common/visibility';
import { CoopService } from '../coop/coop.service';
import { MatchingEventService } from '../matching/matching-event.service';
import { SupabaseService } from '../supabase/supabase.service';

const CHIP_METHODS = [
  'Venmo',
  'Cash App',
  'PayPal',
  'Zelle',
  'Cash in person'
] as const;

type ChipMethod = (typeof CHIP_METHODS)[number];

type ChipInJson = {
  amount?: string;
  note?: string;
  methods?: Array<{ kind: string; handle: string }>;
};

type CoverStored =
  | { kind: 'emoji'; value: string; bg?: string }
  | { kind: 'photo'; mediaId: string; bannerText?: string }
  | { kind: 'text'; value: string; bg: string }
  | { kind: 'color'; bg: string };

type EventRow = {
  id: string;
  host_id: string;
  co_host_ids: string[];
  title: string;
  bio: string | null;
  starts_at: string | null;
  address: string | null;
  place: string | null;
  chip_in: ChipInJson | null;
  allow_friends_invite: boolean;
  cap: number;
  cover: CoverStored | null;
  created_at: string;
};

type InviteRow = {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'cant' | 'invited';
  allergies_optin: boolean;
  allergies_text: string | null;
};

type AssignmentRow = {
  id: string;
  event_id: string;
  label: string;
  assignee_id: string | null;
  done: boolean;
  sort_order: number;
};

export type CreateEventBody = {
  title: string;
  bio?: string;
  day: string;
  time: string;
  place: string;
  address?: string;
  invitedIds?: string[];
  coHostIds?: string[];
  allowFriendsToInvite?: boolean;
  cap?: number;
  chipInAmount?: string;
  chipInMethod?: ChipMethod;
  chipInHandle?: string;
  chipInNote?: string;
  cover?: Cover | { kind: 'photo'; mediaId: string; bannerText?: string };
  assignments?: Array<{ label: string } | EventAssignment>;
};

export type PatchEventBody = {
  title?: string;
  bio?: string;
  day?: string;
  time?: string;
  place?: string;
  address?: string;
  cover?: Cover | { kind: 'photo'; mediaId: string; bannerText?: string };
  chipInAmount?: string;
  chipInMethod?: ChipMethod;
  chipInHandle?: string;
  chipInNote?: string;
  allowFriendsToInvite?: boolean;
  cap?: number;
  coHostIds?: string[];
};

@Injectable()
export class EventsService {
  private readonly mediaBucket: string;
  private readonly signedUrlTtl = 60 * 60;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly coop: CoopService,
    private readonly matchingEvents: MatchingEventService
  ) {
    this.mediaBucket =
      this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'media';
  }

  // --- helpers ---

  private async maxCap(userId: string): Promise<number> {
    return (await this.coop.isActiveMember(userId)) ? 100 : 35;
  }

  /**
   * Parse YYYY-MM-DD + HH:mm into ISO. LOCK: store wall-clock numbers as UTC
   * components so day/time round-trip cleanly; clients use startsAt for countdown.
   */
  private parseDayTime(day: string, time: string): string {
    const d = (day || '').trim();
    const t = (time || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      throw new BadRequestException('day must be YYYY-MM-DD');
    }
    if (!/^\d{1,2}:\d{2}$/.test(t)) {
      throw new BadRequestException('time must be HH:mm');
    }
    const [hh, mm] = t.split(':').map(Number);
    const utc = new Date(
      `${d}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00.000Z`
    );
    if (Number.isNaN(utc.getTime())) {
      throw new BadRequestException('Invalid day/time');
    }
    return utc.toISOString();
  }

  private formatDayTime(startsAt: string | null): { day: string; time: string } {
    if (!startsAt) return { day: '', time: '18:00' };
    const d = new Date(startsAt);
    const day = d.toISOString().slice(0, 10);
    const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    return { day, time };
  }

  private countdownLabel(startsAt: string | null): string | undefined {
    if (!startsAt) return undefined;
    const ms = new Date(startsAt).getTime() - Date.now();
    if (ms <= 0) return 'started';
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    if (days >= 1) return `in ${days} day${days === 1 ? '' : 's'}`;
    const hrs = Math.floor(ms / (60 * 60 * 1000));
    if (hrs >= 1) return `in ${hrs}h`;
    const mins = Math.max(1, Math.floor(ms / 60000));
    return `in ${mins}m`;
  }

  private toChipInJson(body: {
    chipInAmount?: string;
    chipInMethod?: ChipMethod;
    chipInHandle?: string;
    chipInNote?: string;
  }): ChipInJson | null {
    if (!body.chipInAmount && !body.chipInHandle && !body.chipInMethod) {
      return null;
    }
    const methods =
      body.chipInMethod && body.chipInHandle
        ? [{ kind: body.chipInMethod, handle: body.chipInHandle }]
        : [];
    return {
      amount: body.chipInAmount,
      note: body.chipInNote,
      methods
    };
  }

  private fromChipIn(json: ChipInJson | null | undefined): {
    chipInAmount?: string;
    chipInMethod?: ChipMethod;
    chipInHandle?: string;
    chipInNote?: string;
  } {
    if (!json) return {};
    const m = json.methods?.[0];
    const kind = m?.kind as ChipMethod | undefined;
    return {
      chipInAmount: json.amount,
      chipInNote: json.note,
      chipInMethod: kind && (CHIP_METHODS as readonly string[]).includes(kind) ? kind : undefined,
      chipInHandle: m?.handle
    };
  }

  private normalizeCoverInput(
    cover: CreateEventBody['cover'] | undefined
  ): CoverStored | null {
    if (!cover) return null;
    if (cover.kind === 'emoji') {
      return { kind: 'emoji', value: cover.value, bg: cover.bg };
    }
    if (cover.kind === 'photo') {
      const mediaId =
        'mediaId' in cover && typeof cover.mediaId === 'string'
          ? cover.mediaId
          : undefined;
      if (!mediaId) {
        // Client may send a signed url cover after create; ignore url-only on write.
        return null;
      }
      return {
        kind: 'photo',
        mediaId,
        bannerText: 'bannerText' in cover ? cover.bannerText : undefined
      };
    }
    if (cover.kind === 'text') {
      return { kind: 'text', value: cover.value, bg: cover.bg };
    }
    if (cover.kind === 'color') {
      return { kind: 'color', bg: cover.bg };
    }
    return null;
  }

  private async toCoverDto(cover: CoverStored | null): Promise<Cover | undefined> {
    if (!cover) return undefined;
    if (cover.kind === 'photo') {
      const { data: media } = await this.supabase.admin
        .from('media')
        .select('storage_path')
        .eq('id', cover.mediaId)
        .maybeSingle();
      let url = '';
      if (media?.storage_path) {
        const { data } = await this.supabase.admin.storage
          .from(this.mediaBucket)
          .createSignedUrl(media.storage_path, this.signedUrlTtl);
        url = data?.signedUrl ?? '';
      }
      return { kind: 'photo', url, bannerText: cover.bannerText };
    }
    return cover as Cover;
  }

  private isEditor(event: EventRow, userId: string): boolean {
    return event.host_id === userId || (event.co_host_ids ?? []).includes(userId);
  }

  private roleFor(
    event: EventRow,
    userId: string,
    invite: InviteRow | undefined
  ): EventRole {
    if (this.isEditor(event, userId)) return 'host';
    if (invite?.status === 'going') return 'going';
    return 'invited';
  }

  private async toEventDto(
    event: EventRow,
    viewerId: string,
    invites: InviteRow[],
    assignments: AssignmentRow[]
  ): Promise<EventItem> {
    const myInvite = invites.find((i) => i.user_id === viewerId);
    const editor = this.isEditor(event, viewerId);
    if (!editor && !myInvite) {
      throw new ForbiddenException('Not allowed');
    }

    const goingIds = invites
      .filter((i) => i.status === 'going')
      .map((i) => i.user_id);
    if (!goingIds.includes(event.host_id)) {
      goingIds.unshift(event.host_id);
    }

    const { day, time } = this.formatDayTime(event.starts_at);
    const chip = this.fromChipIn(event.chip_in);
    const cover = await this.toCoverDto(event.cover);
    const emoji =
      cover?.kind === 'emoji' ? cover.value : cover?.kind === 'photo' ? '📸' : '🎉';

    const role = this.roleFor(event, viewerId, myInvite);

    return {
      id: event.id,
      title: event.title,
      emoji,
      cover,
      accent: accentForId(event.id),
      day,
      time,
      place: event.place ?? '',
      // PRIVACY: address only for people on the event.
      address: editor || myInvite ? event.address ?? undefined : undefined,
      goingIds,
      // Host/co-host see the invite list (planning). Guests do not.
      invitedIds: editor
        ? invites
            .filter((i) => i.user_id !== event.host_id)
            .map((i) => i.user_id)
        : undefined,
      hostId: event.host_id,
      coHostIds: event.co_host_ids?.length ? event.co_host_ids : undefined,
      role,
      going: role === 'going' || role === 'host',
      countdown: this.countdownLabel(event.starts_at),
      startsAt: event.starts_at ? new Date(event.starts_at).getTime() : undefined,
      bio: event.bio ?? undefined,
      ...chip,
      allowFriendsToInvite: event.allow_friends_invite,
      cap: event.cap,
      assignments: assignments.map((a) => ({
        id: a.id,
        label: a.label,
        assigneeId: a.assignee_id ?? undefined,
        done: a.done
      }))
    };
  }

  private async loadBundle(eventId: string): Promise<{
    event: EventRow;
    invites: InviteRow[];
    assignments: AssignmentRow[];
  }> {
    const { data: event, error } = await this.supabase.admin
      .from('events')
      .select(
        'id, host_id, co_host_ids, title, bio, starts_at, address, place, chip_in, allow_friends_invite, cap, cover, created_at'
      )
      .eq('id', eventId)
      .maybeSingle();
    if (error) throw error;
    if (!event) throw new NotFoundException('Event not found');

    const { data: invites, error: iErr } = await this.supabase.admin
      .from('event_invites')
      .select('id, event_id, user_id, status, allergies_optin, allergies_text')
      .eq('event_id', eventId);
    if (iErr) throw iErr;

    const { data: assignments, error: aErr } = await this.supabase.admin
      .from('event_assignments')
      .select('id, event_id, label, assignee_id, done, sort_order')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });
    if (aErr) throw aErr;

    return {
      event: event as EventRow,
      invites: (invites ?? []) as InviteRow[],
      assignments: (assignments ?? []) as AssignmentRow[]
    };
  }

  private async assertConnected(me: string, other: string): Promise<void> {
    const { data, error } = await this.supabase.admin
      .from('connections')
      .select('id')
      .eq('status', 'accepted')
      .or(
        `and(user_a.eq.${me},user_b.eq.${other}),and(user_a.eq.${other},user_b.eq.${me})`
      )
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new BadRequestException('Can only invite people you are connected to');
    }
  }

  // --- list ---

  async list(userId: string): Promise<EventItem[]> {
    const { data: myInvites, error: iErr } = await this.supabase.admin
      .from('event_invites')
      .select('event_id')
      .eq('user_id', userId);
    if (iErr) throw iErr;

    const inviteEventIds = (myInvites ?? []).map((i) => i.event_id);

    const { data: hosted, error: hErr } = await this.supabase.admin
      .from('events')
      .select('id')
      .eq('host_id', userId);
    if (hErr) throw hErr;

    const { data: coHosted, error: cErr } = await this.supabase.admin
      .from('events')
      .select('id')
      .contains('co_host_ids', [userId]);
    if (cErr) throw cErr;

    const ids = Array.from(
      new Set([
        ...(hosted ?? []).map((e) => e.id),
        ...(coHosted ?? []).map((e) => e.id),
        ...inviteEventIds
      ])
    );
    if (ids.length === 0) return [];

    const { data: events, error } = await this.supabase.admin
      .from('events')
      .select(
        'id, host_id, co_host_ids, title, bio, starts_at, address, place, chip_in, allow_friends_invite, cap, cover, created_at'
      )
      .in('id', ids)
      .order('starts_at', { ascending: true, nullsFirst: false });
    if (error) throw error;

    const out: EventItem[] = [];
    for (const ev of events ?? []) {
      const bundle = await this.loadBundle(ev.id);
      out.push(
        await this.toEventDto(
          bundle.event,
          userId,
          bundle.invites,
          bundle.assignments
        )
      );
    }
    return out;
  }

  // --- create ---

  async create(userId: string, body: CreateEventBody): Promise<EventItem> {
    const title = (body.title ?? '').trim();
    if (!title) throw new BadRequestException('Title is required');
    if (title.length > 120) throw new BadRequestException('Title too long');

    const max = await this.maxCap(userId);
    let cap = body.cap ?? 35;
    if (!Number.isFinite(cap)) cap = 35;
    cap = Math.max(2, Math.min(Math.floor(cap), max));
    if ((body.cap ?? 35) > max) {
      throw new BadRequestException(
        `Guest cap max is ${max} for your membership`
      );
    }

    const startsAt = this.parseDayTime(body.day, body.time);
    const coHostIds = Array.from(
      new Set((body.coHostIds ?? []).filter((id) => id && id !== userId))
    );
    for (const id of coHostIds) {
      if (await isBlocked(this.supabase, userId, id)) {
        throw new BadRequestException('Cannot co-host with a blocked person');
      }
      await this.assertConnected(userId, id);
    }

    const invitedIds = Array.from(
      new Set((body.invitedIds ?? []).filter((id) => id && id !== userId))
    );
    // Cap counts host + invitees.
    if (1 + invitedIds.length > cap) {
      throw new BadRequestException('Too many invites for this guest cap');
    }
    for (const id of invitedIds) {
      if (await isBlocked(this.supabase, userId, id)) continue;
      await this.assertConnected(userId, id);
    }

    let cover = this.normalizeCoverInput(body.cover);
    if (!cover) {
      const emojis = ['🎉', '✨', '🌿', '🍜', '🎧', '🎬', '🏔️', '☕️', '🎨', '🍕'];
      cover = {
        kind: 'emoji',
        value: emojis[Math.floor(Math.random() * emojis.length)]!,
        bg: '#7F77DD'
      };
    }

    // SECURITY: photo cover media must be owned by the host.
    if (cover.kind === 'photo') {
      const { data: media } = await this.supabase.admin
        .from('media')
        .select('owner_id')
        .eq('id', cover.mediaId)
        .maybeSingle();
      if (!media || media.owner_id !== userId) {
        throw new ForbiddenException('Cover media not owned by you');
      }
    }

    const chipIn = this.toChipInJson(body);

    const { data: event, error } = await this.supabase.admin
      .from('events')
      .insert({
        host_id: userId,
        co_host_ids: coHostIds,
        title,
        bio: body.bio?.trim() || null,
        starts_at: startsAt,
        address: body.address?.trim() || null,
        place: (body.place || body.address || 'TBD').trim(),
        chip_in: chipIn as never,
        allow_friends_invite: !!body.allowFriendsToInvite,
        cap,
        cover: cover as never
      })
      .select(
        'id, host_id, co_host_ids, title, bio, starts_at, address, place, chip_in, allow_friends_invite, cap, cover, created_at'
      )
      .single();
    if (error) throw error;

    // Host as going so list queries are uniform.
    const inviteRows: Array<{
      event_id: string;
      user_id: string;
      status: 'going' | 'invited';
    }> = [{ event_id: event.id, user_id: userId, status: 'going' }];

    for (const id of invitedIds) {
      if (await isBlocked(this.supabase, userId, id)) continue;
      inviteRows.push({ event_id: event.id, user_id: id, status: 'invited' });
    }

    const { error: invErr } = await this.supabase.admin
      .from('event_invites')
      .insert(inviteRows);
    if (invErr) throw invErr;

    const labels = (body.assignments ?? [])
      .map((a) => ('label' in a ? a.label : '').trim())
      .filter(Boolean);
    if (labels.length) {
      const { error: aErr } = await this.supabase.admin
        .from('event_assignments')
        .insert(
          labels.map((label, i) => ({
            event_id: event.id,
            label,
            sort_order: i
          }))
        );
      if (aErr) throw aErr;
    }

    // Notify invitees (opaque ids only — never title in analytics).
    for (const row of inviteRows) {
      if (row.user_id === userId) continue;
      await this.supabase.admin.from('notifications').insert({
        user_id: row.user_id,
        kind: 'event_invite',
        payload: { event_id: event.id, from: userId } as never
      });
    }

    const bundle = await this.loadBundle(event.id);
    return this.toEventDto(
      bundle.event,
      userId,
      bundle.invites,
      bundle.assignments
    );
  }

  // --- get / patch ---

  async get(userId: string, eventId: string): Promise<EventItem> {
    const bundle = await this.loadBundle(eventId);
    return this.toEventDto(
      bundle.event,
      userId,
      bundle.invites,
      bundle.assignments
    );
  }

  async patch(
    userId: string,
    eventId: string,
    body: PatchEventBody
  ): Promise<EventItem> {
    const bundle = await this.loadBundle(eventId);
    if (!this.isEditor(bundle.event, userId)) {
      throw new ForbiddenException('Not allowed');
    }

    const max = await this.maxCap(bundle.event.host_id);
    const patch: Record<string, unknown> = {};

    if (typeof body.title === 'string') {
      const t = body.title.trim();
      if (!t) throw new BadRequestException('Title is required');
      patch.title = t.slice(0, 120);
    }
    if (typeof body.bio === 'string') patch.bio = body.bio.trim() || null;
    if (typeof body.place === 'string') patch.place = body.place.trim();
    if (typeof body.address === 'string') {
      patch.address = body.address.trim() || null;
    }
    if (body.day && body.time) {
      patch.starts_at = this.parseDayTime(body.day, body.time);
    }
    if (typeof body.allowFriendsToInvite === 'boolean') {
      patch.allow_friends_invite = body.allowFriendsToInvite;
    }
    if (typeof body.cap === 'number') {
      if (body.cap > max) {
        throw new BadRequestException(`Guest cap max is ${max}`);
      }
      patch.cap = Math.max(2, Math.min(Math.floor(body.cap), max));
    }
    if (body.coHostIds) {
      const coHostIds = Array.from(
        new Set(body.coHostIds.filter((id) => id && id !== bundle.event.host_id))
      );
      for (const id of coHostIds) {
        await this.assertConnected(userId, id);
      }
      patch.co_host_ids = coHostIds;
    }
    if (
      body.chipInAmount !== undefined ||
      body.chipInHandle !== undefined ||
      body.chipInMethod !== undefined ||
      body.chipInNote !== undefined
    ) {
      patch.chip_in = this.toChipInJson(body) as never;
    }
    if (body.cover) {
      const cover = this.normalizeCoverInput(body.cover);
      if (cover) patch.cover = cover as never;
    }

    if (Object.keys(patch).length) {
      const { error } = await this.supabase.admin
        .from('events')
        .update(patch as never)
        .eq('id', eventId);
      if (error) throw error;
    }

    const next = await this.loadBundle(eventId);
    return this.toEventDto(next.event, userId, next.invites, next.assignments);
  }

  // --- RSVP ---

  async rsvp(
    userId: string,
    eventId: string,
    body: {
      status: 'going' | 'cant';
      allergiesOptIn?: boolean;
      allergiesText?: string;
    }
  ): Promise<EventItem> {
    const bundle = await this.loadBundle(eventId);
    if (this.isEditor(bundle.event, userId) && body.status === 'cant') {
      throw new BadRequestException('Host cannot RSVP cannot-attend');
    }

    const existing = bundle.invites.find((i) => i.user_id === userId);
    if (!existing && !this.isEditor(bundle.event, userId)) {
      throw new ForbiddenException('Not invited');
    }

    if (body.status === 'going') {
      const goingCount = bundle.invites.filter((i) => i.status === 'going').length;
      const alreadyGoing = existing?.status === 'going';
      if (!alreadyGoing && goingCount >= bundle.event.cap) {
        throw new BadRequestException('Event is at capacity');
      }
    }

    const allergiesOptIn = !!body.allergiesOptIn;
    const row = {
      event_id: eventId,
      user_id: userId,
      status: body.status,
      allergies_optin: allergiesOptIn,
      allergies_text: allergiesOptIn
        ? (body.allergiesText ?? '').trim() || null
        : null
    };

    const { error } = await this.supabase.admin
      .from('event_invites')
      .upsert(row as never, { onConflict: 'event_id,user_id' });
    if (error) throw error;

    if (body.status === 'going' && bundle.event.host_id !== userId) {
      await this.supabase.admin.from('notifications').insert({
        user_id: bundle.event.host_id,
        kind: 'rsvp_going',
        payload: { event_id: eventId, from: userId } as never
      });
    }

    const next = await this.loadBundle(eventId);
    return this.toEventDto(next.event, userId, next.invites, next.assignments);
  }

  // --- assignments ---

  async patchAssignment(
    userId: string,
    eventId: string,
    itemId: string,
    body: { assigneeId?: string | null; done?: boolean }
  ): Promise<EventItem> {
    const bundle = await this.loadBundle(eventId);
    const editor = this.isEditor(bundle.event, userId);
    const myInvite = bundle.invites.find((i) => i.user_id === userId);
    if (!editor && !myInvite) throw new ForbiddenException('Not allowed');

    const item = bundle.assignments.find((a) => a.id === itemId);
    if (!item) throw new NotFoundException('Assignment not found');

    const patch: Record<string, unknown> = {};
    let action: 'snagged' | 'released' | null = null;

    if ('assigneeId' in body) {
      const nextAssignee = body.assigneeId ?? null;
      if (nextAssignee) {
        // Snag: open item, or host reassign.
        if (item.assignee_id && item.assignee_id !== userId && !editor) {
          throw new ForbiddenException('Already claimed');
        }
        if (nextAssignee !== userId && !editor) {
          throw new ForbiddenException('Can only claim for yourself');
        }
        patch.assignee_id = nextAssignee;
        action = 'snagged';
      } else {
        // Release: self or host.
        if (item.assignee_id !== userId && !editor) {
          throw new ForbiddenException('Not your assignment');
        }
        patch.assignee_id = null;
        patch.done = false;
        action = 'released';
      }
    }

    if (typeof body.done === 'boolean') {
      // LOCK: assignee or host/co-host can mark done (hosts can check anyone's).
      if (item.assignee_id !== userId && !editor) {
        throw new ForbiddenException(
          'Only the assignee or host can check this off'
        );
      }
      patch.done = body.done;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    const { error } = await this.supabase.admin
      .from('event_assignments')
      .update(patch as never)
      .eq('id', itemId)
      .eq('event_id', eventId);
    if (error) throw error;

    if (action && bundle.event.host_id !== userId) {
      await this.supabase.admin.from('notifications').insert({
        user_id: bundle.event.host_id,
        kind: 'event_assignment',
        payload: {
          event_id: eventId,
          assignment_id: itemId,
          from: userId,
          action
        } as never
      });
    }

    const next = await this.loadBundle(eventId);
    return this.toEventDto(next.event, userId, next.invites, next.assignments);
  }

  /** FoF scored by Nest matching — opaque ids; client rejoins names. */
  async meetSuggestions(
    userId: string,
    eventId: string
  ): Promise<MeetSuggestion[]> {
    const ranked = await this.matchingEvents.meetSuggestions(userId, eventId);
    return ranked.map((s) => ({
      personId: s.personId,
      thread: s.sharedThread,
      status: 'invited' as const
    }));
  }
}
