// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything Home needs that is not Touch Grass or Events: stories, replies,
// notifications strip, coming-up, co-op notes, quiz, weekly activity, polls.
// Demo mode returns fixtures; live mode will call the feed API.
// ============================================
import type { Reaction, Story, UpcomingItem } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import {
  COMING_UP,
  COOP_ANNOUNCEMENTS,
  HOME_POLLS,
  MY_STORY,
  NOTIFICATIONS,
  QUIZ,
  STORIES,
  STORY_REPLIES,
  WEEKLY_ACTIVITY,
  type HomePoll
} from './fixtures/catalog';

export type { HomePoll };

export type CoopAnnouncement = (typeof COOP_ANNOUNCEMENTS)[number];

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

export async function listNotificationsPreview(): Promise<
  Array<{ id: string; personId: string; text: string; time: string }>
> {
  if (isDemoMode()) return [...NOTIFICATIONS];
  // TODO: GET /notifications?limit=3
  return [];
}

export async function listComingUp(): Promise<UpcomingItem[]> {
  if (isDemoMode()) return [...COMING_UP];
  // TODO: GET /feed/coming-up
  return [];
}

export async function listCoopAnnouncements(): Promise<CoopAnnouncement[]> {
  if (isDemoMode()) return [...COOP_ANNOUNCEMENTS];
  // TODO: GET /coop/announcements
  return [];
}

export async function getWeeklyActivity() {
  if (isDemoMode()) return { ...WEEKLY_ACTIVITY, posts: [...WEEKLY_ACTIVITY.posts] };
  // TODO: GET /activities/current
  return null;
}

export async function getQuiz() {
  if (isDemoMode()) return { ...QUIZ, results: QUIZ.results.map((r) => ({ ...r })) };
  // TODO: GET /quizzes/current
  return null;
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
  // TODO: derive from friendCount + coop membership
  return { empty: true, member: false };
}
