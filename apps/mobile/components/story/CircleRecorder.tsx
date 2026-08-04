// ============================================
// WHAT THIS FILE DOES (plain English):
// The round, 10-second video reply — the Marco Polo style answer to someone's
// update. You see yourself in a circle, hold the button (or tap it) to record,
// and it stops itself at 10 seconds. Then you can watch it back, retake it, or
// send it. The ring around the circle drains as your 10 seconds run out.
//
// PERMISSIONS: camera and microphone are asked for HERE, the moment you try to
// record, with a plain reason on screen — never at app launch (store rule).
// MEDIA: capture only. There is no "choose from library" here on purpose.
// PRIVACY: nothing is uploaded until you press Send. Retake throws it away.
// ACCESSIBILITY: every control is labelled, the countdown is announced in text
// as well as by the ring, and the ring animation is skipped under Reduce Motion.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Platform,
  Pressable,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';
import { RotateCcwIcon, SwitchCameraIcon, XIcon } from 'lucide-react-native';
import { CIRCLE_RECORDER, trackProduct } from '@bridger/shared';
import { PixelHeading, SurfaceHost, useThemeColors, withAnalyticsPress } from '@bridger/ui';

/** The hard cap. A reply is a moment, not a monologue. */
const MAX_SECONDS = 10;
const CIRCLE = 260;
const RING = 6;

type Props = {
  open: boolean;
  onClose: () => void;
  /** hand the finished clip to the story viewer to post as a reply */
  onSend: (uri: string, seconds: number) => void | Promise<void>;
};

