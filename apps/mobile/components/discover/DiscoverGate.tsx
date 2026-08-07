// ============================================
// WHAT THIS FILE DOES (plain English):
// The first screen on Discover before matching is on. Layers stacked:
// 1) retro base (black + perspective spokes + flying rings + arched title + CTA)
// 2) vector starfield (exact stars from the HTML design)
// 3) globe.gif centered on top
// Plus the friends-of-friends line in the open space under the globe.
// Analytics: body is a dead-click region; Get started uses DISCOVER.gate.get_started.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, Text as SvgText, TextPath } from 'react-native-svg';
import { DISCOVER } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  NATIVE_DRIVER,
  PixelHeading,
  useReduceMotion
} from '@bridger/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StarField } from './StarField';

// THIS SECTION DOES: load the globe piece you split out of the design
const GLOBE = require('../../assets/images/discover-globe.gif');

export function DiscoverGate({ onStart }: { onStart: () => void }) {
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Match the HTML: globe is min(70vw, 300)
  const globeSize = Math.min(width * 0.7, 300);

  // THIS SECTION DOES: work out where the globe sits so the headline can hug its
  // top edge no matter the screen size (anchored to the globe, not the screen).
  const globeCenterY = height * 0.46;
  const globeTop = globeCenterY - globeSize / 2;
  const titleWidth = Math.min(width * 0.88, 400);
  const titleHeight = titleWidth * 0.4;
  const titleTop = globeTop - titleHeight * 0.72;

  return (
    <View className="relative flex-1 overflow-hidden bg-black">
      {/* --- LAYER 1: retro base (tunnel + rings) --- */}
      <TunnelSpokes />
      <FlyingRings width={width} height={height} reduceMotion={reduceMotion} />

      {/* --- LAYER 2: the exact vector starfield (recreated from the HTML) --- */}
      <View
        accessible={false}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }}
      >
        <StarField />
      </View>

      {/* --- LAYER 3: globe.gif, centered like the HTML (top: 46%) --- */}
      <Image
        source={GLOBE}
        accessible
        accessibilityLabel="Spinning pixel globe"
        resizeMode="contain"
        style={{
          position: 'absolute',
          left: '50%',
          top: '46%',
          width: globeSize,
          height: globeSize,
          marginLeft: -globeSize / 2,
          marginTop: -globeSize / 2,
          zIndex: 3
        }}
      />

      {/* --- PAGE TITLE: same pixel "Discover" header as the main Discover tab --- */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 20,
          right: 20,
          zIndex: 7
        }}
      >
        <PixelHeading size="lg" className="text-white">
          Discover
        </PixelHeading>
      </View>

      {/* --- HEADLINE: arched pixel text, anchored just above the globe --- */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: titleTop,
          left: '6%',
          right: '6%',
          zIndex: 5,
          alignItems: 'center'
        }}
      >
        <ArchedTitle width={titleWidth} />
      </View>

      {/* --- COPY: fills the open space under the globe, above the button --- */}
      <AnalyticsRegion
        analyticsId={DISCOVER.gate.body}
        interactive={false}
        style={{
          position: 'absolute',
          left: 28,
          right: 28,
          top: '46%',
          marginTop: globeSize / 2 + 16,
          zIndex: 5
        }}
      >
        <Text className="text-center font-sans-sb text-[15px] leading-snug text-white">
          Let Bridger suggest friends of friends, not strangers, for you to meet based on what you
          have in common.
        </Text>
      </AnalyticsRegion>

      {/* --- CTA: brand metallic Get started, raised clear of the floating nav --- */}
      <View
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: Math.max(height * 0.16, 128),
          zIndex: 6
        }}
      >
        <ButtonPrimary
          full
          onPress={onStart}
          analyticsId={DISCOVER.gate.get_started}
          accessibilityLabel="Get started with Discover"
        >
          Get started
        </ButtonPrimary>
        <Text className="mt-3 text-center font-sans-sb text-[12px] text-white/70">
          You choose what you share.
        </Text>
      </View>
    </View>
  );
}

