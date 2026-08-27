// ============================================
// WHAT THIS FILE DOES (plain English):
// One shared microphone for Billy across Home, the floating Island, and the
// full Billy room. Starts listening in one place, keeps listening when you
// change screens, shows a live transcript when the browser can, auto-sends
// after a short silence, and lets you stop from the Island stop square.
// ============================================
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Alert, Platform } from 'react-native';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import {
  trackProduct,
  type AssistantProposal,
  type AssistantTurnResponse
} from '@bridger/shared';
import { assistantVoiceTurn } from '../data/assistant';
import { startLiveSpeech } from '../lib/assistant-live-speech';
import {
  BILLY_RECORDING_OPTIONS,
  isHearingVoice,
  recordingToUpload
} from '../lib/assistant-voice';
import { useBridgeLive } from './bridge-live-provider';

/** Quiet this long after you spoke → send the clip automatically. */
const SILENCE_AUTO_SEND_MS = 2400;

export type BillyVoiceResult = AssistantTurnResponse & { transcript?: string };

export type BillyVoiceHandlers = {
  /** Open or reuse the Nest session before a voice send. */
  ensureSession: () => Promise<string>;
  /** Apply Billy's reply on the active screen (Home card or chat). */
  onVoiceResult: (res: BillyVoiceResult) => void;
  /** Soft error UI for the active screen. */
  onVoiceError?: (kind: 'permission' | 'record' | 'send') => void;
};

type BillyVoiceState = {
  listening: boolean;
  hearing: boolean;
  /** Live words while speaking (web speech); empty on native until send. */
  liveTranscript: string;
  /** True while we are stopping the mic and uploading. */
  sending: boolean;
  startListening: () => Promise<void>;
  /** Stop and discard (Island stop square / Stop without send). */
  cancelListening: () => Promise<void>;
  /** Stop and send now (Stop when you are done, or silence auto-send). */
  finishListening: () => Promise<void>;
  /** Toggle: start if idle, finish (send) if listening. */
  toggleListening: () => Promise<void>;
  /** Screens register so a send from Island still lands somewhere useful. */
  bindHandlers: (handlers: BillyVoiceHandlers | null) => void;
  /** Result saved when no screen was bound (Island-only send). */
  takePendingResult: () => BillyVoiceResult | null;
};

const BillyVoiceContext = createContext<BillyVoiceState | null>(null);

