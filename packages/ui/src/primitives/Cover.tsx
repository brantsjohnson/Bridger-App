// ============================================
// WHAT THIS FILE DOES (plain English):
// Cover art for events and activities. A photo fills the frame. Color, emoji,
// and text covers use a vibrant solid background so the banner feels loud and
// fun. Stickers and plain emoji without a bg still use the accent confetti look.
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

  // --- PHOTO: fills the whole frame; optional banner text on top ---
  if (cover?.kind === 'photo') {
    return (
      <View className={cn('relative h-full w-full overflow-hidden', rounded && 'rounded-card', className)}>
        <Image
          source={{ uri: cover.url }}
          accessibilityIgnoresInvertColors
          className="h-full w-full"
          style={{ resizeMode: 'cover' }}
        />
        {cover.bannerText?.trim() ? (
          <View className="absolute inset-0 items-center justify-center bg-black/25 px-4">
            <Text
              numberOfLines={3}
              className="text-center font-pixel text-[26px] leading-tight text-white"
              style={{ textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 6 }}
            >
              {cover.bannerText.trim()}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  // --- SOLID COLOR banner ---
  if (cover?.kind === 'color') {
    return (
      <View
        className={cn('h-full w-full', rounded && 'rounded-card', className)}
        style={{ backgroundColor: cover.bg }}
      />
    );
  }

  // --- TEXT on a vibrant wash ---
  if (cover?.kind === 'text') {
    return (
      <View
        className={cn(
          'h-full w-full items-center justify-center px-4',
          rounded && 'rounded-card',
          className
        )}
        style={{ backgroundColor: cover.bg }}
      >
        <Text
          numberOfLines={3}
          className="text-center font-pixel text-[28px] leading-tight text-white"
          style={{ textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 4 }}
        >
          {cover.value || 'Event'}
        </Text>
      </View>
    );
  }

  // --- EMOJI with optional vibrant bg (big + confetti) ---
  if (cover?.kind === 'emoji' && cover.bg) {
    const glyph = cover.value?.trim() || '';
    return (
      <View
        className={cn(
          'relative h-full w-full items-center justify-center overflow-hidden',
          rounded && 'rounded-card',
          className
        )}
        style={{ backgroundColor: cover.bg }}
      >
        {glyph
          ? CONFETTI.map((s, i) => (
              <Text
                key={i}
                accessible={false}
                style={{
                  position: 'absolute',
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  fontSize: s.size,
                  opacity: s.opacity + 0.15,
                  transform: [{ rotate: `${s.rotate}deg` }]
                }}
              >
                {glyph}
              </Text>
            ))
          : null}
        {glyph ? (
          <Text accessible={false} style={{ fontSize: 72 }}>
            {glyph}
          </Text>
        ) : null}
      </View>
    );
  }

  // --- FALLBACK: accent wash + confetti (legacy emoji / sticker / empty) ---
  const glyph =
    cover?.kind === 'emoji' ? cover.value : cover?.kind === 'sticker' ? '✨' : '✨';

  return (
    <View
      className={cn(
        'relative h-full w-full items-center justify-center overflow-hidden',
        token.bg,
        rounded && 'rounded-card',
        className
      )}
    >
      {CONFETTI.map((s, i) => (
        <Text
          key={i}
          accessible={false}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: s.size,
            opacity: s.opacity,
            transform: [{ rotate: `${s.rotate}deg` }]
          }}
        >
          {glyph}
        </Text>
      ))}
      <Text accessible={false} style={{ fontSize: 46 }}>
        {glyph}
      </Text>
    </View>
  );
}

/**
 * Where each scattered emoji lands. Hand-placed rather than random so banners
 * are stable between renders and nothing bunches up behind the middle glyph.
 *
 * IMPORTANT: keep pieces inside a safe inset (roughly 8–82% x, 8–52% y) with
 * modest sizes. Pieces parked on the bottom/side clip edge of short covers
 * (like the Events idea chips) flicker in and out while a parent marquee
 * moves, because sub-pixel translate + overflow:hidden turns them on/off.
 */
const CONFETTI = [
  { x: 8, y: 10, size: 14, rotate: -18, opacity: 0.5 },
  { x: 18, y: 36, size: 12, rotate: 12, opacity: 0.38 },
  { x: 12, y: 48, size: 15, rotate: -8, opacity: 0.45 },
  { x: 28, y: 14, size: 13, rotate: 22, opacity: 0.42 },
  { x: 36, y: 44, size: 12, rotate: -25, opacity: 0.35 },
  { x: 48, y: 8, size: 15, rotate: 8, opacity: 0.45 },
  { x: 54, y: 46, size: 13, rotate: -14, opacity: 0.4 },
  { x: 66, y: 16, size: 12, rotate: 28, opacity: 0.38 },
  { x: 72, y: 40, size: 14, rotate: -6, opacity: 0.48 },
  { x: 78, y: 10, size: 13, rotate: 16, opacity: 0.42 },
  { x: 82, y: 34, size: 14, rotate: -20, opacity: 0.45 },
  { x: 84, y: 48, size: 12, rotate: 10, opacity: 0.35 },
  { x: 58, y: 28, size: 11, rotate: -30, opacity: 0.3 },
  { x: 24, y: 26, size: 11, rotate: 18, opacity: 0.3 }
] as const;
