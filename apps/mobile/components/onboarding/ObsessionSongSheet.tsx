// ============================================
// WHAT THIS FILE DOES (plain English):
// After Spotify (or Apple Music) connects on the Obsession step, this sheet
// pops up so you can search for the song on repeat and tap one. Typing the
// song by hand stays available on the screen behind it.
//
// PRIVACY: search query text is never sent to analytics. We only store the
// catalog pick (ids + title fields) when you tap a result.
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
import type { MusicCatalogItem } from '@bridger/shared';
import { ONBOARDING, trackProduct } from '@bridger/shared';
import { Sheet, withAnalyticsPress } from '@bridger/ui';
import { searchMusic, upsertMusicPick } from '../../data/music';
import { OB, OB_BORDER } from '../onboarding/onboarding-theme';

export function ObsessionSongSheet({
  open,
  onClose,
  onPick
}: {
  open: boolean;
  onClose: () => void;
  /** Called with a plain "Title, Artist" line for the onboarding draft. */
  onPick: (label: string, item: MusicCatalogItem) => void;
}) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [results, setResults] = useState<MusicCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // THIS SECTION DOES: ask Nest for tracks. Never log what they typed.
  const runSearch = async () => {
    const query = q.trim();
    if (query.length < 1) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await searchMusic(query, 'track');
      setResults(rows);
    } catch {
      setError('Search failed. Try again in a moment.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // THIS SECTION DOES: save Listening + fill the onboarding song line.
  const choose = async (item: MusicCatalogItem) => {
    setSavingId(item.spotifyId);
    setError(null);
    const label = `${item.title}, ${item.artistName}`;
    try {
      await upsertMusicPick({
        kind: 'listening_now',
        spotifyId: item.spotifyId,
        spotifyUri: item.spotifyUri,
        title: item.title,
        artistName: item.artistName,
        albumName: item.albumName,
        artworkUrl: item.artworkUrl,
        previewUrl: item.previewUrl,
        isrc: item.isrc
      });
      trackProduct('music_pick_saved', { method: 'listening_now' });
      onPick(label, item);
      setQ('');
      setResults([]);
      onClose();
    } catch {
      setError('Could not save that song. Try again.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Pick the song on repeat"
      surface="onboarding_song_search_sheet"
      parentScreen="onboarding"
      dismissAnalyticsId={ONBOARDING.taste.song_search_cancel}
    >
      <View style={{ gap: 12, maxHeight: 440 }}>
        <Text className="font-sans-sb text-[13px]" style={{ color: OB.inkSoft, lineHeight: 18 }}>
          Search Spotify, then tap a track. We will put it on your profile as Listening.
        </Text>

        {/* SEARCH: type + Search button. Query text never goes to analytics. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Song or artist"
            placeholderTextColor="rgba(0,0,0,0.35)"
            onSubmitEditing={() => void runSearch()}
            returnKeyType="search"
            accessibilityLabel="Search for a song"
            style={{
              flex: 1,
              minHeight: 48,
              paddingHorizontal: 14,
              paddingVertical: 12,
              backgroundColor: OB.paper,
              borderWidth: OB_BORDER,
              borderColor: OB.navy,
              color: OB.navy,
              fontSize: 15
            }}
          />
          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.taste.song_search, () => void runSearch())}
            disabled={loading || q.trim().length < 1}
            accessibilityRole="button"
            accessibilityLabel="Search Spotify"
            style={{
              minHeight: 48,
              paddingHorizontal: 16,
              justifyContent: 'center',
              backgroundColor: OB.pink,
              borderWidth: OB_BORDER,
              borderColor: OB.navy,
              opacity: loading || q.trim().length < 1 ? 0.55 : 1
            }}
          >
            <Text className="font-sans-b text-[14px]" style={{ color: OB.onColor }}>
              {loading ? '…' : 'Search'}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <Text className="font-sans-sb text-[13px]" style={{ color: OB.orange }}>
            {error}
          </Text>
        ) : null}
        {loading ? <ActivityIndicator color={OB.navy} /> : null}

        <FlatList
          data={results}
          keyExtractor={(item) => item.spotifyId}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 280 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={withAnalyticsPress(ONBOARDING.taste.song_result, () => void choose(item))}
              disabled={savingId === item.spotifyId}
              accessibilityRole="button"
              accessibilityLabel={`Choose ${item.title} by ${item.artistName}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: OB.borderMuted
              }}
            >
              <View
                accessible={false}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: OB.periwinkle
                }}
              >
                <Text style={{ fontSize: 18 }}>💿</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  className="font-sans-b text-[15px]"
                  style={{ color: OB.navy }}
                >
                  {item.title}
                </Text>
                <Text
                  numberOfLines={1}
                  className="font-sans-sb text-[12px]"
                  style={{ color: OB.inkSoft }}
                >
                  {item.artistName}
                </Text>
              </View>
              <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
                {savingId === item.spotifyId ? '…' : 'Pick'}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading && q.trim().length > 0 && results.length === 0 && !error ? (
              <Text
                className="font-sans-sb text-[13px]"
                style={{ color: OB.inkSoft, textAlign: 'center', paddingVertical: 24 }}
              >
                No tracks yet. Try another search.
              </Text>
            ) : null
          }
        />
      </View>
    </Sheet>
  );
}
