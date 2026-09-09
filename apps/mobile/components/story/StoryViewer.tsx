// ============================================
// WHAT THIS FILE DOES (plain English):
// The full-screen Updates player. Shows one friend's posts with timed progress
// bars, caption on the left with bottom controls (emoji → comment → red-dot
// record) on the right, floating
// reply balloons, and the Catch-Up peek. Tap left = previous, center = pause,
// right = next. When the last post ends, we either open the next friend in the
// tray sequence or show "You're all caught up" with confetti. Catch-Up stays
// parked at the peek while swapping friends. Respects reduce-motion.
//
// SCRAPBOOK PAGES: a post that carries a real page (photos laid out on an
// 8.5 x 11 sheet) is drawn as that page, letterboxed on the dark canvas, so
// the chrome never covers the photos. A video on the page plays in its slot.
// Old one-photo posts still fill the screen like before.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import {
  ChevronDownIcon,
  MessageCircleIcon,
  SmileIcon,
  XIcon
} from 'lucide-react-native';
import {
  STORY,
  dismissSurface,
  openSurface,
  trackProduct
} from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  Avatar,
  ScrapbookPage,
  SegmentedProgress,
  cn,
  withAnalyticsPress
} from '@bridger/ui';
import { SCRAPBOOK_ASPECT_RATIO } from '@bridger/shared';
import { clearStoryReplyNotifications, markStorySeen } from '../../data/feed';
import { getMembership } from '../../data/coop';
import { avatarPhotoFor } from '../../lib/avatar-photo';
import { useStoryViewer } from '../../hooks/useStoryViewer';
import { CatchUpPanel } from './CatchUpPanel';
import { CircleRecorder } from './CircleRecorder';
import { CommentSheet } from './CommentSheet';
import { FloatingReactions } from './FloatingReactions';
import { StoriesCaughtUp } from './StoriesCaughtUp';
import { StickerStudio } from './StickerStudio';
import { StickerTray } from './StickerTray';

const POST_MS = 6000;
/** Always-dark icon / label on white chrome (does not flip in dark mode). */
const CHROME_INK = '#1C1B16';

/** Plain alert when a story reply fails (API or offline). */
function alertReplyFailed(error: unknown) {
  const raw = error instanceof Error ? error.message : '';
  const message =
    raw === 'Not allowed'
      ? 'You cannot post on this update right now. You may need to connect with them first.'
      : raw === 'Story is no longer available'
        ? 'This update is no longer live. You can still message them directly.'
        : raw === 'Video reactions require co-op membership'
          ? 'Video replies are a co-op perk. Stickers and comments are free.'
          : raw || 'Try again in a moment.';
  Alert.alert('Could not reply', message);
}

type Props = {
  authorId: string;
  onClose?: () => void;
  startCatchUpOpen?: boolean;
  startCommentsOpen?: boolean;
  /**
   * Ordered author ids from the Home tray. When this author's posts finish,
   * we move to the next id. Empty / single means "all caught up when done".
   */
  sequence?: string[];
  /** Opened from a profile / friend page — celebrate then close when done. */
  fromProfile?: boolean;
  /** Move to another author in the sequence (Home tray). */
  onAdvanceAuthor?: (nextAuthorId: string) => void;
};

