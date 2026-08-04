-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the membership + money tables:
--   coop_memberships - who is a paid co-op member, when they joined, and how far
--                      their dues are paid.
--   plan_state       - the perks a person currently has (storage type, circle
--                      size caps, video on/off, summary cadence, event cap). Free
--                      vs co-op is captured by `plan`.
--   payments         - a record of a dues charge. PAYMENT: the only kind is
--                      'coop_dues'. There are no à-la-carte purchases, and the
--                      peer-to-peer "chip in" handles on events are never
--                      processed here.
-- ============================================

-- --- Co-op membership status per person. ---
create table public.coop_memberships (
  user_id uuid primary key references public.users (id) on delete cascade,
  since timestamptz not null default now(),
  active boolean not null default true,
  dues_paid_through date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_coop_memberships_updated_at
  before update on public.coop_memberships
  for each row execute function public.set_updated_at();

-- --- The perks a person has right now. circle_caps holds the per-tier size limits. ---
create table public.plan_state (
  user_id uuid primary key references public.users (id) on delete cascade,
  plan coop_plan not null default 'free',
  storage storage_plan not null default 'rolling30',
  used_bytes bigint not null default 0,
  circle_caps jsonb not null default '{"close": 10, "friend": 25, "acquaintance": null}'::jsonb,
  video boolean not null default false,
  summary summary_cadence not null default 'weekly',
  event_cap integer not null default 35,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_plan_state_updated_at
  before update on public.plan_state
  for each row execute function public.set_updated_at();

-- --- A dues charge record. amount in the smallest currency unit; provider_ref = processor id. ---
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  kind payment_kind not null default 'coop_dues',
  amount numeric(12, 2),
  provider_ref text,
  created_at timestamptz not null default now()
);
create index idx_payments_user on public.payments (user_id);

-- SECURITY: RLS on. Own-row read policies are added in 0012; writes go through
-- the server (service key) so a client can't grant itself membership.
alter table public.coop_memberships enable row level security;
alter table public.plan_state enable row level security;
alter table public.payments enable row level security;
