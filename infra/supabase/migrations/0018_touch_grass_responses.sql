-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Finishes Touch Grass (the "I'm free to hang" signal). Two additions:
--   1. touch_grass gets an `expires_at` so a signal stops showing after its
--      window (now / tonight / weekend) passes.
--   2. touch_grass_responses records how a recipient reacted: "I'm in" or
--      dismissed. There is no "no" - only in or dismiss. The signal's author
--      sees who's in (visible to them only); a recipient sees their own row.
-- ============================================

-- --- When a signal stops showing on Home / Events. ---
alter table public.touch_grass
  add column if not exists expires_at timestamptz;
create index if not exists idx_touch_grass_expires
  on public.touch_grass (expires_at);

-- --- One recipient's reaction to a signal. One row per person per signal. ---
create table if not exists public.touch_grass_responses (
  signal_id uuid not null references public.touch_grass (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  -- 'in' = count me in (becomes a plan); 'dismissed' = hide it for me.
  status text not null check (status in ('in', 'dismissed')),
  created_at timestamptz not null default now(),
  primary key (signal_id, user_id)
);
create index if not exists idx_touch_grass_responses_signal
  on public.touch_grass_responses (signal_id);

-- SECURITY: RLS on. Policies below.
alter table public.touch_grass_responses enable row level security;

-- Read: the signal's author sees every response to their signal; anyone else
-- sees only their own response row.
create policy touch_grass_responses_select on public.touch_grass_responses
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.touch_grass tg
      where tg.id = signal_id and tg.author_id = auth.uid()
    )
  );

-- Write: you manage only your own response, and only for a signal you may see
-- (its audience tier includes you). can_view also lets the author respond.
create policy touch_grass_responses_write on public.touch_grass_responses
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.touch_grass tg
      where tg.id = signal_id
        and (tg.author_id = auth.uid()
             or public.can_view(tg.author_id, tg.audience_tier))
    )
  );
