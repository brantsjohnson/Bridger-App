// ============================================
// WHAT THIS FILE DOES (plain English):
// "Add your recap" in three moves: RECORD → REVIEW → POSTED.
//   1. RECORD: the five questions are a swipeable deck. Answer the ones you
//      feel like (skipping is normal, not a failure), hear each take back, and
//      re-record if you want. Each answer is captured in-app by voice.
//   2. REVIEW: pick who hears it (Close / Friends / Acquaintances) and see
//      exactly what is going out and what you skipped.
//   3. POSTED: after the clips actually upload, a green confirmation stays put
//      so you know it went out. It does NOT close on its own — you tap Done.
//
// PERMISSIONS: the microphone is asked for HERE, the moment you tap record,
// with a plain reason, never at app launch (store rule).
// PRIVACY: audio is your own capture (no uploads from your library). Analytics
// only ever record counts, durations, and the audience, never the audio.
// ACCESSIBILITY: every control is labelled, the running time is shown as text,
// and pastel cards use always-dark type so they stay readable in dark mode.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
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
  ButtonPrimary,
  ButtonSecondary,
  PixelHeading,
  Sheet,
  cn,
  useSurfaceAct,
  withAnalyticsPress
} from '@bridger/ui';
import { postRecapAnswers, uploadRecapClip } from '../../data/pod';
import { VoiceWave } from '../assistant/VoiceWave';
import { QuestionCarousel } from './QuestionCarousel';
import { TakePlayback } from './TakePlayback';

/** Hard cap on each answer — short on purpose. */
const MAX_SECONDS = 20;

const AUDIENCE: Array<{ label: string; tier: RecapAudience; id: string }> = [
  { label: 'Close', tier: 'close', id: RECAP_RECORDER.audience.close },
  { label: 'Friends', tier: 'friend', id: RECAP_RECORDER.audience.friends },
  { label: 'Everyone', tier: 'acquaintance', id: RECAP_RECORDER.audience.everyone }
];

/** Plain-English "who hears it" for the posted confirmation. */
const AUDIENCE_LABEL: Record<RecapAudience, string> = {
  close: 'your close friends',
  friend: 'your friends',
  acquaintance: 'everyone'
};

