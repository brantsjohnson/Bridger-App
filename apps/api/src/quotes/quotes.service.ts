// ============================================
// WHAT THIS FILE DOES (plain English):
// Inside Jokes on the server. You write a sticky-note quote, pick who said
// it, optionally tag an event and (if you are a co-op member) add a photo.
// Tagged friends get the note on their wall and a quiet alert. We never
// store the joke in analytics.
//
// --- SECURITY / PRIVACY ---
// You only see jokes you posted, were quoted in, or were tagged on.
// Photos stay in your private media bucket. Joke text is never sent to AI.
// ============================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import type { Accent, InsideJoke } from '@bridger/shared';
import { CoopService } from '../coop/coop.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SupabaseService } from '../supabase/supabase.service';

export type QuoteFilter = 'all' | 'about' | 'by';

const ACCENTS: Accent[] = [
  'purple',
  'coral',
  'teal',
  'amber',
  'pink',
  'blue',
  'green'
];

const SIGNED_URL_TTL = 60 * 60;

type QuipRow = {
  id: string;
  author_id: string;
  quoted_person_id: string | null;
  text: string;
  context_event_id: string | null;
  place: string | null;
  accent: string | null;
  photo_media_id: string | null;
  created_at: string;
};

@Injectable()
export class QuotesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly coop: CoopService,
    private readonly notifications: NotificationsService
  ) {}

  // THIS SECTION DOES: list jokes you can see, newest first.
  async list(
    viewerId: string,
    filter: QuoteFilter,
    personId?: string
  ): Promise<InsideJoke[]> {
    const { data: myTags } = await this.supabase.admin
      .from('quip_tags')
      .select('quip_id')
      .eq('tagged_user_id', viewerId);
    const taggedIds = (myTags ?? []).map((t) => t.quip_id);

    let query = this.supabase.admin
      .from('quips')
      .select('*')
      .or(
        taggedIds.length
          ? `author_id.eq.${viewerId},quoted_person_id.eq.${viewerId},id.in.(${taggedIds.join(',')})`
          : `author_id.eq.${viewerId},quoted_person_id.eq.${viewerId}`
      )
      .order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as QuipRow[];
    const ids = rows.map((r) => r.id);
    const tagMap = await this.tagsFor(ids);
    const visible = rows.filter((row) => {
      const tags = tagMap.get(row.id) ?? [];
      return this.canSee(viewerId, row, tags);
    });

    const subject = personId || viewerId;
    const filtered = visible.filter((row) => {
      const tags = tagMap.get(row.id) ?? [];
      const about = row.quoted_person_id === subject || tags.includes(subject);
      const by = row.author_id === subject;
      if (filter === 'about') return about;
      if (filter === 'by') return by;
      return about || by;
    });

    return this.toDtos(filtered, tagMap);
  }

  // THIS SECTION DOES: save a new sticky note and tell tagged friends.
  async create(
    authorId: string,
    body: {
      text: string;
      quotedPersonId?: string;
      taggedIds?: string[];
      eventId?: string;
      eventName?: string;
      accent?: Accent;
      photoMediaId?: string;
    }
  ): Promise<InsideJoke> {
    const text = (body.text ?? '').trim();
    if (!text) throw new BadRequestException('Write the joke first');
    if (text.length > 400) throw new BadRequestException('Keep it a bit shorter');

    const accent = ACCENTS.includes(body.accent as Accent)
      ? (body.accent as Accent)
      : 'amber';

    const quotedId = body.quotedPersonId?.trim() || null;
    if (quotedId && quotedId !== authorId) {
      await this.assertFriend(authorId, quotedId);
    }

    const extraTags = (body.taggedIds ?? []).filter(
      (id) => id && id !== authorId && id !== quotedId
    );
    for (const id of extraTags) {
      await this.assertFriend(authorId, id);
    }

    let place = (body.eventName ?? '').trim() || null;
    let eventId = body.eventId?.trim() || null;
    if (eventId) {
      const title = await this.eventTitle(eventId);
      if (title) place = title;
    }

    let photoMediaId = body.photoMediaId?.trim() || null;
    if (photoMediaId) {
      const member = await this.coop.isMember(authorId);
      if (!member) {
        throw new ForbiddenException('A photo on an Inside Joke is a co-op perk');
      }
      await this.assertOwnMedia(authorId, photoMediaId);
    }

    const { data, error } = await this.supabase.admin
      .from('quips')
      .insert({
        author_id: authorId,
        quoted_person_id: quotedId,
        text,
        context_event_id: eventId,
        place,
        accent,
        photo_media_id: photoMediaId
      })
      .select('*')
      .single();
    if (error) throw error;
    const row = data as QuipRow;

    const tagIds = Array.from(new Set([quotedId, ...extraTags].filter(Boolean))) as string[];
    if (tagIds.length) {
      const { error: tagErr } = await this.supabase.admin.from('quip_tags').insert(
        tagIds.map((tagged_user_id) => ({ quip_id: row.id, tagged_user_id }))
      );
      if (tagErr) throw tagErr;
    }

    // THIS SECTION DOES: ping each tagged friend (never the joke text).
    for (const uid of tagIds) {
      if (uid === authorId) continue;
      await this.notifications.notifyIfAllowed({
        userId: uid,
        kind: 'inside_joke',
        payload: { from: authorId, personId: authorId } as never
      });
    }

    return (await this.toDtos([row], new Map([[row.id, tagIds]])))[0]!;
  }

  // THIS SECTION DOES: only the author, the quoted person, or a tagged person.
  private canSee(viewerId: string, row: QuipRow, tags: string[]): boolean {
    return (
      row.author_id === viewerId ||
      row.quoted_person_id === viewerId ||
      tags.includes(viewerId)
    );
  }

  private async tagsFor(quipIds: string[]): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (!quipIds.length) return map;
    const { data, error } = await this.supabase.admin
      .from('quip_tags')
      .select('quip_id, tagged_user_id')
      .in('quip_id', quipIds);
    if (error) throw error;
    for (const t of data ?? []) {
      const list = map.get(t.quip_id) ?? [];
      list.push(t.tagged_user_id);
      map.set(t.quip_id, list);
    }
    return map;
  }

  private async assertFriend(userId: string, otherId: string): Promise<void> {
    const { data, error } = await this.supabase.admin
      .from('connections')
      .select('id')
      .eq('status', 'accepted')
      .or(
        `and(user_a.eq.${userId},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${userId})`
      )
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new BadRequestException('You can only tag a friend');
  }

  private async assertOwnMedia(userId: string, mediaId: string): Promise<void> {
    const { data, error } = await this.supabase.admin
      .from('media')
      .select('id, owner_id')
      .eq('id', mediaId)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.owner_id !== userId) {
      throw new BadRequestException('That photo is not yours');
    }
  }

  private async eventTitle(eventId: string): Promise<string | null> {
    const { data } = await this.supabase.admin
      .from('events')
      .select('title')
      .eq('id', eventId)
      .maybeSingle();
    return data?.title ?? null;
  }

  private async toDtos(
    rows: QuipRow[],
    tagMap: Map<string, string[]>
  ): Promise<InsideJoke[]> {
    const userIds = new Set<string>();
    const mediaIds = new Set<string>();
    for (const row of rows) {
      userIds.add(row.author_id);
      if (row.quoted_person_id) userIds.add(row.quoted_person_id);
      if (row.photo_media_id) mediaIds.add(row.photo_media_id);
    }

    const names = new Map<string, string>();
    if (userIds.size) {
      const { data } = await this.supabase.admin
        .from('user_identity')
        .select('user_id, display_name')
        .in('user_id', Array.from(userIds));
      for (const i of data ?? []) {
        names.set(i.user_id, i.display_name || 'Friend');
      }
    }

    const photos = new Map<string, string>();
    if (mediaIds.size) {
      const { data: mediaRows } = await this.supabase.admin
        .from('media')
        .select('id, storage_path')
        .in('id', Array.from(mediaIds));
      for (const m of mediaRows ?? []) {
        const { data } = await this.supabase.admin.storage
          .from('media')
          .createSignedUrl(m.storage_path, SIGNED_URL_TTL);
        if (data?.signedUrl) photos.set(m.id, data.signedUrl);
      }
    }

    return rows.map((row) => {
      const quotedId = row.quoted_person_id ?? undefined;
      const created = new Date(row.created_at).getTime();
      return {
        id: row.id,
        text: row.text,
        quotedId,
        fromName: quotedId ? names.get(quotedId) ?? 'Friend' : names.get(row.author_id) ?? 'You',
        postedById: row.author_id,
        postedAt: relativeWhen(created),
        createdAt: created,
        accent: (ACCENTS.includes(row.accent as Accent) ? row.accent : 'amber') as Accent,
        taggedIds: tagMap.get(row.id),
        eventName: row.place ?? undefined,
        eventId: row.context_event_id ?? undefined,
        photoUri: row.photo_media_id ? photos.get(row.photo_media_id) : undefined
      };
    });
  }
}

function relativeWhen(createdAt: number): string {
  const mins = Math.max(0, Math.round((Date.now() - createdAt) / 60000));
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  return 'a while ago';
}
