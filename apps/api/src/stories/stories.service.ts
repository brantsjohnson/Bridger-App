// ============================================
// WHAT THIS FILE DOES (plain English):
// Updates ("stories", shown to people as Scrapbook pages) on the server: post a
// page, change a page you posted earlier today, delete a page, list someone's
// posts, reply with text / sticker / circle video, Catch-Up bundle, the daily
// limit (4 photos or videos across all of today's pages), and the Profile
// calendar archive.
//
// A post is one `stories` row. Since 0054 it can point at a `scrapbook_pages`
// row (the editable 8.5 x 11 page with its elements). Old rows with no page
// still work: they are drawn as a one-photo page at read time.
//
// Two clocks: live_until (~24h) = leaves Home tray / friends can't open — the
// picture is archived for the author. expires_at (~30d free / null co-op) =
// when free media may be deleted for real.
//
// PRIVACY: tier + blocks re-checked on every read. Photos are never sent to a
// model. Signed URLs expire so storage paths never leak to the client.
// visible_to_tier 'none' = "Only me": nobody but the author can read it.
// PAYMENT: posting video (a video element on a page) requires co-op.
// ============================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DAILY_SCRAPBOOK_MEDIA_LIMIT,
  legacyStoryToScrapbookPage,
  type BackgroundConfig,
  type Json,
  type LayoutFamily,
  type Reaction,
  type ReactionKind,
  type ScrapbookElement,
  type ScrapbookElementType,
  type ScrapbookPage,
  type TablesInsert,
  type Tier
} from '@bridger/shared';

/** One element row ready to insert (page_id added at insert time). */
type ElementInsert = Omit<TablesInsert<'scrapbook_elements'>, 'page_id'>;
import { AiJobsService } from '../ai/ai-jobs.service';
import { canViewTier, isBlocked } from '../common/visibility';
import { CoopService } from '../coop/coop.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SupabaseService } from '../supabase/supabase.service';

/** Photos + videos allowed across all of today's pages. Defined once in packages/shared. */
const DAILY_CAP = DAILY_SCRAPBOOK_MEDIA_LIMIT;
/** Free-tier rolling retention — after this, media can be deleted. */
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Element types the database accepts (mirrors the check constraint in 0054). */
const ELEMENT_TYPES: ReadonlyArray<ScrapbookElementType> = [
  'photo', 'video', 'text', 'voice', 'person', 'place', 'map', 'sticker',
  'cutout', 'clipping', 'frame', 'shape', 'image', 'date', 'event_reference'
];
const MEDIA_SOURCES = ['bridger_camera', 'camera_roll', 'event', 'shared'] as const;

