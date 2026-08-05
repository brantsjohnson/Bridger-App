-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Stories have TWO clocks:
--   live_until  = created_at + 24 hours
--                 After this, the update leaves the Home tray and friends
--                 can no longer open it. The author's Profile calendar
--                 archive still has the picture.
--   expires_at  = ~30 days (free) or null (co-op)
--                 When this passes for free users, media is deleted for real.
--
-- live_until is generated from created_at so the 24h mark cannot drift.
-- ============================================

alter table public.stories
  add column if not exists live_until timestamptz
  generated always as (created_at + interval '24 hours') stored;

-- Home tray + "is this still live for friends?" lookups.
create index if not exists idx_stories_live_until
  on public.stories (live_until);

-- Author archive / retention sweeps by expiry.
create index if not exists idx_stories_expires_at
  on public.stories (expires_at);

comment on column public.stories.live_until is
  'When this update leaves the live tray (created_at + 24h). Author archive keeps it until expires_at.';

comment on column public.stories.expires_at is
  'Free-tier media retention (~30d). Null = co-op / keep forever. Past this, media may be deleted.';
