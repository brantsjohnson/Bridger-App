// ============================================
// WHAT THIS FILE DOES (plain English):
// The four "quick reality check" full-screen moments between onboarding
// questions. Each one states a hard truth on a flat blue background, shows a
// colorful animated picture of that stat, counts the big number up from zero,
// lets you tap a small "i" next to "A quick reality check" to see the sources,
// and ends with "Let's try again." The screen-time one is a story: an 80-year
// life colors in beat by beat, and the pink button waits until the last number
// lands.
//
// The feed screen is special: Instagram-style square posts snap upward one at
// a time (ads in orange, the one FRIEND post in green), with like and comment
// chrome. The post window sits ABOVE the counting 18% and grows to fill most
// of the leftover screen so it is the main thing you see.
//
// LOOK: flat blue page with a faint white grid over it, the display font for the
// headline, and the shared pink rounded Continue pill at the bottom.
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
import Svg, { Circle, Path, Line } from "react-native-svg";
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
    numberColor: "#FF3E8A",
  },
  isolation: {
    line1: {
      text: "The internet was supposed to help us ",
      underline: "make friends",
    },
    line2: { text: "Instead, it ", underline: "isolated us" },
    number: "65%",
    caption: "of adults have only 0-4 close friends",
    sources: [
      "Survey Center on American Life: Friendship Survey",
      "Pew Research Center: Close Friendships in America",
    ],
    numberColor: "#FF3E8A",
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
    // Pink like the video squares; the five you'll remember share RETENTION_YELLOW.
    numberColor: "#FF3E8A",
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
      "U.S. Bureau of Labor Statistics: American Time Use Survey (sleep, work, daily life, commuting, exercise, in-person socializing)",
      "Work and school hours are averaged across all 80 years, including childhood, weekends, holidays, and retirement",
    ],
    numberColor: "#FF3E8A",
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
  // Screen-time waits for the last life-story beat before the button appears.
  const [lifeReady, setLifeReady] = useState(variant !== "screentime");
  const reduce = useReduceMotion();
  const showFooter = variant !== "screentime" || lifeReady;
  const insets = useSafeAreaInsets();
  // Window size for pictures that need a real pixel measure (the isolation pie
  // card). The page itself fills 100% of the display so it stays dynamic.
  const { width: windowWidth } = useWindowDimensions();
  // Stable so ScreenTimeVisual's "I'm done" timer does not reset every render.
  const onLifeComplete = () => setLifeReady(true);

  // THIS SECTION DOES: staggered entrance for the two headline lines + number.
  const line1 = useRise(80, reduce);
  const line2 = useRise(560, reduce);
  // Isolation waits for the pie to finish filling before the % starts counting.
  const pieFillMs = 1000;
  const numberDelay = variant === "isolation" ? 1080 + pieFillMs + 120 : 1080;
  const numberAnim = useCount(numberDelay, reduce);
  // Counts 0 → 18 (or 65 / 240) so the big number feels like it is climbing.
  const countedNumber = useCountUp(c.number, numberDelay, reduce);
  // Every variant puts the picture first, then the big number under it. The feed
  // card is the star of that screen, so it sits above the 18% and grows tall.
  const stackGap =
    variant === "isolation"
      ? 8
      : variant === "feed"
        ? 16
        : variant === "retention"
          ? 28
          : 12;

  const numberBlock = c.number ? (
    <Animated.View
      style={[{ alignItems: "center", flexShrink: 0 }, numberAnim]}
    >
      <Text
        className={
          variant === "isolation"
            ? "font-display text-[104px] leading-[0.8] tracking-tight"
            : variant === "feed"
              ? "font-display text-[72px] leading-[0.84] tracking-tight"
              : "font-display text-[96px] leading-[0.84] tracking-tight"
        }
        style={{ color: c.numberColor, letterSpacing: -3 }}
        accessibilityRole="header"
      >
        {countedNumber}
      </Text>
      {/* Retention: TWO caption lines with a gap; FIVE uses the same yellow as the
            five remembered squares in the grid (shared RETENTION_YELLOW). */}
      {variant === "retention" ? (
        <View
          style={{ marginTop: 8, maxWidth: 320, alignItems: "center", gap: 12 }}
        >
          <Text className="text-center font-sans-sb text-[16px] leading-snug text-canvas">
            videos watched an hour.
          </Text>
          <Text className="text-center font-sans-sb text-[16px] leading-snug text-canvas">
            {"You'll remember fewer than "}
            <Text style={{ color: RETENTION_YELLOW }}>FIVE</Text>.
          </Text>
        </View>
      ) : (
        <Text
          className={
            variant === "isolation"
              ? "mt-2 max-w-[290px] text-center font-sans-sb text-[18px] leading-snug text-canvas"
              : "mt-1.5 max-w-[320px] text-center font-sans-sb text-[16px] leading-snug text-canvas"
          }
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
      {/* THE PAPER: the faint white grid the design draws over the blue. */}
      <StatGrid />

      <View
        style={{
          flex: 1,
          width: "100%",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingTop: insets.top + 14,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        }}
      >
        {/* THIS SECTION DOES: the "A quick reality check" eyebrow, with a small
            info button that opens the citations sheet. */}
        <View style={{ gap: 12, flexShrink: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text className="font-sans-sb text-[12px] uppercase tracking-[1.6px] text-coral">
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
                <DisplayLine line={c.line1} />
              </Animated.View>
              <Animated.View style={[{ marginTop: 12 }, line2]}>
                <DisplayLine line={c.line2} />
              </Animated.View>
            </View>
          </AnalyticsRegion>
        </View>

        {/* THIS SECTION DOES: the animated picture, then the big counting number
            under it. On the feed screen the post window grows to fill most of
            the leftover height so it is the main thing you see. Screen time
            also fills the leftover height so its 80 year lines can shrink to fit. */}
        <View
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            marginVertical: 10,
            gap: stackGap,
            justifyContent:
              variant === "feed" ||
              variant === "screentime" ||
              variant === "retention"
                ? "flex-start"
                : "center",
          }}
        >
          <View
            accessibilityElementsHidden={variant !== "screentime"}
            importantForAccessibility={
              variant === "screentime" ? "yes" : "no-hide-descendants"
            }
            style={
              variant === "feed" ||
              variant === "screentime" ||
              variant === "retention"
                ? { flex: 1, minHeight: 0, width: "100%" }
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
          {/* Isolation keeps the ring + elbow + 65% together so the line can
              land on the number. The number is real content, so it is not
              marked decorative. */}
          {variant === "isolation" ? (
            <IsolationVisual
              reduceMotion={reduce}
              number={countedNumber}
              caption={c.caption}
              numberColor={c.numberColor}
              numberAnim={numberAnim}
            />
          ) : null}
          {/* Isolation draws its own 65% under the ring so the elbow can land on it. */}
          {variant !== "isolation" ? numberBlock : null}
        </View>

        {/* THIS SECTION DOES: the pink "Let's try again" CTA. On screen-time it
            waits until the life story finishes. Back stays so you are never stuck. */}
        <View style={{ gap: 12, flexShrink: 0, width: "100%" }}>
          {showFooter ? (
            <OBCTA
              label="Let's try again"
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
              className="items-center py-1"
            >
              <Text className="font-sans-sb text-[13px] text-canvas/60">
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
/**
 * The faint white graph paper the design lays over the blue page: thin lines
 * every 46 points, both ways. Pure decoration, so it is hidden from screen
 * readers and never eats a tap.
 */
function StatGrid() {
  const { width, height } = useWindowDimensions();
  const step = 46;
  const cols = Math.ceil(width / step);
  const rows = Math.ceil(height / step);
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
    >
      {Array.from({ length: cols }, (_, i) => (
        <View
          key={`v${i}`}
          style={{
            position: "absolute",
            left: i * step,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: "rgba(255,255,255,0.12)",
          }}
        />
      ))}
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={`h${i}`}
          style={{
            position: "absolute",
            top: i * step,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </View>
  );
}

/** One headline line with an optional underlined key phrase. */
function DisplayLine({ line }: { line: StatLine }) {
  return (
    // Line height stays a hair above the font size so wrapped lines never sit
    // on top of each other (leading under 1.0 was crushing "live life" / "product").
    <Text
      className="font-display text-[34px] uppercase tracking-tight text-canvas"
      style={{ lineHeight: 38 }}
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
 * Count the digits from 0 up to the target ("18%", "65%", "240"), so the big
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
// The window sits ABOVE the 18% and grows to fill most of the leftover screen.
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

/** How the tall post is carved up: header, photo, and the like row. */
const FEED_HEADER_H = 44;
const FEED_FOOTER_H = 64;

function FeedVisual({ reduceMotion }: { reduceMotion: boolean }) {
  // Measure the leftover room so the post can grow with the phone, not stay a
  // fixed postage stamp under the big number.
  const { width: windowWidth } = useWindowDimensions();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const translateY = useRef(new Animated.Value(0)).current;
  const steps = FEED_CARDS.length - 1;

  // Nearly full width, and as tall as the room will allow (leave a little air).
  const cardW = Math.max(
    260,
    Math.min(windowWidth - 40, box.w > 0 ? box.w : windowWidth - 40),
  );
  const cardH = Math.max(320, box.h > 0 ? Math.floor(box.h * 0.98) : 360);
  const mediaH = Math.max(180, cardH - FEED_HEADER_H - FEED_FOOTER_H);

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
        flex: 1,
        minHeight: 0,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
      accessible={false}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== box.w || height !== box.h)
          setBox({ w: width, h: height });
      }}
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
          gap: 10,
          paddingHorizontal: 14,
        }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            backgroundColor: OB.canvas,
            borderWidth: OB_BORDER,
            borderColor: card.friend ? OB.green : OB.pink,
          }}
        />
        <Text
          className="font-sans-sb text-[14px]"
          style={{ flex: 1, color: OB.ink }}
          numberOfLines={1}
        >
          {card.name}
        </Text>
        <Text
          className="font-sans-b text-[16px]"
          style={{ color: "rgba(0,0,0,0.5)" }}
        >
          ⋮
        </Text>
      </View>

      {/* The photo stand-in: orange for ads, green for the one friend. Grows with the card. */}
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
          className="font-sans-b text-[28px]"
          style={{ letterSpacing: 3, color: tagColor }}
        >
          {card.tag}
        </Text>
      </View>

      {/* Like / comment / share / save chrome, then the like count. */}
      <View
        style={{
          height: FEED_FOOTER_H,
          paddingHorizontal: 14,
          paddingVertical: 10,
          gap: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <HeartIcon
            size={20}
            color={OB.pink}
            fill={OB.pink}
            strokeWidth={2.2}
          />
          <MessageCircleIcon size={20} color={OB.ink} strokeWidth={2.2} />
          <SendIcon size={20} color={OB.ink} strokeWidth={2.2} />
          <View style={{ flex: 1 }} />
          <BookmarkIcon size={20} color={OB.ink} strokeWidth={2.2} />
        </View>
        <Text className="font-sans-sb text-[14px]" style={{ color: OB.ink }}>
          {card.likes} likes
        </Text>
      </View>
    </View>
  );
}

// ============================================
// VARIANT 2, ISOLATION: a pink/lavender ring that fills to 65%, with an elbow
// line from the pink rim down to the big counting number underneath.
// ============================================

function IsolationVisual({
  reduceMotion,
  number,
  caption,
  numberColor,
  numberAnim,
}: {
  reduceMotion: boolean;
  number: string;
  caption: string;
  numberColor: string;
  /** Fade + rise style from useCount, applied to the 65% block. */
  numberAnim: object;
}) {
  // Ring size and thickness, matched to the look of the design screenshot.
  const size = 220;
  const stroke = 34;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  // Extra room on the right so the elbow can jog out before dropping down.
  const padRight = 56;
  const gap = 22;
  const canvasW = size + padRight;
  const circleLeft = 0;

  // Attach on the pink arc, about halfway through it (near 3 o'clock), on the
  // outer rim so the line clearly leaves the pink, not the hole.
  const attachDeg = -90 + 360 * 0.65 * 0.5;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const attachR = r + stroke / 2;
  const ax = circleLeft + cx + attachR * Math.cos(toRad(attachDeg));
  const ay = cy + attachR * Math.sin(toRad(attachDeg));
  // Elbow: out to the right, then down, then in to the center above "65%".
  const elbowX = ax + 40;
  const dropY = size + gap + 8;
  const tipX = circleLeft + cx;
  const tipY = dropY;

  const [pinkLen, setPinkLen] = useState(reduceMotion ? circ * 0.65 : 0);
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      setPinkLen(circ * 0.65);
      opacity.setValue(1);
      return;
    }
    // Fade the ring in, then grow the pink arc from empty to 65%.
    let raf = 0;
    let startAt = 0;
    const fillDuration = 1000;
    const fillDelay = 1080;
    const target = circ * 0.65;
    const fade = Animated.timing(opacity, {
      toValue: 1,
      delay: fillDelay,
      duration: 280,
      useNativeDriver: NATIVE_DRIVER,
    });
    fade.start();
    const timer = setTimeout(() => {
      const tick = (now: number) => {
        if (!startAt) startAt = now;
        const t = Math.min(1, (now - startAt) / fillDuration);
        const eased = 1 - Math.pow(1 - t, 3);
        setPinkLen(target * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, fillDelay);
    return () => {
      fade.stop();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion, opacity, circ]);

  // Only draw the elbow once the pink has mostly filled, so it points at a real
  // pink band rather than empty air.
  const showElbow = pinkLen > circ * 0.5;

  return (
    <Animated.View style={{ alignItems: "center", opacity }}>
      {/* THE RING + ELBOW: one SVG so the line can leave the pink and drop. */}
      <Svg width={canvasW} height={size + gap + 16} accessible={false}>
        {/* Lavender full ring, then pink arc starting at 12 o'clock. */}
        <Circle
          cx={circleLeft + cx}
          cy={cy}
          r={r}
          stroke="#AEBCFB"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={circleLeft + cx}
          cy={cy}
          r={r}
          stroke="#FF3E8A"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${pinkLen} ${circ}`}
          strokeLinecap="butt"
          rotation={-90}
          origin={`${circleLeft + cx}, ${cy}`}
        />

        {/* THIS SECTION DOES: the pink elbow from the rim down to the 65%. */}
        {showElbow ? (
          <>
            {/* Dot where the line leaves the pink. */}
            <Circle cx={ax} cy={ay} r={4.5} fill="#FF3E8A" />
            <Path
              d={`M ${ax} ${ay} L ${elbowX} ${ay} L ${elbowX} ${tipY} L ${tipX - 10} ${tipY}`}
              stroke="#FF3E8A"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
      </Svg>

      {/* THE NUMBER: the elbow tip points right at this 65%. */}
      <Animated.View
        style={[{ alignItems: "center", marginTop: -4 }, numberAnim as object]}
      >
        <Text
          className="font-display text-[104px] leading-[0.8] tracking-tight"
          style={{ color: numberColor, letterSpacing: -3 }}
          accessibilityRole="header"
        >
          {number}
        </Text>
        <Text className="mt-2 max-w-[290px] text-center font-sans-sb text-[18px] leading-snug text-canvas">
          {caption}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// ============================================
// VARIANT 3, RETENTION: a 12×20 grid (240 cells). Taller than wide so it fills
// the leftover height. Pink = videos watched; the last 5 yellow = the ones
// you'll actually remember. Cell size scales to the available width.
// ============================================
/** Same yellow for the five "remembered" squares and the word FIVE. */
const RETENTION_YELLOW = "#FFB515";
const RETENTION_COLS = 12;
const RETENTION_ROWS = 20;
const RETENTION_TOTAL = RETENTION_COLS * RETENTION_ROWS;
const RETENTION_GAP = 4;
/** How long the whole 240-cell fill takes once it starts. */
const RETENTION_FILL_MS = 900;
/** Wait so the headline can land before the squares start racing in. */
const RETENTION_START_DELAY_MS = 400;

function RetentionVisual({ reduceMotion }: { reduceMotion: boolean }) {
  // How many squares are visible right now (0 → 240).
  const [shown, setShown] = useState(reduceMotion ? RETENTION_TOTAL : 0);
  // Available box for the grid (grows with the leftover middle of the screen).
  const [box, setBox] = useState({ w: 0, h: 0 });

  // THIS SECTION DOES: race the squares in left-to-right, top-to-bottom.
  // One counter drives every cell so we do not spin up 240 Animated values.
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

  // THIS SECTION DOES: pick the biggest square size that still fits 12 across
  // and 20 down inside the leftover area (with a little breathing room).
  const cellFromW =
    box.w > 0
      ? Math.floor(
          (box.w - (RETENTION_COLS - 1) * RETENTION_GAP) / RETENTION_COLS,
        )
      : 0;
  const cellFromH =
    box.h > 0
      ? Math.floor(
          (box.h - (RETENTION_ROWS - 1) * RETENTION_GAP) / RETENTION_ROWS,
        )
      : 0;
  const cell = Math.max(10, Math.min(cellFromW || 18, cellFromH || 18));
  const gridW = RETENTION_COLS * cell + (RETENTION_COLS - 1) * RETENTION_GAP;

  const cells = Array.from(
    { length: RETENTION_TOTAL },
    (_, i) => i >= RETENTION_TOTAL - 5,
  );

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
        const { width, height } = e.nativeEvent.layout;
        setBox((prev) =>
          prev.w === width && prev.h === height
            ? prev
            : { w: width, h: height },
        );
      }}
    >
      {/* Fixed width locks the wrap to exactly 12 columns. */}
      <View
        style={{
          width: gridW,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: RETENTION_GAP,
        }}
        accessibilityLabel="Two hundred forty video squares, five you'll remember"
      >
        {cells.map((kept, i) => (
          <View
            key={i}
            style={{
              width: cell,
              height: cell,
              borderRadius: 3,
              backgroundColor: kept ? RETENTION_YELLOW : "#FF3E8A",
              opacity: i < shown ? 1 : 0,
            }}
          />
        ))}
      </View>
    </View>
  );
}
