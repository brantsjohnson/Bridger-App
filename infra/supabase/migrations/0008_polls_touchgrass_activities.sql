-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the lightweight interaction tables:
--   polls / poll_options / poll_votes - a quick question with choices. Creating
--        a poll is a co-op perk; answering is free. One vote per person per poll.
--   touch_grass  - the "who wants to hang?" signal: sent to an audience tier,
--        with a timing (now / tonight / weekend) and an optional why. Shows on
--        Home and Events.
--   weekly_activities / activity_posts / activity_hearts - the weekly prompt,
--        the photo/video people post for it, and the hearts on those posts.
--
-- NAMING NOTE: DATA.md calls the touch_grass timing column `when`, but `when` is
-- a reserved SQL word, so the column here is `when_window` (same meaning).
-- ============================================

-- --- A quick poll. closes_at is capped at 7 days in app logic. ---
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  question text not null,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_polls_author on public.polls (author_id);

-- --- The choices on a poll. ---
create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  label text not null
);
create index idx_poll_options_poll on public.poll_options (poll_id);

-- --- A single person's vote. One per poll (primary key enforces it). ---
create table public.poll_votes (
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);
create index idx_poll_votes_option on public.poll_votes (option_id);

-- --- A "touch grass" signal to a chosen tier of friends. ---
create table public.touch_grass (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  audience_tier tier not null default 'friend',
  when_window touch_grass_when not null,
  why text,
  created_at timestamptz not null default now()
);
create index idx_touch_grass_author on public.touch_grass (author_id);
create index idx_touch_grass_created on public.touch_grass (created_at desc);

-- --- The weekly prompt everyone can post to. ---
create table public.weekly_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  prompt text,
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- --- A person's post for the weekly activity. ---
create table public.activity_posts (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.weekly_activities (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  media_id uuid references public.media (id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_activity_posts_activity on public.activity_posts (activity_id);
create index idx_activity_posts_author on public.activity_posts (author_id);

-- --- Hearts on an activity post. One per person per post. ---
create table public.activity_hearts (
  post_id uuid not null references public.activity_posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- SECURITY: RLS on (policies in 0012).
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.touch_grass enable row level security;
alter table public.weekly_activities enable row level security;
alter table public.activity_posts enable row level security;
alter table public.activity_hearts enable row level security;
