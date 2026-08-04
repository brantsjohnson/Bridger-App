// ============================================
// WHAT THIS FILE DOES (plain English):
// The small rounded pill used for tags, filters, and single choices. Selected =
// filled with its accent color; unselected = outline on the canvas. TierChip is
// the same pill pre-wired to a friendship tier (Close / Friends / Acquaintances)
// with a consistent color per tier.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Accent, Tier } from '@bridger/shared';
import { TIER_LABEL } from '@bridger/shared';
import { ACCENTS } from '../tokens';
import { cn } from '../lib/cn';

type ChipProps = {
  label: string;
  accent?: Accent;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
};

export function Chip({ label, accent = 'purple', selected = false, onPress, icon, size = 'md' }: ChipProps) {
  const token = ACCENTS[accent];
  const container = cn(
    'flex-row items-center gap-1.5 rounded-full',
    size === 'sm' ? 'h-7 px-3' : 'h-9 px-4',
    selected ? cn(token.bg, 'border border-transparent') : 'border border-ink-line bg-canvas-raised'
  );
  const textClasses = cn(
    'font-sans-sb',
    size === 'sm' ? 'text-[12px]' : 'text-[13px]',
    selected ? token.text : 'text-ink-soft'
  );

  const body = (
    <>
      {icon}
      <Text className={textClasses}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={cn(container, 'active:opacity-90')}
      >
        {body}
      </Pressable>
    );
  }
  return <View className={container}>{body}</View>;
}

// Each tier gets a steady color so people learn "coral = close", etc.
const TIER_ACCENT: Record<Tier, Accent> = {
  close: 'coral',
  friend: 'purple',
  acquaintance: 'blue',
  none: 'teal'
};

export function TierChip({
  tier,
  selected = true,
  onPress
}: {
  tier: Tier;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Chip label={TIER_LABEL[tier]} accent={TIER_ACCENT[tier]} selected={selected} onPress={onPress} size="sm" />
  );
}
