// ============================================
// WHAT THIS FILE DOES (plain English):
// The four "quick reality check" full-screen moments between onboarding
// questions. Each one states a hard truth on a flat blue background, shows a
// colorful animated picture of that stat, lets you tap "Where this comes from"
// to see the sources, and ends with "Let's try again."
//
// FONT NOTE: these four screens alone use font-display (Big Shoulders Display).
// Every other onboarding screen uses PixelHeading. Do not spread font-display.
//
// ACCESSIBILITY: all the moving art is marked decorative and the stat is always
// shown as plain text too. When the phone asks for reduced motion, the art
// snaps to its final state instead of animating.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { XIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  NATIVE_DRIVER,
  Screen,
  cn,
  useReduceMotion,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';

/** Which of the four stat pictures to show. */
export type StatVariant = 'feed' | 'isolation' | 'retention' | 'screentime';

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
    line1: { text: 'The internet was supposed to ', underline: 'connect us' },
    line2: { text: "Instead, it's all about ", underline: 'ads' },
    number: '18%',
    caption: 'Your feed is only 18% posts from friends, the rest are ads',
    sources: [
      'WSJ: How Social Feeds Shifted From Friends to Algorithms',
      'Pew Research Center: Social Media Algorithms & Feeds'
    ],
    numberColor: '#FF3E8A'
  },
  isolation: {
    line1: { text: 'The internet was supposed to help us ', underline: 'make friends' },
    line2: { text: 'Instead, it ', underline: 'isolated us' },
    number: '65%',
    caption: 'of adults have 0 to 4 close friends',
    sources: [
      'Survey Center on American Life: Friendship Survey',
      'Pew Research Center: Close Friendships in America'
    ],
    numberColor: '#FF3E8A'
  },
  retention: {
    line1: { text: 'The internet was supposed to ', underline: 'keep us in touch' },
    line2: { text: 'Instead, it kept us ', underline: 'scrolling' },
    number: '240',
    caption: "videos watched an hour. You'll remember fewer than five.",
    sources: [
      'Communications Psychology: Short videos impair memory accuracy (2026)',
      'PsyPost: Neuroscientists on the illusion of learning from short videos',
      'VICE: TikToks, Shorts, and Reels Are Melting Your Attention Span'
    ],
    numberColor: '#FFB515'
  },
  screentime: {
    line1: { text: 'The internet was supposed to help us ', underline: 'live life' },
    line2: { text: 'Instead, we became the ', underline: 'product' },
    number: '',
    caption: '',
    sources: [
      'Eyesafe Report: 21 Years on Screens (2025)',
      'U.S. Bureau of Labor Statistics: American Time Use Survey',
      'Common Sense Media: Media Use by Teens and Tweens'
    ],
    numberColor: '#FF3E8A'
  }
};

