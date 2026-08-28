// ============================================
// WHAT THIS FILE DOES (plain English):
// "Add your recap": first you see all 5 questions (and that each answer is
// 20 seconds), then you answer them one by one by voice, pick who hears it
// (Close / Friends / Everyone), and Post. Each answer is recorded in-app
// (no uploads from your library). After you record, the big green button
// PLAYS it back (Re-record is the separate way to try again). When you post,
// the clips are uploaded and stitched into the weekly podcast on Friends.
//
// PERMISSIONS: the microphone is asked for HERE, the moment you tap record, with
// a plain reason — never at app launch (store rule).
// PRIVACY: audio is your own capture; analytics only ever record counts and
// durations, never the audio itself.
// ACCESSIBILITY: every control is labelled and the running time is shown as text
// as well as by the button state. Pastel cards use always-dark type so they
// stay readable in dark mode.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import type { RecapAudience } from '@bridger/shared';
import {
  RECAP_RECORDER,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct
} from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  Sheet,
  cn,
  useSurfaceAct,
  withAnalyticsPress
} from '@bridger/ui';
import { postRecapAnswers, uploadRecapClip } from '../../data/pod';
import {
  RecapMicButton,
  RecapMicStatus,
  RecapProgressPills,
  RecapQuestionCard
} from './RecapRecordChrome';

/** Hard cap on each answer — short on purpose. */
const MAX_SECONDS = 20;

const AUDIENCE: Array<{ label: string; tier: RecapAudience; id: string }> = [
  { label: 'Close', tier: 'close', id: RECAP_RECORDER.audience.close },
  { label: 'Friends', tier: 'friend', id: RECAP_RECORDER.audience.friends },
  { label: 'Everyone', tier: 'acquaintance', id: RECAP_RECORDER.audience.everyone }
];

type Clip = { uri: string; duration: number };
type Phase = 'preview' | 'record' | 'summary';

