// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-page route for the weekly Friend Pod podcast. Opened from Play on
// Friends tab Friend Pod. Loads the playlist, then hands it to RecapPlayer.
// ============================================
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { RecapPlaylist } from '@bridger/shared';
import { Screen, ScreenBody, ScreenHeader, useThemeColors } from '@bridger/ui';
import { RecapPlayer } from '../../components/pod/RecapPlayer';
import { getRecapPlaylist } from '../../data/pod';

export default function RecapScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const [playlist, setPlaylist] = useState<RecapPlaylist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await getRecapPlaylist();
        if (alive) setPlaylist(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
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
            <Text className="font-sans-b text-[15px] text-ink">No recaps this week.</Text>
          </View>
        </ScreenBody>
      </Screen>
    );
  }

  return <RecapPlayer playlist={playlist} onClose={() => router.back()} />;
}
