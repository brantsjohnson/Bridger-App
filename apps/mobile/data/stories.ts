// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the Stories ("Updates", shown as Scrapbook pages) player and
// composer need: list someone's posts, load their Catch-Up sheet, list/add
// replies, answer a poll/question, create a new page, change or delete a page
// you posted today, and the daily limit (4 photos or videos across all of
// today's pages). Demo mode keeps answers and new posts in memory for the
// session. Live mode calls the Nest /stories API.
// ============================================
import {
  DAILY_SCRAPBOOK_MEDIA_LIMIT,
  countMediaElements,
  type BackgroundConfig,
  type CatchUpItem,
  type LayoutFamily,
  type Reaction,
  type ReactionKind,
  type ScrapbookElement,
  type ScrapbookPage,
  type StoryPost,
  type ThemedPrompt,
  type Tier
} from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
import { uploadMedia } from '../lib/media-upload';
import { STORY_REPLIES as CATALOG_REPLIES } from './fixtures/catalog';
import { getDemoReplyVideo, getStoryMedia } from './fixtures/demo-media';
import {
  CATCH_UP as FIXTURE_CATCH_UP,
  POLL_RESULTS,
  STORY_CURRENTLY,
  STORY_POSTS as FIXTURE_POSTS,
  MAYA_STORY_REPLIES,
  STORY_REPLY_EXTRA,
  THEMED_PROMPTS,
  WEEK_DAYS,
  type WeekDay
} from './fixtures/stories';

export type { WeekDay };

/** Daily limit: photos + videos across all of today's pages. One constant, in packages/shared. */
const DAILY_POST_CAP = DAILY_SCRAPBOOK_MEDIA_LIMIT;

/** What Catch-Up returns, already ordered for the sheet. */
export type CatchUpBundle = {
  live: CatchUpItem[];
  answered: CatchUpItem[];
  week: WeekDay[];
  currently: typeof STORY_CURRENTLY;
};

/** Who can see a page. `only_me` = DB tier `none` (owner only). */
export type PostAudience = 'only_me' | 'close' | 'friend' | 'everyone';

/** The page as the API accepts it: elements carry media ids, never file uris. */
export type PageInput = {
  layoutId?: string;
  layoutFamily?: LayoutFamily;
  background?: BackgroundConfig;
  elements: ScrapbookElement[];
};

export type CreatePostInput = {
  type: 'photo' | 'video';
  emoji?: string;
  accent?: StoryPost['accent'];
  overlayText?: string;
  caption?: string;
  themeSlug?: string;
  /** PRIVACY: concentric audience — mapped to visible_to_tier on the API */
  audience?: PostAudience;
  group?: string | null;
  /** Tag this update to an event photo album (party capture flow). */
  eventId?: string;
  /**
   * Local file uri from the camera (or a picker). Live mode uploads this into
   * the private media bucket before calling POST /stories. Demo ignores it.
   * With `page`, this is the flattened page preview (what the feed shows).
   */
  uri?: string;
  /** Already-uploaded media row id (skips upload when set). */
  mediaId?: string;
  /**
   * The Scrapbook page. Media elements must already have `mediaId` (live) or a
   * local `uri` (demo). The composer uploads them before calling this.
   */
  page?: PageInput;
};

export type UpdatePageInput = {
  postId: string;
  page: PageInput;
  caption?: string;
  audience?: PostAudience;
  /** Local uri of the new flattened preview (uploaded here in live mode). */
  previewUri?: string;
  previewMediaId?: string;
};

export type AddReplyInput = {
  postId: string;
  kind: ReactionKind;
  text?: string;
  stickerId?: string;
  /** a sticker they made themselves */
  stickerUri?: string;
  /** the round video reply they just recorded */
  videoUri?: string;
  videoSeconds?: number;
  parentReactionId?: string;
};

/** Wire DTO from Nest (signed URL instead of a require()'d asset). */
type StoryPostDto = Omit<StoryPost, 'media'> & { mediaUrl?: string | null };

