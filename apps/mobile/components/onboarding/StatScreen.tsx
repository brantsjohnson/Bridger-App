// ============================================
// WHAT THIS FILE DOES (plain English):
// The four full-screen reality-check moments between onboarding questions.
// Each one states a hard truth on a flat blue background, shows a colorful
// animated picture of that stat, counts a big number up from zero, and ends
// with "Let's try again." The screen-time one is a story: an 80-year life
// colors in beat by beat, and the green button waits until the last number
// lands.
//
// HOW IT ANIMATES IN (the same on every blue screen): the headline TYPES in
// row by row with a blinking cursor so the person can read it first. Only once
// both headline lines finish does the graphic POP up, then the big stat, then
// the "Let's try again" button and a small "Where this comes from" link under
// it (that opens the sources). So the eye naturally moves headline → picture →
// stat → button.
//
// The graphic and stat are sized to FILL the middle of the screen (bigger on
// taller phones) so they never feel small and lost in empty space.
//
// The feed screen is special: Instagram-style posts snap upward one at a time
// (ads in orange, the one FRIEND post in green), with like and comment chrome.
//
// LOOK: flat blue page (no graph-paper overlay), cream display type that stays
// light in dark mode, light red for accent type on blue, the display font for
// the headline, and a green square "Let's try again" button at the bottom.
//
// ACCESSIBILITY: all the moving art is marked decorative and the stat is always
// shown as plain text too. When the phone asks for reduced motion, nothing
// types or pops: the headline, art, stat, and button all show at once and the
// number jumps straight to the end.
// ============================================
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";
import {
  BookmarkIcon,
  HeartIcon,
  InfoIcon,
  MessageCircleIcon,
  SendIcon,
  XIcon,
} from "lucide-react-native";
import { ONBOARDING } from "@bridger/shared";
import {
  AnalyticsRegion,
  NATIVE_DRIVER,
  useReduceMotion,
  withAnalyticsPress,
} from "@bridger/ui";
import { OB, OB_BORDER } from "./onboarding-theme";
import { OBCTA } from "./onboarding-ui";
import { ScreenTimeVisual } from "./ScreenTimeVisual";

// THIS SECTION DOES: cream type that stays light on the blue page in both themes.
// Never use text-canvas / text-ink here. Those flip in dark mode and go black on blue.
// Accent type (big %, eyebrow, FIVE) is light red on the blue canvas.
const ON_BLUE = OB.onColor;
const ON_BLUE_MUTE = "rgba(255,255,255,0.68)";
const ON_BLUE_ACCENT = OB.redOnBlue;

/** Which of the four stat pictures to show. */
export type StatVariant = "feed" | "isolation" | "retention" | "screentime";

type StatLine = { text: string; underline?: string };

type StatContent = {
  line1: StatLine;
  line2: StatLine;
  number: string;
  caption: string;
  sources: string[];
  numberColor: string;
};

const CONTENT: Record<StatVariant, StatContent> = {
  feed: {
    line1: { text: "The internet was supposed to ", underline: "connect us" },
    line2: { text: "Instead, it's all about ", underline: "ads" },
    number: "18%",
    caption: "Your feed is only 18% posts from friends, the rest are ads",
    sources: [
      "WSJ: How Social Feeds Shifted From Friends to Algorithms",
      "Pew Research Center: Social Media Algorithms & Feeds",
    ],
    numberColor: ON_BLUE_ACCENT,
  },
  isolation: {
    line1: {
      text: "The internet was supposed to help us ",
      underline: "make friends",
    },
    line2: { text: "Instead, it ", underline: "isolated us" },
    // Isolation draws its own top/bottom "1 in X" stats + pie; these stay empty.
    number: "",
    caption: "",
    sources: [
      "Survey Center on American Life: The State of American Friendship (2021)",
      "12% of Americans have no close friends (about 1 in 12)",
      "48% have only 1–4 close friends (about 1 in 2)",
    ],
    numberColor: ON_BLUE_ACCENT,
  },
  retention: {
    line1: {
      text: "The internet was supposed to ",
      underline: "keep us in touch",
    },
    line2: { text: "Instead, it kept us ", underline: "scrolling" },
    number: "240",
    caption: "videos watched an hour.\nYou'll remember fewer than FIVE.",
    sources: [
      "Communications Psychology: Short videos impair memory accuracy (2026)",
      "PsyPost: Neuroscientists on the illusion of learning from short videos",
      "VICE: TikToks, Shorts, and Reels Are Melting Your Attention Span",
    ],
    // Purple matches the 235 forgotten squares (the bulk of the 240).
    // FIVE stays yellow with the five remembered squares under the grid.
    numberColor: OB.purple,
  },
  screentime: {
    line1: {
      text: "The internet was supposed to help us ",
      underline: "live life",
    },
    line2: { text: "Instead, we became the ", underline: "product" },
    number: "",
    caption: "",
    sources: [
      "Eyesafe Report: 7 hours a day on screens, 23.3 years over an 80-year life (2025)",
      "U.S. Bureau of Labor Statistics: American Time Use Survey (sleep, work, chores, commuting, exercise, in-person socializing)",
      "Work and school hours are averaged across all 80 years, including childhood, weekends, holidays, and retirement",
    ],
    numberColor: ON_BLUE_ACCENT,
  },
};