export function BillyVoiceProvider({ children }: { children: React.ReactNode }) {
  const { sessionId, setLive } = useBridgeLive();
  const recorder = useAudioRecorder(BILLY_RECORDING_OPTIONS);
  const recState = useAudioRecorderState(recorder, 120);

  const [liveTranscript, setLiveTranscript] = useState('');
  const [sending, setSending] = useState(false);
  const liveTranscriptRef = useRef('');

  const handlersRef = useRef<BillyVoiceHandlers | null>(null);
  const speechRef = useRef<{ stop: () => void } | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heardOnceRef = useRef(false);
  const finishingRef = useRef(false);
  const pendingResultRef = useRef<BillyVoiceResult | null>(null);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const setTranscript = useCallback((text: string) => {
    liveTranscriptRef.current = text;
    setLiveTranscript(text);
  }, []);

  const listening = recState.isRecording;
  const hearing = listening && isHearingVoice(recState.metering);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopSpeech = useCallback(() => {
    speechRef.current?.stop();
    speechRef.current = null;
  }, []);

  // THIS SECTION DOES: keep Bridge Island status in sync with the shared mic
  useEffect(() => {
    if (sending) {
      setLive({ status: 'thinking', line: 'Working…' });
      return;
    }
    if (listening) {
      setLive({
        status: 'listening',
        line: liveTranscript.trim() || 'Listening…'
      });
    }
  }, [listening, sending, liveTranscript, setLive]);

  const finishListening = useCallback(async () => {
    if (finishingRef.current) return;
    if (!recState.isRecording && !recorder.uri) return;
    finishingRef.current = true;
    clearSilenceTimer();
    stopSpeech();
    setSending(true);
    setLive({ status: 'thinking', line: 'Working…' });
    try {
      if (recState.isRecording) {
        await recorder.stop();
      }
      const uri = recorder.uri;
      if (!uri) throw new Error('no recording');
      const { base64, filename } = await recordingToUpload(uri);
      const handlers = handlersRef.current;
      let id = sessionIdRef.current;
      if (handlers) {
        id = await handlers.ensureSession();
      }
      if (!id) throw new Error('no session');
      const res = await assistantVoiceTurn(id, base64, filename);
      const live = liveTranscriptRef.current.trim();
      const merged: BillyVoiceResult = {
        ...res,
        transcript: (res.transcript ?? live).trim() || res.transcript
      };
      if (handlers?.onVoiceResult) {
        handlers.onVoiceResult(merged);
      } else {
        pendingResultRef.current = merged;
        setLive({
          status: 'result',
          line: merged.reply?.slice(0, 80) || 'Billy has an answer'
        });
      }
      setTranscript('');
      heardOnceRef.current = false;
    } catch {
      handlersRef.current?.onVoiceError?.('send');
      if (!handlersRef.current?.onVoiceError) {
        Alert.alert('Voice', 'Could not send that recording. Try typing.');
      }
      setLive({ status: 'idle', line: '' });
      setTranscript('');
      heardOnceRef.current = false;
    } finally {
      setSending(false);
      finishingRef.current = false;
    }
  }, [
    clearSilenceTimer,
    recState.isRecording,
    recorder,
    setLive,
    setTranscript,
    stopSpeech
  ]);

  const finishRef = useRef(finishListening);
  finishRef.current = finishListening;

  // THIS SECTION DOES: after you speak, a few quiet seconds means "send it"
  useEffect(() => {
    if (!listening || sending) {
      clearSilenceTimer();
      return;
    }
    if (hearing) {
      heardOnceRef.current = true;
      clearSilenceTimer();
      return;
    }
    if (!heardOnceRef.current) return;
    if (silenceTimerRef.current) return;
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      void finishRef.current();
    }, SILENCE_AUTO_SEND_MS);
    return () => clearSilenceTimer();
  }, [listening, hearing, sending, clearSilenceTimer]);

  const cancelListening = useCallback(async () => {
    clearSilenceTimer();
    stopSpeech();
    heardOnceRef.current = false;
    setTranscript('');
    finishingRef.current = true;
    try {
      if (recState.isRecording) {
        await recorder.stop();
      }
    } catch {
      // ignore
    } finally {
      finishingRef.current = false;
      setLive({ status: 'idle', line: '' });
    }
  }, [
    clearSilenceTimer,
    recState.isRecording,
    recorder,
    setLive,
    setTranscript,
    stopSpeech
  ]);

  const startListening = useCallback(async () => {
    if (recState.isRecording || sending || finishingRef.current) return;
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      trackProduct('permission_result', {
        permission: 'mic',
        outcome: perm.granted ? 'granted' : 'denied',
        context: 'assistant'
      });
      if (!perm.granted) {
        handlersRef.current?.onVoiceError?.('permission');
        if (!handlersRef.current?.onVoiceError) {
          Alert.alert(
            'Microphone',
            'Billy needs mic access to hear you. You can still type.'
          );
        }
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true
      });
      setTranscript('');
      heardOnceRef.current = false;
      await recorder.prepareToRecordAsync();
      recorder.record();
      // Live captions on supporting browsers (parallel to the audio file).
      speechRef.current = startLiveSpeech((text) => setTranscript(text));
      setLive({ status: 'listening', line: 'Listening…' });
    } catch {
      handlersRef.current?.onVoiceError?.('record');
      if (!handlersRef.current?.onVoiceError) {
        Alert.alert(
          'Microphone',
          Platform.OS === 'web'
            ? 'Could not open the mic in this browser. Allow microphone access, or type instead.'
            : 'Could not open the mic. Check permissions, or type instead.'
        );
      }
    }
  }, [recState.isRecording, recorder, sending, setLive, setTranscript]);

  const toggleListening = useCallback(async () => {
    if (sending) return;
    if (recState.isRecording) {
      await finishListening();
      return;
    }
    await startListening();
  }, [finishListening, recState.isRecording, sending, startListening]);

  const bindHandlers = useCallback((handlers: BillyVoiceHandlers | null) => {
    handlersRef.current = handlers;
  }, []);

  const takePendingResult = useCallback(() => {
    const v = pendingResultRef.current;
    pendingResultRef.current = null;
    return v;
  }, []);

  const value = useMemo(
    () => ({
      listening,
      hearing,
      liveTranscript,
      sending,
      startListening,
      cancelListening,
      finishListening,
      toggleListening,
      bindHandlers,
      takePendingResult
    }),
    [
      listening,
      hearing,
      liveTranscript,
      sending,
      startListening,
      cancelListening,
      finishListening,
      toggleListening,
      bindHandlers,
      takePendingResult
    ]
  );

  return (
    <BillyVoiceContext.Provider value={value}>
      {children}
    </BillyVoiceContext.Provider>
  );
}

export function useBillyVoice(): BillyVoiceState {
  const ctx = useContext(BillyVoiceContext);
  if (!ctx) {
    return {
      listening: false,
      hearing: false,
      liveTranscript: '',
      sending: false,
      startListening: async () => undefined,
      cancelListening: async () => undefined,
      finishListening: async () => undefined,
      toggleListening: async () => undefined,
      bindHandlers: () => undefined,
      takePendingResult: () => null
    };
  }
  return ctx;
}