// --- DEMO STATE: mutates across the session so answering / posting feels real ---
let demoPosts: StoryPost[] = [...FIXTURE_POSTS];
let demoCatchUp: CatchUpItem[] = FIXTURE_CATCH_UP.map((i) => ({ ...i }));
let demoReplies: Reaction[] = [
  ...CATALOG_REPLIES,
  STORY_REPLY_EXTRA,
  ...MAYA_STORY_REPLIES
];
/** Demo: photos + videos already "used" today (seeded at 1 so the pill reads 1/4). */
let demoMediaUsed = 1;
/** Demo: ids of pages posted this session (the page strip shows these). */
const demoTodayIds = new Set<string>();

/** Demo: how many photos/videos a post uses (legacy fixture post = 1). */
function demoMediaCount(post: StoryPost): number {
  return post.page ? countMediaElements(post.page) : 1;
}

/**
 * When you drop photos/videos into assets/demo/stories/{name}/, those become
 * that person's updates (in file-name order). Fixture emoji posts are only used
 * when their folder is empty.
 */
function applyDroppedStoryMedia(authorId: string, posts: StoryPost[]): StoryPost[] {
  const media = getStoryMedia(authorId);
  if (media.length === 0) return posts;
  // Pages made this session keep showing after the dropped-in demo photos.
  const sessionPages = posts.filter((p) => p.page && demoTodayIds.has(p.id));
  const fromMedia = media.map((m, i) => {
    const existing = posts[i];
    return {
      id: existing?.id ?? `demo-media-${authorId}-${i}`,
      authorId,
      type: m.type,
      emoji: existing?.emoji ?? (m.type === 'video' ? '🎥' : '📸'),
      accent: existing?.accent ?? 'purple',
      overlayText: existing?.overlayText,
      caption: m.caption ?? existing?.caption,
      themeSlug: existing?.themeSlug,
      createdAt: existing?.createdAt ?? 'now',
      // Pass the require()'d asset straight through — works on web + native.
      media: m.source
    };
  });
  return [...fromMedia, ...sessionPages];
}

/** Map composer audience to the DB tier column. PRIVACY: only_me = 'none' = owner only. */
export function audienceToTier(audience?: PostAudience): Tier {
  if (audience === 'only_me') return 'none';
  if (audience === 'close') return 'close';
  if (audience === 'everyone') return 'acquaintance';
  return 'friend';
}

/** The reverse: a stored tier back to the composer's audience choice. */
export function tierToAudience(tier?: Tier): PostAudience {
  if (tier === 'none') return 'only_me';
  if (tier === 'close') return 'close';
  if (tier === 'acquaintance') return 'everyone';
  return 'friend';
}

/** Turn a signed URL from the API into what Image / Video already accept. */
function mapPostDto(dto: StoryPostDto): StoryPost {
  const { mediaUrl, ...rest } = dto;
  return {
    ...rest,
    accent: rest.accent ?? 'purple',
    emoji: rest.emoji ?? (rest.type === 'video' ? '🎥' : '📸'),
    media: mediaUrl ? { uri: mediaUrl } : undefined
  };
}

/**
 * Strip local-only fields before a page goes over the wire. The API rejects
 * media elements without a `mediaId`, so callers upload first.
 */
function pageToWire(page: PageInput): PageInput {
  return {
    layoutId: page.layoutId,
    layoutFamily: page.layoutFamily,
    background: page.background,
    elements: page.elements.map(({ uri: _uri, ...el }) => el)
  };
}

/**
 * List that author's posts (newest last so the player advances forward).
 * PRIVACY: live API tier-filters; demo returns all seeded posts.
 */
export async function listPosts(authorId: string): Promise<StoryPost[]> {
  if (isDemoMode()) {
    const id = authorId === 'mine' ? 'me' : authorId;
    const posts = demoPosts.filter((p) => p.authorId === id);
    return applyDroppedStoryMedia(id, posts);
  }
  const rows = await apiFetch<StoryPostDto[]>(
    `/stories/${encodeURIComponent(authorId)}/posts`
  );
  return rows.map(mapPostDto);
}