// --- TITLE: two curved lines (same paths as retro-base.html) ---
function ArchedTitle({ width }: { width: number }) {
  const height = width * 0.4;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 400 160"
      accessibilityLabel="Making friends as an adult is hard"
    >
      <Defs>
        <Path id="arcTop" d="M 20 150 Q 200 8 380 150" fill="none" />
        <Path id="arcBot" d="M 42 172 Q 200 58 358 172" fill="none" />
      </Defs>
      {/* Same pixel face as the Discover tab title (FeloniaPixel) */}
      <SvgText fill="#FFFFFF" fontFamily="FeloniaPixel" fontSize="26" letterSpacing="0.5">
        <TextPath href="#arcTop" startOffset="50%" textAnchor="middle">
          Making Friends As
        </TextPath>
      </SvgText>
      <SvgText fill="#FFFFFF" fontFamily="FeloniaPixel" fontSize="26" letterSpacing="0.5">
        <TextPath href="#arcBot" startOffset="50%" textAnchor="middle">
          An Adult Is Hard
        </TextPath>
      </SvgText>
    </Svg>
  );
}

// --- BACKGROUND: perspective spokes that brighten as they come toward you ---
// Near the vanishing point they are almost invisible (~100% transparent).
// As they reach the screen edge they settle at ~70% transparent (30% opacity).
function TunnelSpokes() {
  const cx = 215;
  const cy = 429;
  const spokeCount = 30;

  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 430 932" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {Array.from({ length: spokeCount }).map((_, i) => {
            const angle = (i / spokeCount) * Math.PI * 2;
            const x2 = cx + Math.cos(angle) * 700;
            const y2 = cy + Math.sin(angle) * 1000;
            return (
              <LinearGradient
                key={`grad-${i}`}
                id={`spokeGrad-${i}`}
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                gradientUnits="userSpaceOnUse"
              >
                {/* far away (center): almost fully see-through */}
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.02} />
                {/* midway: starting to show */}
                <Stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.12} />
                {/* close (screen edge): 70% transparent */}
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.3} />
              </LinearGradient>
            );
          })}
        </Defs>
        {Array.from({ length: spokeCount }).map((_, i) => {
          const angle = (i / spokeCount) * Math.PI * 2;
          const x2 = cx + Math.cos(angle) * 700;
          const y2 = cy + Math.sin(angle) * 1000;
          return (
            <Path
              key={i}
              d={`M ${cx} ${cy} L ${x2} ${y2}`}
              stroke={`url(#spokeGrad-${i})`}
              strokeWidth={1.8}
            />
          );
        })}
      </Svg>
    </View>
  );
}

// --- RINGS: rectangles that fly toward you (same timing as retro-base.html) ---
function FlyingRings({
  width,
  height,
  reduceMotion
}: {
  width: number;
  height: number;
  reduceMotion: boolean;
}) {
  const anims = useRef(Array.from({ length: 10 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduceMotion) return;
    const controllers: { stop: () => void }[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    anims.forEach((v, i) => {
      v.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 16000,
            easing: Easing.linear,
            useNativeDriver: NATIVE_DRIVER
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 0,
            useNativeDriver: NATIVE_DRIVER
          })
        ])
      );
      controllers.push(loop);
      // Stagger like animation-delay: -1.6s * i
      timers.push(setTimeout(() => loop.start(), i * 1600));
    });
    return () => {
      timers.forEach(clearTimeout);
      controllers.forEach((l) => l.stop());
    };
  }, [anims, reduceMotion]);

  // Same rect proportions as the HTML viewBox rings
  const ringW = width * (300 / 430);
  const ringH = height * (610 / 932);

  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {anims.map((v, i) => {
        if (reduceMotion && i !== 3 && i !== 6) return null;
        // Scale past the edges of the screen (no fade-out; they just fly off).
        const scale = reduceMotion
          ? i === 3
            ? 0.9
            : 1.35
          : v.interpolate({ inputRange: [0, 1], outputRange: [0.03, 3.2] });
        // Only a quick fade-in when the ring first appears in the distance.
        // After that it stays solid until it leaves the frame.
        const opacity = reduceMotion
          ? i === 3
            ? 0.4
            : 0.3
          : v.interpolate({
              inputRange: [0, 0.08, 1],
              outputRange: [0, 0.4, 0.4]
            });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: ringW,
              height: ringH,
              opacity,
              transform: [{ scale }]
            }}
          >
            <Svg width="100%" height="100%" viewBox="0 0 300 610">
              <Rect
                x="0.5"
                y="0.5"
                width="299"
                height="609"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.6"
              />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}
