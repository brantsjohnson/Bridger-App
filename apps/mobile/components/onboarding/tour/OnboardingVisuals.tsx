// ============================================
// WHAT THIS FILE DOES (plain English):
// The pictures on New-onboarding teaching screens. These follow the Magic
// Patterns layouts (scattered chips, tool grid, two profiles, ad vs friends
// feeds, member vote). They are not live controls. Taps log dead_click.
// ============================================
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { CheckIcon, LockIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, useReduceMotion } from '@bridger/ui';
import { OB } from '../onboarding-theme';

const TOOLS = [
  { emoji: '📅', label: 'Plans' },
  { emoji: '📝', label: 'Notes' },
  { emoji: '📷', label: 'Memories' },
  { emoji: '🎂', label: 'Birthdays' },
  { emoji: '🎟️', label: 'Events' },
  { emoji: '👥', label: 'Groups' },
  { emoji: '⭐️', label: 'Favorites' },
  { emoji: '🔗', label: 'Mutuals' },
  { emoji: '😂', label: 'Jokes' }
];

const SCATTERED = [
  { label: 'Birthday in a group chat', x: -76, y: -58 },
  { label: 'Plans in a DM', x: 74, y: -40 },
  { label: 'Photos in your camera roll', x: -62, y: 46 },
  { label: 'Her new job, in a story', x: 70, y: 62 },
  { label: 'That thing you said you would do', x: 0, y: 104 }
];

function FadeUp({
  delay,
  children,
  still,
  style
}: {
  delay: number;
  children: React.ReactNode;
  still: boolean;
  style?: object;
}) {
  const y = useSharedValue(still ? 0 : 12);
  const opacity = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    opacity.value = withDelay(delay, withTiming(1, { duration: 320 }));
    y.value = withDelay(delay, withTiming(0, { duration: 320 }));
  }, [delay, opacity, still, y]);
  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }]
  }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

export function WhyScatteredVisual() {
  const still = useReduceMotion();
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.why.visual} interactive={false}>
      <View style={{ height: 300, width: '100%', maxWidth: 320, alignSelf: 'center' }}>
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 74,
            height: 128,
            marginLeft: -37,
            marginTop: -64,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: OB.navy,
            backgroundColor: OB.canvas
          }}
        >
          <View
            style={{
              width: 24,
              height: 4,
              borderRadius: 999,
              backgroundColor: 'rgba(28,27,22,0.25)',
              alignSelf: 'center',
              marginTop: 6
            }}
          />
        </View>
        {SCATTERED.map((s, i) => (
          <ScatterChip key={s.label} label={s.label} x={s.x} y={s.y} delay={80 + i * 70} still={still} />
        ))}
      </View>
    </AnalyticsRegion>
  );
}

function ScatterChip({
  label,
  x,
  y,
  delay,
  still
}: {
  label: string;
  x: number;
  y: number;
  delay: number;
  still: boolean;
}) {
  const tx = useSharedValue(still ? x : 0);
  const ty = useSharedValue(still ? y : 0);
  const scale = useSharedValue(still ? 1 : 0.6);
  const opacity = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    opacity.value = withDelay(delay, withSpring(1));
    scale.value = withDelay(delay, withSpring(1));
    tx.value = withDelay(delay, withSpring(x));
    ty.value = withDelay(delay, withSpring(y));
  }, [delay, opacity, scale, still, tx, ty, x, y]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value }
    ]
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginLeft: -68,
          maxWidth: 136,
          backgroundColor: OB.canvas,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6
        },
        style
      ]}
    >
      <Text className="font-sans-b text-[11px]" style={{ color: OB.navy, lineHeight: 14 }}>
        {label}
      </Text>
    </Animated.View>
  );
}

