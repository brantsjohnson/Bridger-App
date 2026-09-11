// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-page route for the weekly Friend Pod podcast. Opened from Friends
// tab Friend Pod. Play sends autoplay=1 so audio starts; the arrow does not.
// Loads this week's playlist, and lets co-op members switch to an earlier week.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { RecapPlaylist, RecapWeekListItem } from '@bridger/shared';
import { Screen, ScreenBody, ScreenHeader, useThemeColors } from '@bridger/ui';
import { RecapPlayer } from '../../components/pod/RecapPlayer';
import { getRecapPlaylist, listRecapWeeks } from '../../data/pod';

export default function RecapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ autoplay?: string }>();
  const autoplay = params.autoplay === '1' || params.autoplay === 'true';
  const c = useThemeColors();
  const [playlist, setPlaylist] = useState<RecapPlaylist | null>(null);
  const [weeks, setWeeks] = useState<RecapWeekListItem[]>([]);
  const [canBrowsePast, setCanBrowsePast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // THIS SECTION DOES: load the week list plus one week's clips.
  const load = useCallback(async (weekId?: string) => {
    setLoading(true);
    try {
      const data = await getRecapPlaylist(weekId);
      const listed = await listRecapWeeks().catch(() => ({
        canBrowsePast: false,
        weeks: [] as RecapWeekListItem[]
      }));
      setPlaylist(data);
      setWeeks(listed.weeks);
      setCanBrowsePast(listed.canBrowsePast);
      setFailed(false);
    } catch {
      if (!weekId) setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !playlist) {
    return (
      <Screen tone="plain" className="bg-canvas">
        <ScreenHeader
          title="Weekly recap"
          onBack={() => router.back()}
          hideProfile
        />
        <ScreenBody tabBarInset={false}>
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator color={c.ink} />
            <Text className="mt-3 font-sans-sb text-[13px] text-ink-mute">Loading…</Text>
          </View>
        </ScreenBody>
      </Screen>
    );
  }

  if (!playlist) {
    return (
      <Screen tone="plain" className="bg-canvas">
        <ScreenHeader
          title="Weekly recap"
          onBack={() => router.back()}
          hideProfile
        />
        <ScreenBody tabBarInset={false}>
          <View className="items-center py-20">
            <Text className="font-sans-b text-[15px] text-ink">
              {failed ? 'Could not load this week.' : 'No recaps this week.'}
            </Text>
          </View>
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <RecapPlayer
      playlist={playlist}
      weeks={weeks}
      canBrowsePast={canBrowsePast}
      autoplay={autoplay}
      onSelectWeek={(weekId) => {
        if (weekId === playlist.week.id) return;
        void load(weekId);
      }}
      onJoinCoop={() => router.push('/coop')}
      onClose={() => router.back()}
    />
  );
}
