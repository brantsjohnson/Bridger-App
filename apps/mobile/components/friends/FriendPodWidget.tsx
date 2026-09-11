// ============================================
// WHAT THIS FILE DOES (plain English):
// The Friend Pod card on Friends. Matches the Magic Patterns play card:
// eyebrow + days left on top, then the pixel play button on the LEFT next to
// "Your friends' week", a round arrow on the right, and a divider with who is
// in this week. Two taps that never fight: the whole card is a door that opens
// the recap page paused (it sits underneath everything), and the pixel play
// button on top opens that page already playing.
//
// Light mode: near-black card with white type. Dark mode: white card
// with black type. The play disc still rocks unless Reduce Motion is on.
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
import { ChevronRightIcon, ClockIcon } from 'lucide-react-native';
import { FRIENDS } from '@bridger/shared';
import {
  Avatar,
  NATIVE_DRIVER,
  ORGANIC,
  cn,
  useReduceMotion,
  useResponsiveLayout,
  withAnalyticsPress
} from '@bridger/ui';
import { useFriendPod } from '../../hooks/useFriendPod';
import { PixelPlayIcon, PLAY_GRID_H, PLAY_GRID_W, PLAY_ON_DARK, PLAY_ON_LIGHT } from './PixelPlayIcon';

const POD_INK = '#1C1B16';
const POD_WHITE = '#FFFFFF';

const PLAY_W = 52;
const PLAY_H = Math.round((PLAY_W * PLAY_GRID_H) / PLAY_GRID_W);

const ROCK_DEG = 4;
const ROCK_MS = 3200;

// THIS SECTION DOES: on web, match the CSS theme (prefers-color-scheme).
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

/** Days until this recap week locks over (next Monday UTC). */
function daysLeftInWeek(weekStart?: string): number | null {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  if (weekStart) {
    const start = Date.parse(`${weekStart}T00:00:00.000Z`);
    if (!Number.isFinite(start)) return null;
    return Math.max(0, Math.ceil((start + weekMs - Date.now()) / (24 * 60 * 60 * 1000)));
  }
  const now = new Date();
  const day = now.getUTCDay();
  const add = day === 1 ? 7 : (8 - day) % 7;
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + add);
  return Math.max(0, Math.ceil((next - Date.now()) / (24 * 60 * 60 * 1000)));
}

