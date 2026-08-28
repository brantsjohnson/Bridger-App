// ============================================
// WHAT THIS FILE DOES (plain English):
// The last reality-check picture: an 80-year life that colors in one beat at
// a time. First you see the whole life. Then sleep. Then the everyday stuff
// (work, chores, commute, exercise). Then devices take a huge pink bite.
// Then the tiny leftover for seeing people in person. The pink "Let's try
// again" button waits until that last beat is done.
//
// ACCESSIBILITY: the hash-line picture is decorative. The changing sentence
// is real text (so VoiceOver reads each new number). Reduce Motion skips the
// wait and shows the finished life plus the button right away. Tap the story
// to jump to the next beat if you do not want to wait.
// ============================================
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { ONBOARDING, trackFlowStep } from "@bridger/shared";
import {
  AnalyticsRegion,
  NATIVE_DRIVER,
  withAnalyticsPress,
} from "@bridger/ui";
import { OB } from "./onboarding-theme";

const HOLD_MS = 3000;

const SLICES = [
  {
    key: "sleep",
    noun: "sleeping.",
    years: "26.6",
    ticks: 27,
    color: OB.amber,
  },
  {
    key: "work",
    noun: "on work & school.",
    years: "11.6",
    ticks: 11,
    color: OB.orange,
  },
  {
    key: "maintenance",
    noun: "on daily life.",
    years: "10.6",
    ticks: 10,
    color: OB.canvas,
  },
  {
    key: "commute",
    noun: "commuting.",
    years: "2.5",
    ticks: 3,
    color: OB.onColor,
  },
  {
    key: "exercise",
    noun: "on exercise.",
    years: "1.7",
    ticks: 2,
    color: OB.green,
  },
  {
    key: "devices",
    noun: "on devices.",
    years: "23.3",
    ticks: 23,
    color: OB.pink,
  },
  {
    key: "social",
    noun: "in person.",
    years: "4.0",
    ticks: 4,
    color: OB.periwinkle,
  },
] as const;

const FAINT = "rgba(255,255,255,0.28)";
const LAST_BEAT = 7;

export function ScreenTimeVisual({
  reduceMotion,
  onComplete,
}: {
  reduceMotion: boolean;
  /** Fires once the last beat lands, so the parent can show the button. */
  onComplete: () => void;
}) {
  const [beat, setBeat] = useState(reduceMotion ? LAST_BEAT : 0);
  const [linesBeat, setLinesBeat] = useState(reduceMotion ? LAST_BEAT : 0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // THIS SECTION DOES: walk the beats on a timer, or jump straight to the end.
  useEffect(() => {
    if (reduceMotion) {
      setBeat(LAST_BEAT);
      setLinesBeat(LAST_BEAT);
      return;
    }
    if (beat >= LAST_BEAT) return;

    // Total time per beat:
    // text fade out (300ms) + text fade in (300ms) + color lines (0ms) + hold (2400ms) = 3000ms
    const timer = setTimeout(() => {
      setBeat((b) => b + 1);
    }, HOLD_MS);
    return () => clearTimeout(timer);
  }, [beat, reduceMotion]);

  // THIS SECTION DOES: tell analytics which beat we reached, and tell the
  // parent when the button is allowed to appear.
  useEffect(() => {
    trackFlowStep("onboarding", "stat-screentime", { page_index: beat });
    if (beat >= LAST_BEAT && !doneRef.current) {
      doneRef.current = true;
      onCompleteRef.current();
    }
  }, [beat]);

  const canAdvance = !reduceMotion && beat < LAST_BEAT;

  const goNext = () => {
    if (!canAdvance) return;
    setBeat((b) => Math.min(LAST_BEAT, b + 1));
  };

  return (
    <View style={{ flex: 1, minHeight: 0, width: "100%", gap: 24 }}>
      {/* THE LIFE BAR: 80 year-lines. Tap skips ahead. The art stays decorative. */}
      <Pressable
        disabled={!canAdvance}
        onPress={
          canAdvance
            ? withAnalyticsPress(ONBOARDING.stat.advance, goNext, {
                analyticsProps: { variant: "screentime", page_index: beat },
              })
            : undefined
        }
        accessibilityRole={canAdvance ? "button" : "none"}
        accessibilityLabel={
          canAdvance ? "Show the next part of the story" : undefined
        }
        style={{ flex: 1, minHeight: 0, width: "100%" }}
      >
        <AnalyticsRegion
          analyticsId={ONBOARDING.stat.visual}
          interactive={false}
        >
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={{ flex: 1, minHeight: 0, width: "100%" }}
          >
            <LifeBar filled={linesBeat} />
          </View>
        </AnalyticsRegion>
      </Pressable>

      {/* THE SENTENCE: updates as each beat lands. VoiceOver reads the new one. */}
      <AnalyticsRegion
        analyticsId={ONBOARDING.stat.caption}
        interactive={false}
      >
        <FadeText
          beat={beat}
          onTextVisible={setLinesBeat}
          reduceMotion={reduceMotion}
        />
      </AnalyticsRegion>
    </View>
  );
}

function LifeBar({ filled }: { filled: number }) {
  return (
    <View style={{ flex: 1, minHeight: 0, flexDirection: "row" }}>
      <View style={{ flex: 1, minHeight: 0, justifyContent: "space-between" }}>
        {SLICES.map((slice, i) => {
          const on = i < filled;
          return (
            <View
              key={slice.key}
              style={{
                flex: slice.ticks,
                minHeight: 0,
                justifyContent: "space-between",
              }}
            >
              {Array.from({ length: slice.ticks }, (_, t) => (
                <View
                  key={t}
                  style={{
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: on ? slice.color : FAINT,
                  }}
                />
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function FadeText({
  beat,
  onTextVisible,
  reduceMotion,
}: {
  beat: number;
  onTextVisible: (b: number) => void;
  reduceMotion: boolean;
}) {
  const [displayBeat, setDisplayBeat] = useState(beat);
  const displayBeatRef = useRef(displayBeat);
  displayBeatRef.current = displayBeat;
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const onTextVisibleRef = useRef(onTextVisible);
  onTextVisibleRef.current = onTextVisible;

  useEffect(() => {
    if (reduceMotion) {
      setDisplayBeat(beat);
      onTextVisibleRef.current(beat);
      return;
    }

    let isCancelled = false;

    if (beat === displayBeatRef.current) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: NATIVE_DRIVER,
      }).start(() => {
        if (!isCancelled) onTextVisibleRef.current(beat);
      });
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (finished && !isCancelled) {
          setDisplayBeat(beat);
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: NATIVE_DRIVER,
          }).start(() => {
            if (!isCancelled) onTextVisibleRef.current(beat);
          });
        }
      });
    }

    return () => {
      isCancelled = true;
      opacity.stopAnimation();
    };
  }, [beat, reduceMotion, opacity]);

  const slice = SLICES[displayBeat - 1];

  return (
    <Animated.View
      style={{ opacity, minHeight: 88, justifyContent: "flex-start" }}
    >
      {displayBeat === 0 ? (
        <Text
          className="font-display text-[26px] uppercase tracking-tight text-canvas"
          style={{ lineHeight: 30 }}
        >
          An 80-year life.
        </Text>
      ) : slice ? (
        <Text
          className="font-display text-[26px] uppercase tracking-tight text-canvas"
          style={{ lineHeight: 30 }}
        >
          <Text style={{ color: slice.color }}>{slice.years}</Text> years{" "}
          <Text style={{ color: slice.color }}>{slice.noun}</Text>
        </Text>
      ) : null}
    </Animated.View>
  );
}
