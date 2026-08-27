// ============================================
// WHAT THIS FILE DOES (plain English):
// Screen to pick your Listening track from Spotify search and save it.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MusicTrackPicker } from '../../components/music/MusicTrackPicker';

export default function ListeningPickScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-canvas px-4 pt-2">
      <Stack.Screen options={{ title: 'Listening' }} />
      <Text className="mb-3 font-pixel text-[22px] text-ink">Listening…</Text>
      <MusicTrackPicker kind="listening_now" onSaved={() => router.back()} />
    </View>
  );
}
