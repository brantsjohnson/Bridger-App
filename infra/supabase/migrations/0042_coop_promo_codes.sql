-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds "auth codes" (promo codes) that give someone a free year of the Bridger
-- Co-op without paying. You (the operator) make a code in the admin console, set
-- how many people are allowed to use it (the "amount", e.g. 25), and hand it out.
-- When a person types the code in the app, they get a free year and we remember
-- who used which code.
--
-- Two tables:
--   coop_promo_codes       -- the codes you create + how many uses are left
--   coop_promo_redemptions -- one row per person per code (who used it, when)
--
-- PAYMENT: redeeming a code is NOT a purchase. It just grants membership the same
-- way soft-join does (one year of perks), so no money, receipt, or PII is stored.
-- SECURITY: RLS is on. Only the Nest server (service role) can write these rows;
-- codes are validated and redeemed server-side, never straight from the client.
-- ============================================

-- THIS SECTION DOES: the codes you create in the admin console.
create table if not exists public.coop_promo_codes (
  id uuid primary key default gen_random_uuid(),
  -- The code people type. Stored UPPERCASE so matching is case-insensitive.
  code text not null unique,
  -- A human label so you remember what a code was for (e.g. "Launch partners").
  label text not null default '',
  -- How long the free membership lasts when redeemed. 12 = one free year.
  grant_months integer not null default 12 check (grant_months > 0),
  -- The "amount": how many people are allowed to use this code in total.
  max_redemptions integer not null default 25 check (max_redemptions >= 0),
  -- How many people have used it so far (kept in sync by the server on redeem).
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  -- Turn a code off without deleting it (stops new redemptions).
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.coop_promo_codes is
  'Auth / promo codes that grant a free year of co-op. Admin-managed; server-only writes.';
comment on column public.coop_promo_codes.max_redemptions is
  'The "amount": how many people can use this code in total. Editable in the admin console.';
comment on column public.coop_promo_codes.grant_months is
  'Months of membership a redemption grants. 12 = one free year.';

-- THIS SECTION DOES: keep updated_at fresh on every edit.
create trigger trg_coop_promo_codes_updated_at
  before update on public.coop_promo_codes
  for each row execute function public.set_updated_at();

-- THIS SECTION DOES: one row each time a person redeems a code (who + when).
-- The (promo_code_id, user_id) primary key means a person can use a given code
-- only once, and lets you list exactly who redeemed which code.
create table if not exists public.coop_promo_redemptions (
  promo_code_id uuid not null references public.coop_promo_codes (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (promo_code_id, user_id)
);

comment on table public.coop_promo_redemptions is
  'Who redeemed which promo code and when. Opaque user ids only, no PII.';

-- THIS SECTION DOES: fast "who used this code?" lookups for the admin console.
create index if not exists idx_coop_promo_redemptions_code
  on public.coop_promo_redemptions (promo_code_id);
create index if not exists idx_coop_promo_redemptions_user
  on public.coop_promo_redemptions (user_id);

-- SECURITY: RLS on both. Nest uses the service role (which bypasses RLS) to
-- validate + redeem. We add a read-own policy on redemptions so the app can tell
-- a person "you already used this code" without exposing anyone else's row.
alter table public.coop_promo_codes enable row level security;
alter table public.coop_promo_redemptions enable row level security;

-- Redemptions: a signed-in person can read only their own redemption rows.
create policy coop_promo_redemptions_select_own on public.coop_promo_redemptions
  for select to authenticated using (user_id = auth.uid());

-- (No client policies on coop_promo_codes: only the server may read/write them,
--  so a code's remaining uses is never exposed to the app.)

-- THIS SECTION DOES: seed your first code with 25 free-year uses (change anytime
-- in the admin console). Idempotent so re-running the migration is safe.
insert into public.coop_promo_codes (code, label, grant_months, max_redemptions)
values ('BRIDGER-FREE-YEAR', 'Founder gift codes', 12, 25)
on conflict (code) do nothing;
