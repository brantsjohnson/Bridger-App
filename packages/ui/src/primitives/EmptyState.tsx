// ============================================
// WHAT THIS FILE DOES (plain English):
// A friendly empty block: big emoji, one sentence, optional button. Used when
// a list has nothing yet (no events, no friends). Matches Magic Patterns.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/cn';

export function EmptyState({
  emoji,
  line,
  action,
  className
}: {
  emoji: string;
  line: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'items-center rounded-card border border-dashed border-ink-line bg-surface px-5 py-8',
        className
      )}
    >
      <Text accessible={false} className="text-[36px]">
        {emoji}
      </Text>
      <Text className="mt-3 text-center font-sans-sb text-[14px] leading-snug text-ink-soft">
        {line}
      </Text>
      {action ? <View className="mt-4">{action}</View> : null}
    </View>
  );
}
