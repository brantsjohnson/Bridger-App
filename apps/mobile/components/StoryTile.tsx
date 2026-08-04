// ============================================
// WHAT THIS FILE DOES (plain English):
// One story in the Home tray — a tall rectangle filled with color/emoji, their
// tiny face in the corner, name at the bottom. Your own story can show a "+"
// to add another update. Matches Magic Patterns StoryTile exactly.
// Analytics: your story vs a friend's tile vs the + after posting.
// ============================================
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import { HOME, type Story } from '@bridger/shared';
import {
  ACCENTS,
  GradientRing,
  RADIUS,
  cn,
  ringToneForTier,
  withAnalyticsPress,
  type RingTone
} from '@bridger/ui';
import { getProfilePhoto, getStoryMedia } from '../data/fixtures/demo-media';
import { personById } from '../data/people';

export function StoryTile({
  story,
  onOpen,
  onAdd,
  mine = false
}: {
  story: Story;
  onOpen?: (id: string) => void;
  onAdd?: () => void;
  mine?: boolean;
}) {
  const token = ACCENTS[story.accent];
  // Analytics: yours opens the composer path; friends open the viewer.
  const tileId = mine ? HOME.stories_row.your_story : HOME.stories_row.story_tile;
  // First dropped story photo (if any) fills the tile; profile photo for the face.
  const cover = getStoryMedia(story.authorId)[0];
  const face = getProfilePhoto(story.authorId);
  // Ring color = your relationship to them. Yours is always the yellow one.
  const ringTone: RingTone = mine ? 'me' : ringToneForTier(personById(story.authorId).tier);

  return (
    <View className="relative h-[132px] w-[104px] shrink-0">
      {/*
        The colored ring says how close this person is: yellow for your own
        update, green for a close friend, blue for a friend, orange for an
        acquaintance. The name underneath still says it in words.
      */}
      <GradientRing tone={ringTone} radius={RADIUS.card} width={3} fill style={{ flex: 1 }}>
      <Pressable
        onPress={withAnalyticsPress(tileId, () => onOpen?.(story.id))}
        accessibilityRole="button"
        accessibilityLabel={mine ? 'Your story' : `${story.authorName}'s story`}
        className={cn('h-full w-full overflow-hidden active:opacity-90', token.bg)}
      >
        <View accessible={false} className="absolute inset-0 items-center justify-center opacity-90">
          {cover?.type === 'photo' ? (
            <Image
              source={cover.source}
              style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            />
          ) : (
            <Text className="text-[46px]">{story.emoji}</Text>
          )}
        </View>
        <View
          className={cn(
            'absolute left-2 top-2 h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2',
            story.seen ? 'border-white/40 bg-white/70' : 'border-white bg-white'
          )}
        >
          {face ? (
            <Image source={face} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
          ) : (
            <Text className="text-[13px]">{story.emoji}</Text>
          )}
        </View>
        <View className="absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-6">
          <Text className="font-sans-b text-[12px] leading-tight text-white">
            {mine ? 'Your story' : story.authorName}
          </Text>
          <Text className="font-sans-md text-[11px] text-white/80">{story.postedAt}</Text>
        </View>
      </Pressable>
      </GradientRing>

      {onAdd ? (
        <Pressable
          onPress={withAnalyticsPress(HOME.stories_row.add_after_post, onAdd)}
          accessibilityRole="button"
          accessibilityLabel="Add to your story"
          className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-[3px] border-canvas bg-carbon active:opacity-90"
        >
          <PlusIcon size={16} color="#FFFFFF" strokeWidth={3} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Only shown before you've posted anything today. */
export function AddStoryTile({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={withAnalyticsPress(HOME.stories_row.your_story, onPress)}
      accessibilityRole="button"
      accessibilityLabel="Check in"
      className="h-[132px] w-[104px] shrink-0 items-center justify-center gap-2 rounded-card border border-dashed border-ink-line bg-surface active:opacity-90"
    >
      <Text accessible={false} className="text-[22px] text-ink-soft">
        ＋
      </Text>
      <Text className="px-2 text-center font-sans-b text-[12px] leading-tight text-ink-soft">Check in</Text>
    </Pressable>
  );
}
