// ============================================
// WHAT THIS FILE DOES (plain English):
// When you tap a hobby chip, eight copies of that hobby's emoji shoot up from
// the tap, then fall with gravity and fade out. Same toss as the web picker:
// mostly upward, a little to the side, then they drop. Reduce Motion skips it.
// ============================================
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { NATIVE_DRIVER, useReduceMotion } from '../lib/whimsy';

/** Whole toss + fade. Long enough to read as gravity, not a blink.
 *  (~20% snappier than the old 2400ms so the shower feels a little quicker.) */
const DURATION_MS = 1920;
/** Frames we bake so the path matches the web physics (about 60fps). */
const SIM_FRAMES = 150;

export type HobbyBurstOrigin = { x: number; y: number };

type Props = {
  play: boolean;
  /** One glyph, or a few that cycle so the shower feels mixed. */
  emoji: string | string[];
  origin: HobbyBurstOrigin;
  /** How many fly. Chips stay small (8). Big quiz tiles can ask for more. */
  count?: number;
  /** chip = little upward toss. boom = a wider, louder explode. */
  power?: 'chip' | 'boom';
  onDone?: () => void;
};

type Piece = {
  xs: number[];
  ys: number[];
  size: number;
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Walk gravity math. Chip matches the web picker. Boom sprays wider and faster. */
function simulatePiece(power: 'chip' | 'boom'): Piece {
  const boom = power === 'boom';
  const angle = boom
    ? (-160 + Math.random() * 140) * (Math.PI / 180)
    : (-110 + Math.random() * 40) * (Math.PI / 180);
  const speed = boom ? 6 + Math.random() * 5 : 4 + Math.random() * 2;
  const vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed - (boom ? 3.4 : 2.75);
  const gravity = boom ? 0.26 : 0.22;
  let px = 0;
  let py = 0;
  const xs: number[] = [0];
  const ys: number[] = [0];
  for (let f = 1; f <= SIM_FRAMES; f++) {
    px += vx;
    py += vy;
    vy += gravity;
    xs.push(px);
    ys.push(py);
  }
  return { xs, ys, size: boom ? rand(24, 36) : rand(18, 24) };
}

export function HobbyEmojiBurst({
  play,
  emoji,
  origin,
  count = 8,
  power = 'chip',
  onDone
}: Props) {
  const reduce = useReduceMotion();
  const n = Math.max(1, count);
  const progress = useRef(
    Array.from({ length: n }, () => new Animated.Value(0))
  ).current;

  // THIS SECTION DOES: give each emoji its own toss path, once, so they fan out.
  const pieces: Piece[] = useMemo(
    () => Array.from({ length: n }, () => simulatePiece(power)),
    [n, power]
  );

  useEffect(() => {
    if (!play) return;
    if (reduce) {
      onDone?.();
      return;
    }
    const runs = progress.map((a) =>
      Animated.timing(a, {
        toValue: 1,
        duration: DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER
      })
    );
    Animated.parallel(runs).start(({ finished }) => {
      if (finished) onDone?.();
    });
    // One burst per mount. A new tap mounts a fresh shower.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!play || reduce) return null;

  const glyphs = Array.isArray(emoji) ? emoji : [emoji];

  return (
    <View
      accessible={false}
      pointerEvents="none"
      className="absolute inset-0 z-50"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 50 }}
    >
      {pieces.map((p, i) => {
        const t = progress[i]!;
        const steps = p.xs.length;
        const inputRange = p.xs.map((_, idx) => idx / (steps - 1));
        const translateX = t.interpolate({
          inputRange,
          outputRange: p.xs
        });
        const translateY = t.interpolate({
          inputRange,
          outputRange: p.ys
        });
        // Hold full, then fade after the toss (same as the web frame > 120 fade).
        const opacity = t.interpolate({
          inputRange: [0, 0.04, 0.72, 1],
          outputRange: [0, 1, 1, 0]
        });

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: origin.x - p.size / 2,
              top: origin.y - p.size / 2,
              opacity,
              transform: [{ translateX }, { translateY }]
            }}
          >
            <Text style={{ fontSize: p.size }}>{glyphs[i % glyphs.length]}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
