// ============================================
// WHAT THIS FILE DOES (plain English):
// The last reality-check picture: an 80-year life that colors in one beat at
// a time. First you see the whole life. Then sleep. Then the everyday stuff
// (work, chores, commute, exercise). Then devices take a huge pink bite.
// Then the tiny leftover: only 4.0 years spent in person with people.
//
// Each beat colors a band, then opens a tight accordion under that band with
// the icon + the SAME big thick caption that used to sit under the whole
// stack (so we do not show a tiny line and a giant line at once). Year lines
// keep a fixed thickness so mid-story does not leave a huge empty blue hole.
// The next beat closes the previous accordion and opens the new one, so the
// sections below slide down. After a band is filled, tap it again to reopen
// or hide its caption. Captions type in letter by letter (skipped when
// Reduce Motion is on). The green "Let's try again" button waits until the
// last caption is done.
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
/**
 * Fallback accordion height before we measure the real caption row.
 * Kept tight (icon + ~2 display lines) so we do not leave a big blue hole
 * under short lines like "11.6 years on work & school."
 */
const STAT_ROW_FALLBACK_H = 112;
/** How long open/close of a caption row takes. */
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
  /**
   * Optional lead-in for the big caption (social uses "only 4.0").
   * The year-band math still uses `years` + `ticks`.
   */
  yearsLead?: string;
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
    yearsLead: "only 4.0",
    ticks: 4,
    color: SLICE_LAVENDER,
    Icon: UsersIcon,
    a11y: "In person with people",
  },
];

const FAINT = "rgba(255,255,255,0.28)";
const LAST_BEAT = 7;

/** Build the spoken / typed line for one life-slice. */
function sliceCaption(slice: (typeof SLICES)[number]) {
  const lead = slice.yearsLead ?? slice.years;
  return {
    partA: lead,
    partB: " years ",
    partC: slice.noun,
    full: `${lead} years ${slice.noun}`,
    accent: slice.color,
  };
}

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
  // Which band's caption row is open. Story auto-opens the latest filled band;
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

  // THIS SECTION DOES: open the accordion for the beat that just started so its
  // caption can type and then color the band. (Do not wait on linesBeat — that
  // is set by the caption, which only runs when this row is already open.)
  useEffect(() => {
    if (reduceMotion) return;
    if (beat <= 0) {
      setOpenSlice(null);
      return;
    }
    setOpenSlice(beat - 1);
  }, [beat, reduceMotion]);

  // THIS SECTION DOES: tell analytics which beat we reached. The green button
  // waits until TypeCaption finishes the last line (only 4.0…), not just when
  // the beat index flips.
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

  // THIS SECTION DOES: tap a filled band to toggle its caption row; tap while
  // the story is still playing on an unfilled area to skip ahead.
  const onBandPress = (sliceIndex: number) => {
    const filled = sliceIndex < linesBeat;
    if (filled) {
      setOpenSlice((prev) => (prev === sliceIndex ? null : sliceIndex));
      return;
    }
    if (canAdvance) goNext();
  };

  // Which slice is actively typing (beat 1 → slice 0). Null on the intro beat.
  const typingSlice = beat > 0 ? beat - 1 : null;

  return (
    <View style={{ width: "100%", gap: 12 }}>
      {/* THE LIFE BAR: bands stack; each opens a big caption accordion under itself. */}
      <AnalyticsRegion
        analyticsId={ONBOARDING.stat.visual}
        interactive={false}
        style={{ width: "100%" }}
      >
        <LifeBar
          filled={linesBeat}
          openSlice={openSlice}
          typingSlice={typingSlice}
          beat={beat}
          reduceMotion={reduceMotion}
          canAdvance={canAdvance}
          onBandPress={onBandPress}
          onAdvance={goNext}
          onTextVisible={setLinesBeat}
          onTypingDone={() => {
            if (beat >= LAST_BEAT) markLifeComplete();
          }}
        />
      </AnalyticsRegion>

      {/* THIS SECTION DOES: make tap-through obvious (people missed it). */}
      {canAdvance ? (
        <Text
          className="text-center font-sans-sb text-[12px]"
          style={{ color: "rgba(255,255,255,0.72)" }}
          accessibilityLiveRegion="polite"
        >
          Tap the bar to read the next stat · {beat} of {LAST_BEAT}
        </Text>
      ) : null}

      {/* INTRO ONLY: "This represents an 80-year life." lives under the stack
          until the first band opens and takes over with its own caption. */}
      {beat === 0 ? (
        <AnalyticsRegion
          analyticsId={ONBOARDING.stat.caption}
          interactive={false}
        >
          <TypeCaption
            mode="intro"
            animate
            reduceMotion={reduceMotion}
            onTextVisible={setLinesBeat}
            onTypingDone={() => {
              /* intro has no CTA gate */
            }}
          />
        </AnalyticsRegion>
      ) : null}
    </View>
  );
}

