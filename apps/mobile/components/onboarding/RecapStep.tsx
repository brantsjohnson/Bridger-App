// ============================================
// WHAT THIS FILE DOES (plain English):
// Onboarding taste of the Friend Pod: record one voice answer with the SAME
// UI as "Add your recap" (purple progress pills, lavender question card, black
// mic circle). Question is Q1 of the weekly set ("High of the week?"). Skippable.
//
// This is a REAL recorder: tapping the mic asks for the microphone in context,
// records up to 20 seconds, and hands the clip path back so it can upload when
// you continue. Tap the green circle to play back; Re-record to try again.
//
// PERMISSIONS: mic asked the moment you tap record, never at launch.
// PRIVACY: analytics only note that a recap was added and its length, never audio.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { ONBOARDING } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { RECAP_WEEK } from '../../data/fixtures/catalog';
import {
  RecapMicButton,
  RecapMicStatus,
  RecapProgressPills,
  RecapQuestionCard
} from '../pod/RecapRecordChrome';
import { OnboardingStep } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';

const MAX_SECONDS = 20;
/** Onboarding samples the first weekly question so it matches Friend Pod Q1. */
const SAMPLE_TOTAL = RECAP_WEEK.questions.length;
const SAMPLE_QUESTION = RECAP_WEEK.questions[0] ?? 'High of the week?';

export function RecapStep({
  step,
  total,
  initialUri = null,
  onRecorded,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  /** Clip path if they already recorded and came back to this step. */
  initialUri?: string | null;
  onRecorded: (uri: string | null) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  // The real recorder + its live state (is it recording, how long so far).
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const recording = recState.isRecording;
  const seconds = Math.min(MAX_SECONDS, Math.floor((recState.durationMillis ?? 0) / 1000));

  // The finished clip we can play back (set once you stop recording).
  const [clipUri, setClipUri] = useState<string | null>(initialUri ?? null);
  const player = useAudioPlayer(clipUri ? { uri: clipUri } : null);
  const playStatus = useAudioPlayerStatus(player);
  const isPlaying = Boolean(playStatus.playing);

  const done = Boolean(clipUri);

  // THIS SECTION DOES: auto-stop at the 20 second cap so nobody runs over.
  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS) {
      void stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, recording]);

  // THIS SECTION DOES: start recording - ask for the mic in context first.
  const start = async () => {
    try {
      if (player?.playing) player.pause();
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return;
      setClipUri(null);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      // Mic unavailable (e.g. an insecure web origin): stay put, Skip still works.
    }
  };

  // THIS SECTION DOES: stop recording, hand the mic back, and keep the clip.
  const stop = async () => {
    if (!recState.isRecording) return;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (uri) {
        setClipUri(uri);
        onRecorded(uri);
      }
    } catch {
      // Ignore a stop error; the timer already reset the button state.
    }
  };

  // THIS SECTION DOES: play or pause the take (same as the podcast mic).
  const togglePlayback = () => {
    if (!clipUri || !player) return;
    if (isPlaying) {
      player.pause();
      return;
    }
    try {
      player.seekTo(0);
    } catch {
      // some platforms ignore seek before play
    }
    player.play();
  };

  // THIS SECTION DOES: clear the take so they can record again.
  const rerecord = () => {
    try {
      if (player?.playing) player.pause();
    } catch {
      // player already torn down
    }
    setClipUri(null);
    onRecorded(null);
  };

  // Big circle: record / stop / play / pause (matches Friend Pod).
  const onMainPress = () => {
    if (recording) {
      void stop();
      return;
    }
    if (done && clipUri) {
      togglePlayback();
      return;
    }
    void start();
  };

  const statusLabel = recording
    ? `0:${String(seconds).padStart(2, '0')} · ${MAX_SECONDS}s max`
    : done
      ? isPlaying
        ? 'Playing…'
        : 'Tap to play'
      : 'Tap to record';

  const micAnalyticsId = recording
    ? ONBOARDING.taste.recap_record
    : done
      ? ONBOARDING.taste.recap_play
      : ONBOARDING.taste.recap_record;

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="The good part of your week."
      ask="Share quick updates with your friends"
      smallAsk
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      {/* SAME CHROME AS FRIEND POD: pills, lavender card, black mic circle. */}
      <View style={{ gap: 16, width: '100%' }}>
        <RecapProgressPills total={SAMPLE_TOTAL} step={0} completed={done ? [0] : []} />

        <RecapQuestionCard
          step={0}
          total={SAMPLE_TOTAL}
          question={SAMPLE_QUESTION}
          maxSeconds={MAX_SECONDS}
        />

        <View style={{ alignItems: 'center' }}>
          <RecapMicButton
            state={
              recording ? 'recording' : done ? (isPlaying ? 'playing' : 'recorded') : 'idle'
            }
            analyticsId={micAnalyticsId}
            analyticsProps={{ method: 'voice' }}
            onPress={onMainPress}
          />
          <RecapMicStatus label={statusLabel} />
        </View>

        {done && !recording ? (
          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.taste.recap_record, rerecord, {
              analyticsProps: { method: 'voice', action: 'rerecord' }
            })}
            accessibilityRole="button"
            accessibilityLabel="Re-record"
            style={{
              alignSelf: 'center',
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: 12,
              borderWidth: OB_BORDER,
              borderColor: OB.navy,
              backgroundColor: OB.paper,
              paddingVertical: 10
            }}
          >
            <Text className="font-sans-b text-[14px]" style={{ color: OB.navy }}>
              Re-record
            </Text>
          </Pressable>
        ) : null}
      </View>
    </OnboardingStep>
  );
}
