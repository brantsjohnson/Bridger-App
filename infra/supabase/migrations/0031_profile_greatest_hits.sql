-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Co-op "Greatest hits" on a profile: up to 3 Bridger-hosted photos that can
-- sit between sections. Each slot has a placement index (0, 1, or 2) and an
-- optional "after which section" tip. Deleting the account or the media row
-- hard-deletes the hit (cascade). Tier visibility matches other profile facts.
-- ============================================

-- --- Up to 3 photo slots per person (placement_index 0..2). ---
create table public.profile_greatest_hits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  -- Slot number: only three allowed (0, 1, 2).
  placement_index smallint not null
    check (placement_index >= 0 and placement_index <= 2),
  -- Which movable module this photo sits after (e.g. top5, aboutMe). Null = default.
  after_module text,
  visible_to_tier tier not null default 'friend',
  created_at timestamptz not null default now(),
  unique (owner_id, placement_index)
);

create index idx_profile_greatest_hits_owner
  on public.profile_greatest_hits (owner_id);

comment on table public.profile_greatest_hits is
  'Co-op Greatest hits photos (≤3). Bridger-hosted media only. Cascades on user/media delete.';

-- SECURITY: RLS on; policies below.
alter table public.profile_greatest_hits enable row level security;

-- Read a hit only if your tier is high enough (owner always sees own via can_view).
create policy profile_greatest_hits_select on public.profile_greatest_hits
  for select to authenticated
  using (public.can_view(owner_id, visible_to_tier));

-- Only the owner may add / change / remove their slots.
create policy profile_greatest_hits_insert on public.profile_greatest_hits
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy profile_greatest_hits_update on public.profile_greatest_hits
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy profile_greatest_hits_delete on public.profile_greatest_hits
  for delete to authenticated
  using (owner_id = auth.uid());