export function RecapRecorder({
  open,
  onClose,
  weekId,
  questions,
  onPosted
}: {
  open: boolean;
  onClose: () => void;
  weekId: string;
  questions: string[];
  onPosted?: () => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const { markActed } = useSurfaceAct();

  const [phase, setPhase] = useState<Phase>('preview');
  const [step, setStep] = useState(0);
  const [clips, setClips] = useState<Record<number, Clip>>({});
  const [tier, setTier] = useState<RecapAudience>('friend');
  const [posting, setPosting] = useState(false);

  const startedAt = useRef<number | null>(null);
  const completed = useRef(false);

  const total = questions.length;
  const clip = clips[step];
  const recorded = Boolean(clip);
  const seconds = Math.min(MAX_SECONDS, Math.floor((recState.durationMillis ?? 0) / 1000));

  // THIS SECTION DOES: play back the take you just recorded (same clip URI).
  const player = useAudioPlayer(clip?.uri ? { uri: clip.uri } : null);
  const playStatus = useAudioPlayerStatus(player);
  const isPlaying = Boolean(playStatus.playing);

  const stopPlayback = () => {
    try {
      if (player?.playing) player.pause();
    } catch {
      // player already torn down
    }
  };

  // Start the timed flow when the sheet opens; reset everything on close.
  useEffect(() => {
    if (open) {
      startedAt.current = Date.now();
      completed.current = false;
      trackFlowStarted('take_recap', { parent_screen: 'friends' });
      return;
    }
    stopPlayback();
    setPhase('preview');
    setStep(0);
    setClips({});
    setTier('friend');
    setPosting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-stop at the cap so nobody rambles past the limit.
  useEffect(() => {
    if (recState.isRecording && seconds >= MAX_SECONDS) {
      void stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, recState.isRecording]);

  // Stop playback when you move to another question.
  useEffect(() => {
    stopPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const start = async () => {
    stopPlayback();
    // Ask for the mic in context, right when they try to record.
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stop = async () => {
    if (!recState.isRecording) return;
    await recorder.stop();
    // Hand the mic back so playback can use the speaker.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const uri = recorder.uri;
    if (uri) {
      setClips((prev) => ({
        ...prev,
        [step]: { uri, duration: seconds || 1 }
      }));
    }
  };

  // THIS SECTION DOES: play or pause the current take (not start a new one).
  const togglePlayback = () => {
    if (!clip?.uri || !player) return;
    if (isPlaying) {
      player.pause();
      return;
    }
    // Replay from the start so "tap to play" always hears the whole take.
    try {
      player.seekTo(0);
    } catch {
      // some platforms ignore seek before play
    }
    player.play();
  };

  const rerecord = () => {
    stopPlayback();
    setClips((prev) => {
      const next = { ...prev };
      delete next[step];
      return next;
    });
  };

  const next = () => {
    stopPlayback();
    trackFlowStep('take_recap', `q${step + 1}`, { parent_screen: 'friends' });
    if (step + 1 >= total) {
      setPhase('summary');
      return;
    }
    setStep((s) => s + 1);
  };

  const beginRecording = () => {
    trackFlowStep('take_recap', 'preview', { parent_screen: 'friends' });
    setPhase('record');
    setStep(0);
  };

  const post = async () => {
    if (posting) return;
    setPosting(true);
    try {
      // Upload each recorded clip, then send the set with the chosen audience.
      const entries = Object.entries(clips);
      const answers = [] as Array<{ questionIndex: number; mediaId: string; duration: number }>;
      for (const [idx, clipItem] of entries) {
        const questionIndex = Number(idx);
        const mediaId = await uploadRecapClip(clipItem.uri, weekId, questionIndex);
        answers.push({ questionIndex, mediaId, duration: clipItem.duration });
      }
      await postRecapAnswers({ audience: tier, answers });

      completed.current = true;
      markActed();
      const elapsed = startedAt.current != null ? Date.now() - startedAt.current : 0;
      trackFlowCompleted('take_recap', elapsed, { parent_screen: 'friends' });
      // Product outcome: how many answers + audience. Never the audio.
      trackProduct('recap_posted', {
        answers: answers.length,
        audience: tier
      });
      onPosted?.();
      onClose();
    } finally {
      setPosting(false);
    }
  };

  const abandonStep =
    phase === 'preview' ? 'preview' : phase === 'summary' ? 'audience' : `q${step + 1}`;

  // Big circle: record / stop / play / pause. Never re-record from the check.
  const onMainPress = () => {
    if (recState.isRecording) {
      void stop();
      return;
    }
    if (recorded) {
      togglePlayback();
      return;
    }
    void start();
  };

  const mainAnalyticsId = recState.isRecording
    ? RECAP_RECORDER.record.stop
    : recorded
      ? isPlaying
        ? RECAP_RECORDER.record.pause
        : RECAP_RECORDER.record.play
      : RECAP_RECORDER.record.start;

  const statusLabel = recState.isRecording
    ? `0:${String(seconds).padStart(2, '0')} · ${MAX_SECONDS}s max`
    : recorded
      ? isPlaying
        ? 'Playing…'
        : 'Tap to play'
      : 'Tap to record';

  return (
    <Sheet
      open={open}
      onClose={() => {
        stopPlayback();
        if (!completed.current && startedAt.current != null) {
          trackFlowAbandoned('take_recap', Date.now() - startedAt.current, abandonStep, {
            parent_screen: 'friends'
          });
        }
        onClose();
      }}
      title="Your recap"
      surface="recap_recorder"
      parentScreen="friends"
      dismissAnalyticsId={RECAP_RECORDER.actions.dismiss}
    >
      {phase === 'preview' ? (
        // --- First: show every question so they know what is coming ---
        <View className="gap-4">
          <Text className="text-center font-sans-sb text-[13px] leading-snug text-ink-soft">
            You have {MAX_SECONDS} seconds per question.
          </Text>

          <AnalyticsRegion
            analyticsId={RECAP_RECORDER.question.list}
            interactive={false}
            className="overflow-hidden rounded-2xl border border-ink-line bg-surface"
          >
            <ScrollView className="max-h-[46vh]">
              {questions.map((q, i) => (
                <View
                  key={i}
                  className={cn(
                    'px-4 py-3.5',
                    i < questions.length - 1 && 'border-b border-ink-line'
                  )}
                >
                  <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                    Q{i + 1} of {total}
                  </Text>
                  <Text className="mt-0.5 font-sans-b text-[15px] leading-snug text-ink">{q}</Text>
                </View>
              ))}
            </ScrollView>
          </AnalyticsRegion>

          <ButtonPrimary
            full
            size="lg"
            analyticsId={RECAP_RECORDER.actions.start}
            onPress={beginRecording}
          >
            Start
          </ButtonPrimary>
        </View>
      ) : phase === 'summary' ? (
        // --- Last step: pick who hears it, then Post ---
        <View className="gap-4">
          <View>
            <Text className="mb-2 font-sans-b text-[12px] text-ink-soft">Share with</Text>
            <View className="flex-row gap-2">
              {AUDIENCE.map((a) => {
                const active = tier === a.tier;
                return (
                  <Pressable
                    key={a.tier}
                    onPress={withAnalyticsPress(a.id, () => setTier(a.tier))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={a.label}
                    className={cn(
                      'flex-1 items-center rounded-full px-3 py-2.5',
                      active ? 'bg-success' : 'border border-ink-line bg-surface'
                    )}
                  >
                    <Text
                      className={cn(
                        'font-sans-b text-[13px]',
                        active ? 'text-white' : 'text-ink'
                      )}
                    >
                      {a.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ButtonPrimary
            full
            size="lg"
            disabled={posting || Object.keys(clips).length === 0}
            analyticsId={RECAP_RECORDER.actions.post}
            onPress={() => void post()}
          >
            {posting ? 'Posting…' : 'Post'}
          </ButtonPrimary>
        </View>
      ) : (
        // --- Recording one question at a time (shared chrome with onboarding) ---
        <View className="gap-4">
          <RecapProgressPills
            total={total}
            step={step}
            completed={Object.keys(clips).map((k) => Number(k))}
          />

          <RecapQuestionCard
            step={step}
            total={total}
            question={questions[step] ?? ''}
            maxSeconds={MAX_SECONDS}
          />

          <View className="items-center">
            <RecapMicButton
              state={
                recState.isRecording
                  ? 'recording'
                  : recorded
                    ? isPlaying
                      ? 'playing'
                      : 'recorded'
                    : 'idle'
              }
              analyticsId={mainAnalyticsId}
              analyticsProps={{ method: 'voice' }}
              onPress={onMainPress}
            />
            <RecapMicStatus label={statusLabel} />
          </View>

          {/*
            Share the row with flex-1 wrappers. Two `full` (w-full) buttons in a
            row each want 100% width and shove Next off the right edge.
          */}
          <View className="flex-row gap-2.5">
            {recorded ? (
              <View className="min-w-0 flex-1">
                <ButtonSecondary
                  full
                  analyticsId={RECAP_RECORDER.record.rerecord}
                  onPress={rerecord}
                >
                  Re-record
                </ButtonSecondary>
              </View>
            ) : null}
            <View className="min-w-0 flex-1">
              <ButtonPrimary
                full
                disabled={!recorded}
                analyticsId={RECAP_RECORDER.record.next}
                onPress={next}
              >
                {step + 1 === total ? 'Done' : 'Next'}
              </ButtonPrimary>
            </View>
          </View>
        </View>
      )}

    </Sheet>
  );
}