export function StoryViewer({
  authorId,
  onClose,
  startCatchUpOpen = false,
  startCommentsOpen = false,
  sequence = [],
  fromProfile = false,
  onAdvanceAuthor
}: Props) {
  const insets = useSafeAreaInsets();
  const {
    author,
    posts,
    post,
    index,
    goNext,
    goPrev,
    catchUp,
    replies,
    loading,
    onAnswerCatchUp,
    onAddReply
  } = useStoryViewer(authorId);

  const [catchUpOpen, setCatchUpOpen] = useState(startCatchUpOpen);
  const [commentsOpen, setCommentsOpen] = useState(startCommentsOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  // Shown after the last friend in the tray (or a lone author) is finished.
  const [allCaughtUp, setAllCaughtUp] = useState(false);
  // The three reply tools: the emoji strip, the make-a-sticker camera, and the
  // 10-second round recorder. Any of them open holds the story still.
  const [trayOpen, setTrayOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [recorderOpen, setRecorderOpen] = useState(false);
  // Bumped when a new sticker is saved so the strip picks it up.
  const [stickerRefresh, setStickerRefresh] = useState(0);
  /** PAYMENT: video replies are co-op — gate before opening the round recorder. */
  const [isCoopMember, setIsCoopMember] = useState(false);
  // User tapped the center to pause (separate from sheets holding playback).
  const [userPaused, setUserPaused] = useState(false);
  const overlayPaused =
    catchUpOpen || commentsOpen || menuOpen || trayOpen || studioOpen || recorderOpen;
  const paused = overlayPaused || userPaused;

  // New slide clears a manual pause so the next post can run.
  useEffect(() => {
    setUserPaused(false);
  }, [index, authorId]);

  // Keep Catch-Up collapsed when moving to the next friend — never carry an
  // expanded sheet across authors (that looked like it "opened then closed").
  // Skip the first mount so ?catchup=1 deep links still open the sheet.
  const skipCatchUpReset = React.useRef(true);
  useEffect(() => {
    if (skipCatchUpReset.current) {
      skipCatchUpReset.current = false;
      return;
    }
    setCatchUpOpen(false);
  }, [authorId]);

  // --- SENDING A STICKER: one path for both the standard emoji and your own ---
  const sendSticker = async (input: {
    stickerId?: string;
    stickerUri?: string;
    method?: 'sticker' | 'custom_sticker';
  }) => {
    try {
      const created = await onAddReply({
        kind: 'sticker',
        stickerId: input.stickerId,
        stickerUri: input.stickerUri
      });
      if (!created) {
        Alert.alert('Could not reply', 'This update is not ready yet. Try again in a moment.');
        return;
      }
      trackProduct('response_posted', { method: input.method ?? 'sticker' });
      if (authorId === 'me') clearStoryReplyNotifications();
    } catch (e) {
      alertReplyFailed(e);
    }
  };

  // --- PAGE: a real Scrapbook page (not the one-photo legacy shape)? ---
  const isPage = !!post?.page && !post.page.id.startsWith('legacy-');
  // The first video on the page is the one that plays (others show a poster).
  const pageVideo = isPage
    ? post?.page?.elements.find((e) => e.type === 'video' && !!e.uri)
    : undefined;
  // --- VIDEO: is the current slide a video we have real media for? ---
  const isVideo = isPage ? !!pageVideo : post?.type === 'video' && !!post?.media;
  /** What the shared player should load for this slide. */
  const videoSource: VideoSource | null = isPage
    ? pageVideo?.uri
      ? { uri: pageVideo.uri }
      : null
    : ((post?.media as VideoSource | undefined) ?? null);
  // How wide the page can be drawn inside the media frame (measured below).
  const [pageBox, setPageBox] = useState<{ w: number; h: number } | null>(null);
  // How long the progress bar should take. Photos use a fixed 6s; videos use
  // their real length once we learn it (falls back to 6s until then).
  const [videoDurationMs, setVideoDurationMs] = useState(POST_MS);

  // One reusable video player for the whole viewer. We swap its source as the
  // slides change rather than creating a new player each time.
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  // Mark the story surface open for interaction ordering
  useEffect(() => {
    openSurface('story');
    return () => dismissSurface('story');
  }, []);

  // THIS SECTION DOES: learn co-op status so we can gate video replies only.
  useEffect(() => {
    let alive = true;
    void getMembership()
      .then((m) => {
        if (alive) setIsCoopMember(!!m.member);
      })
      .catch(() => {
        if (alive) setIsCoopMember(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const openVideoRecorder = useCallback(() => {
    if (!isCoopMember) {
      Alert.alert(
        'Co-op unlock',
        'Video replies are a co-op perk. Stickers and comments are free for everyone.'
      );
      return;
    }
    setTrayOpen(false);
    setRecorderOpen(true);
  }, [isCoopMember]);

  // --- END OF THIS AUTHOR: next in tray sequence, or "all caught up" ---
  // Catch-Up open = stay put (do not dismiss under the sheet).
  const handleExhausted = useCallback(() => {
    if (catchUpOpen) return;
    // Finished every post for this person → ring off + move to back of tray.
    // Remember which revision we watched so a later add lights the ring again.
    markStorySeen(
      authorId,
      posts.reduce((n, p) => n + (p.revision ?? 1), 0)
    );
    if (fromProfile) {
      // One friend's profile: celebrate then close (Done on the end screen).
      setAllCaughtUp(true);
      return;
    }
    const seq = sequence.length ? sequence : [authorId];
    const at = seq.indexOf(authorId);
    const nextId = at >= 0 ? seq[at + 1] : undefined;
    if (nextId && onAdvanceAuthor) {
      onAdvanceAuthor(nextId);
      return;
    }
    setAllCaughtUp(true);
  }, [catchUpOpen, fromProfile, sequence, authorId, onAdvanceAuthor, posts]);

  const handleNext = useCallback(() => {
    const result = goNext();
    if (result === 'exhausted') handleExhausted();
  }, [goNext, handleExhausted]);

  const togglePause = useCallback(() => {
    setUserPaused((v) => !v);
  }, []);

  // --- VIDEO: point the player at the current slide (or clear it) ---
  useEffect(() => {
    if (isVideo && videoSource) {
      // Story media is a bundled require()'d asset, which expo-video accepts
      // even though its type is written for image sources.
      player.replace(videoSource);
      // Kick playback off immediately rather than waiting on another render,
      // so the clip doesn't sit on a frozen first frame before it starts.
      if (!paused) player.play();
      // Reset to the fallback length until the real duration loads in.
      setVideoDurationMs(POST_MS);
    } else {
      player.pause();
    }
    // `paused` deliberately left out: the play/pause effect below owns that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideo, post?.media, pageVideo?.uri, player]);

  // --- VIDEO: play/pause with the rest of the viewer (sheets, menu, tabs) ---
  useEffect(() => {
    if (!isVideo) return;
    if (paused) player.pause();
    else player.play();
  }, [isVideo, paused, player, post?.media]);

  // --- VIDEO: learn the clip length so the top bar matches it ---
  useEffect(() => {
    if (!isVideo) return;
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status !== 'readyToPlay') return;
      if (player.duration > 0) {
        setVideoDurationMs(Math.round(player.duration * 1000));
      }
      // The clip may finish loading after we asked it to play, so start it
      // here too — this is what removes the lag before a video story runs.
      if (!paused) player.play();
    });
    return () => sub.remove();
  }, [isVideo, player, post?.media, paused]);

  // --- VIDEO: when the clip finishes, advance to the next slide ---
  useEffect(() => {
    if (!isVideo) return;
    const sub = player.addListener('playToEnd', () => handleNext());
    return () => sub.remove();
  }, [isVideo, player, handleNext, post?.media]);

  // Photos auto-advance on a timer. Videos advance when they finish playing
  // (handled above), so skip the timer for them.
  useEffect(() => {
    if (paused || !post || isVideo) return;
    const t = setTimeout(() => handleNext(), POST_MS);
    return () => clearTimeout(t);
  }, [index, paused, post, handleNext, isVideo]);

  // End of the tray: celebrate instead of snapping straight back to Home.
  if (allCaughtUp) {
    return <StoriesCaughtUp onDone={() => onClose?.()} />;
  }

  if (loading || !post) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0E0E0E]">
        <Text className="font-sans-sb text-[14px] text-white/70">
          {loading ? 'Loading…' : 'No updates yet'}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="mt-4 min-h-[44px] rounded-full bg-white/85 px-5 py-2"
        >
          <Text className="font-sans-b text-[14px] text-[#1C1B16]">Close</Text>
        </Pressable>
      </View>
    );
  }

  const token = ACCENTS[post.accent];
  const firstName = author.name.split(' ')[0] ?? author.name;
  // Catch-Up peeks 172px from the bottom. The media runs a little BEHIND that
  // sheet so its rounded top edge overlaps the photo instead of butting up
  // against it, while the important part of the shot still sits clear above.
  const CATCH_UP_PEEK = 172;
  const CATCH_UP_OVERLAP = 28;
  const mediaBottom = CATCH_UP_PEEK - CATCH_UP_OVERLAP;
  // Bottom controls + caption sit just above the Catch-Up peek.
  const controlsBottom = CATCH_UP_PEEK + 10;

  // A page already shows its own caption; the bottom bubble would repeat it.
  const pageShowsCaption =
    isPage &&
    !!post.page?.elements.some(
      (e) => e.type === 'text' && e.data.role === 'caption' && String(e.data.text ?? '').trim()
    );

  return (
    // Pages sit on the near-black canvas (like the composer); legacy posts keep their accent.
    <View className={cn('relative flex-1 overflow-hidden', isPage ? 'bg-[#0E0E0E]' : token.bg)}>
      {/*
        Tap zones over the media: left = previous, center = pause/play,
        right = next. Chrome (header, bottom controls, Catch-Up) sits above
        and keeps its own taps.
      */}
      <View className="absolute inset-0 flex-row" style={{ bottom: mediaBottom }}>
        <Pressable
          onPress={withAnalyticsPress(STORY.viewer.tap_prev, goPrev)}
          accessibilityRole="button"
          accessibilityLabel="Previous post"
          className="w-[28%]"
        />
        <Pressable
          onPress={withAnalyticsPress(STORY.viewer.tap_pause, togglePause)}
          accessibilityRole="button"
          accessibilityLabel={userPaused ? 'Play' : 'Pause'}
          className="flex-1"
        />
        <Pressable
          onPress={withAnalyticsPress(STORY.viewer.tap_next, handleNext)}
          accessibilityRole="button"
          accessibilityLabel="Next post"
          className="w-[28%]"
        />
      </View>

      {/*
        Media frame: full screen width, stops at the top of Catch-Up.
        Cover fills this box — crop story photos to ~9:15.5 so faces aren't cut.
      */}
      <View
        pointerEvents="none"
        className="absolute inset-x-0 top-0 items-center justify-center overflow-hidden"
        style={{ bottom: mediaBottom }}
      >
        {isPage && post.page ? (
          // SCRAPBOOK PAGE: letterboxed so the header + caption row never cover it.
          <View
            className="flex-1 items-center justify-center"
            style={{
              width: '100%',
              paddingTop: Math.max(insets.top, 12) + 84,
              paddingBottom: 84,
              paddingHorizontal: 16
            }}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setPageBox({
                w: width - 32,
                h: height - (Math.max(insets.top, 12) + 84) - 84
              });
            }}
          >
            {pageBox ? (
              <ScrapbookPage
                page={post.page}
                width={Math.max(120, Math.min(pageBox.w, pageBox.h * SCRAPBOOK_ASPECT_RATIO))}
                mode="view"
                radius={8}
                accessibilityLabel={`${author.name}'s page`}
                renderMedia={(el, box) =>
                  el.type === 'video' ? (
                    el.id === pageVideo?.id ? (
                      <VideoView
                        player={player}
                        style={{ width: box.width, height: box.height }}
                        contentFit="cover"
                        nativeControls={false}
                        accessibilityIgnoresInvertColors
                      />
                    ) : (
                      <View
                        style={{ width: box.width, height: box.height }}
                        className="items-center justify-center bg-[#1C1B16]"
                      >
                        <Text className="text-[22px]">▶</Text>
                      </View>
                    )
                  ) : null
                }
              />
            ) : null}
          </View>
        ) : isVideo ? (
          <VideoView
            player={player}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            nativeControls={false}
            accessibilityIgnoresInvertColors
          />
        ) : post.media ? (
          <Image
            source={post.media}
            accessibilityIgnoresInvertColors
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
          />
        ) : (
          <Text accessible={false} className="text-[128px] opacity-90">
            {post.emoji}
          </Text>
        )}
        {/* Quiet pause cue so people know they stopped the clip. */}
        {userPaused && !overlayPaused ? (
          <View className="absolute inset-0 items-center justify-center bg-black/25">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-black/55">
              <Text className="font-sans-b text-[13px] text-white">Paused</Text>
            </View>
          </View>
        ) : null}
      </View>

      <FloatingReactions
        replies={replies}
        paused={paused}
        bottomInset={controlsBottom + 56}
        onOpen={() => setCommentsOpen(true)}
      />

      {/* timed progress + header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="absolute inset-x-0 top-0 z-20 px-4"
      >
        <AnalyticsRegion analyticsId={STORY.viewer.progress_bar} interactive={false}>
          <SegmentedProgress
            count={posts.length}
            index={index}
            durationMs={isVideo ? videoDurationMs : POST_MS}
            paused={paused}
          />
        </AnalyticsRegion>

        <View className="relative mt-3 flex-row items-center gap-2.5">
          <Pressable
            onPress={withAnalyticsPress(STORY.viewer.author, () => setMenuOpen((v) => !v))}
            accessibilityRole="button"
            accessibilityLabel={`${author.name} options`}
            accessibilityState={{ expanded: menuOpen }}
            className="min-h-[44px] flex-row items-center gap-2.5"
          >
            <View className="relative">
              <Avatar
                name={author.name}
                emoji={author.emoji}
                accent={author.accent}
                personId={author.id}
                photo={avatarPhotoFor(author.id, author.avatarUrl)}
                size="sm"
              />
              <View className="absolute -bottom-0.5 -right-0.5 h-4 w-4 items-center justify-center rounded-full bg-white">
                <ChevronDownIcon size={12} color={CHROME_INK} strokeWidth={3} />
              </View>
            </View>
            <View>
              <Text
                className="font-sans-b text-[14px] text-white"
                style={{ textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 4 }}
              >
                {author.name}
              </Text>
              <Text
                className="font-sans-sb text-[11px] text-white/90"
                style={{ textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 4 }}
              >
                {post.createdAt}
                {post.themeSlug ? ' · Take 0.5' : ''}
              </Text>
            </View>
          </Pressable>

          <View className="flex-1" />

          {/* Always-white pill + near-black X so it stays readable in dark mode. */}
          <Pressable
            onPress={withAnalyticsPress(STORY.viewer.close, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="h-9 w-9 items-center justify-center rounded-full bg-white"
          >
            <XIcon size={20} color={CHROME_INK} strokeWidth={2.6} />
          </Pressable>

          {menuOpen ? (
            <View className="absolute left-0 top-12 z-30 w-44 overflow-hidden rounded-2xl border border-ink-line bg-white">
              {(
                [
                  ['View profile', () => Alert.alert('Profile', 'Friend profile ships next.')],
                  ['Mute stories', () => Alert.alert('Muted', 'You will see fewer of these.')],
                  ['Report', () => Alert.alert('Report', 'Thanks — we will review this.')]
                ] as Array<[string, () => void]>
              ).map(([label, action]) => (
                <Pressable
                  key={label}
                  onPress={withAnalyticsPress(STORY.viewer.overflow, () => {
                    setMenuOpen(false);
                    action();
                  })}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  className="min-h-[44px] justify-center px-4 py-2.5 active:bg-[#F1ECFF]"
                >
                  <Text className="font-sans-sb text-[13px] text-[#1C1B16]">{label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/*
        Bottom row: caption on the left, reaction icons on the right
        (emoji → comment → record), vertically center-aligned.
        Record is a red dot, like a classic record button.
      */}
      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 z-20 flex-row items-center gap-2.5 px-3"
        style={{ bottom: controlsBottom }}
      >
        {/*
          Caption uses a fixed dark scrim + white type. Theme ink flips light
          in dark mode, so bg-ink + text-white used to vanish on cream.
        */}
        {post.caption && !pageShowsCaption ? (
          <AnalyticsRegion
            analyticsId={STORY.viewer.caption_body}
            interactive={false}
            className="min-w-0 flex-1 rounded-2xl bg-black/80 px-3.5 py-2.5"
          >
            <Text className="font-sans-b text-[15px] leading-snug text-white">
              {post.caption}
            </Text>
          </AnalyticsRegion>
        ) : (
          <View className="min-w-0 flex-1" />
        )}

        <View className="shrink-0 flex-row items-center gap-2">
          <Pressable
            onPress={withAnalyticsPress(STORY.reaction_rail.sticker, () => setTrayOpen((v) => !v), {
              analyticsProps: { method: 'sticker' }
            })}
            accessibilityRole="button"
            accessibilityLabel="Stickers"
            accessibilityState={{ expanded: trayOpen }}
            className={cn(
              'h-11 w-11 items-center justify-center rounded-full',
              trayOpen ? 'bg-white' : 'bg-white/90'
            )}
          >
            <SmileIcon size={20} color={CHROME_INK} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            onPress={withAnalyticsPress(
              STORY.reaction_rail.comment,
              () => {
                setTrayOpen(false);
                setCommentsOpen(true);
              },
              { analyticsProps: { method: 'comment' } }
            )}
            accessibilityRole="button"
            accessibilityLabel="Comments"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/90"
          >
            <MessageCircleIcon size={20} color={CHROME_INK} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            onPress={withAnalyticsPress(
              STORY.reaction_rail.record,
              openVideoRecorder,
              { analyticsProps: { method: 'video' } }
            )}
            accessibilityRole="button"
            accessibilityLabel="Record a 10 second video reply"
            className="h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-[#1C1B16]"
          >
            {/* Red record dot — clearer than a camera glyph at this size. */}
            <View className="h-5 w-5 rounded-full bg-[#FF3B30]" />
          </Pressable>
        </View>
      </View>

      <StickerTray
        open={trayOpen}
        onClose={() => setTrayOpen(false)}
        refreshKey={stickerRefresh}
        anchorBottom={controlsBottom + 56}
        onPickEmoji={(emoji) => {
          void sendSticker({ stickerId: emoji });
          setTrayOpen(false);
        }}
        onPickCustom={(sticker) => {
          void sendSticker({ stickerUri: sticker.uri, method: 'custom_sticker' });
          setTrayOpen(false);
        }}
        onCreateSticker={() => {
          setTrayOpen(false);
          setStudioOpen(true);
        }}
      />

      <StickerStudio
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        onSaved={() => {
          setStickerRefresh((n) => n + 1);
          // Drop them back in the strip with their new sticker at the front.
          setTrayOpen(true);
        }}
      />

      <CircleRecorder
        open={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        onSend={async (uri, seconds) => {
          try {
            const created = await onAddReply({
              kind: 'circleVideo',
              videoUri: uri,
              videoSeconds: seconds
            });
            if (!created) {
              Alert.alert('Could not reply', 'This update is not ready yet. Try again in a moment.');
              return;
            }
            if (authorId === 'me') clearStoryReplyNotifications();
          } catch (e) {
            alertReplyFailed(e);
            throw e;
          }
        }}
      />

      {catchUp ? (
        <CatchUpPanel
          open={catchUpOpen}
          onOpenChange={setCatchUpOpen}
          authorName={firstName}
          live={catchUp.live}
          answered={catchUp.answered}
          week={catchUp.week}
          currently={catchUp.currently}
          onAnswer={onAnswerCatchUp}
        />
      ) : null}

      <CommentSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        replies={replies}
        onAddReply={async (input) => {
          try {
            const created = await onAddReply(input);
            if (!created) {
              Alert.alert('Could not reply', 'This update is not ready yet. Try again in a moment.');
              return null;
            }
            if (authorId === 'me') clearStoryReplyNotifications();
            return created;
          } catch (e) {
            alertReplyFailed(e);
            return null;
          }
        }}
        onOpenStickers={() => setTrayOpen(true)}
        onRecordVideo={openVideoRecorder}
      />
    </View>
  );
}
