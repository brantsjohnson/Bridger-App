// ============================================
// WHAT THIS FILE DOES (plain English):
// The slide that plays when you move between onboarding screens. Forward
// slides in from the right; back slides in from the left. Both fade in. When
// the phone asks for reduced motion, we skip the animation and just show the
// next screen.
//
// The wrapper fills the real display (100% width). The web root is also told
// to fill the window, so this no longer collapses into a thin left strip.
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
  /**
   * Solid color painted BEHIND the step while it fades in. Without this, the
   * navigator's default (white) background shows through and dark screens get
   * a bright flash on every step change. Defaults to the app canvas color
   * (eggshell in light mode, dark in dark mode) via the bg-canvas class.
   */
  backdrop?: string;
  children: React.ReactNode;
};

export function StepTransition({ stepKey, direction, backdrop, children }: Props) {
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

  // Fill the real display. A leftover pixel width was locking the whole app
  // to a phone-sized box, with a white gutter (or clipped edges) on web.
  const shell = {
    flex: 1,
    width: '100%' as const,
    alignSelf: 'stretch' as const
  };

  // THIS SECTION DOES: paint a solid canvas behind the animated step, so the
  // fade never reveals the navigator's white background (the "bright flash").
  if (reduce) {
    return (
      <View
        className={backdrop ? undefined : 'bg-canvas'}
        style={[shell, backdrop ? { backgroundColor: backdrop } : null]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      className={backdrop ? undefined : 'bg-canvas'}
      style={[shell, backdrop ? { backgroundColor: backdrop } : null]}
    >
      <Animated.View style={[shell, { opacity, transform: [{ translateX }] }]}>
        {children}
      </Animated.View>
    </View>
  );
}
