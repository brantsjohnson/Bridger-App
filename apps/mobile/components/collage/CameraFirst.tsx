// ============================================
// WHAT THIS FILE DOES (plain English):
// The camera is the front door for Collage. Tap the shutter (or pick from
// the camera roll). The photo lands on today's page as a draft. Then you
// see "Just shot": Done posts it with the last audience you used, or
// "Make it a collage" opens the editor. The page thumb jumps straight into
// the editor. Zoom chips only show lenses this phone really has (.5 / 1 / 2 / 4).
//
// Video posting shows a co-op lock for free members (watching video is free).
//
// ACCESSIBILITY: capture is always a near-black camera UI (fixed #0E0E0E).
// ============================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
// #region agent log
import { debugCameraEvent } from '../../lib/debug-instrumentation';
// #endregion
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
  countMediaElements,
  findLayout,
  layoutForFamily,
  trackProduct,
  type PendingMedia,
  type ScrapbookPage,
  type StoryPost
} from '@bridger/shared';
import { CountPill, ScrapbookPage as ScrapbookPageView, SurfaceHost, cn, withAnalyticsPress } from '@bridger/ui';
import { pickScrapbookMedia } from '../../lib/pick-scrapbook-media';
import { cropToPrintAspect } from '../../lib/crop-to-print';
import {
  formatZoomChip,
  presetsDigitalFallback,
  presetsFromIosLenses,
  type ZoomPreset
} from '../../lib/camera-zoom-presets';
import { useScrapbookDraft } from '../../hooks/useScrapbookDraft';
import { saveToCameraRoll } from '../../lib/save-to-camera-roll';
import { CollageEditor } from './CollageEditor';
import { CollageErrorBoundary } from './CollageErrorBoundary';
import { Finish } from './Finish';
import { JustShot } from './JustShot';

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
  /** Skip the camera and drop this photo onto a new page (e.g. quiz card PNG). */
  initialPhotoUri?: string;
};

// THIS SECTION DOES: wrap the camera in a safety net so a render error shows a
// calm "something went wrong" card (with a way out) instead of crashing the
// whole app to the navigator error screen.
export function CameraFirst(props: Props) {
  return (
    <CollageErrorBoundary onLeave={props.onPosted ?? props.onClose}>
      <CameraFirstScreen {...props} />
    </CollageErrorBoundary>
  );
}