export function WhyTogetherVisual() {
  const still = useReduceMotion();
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.why.visual} interactive={false}>
      <View>
        {/* THIS SECTION DOES: a fixed 3x3 so the nine tools stay in quadrants. */}
        <View style={{ gap: 10 }}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={{ flexDirection: 'row', gap: 10 }}>
              {TOOLS.slice(row * 3, row * 3 + 3).map((t, i) => (
                <FadeUp
                  key={t.label}
                  delay={(row * 3 + i) * 45}
                  still={still}
                  style={{ flex: 1 }}
                >
                  <View
                    style={{
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: OB.canvas,
                      paddingVertical: 16,
                      borderRadius: 16
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
                    <Text className="font-sans-b text-[11px]" style={{ color: OB.navy }}>
                      {t.label}
                    </Text>
                  </View>
                </FadeUp>
              ))}
            </View>
          ))}
        </View>
        <Text
          className="mt-3 text-center font-sans-sb text-[13px]"
          style={{ color: OB.inkSoft }}
        >
          Lots of little tools for being a better friend.
        </Text>
      </View>
    </AnalyticsRegion>
  );
}

const MAPPING = [
  { thing: 'Birthday', audience: 'Friends', emoji: '🎂' },
  { thing: "Pet's name", audience: 'Close Friends', emoji: '🐶' },
  { thing: 'Hometown', audience: 'Friends', emoji: '🏡' },
  { thing: 'Vacation photo', audience: 'Close Friends', emoji: '📷' },
  { thing: 'Favorite food', audience: 'Acquaintances', emoji: '🍜' }
];

export function PrivacyMappingVisual() {
  const still = useReduceMotion();
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.privacy.visual} interactive={false}>
      <View style={{ gap: 10 }}>
        {MAPPING.map((r, i) => (
          <FadeUp key={r.thing} delay={i * 120} still={still}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: 'rgba(28,27,22,0.12)',
                borderRadius: 16,
                padding: 12
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: '#BBD6FB',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontSize: 17 }}>{r.emoji}</Text>
              </View>
              <Text
                className="font-sans-b text-[14px]"
                style={{ flex: 1, color: OB.navy }}
                numberOfLines={1}
              >
                {r.thing}
              </Text>
              <Text className="font-sans-b text-[13px]" style={{ color: OB.inkSoft }}>
                →
              </Text>
              <View
                style={{
                  backgroundColor: OB.blue,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6
                }}
              >
                <Text className="font-sans-b text-[12px]" style={{ color: '#FFFFFF' }}>
                  {r.audience}
                </Text>
              </View>
            </View>
          </FadeUp>
        ))}
      </View>
    </AnalyticsRegion>
  );
}

const SEEN_BY = [
  {
    who: 'Sam',
    tier: 'Close friend',
    tint: '#BBD6FB',
    items: [
      { label: 'Birthday', on: true },
      { label: "Pet's name", on: true },
      { label: 'Vacation photo', on: true }
    ]
  },
  {
    who: 'Jordan',
    tier: 'Acquaintance',
    tint: '#F1ECFF',
    items: [
      { label: 'Birthday', on: true },
      { label: "Pet's name", on: false },
      { label: 'Vacation photo', on: false }
    ]
  }
];

