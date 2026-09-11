-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds the opt-in "share my interests to my own website" feature. It creates
-- one small table, `interest_shares`, with a single row per person that holds:
--   - a master ON/OFF switch (default OFF, so nothing is public until you ask),
--   - a friendly public web address piece (`slug`, e.g. "brant-abc123"),
--   - a secret share token (a hard-to-guess key for Bearer-style access),
--   - four checkboxes for exactly which tastes may leave the app: hobbies,
--     movies, books, and what you are currently reading.
--
-- WHERE THE ACTUAL TASTES LIVE: nowhere new. The interests themselves stay in
-- the existing `attributes` table (hobby:* , fav:* , currently_book). This table
-- only records the person's CHOICE to expose a read-only, sanitized slice of
-- them. We deliberately do NOT copy any facts here (no parallel store).
--
-- PRIVACY: opt-in default OFF. The public web view is served by the Nest API
-- (service role) which returns only the four allowed taste categories and never
-- messages, friends, places, About answers, top 5, or matching internals.
-- Everything hard-deletes with the account via `on delete cascade`.
-- ============================================

-- --- One share-settings row per person. `enabled` OFF until they opt in. ---
create table public.interest_shares (
  -- Same id as the account, so the row is the person's own share settings.
  user_id uuid primary key references public.users (id) on delete cascade,
  -- Master switch. OFF means the public link returns "not found".
  enabled boolean not null default false,
  -- Friendly, unique URL piece for a personal site link (null until enabled).
  slug text unique,
  -- Secret Bearer-style key so a site can fetch without exposing the slug.
  share_token uuid not null default gen_random_uuid(),
  -- The four field checkboxes (all default ON once they opt in; opt-in gates them).
  share_hobbies boolean not null default true,
  share_movies boolean not null default true,
  share_books boolean not null default true,
  share_currently_reading boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.interest_shares is
  'Opt-in settings for the read-only public interests export (personal site). Points at existing attributes; stores no facts. Hard-deletes with the account.';
comment on column public.interest_shares.enabled is
  'Master opt-in switch. Default OFF: the public link returns 404 until the owner turns this on.';
comment on column public.interest_shares.slug is
  'Unique public URL piece for /public/share/interests/:slug. Null until enabled.';
comment on column public.interest_shares.share_token is
  'Secret Bearer key for token-based public fetch. Rotate by writing a new value.';

-- --- Fast lookups for the public read paths (by slug and by token). ---
create index interest_shares_slug_idx on public.interest_shares (slug);
create index interest_shares_token_idx on public.interest_shares (share_token);

-- --- SECURITY: row-level security ON. Owner may read/write only their own row. ---
-- The anonymous public web view reads through Nest (service role), which bypasses
-- RLS, so there is no anon policy here on purpose (same pattern as jname_shares).
alter table public.interest_shares enable row level security;

create policy interest_shares_select_own on public.interest_shares
  for select to authenticated using (user_id = auth.uid());
create policy interest_shares_insert_own on public.interest_shares
  for insert to authenticated with check (user_id = auth.uid());
create policy interest_shares_update_own on public.interest_shares
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy interest_shares_delete_own on public.interest_shares
  for delete to authenticated using (user_id = auth.uid());

-- --- Keep updated_at fresh on every change (same helper as the rest of the app). ---
create trigger trg_interest_shares_updated_at
  before update on public.interest_shares
  for each row execute function public.set_updated_at();
