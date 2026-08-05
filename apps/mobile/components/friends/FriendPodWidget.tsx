// ============================================
// WHAT THIS FILE DOES (plain English):
// The Friend Pod entry on Friends (and Home "This week"): "Your friends' week"
// play card, plus "Add your recap" and "Submit a question". Play opens the
// full weekly podcast player at /recap.
// The play card stays near-black with white type in every theme (bg-ink flips
// cream in dark mode and white text would vanish). The mic wiggles so people
// notice "Add your recap".
// Analytics: play / record / submit_question use FRIENDS.pod.* ids.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRightIcon, MicIcon, PlayIcon, PlusIcon } from 'lucide-react-native';
import { FRIENDS } from '@bridger/shared';
import { Avatar, Glow, ORGANIC, Wiggle, cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import { useFriendPod } from '../../hooks/useFriendPod';

/** Fixed near-black so the play card never becomes cream in dark mode. */
const POD_INK = '#1C1B16';

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
  const { recap } = useFriendPod();
  const voices = recap?.voices ?? [];
  const minutes = recap?.minutes ?? 0;
  const questionCount = recap?.questionCount ?? 5;

  return (
    <View className="gap-2.5">
      <Pressable
        onPress={withAnalyticsPress(playAnalyticsId, onPlay)}
        accessibilityRole="button"
        accessibilityLabel={`Play your friends' week. ${voices.length} recaps, ${minutes} minutes`}
        style={[ORGANIC.soft, { backgroundColor: POD_INK }]}
        className="w-full flex-row items-center gap-4 px-5 py-5 active:opacity-95"
      >
        {/* true white play disc — Glow so the eye lands on "press me" first. */}
        <Glow periodMs={2000} intensity={0.3}>
          <View
            className="h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <PlayIcon size={24} color={POD_INK} strokeWidth={2.4} style={{ marginLeft: 2 }} />
          </View>
        </Glow>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-pixel text-[17px] leading-[21px] text-white">
            Your friends' week
          </Text>
          <Text numberOfLines={1} className="font-sans-sb text-[12px] text-white/70">
            {voices.length} recaps · {minutes} min
          </Text>
        </View>
        <View className="shrink-0 flex-row items-center">
          {voices.slice(0, 3).map((p, i) => (
            <View
              key={p.id}
              className={cn('rounded-full border-2', i > 0 && '-ml-2')}
              style={{ borderColor: POD_INK }}
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
            {/* Wiggle draws the eye to the mic so people notice they can record. */}
            <Wiggle everyMs={4500}>
              <MicIcon size={20} color="#6B2FEA" strokeWidth={2.4} />
            </Wiggle>
            <Text numberOfLines={1} className="min-w-0 flex-1 font-sans-b text-[14px] text-ink">
              Add your recap
            </Text>
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
