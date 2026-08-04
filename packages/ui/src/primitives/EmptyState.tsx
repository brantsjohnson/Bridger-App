// ============================================
// WHAT THIS FILE DOES (plain English):
// A friendly empty block: big emoji, one sentence, optional button. Used when
// a list has nothing yet (no events, no friends). Matches Magic Patterns.
// The graphic/copy region is tagged for dead_click so we learn if people tap
// it expecting something to happen.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/cn';
import { AnalyticsRegion, type AnalyticsProps } from '../lib/analytics';

export function EmptyState({
  emoji,
  line,
  action,
  className,
  analyticsId
}: {
  emoji: string;
  line: string;
  action?: React.ReactNode;
  className?: string;
} & Pick<AnalyticsProps, 'analyticsId'>) {
  return (
    <View
      className={cn(
        'items-center rounded-card border border-dashed border-ink-line bg-surface px-5 py-8',
        className
      )}
    >
      <AnalyticsRegion analyticsId={analyticsId} interactive={false} accessibilityLabel={line}>
        <Text accessible={false} className="text-center text-[36px]">
          {emoji}
        </Text>
        <Text className="mt-3 text-center font-sans-sb text-[14px] leading-snug text-ink-soft">
          {line}
        </Text>
      </AnalyticsRegion>
      {action ? <View className="mt-4">{action}</View> : null}
    </View>
  );
}