/** What the phone sends for a page (elements carry media ids, never files). */
export type PageInputDto = {
  layoutId?: string;
  layoutFamily?: LayoutFamily;
  background?: BackgroundConfig;
  elements: Array<Partial<ScrapbookElement> & { type: ScrapbookElementType }>;
};

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
  /** Flattened page preview (or the single photo for legacy posts). */
  mediaUrl: string | null;
  /** Who can see it (the author needs this back to edit the page). */
  visibleToTier: Tier;
  /** Goes up each time the author changes the page after posting. */
  revision: number;
  /** The editable page. Legacy posts get a one-photo page built at read time. */
  page: ScrapbookPage;
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
    private readonly aiJobs: AiJobsService,
    private readonly notifications: NotificationsService
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

  /**
   * Turn a raw Supabase / Postgres error into a Nest HTTP error the phone can show.
   * Missing scrapbook tables (migration 0054 not applied) used to surface as a
   * bare "Internal server error" with no hint.
   */
  private throwDb(error: unknown): never {
    const err = error as { code?: string; message?: string; details?: string } | null;
    const msg = `${err?.message ?? ''} ${err?.details ?? ''}`;
    if (
      err?.code === '42P01' ||
      /scrapbook_pages|scrapbook_elements|relation .* does not exist/i.test(msg)
    ) {
      throw new ServiceUnavailableException(
        'Posting pages is not ready on this server yet. Please try again later.'
      );
    }
    if (err?.code === '23503') {
      throw new BadRequestException('A photo or video on this page could not be found.');
    }
    if (err?.code === '23514') {
      throw new BadRequestException('That page layout is not allowed.');
    }
    throw new InternalServerErrorException(
      'Could not post. Please try again in a moment.'
    );
  }

  /** Start of today's UTC day (quota window). */
  private utcDayStart(): string {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  /**
   * How many photos + videos this person has used today, across every page.
   * Pages count their photo/video elements; a legacy post (no page) counts 1.
   * `excludeStoryId` lets an edit re-count without the page being changed.
   */
  private async countToday(authorId: string, excludeStoryId?: string): Promise<number> {
    const { data: rows, error } = await this.supabase.admin
      .from('stories')
      .select('id, page_id')
      .eq('author_id', authorId)
      .gte('created_at', this.utcDayStart());
    if (error) throw error;
    let used = 0;
    const pageIds: string[] = [];
    for (const r of rows ?? []) {
      if (excludeStoryId && r.id === excludeStoryId) continue;
      if (r.page_id) pageIds.push(r.page_id);
      else used += 1;
    }
    if (pageIds.length) {
      const { count, error: cErr } = await this.supabase.admin
        .from('scrapbook_elements')
        .select('id', { count: 'exact', head: true })
        .in('page_id', pageIds)
        .in('type', ['photo', 'video']);
      if (cErr) throw cErr;
      used += count ?? 0;
    }
    return used;
  }

  /** Sign the storage path behind a media row id (null when missing). */
  private async signMediaId(mediaId: string | null | undefined): Promise<string | null> {
    if (!mediaId) return null;
    const { data: media } = await this.supabase.admin
      .from('media')
      .select('storage_path')
      .eq('id', mediaId)
      .maybeSingle();
    return this.signMedia(media?.storage_path);
  }

  // THIS SECTION DOES: load a page + its elements and turn storage paths into
  // short-lived signed URLs so the phone can draw it.
  private async loadPage(pageId: string): Promise<ScrapbookPage | null> {
    const { data: page, error } = await this.supabase.admin
      .from('scrapbook_pages')
      .select('id, story_id, aspect_ratio, background, layout_id, layout_family, revision')
      .eq('id', pageId)
      .maybeSingle();
    if (error) throw error;
    if (!page) return null;
    const { data: els, error: eErr } = await this.supabase.admin
      .from('scrapbook_elements')
      .select('*')
      .eq('page_id', pageId)
      .order('z_index', { ascending: true });
    if (eErr) throw eErr;

    const elements: ScrapbookElement[] = [];
    for (const e of els ?? []) {
      elements.push({
        id: e.id,
        type: e.type as ScrapbookElementType,
        x: Number(e.x),
        y: Number(e.y),
        width: Number(e.width),
        height: Number(e.height),
        rotation: Number(e.rotation ?? 0),
        zIndex: e.z_index ?? 0,
        slot: e.slot ?? undefined,
        locked: e.locked ?? false,
        userModified: e.user_modified ?? false,
        source: (e.source ?? undefined) as ScrapbookElement['source'],
        mediaId: e.media_id ?? undefined,
        uri: (await this.signMediaId(e.media_id)) ?? undefined,
        data: (e.data ?? {}) as ScrapbookElement['data']
      });
    }
    return {
      id: page.id,
      storyId: page.story_id ?? undefined,
      aspectRatio: Number(page.aspect_ratio),
      background: (page.background ?? { kind: 'solid' }) as unknown as BackgroundConfig,
      layoutId: page.layout_id ?? undefined,
      layoutFamily: (page.layout_family ?? undefined) as LayoutFamily | undefined,
      elements,
      revision: page.revision ?? 1
    };
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
    page_id?: string | null;
    revision?: number | null;
    visible_to_tier?: string | null;
  }): Promise<StoryPostDto> {
    const mediaUrl = await this.signMediaId(row.media_id);
    const type = row.type === 'video' ? 'video' : 'photo';
    // Page: the real one when it exists, else a one-photo page built on the fly.
    const page =
      (row.page_id ? await this.loadPage(row.page_id) : null) ??
      legacyStoryToScrapbookPage({
        storyId: row.id,
        type,
        mediaUri: mediaUrl,
        mediaId: row.media_id
      });
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
      mediaUrl,
      visibleToTier: (row.visible_to_tier ?? 'friend') as Tier,
      revision: row.revision ?? 1,
      page
    };
  }

  /** Columns every post read needs (kept in one place so DTOs stay complete). */
  private readonly postColumns =
    'id, author_id, type, update_text, theme_slug, event_id, created_at, media_id, page_id, revision, visible_to_tier, expires_at, live_until';

  // --- Quota ---

  async getQuota(userId: string): Promise<{ left: number; cap: number }> {
    const used = await this.countToday(userId);
    return { left: Math.max(0, DAILY_CAP - used), cap: DAILY_CAP };
  }

  // --- Page validation (shared by create + update) ---

  /** Paper settings as plain JSON for the jsonb column (with the eggshell default). */
  private backgroundJson(bg: BackgroundConfig | undefined): Json {
    return (bg ?? { kind: 'solid', color: '#F4F1E7' }) as unknown as Json;
  }

  /** Accept 'none' (Only me) plus the three circles; anything else = friend. */
  private normalizeTier(t: Tier | undefined): Tier {
    return t === 'none' || t === 'close' || t === 'friend' || t === 'acquaintance'
      ? t
      : 'friend';
  }

  /**
   * Check a page's elements: known types, sane numbers, media rows owned by
   * this person, video only for co-op. Returns the cleaned rows to insert.
   */
  private async validatePage(
    userId: string,
    page: PageInputDto,
    isCoop: boolean
  ): Promise<{
    rows: ElementInsert[];
    mediaCount: number;
    hasVideo: boolean;
  }> {
    if (!Array.isArray(page.elements)) {
      throw new BadRequestException('Page needs elements');
    }
    if (page.elements.length > 60) {
      throw new BadRequestException('Too many elements on one page');
    }
    const clamp = (n: unknown, lo: number, hi: number, fallback: number) => {
      const v = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
      return Math.min(hi, Math.max(lo, v));
    };
    const rows: ElementInsert[] = [];
    let mediaCount = 0;
    let hasVideo = false;
    for (const el of page.elements) {
      if (!ELEMENT_TYPES.includes(el.type)) {
        throw new BadRequestException(`Unknown element type ${String(el.type)}`);
      }
      const isMedia = el.type === 'photo' || el.type === 'video';
      if (isMedia) {
        mediaCount += 1;
        if (el.type === 'video') hasVideo = true;
        if (!el.mediaId) {
          throw new BadRequestException('Photo or video element is missing its upload');
        }
        const { data: media, error } = await this.supabase.admin
          .from('media')
          .select('id, owner_id, kind')
          .eq('id', el.mediaId)
          .maybeSingle();
        if (error) throw error;
        if (!media || media.owner_id !== userId) {
          throw new ForbiddenException('Media not owned by you');
        }
        if (el.type === 'video' && media.kind !== 'video') {
          throw new BadRequestException('Media kind mismatch');
        }
        if (el.type === 'photo' && media.kind !== 'photo') {
          throw new BadRequestException('Media kind mismatch');
        }
      }
      // Never persist a local file uri; the client rebuilds it from the signed URL.
      const data: Json =
        el.data && typeof el.data === 'object' && !Array.isArray(el.data)
          ? (el.data as unknown as Json)
          : {};
      rows.push({
        type: el.type,
        x: clamp(el.x, -0.5, 1.5, 0),
        y: clamp(el.y, -0.5, 1.5, 0),
        width: clamp(el.width, 0.01, 1.5, 0.5),
        height: clamp(el.height, 0.01, 1.5, 0.5),
        rotation: clamp(el.rotation, -360, 360, 0),
        z_index: Math.round(clamp(el.zIndex, -1000, 1000, 0)),
        slot: typeof el.slot === 'number' ? Math.round(el.slot) : null,
        locked: !!el.locked,
        user_modified: !!el.userModified,
        source:
          el.source && (MEDIA_SOURCES as ReadonlyArray<string>).includes(el.source)
            ? el.source
            : null,
        media_id: isMedia ? (el.mediaId ?? null) : null,
        data
      });
    }
    if (mediaCount === 0) {
      throw new BadRequestException('A page needs at least one photo or video');
    }
    // PAYMENT: video on a page is a co-op unlock.
    if (hasVideo && !isCoop) {
      throw new ForbiddenException('Video updates require co-op membership');
    }
    return { rows, mediaCount, hasVideo };
  }

  // --- Create ---

  async create(
    userId: string,
    body: {
      type: 'photo' | 'video';
      /** Legacy: the single photo. With `page`: the flattened page preview. */
      mediaId?: string;
      caption?: string;
      themeSlug?: string;
      visibleToTier?: Tier;
      eventId?: string;
      /** The Scrapbook page (elements with uploaded media ids). */
      page?: PageInputDto;
    }
  ): Promise<StoryPostDto> {
    // THIS SECTION DOES: new-style posts carry a page; hand those off.
    if (body.page) {
      return this.createWithPage(userId, { ...body, page: body.page });
    }

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

    const visible: Tier = this.normalizeTier(body.visibleToTier);

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
      .select(`${this.postColumns}, transcript`)
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

  // --- Create (Scrapbook page) ---

  /**
   * Post a new page. Order matters: story row first (so the page can point at
   * it), then the page, then its elements, then the story learns its page id.
   * The daily limit counts photos + videos across every page posted today.
   */
  private async createWithPage(
    userId: string,
    body: {
      mediaId?: string;
      caption?: string;
      themeSlug?: string;
      visibleToTier?: Tier;
      eventId?: string;
      page: PageInputDto;
    }
  ): Promise<StoryPostDto> {
    const coop = await this.coop.isActiveMember(userId);
    const { rows, mediaCount, hasVideo } = await this.validatePage(userId, body.page, coop);

    const used = await this.countToday(userId);
    if (used + mediaCount > DAILY_CAP) {
      throw new BadRequestException('Daily post quota reached');
    }

    // Preview media (the flattened page) must be yours too.
    if (body.mediaId) {
      const { data: media, error } = await this.supabase.admin
        .from('media')
        .select('id, owner_id')
        .eq('id', body.mediaId)
        .maybeSingle();
      if (error) throw error;
      if (!media || media.owner_id !== userId) {
        throw new ForbiddenException('Media not owned by you');
      }
    }

    if (body.eventId) {
      await this.assertCanTagEvent(userId, body.eventId);
    }

    const visible = this.normalizeTier(body.visibleToTier);
    const expires = coop ? null : new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
    const caption = body.caption?.trim() || null;
    const type: 'photo' | 'video' = hasVideo ? 'video' : 'photo';

    const { data: story, error: sErr } = await this.supabase.admin
      .from('stories')
      .insert({
        author_id: userId,
        type,
        media_id: body.mediaId ?? null,
        update_text: caption,
        theme_slug: body.themeSlug ?? null,
        visible_to_tier: visible,
        event_id: body.eventId ?? null,
        expires_at: expires,
        revision: 1
      })
      .select(this.postColumns)
      .single();
    if (sErr) this.throwDb(sErr);

    const { data: page, error: pErr } = await this.supabase.admin
      .from('scrapbook_pages')
      .insert({
        author_id: userId,
        story_id: story.id,
        background: this.backgroundJson(body.page.background),
        layout_id: body.page.layoutId ?? null,
        layout_family: body.page.layoutFamily ?? null,
        revision: 1
      })
      .select('id')
      .single();
    if (pErr) this.throwDb(pErr);

    const { error: eErr } = await this.supabase.admin
      .from('scrapbook_elements')
      .insert(rows.map((r) => ({ ...r, page_id: page.id })));
    if (eErr) this.throwDb(eErr);

    const { data: linked, error: lErr } = await this.supabase.admin
      .from('stories')
      .update({ page_id: page.id })
      .eq('id', story.id)
      .select(this.postColumns)
      .single();
    if (lErr) this.throwDb(lErr);

    // Keep every media file's retention in step with the post (free tier).
    const mediaIds = rows
      .map((r) => r.media_id ?? null)
      .filter((id): id is string => !!id)
      .concat(body.mediaId ? [body.mediaId] : []);
    if (mediaIds.length) {
      await this.supabase.admin
        .from('media')
        .update({ expires_at: expires })
        .in('id', mediaIds)
        .eq('owner_id', userId);
    }

    // PRIVACY / AI: day summary from words only, never photos.
    if (caption) {
      await this.aiJobs.enqueueDaySummary({
        authorId: userId,
        date: new Date().toISOString().slice(0, 10),
        caption,
        transcript: ''
      });
    }

    return this.toPostDto(linked);
  }

  // --- Update a page you posted (same day adds, layout changes, caption, audience) ---

  /**
   * Replace the page behind one of your posts. Elements are swapped wholesale
   * (delete + insert) because the client owns the layout. Bumps `revision` so
   * friends who already watched see the ring light again.
   */
  async updatePage(
    userId: string,
    storyId: string,
    body: {
      page: PageInputDto;
      /** New flattened preview (optional; keep the old one when missing). */
      mediaId?: string;
      caption?: string;
      visibleToTier?: Tier;
    }
  ): Promise<StoryPostDto> {
    const { data: story, error } = await this.supabase.admin
      .from('stories')
      .select(this.postColumns)
      .eq('id', storyId)
      .maybeSingle();
    if (error) throw error;
    if (!story) throw new NotFoundException('Story not found');
    if (story.author_id !== userId) throw new ForbiddenException('Not your post');

    const coop = await this.coop.isActiveMember(userId);
    const { rows, mediaCount, hasVideo } = await this.validatePage(userId, body.page, coop);

    // Daily limit: everything else today + this page's new count.
    const usedElsewhere = await this.countToday(userId, storyId);
    if (usedElsewhere + mediaCount > DAILY_CAP) {
      throw new BadRequestException('Daily post quota reached');
    }

    if (body.mediaId) {
      const { data: media, error: mErr } = await this.supabase.admin
        .from('media')
        .select('id, owner_id')
        .eq('id', body.mediaId)
        .maybeSingle();
      if (mErr) throw mErr;
      if (!media || media.owner_id !== userId) {
        throw new ForbiddenException('Media not owned by you');
      }
    }

    // Page row: create one for a legacy post being edited for the first time.
    let pageId = story.page_id as string | null;
    const nextRevision = (story.revision ?? 1) + 1;
    if (!pageId) {
      const { data: page, error: pErr } = await this.supabase.admin
        .from('scrapbook_pages')
        .insert({
          author_id: userId,
          story_id: story.id,
          background: this.backgroundJson(body.page.background),
          layout_id: body.page.layoutId ?? null,
          layout_family: body.page.layoutFamily ?? null,
          revision: nextRevision
        })
        .select('id')
        .single();
      if (pErr) throw pErr;
      pageId = page.id;
    } else {
      const { error: uErr } = await this.supabase.admin
        .from('scrapbook_pages')
        .update({
          background: this.backgroundJson(body.page.background),
          layout_id: body.page.layoutId ?? null,
          layout_family: body.page.layoutFamily ?? null,
          revision: nextRevision
        })
        .eq('id', pageId)
        .eq('author_id', userId);
      if (uErr) throw uErr;
      const { error: dErr } = await this.supabase.admin
        .from('scrapbook_elements')
        .delete()
        .eq('page_id', pageId);
      if (dErr) throw dErr;
    }

    const { error: eErr } = await this.supabase.admin
      .from('scrapbook_elements')
      .insert(rows.map((r) => ({ ...r, page_id: pageId })));
    if (eErr) throw eErr;

    const caption =
      body.caption === undefined ? story.update_text : body.caption.trim() || null;
    const visible =
      body.visibleToTier === undefined
        ? (story.visible_to_tier as Tier)
        : this.normalizeTier(body.visibleToTier);

    const { data: updated, error: sErr } = await this.supabase.admin
      .from('stories')
      .update({
        page_id: pageId,
        revision: nextRevision,
        type: hasVideo ? 'video' : 'photo',
        media_id: body.mediaId ?? story.media_id,
        update_text: caption,
        visible_to_tier: visible
      })
      .eq('id', storyId)
      .select(this.postColumns)
      .single();
    if (sErr) throw sErr;

    // New media on the page inherits the post's retention.
    const mediaIds = rows
      .map((r) => r.media_id ?? null)
      .filter((id): id is string => !!id)
      .concat(body.mediaId ? [body.mediaId] : []);
    if (mediaIds.length) {
      await this.supabase.admin
        .from('media')
        .update({ expires_at: story.expires_at ?? null })
        .in('id', mediaIds)
        .eq('owner_id', userId);
    }

    // PRIVACY / AI: re-run the day summary only when the words changed.
    if (caption && caption !== story.update_text) {
      await this.aiJobs.enqueueDaySummary({
        authorId: userId,
        date: new Date(story.created_at).toISOString().slice(0, 10),
        caption,
        transcript: ''
      });
    }

    return this.toPostDto(updated);
  }

  // --- Delete a page you posted (used when merging two pages into one) ---

  async deletePost(userId: string, storyId: string): Promise<{ ok: true }> {
    const { data: story, error } = await this.supabase.admin
      .from('stories')
      .select('id, author_id')
      .eq('id', storyId)
      .maybeSingle();
    if (error) throw error;
    if (!story) throw new NotFoundException('Story not found');
    if (story.author_id !== userId) throw new ForbiddenException('Not your post');
    // Page + elements cascade from the story row (0054).
    const { error: dErr } = await this.supabase.admin
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('author_id', userId);
    if (dErr) throw dErr;
    return { ok: true };
  }

  /** Your own posts from today (all pages), oldest first. Powers the page strip. */
  async listToday(userId: string): Promise<StoryPostDto[]> {
    const { data: rows, error } = await this.supabase.admin
      .from('stories')
      .select(this.postColumns)
      .eq('author_id', userId)
      .gte('created_at', this.utcDayStart())
      .order('created_at', { ascending: true });
    if (error) throw error;
    const out: StoryPostDto[] = [];
    for (const row of rows ?? []) out.push(await this.toPostDto(row));
    return out;
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
      .select(this.postColumns)
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
      .select(this.postColumns)
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
    // Prefs gate: skip when they turned "Replies to your update" off.
    if (story.author_id !== userId) {
      await this.notifications.notifyIfAllowed({
        userId: story.author_id,
        kind: 'story_reply',
        payload: { story_id: postId, from: userId, post_id: postId } as never,
        actorCircle: undefined
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
