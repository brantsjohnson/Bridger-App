// ============================================
// WHAT THIS FILE DOES (plain English):
// Talks to the API about Spotify / Apple Music connect, track search, Listening
// picks, and "save to my Spotify library." Demo mode fakes a connected status
// so UI can be clicked through without real music keys.
// ============================================
import type {
  MusicCatalogItem,
  MusicPick,
  MusicStatus,
  UpsertMusicPickBody
} from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';

let demoStatus: MusicStatus = { spotify: false, appleMusic: false };
let demoPicks: MusicPick[] = [];

export async function fetchMusicStatus(): Promise<MusicStatus> {
  if (isDemoMode()) return { ...demoStatus };
  return apiFetch<MusicStatus>('/music/status');
}

/** Ask Nest for the Spotify authorize URL (account link, not Bridger login). */
export async function beginSpotifyConnect(): Promise<{ url: string }> {
  if (isDemoMode()) {
    demoStatus = { ...demoStatus, spotify: true };
    return { url: 'bridger://music/spotify/connected?ok=1&provider=spotify&demo=1' };
  }
  return apiFetch<{ url: string }>('/music/spotify/connect');
}

export async function disconnectSpotify(): Promise<void> {
  if (isDemoMode()) {
    demoStatus = { ...demoStatus, spotify: false };
    return;
  }
  await apiFetch('/music/spotify', { method: 'DELETE' });
}

/** Ask Nest for the Apple MusicKit authorize page URL. */
export async function beginAppleMusicConnect(): Promise<{ url: string }> {
  if (isDemoMode()) {
    demoStatus = { ...demoStatus, appleMusic: true };
    return { url: 'bridger://music/apple/connected?ok=1&provider=apple_music&demo=1' };
  }
  return apiFetch<{ url: string }>('/music/apple/connect');
}

export async function disconnectAppleMusic(): Promise<void> {
  if (isDemoMode()) {
    demoStatus = { ...demoStatus, appleMusic: false };
    return;
  }
  await apiFetch('/music/apple', { method: 'DELETE' });
}

export async function searchMusic(
  q: string,
  type: 'track' | 'album' | 'artist' = 'track'
): Promise<MusicCatalogItem[]> {
  if (isDemoMode()) {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    // Typed as MusicCatalogItem[] so `type: 'track'` stays a literal under TS 6.
    const demoHits: MusicCatalogItem[] = [
      {
        spotifyId: 'demo-track-1',
        spotifyUri: 'spotify:track:demo-track-1',
        title: 'Blue Rev',
        artistName: 'Alvvays',
        albumName: 'Blue Rev',
        artworkUrl: null,
        previewUrl: null,
        type: 'track'
      },
      {
        spotifyId: 'demo-track-2',
        spotifyUri: 'spotify:track:demo-track-2',
        title: 'Not Strong Enough',
        artistName: 'boygenius',
        albumName: 'the record',
        artworkUrl: null,
        previewUrl: null,
        type: 'track'
      }
    ];
    return demoHits.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.artistName.toLowerCase().includes(query)
    );
  }
  const params = new URLSearchParams({ q, type });
  return apiFetch<MusicCatalogItem[]>(`/music/search?${params}`);
}

export async function upsertMusicPick(body: UpsertMusicPickBody): Promise<MusicPick> {
  if (isDemoMode()) {
    const pick: MusicPick = {
      id: `demo-pick-${body.kind}`,
      kind: body.kind,
      spotifyId: body.spotifyId,
      spotifyUri: body.spotifyUri,
      title: body.title,
      artistName: body.artistName,
      albumName: body.albumName,
      artworkUrl: body.artworkUrl,
      previewUrl: body.previewUrl,
      isrc: body.isrc,
      visibleToTier: body.visibleToTier ?? 'friend',
      matchable: body.matchable ?? true
    };
    demoPicks = [pick, ...demoPicks.filter((p) => p.kind !== body.kind || body.kind.startsWith('fav'))];
    return pick;
  }
  return apiFetch<MusicPick>('/music/picks', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function fetchListeningNow(ownerId?: string): Promise<MusicPick | null> {
  if (isDemoMode()) {
    return demoPicks.find((p) => p.kind === 'listening_now') ?? null;
  }
  const q = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : '';
  return apiFetch<MusicPick | null>(`/music/listening${q}`);
}

export async function syncTopArtists(): Promise<{ count: number }> {
  if (isDemoMode()) return { count: 12 };
  return apiFetch<{ count: number }>('/music/sync-top-artists', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function saveTrackToSpotifyLibrary(spotifyId: string): Promise<void> {
  if (isDemoMode()) return;
  await apiFetch('/music/spotify/save', {
    method: 'POST',
    body: JSON.stringify({ spotifyId })
  });
}
