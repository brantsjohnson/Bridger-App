// ============================================
// WHAT THIS FILE DOES (plain English):
// The Inside Jokes wall: sticky notes in a two-column grid with All / About /
// By filters, plus a small "+" to add one. Used on Friends (compact) and will
// also power Profile later. Data comes from useInsideJokes.
// ============================================
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FilterIcon } from 'lucide-react-native';
import type { InsideJoke } from '@bridger/shared';
import { cn, useThemeColors } from '@bridger/ui';
import type { InsideJokeFilter } from '../../data/insideJokes';
import { useInsideJokes } from '../../hooks/useInsideJokes';
import { AddInsideJokeSheet } from './AddInsideJokeSheet';
import { AddNoteTile, InsideJokeNote } from './InsideJokeNote';

/** Compact Friends-tab preview: two notes, no filter chips. */
export function InsideJokesWidget({
  size = 'full',
  jokes,
  onAdd
}: {
  size?: 'full' | 'half';
  /** From the screen's useInsideJokes so a new post refreshes the grid. */
  jokes: InsideJoke[];
  onAdd?: () => void;
}) {
  const notes = jokes.slice(0, size === 'full' ? 2 : 1);

  return (
    <View className="flex-row flex-wrap gap-3.5">
      {notes.map((j, i) => (
        <View key={j.id} className={size === 'full' ? 'w-[47%]' : 'w-full'}>
          <InsideJokeNote joke={j} index={i} />
        </View>
      ))}
      {onAdd && notes.length === 0 ? <AddNoteTile tall onPress={onAdd} /> : null}
    </View>
  );
}

/** Full wall with filters (Profile + richer Friends uses). */
export function InsideJokesWall({
  ownerFirstName,
  empty = false
}: {
  ownerFirstName?: string;
  empty?: boolean;
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
      />

      {notes.length > 0 ? (
        <View className="flex-row flex-wrap gap-3.5">
          {notes.map((joke, i) => (
            <View key={joke.id} className="w-[47%]">
              <InsideJokeNote joke={joke} index={i} />
            </View>
          ))}
          <View className="w-[47%]">
            <AddNoteTile onPress={() => setAdding(true)} />
          </View>
        </View>
      ) : (
        <AddNoteTile tall onPress={() => setAdding(true)} />
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
  who
}: {
  value: InsideJokeFilter;
  onChange: (f: InsideJokeFilter) => void;
  counts: Record<InsideJokeFilter, number>;
  who: string;
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
            onPress={() => onChange(key)}
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
