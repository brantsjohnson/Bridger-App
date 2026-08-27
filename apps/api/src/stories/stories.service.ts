// ============================================
// WHAT THIS FILE DOES (plain English):
// Updates ("stories") on the server: post a photo/video, list someone's posts,
// reply with text / sticker / circle video, Catch-Up bundle, the 3-per-day
// quota, and the Profile calendar archive.
//
// Two clocks: live_until (~24h) = leaves Home tray / friends can't open — the
// picture is archived for the author. expires_at (~30d free / null co-op) =
// when free media may be deleted for real.
//
// PRIVACY: tier + blocks re-checked on every read. Photos are never sent to a
// model. Signed URLs expire so storage paths never leak to the client.
// PAYMENT: posting video requires an active co-op membership.
// ============================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Reaction, ReactionKind, Tier } from '@bridger/shared';
import { AiJobsService } from '../ai/ai-jobs.service';
import { canViewTier, isBlocked } from '../common/visibility';
import { CoopService } from '../coop/coop.service';
import { SupabaseService } from '../supabase/supabase.service';

const DAILY_CAP = 3;
/** Free-tier rolling retention — after this, media can be deleted. */
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Wire shape for one Update segment (player). */
export type StoryPostDto = {
  id: string;
  authorId: string;
  type: 'photo' | 'video';
  emoji: string;
  accent: 'purple';
  overlayText?: string;
  caption?: string;
  themeSlug?: string;
  eventId?: string;
  createdAt: string;
  mediaUrl: string | null;
};

/** Catch-Up payload the mobile sheet expects. */
export type CatchUpBundleDto = {
  live: unknown[];
  answered: unknown[];
  week: Array<{
    day: string;
    note: string;
    caption: string;
    emoji: string;
    accent: string;
  }>;
  currently: {
    listening: { title: string; artist: string; emoji: string };
    reading: { title: string; author: string; emoji: string };
  };
};

