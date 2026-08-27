// ============================================
// WHAT THIS FILE DOES (plain English):
// A small Billy capsule pinned to the top when work is live and you left
// Home. Idle never shows. While listening you see the live transcript and a
// stop square (cancel). Tapping the rest opens the full Billy screen with the
// same listening session still running.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ASSISTANT } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import type { AgentStatus } from './agent';
import { BillyMark, type MarkMood } from './BillyMark';
import { BILLY_BLUE } from './billy-theme';
import { VoiceWave } from './VoiceWave';

type Props = {
  status: AgentStatus;
  line: string;
  /** Live metering while the shared mic is open. */
  hearing?: boolean;
  /** Live words while speaking. */
  transcript?: string;
  onOpen: () => void;
  /** Stop square: discard this take (do not send). */
  onStopListen?: () => void;
};

export function AgentIsland({
  status,
  line,
  hearing = false,
  transcript = '',
  onOpen,
  onStopListen
}: Props) {
  const insets = useSafeAreaInsets();
  const visible =
    status === 'listening' ||
    status === 'thinking' ||
    status === 'background' ||
    status === 'result' ||
    status === 'needs-you';

  if (!visible) return null;

  const mood: MarkMood =
    status === 'listening'
      ? 'listening'
      : status === 'thinking' || status === 'background'
        ? 'thinking'
        : 'excited';

  const listening = status === 'listening';
  const display = listening
    ? transcript.trim() || line || 'Listening…'
    : line;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 z-40 items-center px-5"
      style={{ top: Math.max(insets.top, 8) + 4 }}
    >
      <View
        className="max-w-full flex-row items-center gap-2 rounded-full py-2 pl-2 pr-2"
        style={{ backgroundColor: BILLY_BLUE }}
      >
        <Pressable
          onPress={withAnalyticsPress(ASSISTANT.island.open, onOpen)}
          accessibilityRole="button"
          accessibilityLabel={`Open Billy: ${display}`}
          className="min-w-0 flex-1 flex-row items-center gap-2.5 py-0.5 pl-0 pr-1"
        >
          <BillyMark mood={mood} size="sm" tile surface="island" />
          <AnalyticsRegion
            analyticsId={ASSISTANT.island.line}
            interactive={false}
            className="min-w-0 flex-1"
          >
            <Text
              className="font-sans-b text-[13px] text-white"
              numberOfLines={1}
            >
              {display}
            </Text>
          </AnalyticsRegion>
          {listening ? (
            <VoiceWave
              active
              hearing={hearing}
              size="sm"
              color="#FFFFFF"
              className="shrink-0"
            />
          ) : null}
        </Pressable>

        {/* THIS SECTION DOES: stop square cancels listening without sending */}
        {listening && onStopListen ? (
          <Pressable
            onPress={withAnalyticsPress(ASSISTANT.island.stop, onStopListen)}
            accessibilityRole="button"
            accessibilityLabel="Stop listening"
            className="h-9 w-9 items-center justify-center rounded-full bg-white/20"
            hitSlop={8}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: '#FFFFFF'
              }}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