/**
 * Catch-Up for one author: actionable first, week hero, answered receipts last.
 * PRIVACY: answered rail omits poll results — callers never get POLL_RESULTS here.
 * PRIVACY / AI: week captions are user text only; never send photos to a model.
 */
export async function getCatchUp(authorId: string): Promise<CatchUpBundle> {
  if (isDemoMode()) {
    const live = demoCatchUp.filter((i) => !i.answeredByViewer);
    const answered = demoCatchUp.filter((i) => i.answeredByViewer);
    return {
      live,
      answered,
      week: WEEK_DAYS,
      currently: STORY_CURRENTLY
    };
  }
  const bundle = await apiFetch<CatchUpBundle>(
    `/stories/${encodeURIComponent(authorId)}/catch-up`
  );
  return {
    live: bundle.live ?? [],
    answered: bundle.answered ?? [],
    week: (bundle.week ?? []) as WeekDay[],
    currently: bundle.currently ?? {
      listening: { title: '', artist: '', emoji: '💿' },
      reading: { title: '', author: '', emoji: '📖' }
    }
  };
}

/**
 * Attach a real demo clip to seeded circle-video replies that were saved
 * without media (so the thread shows the video, not the purple empty badge).
 */
function hydrateDemoReply(r: Reaction): Reaction {
  if (r.kind !== 'circleVideo') return r;
  if (r.videoUri || r.videoMedia) return r;
  const videoMedia = getDemoReplyVideo(r.authorId);
  if (!videoMedia) return r;
  return {
    ...r,
    videoMedia,
    videoSeconds: r.videoSeconds ?? 8
  };
}

/** Replies for one post (including nested children via parentReactionId). */
export async function listReplies(postId: string): Promise<Reaction[]> {
  if (isDemoMode()) {
    return demoReplies.filter((r) => r.postId === postId).map(hydrateDemoReply);
  }
  return apiFetch<Reaction[]>(
    `/stories/posts/${encodeURIComponent(postId)}/replies`
  );
}

/** Add a reply (text / sticker / circle-video). Demo appends in memory. */
export async function addReply(input: AddReplyInput): Promise<Reaction> {
  if (isDemoMode()) {
    const next: Reaction = {
      id: `r-${Date.now()}`,
      postId: input.postId,
      authorId: 'me',
      kind: input.kind,
      text: input.text,
      stickerId: input.stickerId,
      stickerUri: input.stickerUri,
      videoUri: input.videoUri,
      videoSeconds: input.videoSeconds,
      parentReactionId: input.parentReactionId,
      at: 'now'
    };
    demoReplies = [...demoReplies, next];
    return next;
  }

  // Circle-video: upload the clip first, then send the media id.
  let mediaId: string | undefined;
  if (input.kind === 'circleVideo' && input.videoUri) {
    mediaId = await uploadMedia(
      input.videoUri,
      'video',
      `reactions/${Date.now()}`
    );
  }

  return apiFetch<Reaction>(
    `/stories/posts/${encodeURIComponent(input.postId)}/replies`,
    {
      method: 'POST',
      body: JSON.stringify({
        kind: input.kind,
        text: input.text,
        stickerId: input.stickerId,
        mediaId,
        parentReactionId: input.parentReactionId,
        videoSeconds: input.videoSeconds
      })
    }
  );
}

/**
 * Answer a Catch-Up poll / question / event RSVP.
 * The item sinks to the answered rail; results stay hidden from the UI.
 * Live route is a stub until polls/events ship.
 */
