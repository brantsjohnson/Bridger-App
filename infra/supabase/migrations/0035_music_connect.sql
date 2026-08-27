-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Lets people connect Spotify (account link, not login) and save music picks
-- (listening now, song of the week, favorites) with catalog ids + preview URLs.
-- Tokens stay owner-only (Zone A). Picks follow the same tier visibility as
-- other profile facts. Taste artists power "artists in common" on reveal.
-- Hard-delete cascades with the account.
-- ============================================

-- --- Short-lived OAuth state so the callback knows which Bridger user it is for. ---
create table public.music_oauth_states (
  state text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null check (provider in ('spotify', 'apple_music')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index music_oauth_states_expires_idx
  on public.music_oauth_states (expires_at);

alter table public.music_oauth_states enable row level security;
-- Nest (service role) only; no client policies on purpose.

-- --- Linked music accounts. Refresh tokens are encrypted at rest by Nest. ---
create table public.music_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null check (provider in ('spotify', 'apple_music')),
  -- Opaque encrypted blob (never plain refresh token in the DB).
  refresh_token_enc text not null,
  access_token_enc text,
  access_expires_at timestamptz,
  scopes text[] not null default '{}',
  provider_user_id text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index music_connections_user_idx
  on public.music_connections (user_id);

comment on table public.music_connections is
  'Zone A: linked Spotify/Apple Music accounts. Tokens encrypted by Nest; owner-only RLS.';

alter table public.music_connections enable row level security;

-- Owner may see that they are connected (Nest still hides token columns from clients
-- by only selecting non-secret fields when needed). Clients should prefer Nest /music/status.
create policy music_connections_select_own
  on public.music_connections
  for select to authenticated
  using (user_id = auth.uid());

create policy music_connections_delete_own
  on public.music_connections
  for delete to authenticated
  using (user_id = auth.uid());

-- Inserts/updates go through Nest service role only (no client write policies).

-- --- Named music picks on a profile (Listening, song of the week, favorites). ---
create table public.music_picks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  kind text not null check (kind in (
    'listening_now',
    'song_of_week',
    'fav_track',
    'fav_album',
    'fav_artist'
  )),
  spotify_id text,
  spotify_uri text,
  apple_music_id text,
  isrc text,
  title text not null,
  artist_name text not null default '',
  album_name text,
  artwork_url text,
  preview_url text,
  visible_to_tier tier not null default 'friend',
  matchable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One listening_now and one song_of_week per person. Favorites may repeat kinds.
create unique index music_picks_one_listening_now
  on public.music_picks (owner_id)
  where kind = 'listening_now';

create unique index music_picks_one_song_of_week
  on public.music_picks (owner_id)
  where kind = 'song_of_week';

create index music_picks_owner_idx
  on public.music_picks (owner_id);

create index music_picks_spotify_id_idx
  on public.music_picks (spotify_id)
  where spotify_id is not null;

comment on table public.music_picks is
  'Zone B: catalog music picks (no tokens). Tier + matchable like attributes.';

alter table public.music_picks enable row level security;

create policy music_picks_select on public.music_picks
  for select to authenticated
  using (public.can_view(owner_id, visible_to_tier));

create policy music_picks_insert on public.music_picks
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy music_picks_update on public.music_picks
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy music_picks_delete on public.music_picks
  for delete to authenticated
  using (owner_id = auth.uid());

-- --- Top artists synced from Spotify for reveal / In common overlap. ---
create table public.music_taste_artists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  provider text not null check (provider in ('spotify', 'apple_music')),
  artist_id text not null,
  artist_name text not null,
  rank smallint,
  artwork_url text,
  visible_to_tier tier not null default 'friend',
  matchable boolean not null default true,
  synced_at timestamptz not null default now(),
  unique (owner_id, provider, artist_id)
);

create index music_taste_artists_owner_idx
  on public.music_taste_artists (owner_id);

create index music_taste_artists_artist_idx
  on public.music_taste_artists (artist_id);

comment on table public.music_taste_artists is
  'Zone B: synced top artists for shared-taste overlap. No tokens.';

alter table public.music_taste_artists enable row level security;

create policy music_taste_artists_select on public.music_taste_artists
  for select to authenticated
  using (public.can_view(owner_id, visible_to_tier));

create policy music_taste_artists_delete_own on public.music_taste_artists
  for delete to authenticated
  using (owner_id = auth.uid());

-- Writes via Nest service role (sync job).
