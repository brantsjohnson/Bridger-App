// ============================================
// WHAT THIS FILE DOES (plain English):
// Record a short voice note, play it back, optionally turn it into words,
// then drop it on the collage page. The microphone is asked here, on the
// record tap. Words never go to analytics.
// ============================================
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { COLLAGE_VOICE, trackClick, trackProduct } from '@bridger/shared';
import { ButtonPrimary, ButtonSecondary, Sheet, withAnalyticsPress } from '@bridger/ui';
import { transcribeCollageAudio } from '../../data/collage';

const MAX_SECONDS = 30;

export function VoiceRecorder({
  open,
  onClose,
  onAdd
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (clip: { uri: string; durationMs: number; transcript?: string }) => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const [uri, setUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [busy, setBusy] = useState(false);

  const player = useAudioPlayer(uri ? { uri } : null);
  const playStatus = useAudioPlayerStatus(player);
  const seconds = Math.min(MAX_SECONDS, Math.floor((recState.durationMillis ?? 0) / 1000));

  const askMic = async (): Promise<boolean> => {
    const res = await AudioModule.requestRecordingPermissionsAsync();
    trackProduct('permission_result', {
      permission: 'mic',
      outcome: res.granted ? 'granted' : res.canAskAgain === false ? 'denied' : 'dismissed',
      context: 'collage_voice'
    });
    trackClick(COLLAGE_VOICE.capture.permission_prompt, { outcome: res.granted ? 'granted' : 'denied' });
    if (!res.granted) {
      Alert.alert('Microphone needed', 'Allow the microphone to record a voice note.');
    }
    return res.granted;
  };

  const start = async () => {
    if (!(await askMic())) return;
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      trackClick(COLLAGE_VOICE.capture.record);
    } catch {
      Alert.alert('Could not record', 'Try again in a moment.');
    }
  };

  const stop = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const next = recorder.uri;
      setUri(next ?? null);
      setDurationMs(recState.durationMillis ?? 0);
      trackClick(COLLAGE_VOICE.capture.stop);
    } catch {
      // Empty stop is fine.
    }
  };

  const transcribe = async () => {
    if (!uri || busy) return;
    setBusy(true);
    try {
      const words = await transcribeCollageAudio(uri);
      setTranscript(words);
      trackProduct('collage_audio_transcribed', { has_text: !!words });
    } catch {
      Alert.alert('Could not transcribe', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        setUri(null);
        setTranscript('');
        onClose();
      }}
      title="Voice note"
      surface="collage_voice"
      parentScreen="collage_editor"
      dismissAnalyticsId={COLLAGE_VOICE.chrome.dismiss}
    >
      <View className="items-center pb-2">
        <Text className="font-sans-md text-[13px] text-ink/60">
          {recState.isRecording ? `Recording ${seconds}s` : uri ? 'Ready to add' : 'Tap to record'}
        </Text>
        <Pressable
          onPress={withAnalyticsPress(
            recState.isRecording ? COLLAGE_VOICE.capture.stop : COLLAGE_VOICE.capture.record,
            () => void (recState.isRecording ? stop() : start())
          )}
          accessibilityRole="button"
          accessibilityLabel={recState.isRecording ? 'Stop recording' : 'Start recording'}
          className="my-4 h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: recState.isRecording ? '#D64A3A' : '#1C1B16' }}
        >
          <View
            className={recState.isRecording ? 'h-7 w-7 rounded-sm bg-white' : 'h-14 w-14 rounded-full bg-white'}
          />
        </Pressable>
        {uri ? (
          <View className="w-full gap-2">
            <ButtonSecondary
              analyticsId={COLLAGE_VOICE.capture.play}
              onPress={() => {
                try {
                  if (playStatus.playing) player.pause();
                  else player.play();
                } catch {
                  // player not ready
                }
              }}
            >
              {playStatus.playing ? 'Pause' : 'Play'}
            </ButtonSecondary>
            <ButtonSecondary
              analyticsId={COLLAGE_VOICE.capture.transcribe}
              onPress={() => void transcribe()}
              disabled={busy}
            >
              {busy ? 'Hearing that…' : transcript ? 'Transcribe again' : 'Transcribe'}
            </ButtonSecondary>
            {transcript ? (
              <Text className="font-sans-md text-[14px] text-ink" accessibilityLabel="Transcript">
                {transcript}
              </Text>
            ) : null}
            <ButtonPrimary
              analyticsId={COLLAGE_VOICE.capture.add}
              onPress={() => {
                onAdd({ uri, durationMs, transcript: transcript || undefined });
                setUri(null);
                setTranscript('');
                onClose();
              }}
            >
              Add to the page
            </ButtonPrimary>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
