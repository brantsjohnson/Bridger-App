// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything Home needs that is not Touch Grass or Events: stories, replies,
// notifications strip, coming-up, co-op notes, quiz, weekly activity, polls,
// and the default Home widget layout. Demo mode returns fixtures; live mode
// calls the Nest API through lib/api.
// ============================================
import type {
  AppNotification,
  HomeWidgetDefault,
  NotificationPageFilter,
  Reaction,
  Story,
  UpcomingItem
} from '@bridger/shared';
import {
  DEFAULT_HOME_LAYOUT,
  matchesNotificationPageFilter,
  showsInHomeNotificationPreview,
  sortUpcomingItems
} from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
import { getCurrentActivity } from './activity';
import { getLiveQuiz, type HomeQuiz } from './quiz';
import {
  COMING_UP,
  COOP_ANNOUNCEMENTS,
  HOME_POLLS,
  MY_STORY,
  NOTIFICATIONS,
  STORIES,
  STORY_REPLIES,
  type HomePoll
} from './fixtures/catalog';

export type { HomePoll };
export type NotificationPreview = AppNotification;
export type { HomeQuiz };
export type CoopAnnouncement = {
  id: string;
  title: string;
  body: string;
  action?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  publishedAt?: string;
};

/** Normalize fixture + API announcement shapes for the carousel card. */
function mapAnnouncement(raw: {
  id: string;
  title: string;
  body: string;
  action?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  publishedAt?: string;
}): CoopAnnouncement {
  const action = raw.action ?? raw.ctaLabel;
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body,
    action,
    ctaLabel: raw.ctaLabel ?? raw.action,
    ctaUrl: raw.ctaUrl,
    publishedAt: raw.publishedAt
  };
}

// ============================================
// SEEN STATE (this device / session)
// After you finish someone's updates, we mark them seen so the Home tray can
// drop their colored ring and slide them to the back. PRIVACY: this is only
// "have I watched this?" for you — never a public view count.
// TODO: persist via API when story-view rows ship (feed.service still returns
// seen: false for live).
// ============================================
const sessionSeenAuthorIds = new Set<string>();

/** Call when the viewer finishes that author's last post. */
export function markStorySeen(authorId: string) {
  if (!authorId) return;
  sessionSeenAuthorIds.add(authorId);
}

/** Unseen first (tray order), then watched — so new updates stay up front. */
function applySeenAndOrder(stories: Story[]): Story[] {
  const mapped = stories.map((s) => ({
    ...s,
    seen: s.seen || sessionSeenAuthorIds.has(s.authorId)
  }));
  return [...mapped.filter((s) => !s.seen), ...mapped.filter((s) => s.seen)];
}

export async function listStories(): Promise<Story[]> {
  if (isDemoMode()) return applySeenAndOrder([...STORIES]);
  try {
    const rows = await apiFetch<Story[]>('/feed/stories');
    // Live API does not persist seen yet — overlay this session's watches.
    return applySeenAndOrder(rows);
  } catch {
    return [];
  }
}

export async function getMyStory(): Promise<Story | null> {
  if (isDemoMode()) {
    const mine = { ...MY_STORY };
    if (sessionSeenAuthorIds.has('me')) mine.seen = true;
    return mine;
  }
  try {
    const mine = await apiFetch<Story | null>('/feed/stories/me');
    if (!mine) return null;
    return {
      ...mine,
      seen: mine.seen || sessionSeenAuthorIds.has(mine.authorId)
    };
  } catch {
    return null;
  }
}

export async function listStoryReplies(): Promise<Reaction[]> {
  if (isDemoMode()) {
    // Skip people you've already opened / answered (NOTIFICATIONS.md clear rules).
    const gone = dismissedReplyAuthors();
    return STORY_REPLIES.filter((r) => !gone.has(r.authorId));
  }
  try {
    return await apiFetch<Reaction[]>('/feed/story-replies');
  } catch {
    return [];
  }
}

/** One line in the Home notifications strip / Notifications page. */

// Demo-only: reactions (and other live events) prepend here for this session
// so they show up on Home without waiting for a real notifications API.
let sessionNotifications: NotificationPreview[] | null = null;

/**
 * Demo-only: authors whose story replies you've already handled. Their chips
 * leave the Home "replies to your story" row (open row / DM / reply / notify tap).
 */
let sessionDismissedReplyAuthors: Set<string> | null = null;

function dismissedReplyAuthors(): Set<string> {
  if (!sessionDismissedReplyAuthors) sessionDismissedReplyAuthors = new Set();
  return sessionDismissedReplyAuthors;
}

