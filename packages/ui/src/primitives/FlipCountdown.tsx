// ============================================
// WHAT THIS FILE DOES (plain English):
// A live countdown drawn like old flip-clock / Rolodex tiles — four black
// squares for days, hours, minutes, and seconds. Used on the event page under
// "When" instead of a grey "in 2 days" pill.
//
// ACCESSIBILITY: screen readers get a calm label ("in 2 days"), not a number
// that changes every second. When Reduce Motion is on, the tiles still update
// but they do not animate the flip.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useCountdown, useReduceMotion } from '../lib/whimsy';
import { cn } from '../lib/cn';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** One black flip tile (value on top, unit letter under it). */
function FlipTile({
  value,
  unit,
  animate
}: {
  value: string;
  unit: string;
  animate: boolean;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (!animate) return;
    // THIS SECTION DOES: a short fade when the digit changes (skip if Reduce Motion).
    opacity.setValue(0.35);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true
    }).start();
  }, [value, animate, opacity]);

  // Half-box layout uses style (not only className) so web + native both center.
  const halfStyle = {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6
  };

  return (
    <View
      className="min-h-[52px] min-w-[44px] flex-1 overflow-hidden rounded-[6px] bg-[#1C1B16]"
      style={{ flexDirection: 'column' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* THIS SECTION DOES: top half holds the number, centered in its own box. */}
      <Animated.View style={[{ opacity }, halfStyle]}>
        <Text
          className="font-pixel text-white"
          style={{
            fontSize: 15,
            lineHeight: 15,
            textAlign: 'center',
            fontVariant: ['tabular-nums'],
            // Android adds extra top padding on Text; turn it off so digits sit mid-box.
            includeFontPadding: false
          }}
        >
          {value}
        </Text>
      </Animated.View>

      {/* Midline — the split-flap look */}
      <View pointerEvents="none" className="h-px w-full bg-white/15" />

      {/* THIS SECTION DOES: bottom half holds D/H/M/S, centered under the number. */}
      <View style={halfStyle}>
        <Text
          className="font-sans-b text-white/70"
          style={{
            fontSize: 9,
            lineHeight: 11,
            textAlign: 'center',
            letterSpacing: 0.6,
            includeFontPadding: false
          }}
        >
          {unit}
        </Text>
      </View>
    </View>
  );
}

/**
 * Live flip-clock countdown to startsAt. Falls back to a quiet label when we
 * only have a rough string, or when the event has already started.
 */
export function FlipCountdown({
  startsAt,
  label,
  className
}: {
  startsAt?: number | Date | null;
  /** Calm screen-reader / fallback text, e.g. "in 2 days" */
  label?: string;
  className?: string;
}) {
  const reduce = useReduceMotion();
  const countdown = useCountdown(startsAt ?? null);
  const live = startsAt != null && !countdown.done;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!live) {
    const text =
      label ?? (countdown.done && startsAt != null ? 'Happening now' : '');
    if (!text) return null;
    return (
      <View
        accessible
        accessibilityLabel={text}
        accessibilityRole="text"
        className={cn('self-start rounded-full bg-surface px-2.5 py-1', className)}
      >
        <Text className="font-sans-b text-[11px] text-ink">{text}</Text>
      </View>
    );
  }

  const a11y = label ?? countdown.label;

  return (
    <View
      accessible
      accessibilityLabel={a11y}
      accessibilityRole="text"
      className={cn('w-full max-w-[280px] flex-row gap-1.5', className)}
    >
      <FlipTile
        value={String(countdown.days)}
        unit="D"
        animate={mounted && !reduce}
      />
      <FlipTile
        value={pad2(countdown.hours)}
        unit="H"
        animate={mounted && !reduce}
      />
      <FlipTile
        value={pad2(countdown.minutes)}
        unit="M"
        animate={mounted && !reduce}
      />
      <FlipTile
        value={pad2(countdown.seconds)}
        unit="S"
        // Seconds tick every second — a fade every tick reads as a flash, so keep it still.
        animate={false}
      />
    </View>
  );
}
