-- ============================================
-- WHAT THIS FILE DOES (plain English):
-- The Home "Side Quest" (weekly activity) can ask for a photo or a text
-- blurb. Notes App Discovery goes live as a text challenge, and posts can
-- store the blurb + emoji (not only a photo).
-- ============================================

-- --- How people answer this challenge: photo collage or text notes ---
alter table public.weekly_activities
  add column if not exists post_mode text not null default 'photo';

alter table public.weekly_activities
  drop constraint if exists weekly_activities_post_mode_check;

alter table public.weekly_activities
  add constraint weekly_activities_post_mode_check
  check (post_mode in ('photo', 'text'));

-- --- Text blurbs on activity posts (used by Notes App Discovery) ---
alter table public.activity_posts
  add column if not exists caption text,
  add column if not exists emoji text;

-- --- Only one Side Quest live at a time: clear, then set Notes App Discovery ---
update public.weekly_activities
set active = false
where active = true;

update public.weekly_activities
set
  active = true,
  prompt = 'Share a blurb from your notes app archives.',
  closes_in = 'ends Sunday',
  emoji = '✏️',
  cover = '{"kind":"emoji","value":"✏️","bg":"#FFB515"}'::jsonb,
  post_mode = 'text'
where title = 'Notes App Discovery';

insert into public.weekly_activities (
  title,
  prompt,
  active,
  closes_in,
  emoji,
  cover,
  post_mode
)
select
  'Notes App Discovery',
  'Share a blurb from your notes app archives.',
  true,
  'ends Sunday',
  '✏️',
  '{"kind":"emoji","value":"✏️","bg":"#FFB515"}'::jsonb,
  'text'
where not exists (
  select 1
  from public.weekly_activities
  where title = 'Notes App Discovery'
);
