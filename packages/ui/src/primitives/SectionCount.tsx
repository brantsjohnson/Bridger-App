// ============================================
// WHAT THIS FILE DOES (plain English):
// A small section header used on Friends: the tier name in the pixel font,
// with a live count next to it ("Close  3"). Matches Magic Patterns SectionCount.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { PixelHeading } from './PixelHeading';
import { cn } from '../lib/cn';

export function SectionCount({
  label,
  count,
  className
}: {
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <View className={cn('flex-row items-baseline gap-2', className)}>
      <PixelHeading size="md">{label}</PixelHeading>
      <Text
        accessibilityLabel={`${count} ${count === 1 ? 'person' : 'people'}`}
        className="font-sans-b text-[12px] text-ink-mute"
      >
        {count}
      </Text>
    </View>
  );
}
