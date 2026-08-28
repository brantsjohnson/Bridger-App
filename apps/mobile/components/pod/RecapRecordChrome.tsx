// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared look for recording a Friend Pod answer: the purple progress pills,
// the lavender question card, the big black (or coral / green) mic circle, and
// the "Tap to record" status line. Used by the weekly RecapRecorder and by the
// onboarding RecapStep so both screens feel like the same tool.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MicIcon, PauseIcon, PlayIcon, SquareIcon } from 'lucide-react-native';
import { cn, withAnalyticsPress } from '@bridger/ui';

/** Soft lavender wash on the question card (same as the podcast recorder). */
export const RECAP_CARD_BG = '#EDE6FF';
/** Near-black fill for the idle mic (never theme ink, so dark mode stays readable). */
export const RECAP_MIC_IDLE = '#1C1B16';

/** Soft progress pills: done green, current purple, upcoming grey. */
export function RecapProgressPills({
  total,
  step,
  completed
}: {
  total: number;
  step: number;
  /** Indices that already have a clip. */
  completed?: ReadonlySet<number> | readonly number[];
}) {
  const done = completed instanceof Set ? completed : new Set(completed ?? []);
  return (
    <View className="flex-row items-center gap-1.5" accessible={false}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={cn(
            'h-2 flex-1 rounded-full',
            done.has(i) ? 'bg-success' : i === step ? 'bg-purple' : 'bg-ink/15'
          )}
        />
      ))}
    </View>
  );
}

/** Lavender card: "Q1 OF 5", the question, and the 20s hint. */
export function RecapQuestionCard({
  step,
  total,
  question,
  maxSeconds
}: {
  step: number;
  total: number;
  question: string;
  maxSeconds: number;
}) {
  return (
    <View className="rounded-2xl px-5 py-6" style={{ backgroundColor: RECAP_CARD_BG }}>
      <Text className="text-center font-sans-b text-[11px] uppercase tracking-wide text-onaccent/55">
        Q{step + 1} of {total}
      </Text>
      <Text className="mt-1.5 text-center font-sans-b text-[19px] leading-snug text-onaccent">
        {question}
      </Text>
      <Text className="mt-3 text-center font-sans-sb text-[12px] text-onaccent/70">
        {maxSeconds} seconds for this answer
      </Text>
    </View>
  );
}

type MicState = 'idle' | 'recording' | 'recorded' | 'playing';

/** Big circle: record / stop / play / pause. Same states as the podcast sheet. */
export function RecapMicButton({
  state,
  onPress,
  analyticsId,
  analyticsProps
}: {
  state: MicState;
  onPress: () => void;
  analyticsId: string;
  analyticsProps?: Record<string, string | number | boolean | undefined>;
}) {
  const label =
    state === 'recording'
      ? 'Stop recording'
      : state === 'playing'
        ? 'Pause playback'
        : state === 'recorded'
          ? 'Play recording'
          : 'Record answer';

  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress, { analyticsProps })}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        'h-20 w-20 items-center justify-center rounded-full',
        state === 'recording'
          ? 'bg-coral'
          : state === 'recorded' || state === 'playing'
            ? 'bg-success'
            : undefined
      )}
      style={state === 'idle' ? { backgroundColor: RECAP_MIC_IDLE } : undefined}
    >
      {state === 'recording' ? (
        <SquareIcon size={26} color="#FFFFFF" strokeWidth={2.6} />
      ) : state === 'playing' ? (
        <PauseIcon size={30} color="#FFFFFF" strokeWidth={2.6} />
      ) : state === 'recorded' ? (
        <PlayIcon size={30} color="#FFFFFF" strokeWidth={2.6} />
      ) : (
        <MicIcon size={30} color="#FFFFFF" strokeWidth={2.4} />
      )}
    </Pressable>
  );
}

/** Status under the mic: timer, tap to play, or tap to record. */
export function RecapMicStatus({ label }: { label: string }) {
  return (
    <Text
      accessibilityLiveRegion="polite"
      className="mt-2.5 font-sans-b text-[12px] text-ink-mute"
    >
      {label}
    </Text>
  );
}
