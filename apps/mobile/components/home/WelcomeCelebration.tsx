// ============================================
// WHAT THIS FILE DOES (plain English):
// The "You did it!" party that plays ONE time, right after someone finishes
// onboarding and lands on Home. A see-through black sheet drops over Home,
// fireworks pop across it, the words "You did it!" and "Welcome to Bridger!!!"
// fade in, and the phone buzzes like fireworks going off. Tap anywhere (or the
// "Tap to continue" hint) to clear it and start using Home.
//
// (We do NOT use the web-only fireworks-js library here: it draws on an HTML
// canvas and only runs in a browser. This is the same effect rebuilt with React
// Native's own animation, so it works on iPhone, Android, and web alike.)
//
// ACCESSIBILITY: the fireworks are decorative and hidden from screen readers.
// When Reduce Motion is on, nothing flies and the phone stays still: the words
// simply appear with a gentle fade and "Tap to continue" still dismisses it.
// The overlay traps focus (accessibilityViewIsModal) so VoiceOver reads the
// message, not Home behind it.
// ============================================
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { WELCOME_CELEBRATION, dismissSurface, openSurface } from '@bridger/shared';
import { AnalyticsRegion, NATIVE_DRIVER, useReduceMotion, withAnalyticsPress } from '@bridger/ui';
import { fireFireworksHaptics } from '../../lib/celebration-haptics';

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

// How many fireworks go off, how many sparks each throws, and how long the
// whole show runs before it clears itself if untouched.
const SHELL_COUNT = 7;
const SPARKS_PER_SHELL = 22;
const BURST_MS = 1300;
const AUTO_DISMISS_MS = 6000;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// One firework: where it bursts on screen, its color, and when it goes off.
type Shell = {
  cx: number;
  cy: number;
  color: string;
  delay: number;
  sparks: Spark[];
};

// One spark inside a firework: which way it flies and how far.
type Spark = {
  ox: number;
  oy: number;
  gravity: number;
  size: number;
};

export function WelcomeCelebration({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
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
  // One progress dial per firework (0 = not gone off, 1 = fully bloomed + fallen).
  const shellProgress = useRef(
    Array.from({ length: SHELL_COUNT }, () => new Animated.Value(0))
  ).current;

  // THIS SECTION DOES: lay out where each firework bursts and how its sparks fly.
  // Built once so the pattern does not jump around on re-render.
  const shells: Shell[] = useMemo(() => {
    return Array.from({ length: SHELL_COUNT }, (_, i) => {
      const spread = rand(80, 150);
      const sparks: Spark[] = Array.from({ length: SPARKS_PER_SHELL }, (_, s) => {
        // Even ring of angles plus a little jitter so it is not a perfect wheel.
        const angle = (s / SPARKS_PER_SHELL) * Math.PI * 2 + rand(-0.12, 0.12);
        const dist = spread * rand(0.7, 1.1);
        return {
          ox: Math.cos(angle) * dist,
          oy: Math.sin(angle) * dist,
          gravity: rand(40, 90),
          size: rand(4, 8)
        };
      });
      return {
        cx: rand(width * 0.15, width * 0.85),
        cy: rand(height * 0.14, height * 0.5),
        color: SPARK_COLORS[i % SPARK_COLORS.length]!,
        delay: Math.round((i / SHELL_COUNT) * 3000 + rand(0, 180)),
        sparks
      };
    });
  }, [width, height]);

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

  // THIS SECTION DOES: run the show. Reduce Motion just fades the words in and
  // stays still + silent; otherwise fireworks pop, staggered, with haptics.
  useEffect(() => {
    if (reduceMotion) {
      Animated.timing(wordsIn, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER
      }).start();
      return;
    }

    fireFireworksHaptics();

    Animated.timing(wordsIn, {
      toValue: 1,
      duration: 520,
      delay: 140,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: NATIVE_DRIVER
    }).start();

    const runs = shellProgress.map((p, i) =>
      Animated.timing(p, {
        toValue: 1,
        duration: BURST_MS,
        delay: shells[i]!.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER
      })
    );
    Animated.parallel(runs).start();

    // Safety net: if they never tap, tidy the party away on its own.
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
      {!reduceMotion ? (
        <View pointerEvents="none" accessible={false} style={{ flex: 1 }}>
          {shells.map((shell, si) => (
            <ShellBurst key={si} shell={shell} progress={shellProgress[si]!} />
          ))}
        </View>
      ) : null}

      {/* TAP LAYER + WORDS: one big button so a tap anywhere continues to Home. */}
      <Pressable
        onPress={withAnalyticsPress(WELCOME_CELEBRATION.overlay.continue, finish)}
        accessibilityRole="button"
        accessibilityLabel="You did it! Welcome to Bridger. Tap to continue to Home."
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
              You did it!
            </Text>
            <Text
              className="font-display uppercase"
              style={{
                color: '#FFFFFF',
                fontSize: 46,
                lineHeight: 46,
                letterSpacing: 0.5,
                textAlign: 'center',
                marginTop: 8
              }}
            >
              Welcome to Bridger!!!
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

// THIS SECTION DOES: draw one firework. Every spark flies out from the burst
// point, then gravity tugs it down as it fades, all driven by one progress dial.
function ShellBurst({ shell, progress }: { shell: Shell; progress: Animated.Value }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: shell.cx, top: shell.cy }}
    >
      {shell.sparks.map((spark, i) => {
        // Fly outward to the ring by mid-burst, then keep drifting down (gravity).
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
        // Pop bright, then wink out before the fall finishes.
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