export function StatScreen({
  variant,
  onBridge,
  onBack,
}: {
  variant: StatVariant;
  onBridge: () => void;
  onBack?: () => void;
}) {
  const c = CONTENT[variant];
  const [sourcesOpen, setSourcesOpen] = useState(false);
  // Screen-time waits until the final "only 4.0 years…" caption finishes typing.
  const [lifeReady, setLifeReady] = useState(variant !== "screentime");
  const reduce = useReduceMotion();
  const showFooter = variant !== "screentime" || lifeReady;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Short phones need tighter headlines + gaps so isolation / feed do not clip.
  const isolationCompact = variant === "isolation" && windowHeight < 780;
  // Feed: leave room for the 18% + caption + green button (was overflowing).
  const feedCompact = variant === "feed" && windowHeight < 860;
  // Stable so ScreenTimeVisual's "I'm done" callback does not reset every render.
  const onLifeComplete = () => setLifeReady(true);

  // THIS SECTION DOES: run each screen as a little story so nothing lands at
  // once. Stage 0 = the headline TYPES in row by row. When it finishes we go to
  // stage 1 (the graphic pops up), then stage 2 (the big stat), then stage 3
  // (the "Let's try again" button + the "Where this comes from" link under it).
  // Reduce Motion jumps straight to stage 3 so everything shows immediately.
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(reduce ? 3 : 0);
  // Called once the headline finishes typing: let the graphic pop up.
  const bumpToGraphic = useCallback(() => {
    setStage((s) => (s < 1 ? 1 : s));
  }, []);

  // THIS SECTION DOES: after the graphic pops, walk forward on a timer so the
  // stat, then the button, appear in a calm, readable rhythm. Screen-time drives
  // its own ending (its button waits for the last caption), and isolation runs
  // its own top / pie / bottom sequence, so we just give those the time to play.
  useEffect(() => {
    if (reduce) return;
    if (variant === "screentime") return;
    if (variant === "isolation") {
      if (stage !== 1) return;
      const t = setTimeout(() => setStage(3), 2600);
      return () => clearTimeout(t);
    }
    if (stage === 1) {
      const t = setTimeout(() => setStage(2), 650);
      return () => clearTimeout(t);
    }
    if (stage === 2) {
      const t = setTimeout(() => setStage(3), 1050);
      return () => clearTimeout(t);
    }
  }, [stage, variant, reduce]);

  // THIS SECTION DOES: decide which pieces are allowed on screen yet. Screen-time
  // keeps its own rule that the button waits for its story (lifeReady).
  const graphicIn = stage >= 1;
  const statIn = stage >= 2;
  const ctaIn = variant === "screentime" ? showFooter : stage >= 3;
  const infoIn = variant === "screentime" ? showFooter : stage >= 2;

  // Every variant puts the picture first, then the big number under it.
  // Gaps stay roomy so the headline, card, %, caption, and button never stack flush.
  // Isolation tightens on short phones so the ring + both "1 in X" stats fit.
  const stackGap =
    variant === "isolation"
      ? isolationCompact
        ? 8
        : 12
      : variant === "feed"
        ? feedCompact
          ? 14
          : 18
        : variant === "retention"
          ? 20
          : 20;

  return (
    // THIS SECTION DOES: fill the real display. Width and height stay 100% so
    // the page grows and shrinks with the window instead of locking to a leftover
    // phone-sized box (the white gutter / clipped-edge bug).
    <View
      style={{
        flex: 1,
        width: "100%",
        alignSelf: "stretch",
        height: "100%",
        backgroundColor: OB.blue,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          // Space-between keeps the headline up, the post + % in the middle, and
          // the green button at the bottom (feed included, so the square is centered).
          justifyContent: "space-between",
          gap: isolationCompact || feedCompact ? 14 : 22,
          paddingHorizontal: 24,
          paddingTop: insets.top + (isolationCompact || feedCompact ? 12 : 14),
          paddingBottom: Math.max(insets.bottom, 12) + 8,
        }}
      >
        {/* THIS SECTION DOES: the headline that TYPES in row by row with a
            blinking cursor, so the person reads it first. Only when the second
            line finishes typing does it call bumpToGraphic, which lets the
            picture pop up. There is no "A quick reality check" eyebrow anymore;
            the sources link now sits under the stat as "Where this comes from". */}
        <View style={{ flexShrink: 0 }}>
          <AnalyticsRegion
            analyticsId={ONBOARDING.stat.headline}
            interactive={false}
          >
            <TypedHeadline
              line1={c.line1}
              line2={c.line2}
              compact={variant === "feed" || isolationCompact}
              reduce={reduce}
              onDone={bumpToGraphic}
            />
          </AnalyticsRegion>
        </View>

        {/* THIS SECTION DOES: the animated picture, then the big counting number
            under it. Feed centers the square post in the middle band. Screen time
            sizes to its year lines (fixed tick height) so mid-story captions are
            not stranded over a huge empty blue stretch.
            overflow stays visible here so big display digits (240, 18%) are not
            chopped by the band; graphics that need a clip wrap themselves. */}
        <View
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            gap: stackGap,
            justifyContent:
              variant === "screentime"
                ? "flex-start"
                : isolationCompact
                  ? "flex-start"
                  : "center",
            alignItems: "center",
          }}
        >
          {/* THIS SECTION DOES: the animated picture. It only mounts once the
              headline is done typing (graphicIn), so it truly "pops up" after the
              words. Feed and retention wrap in PopIn for the little scale-in;
              screen-time runs its own reveal, so it just fades in place. */}
          {variant === "feed" && graphicIn ? (
            <PopIn
              reduce={reduce}
              style={{ width: "100%", flexShrink: 1, alignItems: "center" }}
            >
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <FeedVisual reduceMotion={reduce} compact={feedCompact} />
              </View>
            </PopIn>
          ) : null}
          {variant === "retention" && graphicIn ? (
            <PopIn
              reduce={reduce}
              style={{
                flex: 1,
                minHeight: 0,
                width: "100%",
                alignItems: "center",
              }}
            >
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  flex: 1,
                  minHeight: 0,
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <RetentionVisual reduceMotion={reduce} />
              </View>
            </PopIn>
          ) : null}
          {variant === "screentime" && graphicIn ? (
            <View
              importantForAccessibility="yes"
              style={{ width: "100%", flexShrink: 1 }}
            >
              <ScreenTimeVisual
                reduceMotion={reduce}
                onComplete={onLifeComplete}
              />
            </View>
          ) : null}
          {/* Isolation: top "1 in 12", pie (12% + 48%), bottom "1 in 2". It pops
              in as one piece once the headline is done, then runs its own
              top / pie / bottom timing. */}
          {variant === "isolation" && graphicIn ? (
            <PopIn reduce={reduce} style={{ width: "100%", alignItems: "center" }}>
              <IsolationVisual reduceMotion={reduce} />
            </PopIn>
          ) : null}
          {/* THIS SECTION DOES: the big counting number under the picture. It waits
              for stage 2 (statIn) so it lands AFTER the graphic pops. Isolation
              and screen-time draw their own numbers, so this is only feed +
              retention (their c.number is set). */}
          {c.number && statIn ? (
            <StatNumber
              variant={variant}
              number={c.number}
              color={c.numberColor}
              caption={c.caption}
              reduce={reduce}
              compact={feedCompact}
            />
          ) : null}
        </View>

        {/* THIS SECTION DOES: the "Where this comes from" sources link, then the
            green "Let's try again" button. Both slots keep their height and just
            fade in (opacity), so the art above never jumps when they appear. The
            link shows with the stat (stage 2); the button shows right after (stage
            3). On screen-time both wait for its story to finish (showFooter). */}
        <View
          style={{
            gap: feedCompact ? 6 : 10,
            flexShrink: 0,
            width: "100%",
          }}
        >
          {/* SOURCES LINK: sits right after the stat and opens the citations
              sheet. This replaces the old "i" that used to live by the eyebrow. */}
          <View
            pointerEvents={infoIn ? "auto" : "none"}
            style={{ opacity: infoIn ? 1 : 0, alignItems: "center" }}
          >
            <Pressable
              onPress={withAnalyticsPress(
                ONBOARDING.stat.info,
                () => setSourcesOpen(true),
                { analyticsProps: { variant } },
              )}
              accessibilityRole="button"
              accessibilityLabel="Where this comes from"
              hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 2,
              }}
            >
              <InfoIcon
                size={14}
                color="rgba(245,240,230,0.85)"
                strokeWidth={2.4}
              />
              <Text
                className="font-sans-sb text-[13px]"
                style={{
                  color: ON_BLUE_MUTE,
                  textDecorationLine: "underline",
                }}
              >
                Where this comes from
              </Text>
            </Pressable>
          </View>
          {/* THE BUTTON: reserved height via opacity so the art never reflows. */}
          <View
            pointerEvents={ctaIn ? "auto" : "none"}
            accessible={ctaIn}
            accessibilityElementsHidden={!ctaIn}
            importantForAccessibility={ctaIn ? "yes" : "no-hide-descendants"}
            style={{ opacity: ctaIn ? 1 : 0 }}
          >
            <OBCTA
              label="Let's try again"
              tone="green"
              analyticsId={ONBOARDING.stat.bridge}
              analyticsProps={{ variant }}
              onPress={onBridge}
              accessibilityLabel="Let's try again"
            />
          </View>
          {onBack ? (
            <Pressable
              onPress={withAnalyticsPress(ONBOARDING.chrome.back, onBack)}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              // ACCESSIBILITY: hitSlop keeps a 44pt tap target without a tall
              // empty band under the CTA (same pattern as Skip for now).
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              style={{ alignSelf: "center", paddingVertical: 2 }}
            >
              <Text
                className="font-sans-sb text-[14px]"
                style={{
                  color: ON_BLUE_MUTE,
                  textDecorationLine: "underline",
                }}
              >
                Back
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* THE SOURCES SHEET: plain text list, opened by the link. */}
      <Modal
        visible={sourcesOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSourcesOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          accessibilityLabel="Close sources"
          onPress={() => setSourcesOpen(false)}
        >
          {/* The sheet is square and flat, like the rest of the run. */}
          <View
            style={{
              backgroundColor: OB.canvas,
              borderTopWidth: OB_BORDER,
              borderColor: OB.navy,
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 40,
            }}
          >
            <View
              style={{
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text
                className="font-sans-b text-[16px]"
                style={{ color: OB.blue }}
              >
                Where this comes from
              </Text>
              <Pressable
                onPress={() => setSourcesOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={12}
                style={{
                  width: 34,
                  height: 34,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: OB.paper,
                  borderWidth: OB_BORDER,
                  borderColor: OB.navy,
                }}
              >
                <XIcon size={16} color={OB.navy} strokeWidth={2.6} />
              </Pressable>
            </View>
            <View style={{ gap: 10 }}>
              {c.sources.map((s) => (
                <Text
                  key={s}
                  className="font-sans-sb text-[13px]"
                  style={{ lineHeight: 19, color: "rgba(0,0,0,0.72)" }}
                >
                  {s}
                </Text>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================
// THE TYPING HEADLINE: types the two headline lines in row by row with a
// blinking cursor. When the second line finishes, it calls onDone once so the
// screen can pop the graphic up next. Reduce Motion shows both full lines at
// once and calls onDone right away.
// ============================================

/** How long each typed letter waits before the next one appears. */
const TYPE_CHAR_MS = 24;
/** A small breath before typing starts. */
const TYPE_START_MS = 260;
/** A longer pause at the line break so line two feels like a new row. */
const TYPE_LINE_GAP_MS = 320;

/** The full character count of a line: text + underline word + the period. */
function lineLength(line: StatLine): number {
  return line.text.length + (line.underline?.length ?? 0) + (line.underline ? 1 : 0);
}

function TypedHeadline({
  line1,
  line2,
  compact,
  reduce,
  onDone,
}: {
  line1: StatLine;
  line2: StatLine;
  /** Slightly smaller on the feed / short-phone screens so the art fits below. */
  compact: boolean;
  reduce: boolean;
  onDone: () => void;
}) {
  const len1 = lineLength(line1);
  const len2 = lineLength(line2);
  const total = len1 + len2;

  // How many letters have been revealed so far across BOTH lines.
  const [count, setCount] = useState(reduce ? total : 0);
  // Blinking block cursor while typing.
  const [cursorOn, setCursorOn] = useState(true);

  // Keep the latest onDone without restarting the typing effect.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reduce) {
      setCount(total);
      onDoneRef.current();
      return;
    }
    setCount(0);
    let i = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (cancelled) return;
      i += 1;
      setCount(i);
      if (i >= total) {
        onDoneRef.current();
        return;
      }
      // Pause longer right after line one finishes (i === len1).
      timer = setTimeout(step, i === len1 ? TYPE_LINE_GAP_MS : TYPE_CHAR_MS);
    };
    timer = setTimeout(step, TYPE_START_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [total, len1, reduce]);

  // Blink the cursor about twice a second while there is still typing to do.
  useEffect(() => {
    if (reduce || count >= total) {
      setCursorOn(false);
      return;
    }
    const blink = setInterval(() => setCursorOn((v) => !v), 480);
    return () => clearInterval(blink);
  }, [reduce, count, total]);

  const shown1 = Math.min(count, len1);
  const shown2 = Math.max(0, count - len1);
  const typingLine1 = count < len1;
  const typingLine2 = count >= len1 && count < total;

  return (
    <View>
      <TypedLine
        line={line1}
        shown={shown1}
        compact={compact}
        cursor={typingLine1 && cursorOn}
      />
      <View style={{ marginTop: compact ? 8 : 16 }}>
        <TypedLine
          line={line2}
          shown={shown2}
          compact={compact}
          cursor={typingLine2 && cursorOn}
        />
      </View>
    </View>
  );
}

/**
 * One headline row, revealed up to `shown` characters (text, then the
 * underlined word, then the period), with an optional blinking cursor at the
 * end. Color is fixed cream so dark mode cannot turn it black on the blue page.
 */
function TypedLine({
  line,
  shown,
  compact,
  cursor,
}: {
  line: StatLine;
  shown: number;
  compact: boolean;
  cursor: boolean;
}) {
  const textLen = line.text.length;
  const underline = line.underline ?? "";
  const textPart = line.text.slice(0, Math.min(shown, textLen));
  const afterText = Math.max(0, shown - textLen);
  const underlinePart = underline.slice(0, Math.min(afterText, underline.length));
  const showPeriod = underline ? shown >= textLen + underline.length + 1 : false;

  return (
    <Text
      className={
        compact
          ? "font-display text-[28px] uppercase tracking-tight"
          : "font-display text-[32px] uppercase tracking-tight"
      }
      style={{ lineHeight: compact ? 32 : 37, color: ON_BLUE }}
    >
      {textPart}
      {underlinePart ? (
        <Text className="underline" style={{ textDecorationLine: "underline" }}>
          {underlinePart}
        </Text>
      ) : null}
      {showPeriod ? "." : null}
      {cursor ? (
        <Text style={{ color: ON_BLUE_ACCENT }}>▌</Text>
      ) : null}
    </Text>
  );
}

// ============================================
// POP IN: a small fade + scale + rise used when the graphic (and its parts)
// first appear, so they "pop up" after the headline. Reduce Motion shows the
// child instantly with no movement.
// ============================================
function PopIn({
  children,
  style,
  reduce,
}: {
  children: React.ReactNode;
  style?: object;
  reduce: boolean;
}) {
  const opacity = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(reduce ? 1 : 0.92)).current;
  const y = useRef(new Animated.Value(reduce ? 0 : 16)).current;
  useEffect(() => {
    if (reduce) return;
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 460,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(y, {
        toValue: 0,
        duration: 460,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduce, opacity, scale, y]);
  return (
    <Animated.View
      style={[
        style,
        { opacity, transform: [{ translateY: y }, { scale }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ============================================
// STAT NUMBER: the big counting number under the picture (feed 18%, retention
// 240). It pops in and counts up from zero when it mounts, which happens at
// stage 2 so it lands after the graphic. Sizes are large so the stat fills the
// space and never feels small.
// ============================================
function StatNumber({
  variant,
  number,
  color,
  caption,
  reduce,
  compact = false,
}: {
  variant: StatVariant;
  number: string;
  color: string;
  caption: string;
  reduce: boolean;
  /** Smaller type on short phones so the caption is not crushed by the button. */
  compact?: boolean;
}) {
  const pop = useCount(80, reduce);
  const counted = useCountUp(number, 80, reduce);
  // Feed uses a slightly smaller % on short phones so caption + button both fit.
  // Big Shoulders Display paints tall tops; lineHeight of 1 (or less) chops the
  // digits against the parent's overflow:hidden. Keep leading a hair over 1 and
  // pad the top so "240" / "18%" never lose their flat caps.
  const feedSize = compact
    ? "font-display text-[56px] leading-[1.08] tracking-tight"
    : "font-display text-[76px] leading-[1.08] tracking-tight";
  const numberPadTop = variant === "retention" ? 14 : variant === "feed" ? 10 : 8;
  return (
    <Animated.View
      style={[{ alignItems: "center", flexShrink: 0, overflow: "visible" }, pop]}
    >
      <Text
        className={
          variant === "feed"
            ? feedSize
            : variant === "retention"
              ? "font-display text-[92px] leading-[1.1] tracking-tight"
              : "font-display text-[88px] leading-[1.08] tracking-tight"
        }
        style={{
          color,
          letterSpacing: -3,
          paddingTop: numberPadTop,
          // Android otherwise shaves font padding and can clip the same way.
          includeFontPadding: true,
        }}
        accessibilityRole="header"
      >
        {counted}
      </Text>
      {/* Retention: TWO caption lines with a gap; FIVE matches the five yellow
            squares. The big 240 is purple like the forgotten grid. */}
      {variant === "retention" ? (
        <View
          style={{ marginTop: 14, maxWidth: 320, alignItems: "center", gap: 12 }}
        >
          <Text
            className="text-center font-sans-sb text-[16px] leading-snug"
            style={{ color: ON_BLUE }}
          >
            videos watched an hour.
          </Text>
          <Text
            className="text-center font-sans-sb text-[16px] leading-snug"
            style={{ color: ON_BLUE }}
          >
            {"You'll remember fewer than "}
            <Text className="font-sans-b text-[16px]" style={{ color: OB.amber }}>
              FIVE
            </Text>
            .
          </Text>
        </View>
      ) : (
        <Text
          className={
            compact
              ? "mt-2 max-w-[320px] text-center font-sans-sb text-[14px] leading-snug"
              : "mt-3 max-w-[320px] text-center font-sans-sb text-[16px] leading-snug"
          }
          style={{ color: ON_BLUE }}
        >
          {caption}
        </Text>
      )}
    </Animated.View>
  );
}

/** Pop-in for the big number container. */
function useCount(delay: number, reduce: boolean) {
  const opacity = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const y = useRef(new Animated.Value(reduce ? 0 : 26)).current;
  const scale = useRef(new Animated.Value(reduce ? 1 : 0.9)).current;
  useEffect(() => {
    if (reduce) {
      opacity.setValue(1);
      y.setValue(0);
      scale.setValue(1);
      return;
    }
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        delay,
        duration: 700,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(y, {
        toValue: 0,
        delay,
        duration: 700,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(scale, {
        toValue: 1,
        delay,
        duration: 700,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, reduce, opacity, y, scale]);
  return { opacity, transform: [{ translateY: y }, { scale }] };
}

/**
 * Count the digits from 0 up to the target ("18%", "240", "12"), so the big
 * number feels like it is climbing. Reduced motion skips straight to the end.
 */
function useCountUp(target: string, delay: number, reduce: boolean): string {
  const match = target.match(/^(\d+)(.*)$/);
  const goal = match ? Number(match[1]) : 0;
  const suffix = match ? match[2] : "";
  const [shown, setShown] = useState(reduce || !goal ? goal : 0);

  useEffect(() => {
    if (!goal) {
      setShown(0);
      return;
    }
    if (reduce) {
      setShown(goal);
      return;
    }
    setShown(0);
    let raf = 0;
    let startAt = 0;
    const duration = 900;
    const tick = (now: number) => {
      if (!startAt) startAt = now;
      const t = Math.min(1, (now - startAt) / duration);
      // Ease out so it races up then eases into the final number.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(goal * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [goal, delay, reduce]);

  if (!target) return "";
  return `${shown}${suffix}`;
}

// ============================================
// VARIANT 1, FEED: Instagram-style posts that snap upward one card at a time
// (ads in orange, the one FRIEND post in green), with like + comment chrome.
// The photo area is a real square; the whole post sits fuller in the middle
// of the page above the counting 18%.
// ============================================
const FEED_CARDS = [
  { tag: "AD", name: "sponsored_brand", friend: false, likes: "585" },
  { tag: "SPONSORED", name: "paid_partner", friend: false, likes: "1,204" },
  { tag: "SUGGESTED", name: "for_you_page", friend: false, likes: "9,830" },
  { tag: "AD", name: "shop_now_llc", friend: false, likes: "312" },
  { tag: "SPONSORED", name: "brand_official", friend: false, likes: "4,461" },
  { tag: "FRIEND", name: "conor", friend: true, likes: "12" },
  { tag: "AD", name: "sponsored_brand", friend: false, likes: "585" },
];

/** How the post card is carved up: header, square photo, and the like row. */
const FEED_HEADER_H = 40;
const FEED_FOOTER_H = 54;
/** Cap on the square photo side so the post stays big but leaves room for 18%. */
const FEED_MEDIA_MAX = 300;
/** Smaller cap on short phones so caption + button are never crushed. */
const FEED_MEDIA_MAX_COMPACT = 200;

function FeedVisual({
  reduceMotion,
  compact = false,
}: {
  reduceMotion: boolean;
  compact?: boolean;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(0)).current;
  const steps = FEED_CARDS.length - 1;

  // THIS SECTION DOES: size a real square photo, then add header + likes around it.
  // Room is reserved for the headline, 18%, caption, sources link, and green button
  // so the post never pushes those off the page (the overlap bug).
  const mediaMax = compact ? FEED_MEDIA_MAX_COMPACT : FEED_MEDIA_MAX;
  const heightCap = Math.floor(windowHeight * (compact ? 0.24 : 0.3));
  const mediaSide = Math.min(
    mediaMax,
    windowWidth - 48,
    Math.max(compact ? 140 : 180, heightCap),
  );
  const cardW = mediaSide;
  const mediaH = mediaSide;
  const cardH = FEED_HEADER_H + mediaH + FEED_FOOTER_H;

  useEffect(() => {
    if (reduceMotion) return;
    // Hold ~1.65s, swipe ~0.75s, six times = 15s loop (same as the design).
    const HOLD = 1650;
    const SWIPE = 750;
    translateY.setValue(0);
    const sequence = Array.from({ length: steps }, (_, i) =>
      Animated.sequence([
        Animated.delay(HOLD),
        Animated.timing(translateY, {
          toValue: -cardH * (i + 1),
          duration: SWIPE,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: NATIVE_DRIVER,
        }),
      ]),
    );
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: NATIVE_DRIVER,
        }),
        ...sequence,
      ]),
    );
    // Small pause before the first swipe so the headline can land first.
    const start = Animated.sequence([Animated.delay(2000), loop]);
    start.start();
    return () => {
      start.stop();
      loop.stop();
    };
  }, [reduceMotion, translateY, steps, cardH]);

  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
      }}
      accessible={false}
    >
      {/* One big post at a time in a square-corner window. */}
      <View
        style={{
          width: cardW,
          height: cardH,
          overflow: "hidden",
          borderWidth: OB_BORDER,
          borderColor: OB.navy,
          backgroundColor: OB.paper,
        }}
      >
        <Animated.View style={{ transform: [{ translateY }] }}>
          {FEED_CARDS.map((card, i) => (
            <FeedCard
              key={`${card.name}-${i}`}
              card={card}
              width={cardW}
              height={cardH}
              mediaHeight={mediaH}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

/** One fake Instagram post: square avatar, tag block, like + comment row. */
function FeedCard({
  card,
  width,
  height,
  mediaHeight,
}: {
  card: (typeof FEED_CARDS)[number];
  width: number;
  height: number;
  mediaHeight: number;
}) {
  const mediaColor = card.friend ? OB.green : OB.orange;
  const tagColor = card.friend ? OB.onColor : OB.ink;
  return (
    <View
      style={{
        width,
        height,
        backgroundColor: OB.paper,
      }}
    >
      {/* Poster row: square avatar + handle + more dots. */}
      <View
        style={{
          height: FEED_HEADER_H,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 12,
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            backgroundColor: OB.canvas,
            borderWidth: OB_BORDER,
            borderColor: card.friend ? OB.green : OB.pink,
          }}
        />
        <Text
          className="font-sans-sb text-[12px]"
          style={{ flex: 1, color: OB.ink }}
          numberOfLines={1}
        >
          {card.name}
        </Text>
        <Text
          className="font-sans-b text-[14px]"
          style={{ color: "rgba(0,0,0,0.5)" }}
        >
          ⋮
        </Text>
      </View>

      {/* The photo stand-in: orange for ads, green for the one friend. */}
      <View
        style={{
          width,
          height: mediaHeight,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: mediaColor,
        }}
      >
        <Text
          className="font-sans-b text-[18px]"
          style={{ letterSpacing: 2.2, color: tagColor }}
        >
          {card.tag}
        </Text>
      </View>

      {/* Like / comment / share / save chrome, then the like count. */}
      <View
        style={{
          height: FEED_FOOTER_H,
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 4,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <HeartIcon
            size={17}
            color={OB.pink}
            fill={OB.pink}
            strokeWidth={2.2}
          />
          <MessageCircleIcon size={17} color={OB.ink} strokeWidth={2.2} />
          <SendIcon size={17} color={OB.ink} strokeWidth={2.2} />
          <View style={{ flex: 1 }} />
          <BookmarkIcon size={17} color={OB.ink} strokeWidth={2.2} />
        </View>
        <Text className="font-sans-sb text-[12px]" style={{ color: OB.ink }}>
          {card.likes} likes
        </Text>
      </View>
    </View>
  );
}

// ============================================
// VARIANT 2, ISOLATION: two "1 in X" stats with a pie between them.
// Top: 1 in 12 Americans have no close friends (12%).
// Pie: 12% pink + 48% purple, rest faint (Survey Center on American Life 2021).
// Bottom: 1 in 2 have only 1–4 close friends (48%).
// Little colored stubs connect each number to its slice on the ring.
// ============================================

/** Share of adults with zero close friends (pie + "1 in 12"). */
const ISOLATION_NONE_PCT = 0.12;
/** Share of adults with only 1–4 close friends (pie + "1 in 2"). */
const ISOLATION_FEW_PCT = 0.48;

/**
 * Draw a ring slice as a real arc path. 0° = 12 o'clock, degrees run clockwise.
 * (We avoid strokeDashoffset on Circle — it left a blue hole on native.)
 */
function ringArcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const sweep = Math.max(0, endDeg - startDeg);
  if (sweep <= 0.05) return "";
  // Cap just under a full circle so SVG still draws an arc (360° collapses).
  const end = startDeg + Math.min(sweep, 359.9);
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const s = toXY(startDeg);
  const e = toXY(end);
  const large = end - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function IsolationVisual({ reduceMotion }: { reduceMotion: boolean }) {
  const { height: windowHeight } = useWindowDimensions();
  // THIS SECTION DOES: shrink the ring and type on short phones so nothing clips.
  const compact = windowHeight < 780;
  const tight = windowHeight < 700;
  const size = tight ? 150 : compact ? 174 : 216;
  const stroke = tight ? 26 : compact ? 30 : 34;
  const statFont = tight ? 46 : compact ? 54 : 66;
  const captionFont = tight ? 14 : 16;
  const stackGap = tight ? 6 : compact ? 10 : 14;
  const stubLen = tight ? 14 : compact ? 18 : 22;

  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // Overlap neighboring slices a few degrees so butt caps never flash a seam.
  const seamDeg = 2.5;

  // Degrees clockwise from 12 o'clock.
  const noneDeg = 360 * ISOLATION_NONE_PCT;
  const fewDeg = 360 * ISOLATION_FEW_PCT;
  const filledDeg = noneDeg + fewDeg;

  // Top number lands first; pie fills next; bottom number waits for the pie.
  const topDelay = 900;
  const pieDelay = 1200;
  const pieFillMs = 1000;
  const bottomDelay = pieDelay + pieFillMs + 80;

  const topAnim = useCount(topDelay, reduceMotion);
  const bottomAnim = useCount(bottomDelay, reduceMotion);
  const topDenom = useCountUp("12", topDelay, reduceMotion);
  const bottomDenom = useCountUp("2", bottomDelay, reduceMotion);

  const [arcDeg, setArcDeg] = useState(reduceMotion ? filledDeg : 0);
  const pieOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      setArcDeg(filledDeg);
      pieOpacity.setValue(1);
      return;
    }
    // THIS SECTION DOES: fade the ring in, then grow both slices together.
    let raf = 0;
    let startAt = 0;
    const fade = Animated.timing(pieOpacity, {
      toValue: 1,
      delay: pieDelay,
      duration: 280,
      useNativeDriver: NATIVE_DRIVER,
    });
    fade.start();
    const timer = setTimeout(() => {
      const tick = (now: number) => {
        if (!startAt) startAt = now;
        const t = Math.min(1, (now - startAt) / pieFillMs);
        const eased = 1 - Math.pow(1 - t, 3);
        setArcDeg(filledDeg * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, pieDelay);
    return () => {
      fade.stop();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion, pieOpacity, filledDeg]);

  // Split the growing arc: pink first (from 12 o'clock), then purple.
  const shownNoneDeg = Math.min(arcDeg, noneDeg);
  const shownFewDeg = Math.max(0, arcDeg - noneDeg);
  // Quiet rest always fills the leftover so the ring is never an open C.
  const pinkStart = 0;
  const pinkEnd = shownNoneDeg + (shownNoneDeg > 0 ? seamDeg : 0);
  const purpleStart = noneDeg - seamDeg;
  const purpleEnd = noneDeg + shownFewDeg + (shownFewDeg > 0 ? seamDeg : 0);
  const restStart = noneDeg + fewDeg - seamDeg;
  const restEnd = 360 + seamDeg;

  const pinkPath = ringArcPath(cx, cy, r, pinkStart, pinkEnd);
  const purplePath = ringArcPath(
    cx,
    cy,
    r,
    purpleStart,
    Math.max(purpleStart, purpleEnd),
  );
  const restPath = ringArcPath(cx, cy, r, restStart, restEnd);

  // Midpoints of each filled slice for the leader stubs.
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const pinkMidDeg = noneDeg * 0.5;
  const fewMidDeg = noneDeg + fewDeg * 0.5;
  const outerR = r + stroke / 2;
  const pinkAx = cx + outerR * Math.cos(toRad(pinkMidDeg));
  const pinkAy = cy + outerR * Math.sin(toRad(pinkMidDeg));
  const fewAx = cx + outerR * Math.cos(toRad(fewMidDeg));
  const fewAy = cy + outerR * Math.sin(toRad(fewMidDeg));

  // Show each stub once its slice is far enough along to land on real color.
  const showPinkStub = shownNoneDeg > noneDeg * 0.55;
  const showFewStub = shownFewDeg > fewDeg * 0.35;

  // Extra vertical room above/below the ring so the stubs are not clipped.
  const stubPad = stubLen + 6;
  const svgH = size + stubPad * 2;
  // Re-map attach points into the taller SVG (ring is shifted down by stubPad).
  const pinkAySvg = pinkAy + stubPad;
  const fewAySvg = fewAy + stubPad;
  // Tips stop short of the SVG edge so they tuck under the blue text blocks.
  const pinkTipX = cx;
  const pinkTipYSvg = 8;
  const fewTipX = cx;
  const fewTipYSvg = svgH - 8;

  // Shift every ring path down by stubPad (paths were built around cy, not ringCy).
  const ringTransform = `translate(0, ${stubPad})`;

  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        gap: stackGap,
        flexShrink: 1,
      }}
    >
      {/* TOP STAT: sits above the stubs (zIndex) so leader lines never cross the type.
          Blue fill matches the page so any stub tip under here stays hidden. */}
      <Animated.View
        style={[
          {
            alignItems: "center",
            zIndex: 2,
            elevation: 2,
            backgroundColor: OB.blue,
            paddingBottom: 4,
            paddingHorizontal: 8,
          },
          topAnim,
        ]}
      >
        <Text
          className="font-display tracking-tight"
          style={{
            color: ON_BLUE_ACCENT,
            letterSpacing: -2,
            fontSize: statFont,
            lineHeight: Math.round(statFont * 1.08),
            paddingTop: 6,
          }}
          accessibilityRole="header"
        >
          {`1 IN ${topDenom}`}
        </Text>
        <Text
          className="mt-1.5 max-w-[300px] text-center font-sans-sb leading-snug"
          style={{ color: ON_BLUE, fontSize: captionFont }}
        >
          Americans have no close friends.
        </Text>
      </Animated.View>

      {/* THE PIE + STUBS: three solid arcs (pink / purple / quiet rest), no gap. */}
      <Animated.View
        style={{ opacity: pieOpacity, flexShrink: 1, zIndex: 0 }}
      >
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Svg width={size} height={svgH}>
            {/* THIS SECTION DOES: draw stubs first so the ring paints over them. */}
            {showPinkStub ? (
              <>
                <Path
                  d={`M ${pinkAx} ${pinkAySvg} L ${pinkAx} ${pinkTipYSvg + 6} L ${pinkTipX} ${pinkTipYSvg}`}
                  stroke={ON_BLUE_ACCENT}
                  strokeWidth={2.25}
                  fill="none"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
                <Line
                  x1={pinkTipX - 8}
                  y1={pinkTipYSvg}
                  x2={pinkTipX + 8}
                  y2={pinkTipYSvg}
                  stroke={ON_BLUE_ACCENT}
                  strokeWidth={2.25}
                  strokeLinecap="square"
                />
              </>
            ) : null}
            {showFewStub ? (
              <>
                <Path
                  d={`M ${fewAx} ${fewAySvg} L ${fewAx} ${fewTipYSvg - 6} L ${fewTipX} ${fewTipYSvg}`}
                  stroke={OB.purple}
                  strokeWidth={2.25}
                  fill="none"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
                <Line
                  x1={fewTipX - 8}
                  y1={fewTipYSvg}
                  x2={fewTipX + 8}
                  y2={fewTipYSvg}
                  stroke={OB.purple}
                  strokeWidth={2.25}
                  strokeLinecap="square"
                />
              </>
            ) : null}

            {/* Quiet rest (~40%) — third color, always fills the leftover. */}
            {restPath ? (
              <Path
                d={restPath}
                transform={ringTransform}
                stroke="rgba(255,255,255,0.38)"
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="butt"
              />
            ) : null}
            {/* 48% purple (under pink at the join). */}
            {shownFewDeg > 0 && purplePath ? (
              <Path
                d={purplePath}
                transform={ringTransform}
                stroke={OB.purple}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="butt"
              />
            ) : null}
            {/* 12% pink — no close friends (matches the top "1 in 12"). */}
            {shownNoneDeg > 0 && pinkPath ? (
              <Path
                d={pinkPath}
                transform={ringTransform}
                stroke={ON_BLUE_ACCENT}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="butt"
              />
            ) : null}

            {/* Attach dots last so they sit on the outer rim of the ring. */}
            {showPinkStub ? (
              <Circle
                cx={pinkAx}
                cy={pinkAySvg}
                r={3.5}
                fill={ON_BLUE_ACCENT}
              />
            ) : null}
            {showFewStub ? (
              <Circle cx={fewAx} cy={fewAySvg} r={3.5} fill={OB.purple} />
            ) : null}
          </Svg>
        </View>
      </Animated.View>

      {/* BOTTOM STAT: same blue plate + zIndex so purple stubs stay under the type. */}
      <Animated.View
        style={[
          {
            alignItems: "center",
            zIndex: 2,
            elevation: 2,
            backgroundColor: OB.blue,
            paddingTop: 4,
            paddingHorizontal: 8,
          },
          bottomAnim,
        ]}
      >
        <Text
          className="font-display tracking-tight"
          style={{
            color: OB.purple,
            letterSpacing: -2,
            fontSize: statFont,
            lineHeight: Math.round(statFont * 1.08),
            paddingTop: 6,
          }}
          accessibilityRole="header"
        >
          {`1 IN ${bottomDenom}`}
        </Text>
        <Text
          className="mt-1.5 max-w-[300px] text-center font-sans-sb leading-snug"
          style={{ color: ON_BLUE, fontSize: captionFont }}
        >
          have only 1–4 close friends.
        </Text>
      </Animated.View>
    </View>
  );
}

// ============================================
// VARIANT 3, RETENTION: 235 purple squares + 5 yellow on a separate row
// (240 total). Big 240 is purple like the grid; FIVE matches the yellow row.
// Square size shrinks to fit leftover height so the stats under the grid
// never get cut off on short phones.
// ============================================
/** Yellow fill for the five remembered video squares (same as FIVE). */
const RETENTION_REMEMBER_COLOR = OB.amber;
const RETENTION_COLS = 16;
/** Forgotten-video rows; the five remembered squares sit under the grid. */
const RETENTION_FORGOT_ROWS = 14;
const RETENTION_FORGOT_PARTIAL = 11;
const RETENTION_FORGOT_TOTAL =
  RETENTION_FORGOT_ROWS * RETENTION_COLS + RETENTION_FORGOT_PARTIAL;
const RETENTION_REMEMBERED = 5;
const RETENTION_TOTAL = RETENTION_FORGOT_TOTAL + RETENTION_REMEMBERED;
/** Tight gap so the squares sit close together. */
const RETENTION_GAP = 2;
/** Largest square we allow when there is room. */
const RETENTION_CELL_MAX = 14;
/** Smallest square so the full grid still reads on very short phones. */
const RETENTION_CELL_MIN = 5;
/** How long the whole 240-cell fill takes once it starts. */
const RETENTION_FILL_MS = 900;
/** Wait so the headline can land before the squares start racing in. */
const RETENTION_START_DELAY_MS = 400;
/** Forgot grid rows including the short last row. */
const RETENTION_FORGOT_ROW_COUNT = RETENTION_FORGOT_ROWS + 1;
/** Cell rows in the whole picture (forgot block + remembered row). */
const RETENTION_CELL_ROW_COUNT = RETENTION_FORGOT_ROW_COUNT + 1;
/** Gaps + padding that sit around the cells (not part of cell height). */
const RETENTION_VERTICAL_CHROME =
  (RETENTION_FORGOT_ROW_COUNT - 1) * RETENTION_GAP +
  (RETENTION_GAP + 2) +
  8;

function RetentionVisual({ reduceMotion }: { reduceMotion: boolean }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [shown, setShown] = useState(reduceMotion ? RETENTION_TOTAL : 0);
  // Height left for the grid after headline / stats / button. onLayout refines
  // this; the window guess keeps the first paint from oversized squares.
  const [areaH, setAreaH] = useState(() =>
    Math.max(80, Math.floor(windowHeight * 0.28)),
  );

  useEffect(() => {
    if (reduceMotion) {
      setShown(RETENTION_TOTAL);
      return;
    }
    setShown(0);
    let raf = 0;
    let startAt = 0;
    const tick = (now: number) => {
      if (!startAt) startAt = now;
      const t = Math.min(1, (now - startAt) / RETENTION_FILL_MS);
      setShown(Math.floor(t * RETENTION_TOTAL));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setShown(RETENTION_TOTAL);
    };
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, RETENTION_START_DELAY_MS);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

  // THIS SECTION DOES: pick a square size that fits both the phone width and
  // the leftover height, so the grid never pushes the 240 / captions off-screen.
  const availW = Math.max(0, windowWidth - 48);
  const cellFromW = Math.floor(
    (availW - (RETENTION_COLS - 1) * RETENTION_GAP) / RETENTION_COLS,
  );
  const cellFromH = Math.floor(
    (Math.max(0, areaH) - RETENTION_VERTICAL_CHROME) / RETENTION_CELL_ROW_COUNT,
  );
  const cell = Math.max(
    RETENTION_CELL_MIN,
    Math.min(RETENTION_CELL_MAX, cellFromW, cellFromH),
  );
  const gridW = RETENTION_COLS * cell + (RETENTION_COLS - 1) * RETENTION_GAP;
  const rememberedW =
    RETENTION_REMEMBERED * cell +
    (RETENTION_REMEMBERED - 1) * RETENTION_GAP;

  const forgotCells = RETENTION_FORGOT_TOTAL;
  const rememberedCells = RETENTION_REMEMBERED;

  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
      onLayout={(e) => {
        const next = Math.floor(e.nativeEvent.layout.height);
        if (next > 0) setAreaH((prev) => (prev === next ? prev : next));
      }}
    >
      <View
        style={{
          width: "100%",
          alignItems: "center",
          paddingVertical: 4,
          gap: RETENTION_GAP + 2,
        }}
      >
        {/* Forgotten block: 14 full rows + 11 on the last row (235 videos). */}
        <View
          style={{
            width: gridW,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: RETENTION_GAP,
          }}
          accessibilityLabel="Two hundred forty video squares, five you'll remember"
        >
          {Array.from({ length: forgotCells }, (_, i) => (
            <View
              key={`p-${i}`}
              style={{
                width: cell,
                height: cell,
                borderRadius: 2,
                backgroundColor: OB.purple,
                opacity: i < shown ? 1 : 0,
              }}
            />
          ))}
        </View>

        {/* Five remembered: own row under the grid, same yellow as FIVE. */}
        <View
          style={{
            width: rememberedW,
            flexDirection: "row",
            gap: RETENTION_GAP,
            justifyContent: "center",
          }}
        >
          {Array.from({ length: rememberedCells }, (_, i) => {
            const index = forgotCells + i;
            return (
              <View
                key={`y-${i}`}
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: 2,
                  backgroundColor: RETENTION_REMEMBER_COLOR,
                  opacity: index < shown ? 1 : 0,
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}
