-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Gives the "What J name are you..." quiz a real memory on the server so we can
-- (1) save each person's result, (2) make a shareable link that remembers who
-- shared it, and (3) remember which friend a new signup came from, so after they
-- create an account we can connect them to the friend who invited them.
--
-- PRIVACY: these tables only hold the fun result (a J-name + a percent) and the
-- opaque user ids for "who invited whom." No message text, no photos. Everything
-- hard-deletes with the account (on delete cascade), same as the rest of Bridger.
-- ============================================

-- --- Each person's one canonical result for this quiz. Retakes overwrite it. ---
create table public.jname_results (
  user_id uuid primary key references public.users (id) on delete cascade,
  -- The J-name they landed on (e.g. "Jake") and how "J" they are (0-100).
  j_name text not null,
  percent int not null default 0 check (percent between 0 and 100),
  -- The friends they picked as their top matches during the quiz (opaque ids),
  -- used later to build the "your version of Zack" board. Never names/text.
  top_names text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.jname_results is
  'One J-name quiz result per user (retakes overwrite). Fun result only; hard-deletes with account.';

alter table public.jname_results enable row level security;

-- Owner reads/writes their own row. Friend reads for the leaderboard happen via
-- Nest (service role), so there is no friend select policy here on purpose.
create policy jname_results_select_own on public.jname_results
  for select to authenticated using (user_id = auth.uid());
create policy jname_results_insert_own on public.jname_results
  for insert to authenticated with check (user_id = auth.uid());
create policy jname_results_update_own on public.jname_results
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy jname_results_delete_own on public.jname_results
  for delete to authenticated using (user_id = auth.uid());

-- --- One shareable link (token) per person, snapshotting what they shared. ---
create table public.jname_shares (
  token uuid primary key default gen_random_uuid(),
  sharer_id uuid not null references public.users (id) on delete cascade,
  -- Snapshot so the public web page still renders even if they later retake.
  j_name text not null,
  percent int not null default 0 check (percent between 0 and 100),
  created_at timestamptz not null default now(),
  -- One canonical link per person keeps the URL stable when they re-share.
  unique (sharer_id)
);

create index jname_shares_sharer_idx on public.jname_shares (sharer_id);

comment on table public.jname_shares is
  'Public share tokens for the J-name quiz. The free web page reads these via Nest (service role).';

alter table public.jname_shares enable row level security;

-- Owner can see/insert their own token. The anonymous public web view reads the
-- token through Nest (service role), never directly, so no anon policy is needed.
create policy jname_shares_select_own on public.jname_shares
  for select to authenticated using (sharer_id = auth.uid());
create policy jname_shares_insert_own on public.jname_shares
  for insert to authenticated with check (sharer_id = auth.uid());

-- --- Who opened whose link, and (once they sign up) who invited whom. ---
create table public.jname_referrals (
  id uuid primary key default gen_random_uuid(),
  token uuid not null references public.jname_shares (token) on delete cascade,
  -- Denormalized so "who did I bring in?" is a single-column lookup.
  sharer_id uuid not null references public.users (id) on delete cascade,
  -- Filled once the opener has (or creates) an account. Null = still anonymous.
  invited_user_id uuid references public.users (id) on delete cascade,
  -- Opaque id the logged-out web viewer carries so we can resolve them later.
  anon_ref text,
  opened_at timestamptz not null default now(),
  -- Set when we successfully link the open to a real account.
  resolved_at timestamptz
);

-- One row per known account per link, and one row per anonymous device per link.
create unique index jname_referrals_one_per_user
  on public.jname_referrals (token, invited_user_id)
  where invited_user_id is not null;
create unique index jname_referrals_one_per_anon
  on public.jname_referrals (token, anon_ref)
  where anon_ref is not null and invited_user_id is null;
create index jname_referrals_sharer_idx on public.jname_referrals (sharer_id);
create index jname_referrals_invited_idx on public.jname_referrals (invited_user_id);

comment on table public.jname_referrals is
  'J-name share opens + who-invited-whom. Opaque ids only; resolved after signup by Nest.';

alter table public.jname_referrals enable row level security;

-- Both sides (the sharer and the invited person) can read rows about themselves.
-- Writes (recording opens, resolving after signup) go through Nest (service role).
create policy jname_referrals_select_involved on public.jname_referrals
  for select to authenticated
  using (sharer_id = auth.uid() or invited_user_id = auth.uid());
