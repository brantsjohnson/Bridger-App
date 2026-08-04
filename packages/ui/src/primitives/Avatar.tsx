// ============================================
// WHAT THIS FILE DOES (plain English):
// A round face for a person — usually an emoji on a colored circle (their
// accent). An optional story ring means they posted: coral = new/unseen,
// grey = already seen. Never a presence "online" dot.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Accent } from '@bridger/shared';
import { ACCENTS } from '../tokens';
import { cn } from '../lib/cn';

type AvatarProps = {
  name: string;
  emoji?: string;
  accent?: Accent;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** ring = they posted a story. Unseen rings are colored, seen rings are grey. */
  story?: 'unseen' | 'seen';
  onStory?: () => void;
  className?: string;
};

const sizes = {
  xs: 'h-7 w-7',
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  xl: 'h-24 w-24'
};
const textSizes = {
  xs: 'text-[12px]',
  sm: 'text-[15px]',
  md: 'text-[18px]',
  lg: 'text-[22px]',
  xl: 'text-[38px]'
};

export function Avatar({
  name,
  emoji,
  accent = 'purple',
  size = 'md',
  story,
  onStory,
  className
}: AvatarProps) {
  const token = ACCENTS[accent];

  const face = (
    <View
      accessibilityLabel={name}
      className={cn('items-center justify-center rounded-full', sizes[size], token.bg)}
    >
      <Text className={cn('font-sans-b', textSizes[size], token.text)}>{emoji ?? name.charAt(0)}</Text>
    </View>
  );

  const body = story ? (
    <View
      className={cn(
        'rounded-full p-[2.5px]',
        story === 'unseen' ? 'bg-coral' : 'bg-ink/15'
      )}
    >
      {face}
    </View>
  ) : (
    face
  );

  if (onStory && story) {
    return (
      <Pressable
        onPress={onStory}
        accessibilityRole="button"
        accessibilityLabel={`Open ${name}'s story`}
        className={cn('shrink-0 active:opacity-90', className)}
      >
        {body}
      </Pressable>
    );
  }

  return <View className={cn('shrink-0', className)}>{body}</View>;
}

export function AvatarStack({
  people,
  extra
}: {
  people: Array<{ name: string; emoji?: string; accent?: Accent }>;
  extra?: number;
}) {
  return (
    <View className="flex-row items-center">
      {people.map((p, i) => (
        <View key={p.name} className={cn('rounded-full', i > 0 && '-ml-1')}>
          <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
        </View>
      ))}
      {extra ? (
        <View className="-ml-1 h-7 w-7 items-center justify-center rounded-full bg-carbon">
          <Text className="font-sans-b text-[10px] text-white">+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}
