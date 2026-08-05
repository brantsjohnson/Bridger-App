// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Home tab body (stories, replies, widgets). Touch Grass
// stays in useTouchGrass so Home and Events share one signal list. Reloads
// when the tab is focused again (e.g. after finishing a quiz).
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

export function useHomeFeed() {
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [member, setMember] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [myStory, setMyStory] = useState<Story | null>(null);
  const [replies, setReplies] = useState<Reaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [comingUp, setComingUp] = useState<UpcomingItem[]>([]);
  const [coopAnnouncements, setCoopAnnouncements] = useState<CoopAnnouncement[]>([]);
  const [weeklyActivity, setWeeklyActivity] =
    useState<Awaited<ReturnType<typeof getWeeklyActivity>>>(null);
  const [quiz, setQuiz] = useState<Awaited<ReturnType<typeof getQuiz>>>(null);
  const [polls, setPolls] = useState<HomePoll[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
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
