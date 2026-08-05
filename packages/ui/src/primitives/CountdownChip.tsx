// ============================================
// WHAT THIS FILE DOES (plain English):
// The small pill on an event that says how long until it starts. When we know
// the real start time it becomes a LIVE clock — days, hours, minutes, seconds —
// ticking down. When we only have a rough label ("in 2 days") it just shows that.
//
// The four units (d / h / m / s) share the pill evenly and the pill stretches to
// the width of whatever it sits in, so it always fits the card and can never run
// off the edge. Tabular numbers keep "1" and "0" the same width, so a tick from
// "9" to "10" (or "1" to "0") never shoves anything sideways.
//
// ACCESSIBILITY: the screen reader is given the calm version ("in 2 days"), not
// a number that changes every second, so it isn't re-announced constantly.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { useCountdown } from '../lib/whimsy';
import { cn } from '../lib/cn';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/**
 * One unit of the clock. Each takes an equal share of the pill (flex 1) and
 * centers its value, so the row spreads evenly and shrinks to fit any card.
 */
function Unit({
  value,
  unit,
  loud
}: {
  value: string;
  unit: string;
  loud: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text
        className={cn(
          'font-sans-b',
          loud ? 'text-[13px] text-white' : 'text-[11px] text-ink'
        )}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
        <Text
          className={cn(
            'font-sans-b',
            loud ? 'text-[13px] text-white/70' : 'text-[11px] text-ink/55'
          )}
        >
          {unit}
        </Text>
      </Text>
    </View>
  );
}

export function CountdownChip({
  label,
  /** real start time (epoch ms or Date) — turns the pill into a live clock */
  startsAt,
  /** loud version for the top of an event page */
  tone = 'quiet'
}: {
  label?: string;
  startsAt?: number | Date | null;
  tone?: 'quiet' | 'loud';
}) {
  const countdown = useCountdown(startsAt ?? null);
  const live = startsAt != null && !countdown.done;
  const loud = tone === 'loud';

  if (!live) {
    const text = label ?? (countdown.done && startsAt != null ? 'Happening now' : '');
    if (!text) return null;
    return (
      <View
        accessible
        accessibilityLabel={label ?? text}
        className={cn(
          'rounded-full px-2.5 py-1',
          loud ? 'bg-ink px-3 py-1.5' : 'bg-surface'
        )}
      >
        <Text
          className={cn(
            'font-sans-b',
            loud ? 'text-[13px] text-white' : 'text-[11px] text-ink'
          )}
        >
          {text}
        </Text>
      </View>
    );
  }

  // Show all four units once we're live. The pill stretches to its parent and
  // the units split it evenly, so it always fits and never runs off the card.
  return (
    <View
      accessible
      accessibilityLabel={label ?? countdown.label}
      className={cn(
        'w-full flex-row items-center rounded-full',
        loud ? 'bg-ink px-3 py-1.5' : 'bg-surface px-2 py-1'
      )}
    >
      <Unit value={String(countdown.days)} unit="d" loud={loud} />
      <Unit value={pad2(countdown.hours)} unit="h" loud={loud} />
      <Unit value={pad2(countdown.minutes)} unit="m" loud={loud} />
      <Unit value={pad2(countdown.seconds)} unit="s" loud={loud} />
    </View>
  );
}
