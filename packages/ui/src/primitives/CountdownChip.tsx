// ============================================
// WHAT THIS FILE DOES (plain English):
// A small pill that says when something is ("in 2 days"). Used on event cards.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';

export function CountdownChip({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-surface px-2.5 py-1">
      <Text className="font-sans-b text-[11px] text-ink">{label}</Text>
    </View>
  );
}
