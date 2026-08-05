// ============================================
// WHAT THIS FILE DOES (plain English):
// The weekly Home activity (e.g. "Band Tee Week"): load the current challenge,
// post into the collage, and heart / un-heart someone else's post. Demo mode
// uses the fixture; live mode talks to /activities.
// ============================================
import type { ActivityPost, Cover, WeeklyActivity } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
import { WEEKLY_ACTIVITY } from './fixtures/catalog';

/** Shape Home's Activity widget already expects. */
export type HomeWeeklyActivity = {
  id: string;
  title: string;
  prompt: string;
  closesIn: string;
  accent: 'amber' | 'teal' | 'coral' | 'purple' | 'pink' | 'blue' | 'green';
  emoji?: string;
  cover?: Cover;
  posts: Array<{ id: string; personId: string; emoji: string; caption: string }>;
};

/** In-memory hearts for demo so taps feel real for the session. */
const demoHearts = new Set<string>();

/** Current weekly challenge + collage posts. */
export async function getCurrentActivity(): Promise<HomeWeeklyActivity | null> {
  if (isDemoMode()) {
    return {
      ...WEEKLY_ACTIVITY,
      posts: WEEKLY_ACTIVITY.posts.map((p) => ({ ...p }))
    };
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

/** Add your contribution to the weekly collage. */
export async function createPost(
  activityId: string,
  body: { mediaId?: string; emoji?: string; caption?: string }
): Promise<ActivityPost> {
  if (isDemoMode()) {
    return {
      id: `ap-demo-${Date.now()}`,
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

  return apiFetch(`/activities/${encodeURIComponent(activityId)}/posts`, {
    method: 'POST',
    body: JSON.stringify(body)
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
