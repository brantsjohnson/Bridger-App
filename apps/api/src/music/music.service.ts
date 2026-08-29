// ============================================
// WHAT THIS FILE DOES (plain English):
// Links a Bridger account to Spotify or Apple Music (not login), searches
// tracks, saves Listening / song-of-the-week picks, syncs top artists for
// "in common", and can add a track to the viewer's Spotify library. Tokens
// stay encrypted server-side. PRIVACY: never send tokens or track titles to
// analytics.
// ============================================
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type {
  Json,
  MusicCatalogItem,
  MusicPick,
  MusicPickKind,
  MusicProvider,
  MusicStatus,
  Tier,
  UpsertMusicPickBody
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import {
  loadAppleMusicPrivateKey,
  mintAppleMusicDeveloperToken
} from './apple-music-jwt';
import { decryptToken, encryptToken } from './token-crypto';

/** How many top artists we keep per provider (Spotify page size max is 50). */
const TOP_ARTISTS_LIMIT = 50;
const APP_APPLE_RETURN = 'bridger://music/apple/connected';

const SPOTIFY_SCOPES = [
  'user-top-read',
  'user-read-recently-played',
  'user-library-modify',
  'user-library-read',
  'playlist-modify-public',
  'playlist-modify-private'
].join(' ');

const APP_RETURN = 'bridger://music/spotify/connected';

@Injectable()
export class MusicService {
  private readonly log = new Logger(MusicService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService
  ) {}

  // THIS SECTION DOES: tell the app which music services are linked (no secrets).
  async status(userId: string): Promise<MusicStatus> {
    const { data } = await this.supabase.admin
      .from('music_connections')
      .select('provider')
      .eq('user_id', userId);
    const providers = new Set((data ?? []).map((r) => r.provider));
    return {
      spotify: providers.has('spotify'),
      appleMusic: providers.has('apple_music')
    };
  }

  // THIS SECTION DOES: start Spotify connect (account link, not Bridger login).
  async beginSpotifyConnect(userId: string): Promise<{ url: string }> {
    const clientId = this.requireClientId();
    const redirectUri = this.redirectUri();
    const state = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error } = await this.supabase.admin.from('music_oauth_states').insert({
      state,
      user_id: userId,
      provider: 'spotify',
      expires_at: expiresAt
    });
    if (error) throw error;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: SPOTIFY_SCOPES,
      state,
      show_dialog: 'true'
    });
    return { url: `https://accounts.spotify.com/authorize?${params}` };
  }

  // THIS SECTION DOES: finish Spotify OAuth, store encrypted tokens, sync taste.
  async handleSpotifyCallback(
    code: string | undefined,
    state: string | undefined,
    oauthError: string | undefined
  ): Promise<string> {
    if (oauthError) {
      return `${APP_RETURN}?ok=0&error=${encodeURIComponent(oauthError)}`;
    }
    if (!code || !state) {
      return `${APP_RETURN}?ok=0&error=missing_code`;
    }

    const { data: st, error: stErr } = await this.supabase.admin
      .from('music_oauth_states')
      .select('*')
      .eq('state', state)
      .maybeSingle();
    await this.supabase.admin.from('music_oauth_states').delete().eq('state', state);
    if (stErr || !st) {
      return `${APP_RETURN}?ok=0&error=bad_state`;
    }
    if (new Date(st.expires_at).getTime() < Date.now()) {
      return `${APP_RETURN}?ok=0&error=expired`;
    }

    try {
      const tokens = await this.exchangeCode(code);
      const encKey = this.tokenSecret();
      const me = await this.spotifyGet<{ id: string }>(
        'https://api.spotify.com/v1/me',
        tokens.access_token
      );

      const { error } = await this.supabase.admin.from('music_connections').upsert(
        {
          user_id: st.user_id,
          provider: 'spotify',
          refresh_token_enc: encryptToken(tokens.refresh_token, encKey),
          access_token_enc: encryptToken(tokens.access_token, encKey),
          access_expires_at: new Date(
            Date.now() + tokens.expires_in * 1000
          ).toISOString(),
          scopes: SPOTIFY_SCOPES.split(' '),
          provider_user_id: me.id,
          updated_at: new Date().toISOString(),
          connected_at: new Date().toISOString()
        },
        { onConflict: 'user_id,provider' }
      );
      if (error) throw error;

      // Pull top artists so reveal can show shared taste soon after connect.
      try {
        await this.syncTopArtists(st.user_id);
      } catch (e) {
        this.log.warn(`Top-artists sync after connect failed: ${String(e)}`);
      }

      return `${APP_RETURN}?ok=1&provider=spotify`;
    } catch (e) {
      this.log.error(`Spotify callback failed: ${String(e)}`);
      return `${APP_RETURN}?ok=0&error=token_exchange`;
    }
  }

  // THIS SECTION DOES: unlink Spotify and erase tokens + taste rows for that provider.
  async disconnectSpotify(userId: string): Promise<{ ok: true }> {
    await this.clearProviderTaste(userId, 'spotify');
    const { error } = await this.supabase.admin
      .from('music_connections')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'spotify');
    if (error) throw error;
    await this.rebuildArtistAttributes(userId);
    return { ok: true };
  }

  // THIS SECTION DOES: start Apple Music link (opens Nest page with MusicKit JS).
  async beginAppleConnect(userId: string): Promise<{ url: string }> {
    this.requireAppleMusicConfigured();
    const state = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error } = await this.supabase.admin.from('music_oauth_states').insert({
      state,
      user_id: userId,
      provider: 'apple_music',
      expires_at: expiresAt
    });
    if (error) throw error;
    return { url: `${this.apiPublicBase()}/music/apple/authorize?state=${encodeURIComponent(state)}` };
  }

  // THIS SECTION DOES: HTML page that asks Apple for a music-user-token (MusicKit).
  async appleAuthorizePageHtml(state: string | undefined): Promise<string> {
    if (!state) {
      return appleAuthorizeErrorHtml('missing_state');
    }
    const { data: st } = await this.supabase.admin
      .from('music_oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'apple_music')
      .maybeSingle();
    if (!st || new Date(st.expires_at).getTime() < Date.now()) {
      return appleAuthorizeErrorHtml('bad_or_expired_state');
    }
    try {
      const { token } = await this.mintDeveloperToken();
      const completeUrl = `${this.apiPublicBase()}/music/apple/complete`;
      return appleAuthorizeHtml({
        developerToken: token,
        state,
        completeUrl,
        appName: 'Bridger'
      });
    } catch (e) {
      this.log.error(`Apple authorize page failed: ${String(e)}`);
      return appleAuthorizeErrorHtml('misconfigured');
    }
  }

  // THIS SECTION DOES: store the music-user-token after MusicKit authorize succeeds.
  async completeAppleConnect(
    state: string | undefined,
    musicUserToken: string | undefined
  ): Promise<string> {
    if (!state || !musicUserToken?.trim()) {
      return `${APP_APPLE_RETURN}?ok=0&error=missing_token`;
    }
    const { data: st, error: stErr } = await this.supabase.admin
      .from('music_oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'apple_music')
      .maybeSingle();
    await this.supabase.admin.from('music_oauth_states').delete().eq('state', state);
    if (stErr || !st) {
      return `${APP_APPLE_RETURN}?ok=0&error=bad_state`;
    }
    if (new Date(st.expires_at).getTime() < Date.now()) {
      return `${APP_APPLE_RETURN}?ok=0&error=expired`;
    }

    try {
      const encKey = this.tokenSecret();
      // Apple's music-user-token is the durable credential (no Spotify-style refresh).
      const enc = encryptToken(musicUserToken.trim(), encKey);
      const { error } = await this.supabase.admin.from('music_connections').upsert(
        {
          user_id: st.user_id,
          provider: 'apple_music',
          refresh_token_enc: enc,
          access_token_enc: enc,
          access_expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          scopes: ['music_user_token'],
          provider_user_id: null,
          updated_at: new Date().toISOString(),
          connected_at: new Date().toISOString()
        },
        { onConflict: 'user_id,provider' }
      );
      if (error) throw error;

      try {
        await this.syncAppleTopArtists(st.user_id);
      } catch (e) {
        this.log.warn(`Apple taste sync after connect failed: ${String(e)}`);
      }

      return `${APP_APPLE_RETURN}?ok=1&provider=apple_music`;
    } catch (e) {
      this.log.error(`Apple complete failed: ${String(e)}`);
      return `${APP_APPLE_RETURN}?ok=0&error=store_failed`;
    }
  }

  // THIS SECTION DOES: unlink Apple Music and erase tokens + taste for that provider.
  async disconnectApple(userId: string): Promise<{ ok: true }> {
    await this.clearProviderTaste(userId, 'apple_music');
    const { error } = await this.supabase.admin
      .from('music_connections')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'apple_music');
    if (error) throw error;
    await this.rebuildArtistAttributes(userId);
    return { ok: true };
  }

  // THIS SECTION DOES: search Spotify catalog (uses user token if linked, else app token).
  async search(
    userId: string,
    q: string,
    type: 'track' | 'album' | 'artist' = 'track'
  ): Promise<MusicCatalogItem[]> {
    const query = q.trim();
    if (query.length < 1) return [];
    const token = await this.accessTokenForSearch(userId);
    const url =
      `https://api.spotify.com/v1/search?` +
      new URLSearchParams({
        q: query,
        type,
        limit: '15',
        market: 'from_token'
      });
    // Client-credentials tokens have no market — fall back without market.
    let data: SpotifySearchResponse;
    try {
      data = await this.spotifyGet<SpotifySearchResponse>(url, token);
    } catch {
      const fallback =
        `https://api.spotify.com/v1/search?` +
        new URLSearchParams({ q: query, type, limit: '15' });
      data = await this.spotifyGet<SpotifySearchResponse>(fallback, token);
    }
    return mapSearch(data, type);
  }

  // THIS SECTION DOES: save or replace a named pick (Listening, song of the week…).
  async upsertPick(userId: string, body: UpsertMusicPickBody): Promise<MusicPick> {
    const kind = body.kind;
    if (!kind || !body.spotifyId || !body.title) {
      throw new BadRequestException('kind, spotifyId, and title are required');
    }
    const tier = (body.visibleToTier ?? 'friend') as Tier;
    const row = {
      owner_id: userId,
      kind,
      spotify_id: body.spotifyId,
      spotify_uri: body.spotifyUri,
      title: body.title,
      artist_name: body.artistName ?? '',
      album_name: body.albumName ?? null,
      artwork_url: body.artworkUrl ?? null,
      preview_url: body.previewUrl ?? null,
      isrc: body.isrc ?? null,
      visible_to_tier: tier,
      matchable: body.matchable ?? true,
      updated_at: new Date().toISOString()
    };

    // Unique kinds (listening_now / song_of_week): replace existing.
    if (kind === 'listening_now' || kind === 'song_of_week') {
      await this.supabase.admin
        .from('music_picks')
        .delete()
        .eq('owner_id', userId)
        .eq('kind', kind);
    }

    const { data, error } = await this.supabase.admin
      .from('music_picks')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;

    // Keep the legacy currently_song attribute in sync for Catch-Up / stories.
    if (kind === 'listening_now') {
      await this.mirrorCurrentlySong(userId, data);
      await this.upsertMusicArtistAttribute(userId, data.artist_name, data.spotify_id, tier);
    }

    return mapPick(data);
  }

  async listPicks(userId: string, ownerId?: string): Promise<MusicPick[]> {
    const target = ownerId ?? userId;
    const { data, error } = await this.supabase.admin
      .from('music_picks')
      .select('*')
      .eq('owner_id', target)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    // Nest bypasses RLS — filter when viewing someone else.
    if (target !== userId) {
      const visible = await this.filterVisibleToViewer(userId, data ?? []);
      return visible.map(mapPick);
    }
    return (data ?? []).map(mapPick);
  }

  async getListeningNow(
    viewerId: string,
    ownerId: string
  ): Promise<MusicPick | null> {
    const { data } = await this.supabase.admin
      .from('music_picks')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('kind', 'listening_now')
      .maybeSingle();
    if (!data) return null;
    if (ownerId !== viewerId) {
      const ok = await this.canView(viewerId, ownerId, data.visible_to_tier);
      if (!ok) return null;
    }
    return mapPick(data);
  }

  // THIS SECTION DOES: refresh top artists from every linked music service.
  async syncTopArtists(userId: string): Promise<{ count: number }> {
    const status = await this.status(userId);
    let count = 0;
    if (status.spotify) {
      count += (await this.syncSpotifyTopArtists(userId)).count;
    }
    if (status.appleMusic) {
      count += (await this.syncAppleTopArtists(userId)).count;
    }
    if (!status.spotify && !status.appleMusic) {
      throw new NotFoundException('Connect Spotify or Apple Music first');
    }
    await this.rebuildArtistAttributes(userId);
    return { count };
  }

  // THIS SECTION DOES: pull Spotify's ranked top artists (up to TOP_ARTISTS_LIMIT).
  async syncSpotifyTopArtists(userId: string): Promise<{ count: number }> {
    const token = await this.userAccessToken(userId);
    const artists: Array<{
      id: string;
      name: string;
      images?: Array<{ url: string }>;
    }> = [];

    // Spotify caps each page at 50; we page until we hit our limit.
    for (let offset = 0; offset < TOP_ARTISTS_LIMIT; offset += 50) {
      const pageSize = Math.min(50, TOP_ARTISTS_LIMIT - offset);
      const data = await this.spotifyGet<{
        items: Array<{
          id: string;
          name: string;
          images?: Array<{ url: string }>;
        }>;
      }>(
        `https://api.spotify.com/v1/me/top/artists?limit=${pageSize}&offset=${offset}&time_range=medium_term`,
        token
      );
      const batch = data.items ?? [];
      artists.push(...batch);
      if (batch.length < pageSize) break;
    }

    await this.clearProviderTaste(userId, 'spotify');

    const rows = artists.slice(0, TOP_ARTISTS_LIMIT).map((a, i) => ({
      owner_id: userId,
      provider: 'spotify' as const,
      artist_id: a.id,
      artist_name: a.name,
      rank: i + 1,
      artwork_url: a.images?.[0]?.url ?? null,
      visible_to_tier: 'friend' as const,
      matchable: true,
      synced_at: new Date().toISOString()
    }));
    if (rows.length) {
      const { error } = await this.supabase.admin.from('music_taste_artists').insert(rows);
      if (error) throw error;
    }
    return { count: rows.length };
  }

  // THIS SECTION DOES: build a ranked artist list from Apple heavy rotation + recent plays.
  async syncAppleTopArtists(userId: string): Promise<{ count: number }> {
    const musicUserToken = await this.appleMusicUserToken(userId);
    const developerToken = (await this.mintDeveloperToken()).token;

    type TasteHit = { id: string; name: string; artworkUrl: string | null; score: number };
    const byId = new Map<string, TasteHit>();

    const bump = (id: string, name: string, artworkUrl: string | null, weight: number) => {
      if (!id || !name) return;
      const prev = byId.get(id);
      if (prev) {
        prev.score += weight;
        if (!prev.artworkUrl && artworkUrl) prev.artworkUrl = artworkUrl;
      } else {
        byId.set(id, { id, name, artworkUrl, score: weight });
      }
    };

    // Heavy rotation: albums / playlists you play a lot (strong taste signal).
    try {
      const heavy = await this.appleGet<{
        data?: Array<{
          type?: string;
          id?: string;
          attributes?: {
            name?: string;
            artwork?: { url?: string };
          };
          relationships?: {
            artists?: {
              data?: Array<{ id: string; type: string }>;
            };
          };
        }>;
      }>('/v1/me/history/heavy-rotation?limit=30', developerToken, musicUserToken);

      for (const item of heavy.data ?? []) {
        const artwork = item.attributes?.artwork?.url
          ? item.attributes.artwork.url.replace('{w}', '200').replace('{h}', '200')
          : null;
        const artistName =
          (item.attributes as { artistName?: string } | undefined)?.artistName ??
          item.attributes?.name;
        const related = item.relationships?.artists?.data ?? [];
        if (related.length && artistName) {
          // Prefer catalog artist ids when Apple includes the relationship.
          for (const a of related) {
            bump(a.id, artistName, artwork, 5);
          }
        } else if (item.type === 'artists' && item.id && item.attributes?.name) {
          bump(item.id, item.attributes.name, artwork, 5);
        } else if (artistName) {
          bump(`name:${artistName.toLowerCase()}`, artistName, artwork, 3);
        }
      }
    } catch (e) {
      this.log.warn(`Apple heavy-rotation failed: ${String(e)}`);
    }

    // Recently played tracks: count artists by how often they show up.
    for (let offset = 0; offset < 90; offset += 30) {
      try {
        const recent = await this.appleGet<{
          data?: Array<{
            id?: string;
            attributes?: {
              name?: string;
              artistName?: string;
              artwork?: { url?: string };
            };
            relationships?: {
              artists?: { data?: Array<{ id: string }> };
            };
          }>;
        }>(
          `/v1/me/recent/played/tracks?limit=30&offset=${offset}`,
          developerToken,
          musicUserToken
        );
        const batch = recent.data ?? [];
        for (const t of batch) {
          const artwork = t.attributes?.artwork?.url
            ? t.attributes.artwork.url.replace('{w}', '200').replace('{h}', '200')
            : null;
          const artists = t.relationships?.artists?.data ?? [];
          if (artists.length) {
            for (const a of artists) {
              bump(a.id, t.attributes?.artistName ?? a.id, artwork, 1);
            }
          } else if (t.attributes?.artistName) {
            const name = t.attributes.artistName.split(',')[0]?.trim() ?? t.attributes.artistName;
            bump(`name:${name.toLowerCase()}`, name, artwork, 1);
          }
        }
        if (batch.length < 30) break;
      } catch (e) {
        this.log.warn(`Apple recent tracks page failed: ${String(e)}`);
        break;
      }
    }

    // Library artists fill gaps when history endpoints are thin.
    if (byId.size < TOP_ARTISTS_LIMIT) {
      try {
        const lib = await this.appleGet<{
          data?: Array<{
            id?: string;
            attributes?: { name?: string; artwork?: { url?: string } };
          }>;
        }>('/v1/me/library/artists?limit=50', developerToken, musicUserToken);
        for (const a of lib.data ?? []) {
          if (!a.id || !a.attributes?.name) continue;
          const artwork = a.attributes.artwork?.url
            ? a.attributes.artwork.url.replace('{w}', '200').replace('{h}', '200')
            : null;
          bump(a.id, a.attributes.name, artwork, 0.5);
        }
      } catch (e) {
        this.log.warn(`Apple library artists failed: ${String(e)}`);
      }
    }

    const ranked = [...byId.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_ARTISTS_LIMIT);

    await this.clearProviderTaste(userId, 'apple_music');

    const rows = ranked.map((a, i) => ({
      owner_id: userId,
      provider: 'apple_music' as const,
      artist_id: a.id,
      artist_name: a.name,
      rank: i + 1,
      artwork_url: a.artworkUrl,
      visible_to_tier: 'friend' as const,
      matchable: true,
      synced_at: new Date().toISOString()
    }));
    if (rows.length) {
      const { error } = await this.supabase.admin.from('music_taste_artists').insert(rows);
      if (error) throw error;
    }
    return { count: rows.length };
  }

  async topArtists(userId: string): Promise<
    Array<{
      artistId: string;
      artistName: string;
      artworkUrl?: string | null;
      rank?: number | null;
      provider: MusicProvider;
    }>
  > {
    const { data, error } = await this.supabase.admin
      .from('music_taste_artists')
      .select('artist_id, artist_name, artwork_url, rank, provider')
      .eq('owner_id', userId)
      .order('rank', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      artistId: r.artist_id,
      artistName: r.artist_name,
      artworkUrl: r.artwork_url,
      rank: r.rank,
      provider: r.provider as MusicProvider
    }));
  }

  // THIS SECTION DOES: save a track to the viewer's Spotify Liked Songs.
  async saveToLibrary(
    userId: string,
    body: { spotifyId: string; playlistId?: string }
  ): Promise<{ ok: true }> {
    if (!body.spotifyId) throw new BadRequestException('spotifyId required');
    const token = await this.userAccessToken(userId);
    if (body.playlistId) {
      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${body.playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: [`spotify:track:${body.spotifyId}`] })
        }
      );
      if (!res.ok) {
        throw new BadRequestException(`Spotify playlist add failed (${res.status})`);
      }
    } else {
      const res = await fetch(
        `https://api.spotify.com/v1/me/tracks?ids=${encodeURIComponent(body.spotifyId)}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!res.ok) {
        throw new BadRequestException(`Spotify library save failed (${res.status})`);
      }
    }
    return { ok: true };
  }

  // --- helpers -------------------------------------------------------------

  private requireClientId(): string {
    const id = this.config.get<string>('SPOTIFY_CLIENT_ID');
    if (!id) {
      throw new ServiceUnavailableException('Spotify is not configured (SPOTIFY_CLIENT_ID)');
    }
    return id;
  }

  private requireClientSecret(): string {
    const s = this.config.get<string>('SPOTIFY_CLIENT_SECRET');
    if (!s) {
      throw new ServiceUnavailableException('Spotify is not configured (SPOTIFY_CLIENT_SECRET)');
    }
    return s;
  }

  private redirectUri(): string {
    // THIS SECTION DOES: pick a redirect Spotify can open on a real phone.
    // Never send the phone to 127.0.0.1 / localhost (that is this laptop, not
    // the phone). Prefer an explicit public URI, then API_PUBLIC_URL.
    const configured = this.config.get<string>('SPOTIFY_REDIRECT_URI')?.trim();
    if (configured && !this.isLoopbackHttpUrl(configured)) {
      return configured;
    }
    const publicBase = this.config.get<string>('API_PUBLIC_URL')?.trim().replace(/\/$/, '');
    if (publicBase && !this.isLoopbackHttpUrl(publicBase)) {
      if (configured && this.isLoopbackHttpUrl(configured)) {
        this.log.warn(
          'SPOTIFY_REDIRECT_URI is loopback; using API_PUBLIC_URL/music/spotify/callback so phones can finish OAuth.'
        );
      }
      return `${publicBase}/music/spotify/callback`;
    }
    if (configured) {
      this.log.warn(
        'SPOTIFY_REDIRECT_URI is loopback and API_PUBLIC_URL is missing. Spotify Agree will fail on a physical phone.'
      );
      return configured;
    }
    return 'http://127.0.0.1:3000/music/spotify/callback';
  }

  /** True when the URL points at this machine (useless as a phone redirect). */
  private isLoopbackHttpUrl(url: string): boolean {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host === '127.0.0.1' || host === 'localhost' || host === '::1';
    } catch {
      return false;
    }
  }

  private tokenSecret(): string {
    const key =
      this.config.get<string>('MUSIC_TOKEN_ENCRYPTION_KEY') ??
      this.config.get<string>('EMAIL_ENCRYPTION_KEY');
    if (!key) {
      throw new ServiceUnavailableException(
        'Set MUSIC_TOKEN_ENCRYPTION_KEY (or EMAIL_ENCRYPTION_KEY) to store Spotify tokens'
      );
    }
    return key;
  }

  private async exchangeCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri()
    });
    const basic = Buffer.from(
      `${this.requireClientId()}:${this.requireClientSecret()}`
    ).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });
    if (!res.ok) {
      throw new Error(`token exchange ${res.status}`);
    }
    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    if (!json.refresh_token) {
      throw new Error('Spotify did not return a refresh token');
    }
    return {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_in: json.expires_in
    };
  }

  private async clientCredentialsToken(): Promise<string> {
    const basic = Buffer.from(
      `${this.requireClientId()}:${this.requireClientSecret()}`
    ).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }).toString()
    });
    if (!res.ok) throw new Error(`client_credentials ${res.status}`);
    const json = (await res.json()) as { access_token: string };
    return json.access_token;
  }

  private async accessTokenForSearch(userId: string): Promise<string> {
    try {
      return await this.userAccessToken(userId);
    } catch {
      return this.clientCredentialsToken();
    }
  }

  private async userAccessToken(userId: string): Promise<string> {
    const { data, error } = await this.supabase.admin
      .from('music_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'spotify')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Connect Spotify first');

    const encKey = this.tokenSecret();
    const expires = data.access_expires_at
      ? new Date(data.access_expires_at).getTime()
      : 0;
    if (data.access_token_enc && expires > Date.now() + 60_000) {
      return decryptToken(data.access_token_enc, encKey);
    }

    const refresh = decryptToken(data.refresh_token_enc, encKey);
    const basic = Buffer.from(
      `${this.requireClientId()}:${this.requireClientSecret()}`
    ).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh
      }).toString()
    });
    if (!res.ok) {
      throw new BadRequestException('Spotify session expired. Reconnect Spotify.');
    }
    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    await this.supabase.admin
      .from('music_connections')
      .update({
        access_token_enc: encryptToken(json.access_token, encKey),
        access_expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        ...(json.refresh_token
          ? { refresh_token_enc: encryptToken(json.refresh_token, encKey) }
          : {})
      })
      .eq('user_id', userId)
      .eq('provider', 'spotify');
    return json.access_token;
  }

  private async spotifyGet<T>(url: string, accessToken: string): Promise<T> {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      throw new BadRequestException(`Spotify request failed (${res.status})`);
    }
    return (await res.json()) as T;
  }

  private async mirrorCurrentlySong(
    userId: string,
    pick: {
      title: string;
      artist_name: string;
      artwork_url: string | null;
      preview_url: string | null;
      spotify_id: string | null;
      spotify_uri: string | null;
      id: string;
    }
  ) {
    await this.supabase.admin
      .from('attributes')
      .delete()
      .eq('owner_id', userId)
      .eq('key', 'currently_song');
    await this.supabase.admin.from('attributes').insert({
      owner_id: userId,
      key: 'currently_song',
      value: {
        title: pick.title,
        artist: pick.artist_name,
        artworkUrl: pick.artwork_url,
        previewUrl: pick.preview_url,
        spotifyId: pick.spotify_id,
        spotifyUri: pick.spotify_uri,
        pickId: pick.id
      } as unknown as Json,
      layer: 'profile' as const,
      visible_to_tier: 'friend' as const,
      matchable: true
    });
  }

  private async upsertMusicArtistAttribute(
    userId: string,
    artistName: string,
    spotifyTrackId: string | null,
    tier: Tier
  ) {
    if (!artistName) return;
    // Prefer a stable id when we only have a track; store by name slug as fallback.
    const slug = artistName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64);
    const key = `music.artist.pick.${slug || spotifyTrackId || 'unknown'}`;
    await this.supabase.admin.from('attributes').delete().eq('owner_id', userId).eq('key', key);
    await this.supabase.admin.from('attributes').insert({
      owner_id: userId,
      key,
      value: { label: artistName, from: 'listening_now' } as unknown as Json,
      layer: 'profile' as const,
      visible_to_tier: tier,
      matchable: true
    });
  }

  private async canView(
    viewerId: string,
    ownerId: string,
    visibleToTier: string
  ): Promise<boolean> {
    // Nest uses the service role, so can_view(auth.uid()) cannot help. Mirror it.
    if (viewerId === ownerId) return true;
    if (visibleToTier === 'none') return false;

    const { data: blocked } = await this.supabase.admin
      .from('blocks')
      .select('blocker_id')
      .or(
        `and(blocker_id.eq.${ownerId},blocked_id.eq.${viewerId}),and(blocker_id.eq.${viewerId},blocked_id.eq.${ownerId})`
      )
      .limit(1);
    if (blocked?.length) return false;

    const need = TIER_RANK[visibleToTier] ?? 99;
    if (need >= 99) return false;
    const { data: tierRow } = await this.supabase.admin
      .from('tiers')
      .select('tier')
      .eq('user_id', ownerId)
      .eq('other_id', viewerId)
      .maybeSingle();
    const granted = TIER_RANK[tierRow?.tier ?? ''] ?? 0;
    return granted > 0 && granted <= need;
  }

  private async filterVisibleToViewer<
    T extends { owner_id: string; visible_to_tier: string }
  >(viewerId: string, rows: T[]): Promise<T[]> {
    const out: T[] = [];
    for (const row of rows) {
      if (await this.canView(viewerId, row.owner_id, row.visible_to_tier)) {
        out.push(row);
      }
    }
    return out;
  }

  // THIS SECTION DOES: drop taste rows for one provider before a fresh sync.
  private async clearProviderTaste(userId: string, provider: MusicProvider) {
    await this.supabase.admin
      .from('music_taste_artists')
      .delete()
      .eq('owner_id', userId)
      .eq('provider', provider);
  }

  // THIS SECTION DOES: rewrite matchable music.artist.* attributes from all synced taste.
  private async rebuildArtistAttributes(userId: string) {
    await this.supabase.admin
      .from('attributes')
      .delete()
      .eq('owner_id', userId)
      .like('key', 'music.artist.%');

    const { data, error } = await this.supabase.admin
      .from('music_taste_artists')
      .select('artist_id, artist_name, artwork_url, provider, rank')
      .eq('owner_id', userId)
      .order('rank', { ascending: true });
    if (error) throw error;
    if (!data?.length) return;

    const attrs = data.map((r) => ({
      owner_id: userId,
      key: `music.artist.${r.provider}.${r.artist_id}`.slice(0, 200),
      value: {
        label: r.artist_name,
        provider: r.provider,
        artistId: r.artist_id,
        artworkUrl: r.artwork_url
      } as unknown as Json,
      layer: 'profile' as const,
      visible_to_tier: 'friend' as const,
      matchable: true
    }));
    const { error: insErr } = await this.supabase.admin.from('attributes').insert(attrs);
    if (insErr) throw insErr;
  }

  // THIS SECTION DOES: confirm Apple MusicKit env is present before connect.
  private requireAppleMusicConfigured() {
    const teamId = this.config.get<string>('APPLE_MUSIC_TEAM_ID');
    const keyId = this.config.get<string>('APPLE_MUSIC_KEY_ID');
    if (!teamId || !keyId) {
      throw new ServiceUnavailableException(
        'Apple Music is not configured (APPLE_MUSIC_TEAM_ID / APPLE_MUSIC_KEY_ID)'
      );
    }
    // Touch the private key early so connect fails fast with a clear message.
    loadAppleMusicPrivateKey({
      path: this.config.get<string>('APPLE_MUSIC_PRIVATE_KEY_PATH'),
      inlinePem: this.config.get<string>('APPLE_MUSIC_PRIVATE_KEY')
    });
  }

  private async mintDeveloperToken() {
    const teamId = this.config.get<string>('APPLE_MUSIC_TEAM_ID');
    const keyId = this.config.get<string>('APPLE_MUSIC_KEY_ID');
    if (!teamId || !keyId) {
      throw new ServiceUnavailableException('Apple Music is not configured');
    }
    const privateKeyPem = loadAppleMusicPrivateKey({
      path: this.config.get<string>('APPLE_MUSIC_PRIVATE_KEY_PATH'),
      inlinePem: this.config.get<string>('APPLE_MUSIC_PRIVATE_KEY')
    });
    const origin =
      this.config.get<string>('APPLE_MUSIC_ORIGIN') ?? this.apiPublicBase();
    return mintAppleMusicDeveloperToken({
      teamId,
      keyId,
      privateKeyPem,
      origin
    });
  }

  private async appleMusicUserToken(userId: string): Promise<string> {
    const { data, error } = await this.supabase.admin
      .from('music_connections')
      .select('refresh_token_enc')
      .eq('user_id', userId)
      .eq('provider', 'apple_music')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Connect Apple Music first');
    return decryptToken(data.refresh_token_enc, this.tokenSecret());
  }

  private async appleGet<T>(
    path: string,
    developerToken: string,
    musicUserToken: string
  ): Promise<T> {
    const res = await fetch(`https://api.music.apple.com${path}`, {
      headers: {
        Authorization: `Bearer ${developerToken}`,
        'Music-User-Token': musicUserToken
      }
    });
    if (!res.ok) {
      throw new BadRequestException(`Apple Music request failed (${res.status})`);
    }
    return (await res.json()) as T;
  }

  // THIS SECTION DOES: public HTTPS base for MusicKit authorize + deep-link return.
  private apiPublicBase(): string {
    const explicit = this.config.get<string>('API_PUBLIC_URL')?.replace(/\/$/, '');
    if (explicit) return explicit;
    const spotifyRedirect = this.config.get<string>('SPOTIFY_REDIRECT_URI');
    if (spotifyRedirect) {
      try {
        const u = new URL(spotifyRedirect);
        return `${u.protocol}//${u.host}`;
      } catch {
        // fall through
      }
    }
    const port = this.config.get<string>('PORT') ?? '3000';
    return `http://127.0.0.1:${port}`;
  }
}