/** True when the Home replies row still has people you haven't engaged. */
export function hasOpenStoryReplies(): boolean {
  if (!isDemoMode()) return false;
  const gone = dismissedReplyAuthors();
  return STORY_REPLIES.some((r) => !gone.has(r.authorId));
}

/** Unread notification kinds still sitting in the demo inbox. */
export function unreadNotificationKinds(): Set<string> {
  if (!isDemoMode()) return new Set();
  const kinds = new Set<string>();
  for (const n of demoNotifications()) {
    if (n.unread !== false) kinds.add(n.kind);
  }
  return kinds;
}

function demoNotifications(): NotificationPreview[] {
  if (!sessionNotifications) sessionNotifications = [...NOTIFICATIONS] as NotificationPreview[];
  return sessionNotifications;
}

/**
 * Home widget only — excludes kinds that already have a Home surface
 * (story replies live in the replies row, not here). See NOTIFICATIONS.md.
 */
export async function listNotificationsPreview(): Promise<NotificationPreview[]> {
  if (isDemoMode()) {
    return demoNotifications().filter((n) => showsInHomeNotificationPreview(n.kind));
  }
  try {
    // Server should filter homePreview=false; client filters as a safety net.
    const rows = await apiFetch<NotificationPreview[]>('/notifications?limit=3&surface=home');
    return rows.filter((n) => showsInHomeNotificationPreview(n.kind));
  } catch {
    return [];
  }
}

/** Full Notifications list — Messages kinds stay on the Messages tab only. */
export async function listNotifications(): Promise<NotificationPreview[]> {
  if (isDemoMode()) {
    return demoNotifications().filter((n) => n.kind !== 'message');
  }
  try {
    const rows = await apiFetch<NotificationPreview[]>('/notifications');
    return rows.filter((n) => n.kind !== 'message');
  } catch {
    return [];
  }
}

/**
 * Mark listed notifications as read for the current filter chip (All / Home /
 * Friends / Events / Discover). Only clears Home story-reply chips when the
 * filter includes Home (All or Home). Messages unread stays on the Messages tab.
 */
export function markAllNotificationsRead(
  filter: NotificationPageFilter = 'all'
): void {
  if (!isDemoMode()) {
    // TODO: POST /notifications/mark-all-read { filter }
    return;
  }
  const list = demoNotifications();
  for (const n of list) {
    if (!matchesNotificationPageFilter(n.kind, filter)) continue;
    n.unread = false;
  }
  // Home replies row chips only clear when this pass covers Home alerts.
  if (filter === 'all' || filter === 'home') {
    for (const r of STORY_REPLIES) dismissedReplyAuthors().add(r.authorId);
  }
}

/** Mark one notification row read (after a tap). */
export function markNotificationRead(id: string): void {
  if (!isDemoMode()) return;
  const row = demoNotifications().find((n) => n.id === id);
  if (row) row.unread = false;
}

/**
 * Mark story-reply alerts as done when the person engages: opens the replies
 * row / story comments, opens the mirrored DM, or replies in the story.
 * Clears them from the Notifications page AND drops that person's chip(s)
 * from the Home "replies to your story" row (demo session store).
 */
export function clearStoryReplyNotifications(opts?: { personId?: string }): void {
  if (!isDemoMode()) {
    // TODO: POST /notifications/clear { kinds: ['story_reply'], personId? }
    // TODO: mark reactions engaged so /feed/story-replies omits them
    return;
  }

  // --- Home replies row: chips leave once you've opened or answered them ---
  const dismissed = dismissedReplyAuthors();
  if (opts?.personId) {
    dismissed.add(opts.personId);
  } else {
    // Opening the whole row / your comments = you've handled every open reply.
    for (const r of STORY_REPLIES) dismissed.add(r.authorId);
  }

  // --- Notifications page: remove matching story_reply rows ---
  const list = demoNotifications();
  sessionNotifications = list.filter((n) => {
    if (n.kind !== 'story_reply') return true;
    if (opts?.personId && n.personId !== opts.personId) return true;
    return false;
  });
}

/**
 * Drop a new line at the top of the notifications strip (demo session store).
 * Used when someone reacts to a weekly recap with a sticker/emoji.
 * Live: the server inserts notifications from the reaction endpoints.
 */
export function pushNotification(item: NotificationPreview): void {
  if (!isDemoMode()) {
    return;
  }
  const list = demoNotifications();
  list.unshift(item);
}

