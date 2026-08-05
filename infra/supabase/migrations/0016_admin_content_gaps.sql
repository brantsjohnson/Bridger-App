-- ============================================
-- WHAT THIS FILE DOES (plain English):
-- Fills the gaps so the admin console can actually run:
--   * Co-op announcements get a title and an optional call-to-action.
--   * Delights get a human name + a slug that matches the plugin folder.
--   * Gift delights need a trigger table (who sent what to whom, played yet?).
--   * Quiz registry links to its design row and carries web_takeable / comparable.
--   * Users can save their own Home widget layout (null = use admin default).
--   * RLS for delight_triggers + quiz_results insert (own rows only).
--   * Seeds one admin_config row with the default Home layout + themed prompts.
-- ============================================

-- --- Co-op announcements: title + optional CTA ---
alter table public.coop_announcements
  add column if not exists title text,
  add column if not exists cta_label text,
  add column if not exists cta_url text;

-- --- Delights: display name + stable plugin slug ---
alter table public.delights
  add column if not exists name text not null default '',
  add column if not exists slug text;

-- Unique slug once set (allows null for any pre-existing rows).
create unique index if not exists idx_delights_slug
  on public.delights (slug)
  where slug is not null;

-- --- Gift delights: plays on the recipient's next app open ---
create table if not exists public.delight_triggers (
  id uuid primary key default gen_random_uuid(),
  delight_id uuid not null references public.delights (id) on delete cascade,
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id uuid not null references public.users (id) on delete cascade,
  played boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_delight_triggers_to
  on public.delight_triggers (to_user_id, played);

-- SECURITY: RLS on. Recipients read/mark played; senders insert as themselves.
alter table public.delight_triggers enable row level security;

drop policy if exists delight_triggers_insert on public.delight_triggers;
create policy delight_triggers_insert on public.delight_triggers
  for insert to authenticated
  with check (from_user_id = auth.uid());

drop policy if exists delight_triggers_select on public.delight_triggers;
create policy delight_triggers_select on public.delight_triggers
  for select to authenticated
  using (to_user_id = auth.uid() or from_user_id = auth.uid());

drop policy if exists delight_triggers_update on public.delight_triggers;
create policy delight_triggers_update on public.delight_triggers
  for update to authenticated
  using (to_user_id = auth.uid())
  with check (to_user_id = auth.uid());

-- --- Quiz registry: link to design + flags ---
alter table public.quiz_registry
  add column if not exists quiz_id uuid references public.quizzes (id),
  add column if not exists web_takeable boolean not null default true,
  add column if not exists comparable boolean not null default false;

-- --- Per-user Home layout (null = fall back to admin default) ---
alter table public.user_settings
  add column if not exists home_layout jsonb;

-- SECURITY: you can write your own quiz results (complete a quiz).
drop policy if exists quiz_results_insert on public.quiz_results;
create policy quiz_results_insert on public.quiz_results
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists quiz_results_update on public.quiz_results;
create policy quiz_results_update on public.quiz_results
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- --- Seed one admin_config row if the table is empty ---
insert into public.admin_config (home_defaults, live_quiz_slug, themed_prompts)
select
  '{
    "layout": [
      {"key": "event", "size": "half"},
      {"key": "alerts", "size": "half"},
      {"key": "comingup", "size": "full"},
      {"key": "ask", "size": "full"},
      {"key": "activity", "size": "full"},
      {"key": "quiz", "size": "full"},
      {"key": "coop", "size": "full"}
    ]
  }'::jsonb,
  null,
  '[
    {"slug": "ootd", "label": "OOTD", "icon": "👕"},
    {"slug": "take-05", "label": "Take 0.5", "icon": "🤳"},
    {"slug": "hot-take", "label": "Hot take", "icon": "🌶️"}
  ]'::jsonb
where not exists (select 1 from public.admin_config);
