// ============================================
// WHAT THIS FILE DOES (plain English):
// Lead-in before the fun, low-pressure profile questions. One excited line:
// "Let's fill out some of your profile!" Words pop in one at a time with a
// little haptic buzz. After 4 seconds the screen advances on its own (or you
// can tap Let's go sooner). Everything after this step is skippable.
//
// LOOK: just the big blue pixel headline on the eggshell canvas. No chip, no
// list, no extra copy. Reduce Motion shows the full line at once, no buzz,
// and still auto-advances after 4 seconds.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';
import { fireWordRevealHaptic } from '../../lib/celebration-haptics';
import { OnboardingStep } from './OnboardingStep';
import { OB, OB_HEADING } from './onboarding-theme';

/** The only copy on this screen. Revealed one word at a time. */
const LINE = "Let's fill out some of your profile!";
const WORDS = LINE.split(' ');

/** How long each word waits before the next one pops in. */
const WORD_GAP_MS = 220;
/** How long the first word waits after the screen opens. */
const START_DELAY_MS = 180;
/** Auto-advance into the next step (word reveal finishes well before this). */
const AUTO_ADVANCE_MS = 4000;

export function TasteIntroStep({
  step,
  total,
  onNext,
  onBack
}: {
  step: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
}) {
  // Guard so the timer and a manual Let's go tap cannot double-advance.
  const advanced = useRef(false);
  const goNext = () => {
    if (advanced.current) return;
    advanced.current = true;
    onNext();
  };

  // THIS SECTION DOES: move on after 4 seconds even if nobody taps the button.
  useEffect(() => {
    const timer = setTimeout(goNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount
  }, []);

  return (
    <OnboardingStep
      step={step}
      total={total}
      cta="Let's go"
      continueAnalyticsId={ONBOARDING.taste.start}
      onContinue={goNext}
      onBack={onBack}
    >
      {/* THIS SECTION DOES: center the excited one-line ask in the leftover body. */}
      <View
        style={{
          flex: 1,
          minHeight: 0,
          justifyContent: 'center',
          paddingBottom: 24
        }}
      >
        <ExcitedLine />
      </View>
    </OnboardingStep>
  );
}

/** Words pop in one by one with a bounce and a haptic tap. */
function ExcitedLine() {
  const reduce = useReduceMotion();
  const [visibleCount, setVisibleCount] = useState(reduce ? WORDS.length : 0);

  // THIS SECTION DOES: reveal the next word on a timer (or show all if Reduce Motion).
  useEffect(() => {
    if (reduce) {
      setVisibleCount(WORDS.length);
      return;
    }
    setVisibleCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    WORDS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleCount(i + 1);
          fireWordRevealHaptic(i, WORDS.length);
        }, START_DELAY_MS + i * WORD_GAP_MS)
      );
    });
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [reduce]);

  return (
    // ACCESSIBILITY: screen readers get the full sentence immediately, not word by word.
    <AnalyticsRegion analyticsId={ONBOARDING.taste.preview_list} interactive={false}>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={LINE}
        style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}
      >
        {WORDS.map((word, i) => (
          <ExcitedWord
            key={`${word}-${i}`}
            word={word}
            show={i < visibleCount}
            reduceMotion={reduce}
            trailingSpace={i < WORDS.length - 1}
          />
        ))}
      </View>
    </AnalyticsRegion>
  );
}

/** One word that fades + bounces up when it is time to appear. */
function ExcitedWord({
  word,
  show,
  reduceMotion,
  trailingSpace
}: {
  word: string;
  show: boolean;
  reduceMotion: boolean;
  trailingSpace: boolean;
}) {
  const opacity = useRef(new Animated.Value(reduceMotion || show ? 1 : 0)).current;
  const y = useRef(new Animated.Value(reduceMotion || show ? 0 : 16)).current;
  const scale = useRef(new Animated.Value(reduceMotion || show ? 1 : 0.82)).current;
  const shown = useRef(reduceMotion || show);

  useEffect(() => {
    if (!show || shown.current) return;
    shown.current = true;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: NATIVE_DRIVER
      }),
      Animated.spring(y, {
        toValue: 0,
        friction: 6,
        tension: 140,
        useNativeDriver: NATIVE_DRIVER
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 160,
        useNativeDriver: NATIVE_DRIVER
      })
    ]).start();
  }, [show, opacity, y, scale]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY: y }, { scale }]
      }}
    >
      <Text
        className="font-pixel"
        style={[
          OB_HEADING,
          {
            // Slightly smaller than a full-screen ask so the long line wraps cleanly.
            fontSize: 42,
            lineHeight: 44,
            color: OB.blue
          }
        ]}
        accessible={false}
      >
        {word}
        {trailingSpace ? ' ' : ''}
      </Text>
    </Animated.View>
  );
}
