// ============================================
// WHAT THIS FILE DOES (plain English):
// Shapes for linked music accounts (Spotify and Apple Music) and the
// catalog picks people show on their profile (Listening, song of the week…).
// Tokens never appear here. Only public catalog fields cross to the client.
// ============================================
import type { Tier } from './tier';

/** Which music service is linked (not used for Bridger login). */
export type MusicProvider = 'spotify' | 'apple_music';

/** Named slots for a person's music picks. */
export type MusicPickKind =
  | 'listening_now'
  | 'song_of_week'
  | 'fav_track'
  | 'fav_album'
  | 'fav_artist';

/** What /music/status returns (no secrets). */
export type MusicStatus = {
  spotify: boolean;
  appleMusic: boolean;
};

/** One searchable / playable catalog item from Spotify (or later Apple). */
export type MusicCatalogItem = {
  spotifyId: string;
  spotifyUri: string;
  title: string;
  artistName: string;
  albumName?: string;
  artworkUrl?: string | null;
  previewUrl?: string | null;
  isrc?: string | null;
  /** track | album | artist */
  type: 'track' | 'album' | 'artist';
};

/** A saved pick on someone's profile. */
export type MusicPick = {
  id: string;
  kind: MusicPickKind;
  spotifyId?: string | null;
  spotifyUri?: string | null;
  appleMusicId?: string | null;
  isrc?: string | null;
  title: string;
  artistName: string;
  albumName?: string | null;
  artworkUrl?: string | null;
  previewUrl?: string | null;
  visibleToTier: Tier;
  matchable: boolean;
};

/** Playable fields attached to a Listening obsession square or Catch-Up cell. */
export type MusicPlayable = {
  pickId?: string;
  spotifyId?: string | null;
  spotifyUri?: string | null;
  appleMusicId?: string | null;
  title: string;
  artistName: string;
  artworkUrl?: string | null;
  previewUrl?: string | null;
};

/** Body to upsert a pick from a catalog search result. */
export type UpsertMusicPickBody = {
  kind: MusicPickKind;
  spotifyId: string;
  spotifyUri: string;
  title: string;
  artistName: string;
  albumName?: string;
  artworkUrl?: string | null;
  previewUrl?: string | null;
  isrc?: string | null;
  visibleToTier?: Tier;
  matchable?: boolean;
};
