// ============================================
// WHAT THIS FILE DOES (plain English):
// "Hear yourself back." After you record an answer, this little card plays the
// take you just made — the same play/scrub feel as a friend's clip — so nobody
// posts a voice note they have not listened to. The waveform only moves while
// it is actually playing, and "Re-record" is a plain secondary button because
// redoing a take is normal, not a mistake.
//
// PRIVACY: this plays your own recording straight off the phone. The audio is
// never sent to analytics; only counts/durations are.
// ACCESSIBILITY: the play/pause button is labelled, the time is shown as text,
// and the waveform is hidden from screen readers (it is decorative).
// ============================================
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { PauseIcon, PlayIcon, RotateCcwIcon } from 'lucide-react-native';
import { ButtonSecondary, cn, withAnalyticsPress } from '@bridger/ui';
import { VoiceWave } from '../assistant/VoiceWave';

const PURPLE = '#6B2FEA';

// THIS SECTION DOES: show seconds as 0:07 style time.
const fmt = (s: number) => `0:${String(Math.max(0, Math.round(s))).padStart(2, '0')}`;

export function TakePlayback({
  uri,
  duration = 1,
  label = 'Your take',
  onRerecord,
  playAnalyticsId,
  pauseAnalyticsId,
  rerecordAnalyticsId,
  className
}: {
  /** The recorded file to play back. */
  uri: string;
  /** How long the take is, in seconds (drives the bar before audio loads). */
  duration?: number;
  label?: string;
  /** If given, show a "Re-record" button that throws this take away. */
  onRerecord?: () => void;
  playAnalyticsId: string;
  pauseAnalyticsId: string;
  rerecordAnalyticsId?: string;
  className?: string;
}) {
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);
  const playing = Boolean(status.playing);
  const total = status.duration || duration || 1;
  const elapsed = status.currentTime || 0;

  // THIS SECTION DOES: stop the take if this card goes away (moved question).
  useEffect(() => {
    return () => {
      try {
        if (player?.playing) player.pause();
      } catch {
        // player already torn down — nothing to stop.
      }
    };
  }, [player]);

  // THIS SECTION DOES: play or pause. If it already finished, start over.
  const toggle = () => {
    if (!uri || !player) return;
    if (playing) {
      player.pause();
      return;
    }
    try {
      if (elapsed >= total - 0.1) player.seekTo(0);
    } catch {
      // some platforms ignore seek before play — safe to keep going.
    }
    player.play();
  };

  return (
    <View
      className={cn('rounded-2xl border border-ink-line bg-surface p-3.5', className)}
    >
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={withAnalyticsPress(playing ? pauseAnalyticsId : playAnalyticsId, toggle)}
          accessibilityRole="button"
          accessibilityLabel={playing ? `Pause ${label}` : `Play ${label}`}
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1C1B16] active:scale-95"
        >
          {playing ? (
            <PauseIcon size={20} color="#FFFFFF" strokeWidth={2.5} />
          ) : (
            <PlayIcon size={20} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </Pressable>

        <View className="min-w-0 flex-1">
          <Text className="font-sans-b text-[13px] text-ink">{label}</Text>
          <View className="mt-1.5 flex-row items-center gap-2.5">
            <VoiceWave active={playing} hearing={playing} size="sm" bars={14} color={PURPLE} />
            <Text className="shrink-0 font-sans-b text-[11px] text-ink-mute">
              {fmt(elapsed)} / {fmt(total)}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress bar under the row, filling as the take plays. */}
      <View className="mt-3 h-1 overflow-hidden rounded-full bg-ink/10">
        <View
          className="h-full rounded-full bg-purple"
          style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }}
        />
      </View>

      {onRerecord && rerecordAnalyticsId ? (
        <View className="mt-3">
          <ButtonSecondary
            full
            size="sm"
            analyticsId={rerecordAnalyticsId}
            icon={<RotateCcwIcon size={14} color="#1C1B16" strokeWidth={2.6} />}
            onPress={() => {
              try {
                if (player?.playing) player.pause();
              } catch {
                // nothing to stop
              }
              onRerecord();
            }}
          >
            Re-record
          </ButtonSecondary>
        </View>
      ) : null}
    </View>
  );
}
