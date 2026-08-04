-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the "things people post" tables:
--   media         - a pointer to an uploaded photo/video/audio file in Storage,
--                   with an optional expiry for retention.
--   stories       - an "Update" (user-facing name). Photo or video, with the
--                   caption text and, for video, the transcript. Rolls off
--                   after ~30 days (expires_at).
--   day_summaries - the AI-written recap of a person's day. PRIVACY: built ONLY
--                   from the user's own update text + video transcripts, never
--                   from analyzing photos. Pre-generated when they post.
--   reactions     - replies to a story: a circle video, text, or sticker; can
--                   be threaded via parent_reaction_id.
--
-- It also finally connects user_identity.avatar_media_id to media (that FK was
-- left dangling in 0002 because media didn't exist yet).
-- ============================================

-- --- A file in Storage. expires_at powers the retention/rolling-window rules. ---
create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  storage_path text not null,
  kind media_kind not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index idx_media_owner on public.media (owner_id);

-- --- Now that media exists, point avatars at it (delete photo => avatar goes null). ---
alter table public.user_identity
  add constraint fk_user_identity_avatar
  foreign key (avatar_media_id) references public.media (id) on delete set null;

-- --- An "Update" (code name: story). expires_at = the 30-day rolling window. ---
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  type story_type not null,
  media_id uuid references public.media (id) on delete set null,
  update_text text,
  transcript text,
  theme_slug text,
  visible_to_tier tier not null default 'friend',
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index idx_stories_author on public.stories (author_id);
create index idx_stories_created on public.stories (created_at desc);

-- --- The AI day recap. One per author per day. media_refs lists photos to show alongside. ---
create table public.day_summaries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  date date not null,
  text text,
  media_refs jsonb not null default '[]'::jsonb,
  visible_to_tier tier not null default 'friend',
  built_at timestamptz not null default now(),
  unique (author_id, date)
);
create index idx_day_summaries_author on public.day_summaries (author_id);

-- --- A reply to a story. parent_reaction_id lets replies thread under each other. ---
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  kind reaction_kind not null,
  media_id uuid references public.media (id) on delete set null,
  text text,
  sticker_id text,
  parent_reaction_id uuid references public.reactions (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index idx_reactions_story on public.reactions (story_id);
create index idx_reactions_parent on public.reactions (parent_reaction_id);

-- SECURITY: RLS on (policies in 0012).
alter table public.media enable row level security;
alter table public.stories enable row level security;
alter table public.day_summaries enable row level security;
alter table public.reactions enable row level security;