type Clip = { uri: string; duration: number };
type Phase = 'record' | 'review' | 'posted';

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
  /** Fired once the recap is actually out, so the page can say "you're in". */
  onPosted?: () => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const { markActed } = useSurfaceAct();

  const [phase, setPhase] = useState<Phase>('record');
  const [index, setIndex] = useState(0);
  const [clips, setClips] = useState<Record<number, Clip>>({});
  const [tier, setTier] = useState<RecapAudience>('friend');
  const [posting, setPosting] = useState(false);

  const startedAt = useRef<number | null>(null);
  const completed = useRef(false);

  const total = questions.length;
  const answered = Object.keys(clips).map(Number);
  const currentClip = clips[index];
  const isRecording = recState.isRecording;
  const seconds = Math.min(MAX_SECONDS, Math.floor((recState.durationMillis ?? 0) / 1000));
  const totalSeconds = answered.reduce((n, i) => n + (clips[i]?.duration ?? 0), 0);

  // THIS SECTION DOES: start the timed flow when the sheet opens; reset all of
  // it when it closes so the next open is a clean slate.
  useEffect(() => {
    if (open) {
      startedAt.current = Date.now();
      completed.current = false;
      trackFlowStarted('take_recap', { parent_screen: 'friends' });
      return;
    }
    setPhase('record');
    setIndex(0);
    setClips({});
    setTier('friend');
    setPosting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // THIS SECTION DOES: auto-stop at the cap so nobody rambles past the limit.
  useEffect(() => {
    if (isRecording && seconds >= MAX_SECONDS) {
      void stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, isRecording]);

  // THIS SECTION DOES: begin recording the current question (asks mic first).
  const start = async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  // THIS SECTION DOES: stop recording and keep the take on the current question.
  const stop = async () => {
    if (!recState.isRecording) return;
    await recorder.stop();
    // Hand the mic back so playback can use the speaker.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const uri = recorder.uri;
    const len = Math.max(1, seconds);
    if (uri) {
      setClips((prev) => ({ ...prev, [index]: { uri, duration: len } }));
    }
  };

  // THIS SECTION DOES: throw away the take on a question so it can be redone.
  const drop = (i: number) =>
    setClips((prev) => {
      const next = { ...prev };
      delete next[i];
      return next;
    });

  // THIS SECTION DOES: move to another question, stopping any live recording.
  const goToQuestion = (i: number) => {
    if (isRecording) void stop();
    setIndex(i);
  };

  // THIS SECTION DOES: leave the questions and confirm who hears it.
  const goReview = () => {
    if (isRecording) void stop();
    trackFlowStep('take_recap', 'review', { parent_screen: 'friends' });
    setPhase('review');
  };

  // THIS SECTION DOES: upload every take, then flip to the posted confirmation.
  const post = async () => {
    if (posting) return;
    setPosting(true);
    try {
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
      trackProduct('recap_posted', { answers: answers.length, audience: tier });
      // Confirmation stays put; it closes only when they tap Done.
      setPhase('posted');
    } catch (e) {
      const raw = e instanceof Error ? e.message : '';
      Alert.alert(
        'Could not post your Friend Pod',
        /api 502|internal server error|gateway/i.test(raw) || !raw
          ? 'Check your connection and try again. Your clips are still on this phone.'
          : raw
      );
    } finally {
      setPosting(false);
    }
  };

  const abandonStep =
    phase === 'posted' ? 'posted' : phase === 'review' ? 'audience' : `q${index + 1}`;

  const audienceLabel = AUDIENCE.find((a) => a.tier === tier)?.label ?? 'Friends';

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
      title={phase === 'posted' ? 'Posted' : phase === 'review' ? 'Post your recap' : 'Your recap'}
      surface="recap_recorder"
      parentScreen="friends"
      dismissAnalyticsId={RECAP_RECORDER.actions.dismiss}
    >
      {phase === 'record' ? (
        // --- RECORD: swipe the five, answer what you feel like ---
        <View className="gap-4">
          <QuestionCarousel
            questions={questions}
            index={index}
            onIndexChange={goToQuestion}
            answered={answered}
            segmentAnalyticsId={RECAP_RECORDER.question.segment}
          />

          {currentClip ? (
            // You already recorded this one: hear it back or redo it.
            <TakePlayback
              uri={currentClip.uri}
              duration={currentClip.duration}
              label={`Your answer to Q${index + 1}`}
              onRerecord={() => drop(index)}
              playAnalyticsId={RECAP_RECORDER.record.play}
              pauseAnalyticsId={RECAP_RECORDER.record.pause}
              rerecordAnalyticsId={RECAP_RECORDER.record.rerecord}
            />
          ) : (
            // Not recorded yet: the big mic button + running time.
            <View className="items-center">
              <Pressable
                onPress={withAnalyticsPress(
                  isRecording ? RECAP_RECORDER.record.stop : RECAP_RECORDER.record.start,
                  () => (isRecording ? void stop() : void start()),
                  { analyticsProps: { method: 'voice' } }
                )}
                accessibilityRole="button"
                accessibilityLabel={isRecording ? 'Stop recording' : 'Record your answer'}
                className={cn(
                  'h-20 w-20 items-center justify-center rounded-full',
                  isRecording ? 'bg-coral' : 'bg-[#1C1B16]'
                )}
              >
                {isRecording ? (
                  <SquareIcon size={26} color="#FFFFFF" strokeWidth={2.6} />
                ) : (
                  <MicIcon size={30} color="#FFFFFF" strokeWidth={2.4} />
                )}
              </Pressable>

              {isRecording ? (
                <View className="mt-2.5 flex-row items-center gap-2">
                  <VoiceWave active hearing size="sm" bars={12} color="#E4572E" />
                  <Text accessibilityLiveRegion="polite" className="font-sans-b text-[12px] text-ink">
                    0:{String(seconds).padStart(2, '0')} · {MAX_SECONDS}s max
                  </Text>
                </View>
              ) : (
                <Text className="mt-2.5 font-sans-b text-[12px] text-ink-mute">
                  Tap to record · about 20 seconds
                </Text>
              )}
            </View>
          )}

          <View>
            <ButtonPrimary
              full
              size="lg"
              disabled={answered.length === 0}
              analyticsId={RECAP_RECORDER.actions.review}
              onPress={goReview}
            >
              {answered.length === 0 ? 'Record one answer to post' : 'Review & post'}
            </ButtonPrimary>
            {answered.length > 0 ? (
              <Text className="mt-2 text-center font-sans-b text-[11px] text-ink-mute">
                {answered.length} of {total} answered · skipped ones just won't appear
              </Text>
            ) : null}
          </View>
        </View>
      ) : phase === 'review' ? (
        // --- REVIEW: who hears it + what is going out ---
        <View className="gap-4">
          <View>
            <Text className="mb-2 font-sans-b text-[12px] text-ink-soft">
              Which friend group hears this recap
            </Text>
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
                      className={cn('font-sans-b text-[13px]', active ? 'text-white' : 'text-ink')}
                    >
                      {a.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="rounded-2xl border border-ink-line bg-surface p-4">
            <Text className="font-sans-b text-[13px] text-ink">
              {answered.length} answer{answered.length === 1 ? '' : 's'} · about {totalSeconds}s
            </Text>
            <View className="mt-2.5 gap-1.5">
              {questions.map((q, i) => {
                const has = Boolean(clips[i]);
                return (
                  <View key={`${q}-${i}`} className="flex-row items-start gap-2">
                    <View
                      className={cn(
                        'mt-[2px] h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        has ? 'bg-success' : 'bg-ink/10'
                      )}
                    >
                      {has ? (
                        <CheckIcon size={10} color="#FFFFFF" strokeWidth={3.5} />
                      ) : (
                        <Text className="font-sans-b text-[9px] text-ink-mute">–</Text>
                      )}
                    </View>
                    <Text
                      className={cn(
                        'min-w-0 flex-1 font-sans-sb text-[12px] leading-snug',
                        has ? 'text-ink' : 'text-ink-mute'
                      )}
                    >
                      {q}
                      {has ? '' : ' · skipped'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <ButtonPrimary
            full
            size="lg"
            disabled={posting || answered.length === 0}
            analyticsId={RECAP_RECORDER.actions.post}
            onPress={() => void post()}
          >
            {posting ? 'Posting…' : `Post to ${audienceLabel}`}
          </ButtonPrimary>
          <ButtonSecondary
            full
            tone="ghost"
            analyticsId={RECAP_RECORDER.actions.back}
            onPress={() => setPhase('record')}
          >
            Back to the questions
          </ButtonSecondary>
        </View>
      ) : (
        // --- POSTED: it went out. Stays until they tap Done. ---
        <View className="gap-4">
          <View className="items-center pt-1">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-success">
              <CheckIcon size={32} color="#FFFFFF" strokeWidth={3} />
            </View>
            <PixelHeading size="md" className="mt-3.5">
              You're in this week
            </PixelHeading>
            <Text className="mt-1.5 text-center font-sans-sb text-[13px] leading-snug text-ink-soft">
              {answered.length} answer{answered.length === 1 ? '' : 's'} sent to{' '}
              {AUDIENCE_LABEL[tier]}. They'll hear it in this week's recap.
            </Text>
          </View>

          <ButtonPrimary
            full
            size="lg"
            analyticsId={RECAP_RECORDER.actions.done}
            onPress={() => {
              onPosted?.();
              onClose();
            }}
          >
            Done
          </ButtonPrimary>
        </View>
      )}
    </Sheet>
  );
}
