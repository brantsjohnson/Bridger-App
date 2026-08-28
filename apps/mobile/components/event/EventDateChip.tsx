// ============================================
// WHAT THIS FILE DOES (plain English):
// The little square date badge on event cards and the event page — day number
// on top, weekday under it (e.g. 31 / FRI). Same look everywhere so the list
// and the detail page feel like one product. On the event header it sits next
// to the title; on list cards it stays compact.
//
// Relative labels like "Tonight" do not get printed twice. We turn them into a
// real calendar date (from startsAt when we have it) so the square always
// reads as a date, not "Tonight / TONIGHT".
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import type { EventItem } from '@bridger/shared';
import { cn } from '@bridger/ui';

type Props = {
  /** Uses the event's `day` string, e.g. "Fri 31" or "Fri 31 Jul" */
  event: Pick<EventItem, 'day'> & { startsAt?: EventItem['startsAt'] };
  /** Header next to the title uses the larger square */
  size?: 'sm' | 'lg';
  className?: string;
};

/** Words that mean "use a real calendar date" instead of printing the word. */
const RELATIVE_DAY = /^(tonight|today|now|tomorrow)$/i;

/** Calendar date for a relative label when we do not have startsAt yet. */
function relativeFallback(day: string): Date | null {
  const key = day.trim().toLowerCase();
  const d = new Date();
  if (key === 'tonight' || key === 'today' || key === 'now') return d;
  if (key === 'tomorrow') {
    d.setDate(d.getDate() + 1);
    return d;
  }
  return null;
}

/** Turn a Date into the chip's weekday + day-of-month. */
function fromDate(d: Date): { weekday: string; date: string } {
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
    date: String(d.getDate())
  };
}

/** Pull weekday + day-of-month out of demo day strings (or startsAt). */
function parseDay(
  day: string,
  startsAt?: number | Date | null
): { weekday: string; date: string } {
  const parts = day.trim().split(/\s+/);
  const numeric = parts.find((p) => /^\d{1,2}$/.test(p));

  // Real date already in the string: "Fri 31" or "Fri 31 Jul".
  if (numeric) {
    return {
      weekday: parts[0] ?? '',
      date: numeric
    };
  }

  // "Tonight" / "Today" / etc.: prefer startsAt, else today's (or tomorrow's) date.
  if (RELATIVE_DAY.test(day.trim())) {
    if (startsAt != null) return fromDate(new Date(startsAt));
    const fallback = relativeFallback(day);
    if (fallback) return fromDate(fallback);
  }

  // Unknown one-word label: show it once on top, leave the under-line empty.
  return {
    weekday: parts.length > 1 ? (parts[0] ?? '') : '',
    date: parts.length > 1 ? (parts[1] ?? '') : (parts[0] ?? '')
  };
}

export function EventDateChip({ event, size = 'sm', className }: Props) {
  const { weekday, date } = parseDay(event.day, event.startsAt);
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
      {weekday ? (
        <Text
          className={cn(
            'mt-0.5 font-sans-b uppercase text-ink-mute',
            large ? 'text-[10px]' : 'text-[9px]'
          )}
        >
          {weekday}
        </Text>
      ) : null}
    </View>
  );
}
