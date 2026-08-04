// ============================================
// WHAT THIS FILE DOES (plain English):
// A friend's "touched grass" signal card for the announcements carousel —
// who, when, how many are in, then I'm in / dismiss. Matches Magic Patterns.
// Saying yes plays a grass burst, then drops you into the conversation.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRightIcon, XIcon } from 'lucide-react-native';
import type { GrassSignal } from '@bridger/shared';
import { Avatar, ButtonSecondary, useThemeColors } from '@bridger/ui';
import { personById } from '../data/people';
import { GrassBurst } from './GrassBurst';

export function FreeSignalCard({
  signal,
  onDismiss,
  onOpen,
  onJoined,
  burstOnMount = true
}: {
  signal: GrassSignal;
  onDismiss?: () => void;
  onOpen?: () => void;
  onJoined?: () => void;
  /** only the pinned one on Home earns the confetti on load */
  burstOnMount?: boolean;
}) {
  const c = useThemeColors();
  const person = personById(signal.personId);
  const first = person.name.split(' ')[0];
  const [joined, setJoined] = useState(false);
  const [burst, setBurst] = useState(burstOnMount);
  const inCount = signal.inIds?.length ?? 0;

  function join() {
    if (joined) return;
    setJoined(true);
    setBurst(true);
    setTimeout(() => onJoined?.(), 850);
  }

  return (
    <View className="relative min-h-[124px] overflow-visible rounded-card border-2 border-green bg-[#EEF8E3] px-4 py-3.5">
      <GrassBurst play={burst} onDone={() => setBurst(false)} />

      {/* the headline only — the plan itself is one tap away, not on the card */}
      <Pressable
        onPress={onOpen}
        disabled={!onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${first} touched grass`}
        className="flex-row items-center gap-3 pr-8"
      >
        <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="sm" />
        <View className="min-w-0 flex-1">
          <Text className="font-sans-b text-[14px] tracking-tight text-ink" numberOfLines={1}>
            🌱 {first} touched grass
          </Text>
          <Text className="font-sans-sb text-[12px] text-ink-mute" numberOfLines={1}>
            {signal.when}
            {inCount > 0
              ? ` · ${inCount} ${inCount === 1 ? 'person' : 'people'} in`
              : ' · nobody in yet'}
          </Text>
        </View>
        {onOpen ? <ChevronRightIcon size={16} color={c.inkMute} strokeWidth={2.6} /> : null}
      </Pressable>

      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          className="absolute right-2.5 top-2.5 z-10 h-7 w-7 items-center justify-center rounded-full active:bg-surface"
        >
          <XIcon size={16} color={c.inkMute} strokeWidth={2.6} />
        </Pressable>
      ) : null}

      <View className="mt-3">
        <ButtonSecondary full size="sm" tone="positive" onPress={join} disabled={joined}>
          {joined ? "You're in ✓" : "I'm in"}
        </ButtonSecondary>
      </View>
    </View>
  );
}