export async function listComingUp(): Promise<UpcomingItem[]> {
  if (isDemoMode()) {
    // Merge private date / check-in rows with birthday fixtures.
    // Check-in notifications are fired from useHomeFeed before this runs.
    const { upcomingFromFriendNotes } = await import('./friend-notes');
    const fromNotes = upcomingFromFriendNotes();
    // Prefer dynamic note rows over the seeded graduation fixture when present.
    const seededKeys = new Set(fromNotes.map((u) => `${u.personId}:${u.kind}`));
    const base = COMING_UP.filter(
      (u) => u.kind === 'birthday' || !seededKeys.has(`${u.personId}:${u.kind}`)
    );
    return sortUpcomingItems([...fromNotes, ...base]);
  }
  try {
    return sortUpcomingItems(await apiFetch<UpcomingItem[]>('/feed/coming-up'));
  } catch {
    return [];
  }
}

export async function listCoopAnnouncements(): Promise<CoopAnnouncement[]> {
  if (isDemoMode()) {
    return COOP_ANNOUNCEMENTS.map((a) => mapAnnouncement(a));
  }
  try {
    const rows = await apiFetch<
      Array<{
        id: string;
        title: string;
        body: string;
        action?: string;
        ctaLabel?: string;
        ctaUrl?: string;
        publishedAt?: string;
      }>
    >('/coop/announcements');
    return rows.map(mapAnnouncement);
  } catch {
    return [];
  }
}

export async function getWeeklyActivity() {
  return getCurrentActivity();
}

export async function getQuiz(): Promise<HomeQuiz | null> {
  return getLiveQuiz();
}

export async function listMyPolls(): Promise<HomePoll[]> {
  if (isDemoMode()) {
    return HOME_POLLS.filter((p) => p.authorId === 'me').map((p) => ({
      ...p,
      options: p.options.map((o) => ({ ...o, voterIds: o.voterIds ? [...o.voterIds] : [] }))
    }));
  }
  // TODO: GET /polls?mine=1
  return [];
}

/** Day-one Home: no friends yet. Demo keeps this false so the populated UI shows. */
export async function getHomeFlags(): Promise<{ empty: boolean; member: boolean }> {
  if (isDemoMode()) {
    return { empty: false, member: false };
  }
  try {
    const membership = await apiFetch<{ member: boolean }>('/coop/membership');
    // Friend count wiring lands with connections; treat live as non-empty for now
    // so widgets still render once the person has an account.
    return { empty: false, member: !!membership.member };
  } catch {
    return { empty: true, member: false };
  }
}

/** Admin default Home widget layout (fallback when the user has none saved). */
export async function getHomeDefaults(): Promise<HomeWidgetDefault[]> {
  if (isDemoMode()) {
    return DEFAULT_HOME_LAYOUT.map((w) => ({ ...w }));
  }
  try {
    const res = await apiFetch<{ layout: HomeWidgetDefault[] }>('/content/home-defaults');
    return Array.isArray(res.layout) && res.layout.length
      ? res.layout
      : DEFAULT_HOME_LAYOUT.map((w) => ({ ...w }));
  } catch {
    return DEFAULT_HOME_LAYOUT.map((w) => ({ ...w }));
  }
}

/**
 * Effective Home layout: user's saved row if present, else admin defaults,
 * else the seeded DEFAULT_HOME_LAYOUT.
 */
export async function getHomeLayout(): Promise<HomeWidgetDefault[]> {
  if (isDemoMode()) {
    return DEFAULT_HOME_LAYOUT.map((w) => ({ ...w }));
  }
  try {
    const res = await apiFetch<{
      layout: HomeWidgetDefault[] | null;
      effective: HomeWidgetDefault[];
    }>('/content/home-layout');

    if (Array.isArray(res.layout) && res.layout.length) {
      return res.layout;
    }

    // No personal layout: prefer admin defaults over the hard-coded seed.
    const defaults = await getHomeDefaults();
    if (defaults.length) return defaults;

    return Array.isArray(res.effective) && res.effective.length
      ? res.effective
      : DEFAULT_HOME_LAYOUT.map((w) => ({ ...w }));
  } catch {
    return getHomeDefaults();
  }
}

/** Save the user's Home widget order/sizes after Edit → Done. */
export async function saveHomeLayout(layout: HomeWidgetDefault[]): Promise<void> {
  if (isDemoMode()) {
    // Demo keeps layout session-only in the Home screen state.
    return;
  }
  await apiFetch('/content/home-layout', {
    method: 'PUT',
    body: JSON.stringify({ layout })
  });
}
