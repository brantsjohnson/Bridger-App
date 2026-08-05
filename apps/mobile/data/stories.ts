// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the Stories ("Updates") player needs: list someone's posts, load
// their Catch-Up sheet, list/add replies, answer a poll/question, and create a
// new post (with the 3-per-day quota). Demo mode keeps answers and new posts in
// memory for the session. Live mode calls the Nest /stories API.
// ============================================
import type {
  CatchUpItem,
  Reaction,
  ReactionKind,
  StoryPost,
  ThemedPrompt,
  Tier
} from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
import { uploadMedia } from '../lib/media-upload';
import { STORY_REPLIES as CATALOG_REPLIES } from './fixtures/catalog';
import { getStoryMedia } from './fixtures/demo-media';
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

/** Soft daily cap from STORIES.md. */
const DAILY_POST_CAP = 3;

/** What Catch-Up returns, already ordered for the sheet. */
export type CatchUpBundle = {
  live: CatchUpItem[];
  answered: CatchUpItem[];
  week: WeekDay[];
  currently: typeof STORY_CURRENTLY;
};

export type CreatePostInput = {
  type: 'photo' | 'video';
  emoji?: string;
  accent?: StoryPost['accent'];
  overlayText?: string;
  caption?: string;
  themeSlug?: string;
  /** PRIVACY: concentric audience — mapped to visible_to_tier on the API */
  audience?: 'close' | 'friend' | 'everyone';
  group?: string | null;
  /**
   * Local file uri from the camera (or a picker). Live mode uploads this into
   * the private media bucket before calling POST /stories. Demo ignores it.
   */
  uri?: string;
  /** Already-uploaded media row id (skips upload when set). */
  mediaId?: string;
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
let demoPostsLeft = 2;

/**
 * When you drop photos/videos into assets/demo/stories/{name}/, those become
 * that person's updates (in file-name order). Fixture emoji posts are only used
 * when their folder is empty.
 */
function applyDroppedStoryMedia(authorId: string, posts: StoryPost[]): StoryPost[] {
  const media = getStoryMedia(authorId);
  if (media.length === 0) return posts;
  return media.map((m, i) => {
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
}

/** Map composer audience to the DB tier column. */
function audienceToTier(audience?: CreatePostInput['audience']): Tier {
  if (audience === 'close') return 'close';
  if (audience === 'everyone') return 'acquaintance';
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

/** Replies for one post (including nested children via parentReactionId). */
export async function listReplies(postId: string): Promise<Reaction[]> {
  if (isDemoMode()) {
    return demoReplies.filter((r) => r.postId === postId);
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

/** Themed capture squares. */
export async function listThemedPrompts(): Promise<ThemedPrompt[]> {
  if (isDemoMode()) return THEMED_PROMPTS;
  try {
    return await apiFetch<ThemedPrompt[]>('/content/themed-prompts');
  } catch {
    return [];
  }
}

/** How many posts you still have today (cap 3). */
export async function getPostQuota(): Promise<{ left: number; cap: number }> {
  if (isDemoMode()) {
    return { left: demoPostsLeft, cap: DAILY_POST_CAP };
  }
  return apiFetch<{ left: number; cap: number }>('/stories/quota');
}

/**
 * Create a new update for "me".
 * PAYMENT: video posting is a co-op unlock — callers should gate before calling;
 * demo still accepts video so the lock UI can be previewed separately.
 */
export async function createPost(input: CreatePostInput): Promise<StoryPost> {
  if (isDemoMode()) {
    if (demoPostsLeft <= 0) {
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
      createdAt: 'now',
      media: input.uri ? { uri: input.uri } : undefined
    };
    demoPosts = [...demoPosts, next];
    demoPostsLeft = Math.max(0, demoPostsLeft - 1);
    return next;
  }

  // Upload local capture bytes when the composer handed us a file uri.
  let mediaId = input.mediaId;
  if (!mediaId && input.uri) {
    mediaId = await uploadMedia(
      input.uri,
      input.type,
      `stories/tmp-${Date.now()}`
    );
  }

  const caption = input.caption ?? input.overlayText;
  const dto = await apiFetch<StoryPostDto>('/stories', {
    method: 'POST',
    body: JSON.stringify({
      type: input.type,
      mediaId,
      caption,
      themeSlug: input.themeSlug,
      visibleToTier: audienceToTier(input.audience)
    })
  });
  return mapPostDto(dto);
}

/**
 * Demo-only helper so the ActionableCard can briefly show bars before the
 * item sinks. Live UI should not rely on this for the settled rail.
 */
export function peekPollResults(itemId: string): number[] | undefined {
  return POLL_RESULTS[itemId];
}
