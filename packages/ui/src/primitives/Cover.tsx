// ============================================
// WHAT THIS FILE DOES (plain English):
// Cover art for events and activities. A photo fills the frame; otherwise we
// show a soft accent wash with a large emoji so it still reads as designed.
// ============================================
import React from 'react';
import { Image, Text, View } from 'react-native';
import type { Accent, Cover } from '@bridger/shared';
import { ACCENTS } from '../tokens';
import { cn } from '../lib/cn';

export function CoverArt({
  cover,
  accent = 'purple',
  className,
  rounded = false
}: {
  cover?: Cover;
  accent?: Accent;
  className?: string;
  rounded?: boolean;
}) {
  const token = ACCENTS[accent];

  if (cover?.kind === 'photo') {
    return (
      <Image
        source={{ uri: cover.url }}
        accessibilityIgnoresInvertColors
        className={cn('h-full w-full', rounded && 'rounded-card', className)}
        style={{ resizeMode: 'cover' }}
      />
    );
  }

  const glyph = cover?.kind === 'emoji' ? cover.value : '✨';

  return (
    <View
      className={cn(
        'relative h-full w-full items-center justify-center overflow-hidden',
        token.tintSolid,
        rounded && 'rounded-card',
        className
      )}
    >
      <Text accessible={false} style={{ fontSize: 42, opacity: 0.9 }}>
        {glyph}
      </Text>
      <Text
        accessible={false}
        style={{ position: 'absolute', left: 12, top: 8, fontSize: 18, opacity: 0.45 }}
      >
        {glyph}
      </Text>
      <Text
        accessible={false}
        style={{ position: 'absolute', right: 16, bottom: 10, fontSize: 22, opacity: 0.55 }}
      >
        {glyph}
      </Text>
    </View>
  );
}