/**
 * Tiny blue gap between year-hash lines. Same everywhere so the 80 rows look
 * like one even stack (almost touching, never a random double-wide stripe).
 */
const TICK_GAP = 1;
/**
 * Fixed thickness for every year line. Do NOT flex-fill the screen: stretching
 * unfilled bands left a huge empty blue hole under the open caption.
 */
const TICK_H = 3;

/**
 * Stack of year-bands. Under each filled band, an accordion can open with that
 * slice's icon + big thick caption, pushing everything below it down smoothly.
 */
function LifeBar({
  filled,
  openSlice,
  typingSlice,
  beat,
  reduceMotion,
  canAdvance,
  onBandPress,
  onAdvance,
  onTextVisible,
  onTypingDone,
}: {
  filled: number;
  openSlice: number | null;
  typingSlice: number | null;
  beat: number;
  reduceMotion: boolean;
  canAdvance: boolean;
  onBandPress: (sliceIndex: number) => void;
  onAdvance: () => void;
  onTextVisible: (b: number) => void;
  onTypingDone: () => void;
}) {
  return (
    // THIS SECTION DOES: stack year-bands. When a caption is open, collapse
    // every band below it to a short "rest of life" stub so dense blue ticks
    // cannot cover the big caption (the "stats are covered" bug).
    <View style={{ width: "100%" }}>
      {SLICES.map((slice, sliceIndex) => {
        const on = sliceIndex < filled;
        const revealed = sliceIndex < beat;
        const open = openSlice === sliceIndex && revealed;
        const animateThis =
          open && typingSlice === sliceIndex && beat === sliceIndex + 1;
        // Hide full tick stacks under an open caption; show a thin stub instead.
        const collapsedUnderCaption =
          openSlice != null && sliceIndex > openSlice;
        return (
          <React.Fragment key={slice.key}>
            {collapsedUnderCaption ? (
              sliceIndex === openSlice! + 1 ? (
                <View
                  accessible={false}
                  style={{
                    width: "100%",
                    height: 10,
                    marginTop: 4,
                    borderRadius: 2,
                    backgroundColor: FAINT,
                    opacity: 0.85
                  }}
                />
              ) : null
            ) : (
              <YearBand
                slice={slice}
                sliceIndex={sliceIndex}
                on={on}
                open={open}
                canAdvance={canAdvance}
                onBandPress={onBandPress}
                onAdvance={onAdvance}
              />
            )}

            {!collapsedUnderCaption ? (
              <SliceCaptionRow
                open={open}
                slice={slice}
                animate={animateThis}
                beat={beat}
                reduceMotion={reduceMotion}
                onTextVisible={onTextVisible}
                onTypingDone={onTypingDone}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

/**
 * One color band of year-hash lines. Each year is the same fixed thickness so
 * mid-story unfilled life does not balloon into empty blue.
 */
function YearBand({
  slice,
  sliceIndex,
  on,
  open,
  canAdvance,
  onBandPress,
  onAdvance,
}: {
  slice: (typeof SLICES)[number];
  sliceIndex: number;
  on: boolean;
  open: boolean;
  canAdvance: boolean;
  onBandPress: (sliceIndex: number) => void;
  onAdvance: () => void;
}) {
  return (
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
          ? `${slice.a11y}, ${slice.yearsLead ?? slice.years} years. ${open ? "Hide" : "Show"} detail`
          : canAdvance
            ? "Show the next part of the story"
            : undefined
      }
      accessibilityState={on ? { expanded: open } : undefined}
      style={{
        width: "100%",
        overflow: "hidden",
        // Same 1px blue stripe between every year line in this band.
        gap: TICK_GAP,
      }}
    >
      {Array.from({ length: slice.ticks }, (_, t) => (
        <View
          key={`${slice.key}-${t}`}
          style={{
            height: TICK_H,
            width: "100%",
            backgroundColor: on ? slice.color : FAINT,
          }}
        />
      ))}
    </Pressable>
  );
}

/**
 * Smooth open/close row under a color band. Holds the icon + the big display
 * caption. Height follows the real content size (measured), so short captions
 * do not leave a tall empty blue strip. Reduce Motion snaps.
 */
function SliceCaptionRow({
  open,
  slice,
  animate,
  beat,
  reduceMotion,
  onTextVisible,
  onTypingDone,
}: {
  open: boolean;
  slice: (typeof SLICES)[number];
  animate: boolean;
  beat: number;
  reduceMotion: boolean;
  onTextVisible: (b: number) => void;
  onTypingDone: () => void;
}) {
  // THIS SECTION DOES: remember how tall the caption actually is, then animate
  // the accordion to that height (not a fixed oversized slot).
  const [contentH, setContentH] = useState(STAT_ROW_FALLBACK_H);
  const height = useRef(new Animated.Value(open ? STAT_ROW_FALLBACK_H : 0)).current;
  const opacity = useRef(new Animated.Value(open ? 1 : 0)).current;
  const Icon = slice.Icon;
  const openH = Math.max(contentH, 1);

  useEffect(() => {
    if (reduceMotion) {
      height.setValue(open ? openH : 0);
      opacity.setValue(open ? 1 : 0);
      return;
    }
    // Height must stay on the JS driver; keep opacity there too so we do not
    // mix native + JS drivers on the same animated node tree.
    Animated.parallel([
      Animated.timing(height, {
        toValue: open ? openH : 0,
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
  }, [open, openH, reduceMotion, height, opacity]);

  return (
    <Animated.View
      style={{
        // Extra room so Big Shoulders glyphs + icon are never clipped mid-type.
        height: open ? openH + 8 : height,
        overflow: open ? "visible" : "hidden",
        opacity
      }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <View
        onLayout={(e) => {
          const h = Math.ceil(e.nativeEvent.layout.height);
          // Pad measured height so wrap + display font never get clipped.
          const next = h + 12;
          if (next > 0 && next !== contentH) setContentH(next);
        }}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
          paddingTop: 16,
          paddingBottom: 18,
          paddingHorizontal: 4,
        }}
      >
        {/* Keep the slice emoji / icon beside the big caption. Never shrink. */}
        <View style={{ flexShrink: 0, paddingTop: 4 }}>
          <Icon size={22} color={slice.color} strokeWidth={2.4} />
        </View>
        <AnalyticsRegion
          analyticsId={ONBOARDING.stat.caption}
          interactive={false}
          style={{ flex: 1, minWidth: 0 }}
        >
          <TypeCaption
            mode="slice"
            slice={slice}
            animate={animate}
            reduceMotion={reduceMotion}
            onTextVisible={onTextVisible}
            onTypingDone={onTypingDone}
            typeKey={`${slice.key}-${animate ? beat : "static"}`}
          />
        </AnalyticsRegion>
      </View>
    </Animated.View>
  );
}

/**
 * Types the beat caption letter by letter, keeping accent/white colors on the
 * right parts of the line. Bars color in as soon as typing starts for that
 * beat. onTypingDone fires when the full line is on screen (so the parent can
 * wait for only 4.0…).
 */
function TypeCaption({
  mode,
  slice,
  animate,
  onTextVisible,
  onTypingDone,
  reduceMotion,
  typeKey,
}: {
  mode: "intro" | "slice";
  slice?: (typeof SLICES)[number];
  /** When false, show the finished line immediately (reopened accordion). */
  animate: boolean;
  onTextVisible: (b: number) => void;
  /** Fires once the current caption is fully revealed. */
  onTypingDone?: () => void;
  reduceMotion: boolean;
  /** Optional key so reopen vs live typing reset cleanly. */
  typeKey?: string;
}) {
  const parts =
    mode === "intro"
      ? {
          partA: "This represents an 80-year life.",
          partB: "",
          partC: "",
          full: "This represents an 80-year life.",
          accent: OB.onColor,
          beatIndex: 0,
        }
      : (() => {
          const c = sliceCaption(slice!);
          return { ...c, beatIndex: SLICES.indexOf(slice!) + 1 };
        })();

  const { partA, partB, partC, full, accent, beatIndex } = parts;
  const shouldAnimate = animate && !reduceMotion;

  const [count, setCount] = useState(shouldAnimate ? 0 : full.length);
  const onTextVisibleRef = useRef(onTextVisible);
  onTextVisibleRef.current = onTextVisible;
  const onTypingDoneRef = useRef(onTypingDone);
  onTypingDoneRef.current = onTypingDone;

  useEffect(() => {
    // Live story captions (animate) drive which bands fill. A reopen tap must
    // not rewind the colored bars or re-fire the CTA gate.
    if (animate) {
      onTextVisibleRef.current(beatIndex);
    }

    if (!shouldAnimate) {
      setCount(full.length);
      if (animate) onTypingDoneRef.current?.();
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
  }, [animate, beatIndex, full, shouldAnimate, typeKey]);

  // Split the revealed characters across the three colored parts.
  const n = Math.min(count, full.length);
  const aLen = Math.min(n, partA.length);
  const bLen = Math.max(0, Math.min(n - partA.length, partB.length));
  const shownA = partA.slice(0, aLen);
  const shownB = partB.slice(0, bLen);
  const shownC = partC.slice(0, Math.max(0, n - partA.length - partB.length));
  const typing = shouldAnimate && count < full.length;

  return (
    <Text
      className="font-display uppercase tracking-tight"
      style={{
        fontSize: 18,
        lineHeight: 26,
        color: OB.onColor,
        paddingTop: 2,
        paddingBottom: 8,
        includeFontPadding: true,
      }}
      accessibilityLabel={full}
    >
      {shownA ? (
        <Text style={{ color: mode === "intro" ? OB.onColor : accent }}>
          {shownA}
        </Text>
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
  );
}
