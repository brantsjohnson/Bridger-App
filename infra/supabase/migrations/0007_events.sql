-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the events tables:
--   events        - a gathering someone hosts: title, bio, when, where, what to
--                   bring, an optional "chip in" money note (peer-to-peer handles
--                   only - we never process payments), whether friends can invite
--                   friends, and the guest cap (35 free, 100 for co-op).
--   event_invites - one row per guest: going / can't / invited, plus optional
--                   allergy info that only the host can see.
--   event_intros  - "you two should meet" intros the host sets up between guests.
--
-- It also connects the two event references left open earlier:
-- connections.met_event_id ("we met at this event") and quips.context_event_id.
-- ============================================

-- --- A gathering. chip_in holds {amount, note, methods:[{kind,handle}]} as jsonb. ---
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users (id) on delete cascade,
  co_host_ids uuid[] not null default '{}',
  title text not null,
  bio text,
  starts_at timestamptz,
  address text,
  place text,
  bring text,
  chip_in jsonb,
  allow_friends_invite boolean not null default false,
  cap integer not null default 35,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_events_host on public.events (host_id);
create index idx_events_starts on public.events (starts_at);
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- --- Back-fill the event foreign keys that couldn't be created before events existed. ---
alter table public.connections
  add constraint fk_connections_met_event
  foreign key (met_event_id) references public.events (id) on delete set null;
alter table public.quips
  add constraint fk_quips_context_event
  foreign key (context_event_id) references public.events (id) on delete set null;

-- --- One RSVP per person per event. allergies_* are host-only, opt-in. ---
create table public.event_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  status event_invite_status not null default 'invited',
  allergies_optin boolean not null default false,
  allergies_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index idx_event_invites_event on public.event_invites (event_id);
create index idx_event_invites_user on public.event_invites (user_id);
create trigger trg_event_invites_updated_at
  before update on public.event_invites
  for each row execute function public.set_updated_at();

-- --- Host-made "you two should meet" intros between two guests, with a reason. ---
create table public.event_intros (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  a uuid not null references public.users (id) on delete cascade,
  b uuid not null references public.users (id) on delete cascade,
  why text,
  created_at timestamptz not null default now(),
  check (a <> b)
);
create index idx_event_intros_event on public.event_intros (event_id);

-- SECURITY: RLS on (policies in 0012).
alter table public.events enable row level security;
alter table public.event_invites enable row level security;
alter table public.event_intros enable row level security;
