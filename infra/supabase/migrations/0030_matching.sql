-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds the matching + learning tables:
--   matching_config      - transparent v1 weights + knobs (admin can flip/rollback)
--   matching_suggestions - ranked Mode 1 suggestions with frozen feature snapshots
--   matching_feedback    - labeled outcomes for learning (opaque ids, no content)
-- Expands connections meeting-memory fields used by Mode 2 overlap.
--
-- PRIVACY: Mode 1 writes are service-role only. Feedback never stores message
-- text, names, or analytics. Account delete + discoverable=false purge rows.
-- Matching runs in Nest (apps/api/src/matching/), not Edge Functions.
-- ============================================

-- --- How you met extras (Mode 2 only; never used as Mode 1 features). ---
alter table public.connections
  add column if not exists met_via_user_id uuid references public.users (id) on delete set null;

-- --- Live matching knobs (one active version at a time). ---
create table public.matching_config (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique,
  active boolean not null default false,
  -- Weights for the six MACHINE-LEARNING.md §8 features (must sum to ~1).
  weights jsonb not null,
  -- Below this score → do not suggest (empty Discover is correct).
  suggest_threshold numeric not null default 0.55,
  -- High-confidence spotlight band.
  spotlight_threshold numeric not null default 0.75,
  -- Meaningful Everyone+matchable overlaps needed if no shared quiz.
  min_shared_signals integer not null default 3,
  -- Ignore quiz dimensions below this moderator confidence.
  confidence_floor numeric not null default 0.4,
  reveal_extras_max integer not null default 3,
  refresh_cap integer not null default 5,
  exploration_epsilon numeric not null default 0.10,
  exploration_epsilon_cold numeric not null default 0.15,
  bridge_cooldown_days integer not null default 14,
  ann_candidate_cap integer not null default 500,
  exposure_cap_pct numeric not null default 0.10,
  exposure_hard_cap integer not null default 50,
  v2_enabled boolean not null default false,
  holdout_pct numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create unique index uq_matching_config_one_active
  on public.matching_config (active)
  where active = true;

insert into public.matching_config (
  version, active, weights, notes
) values (
  1,
  true,
  '{
    "shared_attributes": 0.30,
    "quiz_alignment": 0.25,
    "embedding_similarity": 0.15,
    "mutual_warmth": 0.15,
    "moderator_notes_affinity": 0.10,
    "context_fit": 0.05
  }'::jsonb,
  'v1 transparent weights — seed from MACHINE-LEARNING execute plan B5'
);

-- --- Ranked suggestions shown to a viewer (Mode 1). ---
create table public.matching_suggestions (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references public.users (id) on delete cascade,
  candidate_id uuid not null references public.users (id) on delete cascade,
  surface text not null check (surface in ('discover', 'bridge', 'event')),
  event_id uuid references public.events (id) on delete cascade,
  connection_id uuid references public.connections (id) on delete cascade,
  via_friend_id uuid references public.users (id) on delete set null,
  score numeric not null,
  breakdown jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  is_exploration boolean not null default false,
  is_spotlight boolean not null default false,
  feature_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  dismissed_at timestamptz,
  converted_connection_id uuid references public.connections (id) on delete set null,
  check (viewer_id <> candidate_id)
);

create index idx_matching_suggestions_viewer
  on public.matching_suggestions (viewer_id, surface, created_at desc);

create unique index uq_matching_suggestions_active_discover
  on public.matching_suggestions (viewer_id, candidate_id)
  where surface = 'discover' and dismissed_at is null;

-- --- Labeled outcomes for learning (opaque pair ids). ---
create table public.matching_feedback (
  id uuid primary key default gen_random_uuid(),
  opaque_a uuid not null references public.users (id) on delete cascade,
  opaque_b uuid not null references public.users (id) on delete cascade,
  surface text check (surface in ('discover', 'bridge', 'event')),
  suggestion_id uuid references public.matching_suggestions (id) on delete set null,
  pair_features_snapshot jsonb not null,
  outcome text not null,
  weight numeric not null,
  created_at timestamptz not null default now(),
  superseded_at timestamptz,
  check (opaque_a < opaque_b)
);

create index idx_matching_feedback_pair
  on public.matching_feedback (opaque_a, opaque_b, created_at desc);
create index idx_matching_feedback_outcome
  on public.matching_feedback (outcome, created_at desc);
create index idx_matching_feedback_created
  on public.matching_feedback (created_at);

-- SECURITY: service-role Nest only for Mode 1 tables.
alter table public.matching_config enable row level security;
alter table public.matching_suggestions enable row level security;
alter table public.matching_feedback enable row level security;

-- Viewers can read their own active suggestions (names rejoined on device).
create policy matching_suggestions_select_own on public.matching_suggestions
  for select to authenticated
  using (viewer_id = auth.uid());

-- --- Purge matching rows when Discover is turned off (same spirit as Zone C). ---
create or replace function public.purge_matching_for_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.matching_suggestions
    where viewer_id = p_user or candidate_id = p_user;
  delete from public.matching_feedback
    where opaque_a = p_user or opaque_b = p_user;
end;
$$;

create or replace function public.trg_discoverable_purge_matching()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.discoverable = false and (old.discoverable is distinct from false) then
    perform public.purge_matching_for_user(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_user_settings_purge_matching on public.user_settings;
create trigger trg_user_settings_purge_matching
  after update of discoverable on public.user_settings
  for each row execute function public.trg_discoverable_purge_matching();
