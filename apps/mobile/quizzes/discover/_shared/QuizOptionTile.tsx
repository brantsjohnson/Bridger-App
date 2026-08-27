// ============================================
// WHAT THIS FILE DOES (plain English):
// One congruent answer row: checkbox + label. Selected = accent fill and a
// colored-in checked box. The option emoji is NOT shown in the tile — it flies
// out as a willow burst from the tap instead.
// ============================================
import React, { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Accent } from '@bridger/shared';
import { ACCENTS, cn } from '@bridger/ui';
import type { BurstOrigin } from './EmojiBurst';

export type QuizTileOption = {
  id: string;
  label: string;
  emoji: string;
};

type Props = {
  option: QuizTileOption;
  selected: boolean;
  accent: Accent;
  onPress: (origin: BurstOrigin) => void;
};

/** Same corner on every tile so the stack feels one family. */
const TILE_RADIUS = 16;

export function QuizOptionTile({ option, selected, accent, onPress }: Props) {
  const token = ACCENTS[accent];
  const ref = useRef<View>(null);

  const handlePress = () => {
    ref.current?.measureInWindow((x, y, w, h) => {
      // Pass the whole tile so the burst can pour from its full width.
      onPress({ x, y, width: w, height: h });
    });
  };

  return (
    <View ref={ref} collapsable={false}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${option.label}${selected ? ', selected' : ''}`}
        className={cn(
          'min-h-[48px] flex-row items-center gap-3 border-2 px-3.5 py-3',
          selected ? cn(token.bg, 'border-ink') : 'border-ink-line bg-surface'
        )}
        style={{ borderRadius: TILE_RADIUS }}
      >
        {/* THIS SECTION DOES: checkbox empty, or accent-filled with a tick. */}
        <View
          accessible={false}
          className={cn(
            'h-6 w-6 items-center justify-center rounded-md border-2',
            selected ? 'border-ink bg-canvas' : 'border-ink-line bg-canvas'
          )}
        >
          {selected ? (
            <View
              className={cn(
                'h-full w-full items-center justify-center rounded-[5px]',
                token.bg
              )}
            >
              <Text className={cn('font-sans-b text-[12px] leading-none', token.text)}>
                ✓
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={2}
          className={cn(
            'min-w-0 flex-1 font-sans-b text-[15px] leading-snug',
            selected ? token.text : 'text-ink'
          )}
        >
          {option.label}
        </Text>
      </Pressable>
    </View>
  );
}