export function PrivacyTwoProfilesVisual() {
  const still = useReduceMotion();
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.privacy.visual} interactive={false}>
      <View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {SEEN_BY.map((p, i) => (
            <FadeUp key={p.who} delay={i * 140} still={still}>
              <View
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(28,27,22,0.12)',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <View
                  style={{
                    backgroundColor: p.tint,
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 16
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      backgroundColor: 'rgba(255,255,255,0.7)'
                    }}
                  />
                  <Text className="font-sans-b text-[14px]" style={{ color: '#1C1B16' }}>
                    {p.who} sees
                  </Text>
                  <Text className="font-sans-b text-[11px]" style={{ color: '#4A483F' }}>
                    {p.tier}
                  </Text>
                </View>
                <View style={{ padding: 12, gap: 6 }}>
                  {p.items.map((it) => (
                    <View
                      key={it.label}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        backgroundColor: it.on ? '#BBD6FB' : 'transparent',
                        borderWidth: it.on ? 0 : 1,
                        borderStyle: it.on ? 'solid' : 'dashed',
                        borderColor: 'rgba(28,27,22,0.18)'
                      }}
                    >
                      {it.on ? (
                        <CheckIcon size={12} color={OB.navy} strokeWidth={3.5} />
                      ) : (
                        <LockIcon size={12} color={OB.inkSoft} strokeWidth={3} />
                      )}
                      <Text
                        className="font-sans-b text-[12px]"
                        style={{ color: it.on ? OB.navy : OB.inkSoft }}
                      >
                        {it.on ? it.label : 'Hidden'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </FadeUp>
          ))}
        </View>
        <View
          style={{
            marginTop: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(28,27,22,0.12)',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 12
          }}
        >
          <Text className="font-sans-sb text-[13px]" style={{ color: OB.inkSoft }}>
            Nobody is told what they can't see.
          </Text>
        </View>
      </View>
    </AnalyticsRegion>
  );
}

function FeedColumn({
  label,
  rows,
  friendly,
  still
}: {
  label: string;
  rows: string[];
  friendly: string[];
  still: boolean;
}) {
  return (
    <View style={{ flex: 1, borderRadius: 16, backgroundColor: OB.canvas, padding: 12 }}>
      <Text
        className="mb-2 font-sans-b text-[11px]"
        style={{ color: OB.inkSoft, letterSpacing: 0.6, textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      <View style={{ gap: 6 }}>
        {rows.map((r, i) => {
          const good = friendly.includes(r);
          return (
            <FadeUp key={`${r}-${i}`} delay={i * 60} still={still}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  backgroundColor: good ? OB.green : 'rgba(28,27,22,0.07)'
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    backgroundColor: good ? 'rgba(255,255,255,0.9)' : 'rgba(28,27,22,0.15)'
                  }}
                />
                <Text
                  className="font-sans-b text-[11px]"
                  style={{ color: good ? '#FFFFFF' : OB.inkSoft }}
                  numberOfLines={1}
                >
                  {r}
                </Text>
              </View>
            </FadeUp>
          );
        })}
      </View>
    </View>
  );
}

export function CoopNoAdsVisual() {
  const still = useReduceMotion();
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.coop.visual} interactive={false}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <FeedColumn
          label="Everywhere else"
          rows={['Ad', 'Sponsored', 'Suggested', 'A friend', 'Ad', 'Sponsored']}
          friendly={['A friend']}
          still={still}
        />
        <FeedColumn
          label="Bridger"
          rows={['Kit', 'Devon', 'Priya', 'Sam', 'Mo', 'Ren']}
          friendly={['Kit', 'Devon', 'Priya', 'Sam', 'Mo', 'Ren']}
          still={still}
        />
      </View>
    </AnalyticsRegion>
  );
}

export function CoopWhoPaysVisual() {
  const still = useReduceMotion();
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.coop.visual} interactive={false}>
      <View style={{ gap: 12 }}>
        <FadeUp delay={0} still={still}>
          <View style={{ backgroundColor: OB.green, borderRadius: 16, padding: 20 }}>
            <Text className="font-sans-b text-[22px]" style={{ color: '#FFFFFF', lineHeight: 26 }}>
              You are who it answers to.
            </Text>
            <Text className="mt-2 font-sans-sb text-[14px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Members pay for Bridger, so Bridger works for members.
            </Text>
          </View>
        </FadeUp>
        <FadeUp delay={120} still={still}>
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(28,27,22,0.12)',
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 16,
              paddingVertical: 12
            }}
          >
            <Text className="font-sans-sb text-[13px]" style={{ color: OB.inkSoft }}>
              Most apps take advertiser money instead. That makes you the thing being sold.
            </Text>
          </View>
        </FadeUp>
      </View>
    </AnalyticsRegion>
  );
}

