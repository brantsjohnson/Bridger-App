// ============================================
// WHAT THIS FILE DOES (plain English):
// One polaroid in the weekly activity collage — a friend's post or yours.
// A thin heart outline sits in the corner; double-tap fills it red and
// sprays heart emojis. No heart counts (no vanity metrics). Slight tilt
// unless Reduce Motion is on.
//
// PRIVACY/DESIGN: polaroid faces stay white, so name/caption use hard dark
// ink — theme text-ink flips to cream in dark mode and would vanish on white.
// Analytics: grid.polaroid (dead single-tap) / grid.heart (double-tap).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { HeartIcon } from 'lucide-react-native';
import { ACTIVITY, trackClick } from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  Avatar,
  cn,
  useReduceMotion
} from '@bridger/ui';
import { personById } from '../../data/people';

// Hard dark ink on the always-white polaroid face (theme tokens flip in dark mode)
const POLAROID_INK = '#1C1B16';
const POLAROID_MUTE = '#5C594E';

const AUDIENCE_LABEL: Record<string, string> = {
  close: 'close friends',
  friend: 'friends',
  everyone: 'everyone'
};

/** Burst glyphs — sprayed on double-tap heart */
const BURST_EMOJIS = ['🫶', '♥️', '💖', '🫀'] as const;

function audienceLabel(a: string) {
  return AUDIENCE_LABEL[a] ?? a;
}

type BurstParticle = {
  id: number;
  emoji: string;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
};

export type ActivityPolaroidProps = {
  postId: string;
  personId: string;
  emoji: string;
  caption: string;
  audience?: string;
  /** Even / odd index tilts the card opposite ways */
  index: number;
  hearted: boolean;
  onToggleHeart?: () => void;
};

export function ActivityPolaroid({
  postId,
  personId,
  emoji,
  caption,
  audience,
  index,
  hearted,
  onToggleHeart
}: ActivityPolaroidProps) {
  const reduceMotion = useReduceMotion();
  const isMine = personId === 'me';
  const person = isMine ? null : personById(personId);
  const accent = person?.accent ?? 'pink';
  const token = ACCENTS[accent];
  const rotate = reduceMotion ? '0deg' : index % 2 === 0 ? '-1deg' : '1deg';
  const lastTap = useRef(0);
  const particleId = useRef(0);
  const [particles, setParticles] = useState<BurstParticle[]>([]);

  // Clean up finished particles so we do not keep growing the list
  useEffect(() => {
    if (particles.length === 0) return;
    const t = setTimeout(() => setParticles([]), reduceMotion ? 200 : 900);
    return () => clearTimeout(t);
  }, [particles, reduceMotion]);

  const firstName = isMine
    ? 'You'
    : (person?.name.split(' ')[0] ?? 'Friend');

  function explodeHearts() {
    if (reduceMotion) return;

    const next: BurstParticle[] = [];
    // Spray ~10 glyphs so it feels like an explosion, cycling the four emojis
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + (Math.random() * 0.4 - 0.2);
      const dist = 36 + Math.random() * 48;
      const p: BurstParticle = {
        id: particleId.current++,
        emoji: BURST_EMOJIS[i % BURST_EMOJIS.length],
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0.4)
      };
      next.push(p);
      Animated.parallel([
        Animated.timing(p.x, {
          toValue: Math.cos(angle) * dist,
          duration: 520 + Math.random() * 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(p.y, {
          toValue: Math.sin(angle) * dist - 12,
          duration: 520 + Math.random() * 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(p.scale, {
          toValue: 0.9 + Math.random() * 0.5,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 640,
          delay: 120,
          useNativeDriver: true
        })
      ]).start();
    }
    setParticles(next);
  }

  function handlePress() {
    if (isMine || !onToggleHeart) return;
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      trackClick(ACTIVITY.grid.heart);
      // Burst when hearting on (or always on double-tap for delight)
      if (!hearted) explodeHearts();
      onToggleHeart();
    } else {
      lastTap.current = now;
    }
  }

  return (
    <View
      style={{ transform: [{ rotate }], width: '48%' }}
      className="mb-3.5"
    >
      <AnalyticsRegion
        analyticsId={ACTIVITY.grid.polaroid}
        interactive={false}
        analyticsProps={{ post_id: postId }}
      >
        <Pressable
          onPress={handlePress}
          accessibilityRole="imagebutton"
          accessibilityLabel={
            isMine
              ? `Your post${caption ? `: ${caption}` : ''}`
              : `Post by ${firstName}${hearted ? ', hearted' : ''}`
          }
          accessibilityHint={
            isMine ? undefined : 'Double tap to heart or unheart'
          }
          className={cn(
            'rounded-none bg-white p-2 pb-3',
            isMine ? 'border-2 border-[#1C1B16]' : 'border border-[#D6D3C8]'
          )}
        >
          <View
            className={cn(
              'relative h-[112px] items-center justify-center overflow-visible',
              isMine ? 'bg-pink/30' : token.tintSolid
            )}
          >
            <Text accessible={false} className="text-[42px]">
              {emoji}
            </Text>

            {/* Corner heart — thin outline; fills red when hearted */}
            {!isMine ? (
              <View
                pointerEvents="none"
                className="absolute right-1.5 top-1.5"
                accessibilityElementsHidden
              >
                <HeartIcon
                  size={18}
                  color={hearted ? '#E11D48' : '#1C1B16'}
                  fill={hearted ? '#E11D48' : 'transparent'}
                  strokeWidth={1.6}
                />
              </View>
            ) : null}

            {/* Heart emoji explosion on double-tap */}
            {particles.map((p) => (
              <Animated.Text
                key={p.id}
                pointerEvents="none"
                accessible={false}
                style={{
                  position: 'absolute',
                  fontSize: 18,
                  opacity: p.opacity,
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { scale: p.scale }
                  ]
                }}
              >
                {p.emoji}
              </Animated.Text>
            ))}
          </View>

          {isMine ? (
            <View className="mt-2">
              <Text
                className="font-sans-b text-[12px]"
                style={{ color: POLAROID_INK }}
              >
                You · just now
              </Text>
              {caption ? (
                <Text
                  className="font-sans-md text-[11px]"
                  style={{ color: POLAROID_MUTE }}
                  numberOfLines={1}
                >
                  {caption}
                </Text>
              ) : null}
              {audience ? (
                <Text
                  className="mt-1 font-sans-b text-[10px] uppercase tracking-wide"
                  style={{ color: POLAROID_MUTE }}
                >
                  Shared with {audienceLabel(audience)}
                </Text>
              ) : null}
            </View>
          ) : (
            <View className="mt-2 flex-row items-center gap-2">
              <Avatar
                name={person?.name ?? firstName}
                emoji={person?.emoji}
                accent={accent}
                personId={personId}
                size="xs"
              />
              <View className="min-w-0 flex-1">
                <Text
                  className="font-sans-b text-[12px]"
                  style={{ color: POLAROID_INK }}
                  numberOfLines={1}
                >
                  {firstName}
                </Text>
                <Text
                  className="font-sans-md text-[11px]"
                  style={{ color: POLAROID_MUTE }}
                  numberOfLines={1}
                >
                  {caption}
                </Text>
              </View>
            </View>
          )}
        </Pressable>
      </AnalyticsRegion>
    </View>
  );
}