export async function answerCatchUpItem(
  itemId: string,
  _choice: string
): Promise<void> {
  if (isDemoMode()) {
    demoCatchUp = demoCatchUp.map((i) =>
      i.id === itemId ? { ...i, answeredByViewer: true, actionable: false } : i
    );
    return;
  }
  await apiFetch(`/stories/catch-up/${encodeURIComponent(itemId)}/answer`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

/** Themed capture squares. Seed fixtures first so the UI never waits on the API. */
export async function listThemedPrompts(): Promise<ThemedPrompt[]> {
  if (isDemoMode()) return THEMED_PROMPTS;
  try {
    const rows = await apiFetch<ThemedPrompt[]>('/content/themed-prompts');
    // Empty admin config → keep the three defaults so capture is never blank.
    return rows.length > 0 ? rows : THEMED_PROMPTS;
  } catch {
    return THEMED_PROMPTS;
  }
}

/** How many photos/videos you can still add today (cap 4 across all pages). */
export async function getPostQuota(): Promise<{ left: number; cap: number }> {
  if (isDemoMode()) {
    return { left: Math.max(0, DAILY_POST_CAP - demoMediaUsed), cap: DAILY_POST_CAP };
  }
  // THIS SECTION DOES: if the phone cannot reach the API (common on device
  // builds pointed at a dead host), keep the default so capture still opens
  // instead of throwing a red LogBox over the shutter.
  try {
    return await apiFetch<{ left: number; cap: number }>('/stories/quota');
  } catch {
    return { left: DAILY_POST_CAP, cap: DAILY_POST_CAP };
  }
}

/**
 * Upload every photo/video element on a page that still only has a local file
 * uri, and return the page with `mediaId`s filled in. Elements that already
 * uploaded (mediaId set) are left alone, so re-posting the same page is cheap.
 */
export async function uploadPageMedia(page: PageInput): Promise<PageInput> {
  const elements: ScrapbookElement[] = [];
  for (const el of page.elements) {
    const isMedia = el.type === 'photo' || el.type === 'video';
    if (isMedia && !el.mediaId && el.uri) {
      const mediaId = await uploadMedia(
        el.uri,
        el.type === 'video' ? 'video' : 'photo',
        `stories/page-${Date.now()}-${el.id}`
      );
      elements.push({ ...el, mediaId });
    } else {
      elements.push(el);
    }
  }
  return { ...page, elements };
}

/**
 * Create a new update for "me".
 * PAYMENT: video posting is a co-op unlock — callers should gate before calling;
 * demo still accepts video so the lock UI can be previewed separately.
 * With `page`, the daily limit counts the page's photos + videos.
 */
export async function createPost(input: CreatePostInput): Promise<StoryPost> {
  if (isDemoMode()) {
    const cost = input.page ? countMediaElements(input.page) : 1;
    if (demoMediaUsed + cost > DAILY_POST_CAP) {
      throw new Error('Daily post quota reached');
    }
    const next: StoryPost = {
      id: `sp-me-${Date.now()}`,
      authorId: 'me',
      type: input.type,
      emoji: input.emoji ?? (input.type === 'video' ? '🎥' : '📸'),
      accent: input.accent ?? 'purple',
      overlayText: input.overlayText,
      caption: input.caption,
      themeSlug: input.themeSlug,
      eventId: input.eventId,
      createdAt: 'now',
      media: input.uri ? { uri: input.uri } : undefined,
      page: input.page
        ? {
            id: `page-${Date.now()}`,
            aspectRatio: 8.5 / 11,
            revision: 1,
            ...input.page,
            background: input.page.background ?? { kind: 'solid', color: '#F4F1E7' }
          }
        : undefined,
      revision: 1,
      visibleToTier: audienceToTier(input.audience)
    };
    demoPosts = [...demoPosts, next];
    demoTodayIds.add(next.id);
    demoMediaUsed += cost;
    return next;
  }

  // Upload local capture bytes when the composer handed us a file uri.
  let mediaId = input.mediaId;
  if (!mediaId && input.uri) {
    mediaId = await uploadMedia(
      input.uri,
      // With a page, `uri` is the flattened preview image (always a photo).
      input.page ? 'photo' : input.type,
      `stories/tmp-${Date.now()}`
    );
  }
  const page = input.page ? pageToWire(await uploadPageMedia(input.page)) : undefined;

  const caption = input.caption ?? input.overlayText;
  const dto = await apiFetch<StoryPostDto>('/stories', {
    method: 'POST',
    body: JSON.stringify({
      type: input.type,
      mediaId,
      caption,
      themeSlug: input.themeSlug,
      visibleToTier: audienceToTier(input.audience),
      eventId: input.eventId,
      page
    })
  });
  return mapPostDto(dto);
}

/**
 * Change a page you posted today (added a photo, new layout, caption, or
 * audience). The server bumps `revision` so friends' rings light again.
 */
export async function updatePostPage(input: UpdatePageInput): Promise<StoryPost> {
  if (isDemoMode()) {
    const existing = demoPosts.find((p) => p.id === input.postId);
    if (!existing) throw new Error('Story not found');
    const before = demoMediaCount(existing);
    const after = countMediaElements(input.page);
    if (demoMediaUsed - before + after > DAILY_POST_CAP) {
      throw new Error('Daily post quota reached');
    }
    demoMediaUsed += after - before;
    const revision = (existing.revision ?? 1) + 1;
    const updated: StoryPost = {
      ...existing,
      caption: input.caption ?? existing.caption,
      visibleToTier: input.audience ? audienceToTier(input.audience) : existing.visibleToTier,
      media: input.previewUri ? { uri: input.previewUri } : existing.media,
      revision,
      page: {
        ...(existing.page ?? { id: `page-${Date.now()}`, aspectRatio: 8.5 / 11 }),
        ...input.page,
        background:
          input.page.background ?? existing.page?.background ?? { kind: 'solid', color: '#F4F1E7' },
        revision
      }
    };
    demoPosts = demoPosts.map((p) => (p.id === input.postId ? updated : p));
    return updated;
  }

  let previewMediaId = input.previewMediaId;
  if (!previewMediaId && input.previewUri) {
    previewMediaId = await uploadMedia(input.previewUri, 'photo', `stories/tmp-${Date.now()}`);
  }
  const page = pageToWire(await uploadPageMedia(input.page));
  const dto = await apiFetch<StoryPostDto>(
    `/stories/posts/${encodeURIComponent(input.postId)}/page`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        page,
        mediaId: previewMediaId,
        caption: input.caption,
        visibleToTier: input.audience ? audienceToTier(input.audience) : undefined
      })
    }
  );
  return mapPostDto(dto);
}

