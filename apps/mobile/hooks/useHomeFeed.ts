// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Home tab body (stories, replies, widgets). Touch Grass
// stays in useTouchGrass so Home and Events share one signal list. Shows the
// last saved Home right away, then quietly checks for new items when you
// come back to the tab (no empty flash).
// ============================================
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { AppNotification, Reaction, Story, UpcomingItem } from '@bridger/shared';
import {
  getHomeFlags,
  getMyStory,
  getQuiz,
  getWeeklyActivity,
  listComingUp,
  listCoopAnnouncements,
  listMyPolls,
  listNotificationsPreview,
  listStories,
  listStoryReplies,
  type CoopAnnouncement,
  type HomePoll
} from '../data/feed';
import { fireDueCheckInReminders } from '../data/friend-notes';
import { getTabSnapshot, setTabSnapshot } from '../lib/tab-snapshots';

export type HomeFeedSnap = {
  empty: boolean;
  member: boolean;
  stories: Story[];
  myStory: Story | null;
  replies: Reaction[];
  notifications: AppNotification[];
  comingUp: UpcomingItem[];
  coopAnnouncements: CoopAnnouncement[];
  weeklyActivity: Awaited<ReturnType<typeof getWeeklyActivity>>;
  quiz: Awaited<ReturnType<typeof getQuiz>>;
  polls: HomePoll[];
};

const SNAP_KEY = 'home';

export function useHomeFeed() {
  const cached = getTabSnapshot<HomeFeedSnap>(SNAP_KEY);
  const [loading, setLoading] = useState(!cached);
  const [empty, setEmpty] = useState(cached?.empty ?? false);
  const [member, setMember] = useState(cached?.member ?? false);
  const [stories, setStories] = useState<Story[]>(cached?.stories ?? []);
  const [myStory, setMyStory] = useState<Story | null>(cached?.myStory ?? null);
  const [replies, setReplies] = useState<Reaction[]>(cached?.replies ?? []);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    cached?.notifications ?? []
  );
  const [comingUp, setComingUp] = useState<UpcomingItem[]>(cached?.comingUp ?? []);
  const [coopAnnouncements, setCoopAnnouncements] = useState<CoopAnnouncement[]>(
    cached?.coopAnnouncements ?? []
  );
  const [weeklyActivity, setWeeklyActivity] = useState<
    Awaited<ReturnType<typeof getWeeklyActivity>>
  >(cached?.weeklyActivity ?? null);
  const [quiz, setQuiz] = useState<Awaited<ReturnType<typeof getQuiz>>>(
    cached?.quiz ?? null
  );
  const [polls, setPolls] = useState<HomePoll[]>(cached?.polls ?? []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        // Keep the last Home on screen. Only show a first-load wait when
        // we have never painted this tab before.
        const hadCache = Boolean(getTabSnapshot<HomeFeedSnap>(SNAP_KEY));
        if (!hadCache) setLoading(true);
        try {
          // Coming up first (includes due check-ins), then fire nudges so the
          // notifications strip picks them up without clearing the Home card.
          const up = await listComingUp();
          await fireDueCheckInReminders();
          const [
            flags,
            storyList,
            mine,
            replyList,
            notes,
            coop,
            activity,
            quizData,
            myPolls
          ] = await Promise.all([
            getHomeFlags(),
            listStories(),
            getMyStory(),
            listStoryReplies(),
            listNotificationsPreview(),
            listCoopAnnouncements(),
            getWeeklyActivity(),
            getQuiz(),
            listMyPolls()
          ]);
          if (cancelled) return;
          setEmpty(flags.empty);
          setMember(flags.member);
          setStories(storyList);
          setMyStory(mine);
          setReplies(replyList);
          setNotifications(notes);
          setComingUp(up);
          setCoopAnnouncements(coop);
          setWeeklyActivity(activity);
          setQuiz(quizData);
          setPolls(myPolls);
          // THIS SECTION DOES: save this Home so the next tap paints instantly.
          setTabSnapshot<HomeFeedSnap>(SNAP_KEY, {
            empty: flags.empty,
            member: flags.member,
            stories: storyList,
            myStory: mine,
            replies: replyList,
            notifications: notes,
            comingUp: up,
            coopAnnouncements: coop,
            weeklyActivity: activity,
            quiz: quizData,
            polls: myPolls
          });
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return {
    loading,
    empty,
    member,
    stories,
    myStory,
    replies,
    notifications,
    comingUp,
    coopAnnouncements,
    weeklyActivity,
    quiz,
    polls
  };
}
