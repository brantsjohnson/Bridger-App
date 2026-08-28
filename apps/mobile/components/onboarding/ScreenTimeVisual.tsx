// ============================================
// WHAT THIS FILE DOES (plain English):
// The last reality-check picture: an 80-year life that colors in one beat at
// a time. First you see the whole life. Then sleep. Then the everyday stuff
// (work, chores, commute, exercise). Then devices take a huge pink bite.
// Then the tiny leftover for time spent in person with people (4.0 years).
//
// Each beat colors a band, then smoothly opens a little accordion under that
// band (icon + years). The next beat closes the previous accordion and opens
// the new one, so the sections below slide down. After a band is filled, tap
// it again to reopen or hide its years. Captions type in letter by letter
// (skipped when Reduce Motion is on). The green "Let's try again" button
// waits until the last caption is done.
//
// ACCESSIBILITY: the hash-line picture is decorative aside from the band
// taps. The changing sentence is real text. Reduce Motion skips waits and
// snaps open/closed. Tap an unfilled area or use advance to skip ahead.
// ============================================
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import {
  BriefcaseIcon,
  CarIcon,
  DumbbellIcon,
  HomeIcon,
  MoonIcon,
  SmartphoneIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react-native";
import { ONBOARDING, trackFlowStep } from "@bridger/shared";
import {
  AnalyticsRegion,
  withAnalyticsPress,
} from "@bridger/ui";
import { OB } from "./onboarding-theme";

const HOLD_MS = 3000;
/** How long each typed character waits before the next one appears. */
const TYPE_MS = 32;
/** Open accordion row height (icon + years). */
const STAT_ROW_H = 28;
/** How long open/close of a years row takes. */
const ACCORDION_MS = 340;

// Bright slice colors on the blue page. Caption type uses the same hex as
// the bars for that beat so the number and the paint always match.
const SLICE_WHITE = "#FFFFFF";
const SLICE_SKY = "#7EC8FF";
const SLICE_LAVENDER = "#C9B6FF";

const SLICES: ReadonlyArray<{
  key: string;
  noun: string;
  years: string;
  ticks: number;
  color: string;
  Icon: LucideIcon;
  /** Short spoken name for the band tap. */
  a11y: string;
}> = [
  {
    key: "sleep",
    noun: "sleeping.",
    years: "26.6",
    ticks: 27,
    color: OB.amber,
    Icon: MoonIcon,
    a11y: "Sleep",
  },
  {
    key: "work",
    noun: "on work & school.",
    years: "11.6",
    ticks: 11,
    color: OB.orange,
    Icon: BriefcaseIcon,
    a11y: "Work and school",
  },
  {
    key: "maintenance",
    noun: "on chores.",
    years: "10.6",
    ticks: 10,
    color: SLICE_WHITE,
    Icon: HomeIcon,
    a11y: "Chores",
  },
  {
    key: "commute",
    noun: "commuting.",
    years: "2.5",
    ticks: 3,
    color: SLICE_SKY,
    Icon: CarIcon,
    a11y: "Commuting",
  },
  {
    key: "exercise",
    noun: "on exercise.",
    years: "1.7",
    ticks: 2,
    color: OB.green,
    Icon: DumbbellIcon,
    a11y: "Exercise",
  },
  {
    key: "devices",
    noun: "on devices.",
    years: "23.3",
    ticks: 23,
    color: OB.pink,
    Icon: SmartphoneIcon,
    a11y: "Devices",
  },
  {
    key: "social",
    noun: "spent in person with people.",
    years: "4.0",
    ticks: 4,
    color: SLICE_LAVENDER,
    Icon: UsersIcon,
    a11y: "In person with people",
  },
];

const FAINT = "rgba(255,255,255,0.28)";
const LAST_BEAT = 7;
const AVERAGE_NOTE = "(Average over 80 years)";

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
  // Which band's years row is open. Story auto-opens the latest filled band;
  // taps can reopen an older one.
  const [openSlice, setOpenSlice] = useState<number | null>(
    reduceMotion ? SLICES.length - 1 : null,
  );
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // THIS SECTION DOES: walk the beats on a timer, or jump straight to the end.
  useEffect(() => {
    if (reduceMotion) {
      setBeat(LAST_BEAT);
      setLinesBeat(LAST_BEAT);
      setOpenSlice(SLICES.length - 1);
      return;
    }
    if (beat >= LAST_BEAT) return;

    const timer = setTimeout(() => {
      setBeat((b) => b + 1);
    }, HOLD_MS);
    return () => clearTimeout(timer);
  }, [beat, reduceMotion]);

  // THIS SECTION DOES: when a new band colors in, open its accordion (and the
  // previous one closes because only one openSlice is set).
  useEffect(() => {
    if (linesBeat <= 0) {
      setOpenSlice(null);
      return;
    }
    setOpenSlice(linesBeat - 1);
  }, [linesBeat]);

  // THIS SECTION DOES: tell analytics which beat we reached. The green button
  // waits until TypeCaption finishes the last line (4.0…), not just when the
  // beat index flips.
  useEffect(() => {
    trackFlowStep("onboarding", "stat-screentime", { page_index: beat });
  }, [beat]);

  const markLifeComplete = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current();
  };

  // Reduce Motion jumps to the end: allow the button as soon as we are there.
  useEffect(() => {
    if (reduceMotion && beat >= LAST_BEAT) markLifeComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on reduce/end
  }, [reduceMotion, beat]);

  const canAdvance = !reduceMotion && beat < LAST_BEAT;

  const goNext = () => {
    if (!canAdvance) return;
    setBeat((b) => Math.min(LAST_BEAT, b + 1));
  };

  // THIS SECTION DOES: tap a filled band to toggle its years row; tap while
  // the story is still playing on an unfilled area to skip ahead.
  const onBandPress = (sliceIndex: number) => {
    const filled = sliceIndex < linesBeat;
    if (filled) {
      setOpenSlice((prev) => (prev === sliceIndex ? null : sliceIndex));
      return;
    }
    if (canAdvance) goNext();
  };

  return (
    <View style={{ flex: 1, minHeight: 0, width: "100%", gap: 12 }}>
      {/* THE LIFE BAR: bands stack; each opens a years accordion under itself. */}
      <AnalyticsRegion
        analyticsId={ONBOARDING.stat.visual}
        interactive={false}
        style={{ flex: 1, minHeight: 0, width: "100%" }}
      >
        <LifeBar
          filled={linesBeat}
          openSlice={openSlice}
          reduceMotion={reduceMotion}
          canAdvance={canAdvance}
          onBandPress={onBandPress}
          onAdvance={goNext}
        />
      </AnalyticsRegion>

      {/* Quiet note under the bars: centered, types in once, then stays. */}
      <TypeInLine
        text={AVERAGE_NOTE}
        reduceMotion={reduceMotion}
        style={{
          color: "rgba(255,255,255,0.72)",
          fontSize: 13,
          lineHeight: 18,
          textAlign: "center",
          width: "100%",
        }}
        className="font-sans-sb"
      />

      {/* THE SENTENCE: types in as each beat lands. VoiceOver still gets the full line. */}
      <AnalyticsRegion
        analyticsId={ONBOARDING.stat.caption}
        interactive={false}
      >
        <TypeCaption
          beat={beat}
          onTextVisible={setLinesBeat}
          reduceMotion={reduceMotion}
          onTypingDone={() => {
            if (beat >= LAST_BEAT) markLifeComplete();
          }}
        />
      </AnalyticsRegion>
    </View>
  );
}