/** Delete one of your pages (used when two pages are merged into one). */
export async function deletePost(postId: string): Promise<void> {
  if (isDemoMode()) {
    const existing = demoPosts.find((p) => p.id === postId);
    if (existing) demoMediaUsed = Math.max(0, demoMediaUsed - demoMediaCount(existing));
    demoPosts = demoPosts.filter((p) => p.id !== postId);
    demoTodayIds.delete(postId);
    return;
  }
  await apiFetch(`/stories/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' });
}

/** Your own pages from today, oldest first (the page strip on compose). */
export async function listTodayPosts(): Promise<StoryPost[]> {
  if (isDemoMode()) {
    return demoPosts.filter((p) => demoTodayIds.has(p.id));
  }
  try {
    const rows = await apiFetch<StoryPostDto[]>('/stories/today');
    return rows.map(mapPostDto);
  } catch {
    return [];
  }
}

/** Photo updates tagged to an event (shared album on the event page). */
export async function listEventStoryPosts(eventId: string): Promise<StoryPost[]> {
  if (isDemoMode()) {
    return demoPosts.filter((p) => p.eventId === eventId && p.type === 'photo');
  }
  try {
    const rows = await apiFetch<StoryPostDto[]>(
      `/events/${encodeURIComponent(eventId)}/photos`
    );
    return rows.map(mapPostDto);
  } catch {
    return [];
  }
}

/**
 * Demo-only helper so the ActionableCard can briefly show bars before the
 * item sinks. Live UI should not rely on this for the settled rail.
 */
export function peekPollResults(itemId: string): number[] | undefined {
  return POLL_RESULTS[itemId];
}
