// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything Home needs that is not Touch Grass or Events: stories, replies,
// notifications strip, coming-up, co-op notes, quiz, weekly activity, polls,
// and the default Home widget layout. Demo mode returns fixtures; live mode
// calls the Nest API through lib/api.
// ============================================
import type {
  HomeWidgetDefault,
  Reaction,
  Story,
  UpcomingItem
} from '@bridger/shared';
import { DEFAULT_HOME_LAYOUT } from '@bridger/shared';
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
export type { HomeQuiz };

/** Co-op note on Home. Fixture uses `action`; API may send `ctaLabel` too. */
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

export async function listStories(): Promise<Story[]> {
  if (isDemoMode()) return [...STORIES];
  // TODO: GET /feed/stories
  return [];
}

export async function getMyStory(): Promise<Story | null> {
  if (isDemoMode()) return { ...MY_STORY };
  // TODO: GET /feed/stories/me
  return null;
}

export async function listStoryReplies(): Promise<Reaction[]> {
  if (isDemoMode()) return [...STORY_REPLIES];
  // TODO: GET /feed/story-replies
  return [];
}

/** One line in the Home notifications strip. */
export type NotificationPreview = {
  id: string;
  personId: string;
  text: string;
  time: string;
};

// Demo-only: reactions (and other live events) prepend here for this session
// so they show up on Home without waiting for a real notifications API.
let sessionNotifications: NotificationPreview[] | null = null;

function demoNotifications(): NotificationPreview[] {
  if (!sessionNotifications) sessionNotifications = [...NOTIFICATIONS];
  return sessionNotifications;
}

export async function listNotificationsPreview(): Promise<NotificationPreview[]> {
  if (isDemoMode()) return [...demoNotifications()];
  // TODO: GET /notifications?limit=3
  return [];
}

/**
 * Drop a new line at the top of the notifications strip (demo session store).
 * Used when someone reacts to a weekly recap with a sticker/emoji.
 */
export function pushNotification(item: NotificationPreview): void {
  if (!isDemoMode()) {
    // TODO: POST /notifications (or server fans out from the reaction endpoint)
    return;
  }
  const list = demoNotifications();
  list.unshift(item);
}

export async function listComingUp(): Promise<UpcomingItem[]> {
  if (isDemoMode()) return [...COMING_UP];
  // TODO: GET /feed/coming-up
  return [];
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