function daysLeftLabel(days: number): string {
  if (days <= 0) return 'Last day';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function FriendPodWidget({
  onPlay,
  onOpen,
  playAnalyticsId = FRIENDS.pod.play,
  openAnalyticsId = FRIENDS.pod.open
}: {
  /** Kept for caller compatibility; the card is one size now. */
  size?: 'full' | 'half';
  /** Pixel play: open the recap page and start audio. */
  onPlay?: () => void;
  /** Arrow / card: open the recap page paused. */
  onOpen?: () => void;
  playAnalyticsId?: string;
  openAnalyticsId?: string;
}) {
  const isDark = useIsDarkMode();
  const reduce = useReduceMotion();
  const { contentMaxWidth } = useResponsiveLayout();

  const cardBg = isDark ? POD_WHITE : POD_INK;
  const titleColor = isDark ? POD_INK : POD_WHITE;
  const metaColor = isDark ? 'rgba(28, 27, 22, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  const avatarRing = isDark ? POD_WHITE : POD_INK;

  const { recap } = useFriendPod();
  const voices = recap?.voices ?? [];
  const minutes = recap?.minutes ?? 0;
  const questionCount = recap?.questionCount ?? 5;
  const mineIn = recap?.hasMineThisWeek === true;
  const daysLeft = daysLeftInWeek(recap?.weekStart);

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

  const openPaused = onOpen ?? onPlay;
  // The round arrow well: a faint circle on the card so it reads as "open".
  const chevronBg = isDark ? 'rgba(28, 27, 22, 0.10)' : 'rgba(255, 255, 255, 0.15)';

  return (
    <View className="gap-2.5" style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}>
      {/* THIS SECTION DOES: the whole card. The door (open paused) is a full
          layer underneath; the play button and arrow sit on top so a tap on
          either one never gets swallowed by the door and never opens it twice. */}
      <View
        style={[ORGANIC.soft, { backgroundColor: cardBg }]}
        className="relative w-full overflow-hidden px-5 py-5"
      >
        {/* THE DOOR: one big tap target under everything. Opens the recap paused. */}
        <Pressable
          onPress={withAnalyticsPress(openAnalyticsId, openPaused)}
          accessibilityRole="button"
          accessibilityLabel="Open your friends' week"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />

        {/* THE FACE: everything you see. box-none lets empty taps fall through to
            the door, while the play button and arrow keep their own taps. */}
        <View pointerEvents="box-none">
          {/* Row 1: what this is, and how long is left to add yours. */}
          <View className="flex-row items-center justify-between gap-2">
            <Text
              className="font-sans-b text-[11px] uppercase tracking-[0.8px]"
              style={{ color: metaColor }}
            >
              Weekly voice catch-up
            </Text>
            {daysLeft != null ? (
              <View className="shrink-0 flex-row items-center gap-1">
                <ClockIcon size={12} color={metaColor} strokeWidth={2.2} />
                <Text className="font-sans-sb text-[11px]" style={{ color: metaColor }}>
                  {daysLeftLabel(daysLeft)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Row 2: pixel play (left) · title + who is in (middle) · arrow (right). */}
          <View className="mt-3.5 flex-row items-center gap-3.5">
            {/* THE SHORTCUT: pixel play. Opens the recap already playing. */}
            <Pressable
              onPress={withAnalyticsPress(playAnalyticsId, onPlay)}
              accessibilityRole="button"
              accessibilityLabel={`Play your friends' week. ${voices.length} recaps, ${minutes} minutes`}
              className="shrink-0 items-center justify-center active:opacity-90"
              hitSlop={8}
            >
              <View style={{ width: PLAY_W, height: PLAY_H }}>
                <Animated.View style={{ transform: [{ rotate: rockRotate }] }}>
                  <PixelPlayIcon
                    width={PLAY_W}
                    height={PLAY_H}
                    colors={isDark ? PLAY_ON_LIGHT : PLAY_ON_DARK}
                  />
                </Animated.View>
              </View>
            </Pressable>

            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className="font-pixel text-[18px] leading-[22px]"
                style={{ color: titleColor }}
              >
                Your friends' week
              </Text>
              <Text
                numberOfLines={1}
                className="mt-1 font-sans-sb text-[12px]"
                style={{ color: metaColor }}
              >
                {voices.length === 0
                  ? 'No recaps yet · add yours'
                  : `${voices.length} friends · ${minutes} min · same ${questionCount} questions`}
              </Text>
            </View>

            {/* THE ARROW: same destination as the door (paused). Sits in a well. */}
            <View
              className="h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: chevronBg }}
            >
              <ChevronRightIcon size={16} color={titleColor} strokeWidth={2.8} />
            </View>
          </View>

          {/* Divider + who is in this week (only once someone has recorded). */}
          {voices.length > 0 ? (
            <View
              className="mt-4 flex-row items-center gap-2.5 border-t pt-3.5"
              style={{ borderTopColor: isDark ? 'rgba(28,27,22,0.12)' : 'rgba(255,255,255,0.15)' }}
            >
              <View className="shrink-0 flex-row items-center">
                {voices.slice(0, 5).map((p, i) => (
                  <View
                    key={p.id}
                    className={cn('rounded-full border-2', i > 0 && '-ml-2')}
                    style={{ borderColor: avatarRing }}
                  >
                    <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="xs" />
                  </View>
                ))}
              </View>
              <Text
                numberOfLines={1}
                className="min-w-0 flex-1 font-sans-sb text-[12px]"
                style={{ color: metaColor }}
              >
                {mineIn ? "You're in this week" : `${voices.length} in · yours is missing`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

    </View>
  );
}
