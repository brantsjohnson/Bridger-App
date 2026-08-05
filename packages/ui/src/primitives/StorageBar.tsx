// ============================================
// WHAT THIS FILE DOES (plain English):
// The thin meter under the story calendar. By default it shows a label +
// percent above the bar. On Profile we pass showMeta={false} because the
// card already says "Free month" and the percent once — no need to say it
// again. Turns coral when full so you notice before old stories roll off.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/cn';

export function StorageBar({
  usedPct,
  label = 'Free month',
  /** When false, only the bar paints — parent already showed the label/% . */
  showMeta = true
}: {
  /** 0 to 100 */
  usedPct: number;
  label?: string;
  showMeta?: boolean;
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
      {showMeta ? (
        <View className="mb-1.5 flex-row items-center justify-between">
          <Text className="font-sans-b text-[12px] text-ink-soft">{label}</Text>
          <Text className={cn('font-sans-b text-[12px]', full ? 'text-coral' : 'text-ink-mute')}>
            {pct}% used
          </Text>
        </View>
      ) : null}
      <View className="h-1.5 overflow-hidden rounded-full bg-ink/10">
        <View
          className={cn('h-full rounded-full', full ? 'bg-coral' : 'bg-ink')}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
