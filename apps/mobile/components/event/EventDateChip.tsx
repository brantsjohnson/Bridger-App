// ============================================
// WHAT THIS FILE DOES (plain English):
// The little square date badge on event cards and the event page — day number
// on top, weekday under it (e.g. 31 / FRI). Same look everywhere so the list
// and the detail page feel like one product. On the event header it sits next
// to the title; on list cards it stays compact.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import type { EventItem } from '@bridger/shared';
import { cn } from '@bridger/ui';

type Props = {
  /** Uses the event's `day` string, e.g. "Fri 31" or "Fri 31 Jul" */
  event: Pick<EventItem, 'day'>;
  /** Header next to the title uses the larger square */
  size?: 'sm' | 'lg';
  className?: string;
};

/** Pull weekday + day-of-month out of demo day strings. */
function parseDay(day: string): { weekday: string; date: string } {
  const parts = day.trim().split(/\s+/);
  const numeric = parts.find((p) => /^\d{1,2}$/.test(p));
  const weekday = parts[0] ?? '';
  return {
    weekday,
    date: numeric ?? parts[1] ?? parts[0] ?? ''
  };
}

export function EventDateChip({ event, size = 'sm', className }: Props) {
  const { weekday, date } = parseDay(event.day);
  const large = size === 'lg';

  return (
    <View
      className={cn(
        'shrink-0 items-center justify-center rounded-none border-2 border-ink bg-surface',
        large ? 'h-14 w-14' : 'h-11 w-11',
        className
      )}
      accessibilityLabel={event.day}
    >
      <Text
        className={cn(
          'font-pixel leading-none text-ink',
          large ? 'text-[18px]' : 'text-[13px]'
        )}
      >
        {date}
      </Text>
      <Text
        className={cn(
          'mt-0.5 font-sans-b uppercase text-ink-mute',
          large ? 'text-[10px]' : 'text-[9px]'
        )}
      >
        {weekday}
      </Text>
    </View>
  );
}
