// ============================================
// WHAT THIS FILE DOES (plain English):
// Screen 2 of posting a Scrapbook: the page. You land here right after taking
// a photo. Bridger has already laid the photo on an 8.5 x 11 page. From here
// you can: tap a layout thumbnail to change the arrangement (instant, no
// Apply), tap the caption slot to add words, tap a photo to replace, remove,
// or move it to another page, tap "+" to add more from the camera or roll,
// tap the pencil for paper color + Undo, tap the audience chip to choose who
// sees it, and tap POST. Post is always available once one photo exists.
//
// Almost no words on this screen on purpose. The only sentences live in the
// tiny "i" popover. Sheets slide up over the page; nothing navigates away.
//
// ACCESSIBILITY: fixed near-black canvas (does not follow theme ink) so white
// chrome always reads. Every control has a role + label + 44pt target. The
// page's slots and thumbnails announce themselves. Reflow uses Reveal, which
// goes still under Reduce Motion.
// ============================================
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  InfoIcon,
  PencilIcon,
  PlusIcon
} from 'lucide-react-native';
import {
  POST_COMPOSER,
  SCRAPBOOK_ASPECT_RATIO,
  countMediaElements,
  trackClick,
  trackFlowStep,
  trackProduct,
  type ScrapbookElement,
  type StoryPost
} from '@bridger/shared';
import {
  ButtonPrimary,
  CountPill,
  InfoPopover,
  LayoutCarousel,
  Reveal,
  ScrapbookPage,
  cn,
  useSurfaceAct,
  withAnalyticsPress,
  type AudienceLevel
} from '@bridger/ui';
import type { useScrapbookDraft } from '../../hooks/useScrapbookDraft';
import type { PostAudience } from '../../data/stories';
import { AddMediaSheet, AudienceSheet, CaptionSheet, CustomizeTray } from './ComposeSheets';

/** Fixed near-black canvas (same as the camera screen). */
const CANVAS_BG = '#0E0E0E';
/** Always-dark type on white pills. */
const ON_LIGHT_INK = '#1C1B16';
/** Width of the flattened preview we upload (8.5in at 150dpi). Height follows the ratio. */
const PREVIEW_WIDTH_PX = 1275;

/** Tier color for the audience chip so "who sees this" reads at a glance. */
const AUDIENCE_CHIP: Record<PostAudience, { label: string; bg: string; ink: string }> = {
  only_me: { label: 'Only me', bg: '#E8940C', ink: '#FFFFFF' },
  close: { label: 'Close', bg: '#2FA85B', ink: '#FFFFFF' },
  friend: { label: 'Friends', bg: '#1D6FE8', ink: '#FFFFFF' },
  everyone: { label: 'Everyone', bg: '#F2560E', ink: '#FFFFFF' }
};

type Draft = ReturnType<typeof useScrapbookDraft>;

type Props = {
  draft: Draft;
  isCoopMember: boolean;
  /** Back chevron: return to the camera. The draft is kept. */
  onBack: () => void;
  /** "+" then Camera: return to the camera to add another shot. */
  onAddFromCamera: () => void;
  /** "+" then Camera roll (or Replace from roll): open the picker. */
  onAddFromRoll: (opts: { limit: number; replaceElementId?: string }) => void;
  /** After a confirmed post / save. */
  onPosted: (result: { post: StoryPost; wasUpdate: boolean }) => void;
  /** Event tag shown as a quiet line under the page when present. */
  taggedEventTitle?: string;
  onClearEventTag?: () => void;
  insetsTop: number;
  insetsBottom: number;
};

