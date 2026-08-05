// ============================================
// WHAT THIS FILE DOES (plain English):
// The weekly activity collage screen — opened from the Home activity card
// (or an activity_live notification). Shows the prompt, everyone's polaroids,
// and a capture sheet to post yours. Spec: HOME.md § Weekly activity.
// Design: Magic Patterns ActivityScreen.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ACTIVITY,
  openSurface,
  trackProduct
} from '@bridger/shared';
import { Screen, ScreenBody, ScreenHeader } from '@bridger/ui';
import { ActivityCaptureSheet } from '../../components/activity/ActivityCaptureSheet';
import { ActivityCollage } from '../../components/activity/ActivityCollage';
import {
  getCurrentActivity,
  heartPost,
  isPostHearted,
  listHeartedPostIds,
  unheartPost,
  type HomeWeeklyActivity
} from '../../data/activity';

export default function ActivityScreen() {
  const router = useRouter();
  const [activity, setActivity] = useState<HomeWeeklyActivity | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [heartedIds, setHeartedIds] = useState<Set<string>>(() => new Set());

  const refresh = useCallback(async () => {
    const next = await getCurrentActivity();
    setActivity(next);
    setHeartedIds(new Set(listHeartedPostIds()));
    setLoaded(true);
  }, []);

  useEffect(() => {
    openSurface('activity', 'home');
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const toggleHeart = useCallback(
    async (postId: string) => {
      if (!activity) return;
      const on = isPostHearted(postId);
      if (on) {
        await unheartPost(activity.id, postId);
      } else {
        await heartPost(activity.id, postId);
        trackProduct('activity_hearted');
      }
      setHeartedIds(new Set(listHeartedPostIds()));
    },
    [activity]
  );

  if (!loaded) {
    return (
      <Screen>
        <ScreenHeader
          title="Activity"
          onBack={() => router.back()}
          hideProfile
          backAnalyticsId={ACTIVITY.top_nav.back}
          titleAnalyticsId={ACTIVITY.top_nav.page_title}
          analyticsSurface="activity"
        />
        <ScreenBody tabBarInset={false}>
          <View className="h-8" />
        </ScreenBody>
      </Screen>
    );
  }

  if (!activity) {
    return (
      <Screen>
        <ScreenHeader
          title="Activity"
          onBack={() => router.back()}
          hideProfile
          backAnalyticsId={ACTIVITY.top_nav.back}
          titleAnalyticsId={ACTIVITY.top_nav.page_title}
          analyticsSurface="activity"
        />
        <ScreenBody tabBarInset={false}>
          <Text className="mt-4 font-sans-sb text-[14px] text-ink-mute">
            No activity is live right now.
          </Text>
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title={activity.title}
        onBack={() => router.back()}
        hideProfile
        backAnalyticsId={ACTIVITY.top_nav.back}
        titleAnalyticsId={ACTIVITY.top_nav.page_title}
        analyticsSurface="activity"
      />
      <ScreenBody tabBarInset={false}>
        <ActivityCollage
          activity={activity}
          heartedIds={heartedIds}
          onRequestCapture={() => setCaptureOpen(true)}
          onToggleHeart={(id) => void toggleHeart(id)}
        />
        <View className="h-10" />
      </ScreenBody>

      <ActivityCaptureSheet
        open={captureOpen}
        prompt={activity.prompt}
        activityId={activity.id}
        onClose={() => setCaptureOpen(false)}
        onPosted={() => void refresh()}
      />
    </Screen>
  );
}
