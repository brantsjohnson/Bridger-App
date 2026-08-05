// ============================================
// WHAT THIS FILE DOES (plain English):
// The little square date badge on event cards and the event page — day number
// on top, weekday under it (e.g. 31 / FRI). Same look everywhere so the list
// and the detail page feel like one product.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import type { EventItem } from '@bridger/shared';

type Props = {
  /** Uses the event's `day` string, e.g. "Fri 31" or "Fri Jul 31" */
  event: Pick<EventItem, 'day'>;
  className?: string;
};

export function EventDateChip({ event, className }: Props) {
  // Demo days look like "Fri 31" — weekday first, number second
  const parts = event.day.split(' ');
  const weekday = parts[0];
  const date = parts[1] ?? parts[0];

  return (
    <View
      className={
        className ??
        'h-11 w-11 shrink-0 items-center justify-center rounded-none border-2 border-ink bg-surface'
      }
      accessibilityLabel={event.day}
    >
      <Text className="font-pixel text-[13px] leading-none text-ink">{date}</Text>
      <Text className="mt-0.5 font-sans-b text-[9px] uppercase text-ink-mute">
        {weekday}
      </Text>
    </View>
  );
}
