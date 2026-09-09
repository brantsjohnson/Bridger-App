// ============================================
// WHAT THIS FILE DOES (plain English):
// Posting a Scrapbook page, screen 1 of 2: the camera. Tap the shutter for a
// photo, hold for video (≤20s). Camera (and mic for video) are asked at the
// shutter, never at launch. The camera fills the screen; the only words are
// the "1/4" count. Flash, flip, a camera-roll thumb, a tiny thumbnail of a
// page you already made today, and a sparkle that opens the themed prompts +
// reminders tray sit around the shutter as icons.
//
// After a capture (or a camera-roll pick) we go straight to screen 2, the
// page (PageCompose), where Bridger has already laid the photo out. This file
// also owns the shared draft (useScrapbookDraft) and the post_story flow
// timing across both screens.
//
// Video posting shows a co-op lock for free members (watching video is free).
//
// ACCESSIBILITY: capture is always a near-black camera UI (fixed #0E0E0E), even
// in dark mode; never themed `bg-ink`, which flips light and washes out white
// chrome. White pills on that canvas use always-dark ink.
// ============================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  type FlashMode
} from 'expo-camera';
import {
  ChevronDownIcon,
  ImagesIcon,
  LockIcon,
  SparklesIcon,
  SwitchCameraIcon,
  ZapIcon,
  ZapOffIcon
} from 'lucide-react-native';
import {
  POST_COMPOSER,
  trackClick,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct,
  type PendingMedia,
  type StoryPost
} from '@bridger/shared';
import { CountPill, ScrapbookPage, SurfaceHost, cn, withAnalyticsPress } from '@bridger/ui';
import {
  getNotificationPrefs,
  setNotificationKindPref
} from '../../data/notification-prefs';
import { requestNotificationPermission } from '../../lib/notifications';
import { pickScrapbookMedia } from '../../lib/pick-scrapbook-media';
import { useScrapbookDraft } from '../../hooks/useScrapbookDraft';
import { useStoryCapture } from '../../hooks/useStoryCapture';
import { PageCompose } from './PageCompose';
import { PromptsTray } from './PromptsTray';

/** Max video length for an update (STORIES.md / SCRAPBOOKS.md). */
const MAX_VIDEO_SECONDS = 20;
/** How long to hold before we treat it as video, not a photo tap. */
const HOLD_MS = 1000;
/** Poll while the camera mounts so we do not count setup time as a hold. */
const HOLD_ARM_POLL_MS = 50;

// Fixed near-black canvas for the camera sheet (does not follow theme ink).
const CAPTURE_BG = '#0E0E0E';
// Always-dark type on the white close pill.
const ON_LIGHT_INK = '#1C1B16';

/** Flash cycles off → on → auto → off. */
const FLASH_ORDER: FlashMode[] = ['off', 'on', 'auto'];

type Props = {
  onClose?: () => void;
  onPosted?: () => void;
  /** PAYMENT: free members can't post video, so show a lock instead of capture */
  isCoopMember?: boolean;
  /** Pre-tag an event when opened from a party capture notification. */
  initialEventId?: string;
  initialEventTitle?: string;
  /** Open straight onto one of today's pages (from the profile or the tile). */
  initialPostId?: string;
};

