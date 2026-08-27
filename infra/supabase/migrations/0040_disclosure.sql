-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Behind the Scenes (disclosure pre-quiz). Optional, sensitive context that
-- NEVER appears on a profile or to a match. Owner-only RLS. Separate from
-- fun-quiz tables so it can be toggled off or deleted without touching scores.
-- Matching may use it additively only, and only when the person opts in.
-- ============================================

-- Account-level status + how strongly matching may use this.
create table public.disclosure_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  version int not null default 1,
  status text not null
    check (status in ('pending', 'skipped', 'completed')),
  -- Screen 4: hard control for matching weight.
  match_weight_preference text
    check (
      match_weight_preference is null
      or match_weight_preference in ('use', 'a_little', 'barely')
    ),
  -- Soft off-switch: stop using in matching without deleting rows.
  matching_enabled boolean not null default true,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- One row per selected item (condition + impact + optional note).
create table public.disclosure_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  condition_key text not null
    check (
      condition_key in (
        'adhd',
        'anxiety',
        'depression',
        'ocd',
        'bipolar',
        'autistic',
        'ptsd',
        'other',
        'prefer_not_list'
      )
    ),
  -- Only for condition_key = other. Sensitive free text. Never analytics.
  condition_label_custom text,
  impact_level smallint check (impact_level is null or impact_level between 1 and 4),
  -- Optional free text. Never show to matches. Never analytics.
  context_note text,
  created_at timestamptz not null default now(),
  unique (user_id, condition_key)
);

create index idx_disclosure_items_user on public.disclosure_items (user_id);

alter table public.disclosure_profiles enable row level security;
alter table public.disclosure_items enable row level security;

-- SECURITY: only the owner may read or write their disclosure rows.
-- Matching scorer uses the service role (bypasses RLS) and must never
-- expose these fields as reveal evidence titles.
create policy disclosure_profiles_all on public.disclosure_profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy disclosure_items_all on public.disclosure_items
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
