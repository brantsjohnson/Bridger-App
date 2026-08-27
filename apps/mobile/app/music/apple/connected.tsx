// ============================================
// WHAT THIS FILE DOES (plain English):
// Landing page after Apple Music sends the person back through Nest. Shows
// success or failure, then returns to profile. Product event fires only on success.
// ============================================
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { trackProduct } from '@bridger/shared';
import { ButtonPrimary } from '@bridger/ui';
import { syncTopArtists } from '../../../data/music';

export default function AppleMusicConnectedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ok?: string; error?: string; provider?: string }>();
  const ok = params.ok === '1';

  useEffect(() => {
    if (!ok) return;
    trackProduct('music_connected', { method: 'apple_music' });
    void syncTopArtists()
      .then(() => trackProduct('music_taste_synced', { method: 'apple_music' }))
      .catch(() => undefined);
  }, [ok]);

  return (
    <View className="flex-1 items-center justify-center bg-canvas px-6">
      <Stack.Screen options={{ title: 'Apple Music' }} />
      <Text className="text-center font-pixel text-[28px] text-ink">
        {ok ? 'Apple Music linked' : 'Could not link'}
      </Text>
      <Text className="mt-3 text-center font-sans-sb text-[14px] text-ink-mute">
        {ok
          ? 'We can find artists you listen to a lot for shared taste. This is not how you sign into Bridger.'
          : params.error
            ? `Something went wrong (${params.error}). Try Connect Apple Music again from Settings.`
            : 'Try Connect Apple Music again from Settings.'}
      </Text>
      <View className="mt-8 w-full">
        <ButtonPrimary full onPress={() => router.replace('/(tabs)/profile')}>
          Back to profile
        </ButtonPrimary>
      </View>
    </View>
  );
}
