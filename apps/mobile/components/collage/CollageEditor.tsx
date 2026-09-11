// ============================================
// WHAT THIS FILE DOES (plain English):
// The collage canvas. The 8.5 x 11 page fills the screen of that shape.
// Tap + to add pieces, tap a piece to move / edit / delete it, Next to pick
// who sees it and post. The draft is already saved on this phone.
// ============================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  PanResponder,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type NativeTouchEvent,
  type PanResponderGestureState
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CameraIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Redo2Icon,
  TypeIcon,
  Undo2Icon,
  XIcon
} from 'lucide-react-native';
import {
  COLLAGE_EDITOR,
  COLLAGE_VOICE,
  POST_COMPOSER,
  SCRAPBOOK_ASPECT_RATIO,
  countMediaElements,
  trackFlowStep,
  trackProduct,
  type ScrapbookElement,
  type StoryPost
} from '@bridger/shared';
import {
  ButtonPrimary,
  CountPill,
  SurfaceHost,
  cn,
  useResponsiveLayout,
  useSurfaceAct,
  withAnalyticsPress
} from '@bridger/ui';
import type { useScrapbookDraft } from '../../hooks/useScrapbookDraft';
import { deletePost, type PostAudience } from '../../data/stories';
import { withFriendNames } from '../../data/collage';
import { pickScrapbookMedia } from '../../lib/pick-scrapbook-media';
import { savePageViewToCameraRoll } from '../../lib/save-to-camera-roll';
import { useCollageVoice } from '../../hooks/useCollageVoice';
import { AudienceSheet } from '../story/ComposeSheets';
import { CollagePage, fitLetterPage } from './Page';
import { Hub, type HubAction } from './Hub';
import { PaperSheet } from './PaperSheet';
import { TextComposer } from './TextComposer';
import { VoiceRecorder } from './VoiceRecorder';
import { PeoplePicker } from './PeoplePicker';
import { CutoutTool } from './CutoutTool';
import { LayerEdit } from './LayerEdit';
import { ExitDialog } from './ExitDialog';
import { CoachMark } from './CoachMark';
import { LayoutPicker } from './LayoutPicker';
import { PackBrowser } from './PackBrowser';

// One touch point (a finger) as React Native reports it.
type GestureTouch = NativeTouchEvent;

// The live position / size / spin of the piece being dragged right now.
// `fontPx` is only set for text, so pinching words grows the letters too.
type LiveXform = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontPx?: number;
};

const CANVAS_BG = '#0E0E0E';
const ON_LIGHT = '#1C1B16';
const PREVIEW_WIDTH_PX = 1275;
const COACH_KEY = 'bridger.collage.onboarding.v1';

const AUDIENCE_LABEL: Record<PostAudience, string> = {
  only_me: 'Only me',
  close: 'Close',
  friend: 'Friends',
  everyone: 'Everyone'
};

type Draft = ReturnType<typeof useScrapbookDraft>;