export function StatScreen({
  variant,
  onBridge,
  onBack
}: {
  variant: StatVariant;
  onBridge: () => void;
  onBack?: () => void;
}) {
  const c = CONTENT[variant];
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const reduce = useReduceMotion();
  const theme = useThemeColors();

  // THIS SECTION DOES: staggered entrance for the two headline lines + number.
  const line1 = useRise(80, reduce);
  const line2 = useRise(560, reduce);
  const numberAnim = useCount(1080, reduce);

  return (
    <Screen tone="color" accent="bg-blue" className="flex-1">
      <View className="flex-1 justify-between px-6 pb-8 pt-12">
        {/* THIS SECTION DOES: the "A quick reality check" eyebrow. */}
        <View className="gap-4">
          <Text className="font-sans-sb text-[12px] uppercase tracking-[1.6px] text-coral">
            A quick reality check
          </Text>

          <AnalyticsRegion analyticsId={ONBOARDING.stat.headline} interactive={false}>
            <View>
              <Animated.View style={line1}>
                <DisplayLine line={c.line1} />
              </Animated.View>
              <Animated.View style={[{ marginTop: 20 }, line2]}>
                <DisplayLine line={c.line2} />
              </Animated.View>
            </View>
          </AnalyticsRegion>
        </View>

        {/* THIS SECTION DOES: the animated picture of the stat. */}
        <View className="my-3 min-h-0 flex-1 justify-center" accessibilityElementsHidden>
          {variant === 'feed' ? <FeedVisual reduceMotion={reduce} /> : null}
          {variant === 'isolation' ? <IsolationVisual reduceMotion={reduce} /> : null}
          {variant === 'retention' ? <RetentionVisual reduceMotion={reduce} /> : null}
          {variant === 'screentime' ? <ScreenTimeVisual reduceMotion={reduce} /> : null}
        </View>

        {/* THIS SECTION DOES: the big number, caption, sources link, and CTA. */}
        <View className="gap-3">
          {c.number ? (
            <Animated.View style={[{ alignItems: 'center' }, numberAnim]}>
              <Text
                className="font-display text-[72px] leading-[0.9] tracking-tight"
                style={{ color: c.numberColor }}
                accessibilityRole="header"
              >
                {c.number}
              </Text>
              <Text className="mt-2 max-w-[300px] text-center font-sans-sb text-[15px] leading-snug text-canvas">
                {c.caption}
              </Text>
            </Animated.View>
          ) : null}

          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.stat.info, () => setSourcesOpen(true), {
              analyticsProps: { variant }
            })}
            accessibilityRole="button"
            accessibilityLabel="Where this comes from"
            className="self-start py-1"
          >
            <Text className="font-sans-md text-[13px] text-canvas/70 underline">
              Where this comes from
            </Text>
          </Pressable>

          <ButtonPrimary
            full
            analyticsId={ONBOARDING.stat.bridge}
            analyticsProps={{ variant }}
            onPress={onBridge}
            accessibilityLabel="Let's try again"
          >
            Let's try again
          </ButtonPrimary>
          {onBack ? (
            <Pressable
              onPress={withAnalyticsPress(ONBOARDING.chrome.back, onBack)}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="items-center py-1"
            >
              <Text className="font-sans-sb text-[13px] text-canvas/60">Back</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* THE SOURCES SHEET: plain text list, opened by the link. */}
      <Modal visible={sourcesOpen} transparent animationType="fade" onRequestClose={() => setSourcesOpen(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/40"
          accessibilityLabel="Close sources"
          onPress={() => setSourcesOpen(false)}
        >
          <View className="rounded-t-3xl bg-canvas px-6 pb-10 pt-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-sans-b text-[16px] text-ink">Where this comes from</Text>
              <Pressable
                onPress={() => setSourcesOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={10}
                className="h-8 w-8 items-center justify-center rounded-full bg-surface"
              >
                <XIcon size={16} color={theme.ink} strokeWidth={2.6} />
              </Pressable>
            </View>
            <View className="gap-2.5">
              {c.sources.map((s) => (
                <Text key={s} className="font-sans-sb text-[13px] leading-snug text-ink-soft">
                  {s}
                </Text>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

/** One headline line with an optional underlined key phrase. */
function DisplayLine({ line }: { line: StatLine }) {
  return (
    <Text className="font-display text-[36px] uppercase leading-[0.95] tracking-tight text-canvas">
      {line.text}
      {line.underline ? (
        <Text className="underline" style={{ textDecorationLine: 'underline' }}>
          {line.underline}
        </Text>
      ) : null}
      {line.underline ? '.' : null}
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
        useNativeDriver: NATIVE_DRIVER
      }),
      Animated.timing(y, {
        toValue: 0,
        delay,
        duration: 480,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER
      })
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, reduce, opacity, y]);
  return { opacity, transform: [{ translateY: y }] };
}

/** Pop-in for the big number. */
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
        useNativeDriver: NATIVE_DRIVER
      }),
      Animated.timing(y, {
        toValue: 0,
        delay,
        duration: 700,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER
      }),
      Animated.timing(scale, {
        toValue: 1,
        delay,
        duration: 700,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: NATIVE_DRIVER
      })
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, reduce, opacity, y, scale]);
  return { opacity, transform: [{ translateY: y }, { scale }] };
}

// ============================================
// VARIANT 1 — FEED: a looping column of ad cards with one friend post.
// ============================================
const FEED_CARDS = [
  { tag: 'AD', name: 'sponsored_brand', friend: false },
  { tag: 'SPONSORED', name: 'paid_partner', friend: false },
  { tag: 'SUGGESTED', name: 'for_you_page', friend: false },
  { tag: 'AD', name: 'shop_now_llc', friend: false },
  { tag: 'SPONSORED', name: 'brand_official', friend: false },
  { tag: 'FRIEND', name: 'conor', friend: true },
  { tag: 'AD', name: 'sponsored_brand', friend: false }
];

