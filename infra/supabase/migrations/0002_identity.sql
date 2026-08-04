-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the "who you are" tables (Zone A = identity / personal info):
--   users          - one row per account, tied to Supabase's login system.
--   user_identity  - your display name, avatar, profile song (PII).
--   user_contacts  - email / phone (PII).
--   user_settings  - your switches: discoverable, notifications, home city
--                    (city only, never a street address), how far you'll meet.
--
-- PRIVACY: `users.id` is the same id Supabase Auth uses, and it is wired with
-- "on delete cascade". That single line is what makes account deletion real:
-- delete the login and every table below (and later, everything keyed to the
-- user) disappears with it. Nothing is kept behind.
-- ============================================

-- --- The account. `id` mirrors Supabase Auth so login and data are one identity. ---
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  auth_provider text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- --- Your public face: name, avatar, profile song. avatar_media_id FK added with media. ---
create table public.user_identity (
  user_id uuid primary key references public.users (id) on delete cascade,
  display_name text,
  avatar_media_id uuid,
  profile_song text,
  updated_at timestamptz not null default now()
);
create trigger trg_user_identity_updated_at
  before update on public.user_identity
  for each row execute function public.set_updated_at();

-- --- Contact details. Supabase Auth is the source of truth; mirrored here for joins. ---
create table public.user_contacts (
  user_id uuid primary key references public.users (id) on delete cascade,
  email text,
  phone text,
  updated_at timestamptz not null default now()
);
create trigger trg_user_contacts_updated_at
  before update on public.user_contacts
  for each row execute function public.set_updated_at();

-- --- Your switches. meet_scope = how far the matchmaker may look. ---
create table public.user_settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  discoverable boolean not null default true,
  notif_prefs jsonb not null default '{}'::jsonb,
  home_city text,
  meet_scope text not null default 'nearby' check (meet_scope in ('nearby', 'anywhere')),
  theme text,
  locale text,
  updated_at timestamptz not null default now()
);
create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- --- SECURITY: turn on row-level security. Policies are added in 0012. ---
-- (With RLS on and no policy yet, only the server's service key can read/write,
--  which is a safe default until the tier policies land.)
alter table public.users enable row level security;
alter table public.user_identity enable row level security;
alter table public.user_contacts enable row level security;
alter table public.user_settings enable row level security;
