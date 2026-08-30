// ============================================
// WHAT THIS FILE DOES (plain English):
// The spinning pixel newspaper for the News tab "coming soon" screen.
// It draws a tiny stack of papers (front page says NEWS) out of colored
// squares, then spins that stack in 3D like a press rolling through.
// Reduce Motion skips the spin and the pixel fade-in so the paper just sits.
// ============================================
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';

// THIS SECTION DOES: size of one "pixel" square, and how big the whole paper is.
const SCALE = 10;
const GRID_W = 34;
const GRID_H = 26;

/** Outer box the News screen reserves so "Local updates!" stays put under the paper. */
export const NEWS_PAPER_SIZE = {
  width: GRID_W * SCALE,
  height: GRID_H * SCALE
} as const;

// Dark-edition colors from the Magic Patterns design.
const PAPER = '#f4f1e8';
const INK = '#141414';
const MID = '#8f8a7d';
const SHADE = '#c9c4b6';

type Pixel = { x: number; y: number; c: string };

// Pixel font for the masthead letters N E W S (each row is 5 bits).
const FONT: Record<string, string[]> = {
  N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  S: ['01110', '10001', '10000', '01110', '00001', '10001', '01110']
};

// THIS SECTION DOES: paint every square that makes the newspaper stack.
function buildPixels(): Pixel[] {
  const px: Pixel[] = [];
  const set = (x: number, y: number, c: string) => {
    px.push({ x, y, c });
  };

  // Back sheets (offset so the stack reads as 3D).
  for (let y = 1; y < GRID_H - 4; y++) {
    for (let x = 5; x < GRID_W - 1; x++) {
      set(x, y, y === 1 ? MID : y === 2 ? PAPER : SHADE);
    }
  }
  for (let y = 2; y < GRID_H - 3; y++) {
    for (let x = 3; x < GRID_W - 3; x++) {
      set(x, y, y === 2 ? MID : y === 3 ? PAPER : SHADE);
    }
  }

  // Front page fill.
  for (let y = 3; y < GRID_H - 2; y++) {
    for (let x = 1; x < GRID_W - 5; x++) {
      set(x, y, PAPER);
    }
  }

  // Front page edge lines.
  for (let x = 1; x < GRID_W - 5; x++) {
    set(x, 3, MID);
    set(x, GRID_H - 2, MID);
  }
  for (let y = 3; y < GRID_H - 1; y++) {
    set(GRID_W - 6, y, MID);
  }

  // Masthead rule + NEWS letters.
  for (let x = 3; x < GRID_W - 8; x++) {
    set(x, 5, INK);
  }
  'NEWS'.split('').forEach((ch, n) => {
    FONT[ch].forEach((row, ry) => {
      row.split('').forEach((v, rx) => {
        if (v === '1') set(4 + n * 6 + rx, 7 + ry, INK);
      });
    });
  });

  // Body: rule, dotted line, checker photo, text bars.
  for (let x = 3; x < GRID_W - 8; x++) {
    set(x, 15, INK);
  }
  for (let x = 3; x < GRID_W - 9; x += 2) {
    set(x, 17, MID);
  }
  for (let y = 19; y < 24; y++) {
    for (let x = 3; x < 13; x++) {
      set(x, y, (x + y) % 2 ? INK : MID);
    }
  }
  [19, 21, 23].forEach((y, i) => {
    for (let x = 15; x < 25 - i * 2; x++) {
      set(x, y, INK);
    }
  });
  [20, 22].forEach((y) => {
    for (let x = 15; x < 27; x++) {
      set(x, y, MID);
    }
  });

  return px;
}

/** Last write wins so overlapping stack layers keep the frontmost color. */
function dedupePixels(raw: Pixel[]): Pixel[] {
  const map = new Map<string, Pixel>();
  for (const p of raw) {
    map.set(`${p.x},${p.y}`, p);
  }
  return Array.from(map.values());
}

const ALL_PIXELS = dedupePixels(buildPixels());

export function NewsPaperGraphic() {
  const reduceMotion = useReduceMotion();
  const spin = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  // THIS SECTION DOES: fade the pixels in by row (top to bottom), then stop.
  useEffect(() => {
    if (reduceMotion) {
      enter.setValue(1);
      return;
    }
    enter.setValue(0);
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 1600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE_DRIVER
    });
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, enter]);

  // THIS SECTION DOES: the press-cycle spin (fly in, hold, fly out, loop).
  useEffect(() => {
    if (reduceMotion) {
      // Hold pose: slight tilt, full size (mid keyframe of the cycle).
      spin.setValue(0.5);
      return;
    }
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 9000,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER
      })
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, spin]);

  // Keyframes: spin in from nothing, hold, spin out until fully gone, then loop.
  const rotateY = spin.interpolate({
    inputRange: [0, 0.18, 0.22, 0.8, 1],
    outputRange: ['540deg', '0deg', '0deg', '0deg', '-540deg']
  });
  const rotateZ = spin.interpolate({
    inputRange: [0, 0.18, 0.22, 0.8, 1],
    outputRange: ['-18deg', '-3deg', '-3deg', '-3deg', '14deg']
  });
  const scale = spin.interpolate({
    inputRange: [0, 0.18, 0.22, 0.8, 1],
    outputRange: [0, 1, 1.04, 1, 0]
  });
  // Fade with the shrink so the paper is fully gone before it returns.
  const cycleOpacity = spin.interpolate({
    inputRange: [0, 0.12, 0.18, 0.8, 0.92, 1],
    outputRange: [0, 0.4, 1, 1, 0.35, 0]
  });

  // One opacity curve per grid row so pixels appear in a soft top-to-bottom wash.
  const rowOpacity = useMemo(() => {
    const out: Animated.AnimatedInterpolation<number>[] = [];
    for (let y = 0; y < GRID_H; y++) {
      const start = (y * 60) / 1600;
      const end = Math.min(1, start + 0.5 / 1.6);
      out.push(
        enter.interpolate({
          inputRange: [0, start, end, 1],
          outputRange: [0, 0, 1, 1]
        })
      );
    }
    return out;
  }, [enter]);

  const width = GRID_W * SCALE;
  const height = GRID_H * SCALE;

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height }}
    >
      <Animated.View
        style={{
          width,
          height,
          opacity: cycleOpacity,
          transform: [
            { perspective: 1100 },
            { rotateY },
            { rotateZ },
            { scale }
          ]
        }}
      >
        <View style={{ position: 'relative', width, height }}>
          {ALL_PIXELS.map((p) => (
            <Animated.View
              key={`${p.x}-${p.y}`}
              style={{
                position: 'absolute',
                left: p.x * SCALE,
                top: p.y * SCALE,
                width: SCALE,
                height: SCALE,
                backgroundColor: p.c,
                opacity: rowOpacity[p.y]
              }}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
