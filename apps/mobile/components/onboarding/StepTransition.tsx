// ============================================
// WHAT THIS FILE DOES (plain English):
// The slide that plays when you move between onboarding screens. Forward
// slides in from the right; back slides in from the left. Both fade in. When
// the phone asks for reduced motion, we skip the animation and just show the
// next screen.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';

const DURATION_MS = 380;
const SLIDE_PX = 56;

type Props = {
  /** Changes every time we move to a new screen, so the animation restarts. */
  stepKey: string;
  /** 1 = forward (from the right), -1 = back (from the left). */
  direction: 1 | -1;
  children: React.ReactNode;
};

export function StepTransition({ stepKey, direction, children }: Props) {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  // THIS SECTION DOES: replay the slide whenever the step or direction changes.
  useEffect(() => {
    if (reduce) {
      opacity.setValue(1);
      translateX.setValue(0);
      return;
    }
    opacity.setValue(0);
    translateX.setValue(direction > 0 ? SLIDE_PX : -SLIDE_PX);
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: DURATION_MS,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: DURATION_MS,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER
      })
    ]);
    anim.start();
    return () => anim.stop();
  }, [stepKey, direction, reduce, opacity, translateX]);

  if (reduce) {
    return <View className="flex-1">{children}</View>;
  }

  return (
    <Animated.View
      className="flex-1"
      style={{ opacity, transform: [{ translateX }] }}
    >
      {children}
    </Animated.View>
  );
}
