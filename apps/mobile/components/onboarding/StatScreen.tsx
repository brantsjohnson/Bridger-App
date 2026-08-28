// ============================================
// WHAT THIS FILE DOES (plain English):
// The four "quick reality check" full-screen moments between onboarding
// questions. Each one states a hard truth on a flat blue background, shows a
// colorful animated picture of that stat, counts the big number up from zero,
// lets you tap a small "i" next to "A quick reality check" to see the sources,
// and ends with "Let's try again." The screen-time one is a story: an 80-year
// life colors in beat by beat, and the green button waits until the last number
// lands.
//
// The feed screen is special: Instagram-style posts snap upward one at a time
// (ads in orange, the one FRIEND post in green), with like and comment chrome.
// The post sits in the middle of the page as a fuller square (square photo
// area, header and likes around it), with the counting 18% right under it.
//
// LOOK: flat blue page (no graph-paper overlay), cream display type that stays
// light in dark mode, light red for accent type on blue,
// the display font for the headline, and a green
// square "Let's try again" button at the bottom.
//
// ACCESSIBILITY: all the moving art is marked decorative and the stat is always
// shown as plain text too. When the phone asks for reduced motion, the art
// snaps to its final state instead of animating, and the number jumps straight
// to the end.
// ============================================
import React, { useEffect, useRef, useState } from "react";
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
import Svg, { Circle } from "react-native-svg";
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
  // Screen-time waits until the final "4.0 years…" caption finishes typing.
  const [lifeReady, setLifeReady] = useState(variant !== "screentime");
  const reduce = useReduceMotion();
  const showFooter = variant !== "screentime" || lifeReady;
  const insets = useSafeAreaInsets();
  // Stable so ScreenTimeVisual's "I'm done" callback does not reset every render.
  const onLifeComplete = () => setLifeReady(true);

  // THIS SECTION DOES: staggered entrance for the two headline lines + number.
  const line1 = useRise(80, reduce);
  const line2 = useRise(560, reduce);
  const numberDelay = 1080;
  const numberAnim = useCount(numberDelay, reduce);
  // Counts 0 → 18 (or 240) so the big number feels like it is climbing.
  const countedNumber = useCountUp(c.number, numberDelay, reduce);
  // Every variant puts the picture first, then the big number under it. The feed
  // card is the star: a fuller square in the middle band, with 18% under it.
  // Gaps stay roomy so the headline, card, %, caption, and button never stack flush.
  const stackGap =
    variant === "isolation"
      ? 12
      : variant === "feed"
        ? 16
        : variant === "retention"
          ? 20
          : 20;

  const numberBlock = c.number ? (
    <Animated.View
      style={[{ alignItems: "center", flexShrink: 0 }, numberAnim]}
    >
      <Text
        className={
          variant === "isolation"
            ? "font-display text-[104px] leading-[0.8] tracking-tight"
            : variant === "feed"
              ? "font-display text-[58px] leading-[0.86] tracking-tight"
              : variant === "retention"
                ? "font-display text-[72px] leading-[0.84] tracking-tight"
                : "font-display text-[88px] leading-[0.84] tracking-tight"
        }
        style={{ color: c.numberColor, letterSpacing: -3 }}
        accessibilityRole="header"
      >
        {countedNumber}
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
            <Text
              className="font-sans-b text-[16px]"
              style={{ color: OB.amber }}
            >
              FIVE
            </Text>
            .
          </Text>
        </View>
      ) : (
        <Text
          className={
            variant === "isolation"
              ? "mt-3 max-w-[290px] text-center font-sans-sb text-[18px] leading-snug"
              : "mt-3 max-w-[320px] text-center font-sans-sb text-[16px] leading-snug"
          }
          style={{ color: ON_BLUE }}
        >
          {c.caption}
        </Text>
      )}
    </Animated.View>
  ) : null;

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
          gap: 22,
          paddingHorizontal: 24,
          paddingTop: insets.top + 14,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        }}
      >
        {/* THIS SECTION DOES: the "A quick reality check" eyebrow, with a small
            info button that opens the citations sheet. */}
        <View style={{ gap: 18, flexShrink: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              className="font-sans-sb text-[12px] uppercase tracking-[1.6px]"
              style={{ color: ON_BLUE_ACCENT }}
            >
              A quick reality check
            </Text>
            {/* ACCESSIBILITY: 44pt tap target around a small "i" so the sources
                stay easy to find without a second link under the picture. */}
            <Pressable
              onPress={withAnalyticsPress(
                ONBOARDING.stat.info,
                () => setSourcesOpen(true),
                {
                  analyticsProps: { variant },
                },
              )}
              accessibilityRole="button"
              accessibilityLabel="Where this comes from"
              hitSlop={10}
              style={{
                width: 28,
                height: 28,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <InfoIcon
                size={16}
                color="rgba(245,240,230,0.85)"
                strokeWidth={2.4}
              />
            </Pressable>
          </View>

          <AnalyticsRegion
            analyticsId={ONBOARDING.stat.headline}
            interactive={false}
          >
            <View>
              <Animated.View style={line1}>
                <DisplayLine line={c.line1} compact={variant === "feed"} />
              </Animated.View>
              <Animated.View
                style={[{ marginTop: variant === "feed" ? 8 : 16 }, line2]}
              >
                <DisplayLine line={c.line2} compact={variant === "feed"} />
              </Animated.View>
            </View>
          </AnalyticsRegion>
        </View>

        {/* THIS SECTION DOES: the animated picture, then the big counting number
            under it. Feed centers the square post in the middle band. Screen time
            fills the leftover height so its 80 year lines can shrink to fit. */}
        <View
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            gap: stackGap,
            justifyContent: variant === "screentime" ? "flex-start" : "center",
            alignItems: "center",
          }}
        >
          <View
            accessibilityElementsHidden={variant !== "screentime"}
            importantForAccessibility={
              variant === "screentime" ? "yes" : "no-hide-descendants"
            }
            style={
              variant === "screentime"
                ? { flex: 1, minHeight: 0, width: "100%" }
                : variant === "feed" || variant === "retention"
                  ? { width: "100%", flexShrink: 0, alignItems: "center" }
                  : { width: "100%" }
            }
          >
            {variant === "feed" ? <FeedVisual reduceMotion={reduce} /> : null}
            {variant === "retention" ? (
              <RetentionVisual reduceMotion={reduce} />
            ) : null}
            {variant === "screentime" ? (
              <ScreenTimeVisual
                reduceMotion={reduce}
                onComplete={onLifeComplete}
              />
            ) : null}
          </View>
          {/* Isolation: top "1 in 12", pie (12% + 48%), bottom "1 in 2". */}
          {variant === "isolation" ? (
            <IsolationVisual reduceMotion={reduce} />
          ) : null}
          {/* Isolation draws its own numbers; other variants use the shared block. */}
          {variant !== "isolation" ? numberBlock : null}
        </View>

        {/* THIS SECTION DOES: the green "Let's try again" CTA on the blue page.
            On screen-time it waits until the 4.0 caption finishes typing. The
            button slot is always reserved so the life bars do not jump when it
            fades in. Back stays so you are never stuck. */}
        <View
          style={{
            gap: 16,
            flexShrink: 0,
            width: "100%",
          }}
        >
          {variant === "screentime" ? (
            <View
              // Invisible until ready: same height as OBCTA so space-between
              // never reflows the year bars when the CTA appears.
              pointerEvents={showFooter ? "auto" : "none"}
              accessible={showFooter}
              accessibilityElementsHidden={!showFooter}
              importantForAccessibility={
                showFooter ? "yes" : "no-hide-descendants"
              }
              style={{ opacity: showFooter ? 1 : 0 }}
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
          ) : showFooter ? (
            <OBCTA
              label="Let's try again"
              tone="green"
              analyticsId={ONBOARDING.stat.bridge}
              analyticsProps={{ variant }}
              onPress={onBridge}
              accessibilityLabel="Let's try again"
            />
          ) : null}
          {onBack ? (
            <Pressable
              onPress={withAnalyticsPress(ONBOARDING.chrome.back, onBack)}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="items-center py-2"
            >
              <Text
                className="font-sans-sb text-[13px]"
                style={{ color: ON_BLUE_MUTE }}
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

/** One headline line with an optional underlined key phrase. */
function DisplayLine({
  line,
  compact = false,
}: {
  line: StatLine;
  /** Slightly smaller on the feed screen so the post graphic fits below. */
  compact?: boolean;
}) {
  return (
    // Line height stays a hair above the font size so wrapped lines never sit
    // on top of each other (leading under 1.0 was crushing "live life" / "product").
    // Color is fixed cream so dark mode cannot turn this black on the blue page.
    <Text
      className={
        compact
          ? "font-display text-[26px] uppercase tracking-tight"
          : "font-display text-[30px] uppercase tracking-tight"
      }
      style={{ lineHeight: compact ? 30 : 34, color: ON_BLUE }}
    >
      {line.text}
      {line.underline ? (
        <Text className="underline" style={{ textDecorationLine: "underline" }}>
          {line.underline}
        </Text>
      ) : null}
      {line.underline ? "." : null}
    </Text>
  );
}

/** Fade + rise entrance for a headline line. */
function useRise(delay: number, reduce: boolean) {
  const opacity = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const y = useRef(new Animated.Value(reduce ? 0 : 18)).current;
  useEffect(() => {
    if (reduce) {
      opacity.setValue(1);
      y.setValue(0);
      return;
    }
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        delay,
        duration: 480,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(y, {
        toValue: 0,
        delay,
        duration: 480,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, reduce, opacity, y]);
  return { opacity, transform: [{ translateY: y }] };
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

function FeedVisual({ reduceMotion }: { reduceMotion: boolean }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(0)).current;
  const steps = FEED_CARDS.length - 1;

  // THIS SECTION DOES: size a real square photo, then add header + likes around it.
  // Side grows with the phone (fuller), but never past FEED_MEDIA_MAX or ~36% of height.
  const mediaSide = Math.min(
    FEED_MEDIA_MAX,
    windowWidth - 48,
    Math.max(220, Math.floor(windowHeight * 0.36)),
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
// Pie: 12% purple + 48% lavender, rest faint (Survey Center on American Life 2021).
// Bottom: 1 in 2 have only 1–4 close friends (48%).
// ============================================

/** Share of adults with zero close friends (pie + "1 in 12"). */
const ISOLATION_NONE_PCT = 0.12;
/** Share of adults with only 1–4 close friends (pie + "1 in 2"). */
const ISOLATION_FEW_PCT = 0.48;

function IsolationVisual({ reduceMotion }: { reduceMotion: boolean }) {
  // Ring size and thickness, matched to the look of the design screenshot.
  const size = 200;
  const stroke = 32;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const noneLen = circ * ISOLATION_NONE_PCT;
  const fewLen = circ * ISOLATION_FEW_PCT;
  const filledLen = noneLen + fewLen;

  // Top number lands first; pie fills next; bottom number waits for the pie.
  const topDelay = 900;
  const pieDelay = 1200;
  const pieFillMs = 1000;
  const bottomDelay = pieDelay + pieFillMs + 80;

  const topAnim = useCount(topDelay, reduceMotion);
  const bottomAnim = useCount(bottomDelay, reduceMotion);
  const topDenom = useCountUp("12", topDelay, reduceMotion);
  const bottomDenom = useCountUp("2", bottomDelay, reduceMotion);

  const [arcLen, setArcLen] = useState(reduceMotion ? filledLen : 0);
  const pieOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      setArcLen(filledLen);
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
        setArcLen(filledLen * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, pieDelay);
    return () => {
      fade.stop();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion, pieOpacity, filledLen]);

  // Split the growing arc into the 12% slice, then the 48% slice.
  const shownNone = Math.min(arcLen, noneLen);
  const shownFew = Math.max(0, arcLen - noneLen);

  return (
    <View style={{ width: "100%", alignItems: "center", gap: 14 }}>
      {/* TOP STAT: 1 in 12 have no close friends. */}
      <Animated.View style={[{ alignItems: "center" }, topAnim]}>
        <Text
          className="font-display text-[56px] leading-[0.86] tracking-tight"
          style={{ color: ON_BLUE_ACCENT, letterSpacing: -2 }}
          accessibilityRole="header"
        >
          {`1 IN ${topDenom}`}
        </Text>
        <Text
          className="mt-2 max-w-[300px] text-center font-sans-sb text-[16px] leading-snug"
          style={{ color: ON_BLUE }}
        >
          Americans have no close friends.
        </Text>
      </Animated.View>

      {/* THE PIE: faint rest, purple 12%, lavender 48%. Decorative only. */}
      <Animated.View style={{ opacity: pieOpacity }}>
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {/*
            WEB NOTE: do not use transform={`rotate(-90 cx cy)`} on Circle.
            NativeWind's JSX runtime treats `transform` like CSS and emits a
            kebab-case `transform-origin` DOM prop, which React rejects.
            strokeDashoffset shifts the dash start the same way (12 o'clock
            is one quarter of the ring; the purple slice starts after 12%).
          */}
          <Svg width={size} height={size}>
            {/* Rest of adults (about 40%) — quiet base ring. */}
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={stroke}
              fill="none"
            />
            {/* 12% — no close friends (matches the top "1 in 12"). */}
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={ON_BLUE_ACCENT}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${shownNone} ${circ}`}
              strokeDashoffset={circ * 0.25}
              strokeLinecap="butt"
            />
            {/* 48% — only 1–4 close friends (matches the bottom "1 in 2"). */}
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={OB.purple}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${shownFew} ${circ}`}
              strokeDashoffset={circ * 0.25 - noneLen}
              strokeLinecap="butt"
            />
          </Svg>
        </View>
      </Animated.View>

      {/* BOTTOM STAT: 1 in 2 have only 1–4 close friends. */}
      <Animated.View style={[{ alignItems: "center" }, bottomAnim]}>
        <Text
          className="font-display text-[56px] leading-[0.86] tracking-tight"
          style={{ color: OB.purple, letterSpacing: -2 }}
          accessibilityRole="header"
        >
          {`1 IN ${bottomDenom}`}
        </Text>
        <Text
          className="mt-2 max-w-[300px] text-center font-sans-sb text-[16px] leading-snug"
          style={{ color: ON_BLUE }}
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
/** Largest square we allow on small phones. */
const RETENTION_CELL_MAX = 14;
/** How long the whole 240-cell fill takes once it starts. */
const RETENTION_FILL_MS = 900;
/** Wait so the headline can land before the squares start racing in. */
const RETENTION_START_DELAY_MS = 400;

function RetentionVisual({ reduceMotion }: { reduceMotion: boolean }) {
  const { width: windowWidth } = useWindowDimensions();
  const [shown, setShown] = useState(reduceMotion ? RETENTION_TOTAL : 0);

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

  const availW = Math.max(0, windowWidth - 48);
  const cell = Math.max(
    10,
    Math.min(
      RETENTION_CELL_MAX,
      Math.floor(
        (availW - (RETENTION_COLS - 1) * RETENTION_GAP) / RETENTION_COLS,
      ),
    ),
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
  );
}