export function CircleRecorder({ open, onClose, onSend }: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const cameraRef = useRef<CameraView>(null);

  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clipUri, setClipUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Drains from full to empty across the 10 seconds.
  const ring = useRef(new Animated.Value(0)).current;

  // Video recording needs a real camera pipeline, which the web build does not
  // have. We say so plainly rather than showing a button that cannot work.
  const canRecord = Platform.OS !== 'web';
  const granted = Boolean(camPermission?.granted && micPermission?.granted);

  const player = useVideoPlayer(clipUri ?? null, (p) => {
    p.loop = true;
  });

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Fresh start every time the recorder opens.
  useEffect(() => {
    if (open) return;
    setRecording(false);
    setElapsed(0);
    setClipUri(null);
    setSending(false);
    ring.setValue(0);
  }, [open, ring]);

  // --- THE COUNTDOWN: ticks the label and drives the ring ---
  useEffect(() => {
    if (!recording) return;
    setElapsed(0);
    ring.setValue(0);

    if (!reduceMotion) {
      Animated.timing(ring, {
        toValue: 1,
        duration: MAX_SECONDS * 1000,
        useNativeDriver: false
      }).start();
    }

    const started = Date.now();
    const tick = setInterval(() => {
      setElapsed(Math.min(MAX_SECONDS, (Date.now() - started) / 1000));
    }, 100);

    return () => {
      clearInterval(tick);
      ring.stopAnimation();
    };
  }, [recording, ring, reduceMotion]);

  const start = async () => {
    if (!canRecord || recording) return;

    // Ask in context, right when they try to record.
    if (!camPermission?.granted) {
      const res = await requestCamPermission();
      if (!res.granted) return;
    }
    if (!micPermission?.granted) {
      const res = await requestMicPermission();
      if (!res.granted) return;
    }

    setRecording(true);
    try {
      // recordAsync resolves when it stops — either because we hit stop or
      // because maxDuration cut it off at 10 seconds.
      const result = await cameraRef.current?.recordAsync({ maxDuration: MAX_SECONDS });
      if (result?.uri) setClipUri(result.uri);
    } finally {
      setRecording(false);
    }
  };

  const stop = () => {
    if (!recording) return;
    cameraRef.current?.stopRecording();
  };

  const retake = () => {
    setClipUri(null);
    setElapsed(0);
    ring.setValue(0);
  };

  const send = async () => {
    if (!clipUri || sending) return;
    setSending(true);
    try {
      await onSend(clipUri, Math.round(elapsed));
      // Product outcome: a real reply went out. Length only, never the video.
      trackProduct('response_posted', {
        method: 'video',
        duration_seconds: Math.round(elapsed)
      });
      onClose();
    } finally {
      setSending(false);
    }
  };

  const secondsLeft = Math.max(0, MAX_SECONDS - elapsed);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <SurfaceHost surface="circle_recorder" parentScreen="story" open={open}>
        <View
          accessibilityViewIsModal
          style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}
          className="flex-1 items-center justify-center gap-6 bg-ink/95 px-6"
        >
          <Pressable
            onPress={withAnalyticsPress(CIRCLE_RECORDER.capture.dismiss, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="absolute right-5 h-10 w-10 items-center justify-center rounded-full bg-white/15"
            style={{ top: Math.max(insets.top, 16) }}
          >
            <XIcon size={20} color="#FFFFFF" strokeWidth={2.6} />
          </Pressable>

          <PixelHeading size="lg" className="text-white">
            {clipUri ? 'Send this?' : '10 second reply'}
          </PixelHeading>

          {/* --- THE CIRCLE: live camera, or your clip playing back --- */}
          <View
            style={{ width: CIRCLE, height: CIRCLE }}
            className="items-center justify-center"
          >
            {/* the draining ring */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: CIRCLE,
                height: CIRCLE,
                borderRadius: CIRCLE / 2,
                borderWidth: RING,
                borderColor: recording ? '#FF5A1F' : 'rgba(255,255,255,0.35)',
                opacity: recording && !reduceMotion
                  ? ring.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] })
                  : 1
              }}
            />

            <View
              style={{
                width: CIRCLE - RING * 3,
                height: CIRCLE - RING * 3,
                borderRadius: (CIRCLE - RING * 3) / 2,
                overflow: 'hidden',
                backgroundColor: '#000'
              }}
            >
              {clipUri ? (
                <VideoView
                  player={player}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  nativeControls={false}
                  accessibilityIgnoresInvertColors
                />
              ) : canRecord && granted ? (
                <CameraView
                  ref={cameraRef}
                  mode="video"
                  facing={facing}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View className="flex-1 items-center justify-center px-6">
                  <Text className="text-center font-sans-sb text-[13px] leading-snug text-white/70">
                    {canRecord
                      ? 'Bridger needs your camera and mic to record a reply. Tap record and allow it.'
                      : 'Recording a video reply works in the phone app. On the web preview you can still send a sticker or a comment.'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Countdown in words, not only as a ring (ACCESSIBILITY). */}
          <Text
            accessibilityLiveRegion="polite"
            className="font-sans-b text-[14px] text-white/80"
          >
            {clipUri
              ? `${Math.round(elapsed)}s clip`
              : recording
                ? `${Math.ceil(secondsLeft)}s left`
                : `Up to ${MAX_SECONDS} seconds`}
          </Text>

          {/* --- THE CONTROLS --- */}
          {clipUri ? (
            <View className="w-full flex-row items-center justify-center gap-3">
              <Pressable
                onPress={withAnalyticsPress(CIRCLE_RECORDER.capture.retake, retake)}
                accessibilityRole="button"
                accessibilityLabel="Retake"
                className="h-12 flex-row items-center gap-2 rounded-full bg-white/15 px-5 active:opacity-90"
              >
                <RotateCcwIcon size={18} color="#FFFFFF" strokeWidth={2.6} />
                <Text className="font-sans-b text-[14px] text-white">Retake</Text>
              </Pressable>
              <Pressable
                onPress={withAnalyticsPress(CIRCLE_RECORDER.capture.send, () => void send())}
                disabled={sending}
                accessibilityRole="button"
                accessibilityLabel="Send video reply"
                className="h-12 flex-1 items-center justify-center rounded-full bg-white active:opacity-90"
              >
                <Text className="font-sans-b text-[15px] text-ink">
                  {sending ? 'Sending…' : 'Send'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center gap-8">
              <Pressable
                onPress={withAnalyticsPress(CIRCLE_RECORDER.capture.switch_camera, () =>
                  setFacing((f) => (f === 'front' ? 'back' : 'front'))
                )}
                disabled={recording || !canRecord}
                accessibilityRole="button"
                accessibilityLabel="Switch camera"
                className="h-12 w-12 items-center justify-center rounded-full bg-white/15 active:opacity-90"
              >
                <SwitchCameraIcon size={22} color="#FFFFFF" strokeWidth={2.4} />
              </Pressable>

              <Pressable
                onPress={withAnalyticsPress(
                  recording ? CIRCLE_RECORDER.capture.stop : CIRCLE_RECORDER.capture.record,
                  () => (recording ? stop() : void start()),
                  { analyticsProps: { method: 'video' } }
                )}
                disabled={!canRecord}
                accessibilityRole="button"
                accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
                className="h-[76px] w-[76px] items-center justify-center rounded-full border-[5px] border-white active:opacity-90"
              >
                <View
                  className={
                    recording
                      ? 'h-7 w-7 rounded-md bg-coral'
                      : 'h-14 w-14 rounded-full bg-coral'
                  }
                />
              </Pressable>

              {/* keeps the record button centred */}
              <View className="h-12 w-12" />
            </View>
          )}
        </View>
      </SurfaceHost>
    </Modal>
  );
}
