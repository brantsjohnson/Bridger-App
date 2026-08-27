// ============================================
// WHAT THIS FILE DOES (plain English):
// Who you are today: a 2-up grid of squares (Reading…, Building…, …). Top 4
// show; a pill CTA under them expands the rest. Empty squares fall back to
// an emoji. Listening squares can show artwork + a preview play control.
// ============================================
import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { MusicPlayable, ObsessionSquare } from '@bridger/shared';
import { PROFILE } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import { MusicTrackActions } from '../music/MusicTrackActions';
import {
  getPlayingPreviewUrl,
  subscribeMusicPreview,
  toggleMusicPreview
} from '../../lib/music-preview';
import { trackProduct } from '@bridger/shared';
import {
  PROFILE_GRID_GAP,
  PROFILE_META_GAP,
  PROFILE_SECTION_TITLE_SIZE,
  PROFILE_SEE_ALL_SIZE,
  PROFILE_TITLE_TO_BODY
} from './profileSpacing';

function isListening(item: ObsessionSquare): boolean {
  return /^listening/i.test(String(item.prompt));
}

export function CurrentObsessionSection({
  items,
  editable,
  onAdd,
  onPressSquare
}: {
  items: ObsessionSquare[];
  editable?: boolean;
  onAdd?: () => void;
  onPressSquare?: (item: ObsessionSquare) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(getPlayingPreviewUrl());
  const [sheetTrack, setSheetTrack] = useState<MusicPlayable | null>(null);
  const ordered = [...items].sort((a, b) => a.order - b.order);
  const visible = expanded ? ordered : ordered.slice(0, 4);
  const hasMore = ordered.length > 4;

  useEffect(() => subscribeMusicPreview(setPlayingUrl), []);

  return (
    <View>
      <AnalyticsRegion analyticsId={PROFILE.card.obsession} interactive={false}>
        <Text
          className="font-pixel text-ink"
          style={{ fontSize: PROFILE_SECTION_TITLE_SIZE }}
        >
          Current Obsession
        </Text>
      </AnalyticsRegion>

      <View
        className="flex-row flex-wrap"
        style={{ marginTop: PROFILE_TITLE_TO_BODY, gap: PROFILE_GRID_GAP }}
      >
        {visible.length === 0 ? (
          editable ? (
            <Pressable
              onPress={withAnalyticsPress(PROFILE.card.add_module, () => onAdd?.())}
              accessibilityRole="button"
              accessibilityLabel="Add Current Obsession"
              className="min-h-[120px] w-full items-center justify-center rounded-card border border-dashed border-ink-line"
              style={{ width: '100%' }}
            >
              <Text className="font-sans-b text-[14px] text-ink">Who are you today?</Text>
            </Pressable>
          ) : (
            <Text className="font-sans-sb text-[14px] text-ink-mute">Nothing right now.</Text>
          )
        ) : (
          visible.map((item) => {
            const music = item.music;
            const listening = isListening(item);
            const previewUrl = music?.previewUrl ?? null;
            const playing = !!previewUrl && playingUrl === previewUrl;

            return (
              <Pressable
                key={item.id}
                onPress={
                  editable
                    ? withAnalyticsPress(PROFILE.card.obsession_square, () =>
                        onPressSquare?.(item)
                      )
                    : withAnalyticsPress(PROFILE.card.obsession_square, () => {
                        if (listening && music) setSheetTrack(music);
                      })
                }
                accessibilityRole="button"
                accessibilityLabel={`${item.prompt} ${item.text ?? ''}`}
                className="overflow-hidden rounded-card border border-ink-line bg-canvas"
                style={{ width: '47.5%', aspectRatio: 1 }}
              >
                <View className="flex-1 items-center justify-center bg-purple/10 px-2">
                  {music?.artworkUrl ? (
                    <Image
                      source={{ uri: music.artworkUrl }}
                      className="absolute inset-0 h-full w-full"
                      accessibilityIgnoresInvertColors
                    />
                  ) : (
                    <Text className="text-[36px]">{item.emoji ?? '✨'}</Text>
                  )}
                  {/* THIS SECTION DOES: play overlay for Listening previews. */}
                  {listening && (previewUrl || music?.spotifyId) ? (
                    <Pressable
                      onPress={withAnalyticsPress(PROFILE.music.preview_play, () => {
                        if (previewUrl) {
                          void toggleMusicPreview(previewUrl).then((on) => {
                            if (on) trackProduct('music_preview_played', { method: 'tap' });
                          });
                        } else if (music) {
                          setSheetTrack(music);
                        }
                      })}
                      accessibilityRole="button"
                      accessibilityLabel={
                        playing
                          ? `Pause preview of ${music?.title ?? item.text}`
                          : `Play preview of ${music?.title ?? item.text}`
                      }
                      hitSlop={8}
                      className="absolute bottom-2 right-2 z-10 h-11 w-11 items-center justify-center rounded-full bg-ink/80"
                    >
                      <Text className="text-[16px] text-white">{playing ? '❚❚' : '▶'}</Text>
                    </Pressable>
                  ) : null}
                </View>
                <View className="px-2.5 py-2" style={{ gap: PROFILE_META_GAP }}>
                  <Text numberOfLines={1} className="font-sans-b text-[12px] text-ink-mute">
                    {item.prompt}
                  </Text>
                  <Text numberOfLines={2} className="font-sans-b text-[14px] text-ink">
                    {item.text || music?.title || '…'}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      {/* THIS SECTION DOES: pill under the four titles so See all is easy to tap. */}
      {hasMore ? (
        <View className="mt-3 items-center">
          <Pressable
            onPress={withAnalyticsPress(PROFILE.card.see_all, () => setExpanded((e) => !e))}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Show fewer obsessions' : 'See all obsessions'}
            className="min-h-[36px] items-center justify-center rounded-full border border-ink-line bg-canvas px-5 active:opacity-90"
          >
            <Text
              className="font-sans-b text-ink"
              style={{ fontSize: PROFILE_SEE_ALL_SIZE }}
            >
              {expanded ? 'Show less' : 'See all'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <MusicTrackActions
        track={sheetTrack}
        visible={!!sheetTrack}
        onClose={() => setSheetTrack(null)}
      />
    </View>
  );
}
