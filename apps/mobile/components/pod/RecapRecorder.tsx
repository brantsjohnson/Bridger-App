// ============================================
// WHAT THIS FILE DOES (plain English):
// "Add your recap": first you see all 5 questions (and that each answer is
// 20 seconds), then you answer them one by one by voice, pick who hears it
// (Close / Friends / Everyone), and Post. Each answer is recorded in-app
// (no uploads from your library). When you post, the clips are uploaded and
// stitched into the weekly podcast on the Friends tab.
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
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { CheckIcon, MicIcon, SquareIcon } from 'lucide-react-native';
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
  const recorded = Boolean(clips[step]);
  const seconds = Math.min(MAX_SECONDS, Math.floor((recState.durationMillis ?? 0) / 1000));

  // Start the timed flow when the sheet opens; reset everything on close.
  useEffect(() => {
    if (open) {
      startedAt.current = Date.now();
      completed.current = false;
      trackFlowStarted('take_recap', { parent_screen: 'friends' });
      return;
    }
    setPhase('preview');
    setStep(0);
    setClips({});
    setTier('friend');
    setPosting(false);
  }, [open]);

  // Auto-stop at the cap so nobody rambles past the limit.
  useEffect(() => {
    if (recState.isRecording && seconds >= MAX_SECONDS) {
      void stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, recState.isRecording]);

  const start = async () => {
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
    const uri = recorder.uri;
    if (uri) {
      setClips((prev) => ({
        ...prev,
        [step]: { uri, duration: seconds || 1 }
      }));
    }
  };

  const rerecord = () => {
    setClips((prev) => {
      const next = { ...prev };
      delete next[step];
      return next;
    });
  };

  const next = () => {
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
      for (const [idx, clip] of entries) {
        const questionIndex = Number(idx);
        const mediaId = await uploadRecapClip(clip.uri, weekId, questionIndex);
        answers.push({ questionIndex, mediaId, duration: clip.duration });
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

  return (
    <Sheet
      open={open}
      onClose={() => {
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
        // --- Recording one question at a time ---
        <View className="gap-4">
          {/* Progress dots: done (green), current (purple), upcoming (grey). */}
          <View className="flex-row items-center gap-1.5">
            {questions.map((_, i) => (
              <View
                key={i}
                className={cn(
                  'h-2 flex-1 rounded-full',
                  clips[i] ? 'bg-success' : i === step ? 'bg-purple' : 'bg-ink/15'
                )}
              />
            ))}
          </View>

          {/*
            Pastel question card always uses near-black type (text-onaccent).
            Theme ink flips light in dark mode and vanishes on this wash.
          */}
          <View className="rounded-2xl bg-[#EDE6FF] px-5 py-6">
            <Text className="text-center font-sans-b text-[11px] uppercase tracking-wide text-onaccent/55">
              Q{step + 1} of {total}
            </Text>
            <Text className="mt-1.5 text-center font-sans-b text-[19px] leading-snug text-onaccent">
              {questions[step]}
            </Text>
            <Text className="mt-3 text-center font-sans-sb text-[12px] text-onaccent/70">
              {MAX_SECONDS} seconds for this answer
            </Text>
          </View>

          <View className="items-center">
            <Pressable
              onPress={withAnalyticsPress(
                recState.isRecording
                  ? RECAP_RECORDER.record.stop
                  : RECAP_RECORDER.record.start,
                () => (recState.isRecording ? void stop() : void start()),
                { analyticsProps: { method: 'voice' } }
              )}
              accessibilityRole="button"
              accessibilityLabel={recState.isRecording ? 'Stop recording' : 'Record answer'}
              className={cn(
                'h-20 w-20 items-center justify-center rounded-full',
                // Fixed near-black — bg-ink flips cream in dark mode and hides the white mic.
                recState.isRecording ? 'bg-coral' : recorded ? 'bg-success' : 'bg-[#1C1B16]'
              )}
            >
              {recState.isRecording ? (
                <SquareIcon size={26} color="#FFFFFF" strokeWidth={2.6} />
              ) : recorded ? (
                <CheckIcon size={30} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <MicIcon size={30} color="#FFFFFF" strokeWidth={2.4} />
              )}
            </Pressable>
            <Text
              accessibilityLiveRegion="polite"
              className="mt-2.5 font-sans-b text-[12px] text-ink-mute"
            >
              {recState.isRecording
                ? `0:${String(seconds).padStart(2, '0')} · ${MAX_SECONDS}s max`
                : recorded
                  ? 'Recorded'
                  : 'Tap to record'}
            </Text>
          </View>

          <View className="flex-row gap-2.5">
            {recorded ? (
              <ButtonSecondary
                full
                analyticsId={RECAP_RECORDER.record.rerecord}
                onPress={rerecord}
              >
                Re-record
              </ButtonSecondary>
            ) : null}
            {/* Metal primary — never a black solid that vanishes on the dark sheet. */}
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
      )}
    </Sheet>
  );
}
