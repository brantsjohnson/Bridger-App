-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the tables that describe how people are connected, plus the small
-- helper functions the privacy rules use.
--
--   tiers            - how YOU privately sort someone (close/friend/acquaintance).
--                      This is per-viewer: it's the OWNER's sorting of a viewer
--                      that decides what that viewer can see.
--   connections      - an accepted (or pending) link between two people, plus
--                      the optional, coarse "how we met" context.
--   blocks           - a hard wall: hidden both ways, and the blocked person is
--                      a hole in the blocker's graph for suggestions.
--   suggestion_skips - a soft "don't suggest this person to me again."
--   invite_links     - a share link that adds you as a friend.
--   qr_tokens        - the same idea as a scannable code.
--   friend_notes     - private reminders you keep about a friend (author-only).
--
-- HELPERS (used by RLS in 0012):
--   viewer_tier(owner, viewer) - how the owner has tiered the viewer.
--   is_blocked(a, b)           - is there a block either direction?
--   can_view(owner, required)  - may the current logged-in user see something
--                                the owner shared at `required` tier?
-- ============================================

-- --- How you privately sort another person. 'none' is not allowed here. ---
create table public.tiers (
  user_id uuid not null references public.users (id) on delete cascade,   -- the viewer doing the sorting
  other_id uuid not null references public.users (id) on delete cascade,  -- the person being sorted
  tier tier not null check (tier <> 'none'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, other_id)
);
create index idx_tiers_other on public.tiers (other_id);
create trigger trg_tiers_updated_at
  before update on public.tiers
  for each row execute function public.set_updated_at();

-- --- A link between two people. met_event_id FK is added once events exist (0007). ---
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.users (id) on delete cascade,
  user_b uuid not null references public.users (id) on delete cascade,
  status connection_status not null default 'pending',
  made_via made_via,
  mutual_friend_id uuid references public.users (id) on delete set null,
  -- "How we met" = coarse, opt-in, visible only to the two people (Zone A PII).
  met_context met_context,
  met_event_id uuid,
  met_place_label text,
  met_approx_geo text,
  met_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_a <> user_b)
);
create unique index uq_connections_pair on public.connections (least(user_a, user_b), greatest(user_a, user_b));
create index idx_connections_user_a on public.connections (user_a);
create index idx_connections_user_b on public.connections (user_b);
create trigger trg_connections_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

-- --- A hard block. Unblockable per FRIENDS.md is handled in app logic; here it just exists. ---
create table public.blocks (
  blocker_id uuid not null references public.users (id) on delete cascade,
  blocked_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index idx_blocks_blocked on public.blocks (blocked_id);

-- --- Soft "don't suggest again." One-directional. (column names follow DATA.md) ---
create table public.suggestion_skips (
  blocker_id uuid not null references public.users (id) on delete cascade,  -- the user who skipped
  skipped_id uuid not null references public.users (id) on delete cascade,  -- the person to stop suggesting
  created_at timestamptz not null default now(),
  primary key (blocker_id, skipped_id),
  check (blocker_id <> skipped_id)
);

-- --- Share-a-link to add you. Token is the primary key so it's the lookup value. ---
create table public.invite_links (
  token text primary key,
  owner_id uuid not null references public.users (id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_invite_links_owner on public.invite_links (owner_id);

-- --- Scannable QR version of the same idea. ---
create table public.qr_tokens (
  token text primary key,
  owner_id uuid not null references public.users (id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_qr_tokens_owner on public.qr_tokens (owner_id);

-- --- Private notes you keep about a friend (only you can read them). ---
create table public.friend_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  person_id uuid not null references public.users (id) on delete cascade,
  kind friend_note_kind not null default 'text',
  text text,
  date date,
  remind boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_friend_notes_author on public.friend_notes (author_id);
create trigger trg_friend_notes_updated_at
  before update on public.friend_notes
  for each row execute function public.set_updated_at();

-- ============================================
-- HELPER FUNCTIONS the privacy rules rely on.
-- SECURITY DEFINER so RLS policies can call them without recursive RLS checks;
-- search_path pinned to public to avoid hijacking.
-- ============================================

-- How the owner has tiered the current viewer (null = not sorted / no relationship).
create or replace function public.viewer_tier(p_owner uuid, p_viewer uuid)
returns tier
language sql
stable
security definer
set search_path = public
as $$
  select t.tier
  from public.tiers t
  where t.user_id = p_owner and t.other_id = p_viewer
  limit 1;
$$;

-- Is there a block in either direction between two people?
create or replace function public.is_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;

-- May the current logged-in user see something the owner shared at `p_required`?
-- Owner always sees own rows. 'none' is visible to no one. Blocks always deny.
-- Otherwise the viewer's tier (as set by the owner) must be at least `p_required`.
create or replace function public.can_view(p_owner uuid, p_required tier)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() = p_owner then true
    when p_required = 'none' then false
    when public.is_blocked(p_owner, auth.uid()) then false
    else coalesce(public.viewer_tier(p_owner, auth.uid()) >= p_required, false)
  end;
$$;

-- SECURITY: RLS on for every relationship table (policies in 0012).
alter table public.tiers enable row level security;
alter table public.connections enable row level security;
alter table public.blocks enable row level security;
alter table public.suggestion_skips enable row level security;
alter table public.invite_links enable row level security;
alter table public.qr_tokens enable row level security;
alter table public.friend_notes enable row level security;
