// ============================================
// WHAT THIS FILE DOES (plain English):
// The little storage meter under the story calendar: label on the left,
// percent on the right, a thin bar that fills up. Turns coral when full so
// you notice before old stories start rolling off.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/cn';

export function StorageBar({
  usedPct,
  label = 'Story storage'
}: {
  /** 0 to 100 */
  usedPct: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, usedPct));
  const full = pct >= 100;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}, ${pct} percent used`}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="font-sans-b text-[12px] text-ink-soft">{label}</Text>
        <Text className={cn('font-sans-b text-[12px]', full ? 'text-coral' : 'text-ink-mute')}>
          {pct}% used
        </Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-ink/10">
        <View
          className={cn('h-full rounded-full', full ? 'bg-coral' : 'bg-ink')}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
