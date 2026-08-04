// ============================================
// WHAT THIS FILE DOES (plain English):
// The full-screen Updates player. Shows one friend's posts with timed progress
// bars, a reaction rail (record / sticker / comment), floating reply balloons,
// and the Catch-Up peek at the bottom. Auto-advances every ~6s unless a sheet
// or menu is open. Respects reduce-motion via SegmentedProgress.
// ============================================
import React, { useEffect, useState } from 'react';
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
  VideoIcon,
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
  SegmentedProgress,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { getProfilePhoto } from '../../data/fixtures/demo-media';
import { useStoryViewer } from '../../hooks/useStoryViewer';
import { CatchUpPanel } from './CatchUpPanel';
import { CircleRecorder } from './CircleRecorder';
import { CommentSheet } from './CommentSheet';
import { FloatingReactions } from './FloatingReactions';
import { StickerStudio } from './StickerStudio';
import { StickerTray } from './StickerTray';

const POST_MS = 6000;

type Props = {
  authorId: string;
  onClose?: () => void;
  startCatchUpOpen?: boolean;
  startCommentsOpen?: boolean;
};

export function StoryViewer({
  authorId,
  onClose,
  startCatchUpOpen = false,
  startCommentsOpen = false
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
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
  // The three reply tools: the emoji strip, the make-a-sticker camera, and the
  // 10-second round recorder. Any of them open holds the story still.
  const [trayOpen, setTrayOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [recorderOpen, setRecorderOpen] = useState(false);
  // Bumped when a new sticker is saved so the strip picks it up.
  const [stickerRefresh, setStickerRefresh] = useState(0);
  const paused =
    catchUpOpen || commentsOpen || menuOpen || trayOpen || studioOpen || recorderOpen;

  // --- SENDING A STICKER: one path for both the standard emoji and your own ---
  const sendSticker = async (input: {
    stickerId?: string;
    stickerUri?: string;
    method?: 'sticker' | 'custom_sticker';
  }) => {
    await onAddReply({
      kind: 'sticker',
      stickerId: input.stickerId,
      stickerUri: input.stickerUri
    });
    trackProduct('response_posted', { method: input.method ?? 'sticker' });
  };

  // --- VIDEO: is the current slide a video we have real media for? ---
  const isVideo = post?.type === 'video' && !!post?.media;
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

  // --- VIDEO: point the player at the current slide (or clear it) ---
  useEffect(() => {
    if (isVideo && post?.media) {
      // Story media is a bundled require()'d asset, which expo-video accepts
      // even though its type is written for image sources.
      player.replace(post.media as VideoSource);
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
  }, [isVideo, post?.media, player]);

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
    const sub = player.addListener('playToEnd', () => goNext());
    return () => sub.remove();
  }, [isVideo, player, goNext, post?.media]);

  // Photos auto-advance on a timer. Videos advance when they finish playing
  // (handled above), so skip the timer for them.
  useEffect(() => {
    if (paused || !post || posts.length <= 1 || isVideo) return;
    const t = setTimeout(() => goNext(), POST_MS);
    return () => clearTimeout(t);
  }, [index, paused, post, posts.length, goNext, isVideo]);

  if (loading || !post) {
    return (
      <View className="flex-1 items-center justify-center bg-ink">
        <Text className="font-sans-sb text-[14px] text-white/70">
          {loading ? 'Loading…' : 'No updates yet'}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="mt-4 min-h-[44px] rounded-full bg-white/85 px-5 py-2"
        >
          <Text className="font-sans-b text-[14px] text-ink">Close</Text>
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

  return (
    <View className={cn('relative flex-1 overflow-hidden', token.bg)}>
      {/* Full-bleed tap zones: left = prev, right = next */}
      <View className="absolute inset-0 flex-row">
        <Pressable
          onPress={withAnalyticsPress(STORY.viewer.tap_prev, goPrev)}
          accessibilityRole="button"
          accessibilityLabel="Previous post"
          className="w-1/3"
        />
        <Pressable
          onPress={withAnalyticsPress(STORY.viewer.tap_next, goNext)}
          accessibilityRole="button"
          accessibilityLabel="Next post"
          className="flex-1"
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
        {isVideo ? (
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
        {post.overlayText ? (
          <View className="absolute left-1/2 top-[32%] -translate-x-1/2 -rotate-2 bg-white px-3 py-1">
            <Text className="font-pixel text-[20px] text-ink">{post.overlayText}</Text>
          </View>
        ) : null}
      </View>

      <FloatingReactions
        replies={replies}
        paused={paused}
        onOpen={() => setCommentsOpen(true)}
      />

      {/* timed progress + header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="absolute inset-x-0 top-0 px-4"
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
                photo={getProfilePhoto(author.id)}
                size="sm"
              />
              <View className="absolute -bottom-0.5 -right-0.5 h-4 w-4 items-center justify-center rounded-full bg-white">
                <ChevronDownIcon size={12} color={c.ink} strokeWidth={3} />
              </View>
            </View>
            <View>
              <Text className="font-sans-b text-[14px] text-white">{author.name}</Text>
              <Text className="font-sans-sb text-[11px] text-white/80">
                {post.createdAt}
                {post.themeSlug ? ' · Take 0.5' : ''}
              </Text>
            </View>
          </Pressable>

          <View className="flex-1" />

          <Pressable
            onPress={withAnalyticsPress(STORY.viewer.close, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="h-9 w-9 items-center justify-center rounded-full bg-white/85"
          >
            <XIcon size={20} color={c.ink} strokeWidth={2.6} />
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
                  <Text className="font-sans-sb text-[13px] text-ink">{label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/*
        Right reaction rail: record a 10-second round video, send a sticker,
        or write a comment. The sticker button unrolls the emoji strip beside
        itself rather than firing off a fixed emoji.
      */}
      <View className="absolute right-3 top-1/2 -translate-y-1/2 items-center gap-3">
        <Pressable
          onPress={withAnalyticsPress(
            STORY.reaction_rail.record,
            () => {
              setTrayOpen(false);
              setRecorderOpen(true);
            },
            { analyticsProps: { method: 'video' } }
          )}
          accessibilityRole="button"
          accessibilityLabel="Record a 10 second video reply"
          className="h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-ink"
        >
          <VideoIcon size={24} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
        <Pressable
          onPress={withAnalyticsPress(STORY.reaction_rail.sticker, () => setTrayOpen((v) => !v), {
            analyticsProps: { method: 'sticker' }
          })}
          accessibilityRole="button"
          accessibilityLabel="Stickers"
          accessibilityState={{ expanded: trayOpen }}
          className={cn(
            'h-11 w-11 items-center justify-center rounded-full',
            trayOpen ? 'bg-white' : 'bg-white/85'
          )}
        >
          <SmileIcon size={20} color={c.ink} strokeWidth={2.4} />
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
          className="h-11 w-11 items-center justify-center rounded-full bg-white/85"
        >
          <MessageCircleIcon size={20} color={c.ink} strokeWidth={2.4} />
        </Pressable>
      </View>

      <StickerTray
        open={trayOpen}
        onClose={() => setTrayOpen(false)}
        refreshKey={stickerRefresh}
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
          await onAddReply({ kind: 'circleVideo', videoUri: uri, videoSeconds: seconds });
        }}
      />

      {/*
        The caption sits in its own solid bubble. White-on-photo was getting
        lost against bright shots, so it now has a surface of its own.
      */}
      {post.caption ? (
        <AnalyticsRegion
          analyticsId={STORY.viewer.caption_body}
          interactive={false}
          className="absolute bottom-[190px] left-4 max-w-[250px] rounded-2xl bg-ink/85 px-3.5 py-2.5"
        >
          <Text className="font-sans-b text-[15px] leading-snug text-white">
            {post.caption}
          </Text>
        </AnalyticsRegion>
      ) : null}

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
        onAddReply={onAddReply}
        onOpenStickers={() => setTrayOpen(true)}
        onRecordVideo={() => setRecorderOpen(true)}
      />
    </View>
  );
}
