-- ============================================
-- WHAT THIS FILE DOES (plain English):
-- Lets an Update (story) be tagged to an event so party photos land in the
-- event's shared photo album. Nullable — most posts are not event-tagged.
-- ============================================

alter table public.stories
  add column if not exists event_id uuid references public.events (id) on delete set null;

create index if not exists idx_stories_event on public.stories (event_id)
  where event_id is not null;