/**
 * Stack of year-bands. Under each filled band, an accordion can open with that
 * slice's icon + years, pushing everything below it down smoothly.
 */
function LifeBar({
  filled,
  openSlice,
  reduceMotion,
  canAdvance,
  onBandPress,
  onAdvance,
}: {
  filled: number;
  openSlice: number | null;
  reduceMotion: boolean;
  canAdvance: boolean;
  onBandPress: (sliceIndex: number) => void;
  onAdvance: () => void;
}) {
  return (
    <View style={{ flex: 1, minHeight: 0, width: "100%", gap: 1 }}>
      {SLICES.map((slice, sliceIndex) => {
        const on = sliceIndex < filled;
        const open = openSlice === sliceIndex;
        return (
          <React.Fragment key={slice.key}>
            {/* THE BAND: flex share by tick count. Accordion is a sibling so
                opening it pushes bands below down instead of squishing this one. */}
            <Pressable
              onPress={withAnalyticsPress(
                on
                  ? ONBOARDING.stat.band
                  : canAdvance
                    ? ONBOARDING.stat.advance
                    : undefined,
                () => {
                  if (on) onBandPress(sliceIndex);
                  else if (canAdvance) onAdvance();
                },
                {
                  analyticsProps: {
                    variant: "screentime",
                    page_index: sliceIndex,
                    method: on ? "toggle" : "advance",
                  },
                },
              )}
              disabled={!on && !canAdvance}
              accessibilityRole={on || canAdvance ? "button" : "none"}
              accessibilityLabel={
                on
                  ? `${slice.a11y}, ${slice.years} years. ${open ? "Hide" : "Show"} detail`
                  : canAdvance
                    ? "Show the next part of the story"
                    : undefined
              }
              accessibilityState={on ? { expanded: open } : undefined}
              style={{
                flexGrow: slice.ticks,
                flexShrink: 1,
                flexBasis: 0,
                minHeight: 0,
                gap: 1,
              }}
            >
              {Array.from({ length: slice.ticks }, (_, t) => (
                <View
                  key={`${slice.key}-${t}`}
                  style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: 0,
                    minHeight: 0,
                    width: "100%",
                    backgroundColor: on ? slice.color : FAINT,
                  }}
                />
              ))}
            </Pressable>

            {/* ACCORDION: under this band; lower bands slide down when it opens. */}
            <SliceStatRow
              open={open && on}
              slice={slice}
              reduceMotion={reduceMotion}
            />
          </React.Fragment>
        );
      })}
    </View>
  );
}

