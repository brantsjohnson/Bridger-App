// ============================================
// WHAT THIS FILE DOES (plain English):
// One reply in the story comments thread — avatar, name, time, and the
// content (text, sticker, or circle-video chip). Optional quiet "Reply" link
// so you can answer that person directly.
// ============================================
import React, { useState } from 'react';
import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import { PlayIcon, VideoIcon } from 'lucide-react-native';
import { CATCH_UP, type Accent, type Reaction } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { getDemoReplyPoster, getProfilePhoto } from '../../data/fixtures/demo-media';
import { PersonAvatar } from '../PersonAvatar';

type Props = {
  reaction: Reaction;
  name: string;
  emoji: string;
  accent: Accent;
  /** answering one person directly, rather than shouting at the thread */
  onReply?: (name: string) => void;
};

export function ReplyRow({ reaction, name, emoji, accent, onReply }: Props) {
  const first = name.split(' ')[0] ?? name;

  return (
    <View className="flex-row items-start gap-3">
      {/* THIS SECTION DOES: show their real face (same photo lookup as Home chips) */}
      <PersonAvatar
        id={reaction.authorId}
        name={name}
        emoji={emoji}
        accent={accent}
        size="sm"
      />
      <View className="min-w-0 flex-1">
        <Text className="font-sans-b text-[13px] text-ink">
          {first}{' '}
          <Text className="font-sans-sb text-[11px] text-ink-mute">{reaction.at}</Text>
        </Text>
        {reaction.kind === 'text' ? (
          <Text className="font-sans text-[14px] text-ink-soft">{reaction.text}</Text>
        ) : null}
        {reaction.kind === 'sticker' ? (
          reaction.stickerUri ? (
            // A sticker they made themselves.
            <Image
              source={{ uri: reaction.stickerUri }}
              accessibilityLabel={`Sticker from ${first}`}
              accessibilityIgnoresInvertColors
              style={{ width: 56, height: 56, borderRadius: 28, marginTop: 4 }}
            />
          ) : (
            <Text className="text-[24px] leading-none">{reaction.stickerId}</Text>
          )
        ) : null}
        {reaction.kind === 'circleVideo' ? (
          <CircleVideoReply
            uri={reaction.videoUri}
            media={reaction.videoMedia}
            poster={
              getDemoReplyPoster(reaction.authorId) ?? getProfilePhoto(reaction.authorId)
            }
            seconds={reaction.videoSeconds}
            name={first}
          />
        ) : null}

        {onReply ? (
          <Pressable
            onPress={withAnalyticsPress(CATCH_UP.bottom.reply, () => onReply(first))}
            accessibilityRole="button"
            accessibilityLabel={`Reply to ${first}`}
            hitSlop={8}
            className="mt-1 min-h-[28px] justify-center"
          >
            <Text className="font-sans-b text-[11px] text-ink-mute">Reply</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/**
 * A round video reply in the thread. It sits still until you tap it, then
 * plays in place — the same circle it was recorded in.
 * Prefers a real clip (bundled demo media or a recorded URI). If somehow
 * there is still no clip, we show their photo with a play badge so the row
 * never collapses to an empty purple icon.
 */
function CircleVideoReply({
  uri,
  media,
  poster,
  seconds,
  name
}: {
  uri?: string;
  media?: ImageSourcePropType;
  poster?: ImageSourcePropType;
  seconds?: number;
  name: string;
}) {
  const [playing, setPlaying] = useState(false);
  // Bundled require()'d assets work the same way as story videos.
  const source: VideoSource | null = media
    ? (media as VideoSource)
    : uri
      ? { uri }
      : null;
  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
  });

  // THIS SECTION DOES: when there is no clip, show their picture + a play badge
  if (!source) {
    return (
      <View
        accessibilityLabel={`${name}'s video reply`}
        className="mt-1 h-14 w-14 overflow-hidden rounded-full border-2 border-ink"
      >
        {poster ? (
          <Image
            source={poster}
            accessibilityIgnoresInvertColors
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-purple">
            <VideoIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        )}
        <View className="absolute inset-0 items-center justify-center bg-ink/30">
          <PlayIcon size={18} color="#FFFFFF" strokeWidth={2.6} fill="#FFFFFF" />
        </View>
      </View>
    );
  }

  const toggle = () => {
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.currentTime = 0;
      player.play();
      setPlaying(true);
    }
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={
        playing
          ? `Pause ${name}'s video reply`
          : `Play ${name}'s ${seconds ?? 10} second video reply`
      }
      className="mt-1 h-20 w-20 overflow-hidden rounded-full border-2 border-ink"
    >
      {/*
        THIS SECTION DOES: show the still photo until they tap play.
        On web, VideoView is opaque even before the first frame, so it would
        hide the picture if we kept it mounted the whole time.
      */}
      {playing ? (
        <VideoView
          player={player}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          nativeControls={false}
          accessibilityIgnoresInvertColors
        />
      ) : poster ? (
        <Image
          source={poster}
          accessibilityIgnoresInvertColors
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <View className="h-full w-full items-center justify-center bg-purple">
          <VideoIcon size={22} color="#FFFFFF" strokeWidth={2.4} />
        </View>
      )}
      {!playing ? (
        <View className="absolute inset-0 items-center justify-center bg-ink/30">
          <PlayIcon size={22} color="#FFFFFF" strokeWidth={2.6} fill="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}
