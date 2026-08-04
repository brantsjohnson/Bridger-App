// ============================================
// WHAT THIS FILE DOES (plain English):
// One reply in the story comments thread — avatar, name, time, and the
// content (text, sticker, or circle-video chip). Optional quiet "Reply" link
// so you can answer that person directly.
// ============================================
import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { PlayIcon, VideoIcon } from 'lucide-react-native';
import { CATCH_UP, type Accent, type Reaction } from '@bridger/shared';
import { Avatar, withAnalyticsPress } from '@bridger/ui';

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
      <Avatar name={name} emoji={emoji} accent={accent} personId={reaction.authorId} size="sm" />
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
 * plays in place — the same circle it was recorded in. Older demo replies have
 * no clip attached, so those just show the video badge.
 */
function CircleVideoReply({
  uri,
  seconds,
  name
}: {
  uri?: string;
  seconds?: number;
  name: string;
}) {
  const [playing, setPlaying] = useState(false);
  const player = useVideoPlayer(uri ?? null, (p) => {
    p.loop = false;
  });

  if (!uri) {
    return (
      <View className="mt-1 h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-purple">
        <VideoIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
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
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
        accessibilityIgnoresInvertColors
      />
      {!playing ? (
        <View className="absolute inset-0 items-center justify-center bg-ink/30">
          <PlayIcon size={22} color="#FFFFFF" strokeWidth={2.6} fill="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}