export function PageCompose({
  draft,
  isCoopMember,
  onBack,
  onAddFromCamera,
  onAddFromRoll,
  onPosted,
  taggedEventTitle,
  onClearEventTag,
  insetsTop,
  insetsBottom
}: Props) {
  const { markActed } = useSurfaceAct();
  const pageRef = useRef<View>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);

  const selected = useMemo(
    () => draft.page.elements.find((e) => e.id === selectedId) ?? null,
    [draft.page.elements, selectedId]
  );
  const selectedIsMedia = selected?.type === 'photo' || selected?.type === 'video';
  /** Other pages you posted today (not the one being edited). */
  const otherPages = draft.todayPosts.filter((p) => p.id !== draft.postId);
  const chip = AUDIENCE_CHIP[draft.audience];
  const bgColor =
    draft.page.background.kind === 'solid' && draft.page.background.color
      ? draft.page.background.color
      : '#F4F1E7';

  // THIS SECTION DOES: tapping parts of the page.
  const onPressElement = useCallback(
    (el: ScrapbookElement) => {
      if (el.type === 'text' && el.data.role === 'caption') {
        setSelectedId(null);
        setCaptionOpen(true);
        return;
      }
      if (el.type === 'photo' || el.type === 'video') {
        setSelectedId((cur) => (cur === el.id ? null : el.id));
        setMoveOpen(false);
        return;
      }
      // Date stamp and future elements: nothing to edit yet in Phase 1.
      setSelectedId(null);
    },
    []
  );

  // THIS SECTION DOES: flatten the page to one image for the feed + tile.
  // Falls back to nothing (the data layer then uses the first photo) when the
  // platform cannot snapshot (some web browsers).
  const flatten = useCallback(async (): Promise<string | undefined> => {
    try {
      if (!pageRef.current) return undefined;
      // Loaded on demand (same pattern as the quiz share card) so the native
      // module never blocks the composer from mounting on web.
      const { captureRef } = await import('react-native-view-shot');
      const uri = await captureRef(pageRef, {
        format: 'jpg',
        quality: 0.9,
        width: PREVIEW_WIDTH_PX,
        height: Math.round(PREVIEW_WIDTH_PX / SCRAPBOOK_ASPECT_RATIO),
        result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile'
      });
      return uri;
    } catch {
      return undefined;
    }
  }, []);

  // THIS SECTION DOES: POST. Product events fire only after the server confirms.
  const handlePost = useCallback(async () => {
    if (posting || draft.mediaCount === 0) return;
    if (draft.hasVideo && !isCoopMember) {
      Alert.alert('Co-op unlock', 'Posting video is a co-op perk. Watching video is free for everyone.');
      return;
    }
    setPosting(true);
    try {
      trackFlowStep('post_story', 'post');
      setSelectedId(null);
      const previewUri = await flatten();
      const result = await draft.post({ previewUri });
      const mediaCount = result.post.page ? countMediaElements(result.post.page) : 1;
      const sources = new Set(
        (result.post.page?.elements ?? [])
          .filter((e) => e.type === 'photo' || e.type === 'video')
          .map((e) => e.source ?? 'bridger_camera')
      );
      const common = {
        media_count: mediaCount,
        layout_id: result.post.page?.layoutId,
        layout_family: result.post.page?.layoutFamily,
        has_words: !!result.post.caption,
        words_method: result.post.caption ? 'text' : 'none',
        source_mix:
          sources.size > 1 ? 'mixed' : sources.has('camera_roll') ? 'roll' : 'live',
        audience: draft.audience,
        is_coop: isCoopMember,
        ...(result.post.eventId ? { event_id: result.post.eventId } : {})
      };
      if (result.wasUpdate) {
        trackProduct('scrapbook_page_updated', {
          ...common,
          revision: result.post.revision ?? 2
        });
      } else {
        trackProduct('story_posted', {
          ...common,
          method: result.post.type
        });
      }
      markActed();
      onPosted(result);
    } catch (e) {
      // Prefer the Nest message; never show a bare "Internal server error".
      const raw = e instanceof Error ? e.message : '';
      const friendly =
        /internal server error/i.test(raw) || !raw
          ? 'Something went wrong on our side. Please try again in a moment.'
          : raw;
      Alert.alert('Could not post', friendly);
    } finally {
      setPosting(false);
    }
  }, [posting, draft, isCoopMember, flatten, markActed, onPosted]);

  // THIS SECTION DOES: move the selected photo onto another page (or a new one).
  const moveTo = useCallback(
    async (target: { postId: string } | 'new') => {
      if (!selected) return;
      try {
        await draft.moveMediaTo(selected.id, target);
        setSelectedId(null);
        setMoveOpen(false);
        trackProduct('scrapbook_page_updated', {
          media_count: draft.mediaCount - 1,
          layout_family: draft.page.layoutFamily,
          added_via: target === 'new' ? 'split' : 'merge'
        });
      } catch (e) {
        Alert.alert('Could not move', e instanceof Error ? e.message : 'Try again.');
      }
    },
    [selected, draft]
  );

  // THIS SECTION DOES: tapping another page in the strip.
  const openOtherPage = useCallback(
    (post: StoryPost) => {
      trackClick(POST_COMPOSER.pages.page_thumb);
      if (!draft.isEditingPosted && draft.mediaCount > 0) {
        // A fresh, unposted page: offer to put these photos on that page.
        Alert.alert('Add to that page?', undefined, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: () => {
              void (async () => {
                try {
                  await draft.mergeInto(post.id);
                  trackProduct('scrapbook_page_updated', {
                    layout_family: post.page?.layoutFamily,
                    added_via: 'merge'
                  });
                  const fresh = draft.todayPosts.find((p) => p.id === post.id) ?? post;
                  draft.loadFromPost(fresh);
                } catch (e) {
                  Alert.alert('Could not add', e instanceof Error ? e.message : 'Try again.');
                }
              })();
            }
          }
        ]);
        return;
      }
      if (draft.isEditingPosted && draft.canUndo) {
        Alert.alert('Post your changes first', 'Or undo them before opening another page.');
        return;
      }
      draft.loadFromPost(post);
      setSelectedId(null);
    },
    [draft]
  );

  const pageAccessibility = `Your page, ${draft.mediaCount} ${
    draft.mediaCount === 1 ? 'photo' : 'photos'
  }${draft.caption ? ', with caption' : ''}`;

  return (
    <View
      style={{
        flex: 1,
        paddingTop: Math.max(insetsTop, 12),
        paddingBottom: Math.max(insetsBottom, 16),
        backgroundColor: CANVAS_BG
      }}
    >
      {/* TOP ROW: back · count · audience chip */}
      <View className="flex-row items-center justify-between px-4">
        <Pressable
          onPress={withAnalyticsPress(POST_COMPOSER.actions.back, onBack)}
          accessibilityRole="button"
          accessibilityLabel="Back to camera"
          className="h-11 w-11 items-center justify-center rounded-full bg-white/85"
        >
          <ChevronLeftIcon size={20} color={ON_LIGHT_INK} strokeWidth={2.6} />
        </Pressable>

        <CountPill
          used={draft.usedToday}
          cap={draft.cap}
          analyticsId={POST_COMPOSER.capture.count_pill}
        />

        <Pressable
          onPress={withAnalyticsPress(POST_COMPOSER.audience.chip, () => setAudienceOpen(true))}
          accessibilityRole="button"
          accessibilityLabel={`Who sees this: ${chip.label}. Change`}
          className="min-h-[44px] flex-row items-center gap-1 rounded-full px-3.5"
          style={{ backgroundColor: chip.bg }}
        >
          <Text className="font-sans-b text-[12px]" style={{ color: chip.ink }}>
            {chip.label}
          </Text>
          <ChevronDownIcon size={14} color={chip.ink} strokeWidth={3} />
        </Pressable>
      </View>

      {/* PAGE STRIP: only when there are other pages today. Tiny, no words. */}
      {otherPages.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
          className="mt-3 max-h-14"
          accessibilityRole="tablist"
        >
          {otherPages.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => openOtherPage(p)}
              accessibilityRole="tab"
              accessibilityLabel={`Open page ${i + 1} of today`}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              {p.page ? (
                <ScrapbookPage page={p.page} width={30} mode="view" radius={3} />
              ) : (
                <View className="h-[39px] w-[30px] rounded-[3px] bg-white/30" />
              )}
            </Pressable>
          ))}
          {/* The page you are on now: a filled marker, not a thumbnail. */}
          <View
            accessible
            accessibilityRole="tab"
            accessibilityState={{ selected: true }}
            accessibilityLabel={draft.isEditingPosted ? 'This page, open' : 'New page, open'}
            className="h-[39px] w-[30px] items-center justify-center rounded-[3px] border-2 border-[#1D6FE8]"
            style={{ backgroundColor: bgColor }}
          />
        </ScrollView>
      ) : null}

      {/* THE PAGE: 8.5 x 11, sits on the dark canvas with margin. */}
      <View
        className="flex-1 items-center justify-center px-8 py-3"
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          // Fit inside the available box, never taller than the space.
          const byWidth = width;
          const byHeight = height * SCRAPBOOK_ASPECT_RATIO;
          setPageWidth(Math.max(120, Math.min(byWidth, byHeight)));
        }}
      >
        {pageWidth > 0 ? (
          <Reveal key={draft.page.layoutId ?? 'page'}>
            <View ref={pageRef} collapsable={false}>
              <ScrapbookPage
                page={draft.page}
                width={pageWidth}
                mode="compose"
                selectedElementId={selectedId}
                onPressElement={onPressElement}
                onPressCanvas={() => {
                  setSelectedId(null);
                  setMoveOpen(false);
                }}
                renderMedia={(el, box) =>
                  el.type === 'video' ? <VideoPoster el={el} box={box} /> : null
                }
                analyticsIds={{
                  canvas: POST_COMPOSER.page.canvas,
                  photoSlot: POST_COMPOSER.page.photo_slot,
                  captionSlot: POST_COMPOSER.page.caption_slot,
                  stamp: POST_COMPOSER.page.stamp
                }}
                accessibilityLabel={pageAccessibility}
                radius={6}
              />
            </View>
          </Reveal>
        ) : null}

        {/* SELECTED PHOTO CHIPS: float above the page, disappear on any other tap. */}
        {selected && selectedIsMedia ? (
          <View
            className="absolute top-1 flex-row items-center gap-2 rounded-full bg-white px-2 py-1"
            accessibilityLiveRegion="polite"
          >
            <ChipButton
              label="Replace"
              analyticsId={POST_COMPOSER.page.replace}
              onPress={() => onAddFromRoll({ limit: 1, replaceElementId: selected.id })}
            />
            <ChipButton
              label="Remove"
              analyticsId={POST_COMPOSER.page.remove}
              onPress={() => {
                draft.removeMedia(selected.id);
                setSelectedId(null);
              }}
            />
            {draft.mediaCount > 1 || otherPages.length > 0 ? (
              <ChipButton
                label="Move to…"
                analyticsId={POST_COMPOSER.page.move_to_page}
                onPress={() => setMoveOpen((v) => !v)}
                expanded={moveOpen}
              />
            ) : null}
          </View>
        ) : null}

        {/* MOVE TARGETS: other pages as tiny thumbs + a "new page" square. */}
        {selected && selectedIsMedia && moveOpen ? (
          <View className="absolute top-12 flex-row items-center gap-2 rounded-2xl bg-white p-2">
            {otherPages.map((p, i) => (
              <Pressable
                key={p.id}
                onPress={() => void moveTo({ postId: p.id })}
                accessibilityRole="button"
                accessibilityLabel={`Move to page ${i + 1}`}
                style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                {p.page ? (
                  <ScrapbookPage page={p.page} width={30} mode="view" radius={3} />
                ) : (
                  <View className="h-[39px] w-[30px] rounded-[3px] bg-ink/20" />
                )}
              </Pressable>
            ))}
            {draft.mediaCount > 1 && otherPages.length < draft.cap - 1 ? (
              <Pressable
                onPress={withAnalyticsPress(POST_COMPOSER.pages.new_page, () => void moveTo('new'))}
                accessibilityRole="button"
                accessibilityLabel="Move to a new page"
                style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <View className="h-[39px] w-[30px] items-center justify-center rounded-[3px] border border-dashed border-ink/50">
                  <PlusIcon size={14} color={ON_LIGHT_INK} strokeWidth={2.6} />
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* EVENT TAG: quiet line, only when opened from a party nudge. */}
      {taggedEventTitle ? (
        <View className="mx-4 mb-2 flex-row items-center justify-between rounded-full border border-white/25 px-4 py-2">
          <Text numberOfLines={1} className="min-w-0 flex-1 font-sans-b text-[12px] text-white">
            {taggedEventTitle}
          </Text>
          <Pressable
            onPress={withAnalyticsPress(POST_COMPOSER.suggested.event_tag_clear, onClearEventTag)}
            accessibilityRole="button"
            accessibilityLabel="Remove event tag"
            className="min-h-[32px] justify-center rounded-full bg-white/15 px-3"
          >
            <Text className="font-sans-b text-[12px] text-white">Remove</Text>
          </Pressable>
        </View>
      ) : null}

      {/* LAYOUTS: page-shaped thumbs, no labels. Tap = instant. */}
      <LayoutCarousel
        layouts={draft.layouts}
        selectedId={draft.page.layoutId}
        analyticsId={POST_COMPOSER.layouts.thumb}
        onSelect={(layout) => {
          const from = draft.page.layoutId;
          draft.setLayout(layout);
          setSelectedId(null);
          trackFlowStep('post_story', 'layout_picked', { layout_id: layout.id });
          trackProduct('layout_changed', {
            from_layout_id: from,
            to_layout_id: layout.id,
            layout_family: layout.family,
            method: 'tap'
          });
        }}
        className="mt-1"
      />

      {/* COMPOSER BAR: + · pencil · POST · i */}
      <View className="mt-4 flex-row items-center gap-3 px-4">
        <RoundButton
          analyticsId={POST_COMPOSER.actions.add}
          label={draft.atCap ? 'Add, day is full' : 'Add a photo or video'}
          onPress={() => setAddOpen(true)}
          dim={draft.atCap}
        >
          <PlusIcon size={22} color="#FFFFFF" strokeWidth={2.4} />
        </RoundButton>
        <RoundButton
          analyticsId={POST_COMPOSER.actions.customize}
          label="Customize"
          onPress={() => setCustomizeOpen(true)}
        >
          <PencilIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
        </RoundButton>
        <View className="flex-1">
          <ButtonPrimary
            full
            loading={posting}
            disabled={draft.mediaCount === 0}
            analyticsId={POST_COMPOSER.actions.post}
            onPress={() => void handlePost()}
            accessibilityLabel={draft.isEditingPosted ? 'Post changes' : 'Post'}
          >
            Post
          </ButtonPrimary>
        </View>
        <InfoPopover
          title="About this page"
          description="Tap a layout to change it. Tap the page to add words. + adds more from today. Everything else is optional."
          infoAnalyticsId={POST_COMPOSER.actions.info}
          dismissAnalyticsId={POST_COMPOSER.actions.info_dismiss}
          bodyAnalyticsId={POST_COMPOSER.actions.info_body}
          parentScreen="post_composer"
          section="actions"
        >
          <View className="h-11 w-11 items-center justify-center">
            <InfoIcon size={18} color="rgba(255,255,255,0.7)" strokeWidth={2.2} />
          </View>
        </InfoPopover>
      </View>

      {/* SHEETS: each its own surface; the page stays visible behind them. */}
      <CaptionSheet
        open={captionOpen}
        onClose={() => setCaptionOpen(false)}
        value={draft.caption}
        onSave={(text) => {
          draft.setCaption(text);
          trackFlowStep('post_story', 'caption', { method: 'text' });
        }}
      />
      <AudienceSheet
        open={audienceOpen}
        onClose={() => setAudienceOpen(false)}
        value={draft.audience as AudienceLevel}
        onChange={(v) => {
          draft.setAudience(v as PostAudience);
          trackFlowStep('post_story', 'audience', { audience: v });
        }}
        // No fake demo groups. "Or a group" appears once real co-op groups exist.
        groups={[]}
      />
      <AddMediaSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        left={draft.left}
        onCamera={onAddFromCamera}
        onRoll={() => onAddFromRoll({ limit: draft.left })}
      />
      <CustomizeTray
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        background={bgColor}
        onBackground={draft.setBackground}
        canUndo={draft.canUndo}
        onUndo={draft.undo}
      />
    </View>
  );
}

// THIS SECTION DOES: small helpers so the screen above reads top to bottom.

/** White chip in the selected-photo row. */
function ChipButton({
  label,
  analyticsId,
  onPress,
  expanded
}: {
  label: string;
  analyticsId: string;
  onPress: () => void;
  expanded?: boolean;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      className={cn(
        'min-h-[36px] justify-center rounded-full px-3',
        expanded ? 'bg-[#1C1B16]' : 'bg-transparent'
      )}
    >
      <Text className={cn('font-sans-b text-[12px]', expanded ? 'text-white' : 'text-[#1C1B16]')}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Round translucent icon button on the dark canvas. */
function RoundButton({
  analyticsId,
  label,
  onPress,
  dim,
  children
}: {
  analyticsId: string;
  label: string;
  onPress: () => void;
  dim?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        'h-12 w-12 items-center justify-center rounded-full bg-white/15 active:opacity-90',
        dim && 'opacity-50'
      )}
    >
      {children}
    </Pressable>
  );
}

/** A video slot on the compose page: dark box, play glyph, length. Plays in the viewer. */
function VideoPoster({ el, box }: { el: ScrapbookElement; box: { width: number; height: number } }) {
  const secs =
    typeof el.data.durationMs === 'number' ? Math.round(el.data.durationMs / 1000) : undefined;
  return (
    <View
      style={{ width: box.width, height: box.height }}
      className="items-center justify-center bg-[#1C1B16]"
      accessible={false}
    >
      <Text className="text-[22px]">▶</Text>
      {secs ? (
        <Text className="mt-1 font-sans-b text-[11px] text-white/80">{secs}s</Text>
      ) : null}
    </View>
  );
}
