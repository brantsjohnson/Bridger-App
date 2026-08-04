// ============================================
// WHAT THIS FILE DOES (plain English):
// One story in the Home tray — a tall rectangle filled with color/emoji, their
// tiny face in the corner, name at the bottom. Your own story can show a "+"
// to add another update. Matches Magic Patterns StoryTile exactly.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import type { Story } from '@bridger/shared';
import { ACCENTS, cn } from '@bridger/ui';

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

  return (
    <View className="relative h-[132px] w-[104px] shrink-0">
      <Pressable
        onPress={() => onOpen?.(story.id)}
        accessibilityRole="button"
        accessibilityLabel={mine ? 'Your story' : `${story.authorName}'s story`}
        className={cn(
          'h-full w-full overflow-hidden rounded-card active:opacity-90',
          token.bg,
          mine && 'border-[3px] border-ink'
        )}
      >
        <View accessible={false} className="absolute inset-0 items-center justify-center opacity-90">
          <Text className="text-[46px]">{story.emoji}</Text>
        </View>
        <View
          className={cn(
            'absolute left-2 top-2 h-7 w-7 items-center justify-center rounded-full border-2',
            story.seen ? 'border-white/40 bg-white/70' : 'border-white bg-white'
          )}
        >
          <Text className="text-[13px]">{story.emoji}</Text>
        </View>
        <View className="absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-6">
          <Text className="font-sans-b text-[12px] leading-tight text-white">
            {mine ? 'Your story' : story.authorName}
          </Text>
          <Text className="font-sans-md text-[11px] text-white/80">{story.postedAt}</Text>
        </View>
      </Pressable>

      {onAdd ? (
        <Pressable
          onPress={onAdd}
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
      onPress={onPress}
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