function CameraFirstScreen({
  onClose,
  onPosted,
  isCoopMember = false,
  initialEventId,
  initialEventTitle,
  initialPostId,
  initialPhotoUri
}: Props) {
  const insets = useSafeAreaInsets();
  const draft = useScrapbookDraft();
  const cameraRef = useRef<CameraView>(null);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const [phase, setPhase] = useState<'capture' | 'just_shot' | 'editor' | 'finish'>('capture');
  /** True when they hopped back to the camera from the editor. */
  const [fromEditor, setFromEditor] = useState(false);
  const [justShotUri, setJustShotUri] = useState<string | null>(null);
  const [finishedPage, setFinishedPage] = useState<ScrapbookPage | null>(null);
  const [posting, setPosting] = useState(false);
  const [holding, setHolding] = useState(false);
  const [recording, setRecording] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  /** picture until a hold becomes video; CameraView needs the matching mode. */
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  /** Local flag so we can mount CameraView in the same shutter press that just got OS permission. */
  const [cameraEnabled, setCameraEnabled] = useState(false);
  /** Zoom chips this phone can offer (.5 / 1 / 2 / 4). Empty until the camera reports. */
  const [zoomPresets, setZoomPresets] = useState<ZoomPreset[]>(() =>
    Platform.OS === 'ios' ? [{ label: '1', zoom: 0 }] : presetsDigitalFallback()
  );
  const [activeZoom, setActiveZoom] = useState<ZoomPreset>({ label: '1', zoom: 0 });
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
  /** Remembers the last tap on the preview so a quick second tap = double-tap. */
  const lastPreviewTap = useRef(0);

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
      const timer = setTimeout(() => {
        // #region agent log
        debugCameraEvent('waitForCameraReady TIMEOUT after 4s', {
          granted: camGranted,
          native: nativeCamera,
          sinceMountMs: Date.now() - flowStartedAt.current
        });
        // #endregion
        resolve(false);
      }, 4000);
      cameraReadyWaiters.current.push(() => {
        clearTimeout(timer);
        resolve(true);
      });
    });

  const applyLenses = useCallback((lenses: string[]) => {
    const next = presetsFromIosLenses(lenses);
    if (next.length === 0) {
      setZoomPresets(presetsDigitalFallback());
      return;
    }
    setZoomPresets(next);
    setActiveZoom(
      (cur) => next.find((p) => p.label === cur.label) ?? next.find((p) => p.label === '1') ?? next[0]!
    );
  }, []);

  const onCameraReady = () => {
    // #region agent log
    debugCameraEvent('camera READY', {
      sinceMountMs: Date.now() - flowStartedAt.current
    });
    // #endregion
    cameraReadyRef.current = true;
    const waiters = cameraReadyWaiters.current.splice(0);
    waiters.forEach((fn) => fn());
    // THIS SECTION DOES: ask which real lenses exist (.5 / 1 / 2 / 4).
    void cameraRef.current
      ?.getAvailableLensesAsync()
      .then((lenses) => applyLenses(lenses))
      .catch(() => {
        setZoomPresets(presetsDigitalFallback());
      });
  };

  // THIS SECTION DOES: when they flip front/back, reset zoom and re-ask lenses
  // so .5x returns on the rear camera after a selfie (TestFlight report).
  useEffect(() => {
    setActiveZoom({ label: '1', zoom: 0 });
    cameraReadyRef.current = false;
  }, [facing]);

  // THIS SECTION DOES: apply a live lens list (iPhone + phones that report lenses).
  const onAvailableLensesChanged = useCallback(
    (event: { lenses: string[] }) => {
      applyLenses(event.lenses ?? []);
    },
    [applyLenses]
  );

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

  // THIS SECTION DOES: event tag from the route, and open a page directly when asked.
  useEffect(() => {
    if (initialEventId) draft.setEventId(initialEventId);
    if (initialEventTitle) setTaggedEventTitle(initialEventTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEventId, initialEventTitle]);

  useEffect(() => {
    if (openedInitial.current || !draft.hydrated) return;
    if (initialPostId) {
      const post = draft.todayPosts.find((p) => p.id === initialPostId);
      if (post) {
        openedInitial.current = true;
        draft.loadFromPost(post);
        setPhase('editor');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPostId, draft.hydrated, draft.todayPosts]);

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

  // THIS SECTION DOES: trim every photo (live shot or camera-roll pick) to the
  // 8.5x11 collage/story shape so all media shares the new page size. Videos
  // pass through untouched (we cannot re-cut a video here); the page frames it.
  const trimPhotos = useCallback(async (items: PendingMedia[]): Promise<PendingMedia[]> => {
    return Promise.all(
      items.map(async (item) => {
        if (item.kind !== 'photo' || !item.uri) return item;
        const printed = await cropToPrintAspect(item.uri);
        return { ...item, uri: printed.uri };
      })
    );
  }, []);

  // THIS SECTION DOES: put new media on the page (or swap a slot) and show the
  // page. It trims photos first so what lands is already the print size.
  const landMedia = useCallback(
    (rawItems: PendingMedia[]) => {
      if (!rawItems.length) return;
      const target = replaceTarget.current;
      replaceTarget.current = null;
      void trimPhotos(rawItems).then((items) => {
        if (!items.length) return;
        if (target && items[0]) {
          draft.replaceMedia(target, items[0]);
        } else {
          draft.addMedia(items);
        }
        const first = items[0];
        if (first?.uri && first.kind === 'photo' && !fromEditor) {
          setJustShotUri(first.uri);
          setPhase('just_shot');
          trackFlowStep('post_story', 'just_shot');
        } else {
          setFromEditor(false);
          setPhase('editor');
          trackFlowStep('post_story', 'editor');
        }
      });
    },
    [draft, fromEditor, trimPhotos]
  );

  // THIS SECTION DOES: when opened with a ready photo (quiz share), skip camera.
  useEffect(() => {
    if (!initialPhotoUri || !draft.hydrated || openedInitial.current) return;
    openedInitial.current = true;
    landMedia([{ kind: 'photo', uri: initialPhotoUri, source: 'camera_roll' }]);
  }, [initialPhotoUri, draft.hydrated, landMedia]);

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
      if (!photo?.uri) {
        Alert.alert('Could not take photo', 'Try again, or add one from your camera roll.');
        return;
      }
      lastStep.current = 'capture_photo';
      trackFlowStep('post_story', 'capture', { method: 'photo' });
      trackClick(POST_COMPOSER.capture.photo, { method: 'photo' });
      // landMedia trims photos to the 8.5x11 collage/story size before they land.
      landMedia([{ kind: 'photo', uri: photo.uri, source: 'bridger_camera' }]);
    } catch {
      Alert.alert('Could not take photo', 'Try again in a moment.');
    }
  };

  // THIS SECTION DOES: flip between the front (selfie) and back camera. Used by
  // the flip button and by a double-tap on the preview. Resetting the ready
  // flag makes the lenses (.5 / 1 / 2 / 4) re-report for the new camera.
  const flipCamera = useCallback(() => {
    if (recordingRef.current) return;
    cameraReadyRef.current = false;
    setFacing((f) => (f === 'front' ? 'back' : 'front'));
  }, []);

  // THIS SECTION DOES: turn two quick taps on the preview into a camera flip.
  // A single tap does nothing (so it never fights the zoom chips or shutter).
  const onPreviewTap = useCallback(() => {
    const now = Date.now();
    if (now - lastPreviewTap.current < 300) {
      lastPreviewTap.current = 0;
      trackClick(POST_COMPOSER.capture.switch_camera, { method: 'double_tap' });
      flipCamera();
      return;
    }
    lastPreviewTap.current = now;
  }, [flipCamera]);

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
    fingerDownRef.current = true;
    videoIntentRef.current = false;
    // PAYMENT: free members can still tap for a photo. Only holding to record
    // video is a co-op perk (do NOT alert on a short shutter press).
    if (!isCoopMemberRef.current) {
      setHolding(false);
      return;
    }
    setHolding(true);
    armVideoHoldIfReady();
  };

  const endHold = () => {
    fingerDownRef.current = false;
    const stillWaitingForHold = !!holdTimer.current;
    clearVideoHoldTimer();
    if (recordingRef.current) {
      cameraRef.current?.stopRecording();
      return;
    }
    // Short press (or free-member tap): always take a photo, never the video lock.
    if (stillWaitingForHold || !videoIntentRef.current) {
      videoIntentRef.current = false;
      setHolding(false);
      void takePhoto();
      return;
    }
    videoIntentRef.current = false;
    setHolding(false);
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

  // THIS SECTION DOES: after a confirmed post. Show the finish screen, then
  // the route can close when they tap Done there.
  const handlePosted = useCallback(
    (_result: { post: StoryPost; wasUpdate: boolean }) => {
      trackFlowCompleted('post_story', Date.now() - flowStartedAt.current, {
        method: _result.post.type,
        was_update: _result.wasUpdate
      });
      lastStep.current = 'posted';
      setFinishedPage(_result.post.page ?? draft.page);
      setJustShotUri(null);
      setPhase('finish');
    },
    [draft.page]
  );

  const leave = useCallback(() => {
    if (onPosted) onPosted();
    else onClose?.();
  }, [onPosted, onClose]);

  const postQuick = async () => {
    if (posting || draft.mediaCount === 0) return;
    if (draft.hasVideo && !isCoopMember) {
      Alert.alert('Co-op unlock', 'Posting video is a co-op perk. Watching video is free for everyone.');
      return;
    }
    setPosting(true);
    try {
      trackFlowStep('post_story', 'post');
      const result = await draft.post({});
      const mediaCount = result.post.page ? countMediaElements(result.post.page) : 1;
      if (result.wasUpdate) {
        trackProduct('scrapbook_page_updated', {
          media_count: mediaCount,
          audience: draft.audience,
          revision: result.post.revision ?? 2
        });
      } else {
        trackProduct('story_posted', {
          media_count: mediaCount,
          method: result.post.type,
          audience: draft.audience
        });
      }
      handlePosted(result);
    } catch (e) {
      const raw = e instanceof Error ? e.message : '';
      Alert.alert(
        'Could not post',
        /internal server error/i.test(raw) || !raw
          ? 'Something went wrong on our side. Please try again in a moment.'
          : raw
      );
    } finally {
      setPosting(false);
    }
  };

  const retakeJustShot = () => {
    const match = [...draft.page.elements]
      .reverse()
      .find((e) => (e.type === 'photo' || e.type === 'video') && e.uri === justShotUri);
    if (match) draft.removeMedia(match.id);
    setJustShotUri(null);
    setPhase('capture');
  };

  const openEditorFromShot = () => {
    // Polaroid layout when they ask to make it a collage and there is one photo.
    if (draft.mediaCount === 1) {
      const polaroid = findLayout('1d') ?? layoutForFamily(1, 'scrapbook');
      if (polaroid) draft.setLayout(polaroid);
    }
    trackFlowStep('post_story', 'editor');
    setPhase('editor');
  };

  if (phase === 'just_shot' && justShotUri) {
    return (
      <SurfaceHost surface="just_shot" parentScreen="post_composer" open key="just-shot">
        <JustShot
          uri={justShotUri}
          posting={posting}
          onRetake={retakeJustShot}
          onSaveRoll={() =>
            void saveToCameraRoll(justShotUri).then((ok) => {
              Alert.alert(ok ? 'Saved' : 'Could not save', ok ? 'On your camera roll.' : 'Try again on a phone.');
            })
          }
          onDone={() => void postQuick()}
          onMakeCollage={openEditorFromShot}
          insetsTop={insets.top}
          insetsBottom={insets.bottom}
        />
      </SurfaceHost>
    );
  }

  if (phase === 'editor') {
    return (
      <CollageEditor
        draft={draft}
        isCoopMember={isCoopMember}
        onClose={() => {
          setFromEditor(false);
          setPhase('capture');
        }}
        onBackToCamera={() => {
          setFromEditor(true);
          setPhase('capture');
        }}
        onPosted={handlePosted}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
      />
    );
  }

  if (phase === 'finish' && finishedPage) {
    return (
      <Finish
        page={finishedPage}
        onDone={leave}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
      />
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
        {/* TOP ROW: close · count · flash */}
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
        </View>
        {taggedEventTitle ? (
          <View className="mt-2 px-4">
            <Text
              accessibilityRole="text"
              accessibilityLabel={`Tagging ${taggedEventTitle}`}
              className="font-sans-md text-[12px] text-white/70"
            >
              Tagging {taggedEventTitle}
            </Text>
          </View>
        ) : null}

        {/* LIVE CAMERA: fills the screen. Permission asked on shutter. */}
        <View className="relative mx-3 mt-3 flex-1 overflow-hidden rounded-3xl bg-black">
          {showLiveCamera ? (
            <CameraView
              ref={cameraRef}
              mode={cameraMode}
              facing={facing}
              flash={flash}
              zoom={activeZoom.zoom}
              selectedLens={Platform.OS === 'ios' ? activeZoom.lens : undefined}
              onCameraReady={onCameraReady}
              onAvailableLensesChanged={onAvailableLensesChanged}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text accessible={false} className="text-[64px] opacity-60">
                📷
              </Text>
            </View>
          )}
          {/* DOUBLE-TAP TO FLIP: a see-through layer over the preview. Two quick
              taps swap front/back. It sits under the zoom chips and page thumb
              (drawn after it) so those stay tappable. Hidden from screen
              readers, which use the labeled flip button instead. */}
          {showLiveCamera ? (
            <Pressable
              onPress={onPreviewTap}
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
          ) : null}
          {recording ? (
            <View className="absolute left-3 top-3 h-3 w-3 rounded-full bg-[#FF3B30]" accessibilityLabel="Recording" />
          ) : null}

          {/* ZOOM CHIPS: only the factors this phone can do (.5 / 1 / 2 / 4).
              Sit above the today's-page thumb so they do not cover each other. */}
          {showLiveCamera && zoomPresets.length > 1 ? (
            <View
              className="absolute bottom-16 left-0 right-0 flex-row items-center justify-center gap-2"
              accessibilityRole="toolbar"
              accessibilityLabel="Camera zoom"
            >
              {zoomPresets.map((preset) => {
                const on = activeZoom.label === preset.label;
                const chip = formatZoomChip(preset.label);
                return (
                  <Pressable
                    key={preset.label}
                    onPress={withAnalyticsPress(
                      POST_COMPOSER.capture.zoom,
                      () => setActiveZoom(preset),
                      { analyticsProps: { zoom_factor: preset.label } }
                    )}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${chip} times zoom`}
                    className={cn(
                      'min-h-[44px] min-w-[44px] items-center justify-center rounded-full',
                      on ? 'bg-white' : 'bg-black/45'
                    )}
                  >
                    <Text
                      accessible={false}
                      className={cn(
                        'font-sans-b text-[13px]',
                        on ? 'text-[#1C1B16]' : 'text-white'
                      )}
                    >
                      {chip}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* TODAY'S PAGE THUMB: bottom-left inside the camera. Tap = open that page. */}
          {thumbPage ? (
            <Pressable
              onPress={withAnalyticsPress(POST_COMPOSER.capture.today_page_thumb, () => {
                if (thumbPost) draft.loadFromPost(thumbPost);
                setPhase('editor');
              })}
              accessibilityRole="button"
              accessibilityLabel={draftHasMedia ? 'Open your unposted page' : "Open today's page"}
              className="absolute bottom-3 left-3 rounded-md border border-white/70"
              style={{ minHeight: 44, justifyContent: 'flex-end' }}
            >
              <ScrapbookPageView page={thumbPage} width={40} mode="view" radius={4} />
              {draftHasMedia ? (
                <View className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-[#0E0E0E] bg-[#EF9F27]" />
              ) : null}
            </Pressable>
          ) : null}
        </View>

        {/* BOTTOM RAIL: roll · shutter · spacer (keeps shutter centered) */}
        <View className="items-center pb-1 pt-4">
          <View className="w-full flex-row items-center justify-between px-8">
            <Pressable
              onPress={() => void pickFromRoll({ limit: draft.left })}
              accessibilityRole="button"
              accessibilityLabel={atCap ? 'Add from camera roll, day is full' : 'Add from camera roll'}
              accessibilityHint="Upload a photo or video from your library"
              accessibilityState={{ disabled: atCap }}
              className={cn(
                'min-h-[48px] min-w-[56px] items-center justify-center gap-0.5 overflow-hidden rounded-xl border border-white/40 bg-white/10 px-1.5 py-1',
                atCap && 'opacity-50'
              )}
            >
              <ImagesIcon size={20} color="#FFFFFF" strokeWidth={2.2} />
              <Text accessible={false} className="font-sans-b text-[10px] text-white">
                Roll
              </Text>
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
              onPress={withAnalyticsPress(POST_COMPOSER.capture.switch_camera, flipCamera, {
                analyticsProps: { method: 'button' }
              })}
              disabled={!showLiveCamera || recording}
              accessibilityRole="button"
              accessibilityLabel="Switch camera"
              className="h-12 w-12 items-center justify-center rounded-full"
            >
              <SwitchCameraIcon size={22} color="#FFFFFF" strokeWidth={2.4} />
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
      </View>
    </SurfaceHost>
  );
}
