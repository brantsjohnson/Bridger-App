// ============================================
// WHAT THIS FILE DOES (plain English):
// The thin timed bars at the top of the story ("Updates") player — one segment
// per post. The active bar fills over durationMs; finished bars stay full;
// upcoming ones stay empty. Respects reduce-motion (jumps to a static fill).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { cn } from '../lib/cn';

type Props = {
  /** how many posts / segments */
  count: number;
  /** which segment is playing (0-based) */
  index: number;
  /** how long the active segment takes to fill, in ms */
  durationMs?: number;
  /** pause the fill (sheets open, menu open, etc.) */
  paused?: boolean;
  /** Fires once when the active bar finishes filling (not on pause / unmount). */
  onComplete?: () => void;
  className?: string;
};

export function SegmentedProgress({
  count,
  index,
  durationMs = 6000,
  paused = false,
  onComplete,
  className
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [reduceMotion, setReduceMotion] = useState(false);
  // Keeps the latest fill amount (0..1) so a pause can resume from where it
  // stopped instead of starting the bar over.
  const value = useRef(0);

  useEffect(() => {
    const sub = progress.addListener(({ value: v }) => {
      value.current = v;
    });
    return () => progress.removeListener(sub);
  }, [progress]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // A new post starts its bar over from empty.
  useEffect(() => {
    progress.setValue(0);
    value.current = 0;
  }, [index, progress]);

  // Run (or hold) the fill. When paused we freeze wherever the bar got to;
  // when it resumes we only animate the time that is actually left.
  useEffect(() => {
    // Reduce Motion: show the bar already full instead of animating it.
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    if (paused) {
      progress.stopAnimation();
      return;
    }

    // Past the last segment: every bar is already full, nothing to run.
    if (index >= count) {
      progress.setValue(1);
      return;
    }

    const remaining = durationMs * (1 - value.current);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(0, remaining),
      useNativeDriver: false
    });
    anim.start(({ finished }) => {
      if (finished) onCompleteRef.current?.();
    });
    return () => anim.stop();
  }, [index, count, paused, durationMs, progress, reduceMotion]);

  return (
    <View
      accessible={false}
      className={cn('flex-row gap-1.5', className)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="h-1 flex-1 overflow-hidden rounded-full bg-white/40"
        >
          {/*
            Both the fill colour and the width come from `style`, not className:
            NativeWind does not reliably style an Animated.View, and animating a
            percentage width avoids having to measure the segment first (which
            was why the bar sat empty and never filled).
          */}
          {i < index ? (
            <View style={{ height: '100%', width: '100%', backgroundColor: '#FFFFFF' }} />
          ) : i === index ? (
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: '#FFFFFF',
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}
