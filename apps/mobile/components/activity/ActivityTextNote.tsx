// ============================================
// WHAT THIS FILE DOES (plain English):
// One text-note card on a Side Quest wall (like Notes App Discovery). Shows
// the blurb as the main thing, with a little pencil accent. Same heart
// double-tap as polaroids. Slight tilt unless Reduce Motion is on.
//
// PRIVACY/DESIGN: note faces stay white, so name/blurb use hard dark ink.
// Analytics: grid.text_note (dead single-tap) / grid.heart (double-tap).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { HeartIcon } from 'lucide-react-native';
import { ACTIVITY, trackClick } from '@bridger/shared';
import {
  AnalyticsRegion,
  Avatar,
  cn,
  useReduceMotion
} from '@bridger/ui';
import { personById } from '../../data/people';

// Hard dark ink on the always-white note face (theme tokens flip in dark mode)
const NOTE_INK = '#1C1B16';
const NOTE_MUTE = '#5C594E';

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

export type ActivityTextNoteProps = {
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

export function ActivityTextNote({
  postId,
  personId,
  emoji,
  caption,
  audience,
  index,
  hearted,
  onToggleHeart
}: ActivityTextNoteProps) {
  const reduceMotion = useReduceMotion();
  const isMine = personId === 'me';
  const person = isMine ? null : personById(personId);
  const accent = person?.accent ?? 'pink';
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
        analyticsId={ACTIVITY.grid.text_note}
        interactive={false}
        analyticsProps={{ post_id: postId }}
      >
        <Pressable
          onPress={handlePress}
          accessibilityRole="imagebutton"
          accessibilityLabel={
            isMine
              ? `Your note${caption ? `: ${caption}` : ''}`
              : `Note by ${firstName}${hearted ? ', hearted' : ''}`
          }
          accessibilityHint={
            isMine ? undefined : 'Double tap to heart or unheart'
          }
          className={cn(
            'relative min-h-[164px] rounded-none bg-white p-3 pb-3',
            isMine ? 'border-2 border-[#1C1B16]' : 'border border-[#D6D3C8]'
          )}
        >
          {/* THIS SECTION DOES: little pencil mark in the corner, like a notes app */}
          <Text accessible={false} className="absolute right-2 top-2 text-[16px]">
            {emoji || '✏️'}
          </Text>

          {/* THIS SECTION DOES: the blurb itself, the main thing people read */}
          <Text
            className="mt-1 pr-6 font-sans-md text-[13px] leading-snug"
            style={{ color: NOTE_INK }}
            numberOfLines={5}
          >
            {caption || '…'}
          </Text>

          {/* Corner heart — thin outline; fills red when hearted */}
          {!isMine ? (
            <View
              pointerEvents="none"
              className="absolute bottom-10 right-2"
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

          {/* THIS SECTION DOES: who wrote it, under the blurb */}
          {isMine ? (
            <View className="mt-auto pt-3">
              <Text
                className="font-sans-b text-[12px]"
                style={{ color: NOTE_INK }}
              >
                You · just now
              </Text>
              {audience ? (
                <Text
                  className="mt-1 font-sans-b text-[10px] uppercase tracking-wide"
                  style={{ color: NOTE_MUTE }}
                >
                  Shared with {audienceLabel(audience)}
                </Text>
              ) : null}
            </View>
          ) : (
            <View className="mt-auto flex-row items-center gap-2 pt-3">
              <Avatar
                name={person?.name ?? firstName}
                emoji={person?.emoji}
                accent={accent}
                personId={personId}
                size="xs"
              />
              <Text
                className="min-w-0 flex-1 font-sans-b text-[12px]"
                style={{ color: NOTE_INK }}
                numberOfLines={1}
              >
                {firstName}
              </Text>
            </View>
          )}
        </Pressable>
      </AnalyticsRegion>
    </View>
  );
}