export function CollageEditor({
  draft,
  isCoopMember,
  onClose,
  onBackToCamera,
  onPosted,
  insetsTop,
  insetsBottom
}: {
  draft: Draft;
  isCoopMember: boolean;
  onClose: () => void;
  onBackToCamera: () => void;
  onPosted: (result: { post: StoryPost; wasUpdate: boolean }) => void;
  insetsTop: number;
  insetsBottom: number;
}) {
  const { markActed } = useSurfaceAct();
  const { width: winW, height: winH, contentMaxWidth } = useResponsiveLayout();
  const { play: playVoice } = useCollageVoice();
  const pageRef = useRef<View>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hubOpen, setHubOpen] = useState(false);
  const [paperOpen, setPaperOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [cutoutOpen, setCutoutOpen] = useState(false);
  const [cutoutUri, setCutoutUri] = useState<string | null>(null);
  const [layerOpen, setLayerOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [layoutsOpen, setLayoutsOpen] = useState(false);
  const [packsOpen, setPacksOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [coach, setCoach] = useState(0);
  // While a finger is down we keep the piece's live position / size / spin here
  // so the page updates smoothly without saving on every pixel.
  const [live, setLive] = useState<LiveXform | null>(null);
  const [overBin, setOverBin] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const selected = useMemo(
    () => draft.page.elements.find((e) => e.id === selectedId) ?? null,
    [draft.page.elements, selectedId]
  );

  useEffect(() => {
    void AsyncStorage.getItem(COACH_KEY).then((v) => {
      if (v === '1') setCoach(0);
    });
  }, []);

  const pageForDraw = useMemo(() => {
    const named = withFriendNames(draft.page);
    if (!live) return named;
    return {
      ...named,
      elements: named.elements.map((e) =>
        e.id === live.id
          ? {
              ...e,
              x: live.x,
              y: live.y,
              width: live.width,
              height: live.height,
              rotation: live.rotation,
              data: live.fontPx ? { ...e.data, fontPx: live.fontPx } : e.data
            }
          : e
      )
    };
  }, [draft.page, live]);

  const taggedIds =
    (draft.page.elements.find((e) => e.type === 'person')?.data.personIds as string[] | undefined) ??
    [];

  const pageSize = fitLetterPage(
    Math.min(box.w || winW - 32, contentMaxWidth ?? winW - 32),
    Math.max(180, box.h || winH * 0.55)
  );

  const flatten = useCallback(async (): Promise<string | undefined> => {
    try {
      if (!pageRef.current) return undefined;
      const { captureRef } = await import('react-native-view-shot');
      return await captureRef(pageRef, {
        format: 'jpg',
        quality: 0.9,
        width: PREVIEW_WIDTH_PX,
        height: Math.round(PREVIEW_WIDTH_PX / SCRAPBOOK_ASPECT_RATIO),
        result: 'tmpfile'
      });
    } catch {
      return undefined;
    }
  }, []);

  const handlePost = useCallback(async () => {
    if (posting || draft.mediaCount === 0) return;
    if (draft.hasVideo && !isCoopMember) {
      Alert.alert('Co-op unlock', 'Posting video is a co-op perk. Watching video is free for everyone.');
      return;
    }
    setPosting(true);
    try {
      trackFlowStep('post_story', 'post');
      const previewUri = await flatten();
      const result = await draft.post({ previewUri });
      const mediaCount = result.post.page ? countMediaElements(result.post.page) : 1;
      const common = {
        media_count: mediaCount,
        layout_id: result.post.page?.layoutId,
        layout_family: result.post.page?.layoutFamily,
        has_words: !!result.post.caption,
        audience: draft.audience,
        is_coop: isCoopMember
      };
      if (result.wasUpdate) {
        trackProduct('scrapbook_page_updated', { ...common, revision: result.post.revision ?? 2 });
      } else {
        trackProduct('story_posted', { ...common, method: result.post.type });
      }
      if (taggedIds.length) {
        trackProduct('collage_friend_tagged', { tag_count: taggedIds.length });
      }
      markActed();
      onPosted(result);
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
  }, [posting, draft, isCoopMember, flatten, markActed, onPosted, taggedIds.length]);

  const pickRoll = async (limit: number) => {
    const items = await pickScrapbookMedia({ limit, allowVideo: isCoopMember });
    if (items.length) draft.addMedia(items);
  };

  const onHub = (action: HubAction) => {
    if (action === 'text') setTextOpen(true);
    if (action === 'camera') onBackToCamera();
    if (action === 'roll') void pickRoll(draft.left);
    if (action === 'voice') setVoiceOpen(true);
    if (action === 'people') setPeopleOpen(true);
    if (action === 'layout') setLayoutsOpen(true);
    if (action === 'paper') setPaperOpen(true);
    if (action === 'cutout') {
      const photo = selected?.type === 'photo' ? selected.uri : draft.mediaElements[0]?.uri;
      setCutoutUri(photo ?? null);
      setCutoutOpen(true);
    }
    if (coach === 1) setCoach(2);
  };

  // Remembers the last tap on a text piece so a quick second tap = edit words.
  const lastTextTap = useRef<{ id: string; at: number }>({ id: '', at: 0 });
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;
  // Snapshot of the piece when the finger(s) go down, plus the live values.
  const startXform = useRef<LiveXform | null>(null);
  const liveRef = useRef<LiveXform | null>(null);
  const pinch = useRef<{ dist: number; angle: number } | null>(null);
  const moved = useRef(false);
  const overBinRef = useRef(false);
  const coachRef = useRef(coach);
  coachRef.current = coach;

  // Distance + angle between the first two fingers (for pinch to size / spin).
  const twoFinger = (touches: readonly GestureTouch[]) => {
    const a = touches[0];
    const b = touches[1];
    if (!a || !b) return { dist: 1, angle: 0 };
    const dx = b.pageX - a.pageX;
    const dy = b.pageY - a.pageY;
    return { dist: Math.hypot(dx, dy) || 1, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!selectedIdRef.current,
      onMoveShouldSetPanResponder: (e, g) =>
        e.nativeEvent.touches.length >= 2 || Math.abs(g.dx) + Math.abs(g.dy) > 6,
      onPanResponderGrant: (e) => {
        moved.current = false;
        const id = selectedIdRef.current;
        const el = draftRef.current.page.elements.find((e2) => e2.id === id);
        if (!el) return;
        const snap: LiveXform = {
          id: el.id,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: el.rotation ?? 0,
          fontPx:
            el.type === 'text' && typeof el.data.fontPx === 'number' ? el.data.fontPx : undefined
        };
        startXform.current = snap;
        liveRef.current = snap;
        setLive(snap);
        const touches = e.nativeEvent.touches;
        pinch.current = touches.length >= 2 ? twoFinger(touches) : null;
        overBinRef.current = false;
        setOverBin(false);
      },
      onPanResponderMove: (e: GestureResponderEvent, g: PanResponderGestureState) => {
        const start = startXform.current;
        const size = pageSizeRef.current;
        if (!start || size.width <= 0) return;
        moved.current = true;
        const touches = e.nativeEvent.touches;

        // TWO FINGERS: resize + rotate around the piece's own center.
        if (touches.length >= 2) {
          const now = twoFinger(touches);
          if (!pinch.current) pinch.current = now;
          const scale = Math.min(6, Math.max(0.15, now.dist / (pinch.current.dist || 1)));
          const cx = start.x + start.width / 2;
          const cy = start.y + start.height / 2;
          const width = Math.min(1.6, Math.max(0.05, start.width * scale));
          const height = Math.min(1.6, Math.max(0.05, start.height * scale));
          const rotation = start.rotation + (now.angle - pinch.current.angle);
          const fontPx =
            start.fontPx !== undefined
              ? Math.min(200, Math.max(8, Math.round(start.fontPx * scale)))
              : undefined;
          const next: LiveXform = {
            id: start.id,
            x: cx - width / 2,
            y: cy - height / 2,
            width,
            height,
            rotation,
            fontPx
          };
          liveRef.current = next;
          setLive(next);
          overBinRef.current = false;
          setOverBin(false);
          return;
        }

        // ONE FINGER: slide the piece; near the bottom it hovers the trash.
        pinch.current = null;
        const nx = start.x + g.dx / size.width;
        const ny = start.y + g.dy / size.height;
        const next: LiveXform = { ...start, x: nx, y: ny };
        liveRef.current = next;
        setLive(next);
        const bin = ny > 0.88;
        overBinRef.current = bin;
        setOverBin(bin);
      },
      onPanResponderRelease: () => {
        const final = liveRef.current;
        const didMove = moved.current;
        startXform.current = null;
        pinch.current = null;
        moved.current = false;
        // A tap that never moved should not create an undo step.
        if (!final || !didMove) {
          liveRef.current = null;
          setLive(null);
          setOverBin(false);
          return;
        }
        if (overBinRef.current) {
          draftRef.current.removeElement(final.id);
          setSelectedId(null);
        } else {
          // Clamp so a piece can never be flung fully off the page.
          draftRef.current.updateElement(final.id, {
            x: Math.min(1.1, Math.max(-0.2, final.x)),
            y: Math.min(1.1, Math.max(-0.2, final.y)),
            width: final.width,
            height: final.height,
            rotation: final.rotation,
            ...(final.fontPx !== undefined ? { data: { fontPx: final.fontPx } } : {})
          });
        }
        liveRef.current = null;
        setLive(null);
        setOverBin(false);
        if (coachRef.current === 2) setCoach(3);
      }
    })
  ).current;

  const askLeave = () => {
    if (draft.hasContent) setExitOpen(true);
    else onClose();
  };

  return (
    <SurfaceHost surface="collage_editor" parentScreen="post_composer" open>
      <View
        style={{
          flex: 1,
          backgroundColor: CANVAS_BG,
          paddingTop: Math.max(insetsTop, 10),
          paddingBottom: Math.max(insetsBottom, 12)
        }}
      >
        {/* TOP: close · undo · redo · menu · Next */}
        <View className="flex-row items-center px-3">
          <Pressable
            onPress={withAnalyticsPress(COLLAGE_EDITOR.chrome.close, askLeave)}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/85"
          >
            <XIcon size={20} color={ON_LIGHT} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            onPress={withAnalyticsPress(COLLAGE_EDITOR.chrome.undo, draft.undo)}
            disabled={!draft.canUndo}
            accessibilityRole="button"
            accessibilityLabel="Undo"
            className="ml-1 h-11 w-11 items-center justify-center"
            style={{ opacity: draft.canUndo ? 1 : 0.3 }}
          >
            <Undo2Icon size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={withAnalyticsPress(COLLAGE_EDITOR.chrome.redo, draft.redo)}
            disabled={!draft.canRedo}
            accessibilityRole="button"
            accessibilityLabel="Redo"
            className="h-11 w-11 items-center justify-center"
            style={{ opacity: draft.canRedo ? 1 : 0.3 }}
          >
            <Redo2Icon size={20} color="#FFFFFF" />
          </Pressable>
          <View className="flex-1 items-center">
            <CountPill used={draft.usedToday} cap={draft.cap} analyticsId={POST_COMPOSER.capture.count_pill} />
          </View>
          <Pressable
            onPress={withAnalyticsPress(COLLAGE_EDITOR.chrome.menu, () => setMenuOpen((v) => !v))}
            accessibilityRole="button"
            accessibilityLabel="More"
            className="h-11 w-11 items-center justify-center"
          >
            <MoreHorizontalIcon size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={withAnalyticsPress(COLLAGE_EDITOR.chrome.next, () => {
              if (draft.mediaCount === 0) return;
              setAudienceOpen(true);
            })}
            disabled={draft.mediaCount === 0 || posting}
            accessibilityRole="button"
            accessibilityLabel="Next"
            className={cn(
              'ml-1 h-11 items-center justify-center rounded-full px-4',
              draft.mediaCount === 0 ? 'bg-white/10' : 'bg-[#1D6FE8]'
            )}
          >
            <Text
              className="font-sans-b"
              style={{ color: draft.mediaCount === 0 ? 'rgba(255,255,255,0.4)' : '#FFFFFF' }}
            >
              Next
            </Text>
          </Pressable>
        </View>

        {menuOpen ? (
          <View className="absolute right-3 top-16 z-20 rounded-[14px] bg-white p-2">
            <MenuRow
              id={COLLAGE_EDITOR.menu.save_roll}
              label="Save to camera roll"
              onPress={() => {
                setMenuOpen(false);
                void savePageViewToCameraRoll(pageRef).then((ok) => {
                  Alert.alert(ok ? 'Saved' : 'Could not save', ok ? 'On your camera roll.' : 'Try again on a phone.');
                });
              }}
            />
            <MenuRow
              id={COLLAGE_EDITOR.menu.learn}
              label="Learn how to collage"
              onPress={() => {
                setMenuOpen(false);
                setCoach(1);
              }}
            />
            <MenuRow
              id={COLLAGE_EDITOR.menu.change_pack}
              label="Change the pack"
              onPress={() => {
                setMenuOpen(false);
                setPacksOpen(true);
              }}
            />
            <MenuRow
              id={COLLAGE_EDITOR.menu.clear}
              label="Clear the page"
              danger
              onPress={() => {
                setMenuOpen(false);
                draft.clearPage();
                setSelectedId(null);
              }}
            />
            <MenuRow
              id={COLLAGE_EDITOR.menu.delete_page}
              label="Delete this page"
              danger
              onPress={() => {
                setMenuOpen(false);
                Alert.alert(
                  'Delete this page?',
                  'It comes off your day. Friends will not see it.',
                  [
                    { text: 'Keep it', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        void (async () => {
                          try {
                            if (draft.postId) {
                              await deletePost(draft.postId);
                              trackProduct('scrapbook_page_deleted', {
                                media_count: draft.mediaCount
                              });
                            }
                            draft.reset();
                            onClose();
                          } catch {
                            Alert.alert('Could not delete', 'Try again in a moment.');
                          }
                        })();
                      }
                    }
                  ]
                );
              }}
            />
          </View>
        ) : null}

        {/* PAGE fills the leftover screen at 8.5 x 11 */}
        <View
          className="mt-3 flex-1 items-center justify-center px-4"
          onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
          {...pan.panHandlers}
        >
          <View ref={pageRef} collapsable={false}>
            <CollagePage
              page={pageForDraw}
              width={pageSize.width}
              mode="compose"
              selectedElementId={selectedId}
              radius={8}
              analyticsIds={{
                canvas: COLLAGE_EDITOR.page.canvas,
                photoSlot: COLLAGE_EDITOR.page.piece,
                captionSlot: POST_COMPOSER.page.caption_slot
              }}
              onPressCanvas={() => {
                if (selectedId) setSelectedId(null);
                else setPaperOpen(true);
                if (coach === 4) setCoach(5);
              }}
              onPressVoice={(el) => {
                playVoice(el.uri);
                setSelectedId(el.id);
              }}
              onPressElement={(el) => {
                if (el.type === 'voice') {
                  playVoice(el.uri);
                  setSelectedId(el.id);
                  return;
                }
                // The caption slot is fixed by the layout, so tapping it edits words.
                if (el.type === 'text' && el.data.role === 'caption') {
                  setTextOpen(true);
                  return;
                }
                // Free words: one tap selects it (so you can drag / resize it),
                // a quick second tap opens the words editor.
                if (el.type === 'text') {
                  const now = Date.now();
                  const isDouble = lastTextTap.current.id === el.id && now - lastTextTap.current.at < 300;
                  lastTextTap.current = { id: el.id, at: now };
                  setSelectedId(el.id);
                  if (isDouble) setTextOpen(true);
                  return;
                }
                setSelectedId((cur) => (cur === el.id ? null : el.id));
              }}
            />
          </View>
          {live ? (
            <View
              pointerEvents="none"
              className="absolute bottom-2 h-[52px] w-[52px] items-center justify-center rounded-full"
              style={{ backgroundColor: overBin ? '#D64A3A' : 'rgba(255,255,255,0.2)' }}
              accessibilityLabel="Throw away"
            >
              <Text accessible={false}>🗑</Text>
            </View>
          ) : null}
        </View>

        {selected && !live ? (
          <View className="absolute right-3 top-1/4 rounded-full bg-white py-1">
            {selected.type === 'voice' ? (
              <RailBtn
                id={COLLAGE_VOICE.capture.play}
                label="Play"
                onPress={() => playVoice(selected.uri)}
              />
            ) : null}
            <RailBtn id={COLLAGE_EDITOR.rail.delete} label="Delete" onPress={() => {
              draft.removeElement(selected.id);
              setSelectedId(null);
            }} />
            <RailBtn id={COLLAGE_EDITOR.rail.duplicate} label="Copy" onPress={() => draft.duplicateElement(selected.id)} />
            {/* Text opens the words editor; a photo opens the frame / look editor. */}
            <RailBtn
              id={COLLAGE_EDITOR.rail.edit}
              label="Edit"
              onPress={() => {
                if (selected.type === 'text') setTextOpen(true);
                else setLayerOpen(true);
              }}
            />
            {/* Nudge the spin a touch without needing two fingers. */}
            <RailBtn
              id={COLLAGE_EDITOR.rail.rotate}
              label="Turn"
              onPress={() =>
                draft.updateElement(selected.id, { rotation: ((selected.rotation ?? 0) + 15) % 360 })
              }
            />
            <RailBtn id={COLLAGE_EDITOR.rail.bring_front} label="Front" onPress={() => draft.bringToFront(selected.id)} />
          </View>
        ) : null}

        {/* TOOLBAR */}
        <View className="flex-row items-center justify-around px-6 pt-3">
          <Pressable
            onPress={withAnalyticsPress(COLLAGE_EDITOR.toolbar.text, () => setTextOpen(true))}
            accessibilityRole="button"
            accessibilityLabel="Add text"
            className="h-11 w-11 items-center justify-center"
          >
            <TypeIcon size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={withAnalyticsPress(COLLAGE_EDITOR.toolbar.add, () => setHubOpen(true))}
            accessibilityRole="button"
            accessibilityLabel="Add to the page"
            className="h-11 w-[52px] items-center justify-center rounded-full bg-white"
          >
            <PlusIcon size={22} color={ON_LIGHT} />
          </Pressable>
          <Pressable
            onPress={withAnalyticsPress(COLLAGE_EDITOR.toolbar.camera, onBackToCamera)}
            accessibilityRole="button"
            accessibilityLabel="Camera"
            className="h-11 w-11 items-center justify-center"
          >
            <CameraIcon size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {coach > 0 ? (
          <CoachMark
            step={coach}
            onNext={() => {
              if (coach >= 5) {
                setCoach(0);
                void AsyncStorage.setItem(COACH_KEY, '1');
              } else setCoach((n) => n + 1);
            }}
            onSkip={() => {
              setCoach(0);
              void AsyncStorage.setItem(COACH_KEY, '1');
            }}
          />
        ) : null}

        <Hub open={hubOpen} onClose={() => setHubOpen(false)} onPick={onHub} />
        <PaperSheet open={paperOpen} onClose={() => setPaperOpen(false)} draft={draft} />
        <LayoutPicker open={layoutsOpen} onClose={() => setLayoutsOpen(false)} draft={draft} />
        <PackBrowser open={packsOpen} onClose={() => setPacksOpen(false)} draft={draft} />
        <TextComposer
          open={textOpen}
          onClose={() => setTextOpen(false)}
          initial={
            selected?.type === 'text'
              ? {
                  text: String(selected.data.text ?? ''),
                  fontPx: typeof selected.data.fontPx === 'number' ? selected.data.fontPx : 28,
                  color: typeof selected.data.color === 'string' ? selected.data.color : '#1C1B16',
                  textBg: selected.data.textBg === true,
                  font: selected.data.font
                }
              : undefined
          }
          onSave={(next) => {
            if (selected?.type === 'text') {
              draft.updateElement(selected.id, { data: next });
            } else {
              draft.addText(next);
            }
          }}
        />
        <VoiceRecorder
          open={voiceOpen}
          onClose={() => setVoiceOpen(false)}
          onAdd={(clip) => draft.addVoice(clip)}
        />
        <PeoplePicker
          open={peopleOpen}
          onClose={() => setPeopleOpen(false)}
          selectedIds={taggedIds}
          onSave={(ids) => draft.addPeople(ids)}
        />
        <CutoutTool
          open={cutoutOpen}
          onClose={() => setCutoutOpen(false)}
          uri={cutoutUri}
          onAdd={({ uri, clip, maskUri }) => {
            const existing = draft.mediaElements.find((e) => e.uri === uri);
            // A shape on a photo already on the page just clips that photo.
            if (existing && !maskUri) {
              draft.updateElement(existing.id, { data: { clip } });
              return;
            }
            // A lifted subject is a new PNG. Upload that file, not the original.
            draft.addCutout({
              uri: maskUri ?? uri,
              clip: maskUri ? 'blob' : clip,
              source: existing?.source ?? 'bridger_camera',
              countsAsMedia: !existing
            });
          }}
        />
        <LayerEdit
          open={layerOpen}
          onClose={() => setLayerOpen(false)}
          element={selected}
          onPatch={(data) => selected && draft.updateElement(selected.id, { data })}
          onSwap={() => {
            setLayerOpen(false);
            void pickRoll(1);
          }}
          onDuplicate={() => selected && draft.duplicateElement(selected.id)}
          onDelete={() => {
            if (selected) draft.removeElement(selected.id);
            setSelectedId(null);
            setLayerOpen(false);
          }}
        />
        <ExitDialog
          open={exitOpen}
          onClose={() => setExitOpen(false)}
          onDiscard={() => {
            draft.reset();
            setExitOpen(false);
            onClose();
          }}
          onSave={() => {
            setExitOpen(false);
            onClose();
          }}
        />
        <AudienceSheet
          open={audienceOpen}
          onClose={() => setAudienceOpen(false)}
          value={draft.audience}
          onChange={draft.setAudience}
          confirmLabel={`Post to ${AUDIENCE_LABEL[draft.audience]}`}
          confirming={posting}
          onConfirm={() => void handlePost()}
        />
      </View>
    </SurfaceHost>
  );
}

function RailBtn({ id, label, onPress }: { id: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={withAnalyticsPress(id, onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[44px] items-center justify-center px-3"
    >
      <Text className="font-sans-md text-[12px] text-ink">{label}</Text>
    </Pressable>
  );
}

function MenuRow({
  id,
  label,
  onPress,
  danger
}: {
  id: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(id, onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[44px] justify-center px-3"
    >
      <Text className={cn('font-sans-md', danger ? 'text-[#D64A3A]' : 'text-ink')}>{label}</Text>
    </Pressable>
  );
}
