// ============================================
// WHAT THIS FILE DOES (plain English):
// Search Spotify for a track and save it as Listening / song of the week.
// Needs Spotify connect for personal search quality; falls back to app search.
// ACCESSIBILITY: search field + each result are labelled. Never log query text.
// ============================================
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import type { MusicCatalogItem, MusicPickKind } from '@bridger/shared';
import { PROFILE, trackProduct } from '@bridger/shared';
import { ButtonPrimary, withAnalyticsPress } from '@bridger/ui';
import { searchMusic, upsertMusicPick } from '../../data/music';

export function MusicTrackPicker({
  kind = 'listening_now',
  onSaved
}: {
  kind?: MusicPickKind;
  onSaved?: () => void;
}) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [results, setResults] = useState<MusicCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    const query = q.trim();
    if (query.length < 1) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await searchMusic(query, 'track');
      setResults(rows);
    } catch {
      setError('Search failed. Check Spotify connect or try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const save = async (item: MusicCatalogItem) => {
    setSavingId(item.spotifyId);
    try {
      await upsertMusicPick({
        kind,
        spotifyId: item.spotifyId,
        spotifyUri: item.spotifyUri,
        title: item.title,
        artistName: item.artistName,
        albumName: item.albumName,
        artworkUrl: item.artworkUrl,
        previewUrl: item.previewUrl,
        isrc: item.isrc
      });
      trackProduct('music_pick_saved', { method: kind });
      onSaved?.();
    } catch {
      setError('Could not save that pick. Try again.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <View className="flex-1 gap-3">
      <Text className="font-sans-sb text-[13px] text-ink-mute">
        Search Spotify for a track. Bridger stores the catalog link (not your password).
      </Text>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Song or artist"
          placeholderTextColor="#8A877B"
          onSubmitEditing={() => void runSearch()}
          returnKeyType="search"
          accessibilityLabel="Search for a song"
          className="min-h-[44px] flex-1 rounded-card border border-ink-line bg-surface px-3 font-sans text-[15px] text-ink"
        />
        <ButtonPrimary
          size="md"
          analyticsId={PROFILE.music.track_search}
          onPress={() => void runSearch()}
          loading={loading}
          accessibilityLabel="Search Spotify"
        >
          Search
        </ButtonPrimary>
      </View>
      {error ? (
        <Text className="font-sans-sb text-[13px] text-coral">{error}</Text>
      ) : null}
      {loading ? <ActivityIndicator /> : null}
      <FlatList
        data={results}
        keyExtractor={(item) => item.spotifyId}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={withAnalyticsPress(PROFILE.music.track_result, () => void save(item))}
            disabled={savingId === item.spotifyId}
            accessibilityRole="button"
            accessibilityLabel={`Save ${item.title} by ${item.artistName}`}
            className="flex-row items-center gap-3 border-b border-ink-line py-3 active:opacity-80"
          >
            <View className="h-12 w-12 items-center justify-center rounded-md bg-purple/15">
              <Text className="text-[20px]">💿</Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-sans-b text-[15px] text-ink">
                {item.title}
              </Text>
              <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
                {item.artistName}
                {item.previewUrl ? ' · preview' : ''}
              </Text>
            </View>
            <Text className="font-sans-b text-[13px] text-ink">
              {savingId === item.spotifyId ? '…' : 'Save'}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading && q.trim() ? (
            <Text className="py-6 text-center font-sans-sb text-[13px] text-ink-mute">
              No tracks yet. Try another search.
            </Text>
          ) : null
        }
      />
    </View>
  );
}
