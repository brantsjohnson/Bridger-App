// ============================================
// WHAT THIS FILE DOES (plain English):
// The weekly Home activity (e.g. "Band Tee Week"): load the current challenge,
// post into the collage, and heart / un-heart someone else's post. Demo mode
// uses the fixture plus session memory for new posts and hearts so the collage
// feels real. Live mode talks to /activities.
//
// TODO: activity_posts has no caption / emoji / audience columns yet
// (migration 0008). Demo keeps those in memory; live API may drop them until
// a follow-up migration lands.
// ============================================
import type { ActivityPost, Cover, WeeklyActivity } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
import { WEEKLY_ACTIVITY } from './fixtures/catalog';

/** One collage cell the UI can render. */
export type ActivityCollagePost = {
  id: string;
  personId: string;
  emoji: string;
  caption: string;
  /** Demo-only: who this was shared with (tier or group name). */
  audience?: string;
};

/** Shape Home's Activity widget + collage screen expect. */
export type HomeWeeklyActivity = {
  id: string;
  title: string;
  prompt: string;
  closesIn: string;
  accent: 'amber' | 'teal' | 'coral' | 'purple' | 'pink' | 'blue' | 'green';
  emoji?: string;
  cover?: Cover;
  posts: ActivityCollagePost[];
};

/** In-memory hearts for demo so double-taps feel real this session. */
const demoHearts = new Set<string>();

/**
 * Demo posts added this session (caption/emoji/audience live only here until
 * the DB has columns for them).
 */
let demoExtraPosts: ActivityCollagePost[] = [];

function demoActivity(): HomeWeeklyActivity {
  const base = WEEKLY_ACTIVITY.posts.map((p) => ({ ...p }));
  // Your new posts sit first in the collage after the "mine" slot logic.
  return {
    ...WEEKLY_ACTIVITY,
    posts: [...demoExtraPosts, ...base]
  };
}

/** Current weekly challenge + collage posts. */
export async function getCurrentActivity(): Promise<HomeWeeklyActivity | null> {
  if (isDemoMode()) {
    return demoActivity();
  }

  try {
    const res = await apiFetch<{
      activity: WeeklyActivity | null;
      posts: ActivityPost[];
    }>('/activities/current');

    if (!res.activity) return null;

    // Map API posts into the widget's display fields.
    const closesIn =
      res.activity.closesIn ??
      (res.activity.endsAt ? 'ends soon' : 'this week');

    return {
      id: res.activity.id,
      title: res.activity.title,
      prompt: res.activity.prompt,
      closesIn,
      accent: (res.activity.accent as HomeWeeklyActivity['accent']) ?? 'amber',
      emoji: res.activity.emoji,
      cover: res.activity.cover,
      posts: res.posts.map((p) => ({
        id: p.id,
        personId: p.personId ?? p.authorId,
        emoji: p.emoji ?? '✨',
        caption: p.caption ?? ''
      }))
    };
  } catch {
    return null;
  }
}

/** True when this person already hearted the post (demo session). */
export function isPostHearted(postId: string): boolean {
  return demoHearts.has(postId);
}

/** Snapshot of hearted post ids for demo UI state. */
export function listHeartedPostIds(): string[] {
  return [...demoHearts];
}

/**
 * Add your contribution to the weekly collage.
 * TODO: persist caption / emoji / audience when activity_posts has columns.
 */
export async function createPost(
  activityId: string,
  body: {
    mediaId?: string;
    emoji?: string;
    caption?: string;
    audience?: string;
  }
): Promise<ActivityPost> {
  if (isDemoMode()) {
    const id = `ap-demo-${Date.now()}`;
    demoExtraPosts = [
      {
        id,
        personId: 'me',
        emoji: body.emoji ?? '🧢',
        caption: body.caption ?? '',
        audience: body.audience
      },
      ...demoExtraPosts.filter((p) => p.personId !== 'me')
    ];
    return {
      id,
      activityId,
      authorId: 'me',
      mediaId: body.mediaId,
      heartsCount: 0,
      createdAt: new Date().toISOString(),
      emoji: body.emoji,
      caption: body.caption,
      personId: 'me'
    };
  }

  // Live API may ignore emoji/caption until schema catches up.
  return apiFetch(`/activities/${encodeURIComponent(activityId)}/posts`, {
    method: 'POST',
    body: JSON.stringify({
      mediaId: body.mediaId,
      emoji: body.emoji,
      caption: body.caption
    })
  });
}

/** Heart a post. */
export async function heartPost(
  activityId: string,
  postId: string
): Promise<void> {
  if (isDemoMode()) {
    demoHearts.add(postId);
    return;
  }
  await apiFetch(
    `/activities/${encodeURIComponent(activityId)}/posts/${encodeURIComponent(postId)}/heart`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}

/** Remove your heart from a post. */
export async function unheartPost(
  activityId: string,
  postId: string
): Promise<void> {
  if (isDemoMode()) {
    demoHearts.delete(postId);
    return;
  }
  await apiFetch(
    `/activities/${encodeURIComponent(activityId)}/posts/${encodeURIComponent(postId)}/heart`,
    { method: 'DELETE' }
  );
}
