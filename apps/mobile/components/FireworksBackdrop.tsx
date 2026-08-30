// ============================================
// WHAT THIS FILE DOES (plain English):
// A decorative fireworks layer (colored sparks that bloom and fall). Same look
// as the Home "You did it!" welcome party. Drop it behind content; it never
// steals taps. Used on the reveal close screen and the welcome celebration.
//
// ACCESSIBILITY: sparks are decorative and hidden from screen readers. When
// Reduce Motion is on, nothing flies and the phone stays quiet.
// ============================================
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';
import { NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';
import { fireFireworksHaptics } from '../lib/celebration-haptics';

// THIS SECTION DOES: the bright spark colors each firework shell can burst into.
const SPARK_COLORS = [
  '#FF3E8A', // pink
  '#1D6FE8', // blue
  '#FFC93C', // gold
  '#22C55E', // green
  '#A78BFA', // purple
  '#FF7A1A', // orange
  '#38E1D6', // teal
  '#FFFFFF' // white
];

const DEFAULT_SHELLS = 7;
const SPARKS_PER_SHELL = 22;
const BURST_MS = 1300;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

type Spark = {
  ox: number;
  oy: number;
  gravity: number;
  size: number;
};

type Shell = {
  cx: number;
  cy: number;
  color: string;
  delay: number;
  sparks: Spark[];
};

export function FireworksBackdrop({
  width,
  height,
  playHaptics = false,
  shellCount = DEFAULT_SHELLS,
  /** Keep launching new waves while this is mounted (reveal close stays exciting). */
  loop = false,
  style
}: {
  width: number;
  height: number;
  playHaptics?: boolean;
  shellCount?: number;
  loop?: boolean;
  style?: ViewStyle;
}) {
  const reduceMotion = useReduceMotion();
  const shellProgress = useRef(
    Array.from({ length: shellCount }, () => new Animated.Value(0))
  ).current;

  // THIS SECTION DOES: lay out where each firework bursts and how its sparks fly.
  const shells: Shell[] = useMemo(() => {
    if (width <= 0 || height <= 0) return [];
    return Array.from({ length: shellCount }, (_, i) => {
      const spread = rand(70, 140);
      const sparks: Spark[] = Array.from({ length: SPARKS_PER_SHELL }, (_, s) => {
        const angle = (s / SPARKS_PER_SHELL) * Math.PI * 2 + rand(-0.12, 0.12);
        const dist = spread * rand(0.7, 1.1);
        return {
          ox: Math.cos(angle) * dist,
          oy: Math.sin(angle) * dist,
          gravity: rand(36, 84),
          size: rand(3.5, 7.5)
        };
      });
      return {
        cx: rand(width * 0.12, width * 0.88),
        cy: rand(height * 0.12, height * 0.72),
        color: SPARK_COLORS[i % SPARK_COLORS.length]!,
        delay: Math.round((i / shellCount) * 2800 + rand(0, 160)),
        sparks
      };
    });
  }, [width, height, shellCount]);

  // THIS SECTION DOES: run the show (and optionally loop). Quiet when Reduce Motion.
  useEffect(() => {
    if (reduceMotion || shells.length === 0) return;

    if (playHaptics) fireFireworksHaptics();

    let cancelled = false;
    let loopTimer: ReturnType<typeof setTimeout> | null = null;

    const runWave = () => {
      if (cancelled) return;
      for (const p of shellProgress) p.setValue(0);
      const runs = shellProgress.map((p, i) =>
        Animated.timing(p, {
          toValue: 1,
          duration: BURST_MS,
          delay: shells[i]?.delay ?? 0,
          easing: Easing.out(Easing.quad),
          useNativeDriver: NATIVE_DRIVER
        })
      );
      Animated.parallel(runs).start(({ finished }) => {
        if (!finished || cancelled || !loop) return;
        // Short pause, then another wave so the close screen stays celebratory.
        // Haptics only on the first boom so the phone does not keep buzzing.
        loopTimer = setTimeout(() => {
          runWave();
        }, 900);
      });
    };

    runWave();
    return () => {
      cancelled = true;
      if (loopTimer) clearTimeout(loopTimer);
    };
    // Rebuild when layout or shell plan changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, shells, loop, playHaptics]);

  if (reduceMotion || width <= 0 || height <= 0) return null;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          overflow: 'visible'
        },
        style
      ]}
    >
      {shells.map((shell, si) => (
        <ShellBurst key={si} shell={shell} progress={shellProgress[si]!} />
      ))}
    </View>
  );
}

// THIS SECTION DOES: draw one firework. Sparks fly out, then gravity tugs them down.
function ShellBurst({ shell, progress }: { shell: Shell; progress: Animated.Value }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: shell.cx, top: shell.cy }}
    >
      {shell.sparks.map((spark, i) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, spark.ox],
          extrapolate: 'clamp'
        });
        const translateY = progress.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0, spark.oy, spark.oy + spark.gravity],
          extrapolate: 'clamp'
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.08, 0.7, 1],
          outputRange: [0, 1, 1, 0],
          extrapolate: 'clamp'
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.1, 1],
          outputRange: [0.3, 1, 0.5],
          extrapolate: 'clamp'
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: spark.size,
              height: spark.size,
              borderRadius: spark.size / 2,
              backgroundColor: shell.color,
              opacity,
              transform: [{ translateX }, { translateY }, { scale }]
            }}
          />
        );
      })}
    </View>
  );
}
