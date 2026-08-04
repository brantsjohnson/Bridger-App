// ============================================
// WHAT THIS FILE DOES (plain English):
// The Stories tab on your profile — a memory archive, not a content grid.
// A month calendar where each day you posted shows that story's emoji; tap a
// posted day to watch it again. Under it, the storage card: how full your
// free month is, with the co-op prompt only when it's actually full.
// ============================================
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import {
  ButtonSecondary,
  EmptyState,
  StorageBar,
  cn,
  useThemeColors
} from '@bridger/ui';
import type { StorageState } from '../../data/profile';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function StoryCalendar({
  days,
  storage,
  empty = false,
  onOpenStory
}: {
  /** day of month -> story thumbnail emoji */
  days: Record<number, string>;
  storage: StorageState;
  empty?: boolean;
  /** a posted day opens that day's story */
  onOpenStory?: (day: number) => void;
}) {
  const c = useThemeColors();
  // Month paging is visual-only until the archive API lands.
  const [month, setMonth] = useState('July 2026');
  const usedPct = empty ? 0 : storage.usedPct;

  if (empty) {
    return (
      <EmptyState
        emoji="📸"
        line="No stories yet. Your posts land here as a monthly archive."
        action={
          <ButtonSecondary size="sm" tone="solid">
            Post a story
          </ButtonSecondary>
        }
      />
    );
  }

  const openStory = (day: number) => {
    if (onOpenStory) onOpenStory(day);
    // TODO: replace with the story player when STORIES.md ships
    else Alert.alert('Story', `The story from ${month.split(' ')[0]} ${day} opens here.`);
  };

  return (
    <View className="gap-5">
      <View className="rounded-card border border-ink-line bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => setMonth('June 2026')}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-[#F1ECFF]"
          >
            <ChevronLeftIcon size={16} color={c.ink} strokeWidth={2.6} />
          </Pressable>
          <Text className="font-pixel text-[16px] text-ink">{month}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => setMonth('July 2026')}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-[#F1ECFF]"
          >
            <ChevronRightIcon size={16} color={c.ink} strokeWidth={2.6} />
          </Pressable>
        </View>

        <Text className="mt-2 text-center font-sans-sb text-[11px] text-ink-mute">
          Tap a day to watch that story again.
        </Text>

        {/* 7-column grid: weekday labels, then the 31 days */}
        <View className="mt-3 flex-row flex-wrap">
          {DAY_LABELS.map((d, i) => (
            <View key={`${d}-${i}`} style={{ width: `${100 / 7}%` }} className="pb-1.5">
              <Text className="text-center font-sans-b text-[10px] text-ink-mute">{d}</Text>
            </View>
          ))}
          {Array.from({ length: 31 }).map((_, i) => {
            const day = i + 1;
            const thumb = days[day];
            return (
              <View key={day} style={{ width: `${100 / 7}%` }} className="p-[3px]">
                <Pressable
                  disabled={!thumb}
                  onPress={thumb ? () => openStory(day) : undefined}
                  accessibilityRole={thumb ? 'button' : 'text'}
                  accessibilityLabel={
                    thumb ? `Open story from ${month.split(' ')[0]} ${day}` : `${month.split(' ')[0]} ${day}, no story`
                  }
                  className={cn(
                    'aspect-square items-center justify-center rounded-md',
                    thumb ? 'bg-purple/15 active:bg-purple/25' : 'border border-ink-line bg-surface'
                  )}
                >
                  {thumb ? (
                    <Text accessible={false} className="text-[15px]">
                      {thumb}
                    </Text>
                  ) : (
                    <Text className="font-sans-sb text-[10px] text-ink-mute">{day}</Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      {/* the storage card — honest about the free month rolling off */}
      <View className="rounded-card border border-ink-line bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
            Storage
          </Text>
          <Text className="font-sans-sb text-[12px] text-ink-soft">
            Free month · {usedPct}% used
          </Text>
        </View>
        <View className="mt-2.5">
          <StorageBar usedPct={usedPct} />
        </View>

        {usedPct >= 100 ? (
          <View className="mt-3">
            <Text className="font-sans-sb text-[13px] text-ink">
              Your free month is full. Older posts will roll off. Members keep everything.
            </Text>
            <View className="mt-3">
              <ButtonSecondary full size="sm" tone="solid">
                Join the co-op
              </ButtonSecondary>
            </View>
          </View>
        ) : (
          <Text className="mt-2 font-sans-md text-[12px] text-ink-mute">
            Story media older than 30 days rolls off.
          </Text>
        )}
      </View>
    </View>
  );
}
