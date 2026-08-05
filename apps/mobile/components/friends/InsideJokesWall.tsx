// ============================================
// WHAT THIS FILE DOES (plain English):
// The Inside Jokes wall: sticky notes in a two-column grid with All / About /
// By filters. The "Add an Inside Joke" tile stays at the top of the grid so
// it's always reachable. Used on Friends (compact) and Profile.
// Pass analyticsIds when the wall lives on Profile so taps use PROFILE.inside_jokes.*.
// ============================================
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FilterIcon } from 'lucide-react-native';
import type { InsideJoke } from '@bridger/shared';
import { Peel, cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';
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
        // Each note presses onto the wall instead of just appearing.
        <Peel key={j.id} index={i} style={{ width: size === 'full' ? '47%' : '100%' }}>
          <InsideJokeNote
            joke={j}
            index={i}
            analyticsId={analyticsIds?.note}
            noteBodyAnalyticsId={analyticsIds?.noteBody}
          />
        </Peel>
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
          {/* Add stays first so it's always reachable without scrolling past notes. */}
          <View className="w-[47%]">
            <AddNoteTile onPress={() => setAdding(true)} analyticsId={analyticsIds?.add} />
          </View>
          {notes.map((joke, i) => (
            <Peel key={joke.id} index={i + 1} style={{ width: '47%' }}>
              <InsideJokeNote
                joke={joke}
                index={i + 1}
                analyticsId={analyticsIds?.note}
                noteBodyAnalyticsId={analyticsIds?.noteBody}
              />
            </Peel>
          ))}
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
            {/*
              Selected chip is bg-ink. Ink flips light in dark mode, so
              text-white would vanish on a near-white pill. text-canvas is
              the opposite of ink in both themes (eggshell on dark / near-black
              on light), so the label stays readable either way.
            */}
            <Text className={cn('font-sans-b text-[12px]', on ? 'text-canvas' : 'text-ink-soft')}>
              {label}
            </Text>
            <Text className={cn('ml-1.5 font-sans-b text-[12px]', on ? 'text-canvas/60' : 'text-ink-mute')}>
              {counts[key]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
