-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the lighter "social" content:
--   quips (user-facing name: Inside Jokes) - a saved quote/joke. The note shows
--          the quoted person's photo; tapping reveals who posted it and the
--          event/place/date. It shares to tagged people and cross-posts to their
--          walls.
--   quip_tags       - the people tagged on a quip (they receive + cross-post it).
--   bucket_list     - a profile module: things you want to do. is_public toggles
--                     whether friends can see it; done marks it complete.
--   bucket_list_tags- friends tagged to do a bucket-list item together.
--
-- context_event_id is left as a plain id here and gets its events foreign key in
-- 0007, once the events table exists.
-- ============================================

-- --- A saved inside joke / quote. quoted_person_id is whose photo shows on the note. ---
create table public.quips (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,       -- who posted it
  quoted_person_id uuid references public.users (id) on delete set null,        -- whose photo is on the note
  text text not null,
  context_event_id uuid,
  place text,
  visible_to_tier tier not null default 'friend',
  created_at timestamptz not null default now()
);
create index idx_quips_author on public.quips (author_id);
create index idx_quips_quoted on public.quips (quoted_person_id);

-- --- Who is tagged on a quip (receives it + it cross-posts to their wall). ---
create table public.quip_tags (
  quip_id uuid not null references public.quips (id) on delete cascade,
  tagged_user_id uuid not null references public.users (id) on delete cascade,
  primary key (quip_id, tagged_user_id)
);
create index idx_quip_tags_user on public.quip_tags (tagged_user_id);

-- --- A bucket-list item on your profile. ---
create table public.bucket_list (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  text text not null,
  is_public boolean not null default true,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_bucket_list_owner on public.bucket_list (owner_id);

-- --- Friends tagged to do a bucket-list item together. ---
create table public.bucket_list_tags (
  item_id uuid not null references public.bucket_list (id) on delete cascade,
  tagged_user_id uuid not null references public.users (id) on delete cascade,
  primary key (item_id, tagged_user_id)
);
create index idx_bucket_list_tags_user on public.bucket_list_tags (tagged_user_id);

-- SECURITY: RLS on (policies in 0012).
alter table public.quips enable row level security;
alter table public.quip_tags enable row level security;
alter table public.bucket_list enable row level security;
alter table public.bucket_list_tags enable row level security;
