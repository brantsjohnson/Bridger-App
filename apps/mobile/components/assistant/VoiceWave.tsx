// ============================================
// WHAT THIS FILE DOES (plain English):
// Proof the mic is open. Bars stay the same size footprint whether Billy hears
// you or not, so quiet ↔ hearing does not jump the layout. Quiet = short soft
// bars; hearing = taller bars that bounce. Under Reduce Motion they hold still.
// ============================================
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, View } from 'react-native';
import { cn, useReduceMotion, useThemeColors } from '@bridger/ui';

/** Uneven on purpose: an even wave reads as a loading bar, not a voice. */
const HEIGHTS = [0.42, 0.78, 1, 0.62, 0.9, 0.5];

type Props = {
  /** Mic is open. */
  active?: boolean;
  /** True only when metering says there is actual voice (not just silence). */
  hearing?: boolean;
  bars?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Override bar/dot color. */
  color?: string;
};

export function VoiceWave({
  active = true,
  hearing = false,
  bars = 6,
  size = 'md',
  className,
  color
}: Props) {
  const reduce = useReduceMotion();
  const c = useThemeColors();
  const max = size === 'lg' ? 22 : size === 'sm' ? 12 : 16;
  // Quiet floor stays close to the loud peak so the pill width/height barely moves.
  const quiet = size === 'lg' ? 5 : size === 'sm' ? 3.5 : 4;
  const min = size === 'lg' ? 5 : size === 'sm' ? 3.5 : 4;
  const width = size === 'lg' ? 3.5 : size === 'sm' ? 2.5 : 3;
  const barColor = color ?? c.ink;

  const anims = useMemo(
    () => Array.from({ length: bars }, () => new Animated.Value(quiet)),
    [bars, quiet]
  );

  const animsRef = useRef(anims);
  animsRef.current = anims;

  // THIS SECTION DOES: ease into quiet bars or bounce while voice is coming in
  useEffect(() => {
    const list = animsRef.current;
    list.forEach((v) => v.stopAnimation());

    if (!active) {
      list.forEach((v) => {
        Animated.timing(v, {
          toValue: quiet,
          duration: 180,
          useNativeDriver: false
        }).start();
      });
      return;
    }

    if (reduce || !hearing) {
      // Soft settle to short bars (no hard swap to dots).
      list.forEach((v, i) => {
        Animated.timing(v, {
          toValue: quiet * (0.85 + (i % 3) * 0.05),
          duration: 220,
          useNativeDriver: false
        }).start();
      });
      return;
    }

    const loops = list.map((v, i) => {
      const peak = min + (max - min) * HEIGHTS[i % HEIGHTS.length];
      return Animated.loop(
        Animated.sequence([
          Animated.delay(i * 50),
          Animated.timing(v, {
            toValue: peak,
            duration: 200 + (i % 3) * 50,
            useNativeDriver: false
          }),
          Animated.timing(v, {
            toValue: min,
            duration: 200 + (i % 3) * 50,
            useNativeDriver: false
          })
        ])
      );
    });
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, hearing, reduce, max, min, quiet, bars]);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      className={cn('flex-row items-center', className)}
      style={{ height: max, gap: 3, width: bars * width + (bars - 1) * 3 }}
    >
      {anims.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width,
            height: v,
            borderRadius: 999,
            backgroundColor: barColor,
            opacity: hearing && active ? 1 : 0.7
          }}
        />
      ))}
    </View>
  );
}
