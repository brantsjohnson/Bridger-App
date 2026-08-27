-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Billy AI billing: config, per-user subscription + balance + ledger, and
-- ops alerts when Anthropic/OpenAI hit rate limits. Billy+ is the one
-- intentional add-on SKU on top of co-op dues.
--
-- SECURITY: users may read their own subscription/balance/ledger.
-- Writes go through Nest (service role). Config + ops alerts are service-only.
-- ============================================

-- Billy+ payment kind (co-op dues stay; this is the one à-la-carte SKU).
alter type payment_kind add value if not exists 'billy_plus';

-- --- Singleton plan defaults (admin-tunable via Nest). ---
create table public.billy_config (
  id integer primary key check (id = 1),
  taste_grant_usd numeric(12, 4) not null default 0.50,
  plus_price_usd numeric(12, 2) not null default 5.00,
  plus_grant_usd numeric(12, 4) not null default 3.50,
  rollover_cap_multiplier numeric(6, 2) not null default 2.00,
  taste_rollover boolean not null default false,
  min_balance_to_start_turn_usd numeric(12, 4) not null default 0.01,
  updated_at timestamptz not null default now()
);

create trigger trg_billy_config_updated_at
  before update on public.billy_config
  for each row execute function public.set_updated_at();

insert into public.billy_config (id) values (1);

-- --- Per-user Billy plan. ---
create table public.billy_subscriptions (
  user_id uuid primary key references public.users (id) on delete cascade,
  plan text not null default 'none'
    check (plan in ('taste', 'plus', 'none')),
  status text not null default 'canceled'
    check (status in ('active', 'canceling', 'canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_billy_subscriptions_updated_at
  before update on public.billy_subscriptions
  for each row execute function public.set_updated_at();

-- --- Current USD balance of model cost allowance. ---
create table public.billy_balances (
  user_id uuid primary key references public.users (id) on delete cascade,
  balance_usd numeric(12, 4) not null default 0,
  lifetime_granted_usd numeric(12, 4) not null default 0,
  lifetime_spent_usd numeric(12, 4) not null default 0,
  updated_at timestamptz not null default now()
);

create trigger trg_billy_balances_updated_at
  before update on public.billy_balances
  for each row execute function public.set_updated_at();

-- --- Immutable-ish spend/grant log (no prompt content). ---
create table public.billy_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null
    check (kind in (
      'grant_taste',
      'grant_plus',
      'spend',
      'expire',
      'adjust_admin',
      'forfeit'
    )),
  amount_usd numeric(12, 4) not null,
  balance_after_usd numeric(12, 4) not null,
  job text,
  cost_log_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index idx_billy_ledger_user_created
  on public.billy_ledger (user_id, created_at desc);
create index idx_billy_ledger_kind_created
  on public.billy_ledger (kind, created_at desc);

-- --- Org-level vendor / budget alerts for admin. ---
create table public.ai_ops_alerts (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('anthropic', 'openai', 'ai_budget')),
  code text not null,
  detail text not null default '',
  job text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_ai_ops_alerts_open
  on public.ai_ops_alerts (created_at desc)
  where resolved_at is null;

-- SECURITY: RLS on; own-row read for member tables; no client writes.
alter table public.billy_config enable row level security;
alter table public.billy_subscriptions enable row level security;
alter table public.billy_balances enable row level security;
alter table public.billy_ledger enable row level security;
alter table public.ai_ops_alerts enable row level security;

create policy billy_subscriptions_select_own
  on public.billy_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

create policy billy_balances_select_own
  on public.billy_balances for select
  to authenticated
  using (user_id = auth.uid());

create policy billy_ledger_select_own
  on public.billy_ledger for select
  to authenticated
  using (user_id = auth.uid());
