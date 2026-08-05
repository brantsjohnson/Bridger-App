// ============================================
// WHAT THIS FILE DOES (plain English):
// Reply bubbles that drift upward over the story player like balloons. Tap one
// to open comments. When reduce-motion is on, they sit still as a quiet stack
// instead of floating (ACCESSIBILITY). Bubbles stay inside the screen — they
// never start off the side, and they fade out before they hit the header.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { VideoIcon } from 'lucide-react-native';
import type { Reaction } from '@bridger/shared';
import { Avatar } from '@bridger/ui';
import { personById } from '../../data/people';

/** Always-dark type on the white bubble (theme ink flips light in dark mode). */
const BUBBLE_INK = '#1C1B16';

type Props = {
  replies: Reaction[];
  paused?: boolean;
  onOpen: () => void;
  /** Space reserved under the float lane (bottom controls + Catch-Up peek). */
  bottomInset?: number;
};

export function FloatingReactions({
  replies,
  paused = false,
  onOpen,
  bottomInset = 230
}: Props) {
  const items = replies.slice(0, 5);
  const [reduceMotion, setReduceMotion] = useState(false);
  const { width: screenW, height: screenH } = useWindowDimensions();

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  if (items.length === 0) return null;

  // ACCESSIBILITY: static stack when motion is reduced
  if (reduceMotion || paused) {
    return (
      <View
        pointerEvents="box-none"
        className="absolute left-3 right-3 gap-2"
        style={{ bottom: bottomInset }}
      >
        {items.slice(0, 3).map((r) => (
          <Bubble key={r.id} reaction={r} onOpen={onOpen} />
        ))}
      </View>
    );
  }

  // Rise far enough to clear the media, but stop short of the header so a
  // bubble never drifts off the top. Horizontal start is clamped so the
  // bubble's right edge stays inside the screen.
  const riseDistance = Math.max(220, screenH - bottomInset - 140);

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 overflow-hidden"
      style={{ top: 96, bottom: bottomInset }}
    >
      {items.map((r, i) => (
        <RisingBubble
          key={r.id}
          reaction={r}
          delay={i * 2200}
          onOpen={onOpen}
          screenW={screenW}
          riseDistance={riseDistance}
        />
      ))}
    </View>
  );
}

function Bubble({
  reaction: r,
  onOpen
}: {
  reaction: Reaction;
  onOpen: () => void;
}) {
  const person = personById(r.authorId);
  return (
    // A real chat bubble: solid white with a dark outline, so it reads over a
    // bright photo as well as a dark one. Their face rides on the left.
    // Text stays near-black even in dark mode (theme ink would vanish on white).
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Reply from ${person.name}. Open comments`}
      className="flex-row items-center gap-2 self-start rounded-full border-2 border-[#1C1B16] bg-white py-1 pl-1 pr-3"
    >
      <Avatar
        name={person.name}
        emoji={person.emoji}
        accent={person.accent}
        personId={person.id}
        size="xs"
      />
      {r.kind === 'text' ? (
        <Text
          numberOfLines={1}
          className="max-w-[150px] font-sans-b text-[12px]"
          style={{ color: BUBBLE_INK }}
        >
          {r.text}
        </Text>
      ) : null}
      {r.kind === 'sticker' ? (
        r.stickerUri ? (
          <Image
            source={{ uri: r.stickerUri }}
            accessibilityIgnoresInvertColors
            style={{ width: 26, height: 26, borderRadius: 13 }}
          />
        ) : (
          <Text className="text-[18px]">{r.stickerId}</Text>
        )
      ) : null}
      {r.kind === 'circleVideo' ? (
        <View className="flex-row items-center gap-1.5">
          <View className="h-5 w-5 items-center justify-center rounded-full bg-[#1C1B16]">
            <VideoIcon size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text className="font-sans-b text-[12px]" style={{ color: BUBBLE_INK }}>
            Video reply
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function RisingBubble({
  reaction,
  delay,
  onOpen,
  screenW,
  riseDistance
}: {
  reaction: Reaction;
  delay: number;
  onOpen: () => void;
  screenW: number;
  riseDistance: number;
}) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  // Rough bubble width for clamping; long text is capped at ~190.
  const bubbleW = 190;
  const slot = reaction.id.charCodeAt(reaction.id.length - 1) % 5;
  const rawLeft = 12 + slot * Math.max(28, (screenW - bubbleW - 24) / 4);
  const left = Math.max(8, Math.min(rawLeft, screenW - bubbleW - 8));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, {
            toValue: -riseDistance,
            duration: 11000,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true
            }),
            Animated.delay(8000),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2200,
              useNativeDriver: true
            })
          ])
        ]),
        Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, y, riseDistance]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: 0,
        left,
        maxWidth: bubbleW,
        transform: [{ translateY: y }],
        opacity
      }}
    >
      <Bubble reaction={reaction} onOpen={onOpen} />
    </Animated.View>
  );
}
