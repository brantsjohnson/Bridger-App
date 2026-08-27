// ============================================
// WHAT THIS FILE DOES (plain English):
// A round face for a person — a real photo when we have one, otherwise an
// emoji on a colored circle (their accent). An optional story ring means they
// posted an update: a moving white → light wash gradient (Instagram-style).
// No ring = no story. Never a presence "online" dot.
//
// Sizing is ALWAYS inline pixels (never Tailwind h-/w- alone). Production
// builds were collapsing faces to 0×0 when NativeWind class sizes did not
// stick, which made every header and roster photo look "missing."
// ============================================
import React from 'react';
import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import type { Accent } from '@bridger/shared';
import { ACCENT_HEX, ACCENTS, WASH_STORY_RING, type WashStoryRing } from '../tokens';
import { cn } from '../lib/cn';
import { GradientRing } from './GradientRing';

// --- PHOTO RESOLVER: how the avatar finds a person's real photo ---
// packages/ui must not import app data, so the app registers a lookup once at
// startup (see registerAvatarPhotoResolver). Any Avatar given a `personId` can
// then show that person's dropped-in photo automatically, everywhere.
type PhotoResolver = (personId: string) => ImageSourcePropType | undefined;
let photoResolver: PhotoResolver | undefined;
export function registerAvatarPhotoResolver(resolver: PhotoResolver) {
  photoResolver = resolver;
}

type AvatarProps = {
  name: string;
  emoji?: string;
  accent?: Accent;
  /** When set, shows the photo instead of the emoji. */
  photo?: ImageSourcePropType;
  /** Who this avatar is — lets us auto-load their photo via the resolver. */
  personId?: string;
  size?: 'xs' | 'sm' | 'header' | 'md' | 'lg' | 'xl';
  /** Exact pixel width when a named size is too small (reveal orbs). */
  diameter?: number;
  /**
   * Ring = they posted a story. Unseen rings spin; seen rings stay still
   * (same white → light wash, just quieter). No value = no ring.
   */
  story?: 'unseen' | 'seen';
  /**
   * Which wash the ring should match (Friends roster card color). Defaults to
   * the friend-blue light tint when omitted.
   */
  ringWash?: WashStoryRing;
  onStory?: () => void;
  className?: string;
};

// Exact pixel size for each avatar size. Inline styles only — NativeWind
// h-/w- classes are not reliable enough for faces in release builds.
const pixelSizes = {
  xs: 28,
  sm: 36,
  // header = 40px, so the profile photo matches the +, settings, and Edit
  // buttons that sit next to it in the top bar.
  header: 40,
  md: 44,
  lg: 56,
  xl: 96
};
const fontSizes = {
  xs: 12,
  sm: 15,
  header: 16,
  md: 18,
  lg: 22,
  xl: 38
};

const RING_WIDTH = 3;

export function Avatar({
  name,
  emoji,
  accent = 'purple',
  photo,
  personId,
  size = 'md',
  diameter,
  story,
  ringWash = 'friend',
  onStory,
  className
}: AvatarProps) {
  const token = ACCENTS[accent];
  const fill = ACCENT_HEX[accent];

  // Prefer an explicit photo; otherwise ask the resolver for this person's
  // dropped-in photo. Falls back to the emoji-on-color circle.
  const resolved = photo ?? (personId ? photoResolver?.(personId) : undefined);
  const px = diameter ?? pixelSizes[size];
  // THIS SECTION DOES: draw the face with hard pixel sizes so it never
  // collapses to an invisible 0×0 circle in production.
  const roundStyle = {
    width: px,
    height: px,
    borderRadius: px / 2,
    overflow: 'hidden' as const
  };
  const face = resolved ? (
    <Image
      source={resolved}
      accessibilityLabel={name}
      resizeMode="cover"
      style={roundStyle}
    />
  ) : (
    <View
      accessibilityLabel={name}
      style={[roundStyle, { alignItems: 'center', justifyContent: 'center', backgroundColor: fill }]}
    >
      <Text
        style={{
          fontSize: fontSizes[size],
          fontWeight: '700',
          color: token.text.includes('white') ? '#FFFFFF' : '#1C1B16'
        }}
      >
        {emoji ?? name.charAt(0)}
      </Text>
    </View>
  );

  // Ring only when they have a story. White → lighter card wash; spins while unseen.
  const body = story ? (
    <GradientRing
      colors={WASH_STORY_RING[ringWash]}
      radius={px / 2 + RING_WIDTH}
      width={RING_WIDTH}
      spin={story === 'unseen'}
      shadow
    >
      {face}
    </GradientRing>
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
  people: Array<{ name: string; emoji?: string; accent?: Accent; photo?: ImageSourcePropType; personId?: string }>;
  extra?: number;
}) {
  return (
    <View className="flex-row items-center">
      {people.map((p, i) => (
        <View key={p.personId ?? p.name} className={cn('rounded-full', i > 0 && '-ml-1')}>
          <Avatar name={p.name} emoji={p.emoji} accent={p.accent} photo={p.photo} personId={p.personId} size="xs" />
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