const TIER_RANK: Record<string, number> = {
  close: 1,
  friend: 2,
  acquaintance: 3,
  none: 99
};

type SpotifySearchResponse = {
  tracks?: { items: SpotifyTrack[] };
  albums?: { items: SpotifyAlbum[] };
  artists?: { items: SpotifyArtist[] };
};

type SpotifyTrack = {
  id: string;
  uri: string;
  name: string;
  preview_url: string | null;
  external_ids?: { isrc?: string };
  album?: { name?: string; images?: Array<{ url: string }> };
  artists?: Array<{ name: string }>;
};

type SpotifyAlbum = {
  id: string;
  uri: string;
  name: string;
  images?: Array<{ url: string }>;
  artists?: Array<{ name: string }>;
};

type SpotifyArtist = {
  id: string;
  uri: string;
  name: string;
  images?: Array<{ url: string }>;
};

function mapSearch(
  data: SpotifySearchResponse,
  type: 'track' | 'album' | 'artist'
): MusicCatalogItem[] {
  if (type === 'track') {
    return (data.tracks?.items ?? []).filter(Boolean).map((t) => ({
      spotifyId: t.id,
      spotifyUri: t.uri,
      title: t.name,
      artistName: (t.artists ?? []).map((a) => a.name).join(', '),
      albumName: t.album?.name,
      artworkUrl: t.album?.images?.[0]?.url ?? null,
      previewUrl: t.preview_url,
      isrc: t.external_ids?.isrc ?? null,
      type: 'track' as const
    }));
  }
  if (type === 'album') {
    return (data.albums?.items ?? []).filter(Boolean).map((a) => ({
      spotifyId: a.id,
      spotifyUri: a.uri,
      title: a.name,
      artistName: (a.artists ?? []).map((x) => x.name).join(', '),
      artworkUrl: a.images?.[0]?.url ?? null,
      previewUrl: null,
      type: 'album' as const
    }));
  }
  return (data.artists?.items ?? []).filter(Boolean).map((a) => ({
    spotifyId: a.id,
    spotifyUri: a.uri,
    title: a.name,
    artistName: a.name,
    artworkUrl: a.images?.[0]?.url ?? null,
    previewUrl: null,
    type: 'artist' as const
  }));
}

