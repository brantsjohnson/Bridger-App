// ============================================
// WHAT THIS FILE DOES (plain English):
// "What people said" under the stories tray — horizontal chips for text and
// video replies to your update. Tap opens the thread. Hidden when empty.
// Analytics: header is dead-click; each chip is a response tap.
// PRIVACY: never log reply text or names in analytics.
//
// Dark mode: video chips keep a pale lavender fill, so their labels use
// text-onaccent (always near-black). text-ink would flip light and vanish.
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronRightIcon, PlayIcon } from 'lucide-react-native';
import { HOME, type Reaction } from '@bridger/shared';
import { AnalyticsRegion, cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import { PersonAvatar } from '../PersonAvatar';
import { personById } from '../../data/people';

export function StoryRepliesRow({
  replies: allReplies,
  onOpen
}: {
  replies: Reaction[];
  onOpen?: () => void;
}) {
  const c = useThemeColors();
  const replies = allReplies.filter((r) => !r.parentReactionId);
  if (replies.length === 0) return null;

  const videos = replies.filter((r) => r.kind === 'circleVideo');

  return (
    <View className="mt-4">
      {/* Analytics: section label is not a button; taps log dead_click. */}
      <AnalyticsRegion
        analyticsId={HOME.responses.responses_header}
        interactive={false}
        accessibilityLabel={`${replies.length} replies to your story`}
        className="mb-2 flex-row items-center gap-2"
      >
        <Text className="font-sans-b text-[13px] text-ink">{replies.length} replies to your story</Text>
        {videos.length > 0 ? (
          <View className="rounded-full bg-[#F1ECFF] px-2 py-0.5">
            <Text className="font-sans-b text-[11px] text-purple">{videos.length} video</Text>
          </View>
        ) : null}
        <ChevronRightIcon size={16} color={c.inkMute} strokeWidth={2.6} />
      </AnalyticsRegion>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ gap: 10, paddingLeft: 20, paddingRight: 20 }}
      >
        {replies.map((r) => {
          const p = personById(r.authorId);
          // Pale lavender video chip needs always-dark type in both themes.
          const onPale = r.kind === 'circleVideo';
          return (
            <Pressable
              key={r.id}
              onPress={withAnalyticsPress(HOME.responses.response, onOpen)}
              accessibilityRole="button"
              accessibilityLabel={`Reply from ${p.name}`}
              className={cn(
                'w-[152px] flex-row items-center gap-2.5 rounded-card border border-ink-line bg-surface p-2.5 active:opacity-90',
                onPale && 'border-purple/40 bg-[#F7F3FF]'
              )}
            >
              <View className="relative shrink-0">
                {/* Real profile photo when one is dropped in for this person */}
                <PersonAvatar id={p.id} size="sm" />
                {onPale ? (
                  <View className="absolute -bottom-0.5 -right-0.5 h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-purple">
                    <PlayIcon size={8} color="#FFFFFF" fill="#FFFFFF" strokeWidth={3} />
                  </View>
                ) : null}
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className={cn(
                    'font-sans-b text-[12px]',
                    onPale ? 'text-onaccent' : 'text-ink'
                  )}
                  numberOfLines={1}
                >
                  {p.name.split(' ')[0]}
                </Text>
                <Text
                  className={cn(
                    'font-sans-sb text-[11px]',
                    onPale ? 'text-onaccent/70' : 'text-ink-mute'
                  )}
                  numberOfLines={1}
                >
                  {r.kind === 'circleVideo'
                    ? 'Sent a video'
                    : r.kind === 'sticker'
                      ? `Reacted ${r.stickerId ?? ''}`
                      : r.text}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
