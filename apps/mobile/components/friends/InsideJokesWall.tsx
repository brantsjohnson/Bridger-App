// ============================================
// WHAT THIS FILE DOES (plain English):
// The Inside Jokes wall: sticky notes in a two-column grid with All / About /
// By filters, plus a small "+" to add one. Used on Friends (compact) and
// Profile. Data comes from useInsideJokes.
// Pass analyticsIds when the wall lives on Profile so taps use PROFILE.inside_jokes.*.
// ============================================
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FilterIcon } from 'lucide-react-native';
import type { InsideJoke } from '@bridger/shared';
import { cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import type { InsideJokeFilter } from '../../data/insideJokes';
import { useInsideJokes } from '../../hooks/useInsideJokes';
import { AddInsideJokeSheet } from './AddInsideJokeSheet';
import { AddNoteTile, InsideJokeNote } from './InsideJokeNote';

/** Optional taxonomy ids when this wall is on Profile (or Friends). */
export type InsideJokesAnalyticsIds = {
  note?: string;
  add?: string;
  filter?: string;
  noteBody?: string;
};

/** Compact Friends-tab preview: two notes, no filter chips. */
export function InsideJokesWidget({
  size = 'full',
  jokes,
  onAdd,
  analyticsIds
}: {
  size?: 'full' | 'half';
  /** From the screen's useInsideJokes so a new post refreshes the grid. */
  jokes: InsideJoke[];
  onAdd?: () => void;
  analyticsIds?: InsideJokesAnalyticsIds;
}) {
  const notes = jokes.slice(0, size === 'full' ? 2 : 1);

  return (
    <View className="flex-row flex-wrap gap-3.5">
      {notes.map((j, i) => (
        <View key={j.id} className={size === 'full' ? 'w-[47%]' : 'w-full'}>
          <InsideJokeNote
            joke={j}
            index={i}
            analyticsId={analyticsIds?.note}
            noteBodyAnalyticsId={analyticsIds?.noteBody}
          />
        </View>
      ))}
      {onAdd && notes.length === 0 ? (
        <AddNoteTile tall onPress={onAdd} analyticsId={analyticsIds?.add} />
      ) : null}
    </View>
  );
}

/** Full wall with filters (Profile + richer Friends uses). */
export function InsideJokesWall({
  ownerFirstName,
  empty = false,
  analyticsIds
}: {
  ownerFirstName?: string;
  empty?: boolean;
  analyticsIds?: InsideJokesAnalyticsIds;
}) {
  const who = ownerFirstName ?? 'you';
  const { jokes, counts, filter, setFilter, onAdd } = useInsideJokes('all');
  const [adding, setAdding] = useState(false);
  const notes = empty ? [] : jokes;

  return (
    <View className="gap-4">
      <FilterRow
        value={filter}
        onChange={setFilter}
        counts={counts}
        who={who}
        filterAnalyticsId={analyticsIds?.filter}
      />

      {notes.length > 0 ? (
        <View className="flex-row flex-wrap gap-3.5">
          {notes.map((joke, i) => (
            <View key={joke.id} className="w-[47%]">
              <InsideJokeNote
                joke={joke}
                index={i}
                analyticsId={analyticsIds?.note}
                noteBodyAnalyticsId={analyticsIds?.noteBody}
              />
            </View>
          ))}
          <View className="w-[47%]">
            <AddNoteTile onPress={() => setAdding(true)} analyticsId={analyticsIds?.add} />
          </View>
        </View>
      ) : (
        <AddNoteTile tall onPress={() => setAdding(true)} analyticsId={analyticsIds?.add} />
      )}

      <AddInsideJokeSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={async (input) => {
          await onAdd(input);
          setFilter('by');
        }}
      />
    </View>
  );
}

function FilterRow({
  value,
  onChange,
  counts,
  who,
  filterAnalyticsId
}: {
  value: InsideJokeFilter;
  onChange: (f: InsideJokeFilter) => void;
  counts: Record<InsideJokeFilter, number>;
  who: string;
  filterAnalyticsId?: string;
}) {
  const c = useThemeColors();
  const options: Array<[InsideJokeFilter, string]> = [
    ['all', 'All'],
    ['about', `About ${who}`],
    ['by', `By ${who}`]
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ alignItems: 'center', gap: 6 }}
    >
      <FilterIcon size={14} color={c.inkMute} strokeWidth={2.6} />
      {options.map(([key, label]) => {
        const on = value === key;
        return (
          <Pressable
            key={key}
            onPress={withAnalyticsPress(filterAnalyticsId, () => onChange(key))}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            className={cn(
              'min-h-[36px] shrink-0 flex-row items-center rounded-full border px-3 py-1.5',
              on ? 'border-transparent bg-ink' : 'border-ink-line bg-surface active:bg-[#F1ECFF]'
            )}
          >
            <Text className={cn('font-sans-b text-[12px]', on ? 'text-white' : 'text-ink-soft')}>
              {label}
            </Text>
            <Text className={cn('ml-1.5 font-sans-b text-[12px]', on ? 'text-white/60' : 'text-ink-mute')}>
              {counts[key]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
