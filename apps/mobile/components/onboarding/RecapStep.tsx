// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10F — "Recap." The highlight of your week, in your own voice (a 20 second
// memo) or typed. Two modes: tap the big mic to record, or switch to "Type
// instead." Skippable.
//
// This is a REAL recorder now: tapping the mic asks for the microphone in
// context, records up to 20 seconds with a live timer, and hands the finished
// clip's file path back to the flow so it can be uploaded when you continue. You
// can play the take back or tap the mic again to re-record.
//
// PERMISSIONS: the microphone is asked for the moment you tap record, never at
// launch. PRIVACY: audio is your own capture; analytics only ever record that a
// recap was added and its length, never the audio or the words.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { KeyboardIcon, MicIcon, PlayIcon, SquareIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { ButtonSecondary, TextField, cn, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { WASH_BODY } from './onboarding-wash';

const MAX_SECONDS = 20;

export function RecapStep({
  step,
  total,
  mode,
  text,
  recorded,
  onSetMode,
  onChangeText,
  onRecorded,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  mode: 'voice' | 'text';
  text: string;
  recorded: boolean;
  onSetMode: (m: 'voice' | 'text') => void;
  onChangeText: (v: string) => void;
  onRecorded: (uri: string) => void;
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
  const [clipUri, setClipUri] = useState<string | null>(null);
  const player = useAudioPlayer(clipUri ? { uri: clipUri } : null);
  const playStatus = useAudioPlayerStatus(player);
  const isPlaying = Boolean(playStatus.playing);

  const pulse = useRef(new Animated.Value(1)).current;

  // THIS SECTION DOES: auto-stop at the 20 second cap so nobody runs over.
  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS) {
      void stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, recording]);

  // THIS SECTION DOES: pulse the mic while recording so it feels live.
  useEffect(() => {
    if (!recording) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [recording, pulse]);

  // THIS SECTION DOES: start recording — ask for the mic in context first.
  // Works on iOS, Android, and the browser (expo-audio uses MediaRecorder on
  // web). If the browser blocks audio, we fail quietly so "Type instead" is
  // always a way through.
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
      // Mic unavailable (e.g. an insecure web origin): stay put, let them type.
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

  // THIS SECTION DOES: the big button — record, stop, or (if done) start over.
  function onMicPress() {
    if (recording) {
      void stop();
      return;
    }
    void start();
  }

  // THIS SECTION DOES: play the take you just recorded (separate from the mic).
  function onPlayPress() {
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
  }

  const done = recorded || Boolean(clipUri);

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="The good part of your week."
      ask="What's been your highlight?"
      accent="coral"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="gap-5">
        {mode === 'voice' ? (
          <View className="items-center gap-4">
            <Pressable
              onPress={withAnalyticsPress(ONBOARDING.taste.recap_record, onMicPress)}
              accessibilityRole="button"
              accessibilityLabel={
                recording ? 'Stop recording' : done ? 'Record again' : 'Record a voice memo'
              }
              accessibilityState={{ selected: recording }}
            >
              <Animated.View
                style={{ transform: [{ scale: pulse }] }}
                className={cn(
                  'h-32 w-32 items-center justify-center rounded-full border-2 border-ink',
                  recording ? 'bg-coral' : done ? 'bg-green' : 'bg-ink/[0.04]'
                )}
              >
                {recording ? (
                  <SquareIcon size={40} color="#FFFFFF" strokeWidth={2.4} />
                ) : (
                  <MicIcon size={44} color={done ? '#FFFFFF' : '#1C1B16'} strokeWidth={2.2} />
                )}
              </Animated.View>
            </Pressable>

            <Text className={cn('font-sans-b text-[14px]', WASH_BODY)}>
              {recording
                ? `Recording ${seconds}s of ${MAX_SECONDS}s`
                : done
                  ? 'Recorded. Tap the mic to redo.'
                  : 'Tap to record'}
            </Text>

            {/* THIS SECTION DOES: a thin progress bar while recording. */}
            {recording || done ? (
              <View className="h-2.5 w-full overflow-hidden rounded-full border border-ink-line bg-surface">
                <View
                  className="h-full bg-pink"
                  style={{
                    width: `${Math.round(((recording ? seconds : MAX_SECONDS) / MAX_SECONDS) * 100)}%`
                  }}
                />
              </View>
            ) : null}

            {/* THE PLAYBACK: only shows once you have a finished take. */}
            {done && !recording ? (
              <ButtonSecondary
                full
                tone="outline"
                icon={
                  isPlaying ? (
                    <SquareIcon size={16} strokeWidth={2.5} />
                  ) : (
                    <PlayIcon size={16} strokeWidth={2.5} />
                  )
                }
                analyticsId={ONBOARDING.taste.recap_play}
                onPress={onPlayPress}
                accessibilityLabel={isPlaying ? 'Stop playback' : 'Play your recording'}
              >
                {isPlaying ? 'Stop' : 'Play it back'}
              </ButtonSecondary>
            ) : null}

            <ButtonSecondary
              full
              tone="ghost"
              onColorWash
              icon={<KeyboardIcon size={16} strokeWidth={2.5} />}
              analyticsId={ONBOARDING.taste.recap_type}
              onPress={() => onSetMode('text')}
              accessibilityLabel="Type instead"
            >
              Type instead
            </ButtonSecondary>
          </View>
        ) : (
          <View className="gap-3">
            <TextField
              labelTone="onaccent"
              label="Highlight of your week"
              value={text}
              onChange={onChangeText}
              placeholder="One good thing that happened"
              analyticsId={ONBOARDING.taste.recap_type}
            />
            <ButtonSecondary
              full
              tone="ghost"
              onColorWash
              icon={<MicIcon size={16} strokeWidth={2.5} />}
              analyticsId={ONBOARDING.taste.recap_record}
              onPress={() => onSetMode('voice')}
              accessibilityLabel="Record instead"
            >
              Record instead
            </ButtonSecondary>
          </View>
        )}
      </View>
    </OnboardingStep>
  );
}
