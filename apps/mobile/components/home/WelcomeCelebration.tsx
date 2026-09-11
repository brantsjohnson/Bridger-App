// ============================================
// WHAT THIS FILE DOES (plain English):
// The congratulations splash that plays ONE time, right after someone finishes
// onboarding and lands on Home. A see-through black sheet drops over Home,
// fireworks pop across it, the words "You did it!" and "Welcome to Bridger!!!"
// fade in, and the phone buzzes like fireworks going off. Tap anywhere (or the
// "Tap to continue" hint) to clear it and start using Home.
//
// Sparks come from FireworksBackdrop (same layer the reveal close screen uses).
//
// ACCESSIBILITY: the fireworks are decorative and hidden from screen readers.
// When Reduce Motion is on, nothing flies and the phone stays still: the words
// simply appear with a gentle fade and "Tap to continue" still dismisses it.
// The overlay traps focus (accessibilityViewIsModal) so VoiceOver reads the
// message, not Home behind it.
// ============================================
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { WELCOME_CELEBRATION, dismissSurface, openSurface } from '@bridger/shared';
import {
  AnalyticsRegion,
  NATIVE_DRIVER,
  useReduceMotion,
  useResponsiveLayout,
  withAnalyticsPress
} from '@bridger/ui';
import { FireworksBackdrop } from '../FireworksBackdrop';

// How long the whole show runs before it clears itself if untouched.
const AUTO_DISMISS_MS = 6000;

export function WelcomeCelebration({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const { contentMaxWidth } = useResponsiveLayout();
  const openedAt = useRef(Date.now());
  // Guard so leaving the party records exactly one surface_dismissed, whether it
  // ends by tap, by the auto-timer, or by an unmount.
  const dismissedRef = useRef(false);

  // THIS SECTION DOES: leave the party once, recording how long it was up.
  const finish = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    dismissSurface('welcome_celebration', { dwell_ms: Date.now() - openedAt.current });
    onDone();
  }, [onDone]);

  // THIS SECTION DOES: the words fade + rise in over the fireworks.
  const wordsIn = useRef(new Animated.Value(0)).current;

  // THIS SECTION DOES: open the analytics surface once while the party is up.
  // If it somehow unmounts without a tap/auto-finish, still record it once.
  useEffect(() => {
    openSurface('welcome_celebration', 'home');
    return () => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        dismissSurface('welcome_celebration', { dwell_ms: Date.now() - openedAt.current });
      }
    };
  }, []);

  // THIS SECTION DOES: fade the words in; auto-dismiss after the party window.
  // Fireworks + haptics live in FireworksBackdrop (skipped when Reduce Motion).
  useEffect(() => {
    Animated.timing(wordsIn, {
      toValue: 1,
      duration: reduceMotion ? 420 : 520,
      delay: reduceMotion ? 0 : 140,
      easing: reduceMotion ? Easing.out(Easing.quad) : Easing.out(Easing.back(1.4)),
      useNativeDriver: NATIVE_DRIVER
    }).start();

    const timer = setTimeout(() => finish(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // Runs once per mounted celebration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      // The whole screen: a see-through black sheet over Home.
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.78)',
        zIndex: 60
      }}
      accessibilityViewIsModal
    >
      {/* THE FIREWORKS: decorative sparks, hidden from screen readers. */}
      <FireworksBackdrop
        width={width}
        height={height}
        playHaptics
        shellCount={7}
      />

      {/* TAP LAYER + WORDS: one big button so a tap anywhere continues to Home. */}
      <Pressable
        onPress={withAnalyticsPress(WELCOME_CELEBRATION.overlay.continue, finish)}
        accessibilityRole="button"
        accessibilityLabel="Congratulations on onboarding. Welcome to Bridger. Tap to continue to Home."
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28
        }}
      >
        <AnalyticsRegion analyticsId={WELCOME_CELEBRATION.overlay.body} interactive={false}>
          <Animated.View
            style={{
              alignItems: 'center',
              width: '100%',
              maxWidth: contentMaxWidth,
              opacity: wordsIn,
              transform: [
                {
                  translateY: wordsIn.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0]
                  })
                },
                {
                  scale: wordsIn.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                }
              ]
            }}
          >
            <Text
              className="font-display uppercase"
              style={{
                color: '#FFC93C',
                fontSize: 30,
                letterSpacing: 1,
                textAlign: 'center'
              }}
            >
              Congratulations
            </Text>
            <Text
              className="font-display uppercase"
              style={{
                color: '#FFC93C',
                fontSize: 30,
                letterSpacing: 1,
                textAlign: 'center',
                marginTop: 6
              }}
            >
              on onboarding
            </Text>
            <Text
              className="font-display uppercase"
              style={{
                color: '#FFFFFF',
                fontSize: 40,
                lineHeight: 42,
                letterSpacing: 0.5,
                textAlign: 'center',
                marginTop: 16
              }}
            >
              Welcome to Bridger
            </Text>
          </Animated.View>
        </AnalyticsRegion>

        {/* Quiet nudge so people know the party is a tap away from Home. */}
        <Animated.Text
          className="font-sans-sb uppercase"
          style={{
            position: 'absolute',
            bottom: 64,
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
            letterSpacing: 1.4,
            opacity: wordsIn
          }}
        >
          Tap to continue
        </Animated.Text>
      </Pressable>
    </View>
  );
}
