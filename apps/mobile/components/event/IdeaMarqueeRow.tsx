// ============================================
// WHAT THIS FILE DOES (plain English):
// One horizontal row of idea chips that slowly scrolls by, like a marketing
// tweet wall. Used three times on the Events gate (rows go opposite ways).
// Two copies sit side by side; we measure the first copy (plus the gap) so the
// loop restarts on an identical frame (no hard jump). Motion runs on the UI
// thread (Reanimated) so it stays smooth even with busy cover art. When
// Reduce Motion is on, the row freezes so the ideas stay readable.
// ============================================
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { useReduceMotion } from '@bridger/ui';
import type { EventIdea } from '../../data/fixtures/event-ideas';
import { EventIdeaChip } from './EventIdeaChip';

const GAP = 10;

type Props = {
  items: EventIdea[];
  /** +1 scrolls left (content moves left); -1 scrolls the other way */
  direction: 1 | -1;
  /** seconds for one full loop of one copy */
  durationSec?: number;
};

export function IdeaMarqueeRow({
  items,
  direction,
  durationSec = 36
}: Props) {
  const reduce = useReduceMotion();
  /**
   * Progress always runs 0 → 1 on the UI thread. Direction only changes how
   * we map that onto pixels, so reverse rows never stall.
   */
  const progress = useSharedValue(0);
  /** Pixel step of one seamless loop (first copy width + gap before the duplicate). */
  const unit = useSharedValue(0);
  /** React mirror of unit so the effect knows when measurement is ready. */
  const [unitPx, setUnitPx] = useState(0);

  // THIS SECTION DOES: start a smooth 0→1 loop once we know the strip width.
  useEffect(() => {
    if (reduce || unitPx <= 0 || items.length === 0) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }

    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: durationSec * 1000,
        easing: Easing.linear
      }),
      -1,
      false
    );
    return () => {
      cancelAnimation(progress);
    };
  }, [reduce, unitPx, durationSec, progress, items.length]);

  // THIS SECTION DOES: turn 0→1 into leftward or rightward pixels.
  const trackStyle = useAnimatedStyle(() => {
    const step = unit.value;
    const x =
      direction === 1 ? -progress.value * step : -step + progress.value * step;
    return {
      transform: [{ translateX: x }]
    };
  }, [direction]);

  if (items.length === 0) return null;

  // THIS SECTION DOES: paint one strip of chips.
  function chips(prefix: string) {
    return items.map((idea, i) => (
      <EventIdeaChip key={`${prefix}-${idea.id}-${i}`} idea={idea} />
    ));
  }

  return (
    <View style={{ overflow: 'hidden' }} accessibilityElementsHidden>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'flex-start'
          },
          trackStyle
        ]}
      >
        {/* First copy + trailing gap — measuring this gives the seamless step */}
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start' }}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w <= 0) return;
            // Ignore tiny layout noise so we do not restart the loop mid-scroll.
            if (Math.abs(w - unitPx) < 0.5) return;
            unit.value = w;
            setUnitPx(w);
          }}
        >
          <View style={{ flexDirection: 'row', gap: GAP }}>{chips('a')}</View>
          <View style={{ width: GAP }} />
        </View>
        {/* Duplicate copy — identical to the first so the loop never jumps */}
        <View style={{ flexDirection: 'row', gap: GAP }}>{chips('b')}</View>
      </Animated.View>
    </View>
  );
}