/**
 * Smooth open/close row under a color band. Height animates so the bands
 * below slide instead of jumping. Reduce Motion snaps.
 */
function SliceStatRow({
  open,
  slice,
  reduceMotion,
}: {
  open: boolean;
  slice: (typeof SLICES)[number];
  reduceMotion: boolean;
}) {
  const height = useRef(new Animated.Value(open ? STAT_ROW_H : 0)).current;
  const opacity = useRef(new Animated.Value(open ? 1 : 0)).current;
  const Icon = slice.Icon;

  useEffect(() => {
    if (reduceMotion) {
      height.setValue(open ? STAT_ROW_H : 0);
      opacity.setValue(open ? 1 : 0);
      return;
    }
    // Height must stay on the JS driver; keep opacity there too so we do not
    // mix native + JS drivers on the same animated node tree.
    Animated.parallel([
      Animated.timing(height, {
        toValue: open ? STAT_ROW_H : 0,
        duration: ACCORDION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: open ? 1 : 0,
        duration: ACCORDION_MS * 0.85,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [open, reduceMotion, height, opacity]);

  return (
    <Animated.View
      style={{ height, overflow: "hidden", opacity }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={{
          height: STAT_ROW_H,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 2,
        }}
      >
        <Icon size={14} color={slice.color} strokeWidth={2.4} />
        <Text
          style={{
            fontSize: 13,
            lineHeight: 16,
            fontWeight: "700",
            letterSpacing: -0.2,
            color: slice.color,
          }}
        >
          {slice.years}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            fontSize: 12,
            lineHeight: 15,
            fontWeight: "600",
            color: slice.color,
            opacity: 0.9,
          }}
        >
          {slice.noun.replace(/\.$/, "")}
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * Types one plain string letter by letter. Used for the quiet average note.
 * Reduce Motion shows the whole line at once.
 */
function TypeInLine({
  text,
  reduceMotion,
  style,
  className,
}: {
  text: string;
  reduceMotion: boolean;
  style?: object;
  className?: string;
}) {
  const [count, setCount] = useState(reduceMotion ? text.length : 0);

  useEffect(() => {
    if (reduceMotion) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) clearInterval(id);
    }, TYPE_MS);
    return () => clearInterval(id);
  }, [text, reduceMotion]);

  return (
    <Text className={className} style={style} accessibilityRole="text">
      {text.slice(0, count)}
    </Text>
  );
}

/**
 * Types the beat caption letter by letter, keeping orange/white colors on the
 * right parts of the line. When the beat changes, it clears and types the new
 * sentence. Bars color in as soon as typing starts for that beat. onTypingDone
 * fires when the full line is on screen (so the parent can wait for 4.0…).
 */
function TypeCaption({
  beat,
  onTextVisible,
  onTypingDone,
  reduceMotion,
}: {
  beat: number;
  onTextVisible: (b: number) => void;
  /** Fires once the current caption is fully revealed. */
  onTypingDone?: () => void;
  reduceMotion: boolean;
}) {
  const slice = beat === 0 ? null : SLICES[beat - 1];
  // Build the full line as three colored parts so typing can reveal them in order.
  const partA = beat === 0 ? "An 80-year life." : slice?.years ?? "";
  const partB = beat === 0 ? "" : " years ";
  const partC = beat === 0 ? "" : slice?.noun ?? "";
  const full = partA + partB + partC;
  const accent = slice?.color ?? OB.onColor;

  const [count, setCount] = useState(reduceMotion ? full.length : 0);
  const onTextVisibleRef = useRef(onTextVisible);
  onTextVisibleRef.current = onTextVisible;
  const onTypingDoneRef = useRef(onTypingDone);
  onTypingDoneRef.current = onTypingDone;

  useEffect(() => {
    onTextVisibleRef.current(beat);

    if (reduceMotion) {
      setCount(full.length);
      onTypingDoneRef.current?.();
      return;
    }

    setCount(0);
    if (full.length === 0) {
      onTypingDoneRef.current?.();
      return;
    }

    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= full.length) {
        clearInterval(id);
        onTypingDoneRef.current?.();
      }
    }, TYPE_MS);
    return () => clearInterval(id);
  }, [beat, full, reduceMotion]);

  // Split the revealed characters across the three colored parts.
  const n = Math.min(count, full.length);
  const aLen = Math.min(n, partA.length);
  const bLen = Math.max(0, Math.min(n - partA.length, partB.length));
  const shownA = partA.slice(0, aLen);
  const shownB = partB.slice(0, bLen);
  const shownC = partC.slice(0, Math.max(0, n - partA.length - partB.length));
  const typing = !reduceMotion && count < full.length;

  return (
    <View style={{ minHeight: 88, justifyContent: "flex-start" }}>
      <Text
        className="font-display text-[26px] uppercase tracking-tight"
        style={{ lineHeight: 30, color: OB.onColor }}
        accessibilityLabel={full}
      >
        {shownA ? (
          <Text style={{ color: beat === 0 ? OB.onColor : accent }}>{shownA}</Text>
        ) : null}
        {shownB ? <Text style={{ color: OB.onColor }}>{shownB}</Text> : null}
        {shownC ? <Text style={{ color: accent }}>{shownC}</Text> : null}
        {/* Blinking caret while letters are still landing. */}
        {typing ? (
          <Text style={{ color: OB.onColor }} accessible={false}>
            |
          </Text>
        ) : null}
      </Text>
    </View>
  );
}
