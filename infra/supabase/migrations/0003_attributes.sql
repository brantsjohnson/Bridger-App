-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the `attributes` table - the pool of de-identified facts about a
-- person (Zone B). Everything on a profile that isn't your name/photo lives
-- here as rows: hobbies, favorites, places, this-or-that answers, deeper
-- answers, quiz results. One row per item, unlimited rows per category, so a
-- person can have hundreds of entries and each is controlled on its own.
--
-- THE "TAGGED TWICE" IDEA (the core privacy control):
--   visible_to_tier - who is allowed to SEE this fact (close/friend/
--                     acquaintance, or 'none' = hidden but still usable by
--                     matching).
--   matchable       - whether the matchmaker may USE this fact at all.
-- These two tags are what the whole permission system reads. The value is
-- stored as jsonb so a place can carry tags + a note + photo refs, and a
-- this-or-that can store 'this' | 'that' | 'both'.
-- ============================================

create table public.attributes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  layer attr_layer not null,
  -- who may SEE it (owner-controlled). 'none' = hidden from everyone but may still be matchable.
  visible_to_tier tier not null default 'friend',
  -- whether the matchmaker may USE it (consent for AI matching).
  matchable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- Fast lookups: "all of this person's facts" and "everything matchable". ---
create index idx_attributes_owner on public.attributes (owner_id);
create index idx_attributes_owner_layer on public.attributes (owner_id, layer);
create index idx_attributes_matchable on public.attributes (owner_id) where matchable;

create trigger trg_attributes_updated_at
  before update on public.attributes
  for each row execute function public.set_updated_at();

-- --- SECURITY: RLS on; the tier-aware read policy is added in 0012. ---
alter table public.attributes enable row level security;
