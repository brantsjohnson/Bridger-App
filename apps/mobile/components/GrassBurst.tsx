// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny grass / leaf confetti that bursts when you tap "I'm in" on a touch-grass
// signal. Transform and opacity only. Skips entirely when the phone has
// Reduce Motion on (ACCESSIBILITY).
// ============================================
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';

const SPRIGS = [
  '🌱',
  '🌿',
  '🍀',
  '🌾',
  '🌱',
  '🌿',
  '🍀',
  '🌳',
  '🌻',
  '🌾',
  '🍀',
  '🌱',
  '🌿',
  '🌸',
  '🌱',
  '🍃',
  '🌿',
  '🌱'
];

export function GrassBurst({ play, onDone }: { play: boolean; onDone?: () => void }) {
  const anims = useRef(
    SPRIGS.map(() => ({
      progress: new Animated.Value(0)
    }))
  ).current;

  useEffect(() => {
    if (!play) return;

    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        onDone?.();
        return;
      }

      const runs = anims.map((a, i) =>
        Animated.timing(a.progress, {
          toValue: 1,
          duration: 1100,
          delay: (i % 4) * 40,
          useNativeDriver: true
        })
      );

      Animated.parallel(runs).start(({ finished }) => {
        if (finished) onDone?.();
      });
    });

    return () => {
      cancelled = true;
    };
  }, [play, onDone, anims]);

  if (!play) return null;

  return (
    <View
      accessible={false}
      pointerEvents="none"
      className="absolute inset-0 z-20 items-center justify-center overflow-visible"
    >
      {SPRIGS.map((sprig, i) => {
        const angle = (i / SPRIGS.length) * Math.PI * 2;
        const distance = 90 + (i % 4) * 30;
        const { progress } = anims[i];
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * distance]
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * distance]
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 1, 0]
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0.4, 1.15, 0.9]
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 40}deg`]
        });

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              opacity,
              transform: [{ translateX }, { translateY }, { scale }, { rotate }]
            }}
          >
            <Text className="text-[22px]">{sprig}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
