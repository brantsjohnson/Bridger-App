// ============================================
// WHAT THIS FILE DOES (plain English):
// The little progress bar used by step-by-step flows (onboarding now; quizzes
// and profile modules later). A track with an accent fill that grows as you
// move forward, plus a small "3/9" pixel label so people know how far in they
// are. The fill matches the step's accent so the whole run reads as a sequence.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import type { Accent } from '@bridger/shared';
import { ACCENTS } from '../tokens';
import { cn } from '../lib/cn';

type Props = {
  /** 1-based current step */
  step: number;
  total: number;
  /** matches the step's color so the bar reads as part of the room */
  accent?: Accent;
  className?: string;
};

export function StepProgress({ step, total, accent = 'purple', className }: Props) {
  const token = ACCENTS[accent];
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  const width = useRef(new Animated.Value(pct)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      width.setValue(pct);
      return;
    }
    const anim = Animated.timing(width, {
      toValue: pct,
      duration: 300,
      useNativeDriver: false
    });
    anim.start();
    return () => anim.stop();
  }, [pct, reduceMotion, width]);

  return (
    <View
      className={cn('flex-row items-center gap-3', className)}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: step }}
    >
      <View className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
        <Animated.View
          className={cn('h-full rounded-full', token.bg)}
          style={{
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            })
          }}
        />
      </View>
      {/* pixel "3/9" label kept tiny so it never competes with the question */}
      <Text className="font-pixel text-[12px] text-ink-soft" accessible={false}>
        {step}/{total}
      </Text>
    </View>
  );
}