function FeedVisual({ reduceMotion }: { reduceMotion: boolean }) {
  const CARD_H = 120;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(translateY, {
        toValue: -(CARD_H * (FEED_CARDS.length - 1)),
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER
      })
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, translateY]);

  return (
    <View className="items-center">
      <View className="h-[120px] w-[220px] overflow-hidden rounded-card">
        <Animated.View style={{ transform: [{ translateY }] }}>
          {FEED_CARDS.map((card, i) => (
            <View
              key={`${card.name}-${i}`}
              style={{ height: CARD_H }}
              className="mb-0 overflow-hidden rounded-card border border-ink-line bg-surface"
            >
              <View className="h-7 flex-row items-center gap-2 px-2.5">
                <View
                  className={cn(
                    'h-4 w-4 rounded-full',
                    card.friend ? 'bg-teal' : 'bg-canvas border border-pink'
                  )}
                />
                <Text className="flex-1 font-sans-sb text-[10px] text-ink" numberOfLines={1}>
                  {card.name}
                </Text>
              </View>
              <View
                className={cn(
                  'flex-1 items-center justify-center',
                  card.friend ? 'bg-teal' : 'bg-coral'
                )}
              >
                <Text
                  className={cn(
                    'font-sans-b text-[14px] tracking-widest',
                    card.friend ? 'text-canvas' : 'text-ink'
                  )}
                >
                  {card.tag}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

// ============================================
// VARIANT 2 — ISOLATION: a 65% donut drawn with SVG arcs.
// ============================================
function IsolationVisual({ reduceMotion }: { reduceMotion: boolean }) {
  const scale = useRef(new Animated.Value(reduceMotion ? 1 : 0.85)).current;
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        delay: 1080,
        duration: 660,
        useNativeDriver: NATIVE_DRIVER
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay: 1080,
        stiffness: 180,
        damping: 14,
        useNativeDriver: NATIVE_DRIVER
      })
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, opacity, scale]);

  const size = 180;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // 65% of the circle: pink arc, rest lavender.
  const circ = 2 * Math.PI * r;
  const pinkLen = circ * 0.65;

  return (
    <Animated.View style={{ alignItems: 'center', opacity, transform: [{ scale }] }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="#AEBCFB" strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#FF3E8A"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${pinkLen} ${circ}`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
    </Animated.View>
  );
}

// ============================================
// VARIANT 3 — RETENTION: 240 cells, last 5 in amber (the ones you'll remember).
// ============================================
function RetentionVisual({ reduceMotion }: { reduceMotion: boolean }) {
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const anim = Animated.timing(opacity, {
      toValue: 1,
      delay: 1080,
      duration: 620,
      useNativeDriver: NATIVE_DRIVER
    });
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, opacity]);

  const cells = Array.from({ length: 240 }, (_, i) => i >= 235);

  return (
    <Animated.View style={{ alignItems: 'center', opacity }}>
      <View className="flex-row flex-wrap justify-center gap-[3px]" style={{ maxWidth: 320 }}>
        {cells.map((kept, i) => (
          <View
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              backgroundColor: kept ? '#FFB515' : '#FF3E8A'
            }}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ============================================
// VARIANT 4 — SCREENTIME: 80-year life as labeled bar rows.
// ============================================
const LIFE_ROWS: Array<{
  label: string;
  sub: string;
  years: number;
  color: string;
}> = [
  { label: 'Sleep', sub: '27 years, a third of it', years: 27, color: '#FFB515' },
  { label: 'Work', sub: '18 years on the clock', years: 18, color: '#FF5A1F' },
  { label: 'Phone', sub: '7 years, at 2 hours a day', years: 7, color: '#FF3E8A' },
  { label: 'Yours', sub: '28 years left to actually live', years: 28, color: '#AEBCFB' }
];

function ScreenTimeVisual({ reduceMotion }: { reduceMotion: boolean }) {
  const { width } = useWindowDimensions();
  return (
    <View className="gap-2.5">
      <Text className="font-sans-sb text-[11px] uppercase tracking-wide text-canvas/70">
        One row = one year of an 80-year life
      </Text>
      {LIFE_ROWS.map((row, i) => (
        <LifeRow key={row.label} row={row} index={i} reduceMotion={reduceMotion} maxWidth={width - 48} />
      ))}
    </View>
  );
}

function LifeRow({
  row,
  index,
  reduceMotion,
  maxWidth
}: {
  row: (typeof LIFE_ROWS)[number];
  index: number;
  reduceMotion: boolean;
  maxWidth: number;
}) {
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const y = useRef(new Animated.Value(reduceMotion ? 0 : 12)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const delay = 1100 + index * 150;
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        delay,
        duration: 480,
        useNativeDriver: NATIVE_DRIVER
      }),
      Animated.timing(y, {
        toValue: 0,
        delay,
        duration: 480,
        useNativeDriver: NATIVE_DRIVER
      })
    ]);
    anim.start();
    return () => anim.stop();
  }, [index, reduceMotion, opacity, y]);

  const labelW = 104;
  const ticksW = Math.max(80, maxWidth - labelW - 24);

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY: y }] }}
      className="flex-row items-stretch gap-3"
    >
      <View style={{ width: ticksW, gap: 2 }}>
        {Array.from({ length: row.years }, (_, i) => (
          <View key={i} style={{ height: 3, backgroundColor: row.color, borderRadius: 1 }} />
        ))}
      </View>
      <View style={{ width: 3, backgroundColor: row.color }} />
      <View style={{ width: labelW }} className="justify-center">
        <Text className="font-display text-[22px] uppercase leading-none" style={{ color: row.color }}>
          {row.label}
        </Text>
        <Text className="mt-0.5 font-sans-sb text-[11px] leading-snug text-canvas">{row.sub}</Text>
      </View>
    </Animated.View>
  );
}
