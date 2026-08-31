// ============================================
// WHAT THIS FILE DOES (plain English):
// Capture + compose for a new Update. Live camera: tap the shutter for a photo,
// hold for video (≤20s). Camera (and mic for video) are asked at the shutter,
// never at launch. After capture they write a caption under the photo (never
// drawn on top of it) and pick who sees it. There is no camera-roll upload
// path. Video posting shows a co-op lock for free members. Under Themed posts,
// a toggle opts into BeReal-like reminders (1–3 a day). Emits the post_story
// flow + story_posted product event.
//
// ACCESSIBILITY: capture is always a near-black camera UI (fixed #0E0E0E), even
// in dark mode — never themed `bg-ink`, which flips light and washes out white
// chrome. White pills on that canvas use always-dark `onaccent` type.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions
} from 'expo-camera';
import { ChevronDownIcon, LockIcon, SwitchCameraIcon } from 'lucide-react-native';
import {
  POST_COMPOSER,
  trackClick,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct
} from '@bridger/shared';
import {
  AnalyticsRegion,
  AudiencePicker,
  ButtonPrimary,
  SurfaceHost,
  Toggle,
  cn,
  useSurfaceAct,
  withAnalyticsPress,
  type AudienceLevel
} from '@bridger/ui';
import {
  getNotificationPrefs,
  setNotificationKindPref
} from '../../data/notification-prefs';
import { requestNotificationPermission } from '../../lib/notifications';
import { useStoryCapture } from '../../hooks/useStoryCapture';

/** Max video length for an update (STORIES.md). */
const MAX_VIDEO_SECONDS = 20;
/** How long to hold before we treat it as video, not a photo tap. */
const HOLD_MS = 1000;
/** Poll while the camera mounts so we do not count setup time as a hold. */
const HOLD_ARM_POLL_MS = 50;

// Fixed near-black canvas for the camera sheet (does not follow theme ink).
const CAPTURE_BG = '#0E0E0E';
// Always-dark type on the white close pill and nudges card.
const ON_LIGHT_INK = '#1C1B16';
const ON_LIGHT_MUTE = '#4A483F';

type Props = {
  onClose?: () => void;
  onPosted?: () => void;
  /** PAYMENT: free members can't post video — show lock instead of capture */
  isCoopMember?: boolean;
  /** Pre-tag an event when opened from a party capture notification. */
  initialEventId?: string;
  initialEventTitle?: string;
};