@Injectable()
export class StoriesService {
  private readonly mediaBucket: string;
  private readonly signedUrlTtl = 60 * 60;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly coop: CoopService,
    private readonly aiJobs: AiJobsService
  ) {
    this.mediaBucket =
      this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'media';
  }

  private async signMedia(storagePath: string | null | undefined): Promise<string | null> {
    if (!storagePath) return null;
    const { data, error } = await this.supabase.admin.storage
      .from(this.mediaBucket)
      .createSignedUrl(storagePath, this.signedUrlTtl);
    if (error || !data) return null;
    return data.signedUrl;
  }

  /** Start of today's UTC day (quota window). */
  private utcDayStart(): string {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  private async countToday(authorId: string): Promise<number> {
    const { count, error } = await this.supabase.admin
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', authorId)
      .gte('created_at', this.utcDayStart());
    if (error) throw error;
    return count ?? 0;
  }

  private async toPostDto(row: {
    id: string;
    author_id: string;
    type: string;
    update_text: string | null;
    theme_slug: string | null;
    event_id?: string | null;
    created_at: string;
    media_id: string | null;
  }): Promise<StoryPostDto> {
    let mediaUrl: string | null = null;
    if (row.media_id) {
      const { data: media } = await this.supabase.admin
        .from('media')
        .select('storage_path')
        .eq('id', row.media_id)
        .maybeSingle();
      mediaUrl = await this.signMedia(media?.storage_path);
    }
    const type = row.type === 'video' ? 'video' : 'photo';
    return {
      id: row.id,
      authorId: row.author_id,
      type,
      emoji: type === 'video' ? '🎥' : '📸',
      accent: 'purple',
      caption: row.update_text ?? undefined,
      themeSlug: row.theme_slug ?? undefined,
      eventId: row.event_id ?? undefined,
      createdAt: row.created_at,
      mediaUrl
    };
  }

  // --- Quota ---

  async getQuota(userId: string): Promise<{ left: number; cap: number }> {
    const used = await this.countToday(userId);
    return { left: Math.max(0, DAILY_CAP - used), cap: DAILY_CAP };
  }

  // --- Create ---

  async create(
    userId: string,
    body: {
      type: 'photo' | 'video';
      mediaId?: string;
      caption?: string;
      themeSlug?: string;
      visibleToTier?: Tier;
      eventId?: string;
    }
  ): Promise<StoryPostDto> {
    const type = body.type === 'video' ? 'video' : 'photo';

    // PAYMENT: video posting is a co-op unlock (reconcile first so expired members are blocked).
    if (type === 'video' && !(await this.coop.isActiveMember(userId))) {
      throw new ForbiddenException('Video updates require co-op membership');
    }

    const used = await this.countToday(userId);
    if (used >= DAILY_CAP) {
      throw new BadRequestException('Daily post quota reached');
    }

    if (body.mediaId) {
      const { data: media, error } = await this.supabase.admin
        .from('media')
        .select('id, owner_id, kind')
        .eq('id', body.mediaId)
        .maybeSingle();
      if (error) throw error;
      if (!media || media.owner_id !== userId) {
        throw new ForbiddenException('Media not owned by you');
      }
      if (media.kind !== type && media.kind !== 'photo' && media.kind !== 'video') {
        throw new BadRequestException('Media kind mismatch');
      }
      // Soft check: photo post should use photo media when present.
      if (type === 'photo' && media.kind === 'video') {
        throw new BadRequestException('Media kind mismatch');
      }
      if (type === 'video' && media.kind !== 'video') {
        throw new BadRequestException('Media kind mismatch');
      }
    }

    const visible: Tier =
      body.visibleToTier === 'close' ||
      body.visibleToTier === 'friend' ||
      body.visibleToTier === 'acquaintance'
        ? body.visibleToTier
        : 'friend';

    // Co-op keeps media forever (expires_at null). Free rolls off after ~30 days.
    // The 24h live window is live_until (generated from created_at) — after that
    // the picture is archive-only on the author's Profile calendar.
    const coop = await this.coop.isActiveMember(userId);
    const expires = coop
      ? null
      : new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
    const caption = body.caption?.trim() || null;

    if (body.eventId) {
      await this.assertCanTagEvent(userId, body.eventId);
    }

    const { data: row, error: insErr } = await this.supabase.admin
      .from('stories')
      .insert({
        author_id: userId,
        type,
        media_id: body.mediaId ?? null,
        update_text: caption,
        theme_slug: body.themeSlug ?? null,
        visible_to_tier: visible,
        event_id: body.eventId ?? null,
        expires_at: expires
      })
      .select(
        'id, author_id, type, update_text, theme_slug, event_id, created_at, media_id, transcript'
      )
      .single();
    if (insErr) throw insErr;

    // Keep media retention in lockstep with the story row (free tier).
    if (body.mediaId) {
      await this.supabase.admin
        .from('media')
        .update({ expires_at: expires })
        .eq('id', body.mediaId)
        .eq('owner_id', userId);
    }

    // PRIVACY / AI: enqueue day summary from words only — never photos.
    // The post returns immediately; the worker writes the summary later.
    if (caption) {
      const date = new Date().toISOString().slice(0, 10);
      const transcript =
        typeof (row as { transcript?: string | null }).transcript === 'string'
          ? (row as { transcript: string }).transcript
          : '';
      await this.aiJobs.enqueueDaySummary({
        authorId: userId,
        date,
        caption,
        transcript
      });
    }

    return this.toPostDto(row);
  }

  /** Viewer must be host, co-host, or marked going before tagging an event. */
  private async assertCanTagEvent(userId: string, eventId: string): Promise<void> {
    const { data: event, error } = await this.supabase.admin
      .from('events')
      .select('id, host_id, co_host_ids')
      .eq('id', eventId)
      .maybeSingle();
    if (error) throw error;
    if (!event) throw new NotFoundException('Event not found');
    if (event.host_id === userId) return;
    if ((event.co_host_ids ?? []).includes(userId)) return;
    const { data: invite } = await this.supabase.admin
      .from('event_invites')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    if (invite?.status === 'going') return;
    throw new ForbiddenException('You must be going to tag this event');
  }

  /** Host, co-host, or anyone on the invite list (not Can't) can view the album. */
  private async assertEventGuest(userId: string, eventId: string): Promise<void> {
    const { data: event, error } = await this.supabase.admin
      .from('events')
      .select('id, host_id, co_host_ids')
      .eq('id', eventId)
      .maybeSingle();
    if (error) throw error;
    if (!event) throw new NotFoundException('Event not found');
    if (event.host_id === userId) return;
    if ((event.co_host_ids ?? []).includes(userId)) return;
    const { data: invite } = await this.supabase.admin
      .from('event_invites')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    if (invite && invite.status !== 'cant') return;
    throw new ForbiddenException('Not on the event guest list');
  }

  /**
   * Event photo album: photo updates tagged to this event.
   * PRIVACY: viewer must be on the guest list; each post still tier-filtered.
   */
  async listEventPhotos(viewerId: string, eventId: string): Promise<StoryPostDto[]> {
    await this.assertEventGuest(viewerId, eventId);

    const { data: rows, error } = await this.supabase.admin
      .from('stories')
      .select(
        'id, author_id, type, update_text, theme_slug, event_id, created_at, media_id, visible_to_tier'
      )
      .eq('event_id', eventId)
      .eq('type', 'photo')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const out: StoryPostDto[] = [];
    for (const row of rows ?? []) {
      const ok = await canViewTier(
        this.supabase,
        row.author_id,
        viewerId,
        row.visible_to_tier as Tier
      );
      if (!ok) continue;
      out.push(await this.toPostDto(row));
    }
    return out;
  }

  // --- List posts ---

  /**
   * Friend view: only LIVE updates (still inside the 24h window).
   * Own view: live + archived (until free retention expires / co-op forever),
   * so Profile calendar and "watch it back" still work after the tray drops them.
   */
  async listPosts(viewerId: string, authorIdParam: string): Promise<StoryPostDto[]> {
    const authorId =
      authorIdParam === 'me' || authorIdParam === 'mine'
        ? viewerId
        : authorIdParam;
    const isOwner = authorId === viewerId;
    const nowIso = new Date().toISOString();

    let query = this.supabase.admin
      .from('stories')
      .select(
        'id, author_id, type, update_text, theme_slug, created_at, media_id, visible_to_tier, expires_at, live_until'
      )
      .eq('author_id', authorId)
      .in('type', ['photo', 'video'])
      .order('created_at', { ascending: true });

    if (isOwner) {
      // Archive for the author: keep past-live posts until retention (or forever for co-op).
      const coop = await this.coop.isActiveMember(authorId);
      if (!coop) {
        query = query.or(`expires_at.is.null,expires_at.gt.${nowIso}`);
      }
    } else {
      // Friends only see the live tray window — after 24h the picture is archived for the author only.
      query = query.gt('live_until', nowIso);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const out: StoryPostDto[] = [];
    for (const row of rows ?? []) {
      const ok = await canViewTier(
        this.supabase,
        authorId,
        viewerId,
        row.visible_to_tier as Tier
      );
      if (!ok) continue;
      out.push(await this.toPostDto(row));
    }
    return out;
  }

  /**
   * Profile → Stories calendar. Day-of-month → emoji peek for the author's
   * own archive (live + past-24h posts that have not hit retention delete).
   */
  async listArchive(
    userId: string,
    month?: string
  ): Promise<{ days: Record<number, string>; month: string }> {
    const now = new Date();
    const ym =
      month && /^\d{4}-\d{2}$/.test(month)
        ? month
        : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const [y, m] = ym.split('-').map(Number);
    const start = new Date(Date.UTC(y!, m! - 1, 1)).toISOString();
    const end = new Date(Date.UTC(y!, m!, 1)).toISOString();
    const nowIso = now.toISOString();
    const coop = await this.coop.isActiveMember(userId);

    let query = this.supabase.admin
      .from('stories')
      .select('id, type, created_at, expires_at')
      .eq('author_id', userId)
      .in('type', ['photo', 'video'])
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: true });

    if (!coop) {
      query = query.or(`expires_at.is.null,expires_at.gt.${nowIso}`);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const days: Record<number, string> = {};
    for (const row of rows ?? []) {
      const day = new Date(row.created_at).getUTCDate();
      // Last post that day wins the calendar peek.
      days[day] = row.type === 'video' ? '🎥' : '📸';
    }
    return { days, month: ym };
  }

  private async requireViewableStory(viewerId: string, storyId: string) {
    const { data: story, error } = await this.supabase.admin
      .from('stories')
      .select('id, author_id, visible_to_tier, live_until, expires_at')
      .eq('id', storyId)
      .maybeSingle();
    if (error) throw error;
    if (!story) throw new NotFoundException('Story not found');

    const isOwner = story.author_id === viewerId;
    const now = Date.now();

    // Friends cannot open (or reply on) a story past the 24h live window —
    // that picture lives in the author's archive only.
    if (!isOwner) {
      if (story.live_until && new Date(story.live_until).getTime() <= now) {
        throw new NotFoundException('Story is no longer available');
      }
    } else if (
      story.expires_at &&
      new Date(story.expires_at).getTime() <= now
    ) {
      // Free retention rolled off — even the author cannot open it.
      throw new NotFoundException('Story is no longer available');
    }

    const ok = await canViewTier(
      this.supabase,
      story.author_id,
      viewerId,
      story.visible_to_tier as Tier
    );
    if (!ok) throw new ForbiddenException('Not allowed');
    return story;
  }

  // --- Replies ---

  async listReplies(viewerId: string, postId: string): Promise<Reaction[]> {
    await this.requireViewableStory(viewerId, postId);

    const { data: rows, error } = await this.supabase.admin
      .from('reactions')
      .select('*')
      .eq('story_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const out: Reaction[] = [];
    for (const r of rows ?? []) {
      let videoUri: string | undefined;
      if (r.kind === 'circleVideo' && r.media_id) {
        const { data: media } = await this.supabase.admin
          .from('media')
          .select('storage_path')
          .eq('id', r.media_id)
          .maybeSingle();
        const url = await this.signMedia(media?.storage_path);
        videoUri = url ?? undefined;
      }
      out.push({
        id: r.id,
        postId: r.story_id,
        authorId: r.author_id,
        kind: r.kind as ReactionKind,
        text: r.text ?? undefined,
        stickerId: r.sticker_id ?? undefined,
        videoUri,
        parentReactionId: r.parent_reaction_id ?? undefined,
        at: r.created_at
      });
    }
    return out;
  }

  async addReply(
    userId: string,
    postId: string,
    body: {
      kind: ReactionKind;
      text?: string;
      stickerId?: string;
      mediaId?: string;
      parentReactionId?: string;
      videoSeconds?: number;
    }
  ): Promise<Reaction> {
    const story = await this.requireViewableStory(userId, postId);

    if (body.kind === 'circleVideo') {
      if (!(await this.coop.isActiveMember(userId))) {
        throw new ForbiddenException('Video reactions require co-op membership');
      }
      if (!body.mediaId) {
        throw new BadRequestException('circleVideo requires mediaId');
      }
      const { data: media } = await this.supabase.admin
        .from('media')
        .select('owner_id, kind')
        .eq('id', body.mediaId)
        .maybeSingle();
      if (!media || media.owner_id !== userId) {
        throw new ForbiddenException('Media not owned by you');
      }
    }

    const { data: row, error } = await this.supabase.admin
      .from('reactions')
      .insert({
        story_id: postId,
        author_id: userId,
        kind: body.kind,
        text: body.text ?? null,
        sticker_id: body.stickerId ?? null,
        media_id: body.mediaId ?? null,
        parent_reaction_id: body.parentReactionId ?? null
      })
      .select('*')
      .single();
    if (error) throw error;

    // Notify the story author (not yourself). Payload = opaque ids only.
    if (story.author_id !== userId) {
      await this.supabase.admin.from('notifications').insert({
        user_id: story.author_id,
        kind: 'story_reply',
        payload: { story_id: postId, from: userId, post_id: postId } as never
      });
    }

    let videoUri: string | undefined;
    if (row.kind === 'circleVideo' && row.media_id) {
      const { data: media } = await this.supabase.admin
        .from('media')
        .select('storage_path')
        .eq('id', row.media_id)
        .maybeSingle();
      videoUri = (await this.signMedia(media?.storage_path)) ?? undefined;
    }

    return {
      id: row.id,
      postId: row.story_id,
      authorId: row.author_id,
      kind: row.kind as ReactionKind,
      text: row.text ?? undefined,
      stickerId: row.sticker_id ?? undefined,
      videoUri,
      videoSeconds: body.videoSeconds,
      parentReactionId: row.parent_reaction_id ?? undefined,
      at: row.created_at
    };
  }

  // --- Catch-Up ---

  async getCatchUp(
    viewerId: string,
    authorIdParam: string
  ): Promise<CatchUpBundleDto> {
    const authorId =
      authorIdParam === 'me' || authorIdParam === 'mine'
        ? viewerId
        : authorIdParam;

    if (await isBlocked(this.supabase, authorId, viewerId)) {
      throw new ForbiddenException('Not allowed');
    }
    // Catch-Up needs at least acquaintance visibility of the person.
    const ok = await canViewTier(
      this.supabase,
      authorId,
      viewerId,
      'acquaintance'
    );
    if (!ok && authorId !== viewerId) {
      throw new ForbiddenException('Not allowed');
    }

    const { data: summaries } = await this.supabase.admin
      .from('day_summaries')
      .select('date, text')
      .eq('author_id', authorId)
      .order('date', { ascending: false })
      .limit(7);

    const week = (summaries ?? [])
      .slice()
      .reverse()
      .map((s) => {
        const d = new Date(s.date + 'T12:00:00Z');
        const day = d.toLocaleDateString('en-US', {
          weekday: 'long',
          timeZone: 'UTC'
        });
        return {
          day,
          note: '',
          caption: s.text ?? '',
          emoji: '📸',
          accent: 'purple'
        };
      });

    // Currently song/book from attributes when the viewer may see friend-tier facts.
    let currently = {
      listening: {
        title: '',
        artist: '',
        emoji: '💿',
        previewUrl: null as string | null,
        spotifyId: null as string | null,
        spotifyUri: null as string | null,
        artworkUrl: null as string | null
      },
      reading: { title: '', author: '', emoji: '📖' }
    };
    const canSeeCurrently = await canViewTier(
      this.supabase,
      authorId,
      viewerId,
      'friend'
    );
    if (canSeeCurrently) {
      // Prefer music_picks.listening_now when present; fall back to attribute.
      const { data: pick } = await this.supabase.admin
        .from('music_picks')
        .select('*')
        .eq('owner_id', authorId)
        .eq('kind', 'listening_now')
        .maybeSingle();
      if (pick) {
        currently = {
          ...currently,
          listening: {
            title: pick.title ?? '',
            artist: pick.artist_name ?? '',
            emoji: '💿',
            previewUrl: pick.preview_url,
            spotifyId: pick.spotify_id,
            spotifyUri: pick.spotify_uri,
            artworkUrl: pick.artwork_url
          }
        };
      }

      const { data: attrs } = await this.supabase.admin
        .from('attributes')
        .select('key, value')
        .eq('owner_id', authorId)
        .in('key', ['currently_song', 'currently_book']);
      for (const a of attrs ?? []) {
        const v = a.value as Record<string, string>;
        if (a.key === 'currently_song' && !pick) {
          currently = {
            ...currently,
            listening: {
              title: v.title ?? '',
              artist: v.artist ?? '',
              emoji: '💿',
              previewUrl: (v as { previewUrl?: string }).previewUrl ?? null,
              spotifyId: (v as { spotifyId?: string }).spotifyId ?? null,
              spotifyUri: (v as { spotifyUri?: string }).spotifyUri ?? null,
              artworkUrl: (v as { artworkUrl?: string }).artworkUrl ?? null
            }
          };
        }
        if (a.key === 'currently_book') {
          currently = {
            ...currently,
            reading: {
              title: v.title ?? '',
              author: v.author ?? '',
              emoji: '📖'
            }
          };
        }
      }
    }

    // TODO: polls + event RSVP when those modules ship
    return { live: [], answered: [], week, currently };
  }

  /** Stub until polls/events land — keeps the mobile TODO clear. */
  async answerCatchUp(_userId: string, _itemId: string): Promise<{ ok: true }> {
    return { ok: true };
  }
}
