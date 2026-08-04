// ============================================
// WHAT THIS FILE DOES (plain English):
// A round face for a person — a real photo when we have one, otherwise an
// emoji on a colored circle (their accent). An optional story ring means they
// posted: coral = new/unseen, grey = already seen. Never a presence "online" dot.
// ============================================
import React from 'react';
import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import type { Accent } from '@bridger/shared';
import { ACCENTS } from '../tokens';
import { cn } from '../lib/cn';

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
  /** ring = they posted a story. Unseen rings are colored, seen rings are grey. */
  story?: 'unseen' | 'seen';
  onStory?: () => void;
  className?: string;
};

const sizes = {
  xs: 'h-7 w-7',
  sm: 'h-9 w-9',
  // header = 40px, so the profile photo matches the +, settings, and Edit
  // buttons that sit next to it in the top bar.
  header: 'h-10 w-10',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  xl: 'h-24 w-24'
};
// Exact pixel size for each avatar size. A photo <Image> needs a real
// width/height (a Tailwind class alone isn't reliably applied to images on
// web, which made the photo balloon to its full resolution). These match the
// h-/w- classes above.
const pixelSizes = {
  xs: 28,
  sm: 36,
  header: 40,
  md: 44,
  lg: 56,
  xl: 96
};
const textSizes = {
  xs: 'text-[12px]',
  sm: 'text-[15px]',
  header: 'text-[16px]',
  md: 'text-[18px]',
  lg: 'text-[22px]',
  xl: 'text-[38px]'
};

export function Avatar({
  name,
  emoji,
  accent = 'purple',
  photo,
  personId,
  size = 'md',
  story,
  onStory,
  className
}: AvatarProps) {
  const token = ACCENTS[accent];

  // Prefer an explicit photo; otherwise ask the resolver for this person's
  // dropped-in photo. Falls back to the emoji-on-color circle.
  const resolved = photo ?? (personId ? photoResolver?.(personId) : undefined);
  const px = pixelSizes[size];
  const face = resolved ? (
    <Image
      source={resolved}
      accessibilityLabel={name}
      className={cn('rounded-full', sizes[size])}
      style={{ width: px, height: px, borderRadius: px / 2, resizeMode: 'cover' }}
    />
  ) : (
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
