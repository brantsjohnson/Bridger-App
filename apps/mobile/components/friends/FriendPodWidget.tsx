// ============================================
// WHAT THIS FILE DOES (plain English):
// The Friend Pod entry on Friends (and Home "This week"): "Your friends' week"
// play card, plus "Add your recap" and "Submit a question". Play opens the
// full weekly podcast player at /recap.
// Light mode: near-black play card with white type + white play button.
// Dark mode: white play card with black type + dark play button. The play
// control is a true circle with an inset ring + darker bottom extrusion, and
// it slowly rocks. The mic wiggles so people notice "Add your recap".
// Analytics: play / record / submit_question use FRIENDS.pod.* ids.
// ============================================
import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  Text,
  View,
  useColorScheme
} from 'react-native';
import { ChevronRightIcon, PlusIcon } from 'lucide-react-native';
import { FRIENDS } from '@bridger/shared';
import {
  Avatar,
  NATIVE_DRIVER,
  ORGANIC,
  cn,
  useReduceMotion,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { useFriendPod } from '../../hooks/useFriendPod';
import { PixelPlayIcon, PLAY_GRID_H, PLAY_GRID_W, PLAY_ON_DARK, PLAY_ON_LIGHT } from './PixelPlayIcon';
import { RecapTeaser } from './RecapTeaser';

/** Near-black used for the light-mode play card (and avatar rings on it). */
const POD_INK = '#1C1B16';
const POD_WHITE = '#FFFFFF';

/** Play disc size. Slightly taller than wide so the bottom extrusion shows. */
const PLAY_W = 56;
const PLAY_H = Math.round((PLAY_W * PLAY_GRID_H) / PLAY_GRID_W);
/** How far the play button tips each way (degrees). Small on purpose. */
const ROCK_DEG = 4;
/** One swing from left tip to right tip (or back). Slow so it feels calm. */
const ROCK_MS = 3200;

// THIS SECTION DOES: on web, match the CSS theme (prefers-color-scheme), because
// Expo web's useColorScheme can disagree with the canvas colors from global.css.
function subscribePrefersDark(onStoreChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}
function getPrefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function useIsDarkMode() {
  const scheme = useColorScheme();
  const prefersDark = useSyncExternalStore(subscribePrefersDark, getPrefersDark, () => false);
  if (Platform.OS === 'web') return prefersDark;
  return scheme === 'dark';
}

export function FriendPodWidget({
  size = 'full',
  onPlay,
  onRecord,
  onSubmitQuestion,
  /** Home uses HOME.this_week.play_recap; Friends tab uses FRIENDS.pod.play. */
  playAnalyticsId = FRIENDS.pod.play
}: {
  size?: 'full' | 'half';
  onPlay?: () => void;
  onRecord?: () => void;
  onSubmitQuestion?: () => void;
  playAnalyticsId?: string;
}) {
  const c = useThemeColors();
  const isDark = useIsDarkMode();
  const reduce = useReduceMotion();
  // THIS SECTION DOES: light = black card + light play icon; dark = white card + dark play icon.
  const cardBg = isDark ? POD_WHITE : POD_INK;
  const titleColor = isDark ? POD_INK : POD_WHITE;
  const metaColor = isDark ? 'rgba(28, 27, 22, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  const avatarRing = isDark ? POD_WHITE : POD_INK;
  const { recap } = useFriendPod();
  const voices = recap?.voices ?? [];
  const minutes = recap?.minutes ?? 0;
  const questionCount = recap?.questionCount ?? 5;

  // THIS SECTION DOES: a gentle pivot rock (−deg ↔ +deg) for the play disc.
  const rock = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    if (reduce) {
      rock.setValue(0);
      return;
    }
    rock.setValue(-1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rock, {
          toValue: 1,
          duration: ROCK_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER
        }),
        Animated.timing(rock, {
          toValue: -1,
          duration: ROCK_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [rock, reduce]);
  const rockRotate = rock.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${ROCK_DEG}deg`, `${ROCK_DEG}deg`]
  });

  return (
    <View className="gap-2.5">
      <Pressable
        onPress={withAnalyticsPress(playAnalyticsId, onPlay)}
        accessibilityRole="button"
        accessibilityLabel={`Play your friends' week. ${voices.length} recaps, ${minutes} minutes`}
        style={[ORGANIC.soft, { backgroundColor: cardBg }]}
        className="w-full flex-row items-center gap-2.5 px-5 py-5 active:opacity-95"
      >
        {/* Round pixel play disc. Black card → white button; white card →
            black button. Inset ring + darker extrusion; transparent outside. */}
        <Animated.View
          className="shrink-0"
          style={{
            width: PLAY_W,
            height: PLAY_H,
            transform: [{ rotate: rockRotate }]
          }}
        >
          <PixelPlayIcon
            width={PLAY_W}
            height={PLAY_H}
            // Light mode card is black → inverted (white) button.
            // Dark mode card is white → dark button.
            colors={isDark ? PLAY_ON_LIGHT : PLAY_ON_DARK}
          />
        </Animated.View>
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className="font-pixel text-[17px] leading-[21px]"
            style={{ color: titleColor }}
          >
            Your friends' week
          </Text>
          <Text numberOfLines={1} className="font-sans-sb text-[12px]" style={{ color: metaColor }}>
            {voices.length} recaps · {minutes} min
          </Text>
        </View>
        <View className="shrink-0 flex-row items-center">
          {voices.slice(0, 3).map((p, i) => (
            <View
              key={p.id}
              className={cn('rounded-full border-2', i > 0 && '-ml-2')}
              style={{ borderColor: avatarRing }}
            >
              <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="xs" />
            </View>
          ))}
        </View>
      </Pressable>

      {size === 'full' ? (
        <>
          <Pressable
            onPress={withAnalyticsPress(FRIENDS.pod.record, onRecord)}
            accessibilityRole="button"
            accessibilityLabel="Add your recap"
            className="min-h-[44px] w-full flex-row items-center gap-3 rounded-2xl border border-ink-line bg-surface px-4 py-3.5 active:bg-[#F1ECFF]"
          >
            {/* The looping mic-to-REC-to-wave animation. It carries the mic and
                the "Add your recap" words; the count + chevron stay put. */}
            <RecapTeaser />
            <Text className="shrink-0 font-sans-sb text-[12px] text-ink-mute">
              {questionCount} questions · 20s
            </Text>
            <ChevronRightIcon size={16} color={c.inkMute} strokeWidth={2.6} />
          </Pressable>

          <Pressable
            onPress={withAnalyticsPress(FRIENDS.pod.submit_question, onSubmitQuestion)}
            accessibilityRole="button"
            accessibilityLabel="Submit a question"
            className="min-h-[44px] w-full flex-row items-center gap-3 rounded-2xl border border-ink-line bg-surface px-4 py-3 active:bg-[#F1ECFF]"
          >
            <PlusIcon size={16} color="#6B2FEA" strokeWidth={3} />
            <Text className="font-sans-b text-[13px] text-ink">Submit a question</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
