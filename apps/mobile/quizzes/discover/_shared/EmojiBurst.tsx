// ============================================
// WHAT THIS FILE DOES (plain English):
// When you pick an answer, a shower of that option's emoji launches from the
// WHOLE tile (not one point), arcs up and outward like a fountain, then falls
// with gravity and winks out one by one before reaching the bottom. Each burst
// is its own thing: tapping another option starts a new shower without cutting
// the old one short. Reduce Motion skips it.
// ============================================
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';

/** How many emoji fly per pick — enough to feel like a real shower. */
const COUNT = 26;
/** Whole toss + fall. Slow enough to read as gravity, not a glitch. */
const DURATION_MS = 2000;

/** The tile the emoji pour out of (window coordinates, top-left + size). */
export type BurstOrigin = { x: number; y: number; width: number; height: number };

type Props = {
  play: boolean;
  /** One glyph, or a few that cycle so the shower feels mixed. */
  emoji: string | string[];
  origin: BurstOrigin;
  onDone?: () => void;
};

type Piece = {
  startX: number;
  startY: number;
  peak: number;
  fall: number;
  drift: number;
  spin: number;
  delay: number;
  riseFrac: number;
  vanishAt: number;
  size: number;
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function EmojiBurst({ play, emoji, origin, onDone }: Props) {
  const reduce = useReduceMotion();
  const { height: screenH } = useWindowDimensions();
  const progress = useRef(
    Array.from({ length: COUNT }, () => new Animated.Value(0))
  ).current;

  // THIS SECTION DOES: give each emoji its own launch point + arc, once.
  const pieces: Piece[] = useMemo(() => {
    // How far it can fall before we want it gone (above the bottom edge).
    const room = Math.max(220, screenH - origin.y - 80);
    return Array.from({ length: COUNT }, (_, i) => {
      const fromLeftEdge = i % 2 === 0;
      return {
        // Spawn spread across the ENTIRE tile width.
        startX: rand(0, origin.width),
        startY: rand(0, origin.height),
        peak: rand(120, 260),
        // Fall stops above the bottom; it vanishes before then anyway.
        fall: rand(room * 0.55, room * 0.85),
        drift: (fromLeftEdge ? -1 : 1) * rand(20, 150),
        spin: (i % 2 ? 1 : -1) * rand(20, 90),
        delay: rand(0, 220),
        riseFrac: rand(0.26, 0.36),
        // Wink out at different heights on the way down — never all at once.
        vanishAt: rand(0.72, 0.94),
        size: rand(20, 34)
      };
    });
  }, [origin.width, origin.height, origin.y, screenH]);

  useEffect(() => {
    if (!play) return;
    if (reduce) {
      onDone?.();
      return;
    }
    const runs = progress.map((a, i) =>
      Animated.timing(a, {
        toValue: 1,
        duration: DURATION_MS,
        delay: pieces[i]!.delay,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER
      })
    );
    Animated.parallel(runs).start(({ finished }) => {
      if (finished) onDone?.();
    });
    // Run once per mounted burst; new picks mount a fresh EmojiBurst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!play || reduce) return null;

  // THIS SECTION DOES: pick which emoji each piece shows (one, or a rotating mix).
  const glyphs = Array.isArray(emoji) ? emoji : [emoji];

  return (
    <View
      accessible={false}
      pointerEvents="none"
      className="absolute inset-0 z-40"
      style={{ overflow: 'hidden' }}
    >
      {pieces.map((p, i) => {
        const t = progress[i]!;
        // Rise fast, crest, then accelerate down (ease-in reads as gravity).
        const translateY = t.interpolate({
          inputRange: [0, p.riseFrac, p.riseFrac + (1 - p.riseFrac) * 0.5, 1],
          outputRange: [0, -p.peak, -p.peak * 0.35, p.fall],
          extrapolate: 'clamp'
        });
        const translateX = t.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.drift],
          extrapolate: 'clamp'
        });
        const scale = t.interpolate({
          inputRange: [0, 0.14, 1],
          outputRange: [0.6, 1, 0.92],
          extrapolate: 'clamp'
        });
        const rotate = t.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spin}deg`]
        });
        // DISAPPEAR (not fade): hold full, then drop to 0 within a frame.
        const opacity = t.interpolate({
          inputRange: [0, 0.05, p.vanishAt, p.vanishAt + 0.001, 1],
          outputRange: [0, 1, 1, 0, 0],
          extrapolate: 'clamp'
        });

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: origin.x + p.startX - p.size / 2,
              top: origin.y + p.startY - p.size / 2,
              opacity,
              transform: [{ translateX }, { translateY }, { scale }, { rotate }]
            }}
          >
            <Text style={{ fontSize: p.size }}>{glyphs[i % glyphs.length]}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
