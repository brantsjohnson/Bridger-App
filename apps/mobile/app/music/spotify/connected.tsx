// ============================================
// WHAT THIS FILE DOES (plain English):
// Landing page after Spotify sends the person back through Nest. Shows success
// or failure, then returns to Settings. Product event fires only on success.
// ============================================
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { trackProduct } from '@bridger/shared';
import { ButtonPrimary } from '@bridger/ui';
import { syncTopArtists } from '../../../data/music';

export default function SpotifyConnectedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ok?: string; error?: string; provider?: string }>();
  const ok = params.ok === '1';

  useEffect(() => {
    if (!ok) return;
    trackProduct('music_connected', { method: 'spotify' });
    void syncTopArtists()
      .then(() => trackProduct('music_taste_synced', { method: 'spotify' }))
      .catch(() => undefined);
  }, [ok]);

  return (
    <View className="flex-1 items-center justify-center bg-canvas px-6">
      <Stack.Screen options={{ title: 'Spotify' }} />
      <Text className="text-center font-pixel text-[28px] text-ink">
        {ok ? 'Spotify linked' : 'Could not link'}
      </Text>
      <Text className="mt-3 text-center font-sans-sb text-[14px] text-ink-mute">
        {ok
          ? 'You can pick Listening tracks and save songs. This is not how you sign into Bridger.'
          : params.error
            ? `Something went wrong (${params.error}). Try Connect Spotify again from Settings.`
            : 'Try Connect Spotify again from Settings.'}
      </Text>
      <View className="mt-8 w-full">
        <ButtonPrimary full onPress={() => router.replace('/(tabs)/profile')}>
          Back to profile
        </ButtonPrimary>
      </View>
    </View>
  );
}