export function CaptureCompose({
  onClose,
  onPosted,
  isCoopMember = false,
  initialEventId,
  initialEventTitle
}: Props) {
  const insets = useSafeAreaInsets();
  const { left, prompts, atCap, onCreate } = useStoryCapture();
  const cameraRef = useRef<CameraView>(null);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const [theme, setTheme] = useState<string | null>(null);
  const [captured, setCaptured] = useState<null | 'photo' | 'video'>(null);
  const [captureUri, setCaptureUri] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [recording, setRecording] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  /** picture until a hold becomes video; CameraView needs the matching mode. */
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  /**
   * Local flag so we can mount CameraView in the same shutter press that just
   * got OS permission (the permission hook re-renders a beat later).
   */
  const [cameraEnabled, setCameraEnabled] = useState(false);
  // Caption lives under the photo. Never drawn on top of the media.
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState<AudienceLevel>('friend');
  const [group, setGroup] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  /** Opt-in BeReal-like "capture your life" reminders — same pref as Settings. */
  const [randomNudges, setRandomNudges] = useState(false);
  const [taggedEventId, setTaggedEventId] = useState<string | null>(
    initialEventId ?? null
  );
  const [taggedEventTitle, setTaggedEventTitle] = useState<string | undefined>(
    initialEventTitle
  );
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef(false);
  /** True from press-in until press-out — blocks video if they lifted early. */
  const fingerDownRef = useRef(false);
  /** Set when the hold threshold crossed; cleared when video ends or co-op blocks. */
  const videoIntentRef = useRef(false);
  const cameraReadyRef = useRef(false);
  const cameraReadyWaiters = useRef<Array<() => void>>([]);
  const flowStartedAt = useRef(Date.now());
  const lastStep = useRef('open');

  const nativeCamera = Platform.OS !== 'web';
  const camGranted = !!camPerm?.granted || cameraEnabled;
  const showLiveCamera = nativeCamera && camGranted;

  // THIS SECTION DOES: if the OS already granted camera earlier, show the live preview.
  useEffect(() => {
    if (camPerm?.granted) setCameraEnabled(true);
  }, [camPerm?.granted]);

  // THIS SECTION DOES: wait until CameraView says it is ready (after mount / grant).
  const waitForCameraReady = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (cameraReadyRef.current && cameraRef.current) {
        resolve(true);
        return;
      }
      const timer = setTimeout(() => resolve(false), 4000);
      cameraReadyWaiters.current.push(() => {
        clearTimeout(timer);
        resolve(true);
      });
    });

  const onCameraReady = () => {
    cameraReadyRef.current = true;
    const waiters = cameraReadyWaiters.current.splice(0);
    waiters.forEach((fn) => fn());
  };

  useEffect(() => {
    flowStartedAt.current = Date.now();
    lastStep.current = 'open';
    trackFlowStarted('post_story');
    trackFlowStep('post_story', 'open_composer');
    return () => {
      // If they leave without posting, count as abandoned
      if (lastStep.current !== 'posted') {
        trackFlowAbandoned(
          'post_story',
          Date.now() - flowStartedAt.current,
          lastStep.current
        );
      }
    };
  }, []);

  // THIS SECTION DOES: keep the event tag label in sync when the route hands us a title.
  useEffect(() => {
    if (initialEventId) setTaggedEventId(initialEventId);
    if (initialEventTitle) setTaggedEventTitle(initialEventTitle);
  }, [initialEventId, initialEventTitle]);

  // THIS SECTION DOES: load whether BeReal-like reminders are already on.
  useEffect(() => {
    let alive = true;
    void getNotificationPrefs().then((p) => {
      if (alive) setRandomNudges(p.kinds.story_prompt === true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // THIS SECTION DOES: ask for the camera at shutter time, mount the preview, wait until ready.
  const ensureCamera = async (): Promise<boolean> => {
    if (!nativeCamera) {
      Alert.alert(
        'Use the phone app',
        'Posting a photo or video works in the Bridger phone app. The web preview cannot open your camera.'
      );
      return false;
    }
    if (!camPerm?.granted) {
      const res = await requestCamPerm();
      trackProduct('permission_result', {
        permission: 'camera',
        outcome: res.granted
          ? 'granted'
          : res.canAskAgain === false
            ? 'denied'
            : 'dismissed',
        context: 'story_capture'
      });
      if (!res.granted) {
        Alert.alert(
          'Camera needed',
          'Allow camera access so you can post an update. You can turn it on in Settings.'
        );
        return false;
      }
    }
    // Mount CameraView now (permission hook may lag one frame behind).
    setCameraEnabled(true);
    // Already live from a prior grant on this screen.
    if (cameraReadyRef.current && cameraRef.current) return true;
    const ready = await waitForCameraReady();
    if (!ready) {
      Alert.alert('Camera warming up', 'Give it a second and tap the shutter again.');
    }
    return ready;
  };

  // THIS SECTION DOES: ask for the mic only when they hold for video.
  const ensureMic = async (): Promise<boolean> => {
    if (micPerm?.granted) return true;
    const res = await requestMicPerm();
    trackProduct('permission_result', {
      permission: 'mic',
      outcome: res.granted ? 'granted' : res.canAskAgain === false ? 'denied' : 'dismissed',
      context: 'story_capture'
    });
    if (!res.granted) {
      Alert.alert(
        'Microphone needed',
        'Allow the microphone so your video update has sound.'
      );
    }
    return res.granted;
  };

  // THIS SECTION DOES: save the reminder pref + ask for push when they turn it on.
  const toggleRandomNudges = (on: boolean) => {
    setRandomNudges(on);
    void setNotificationKindPref('story_prompt', on);
    if (on) void requestNotificationPermission(true);
    trackProduct('notification_pref_changed', {
      pref: 'story_prompt',
      pref_scope: 'kind',
      enabled: on
    });
  };

  // THIS SECTION DOES: take one live photo after permission.
  const takePhoto = async () => {
    if (atCap) {
      Alert.alert('Daily limit', 'You can post 3 updates a day. Come back tomorrow.');
      return;
    }
    // A slow tap must never become video — cancel any hold timer first.
    clearVideoHoldTimer();
    videoIntentRef.current = false;
    if (!(await ensureCamera())) return;
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) return;
      lastStep.current = 'capture_photo';
      trackFlowStep('post_story', 'capture', { method: 'photo' });
      trackClick(POST_COMPOSER.capture.photo, { method: 'photo' });
      setCaptureUri(photo.uri);
      setCaptured('photo');
    } catch {
      Alert.alert('Could not take photo', 'Try again in a moment.');
    }
  };

  // THIS SECTION DOES: cancel any pending hold-for-video timer.
  const clearVideoHoldTimer = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  // THIS SECTION DOES: start the hold clock only once the camera can capture.
  const armVideoHoldIfReady = () => {
    clearVideoHoldTimer();
    if (!fingerDownRef.current || recordingRef.current || videoIntentRef.current) return;
    if (!showLiveCamera || !cameraReadyRef.current) {
      holdTimer.current = setTimeout(armVideoHoldIfReady, HOLD_ARM_POLL_MS);
      return;
    }
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      if (!fingerDownRef.current || recordingRef.current) return;
      videoIntentRef.current = true;
      void startVideo();
    }, HOLD_MS);
  };

  // THIS SECTION DOES: start a ≤20s video when they hold the shutter.
  const startVideo = async () => {
    if (!fingerDownRef.current) {
      videoIntentRef.current = false;
      setHolding(false);
      return;
    }
    if (!isCoopMember) {
      videoIntentRef.current = false;
      setHolding(false);
      Alert.alert(
        'Co-op unlock',
        'Posting video updates is a co-op perk. Watching video is free for everyone.'
      );
      trackClick(POST_COMPOSER.capture.hold_video, { method: 'video', is_coop: false });
      return;
    }
    if (!(await ensureCamera())) {
      videoIntentRef.current = false;
      setHolding(false);
      return;
    }
    if (!fingerDownRef.current) {
      videoIntentRef.current = false;
      setHolding(false);
      return;
    }
    if (!(await ensureMic())) {
      videoIntentRef.current = false;
      setHolding(false);
      return;
    }
    if (!fingerDownRef.current) {
      videoIntentRef.current = false;
      setHolding(false);
      return;
    }
    setCameraMode('video');
    setRecording(true);
    recordingRef.current = true;
    lastStep.current = 'capture_video';
    trackFlowStep('post_story', 'capture', { method: 'video' });
    trackClick(POST_COMPOSER.capture.hold_video, { method: 'video' });
    try {
      // Small beat so CameraView can switch into video mode before recordAsync.
      await new Promise((r) => setTimeout(r, 80));
      const result = await cameraRef.current?.recordAsync({
        maxDuration: MAX_VIDEO_SECONDS
      });
      if (result?.uri) {
        setCaptureUri(result.uri);
        setCaptured('video');
      }
    } catch {
      // Stop / cancel is normal when they lift early; ignore empty results.
    } finally {
      recordingRef.current = false;
      videoIntentRef.current = false;
      setRecording(false);
      setHolding(false);
      setCameraMode('picture');
    }
  };

  const startHold = () => {
    if (atCap) {
      Alert.alert('Daily limit', 'You can post 3 updates a day. Come back tomorrow.');
      return;
    }
    fingerDownRef.current = true;
    videoIntentRef.current = false;
    setHolding(true);
    armVideoHoldIfReady();
  };

  const endHold = () => {
    fingerDownRef.current = false;
    const stillWaitingForHold = !!holdTimer.current;
    clearVideoHoldTimer();
    // Lifted before the hold threshold → always a photo tap.
    if (stillWaitingForHold && !videoIntentRef.current && !recordingRef.current) {
      setHolding(false);
      void takePhoto();
      return;
    }
    // Already recording → stop; recordAsync resolves with the clip.
    if (recordingRef.current) {
      cameraRef.current?.stopRecording();
    } else if (videoIntentRef.current) {
      videoIntentRef.current = false;
      setHolding(false);
    } else {
      setHolding(false);
    }
  };

  const handlePost = async () => {
    if (!captured || posting || atCap) return;
    setPosting(true);
    try {
      lastStep.current = 'post';
      trackFlowStep('post_story', 'post');
      await onCreate({
        type: captured,
        // Caption under the post only. Never bake text onto the photo.
        caption: caption.trim() || undefined,
        themeSlug: theme ?? undefined,
        audience,
        group,
        eventId: taggedEventId ?? undefined,
        uri: captureUri ?? undefined,
        emoji: captured === 'video' ? '🎥' : '📸',
        accent: 'purple'
      });
      trackProduct('story_posted', {
        method: captured,
        is_coop: isCoopMember,
        ...(taggedEventId ? { event_id: taggedEventId } : {})
      });
      trackFlowCompleted('post_story', Date.now() - flowStartedAt.current, {
        method: captured
      });
      lastStep.current = 'posted';
      onPosted?.();
      onClose?.();
    } catch (e) {
      Alert.alert('Could not post', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setPosting(false);
    }
  };

  if (captured) {
    return (
      <SurfaceHost surface="post_composer" parentScreen="home" open>
        <ComposeInner
          captured={captured}
          captureUri={captureUri}
          themeLabel={
            theme ? prompts.find((t) => t.slug === theme)?.label : undefined
          }
          caption={caption}
          setCaption={(v) => {
            lastStep.current = 'caption';
            trackFlowStep('post_story', 'caption');
            setCaption(v);
          }}
          audience={audience}
          setAudience={setAudience}
          group={group}
          setGroup={setGroup}
          posting={posting}
          taggedEventTitle={taggedEventId ? taggedEventTitle : undefined}
          onClearEventTag={() => {
            setTaggedEventId(null);
            setTaggedEventTitle(undefined);
          }}
          onRetake={() => {
            setCaptured(null);
            setCaptureUri(null);
            setCaption('');
          }}
          onPost={() => void handlePost()}
          insetsTop={insets.top}
          insetsBottom={insets.bottom}
        />
      </SurfaceHost>
    );
  }

  return (
    <SurfaceHost surface="post_composer" parentScreen="home" open>
      <View
        style={{
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: CAPTURE_BG
        }}
        className="relative flex-1 bg-canvas-dark"
      >
        <View className="flex-row items-center justify-between px-4">
          <Pressable
            onPress={withAnalyticsPress(POST_COMPOSER.actions.discard, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="h-9 w-9 items-center justify-center rounded-full bg-white/85"
          >
            <ChevronDownIcon size={20} color={ON_LIGHT_INK} strokeWidth={2.6} />
          </Pressable>
          <Text className="font-pixel text-[15px] text-white">Your story</Text>
          <Text className="font-sans-b text-[12px] text-white/70">{left} left</Text>
        </View>

        {/* LIVE CAMERA: permission asked on shutter; placeholder until granted. */}
        <View className="relative mx-4 mt-4 flex-1 overflow-hidden rounded-2xl bg-black">
          {showLiveCamera ? (
            <CameraView
              ref={cameraRef}
              mode={cameraMode}
              facing={facing}
              onCameraReady={onCameraReady}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text accessible={false} className="text-[64px] opacity-60">
                📷
              </Text>
              <Text className="mt-2 text-center font-sans-sb text-[13px] leading-snug text-white/70">
                {nativeCamera
                  ? 'Tap the shutter and allow the camera to post an update. In-app capture only. No camera roll.'
                  : 'Posting a photo works in the Bridger phone app. In-app capture only. No camera roll.'}
              </Text>
            </View>
          )}
          {recording ? (
            <View className="absolute left-3 top-3 rounded-full bg-coral px-3 py-1">
              <Text className="font-sans-b text-[12px] text-white">Recording…</Text>
            </View>
          ) : null}
        </View>

        <View className="px-4 pt-5">
          <Text className="mb-2 font-sans-b text-[12px] uppercase tracking-wide text-white/60">
            Themed posts
          </Text>
          <View className="flex-row gap-2.5">
            {prompts.map((t) => (
              <Pressable
                key={t.slug}
                onPress={withAnalyticsPress(POST_COMPOSER.suggested.suggested_prompt, () => {
                  lastStep.current = 'suggested';
                  trackFlowStep('post_story', 'suggested_used');
                  setTheme((v) => (v === t.slug ? null : t.slug));
                })}
                accessibilityRole="button"
                accessibilityState={{ selected: theme === t.slug }}
                accessibilityLabel={t.label}
                className={cn(
                  'min-h-[44px] flex-1 items-center gap-1 border-2 border-dashed px-2 py-3',
                  theme === t.slug
                    ? 'border-white bg-white/15'
                    : 'border-white/35'
                )}
              >
                <Text accessible={false} className="text-[20px]">
                  {t.icon}
                </Text>
                <Text
                  className={cn(
                    'font-sans-b text-[11px]',
                    theme === t.slug ? 'text-white' : 'text-white/75'
                  )}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* THIS SECTION DOES: opt into BeReal-like capture reminders (1–3 / day) */}
          <View className="mt-3 flex-row items-center gap-3 rounded-card bg-white px-3 py-3">
            <AnalyticsRegion
              analyticsId={POST_COMPOSER.suggested.random_nudges_label}
              interactive={false}
              className="min-w-0 flex-1"
            >
              <Text className="font-sans-b text-[13px] text-onaccent">
                BeReal-like reminders
              </Text>
              <Text
                className="mt-0.5 font-sans-md text-[11px] leading-snug"
                style={{ color: ON_LIGHT_MUTE }}
              >
                Random reminders to capture your life. 1-3 notifications a day,
                including a mid-party nudge when you are at an event.
              </Text>
            </AnalyticsRegion>
            <Toggle
              checked={randomNudges}
              onChange={toggleRandomNudges}
              label="BeReal-like reminders, 1 to 3 notifications a day"
              analyticsId={POST_COMPOSER.suggested.random_nudges_toggle}
            />
          </View>
        </View>

        <View className="items-center gap-2 pb-2 pt-6">
          <View className="flex-row items-center gap-8">
            <Pressable
              onPress={withAnalyticsPress(POST_COMPOSER.capture.switch_camera, () => {
                cameraReadyRef.current = false;
                setFacing((f) => (f === 'front' ? 'back' : 'front'));
              })}
              disabled={!showLiveCamera || recording}
              accessibilityRole="button"
              accessibilityLabel="Switch camera"
              className="h-12 w-12 items-center justify-center rounded-full bg-white/15 active:opacity-90"
            >
              <SwitchCameraIcon size={22} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>

            <Pressable
              onPressIn={startHold}
              onPressOut={endHold}
              accessibilityRole="button"
              accessibilityLabel="Tap for a photo, hold for video"
              className={cn(
                'h-20 w-20 items-center justify-center rounded-full border-4 border-white',
                holding || recording ? 'scale-95 bg-coral' : 'bg-white/20'
              )}
            >
              <View
                className={cn(
                  'h-14 w-14 rounded-full',
                  holding || recording ? 'bg-coral' : 'bg-white'
                )}
              />
            </Pressable>

            <View className="h-12 w-12" />
          </View>
          <View className="flex-row items-center gap-1.5">
            <Text className="font-sans-sb text-[12px] text-white/70">
              Tap photo · hold video
            </Text>
            {!isCoopMember ? (
              <LockIcon size={12} color="rgba(255,255,255,0.6)" strokeWidth={2.6} />
            ) : null}
          </View>
          {/* THIS SECTION DOES: leave without posting. Hardcoded white label
              so it stays readable on the fixed near-black camera canvas even
              when the phone is in light mode (themed text-ink would go dark). */}
          <Pressable
            onPress={withAnalyticsPress(POST_COMPOSER.actions.discard, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Not now"
            className="min-h-[44px] items-center justify-center px-4 py-2 active:opacity-80"
          >
            <Text className="font-sans-b text-[13px] text-white">Not now</Text>
          </Pressable>
        </View>
      </View>
    </SurfaceHost>
  );
}

function ComposeInner({
  captured,
  captureUri,
  themeLabel,
  caption,
  setCaption,
  audience,
  setAudience,
  group,
  setGroup,
  posting,
  taggedEventTitle,
  onClearEventTag,
  onRetake,
  onPost,
  insetsTop,
  insetsBottom
}: {
  captured: 'photo' | 'video';
  captureUri: string | null;
  themeLabel?: string;
  caption: string;
  setCaption: (v: string) => void;
  audience: AudienceLevel;
  setAudience: (v: AudienceLevel) => void;
  group: string | null;
  setGroup: (g: string | null) => void;
  posting: boolean;
  taggedEventTitle?: string;
  onClearEventTag?: () => void;
  onRetake: () => void;
  onPost: () => void;
  insetsTop: number;
  insetsBottom: number;
}) {
  const { markActed } = useSurfaceAct();

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        paddingTop: Math.max(insetsTop, 12),
        paddingBottom: Math.max(insetsBottom, 16),
        backgroundColor: CAPTURE_BG
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="relative flex-1 bg-canvas-dark"
    >
      <View className="flex-row items-center justify-between px-4">
        <Pressable
          onPress={onRetake}
          accessibilityRole="button"
          accessibilityLabel="Retake"
          className="h-9 w-9 items-center justify-center rounded-full bg-white/85"
        >
          <ChevronDownIcon size={20} color={ON_LIGHT_INK} strokeWidth={2.6} />
        </Pressable>
        <Text className="font-pixel text-[15px] text-white">
          {themeLabel ?? 'Update your friends'}
        </Text>
        <View className="w-9" />
      </View>

      {/* PHOTO / VIDEO: clean media only. Caption sits below, never on top. */}
      <View className="relative mx-4 mt-4 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-purple">
        {captureUri && captured === 'photo' ? (
          <Image
            source={{ uri: captureUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            accessibilityLabel="Your captured photo"
          />
        ) : (
          <Text accessible={false} className="text-[96px]">
            {captured === 'video' ? '🎥' : '📸'}
          </Text>
        )}
      </View>

      <View className="gap-3 px-4 pt-4">
        {/* CAPTION: under the media, saved as update text (not stamped on the photo). */}
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="What did you do today?"
          accessibilityLabel="Update caption"
          placeholderTextColor="rgba(255,255,255,0.5)"
          multiline
          className="min-h-[44px] rounded-2xl border border-white/30 px-4 py-3 font-sans-sb text-[14px] text-white"
        />
        <AudiencePicker
          value={audience}
          onChange={setAudience}
          group={group}
          onGroupChange={setGroup}
          // No fake demo groups. "Or a group" only appears once they have real ones.
          groups={[]}
          tone="dark"
          levelAnalyticsIds={{
            close: POST_COMPOSER.audience.close,
            friend: POST_COMPOSER.audience.friends,
            everyone: POST_COMPOSER.audience.everyone
          }}
        />
        {taggedEventTitle ? (
          <View className="flex-row items-center justify-between rounded-full border border-white/30 px-4 py-2.5">
            <AnalyticsRegion
              analyticsId={POST_COMPOSER.suggested.event_tag_label}
              interactive={false}
              className="min-w-0 flex-1"
            >
              <Text className="font-sans-b text-[13px] text-white">
                Tagged: {taggedEventTitle}
              </Text>
              <Text className="mt-0.5 font-sans-md text-[11px] text-white/60">
                Saves to the event photo album
              </Text>
            </AnalyticsRegion>
            <Pressable
              onPress={withAnalyticsPress(POST_COMPOSER.suggested.event_tag_clear, onClearEventTag)}
              accessibilityRole="button"
              accessibilityLabel="Remove event tag"
              className="rounded-full bg-white/15 px-3 py-1.5"
            >
              <Text className="font-sans-b text-[12px] text-white">Remove</Text>
            </Pressable>
          </View>
        ) : null}
        <ButtonPrimary
          full
          loading={posting}
          analyticsId={POST_COMPOSER.actions.post}
          onPress={() => {
            markActed();
            onPost();
          }}
          accessibilityLabel="Post"
        >
          Post
        </ButtonPrimary>
      </View>
    </KeyboardAvoidingView>
  );
}