export function CaptureCompose({
  onClose,
  onPosted,
  isCoopMember = false,
  initialEventId,
  initialEventTitle,
  initialPostId
}: Props) {
  const insets = useSafeAreaInsets();
  const draft = useScrapbookDraft();
  // Themed squares (admin-rotated). Quota comes from the draft hook now.
  const { prompts } = useStoryCapture();
  const cameraRef = useRef<CameraView>(null);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const [phase, setPhase] = useState<'capture' | 'compose'>('capture');
  const [theme, setTheme] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [recording, setRecording] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  /** picture until a hold becomes video; CameraView needs the matching mode. */
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  /** Local flag so we can mount CameraView in the same shutter press that just got OS permission. */
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(false);
  /** Opt-in BeReal-like "capture your life" reminders (same pref as Settings). */
  const [randomNudges, setRandomNudges] = useState(false);
  const [taggedEventTitle, setTaggedEventTitle] = useState<string | undefined>(initialEventTitle);
  /** When "Replace" was tapped on a photo, the next capture/pick swaps that slot. */
  const replaceTarget = useRef<string | null>(null);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef(false);
  const fingerDownRef = useRef(false);
  const videoIntentRef = useRef(false);
  const cameraReadyRef = useRef(false);
  const cameraReadyWaiters = useRef<Array<() => void>>([]);
  const flowStartedAt = useRef(Date.now());
  const lastStep = useRef('open');
  const openedInitial = useRef(false);

  const nativeCamera = Platform.OS !== 'web';
  const camGranted = !!camPerm?.granted || cameraEnabled;
  const showLiveCamera = nativeCamera && camGranted;
  const atCap = draft.atCap;

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

  // THIS SECTION DOES: time the whole post_story flow across both screens.
  useEffect(() => {
    flowStartedAt.current = Date.now();
    lastStep.current = 'open';
    trackFlowStarted('post_story');
    trackFlowStep('post_story', 'open_composer');
    return () => {
      if (lastStep.current !== 'posted') {
        trackFlowAbandoned('post_story', Date.now() - flowStartedAt.current, lastStep.current);
      }
    };
  }, []);

  // THIS SECTION DOES: event tag + theme from the route, and open a page directly when asked.
  useEffect(() => {
    if (initialEventId) draft.setEventId(initialEventId);
    if (initialEventTitle) setTaggedEventTitle(initialEventTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEventId, initialEventTitle]);

  useEffect(() => {
    draft.setThemeSlug(theme ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    if (openedInitial.current || !draft.hydrated) return;
    if (initialPostId) {
      const post = draft.todayPosts.find((p) => p.id === initialPostId);
      if (post) {
        openedInitial.current = true;
        draft.loadFromPost(post);
        setPhase('compose');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPostId, draft.hydrated, draft.todayPosts]);

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
        'Taking a photo or video works in the Bridger phone app. On the web you can still add from your photos.'
      );
      return false;
    }
    if (!camPerm?.granted) {
      const res = await requestCamPerm();
      trackProduct('permission_result', {
        permission: 'camera',
        outcome: res.granted ? 'granted' : res.canAskAgain === false ? 'denied' : 'dismissed',
        context: 'story_capture'
      });
      if (!res.granted) {
        Alert.alert(
          'Camera needed',
          'Allow camera access to take a photo, or add one from your photos instead.'
        );
        return false;
      }
    }
    setCameraEnabled(true);
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
      Alert.alert('Microphone needed', 'Allow the microphone so your video has sound.');
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

  // THIS SECTION DOES: put new media on the page (or swap a slot) and show the page.
  const landMedia = useCallback(
    (items: PendingMedia[]) => {
      if (!items.length) return;
      const target = replaceTarget.current;
      replaceTarget.current = null;
      if (target && items[0]) {
        draft.replaceMedia(target, items[0]);
      } else {
        draft.addMedia(items);
      }
      setPhase('compose');
    },
    [draft]
  );

  const alertCap = () =>
    Alert.alert('Day is full', `You can add ${draft.cap} photos or videos a day. Come back tomorrow.`);

  // THIS SECTION DOES: take one live photo after permission.
  const takePhoto = async () => {
    if (atCap && !replaceTarget.current) {
      alertCap();
      return;
    }
    clearVideoHoldTimer();
    videoIntentRef.current = false;
    if (!(await ensureCamera())) return;
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) return;
      lastStep.current = 'capture_photo';
      trackFlowStep('post_story', 'capture', { method: 'photo' });
      trackClick(POST_COMPOSER.capture.photo, { method: 'photo' });
      landMedia([{ kind: 'photo', uri: photo.uri, source: 'bridger_camera' }]);
    } catch {
      Alert.alert('Could not take photo', 'Try again in a moment.');
    }
  };

  const clearVideoHoldTimer = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  // Latest coop flag for hold handlers (avoids stale closure / spam races).
  const isCoopMemberRef = useRef(isCoopMember);
  isCoopMemberRef.current = isCoopMember;
  // Latch so free members cannot re-arm video while the unlock alert is up.
  const videoLockAlertOpenRef = useRef(false);

  const showVideoCoopLock = () => {
    if (videoLockAlertOpenRef.current) return;
    videoLockAlertOpenRef.current = true;
    trackClick(POST_COMPOSER.capture.hold_video, { method: 'video', is_coop: false });
    Alert.alert(
      'Co-op unlock',
      'Posting video updates is a co-op perk. Watching video is free for everyone.',
      [{ text: 'OK', onPress: () => { videoLockAlertOpenRef.current = false; } }]
    );
  };

  // THIS SECTION DOES: start the hold clock only once the camera can capture.
  const armVideoHoldIfReady = () => {
    clearVideoHoldTimer();
    if (!fingerDownRef.current || recordingRef.current || videoIntentRef.current) return;
    // PAYMENT: free members never start the video hold timer.
    if (!isCoopMemberRef.current) {
      setHolding(false);
      fingerDownRef.current = false;
      showVideoCoopLock();
      return;
    }
    if (!showLiveCamera || !cameraReadyRef.current) {
      holdTimer.current = setTimeout(armVideoHoldIfReady, HOLD_ARM_POLL_MS);
      return;
    }
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      if (!fingerDownRef.current || recordingRef.current) return;
      if (!isCoopMemberRef.current) {
        setHolding(false);
        fingerDownRef.current = false;
        showVideoCoopLock();
        return;
      }
      videoIntentRef.current = true;
      void startVideo();
    }, HOLD_MS);
  };

  // THIS SECTION DOES: start a ≤20s video when they hold the shutter.
  const startVideo = async () => {
    const bail = () => {
      videoIntentRef.current = false;
      setHolding(false);
    };
    if (!fingerDownRef.current) return bail();
    if (!isCoopMemberRef.current) {
      bail();
      showVideoCoopLock();
      return;
    }
    if (!(await ensureCamera())) return bail();
    if (!fingerDownRef.current) return bail();
    if (!(await ensureMic())) return bail();
    if (!fingerDownRef.current) return bail();
    // Re-check after awaits so a free member cannot sneak past a stale flag.
    if (!isCoopMemberRef.current) {
      bail();
      showVideoCoopLock();
      return;
    }
    setCameraMode('video');
    setRecording(true);
    recordingRef.current = true;
    lastStep.current = 'capture_video';
    trackFlowStep('post_story', 'capture', { method: 'video' });
    trackClick(POST_COMPOSER.capture.hold_video, { method: 'video', is_coop: true });
    try {
      await new Promise((r) => setTimeout(r, 80));
      const result = await cameraRef.current?.recordAsync({ maxDuration: MAX_VIDEO_SECONDS });
      if (result?.uri) {
        landMedia([{ kind: 'video', uri: result.uri, source: 'bridger_camera' }]);
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
    if (atCap && !replaceTarget.current) {
      alertCap();
      return;
    }
    // PAYMENT: block video hold immediately (before coral "holding" chrome).
    if (!isCoopMemberRef.current) {
      showVideoCoopLock();
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
    if (stillWaitingForHold && !videoIntentRef.current && !recordingRef.current) {
      setHolding(false);
      void takePhoto();
      return;
    }
    if (recordingRef.current) {
      cameraRef.current?.stopRecording();
    } else {
      videoIntentRef.current = false;
      setHolding(false);
    }
  };

  // THIS SECTION DOES: camera roll. Permission is asked here, on the tap.
  const pickFromRoll = useCallback(
    async (opts: { limit: number; replaceElementId?: string }) => {
      if (opts.replaceElementId) replaceTarget.current = opts.replaceElementId;
      const limit = opts.replaceElementId ? 1 : Math.max(0, Math.min(opts.limit, draft.left));
      if (limit <= 0 && !opts.replaceElementId) {
        alertCap();
        return;
      }
      trackClick(POST_COMPOSER.capture.roll, { method: 'roll' });
      const items = await pickScrapbookMedia({ limit, allowVideo: isCoopMember });
      if (!items.length) {
        replaceTarget.current = null;
        return;
      }
      lastStep.current = 'capture_roll';
      trackFlowStep('post_story', 'capture', { method: 'roll', count: items.length });
      landMedia(items);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft.left, isCoopMember, landMedia]
  );

  // THIS SECTION DOES: after a confirmed post. Reset the theme; tell the route.
  const handlePosted = useCallback(
    (_result: { post: StoryPost; wasUpdate: boolean }) => {
      trackFlowCompleted('post_story', Date.now() - flowStartedAt.current, {
        method: _result.post.type,
        was_update: _result.wasUpdate
      });
      lastStep.current = 'posted';
      setTheme(null);
      // One exit only: the route's onPosted closes the modal (falls back to onClose).
      if (onPosted) onPosted();
      else onClose?.();
    },
    [onPosted, onClose]
  );

  // ------------------------------------------------------------------
  // SCREEN 2: the page
  // ------------------------------------------------------------------
  if (phase === 'compose') {
    return (
      <SurfaceHost surface="post_composer" parentScreen="home" open key="composer">
        <PageCompose
          draft={draft}
          isCoopMember={isCoopMember}
          onBack={() => setPhase('capture')}
          onAddFromCamera={() => setPhase('capture')}
          onAddFromRoll={(opts) => void pickFromRoll(opts)}
          onPosted={handlePosted}
          taggedEventTitle={draft.eventId ? taggedEventTitle : undefined}
          onClearEventTag={() => {
            draft.setEventId(undefined);
            setTaggedEventTitle(undefined);
          }}
          insetsTop={insets.top}
          insetsBottom={insets.bottom}
        />
      </SurfaceHost>
    );
  }

  // ------------------------------------------------------------------
  // SCREEN 1: the camera
  // ------------------------------------------------------------------
  const FlashIcon = flash === 'off' ? ZapOffIcon : ZapIcon;
  const draftHasMedia = draft.mediaCount > 0;
  /** The page thumb: the unposted draft if there is one, else today's latest page. */
  const thumbPage = draftHasMedia
    ? draft.page
    : draft.todayPosts[draft.todayPosts.length - 1]?.page;
  const thumbPost = draftHasMedia ? undefined : draft.todayPosts[draft.todayPosts.length - 1];

  return (
    <SurfaceHost surface="post_composer" parentScreen="home" open key="composer">
      <View
        style={{
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: CAPTURE_BG
        }}
        className="relative flex-1"
      >
        {/* TOP ROW: close · count · flash · flip */}
        <View className="flex-row items-center px-4">
          <Pressable
            onPress={withAnalyticsPress(POST_COMPOSER.actions.discard, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/85"
          >
            <ChevronDownIcon size={20} color={ON_LIGHT_INK} strokeWidth={2.6} />
          </Pressable>
          <View className="flex-1 items-center">
            <CountPill
              used={draft.usedToday}
              cap={draft.cap}
              analyticsId={POST_COMPOSER.capture.count_pill}
            />
          </View>
          <Pressable
            onPress={withAnalyticsPress(
              POST_COMPOSER.capture.flash,
              () => {
                const next = FLASH_ORDER[(FLASH_ORDER.indexOf(flash) + 1) % FLASH_ORDER.length]!;
                setFlash(next);
              },
              { analyticsProps: { flash_mode: flash } }
            )}
            disabled={!showLiveCamera || recording}
            accessibilityRole="button"
            accessibilityLabel={`Flash: ${flash}`}
            accessibilityValue={{ text: flash }}
            className="h-11 w-11 items-center justify-center rounded-full"
          >
            <FlashIcon
              size={20}
              color={flash === 'off' ? 'rgba(255,255,255,0.6)' : '#FFD84D'}
              strokeWidth={2.4}
            />
            {flash === 'auto' ? (
              <Text
                accessible={false}
                className="absolute bottom-1 right-1 font-sans-b text-[8px] text-[#FFD84D]"
              >
                A
              </Text>
            ) : null}
          </Pressable>
          <Pressable
            onPress={withAnalyticsPress(POST_COMPOSER.capture.switch_camera, () => {
              cameraReadyRef.current = false;
              setFacing((f) => (f === 'front' ? 'back' : 'front'));
            })}
            disabled={!showLiveCamera || recording}
            accessibilityRole="button"
            accessibilityLabel="Switch camera"
            className="h-11 w-11 items-center justify-center rounded-full"
          >
            <SwitchCameraIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </View>

        {/* LIVE CAMERA: fills the screen. Permission asked on shutter. */}
        <View className="relative mx-3 mt-3 flex-1 overflow-hidden rounded-3xl bg-black">
          {showLiveCamera ? (
            <CameraView
              ref={cameraRef}
              mode={cameraMode}
              facing={facing}
              flash={flash}
              onCameraReady={onCameraReady}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text accessible={false} className="text-[64px] opacity-60">
                📷
              </Text>
            </View>
          )}
          {recording ? (
            <View className="absolute left-3 top-3 h-3 w-3 rounded-full bg-[#FF3B30]" accessibilityLabel="Recording" />
          ) : null}

          {/* TODAY'S PAGE THUMB: bottom-left inside the camera. Tap = open that page. */}
          {thumbPage ? (
            <Pressable
              onPress={withAnalyticsPress(POST_COMPOSER.capture.today_page_thumb, () => {
                if (thumbPost) draft.loadFromPost(thumbPost);
                setPhase('compose');
              })}
              accessibilityRole="button"
              accessibilityLabel={draftHasMedia ? 'Open your unposted page' : "Open today's page"}
              className="absolute bottom-3 left-3 rounded-md border border-white/70"
              style={{ minHeight: 44, justifyContent: 'flex-end' }}
            >
              <ScrapbookPage page={thumbPage} width={40} mode="view" radius={4} />
              {draftHasMedia ? (
                <View className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-[#0E0E0E] bg-[#EF9F27]" />
              ) : null}
            </Pressable>
          ) : null}
        </View>

        {/* BOTTOM RAIL: roll · shutter · prompts */}
        <View className="items-center pb-1 pt-4">
          <View className="w-full flex-row items-center justify-between px-8">
            <Pressable
              onPress={() => void pickFromRoll({ limit: draft.left })}
              accessibilityRole="button"
              accessibilityLabel={atCap ? 'Add from camera roll, day is full' : 'Add from camera roll'}
              accessibilityState={{ disabled: atCap }}
              className={cn(
                'h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/40 bg-white/10',
                atCap && 'opacity-50'
              )}
            >
              <ImagesIcon size={20} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>

            <Pressable
              onPressIn={startHold}
              onPressOut={endHold}
              accessibilityRole="button"
              accessibilityLabel={
                atCap ? 'Shutter, day is full' : 'Tap for a photo, hold for video'
              }
              accessibilityState={{ disabled: atCap }}
              className={cn(
                'h-20 w-20 items-center justify-center rounded-full border-4 border-white',
                holding || recording ? 'scale-95 bg-coral' : 'bg-white/20',
                atCap && 'opacity-50'
              )}
            >
              <View
                className={cn(
                  'h-14 w-14 rounded-full',
                  holding || recording ? 'bg-coral' : 'bg-white'
                )}
              />
            </Pressable>

            <Pressable
              onPress={withAnalyticsPress(POST_COMPOSER.capture.prompts_tray_open, () =>
                setPromptsOpen(true)
              )}
              accessibilityRole="button"
              accessibilityLabel="Themed posts and reminders"
              accessibilityState={{ selected: !!theme }}
              className={cn(
                'h-12 w-12 items-center justify-center rounded-full',
                theme ? 'bg-white' : 'bg-white/15'
              )}
            >
              <SparklesIcon size={20} color={theme ? ON_LIGHT_INK : '#FFFFFF'} strokeWidth={2.2} />
            </Pressable>
          </View>
          {!isCoopMember ? (
            <View className="mt-2 flex-row items-center gap-1" accessible accessibilityLabel="Video posting is a co-op perk">
              <LockIcon size={11} color="rgba(255,255,255,0.5)" strokeWidth={2.6} />
            </View>
          ) : (
            <View className="mt-2 h-[11px]" />
          )}
        </View>

        <PromptsTray
          open={promptsOpen}
          onClose={() => setPromptsOpen(false)}
          prompts={prompts}
          theme={theme}
          onTheme={(slug) => {
            lastStep.current = 'suggested';
            trackFlowStep('post_story', 'suggested_used');
            setTheme(slug);
          }}
          randomNudges={randomNudges}
          onToggleNudges={toggleRandomNudges}
        />
      </View>
    </SurfaceHost>
  );
}
