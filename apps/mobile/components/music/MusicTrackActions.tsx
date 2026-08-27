// ============================================
// WHAT THIS FILE DOES (plain English):
// A small sheet for one song: play the ~30s preview, save it to your Spotify
// library (if connected), or open it in Spotify / Apple Music.
// ACCESSIBILITY: every action has a clear label. Analytics never logs titles.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, Text, View } from 'react-native';
import type { MusicPlayable } from '@bridger/shared';
import { PROFILE, trackProduct } from '@bridger/shared';
import { AnalyticsRegion, ButtonPrimary, ButtonSecondary } from '@bridger/ui';
import {
  fetchMusicStatus,
  saveTrackToSpotifyLibrary
} from '../../data/music';
import {
  getPlayingPreviewUrl,
  stopMusicPreview,
  subscribeMusicPreview,
  toggleMusicPreview
} from '../../lib/music-preview';

export function MusicTrackActions({
  track,
  visible,
  onClose
}: {
  track: MusicPlayable | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [playingUrl, setPlayingUrl] = useState<string | null>(getPlayingPreviewUrl());
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeMusicPreview(setPlayingUrl), []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void fetchMusicStatus().then((s) => {
      if (!cancelled) setSpotifyConnected(s.spotify);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) stopMusicPreview();
  }, [visible]);

  if (!track) return null;

  const previewUrl = track.previewUrl ?? null;
  const isPlaying = !!previewUrl && playingUrl === previewUrl;
  const label = `${track.title} by ${track.artistName}`;

  const onPreview = async () => {
    if (!previewUrl) {
      Alert.alert('No preview', 'Spotify did not provide a short preview for this track.');
      return;
    }
    const playing = await toggleMusicPreview(previewUrl);
    if (playing) {
      trackProduct('music_preview_played', { method: 'tap' });
    }
  };

  const openSpotify = async () => {
    const uri = track.spotifyUri ?? (track.spotifyId ? `spotify:track:${track.spotifyId}` : null);
    const web = track.spotifyId
      ? `https://open.spotify.com/track/${track.spotifyId}`
      : null;
    if (uri) {
      const can = await Linking.canOpenURL(uri);
      if (can) {
        await Linking.openURL(uri);
        onClose();
        return;
      }
    }
    if (web) {
      await Linking.openURL(web);
      onClose();
      return;
    }
    Alert.alert('Unavailable', 'No Spotify link for this track.');
  };

  const openApple = async () => {
    if (track.appleMusicId) {
      await Linking.openURL(`https://music.apple.com/song/${track.appleMusicId}`);
      onClose();
      return;
    }
    const q = encodeURIComponent(`${track.title} ${track.artistName}`);
    await Linking.openURL(`https://music.apple.com/search?term=${q}`);
    onClose();
  };

  const addToLibrary = async () => {
    if (!spotifyConnected) {
      Alert.alert('Connect Spotify', 'Link Spotify in Settings to save songs to your library.');
      return;
    }
    if (!track.spotifyId) {
      Alert.alert('Unavailable', 'This track has no Spotify id to save.');
      return;
    }
    setSaving(true);
    try {
      await saveTrackToSpotifyLibrary(track.spotifyId);
      trackProduct('music_saved_to_library', { method: 'spotify' });
      Alert.alert('Saved', 'Added to your Spotify Liked Songs.');
      onClose();
    } catch {
      Alert.alert('Could not save', 'Try again, or reconnect Spotify in Settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss song actions"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl border border-ink-line bg-canvas px-4 pb-10 pt-4"
        >
          <AnalyticsRegion analyticsId={PROFILE.music.actions_sheet} interactive={false}>
            <Text className="font-sans-b text-[16px] text-ink" numberOfLines={2}>
              {track.title}
            </Text>
            <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-mute" numberOfLines={1}>
              {track.artistName}
            </Text>
          </AnalyticsRegion>

          <View className="mt-4 gap-2.5">
            <ButtonPrimary
              full
              analyticsId={
                isPlaying ? PROFILE.music.preview_pause : PROFILE.music.preview_play
              }
              onPress={() => void onPreview()}
              disabled={!previewUrl}
              accessibilityLabel={
                isPlaying ? `Pause preview of ${label}` : `Play preview of ${label}`
              }
            >
              {isPlaying ? 'Pause preview' : 'Play preview'}
            </ButtonPrimary>
            <ButtonSecondary
              full
              analyticsId={PROFILE.music.open_spotify}
              onPress={() => void openSpotify()}
              accessibilityLabel={`Open ${label} in Spotify`}
            >
              Open in Spotify
            </ButtonSecondary>
            <ButtonSecondary
              full
              analyticsId={PROFILE.music.open_apple_music}
              onPress={() => void openApple()}
              accessibilityLabel={`Open ${label} in Apple Music`}
            >
              Open in Apple Music
            </ButtonSecondary>
            <ButtonSecondary
              full
              analyticsId={PROFILE.music.add_playlist}
              onPress={() => void addToLibrary()}
              disabled={saving || !track.spotifyId}
              loading={saving}
              accessibilityLabel={`Add ${label} to my Spotify library`}
            >
              Add to my Spotify
            </ButtonSecondary>
            <ButtonSecondary
              full
              analyticsId={PROFILE.music.actions_dismiss}
              onPress={onClose}
              accessibilityLabel="Close"
            >
              Close
            </ButtonSecondary>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