export function CoopWhatVisual() {
  const still = useReduceMotion();
  const faces = ['🧑', '👩', '🧔', '👧', '🧓'];
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.coop.visual} interactive={false}>
      <View style={{ borderRadius: 16, backgroundColor: OB.canvas, padding: 24, alignItems: 'center' }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            borderWidth: 4,
            borderColor: OB.green,
            backgroundColor: 'rgba(0,166,118,0.15)',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text className="font-pixel text-[13px] text-center" style={{ color: OB.navy, lineHeight: 16 }}>
            MEMBER{'\n'}OWNED
          </Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 16, marginLeft: 8 }}>
          {faces.map((m, i) => (
            <FadeUp key={i} delay={200 + i * 70} still={still}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,166,118,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: i === 0 ? 0 : -8
                }}
              >
                <Text style={{ fontSize: 18 }}>{m}</Text>
              </View>
            </FadeUp>
          ))}
        </View>
      </View>
    </AnalyticsRegion>
  );
}

const PROPOSALS = [
  { label: 'Better plans', votes: 61 },
  { label: 'More scrapbook tools', votes: 24 },
  { label: 'Better profiles', votes: 15 }
];

export function CoopSayVisual() {
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.coop.visual} interactive={false}>
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(28,27,22,0.12)',
          backgroundColor: '#FFFFFF',
          padding: 16
        }}
      >
        <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
          What should Bridger build next?
        </Text>
        <View style={{ marginTop: 12, gap: 8 }}>
          {PROPOSALS.map((p) => (
            <View
              key={p.label}
              style={{
                overflow: 'hidden',
                borderRadius: 16,
                backgroundColor: 'rgba(28,27,22,0.04)',
                paddingHorizontal: 14,
                paddingVertical: 12
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${p.votes}%`,
                  backgroundColor: 'rgba(0,166,118,0.25)'
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text className="font-sans-b text-[14px]" style={{ color: OB.navy }}>
                  {p.label}
                </Text>
                <Text className="font-pixel text-[12px]" style={{ color: OB.inkSoft }}>
                  {p.votes}%
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Text className="mt-3 font-sans-sb text-[12px]" style={{ color: OB.inkSoft }}>
          Top of the vote goes into the next quarter. Results are public.
        </Text>
      </View>
    </AnalyticsRegion>
  );
}

export function CoopSupportVisual() {
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.coop.visual} interactive={false}>
      <View style={{ borderRadius: 16, backgroundColor: OB.canvas, padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: OB.green,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>💬</Text>
          </View>
          <Text className="flex-1 font-sans-b text-[14px]" style={{ color: OB.navy }}>
            Bridger support
          </Text>
          <Text className="font-sans-b text-[11px]" style={{ color: OB.navy }}>
            Replies in under a day
          </Text>
        </View>
        <Text className="font-sans-sb text-[13px]" style={{ color: OB.inkSoft }}>
          A person reads it, not a bot. Members go to the front of the queue.
        </Text>
      </View>
    </AnalyticsRegion>
  );
}

export function CoopEarlyVisual() {
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.coop.visual} interactive={false}>
      <View style={{ gap: 8 }}>
        {[
          { label: 'Shared scrapbook pages', line: 'Two people, one memory page' },
          { label: 'Group availability', line: 'See when a whole group is free' }
        ].map((f) => (
          <View key={f.label} style={{ borderRadius: 16, backgroundColor: OB.canvas, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text className="flex-1 font-sans-b text-[14px]" style={{ color: OB.navy }}>
                {f.label}
              </Text>
              <View
                style={{
                  backgroundColor: OB.green,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4
                }}
              >
                <Text className="font-sans-b text-[11px]" style={{ color: '#FFFFFF' }}>
                  Beta
                </Text>
              </View>
            </View>
            <Text className="mt-1 font-sans-sb text-[12px]" style={{ color: OB.inkSoft }}>
              {f.line}
            </Text>
          </View>
        ))}
      </View>
    </AnalyticsRegion>
  );
}