function mapPick(row: {
  id: string;
  kind: string;
  spotify_id: string | null;
  spotify_uri: string | null;
  apple_music_id: string | null;
  isrc: string | null;
  title: string;
  artist_name: string;
  album_name: string | null;
  artwork_url: string | null;
  preview_url: string | null;
  visible_to_tier: string;
  matchable: boolean;
}): MusicPick {
  return {
    id: row.id,
    kind: row.kind as MusicPickKind,
    spotifyId: row.spotify_id,
    spotifyUri: row.spotify_uri,
    appleMusicId: row.apple_music_id,
    isrc: row.isrc,
    title: row.title,
    artistName: row.artist_name,
    albumName: row.album_name,
    artworkUrl: row.artwork_url,
    previewUrl: row.preview_url,
    visibleToTier: row.visible_to_tier as Tier,
    matchable: row.matchable
  };
}

// THIS SECTION DOES: escape text before putting it into the MusicKit HTML page.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// THIS SECTION DOES: small MusicKit page that asks Apple for permission, then posts the token to Nest.
function appleAuthorizeHtml(opts: {
  developerToken: string;
  state: string;
  completeUrl: string;
  appName: string;
}): string {
  const token = escapeJsString(opts.developerToken);
  const state = escapeJsString(opts.state);
  const completeUrl = escapeJsString(opts.completeUrl);
  const appName = escapeHtml(opts.appName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Connect Apple Music · ${appName}</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #F4F1EA; color: #1C1B16;
      display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; padding: 24px; }
    .card { max-width: 360px; text-align: center; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    p { font-size: 14px; line-height: 1.4; opacity: 0.8; }
    button { margin-top: 20px; width: 100%; padding: 14px 16px; border: 0; border-radius: 12px;
      background: #1C1B16; color: #fff; font-size: 16px; font-weight: 600; }
    .err { color: #8B1E1E; margin-top: 12px; font-size: 13px; }
  </style>
  <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
</head>
<body>
  <div class="card">
    <h1>Connect Apple Music</h1>
    <p>Bridger uses this to find artists you listen to a lot. It is not how you sign into Bridger.</p>
    <button id="go" type="button">Continue with Apple Music</button>
    <p id="status" class="err" hidden></p>
  </div>
  <script>
    (function () {
      var developerToken = '${token}';
      var state = '${state}';
      var completeUrl = '${completeUrl}';
      var btn = document.getElementById('go');
      var status = document.getElementById('status');
      function showErr(msg) {
        status.hidden = false;
        status.textContent = msg;
        btn.disabled = false;
      }
      btn.addEventListener('click', function () {
        btn.disabled = true;
        status.hidden = true;
        document.addEventListener('musickitloaded', onReady);
        if (window.MusicKit) onReady();
      });
      async function onReady() {
        try {
          await MusicKit.configure({
            developerToken: developerToken,
            app: { name: 'Bridger', build: '1.0.0' }
          });
          var music = MusicKit.getInstance();
          var musicUserToken = await music.authorize();
          if (!musicUserToken) {
            showErr('Apple did not return a token. Try again.');
            return;
          }
          var res = await fetch(completeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ state: state, musicUserToken: musicUserToken })
          });
          var json = await res.json().catch(function () { return null; });
          if (json && json.redirectTo) {
            window.location = json.redirectTo;
            return;
          }
          showErr('Could not finish linking. Close this window and try again.');
        } catch (e) {
          showErr('Could not open Apple Music. Check that you are signed into Apple Music on this device.');
        }
      }
    })();
  </script>
</body>
</html>`;
}

function appleAuthorizeErrorHtml(code: string): string {
  const safe = escapeHtml(code);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Apple Music</title></head>
<body style="font-family:-apple-system,system-ui,sans-serif;padding:24px;background:#F4F1EA;color:#1C1B16">
  <h1>Could not start Apple Music</h1>
  <p>Close this window and try Connect Apple Music again from Bridger (${safe}).</p>
</body></html>`;
}
