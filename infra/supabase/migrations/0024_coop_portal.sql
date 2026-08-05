-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the Co-op Portal tables (ideas, mission, economics, roles, dues vote,
-- beta voting, waitlist) so members can steer Bridger in the open. Public can
-- read; Nest (service role) handles member writes.
--
-- Seed: mission principles, economics assumptions, volunteer roles, and one
-- open beta version. Test access code for beta: BRIDGER-BETA
-- (hash = sha256 of "bridger-beta-salt:BRIDGER-BETA").
-- ============================================

-- Ideas CRM
create table if not exists public.coop_ideas (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  problem text,
  evidence text,
  drawbacks text,
  category text not null default 'other',
  status text not null default 'submitted',
  urgency text,
  impact text,
  cost_guess text,
  funding_model text,
  public boolean not null default false,
  support_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index if not exists idx_coop_ideas_public on public.coop_ideas (public, support_count desc);
create trigger trg_coop_ideas_updated_at
  before update on public.coop_ideas
  for each row execute function public.set_updated_at();

create table if not exists public.coop_idea_supports (
  idea_id uuid not null references public.coop_ideas (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create table if not exists public.coop_idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.coop_ideas (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Beta
create table if not exists public.coop_beta_versions (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  access_code_hash text not null,
  release_notes text,
  known_issues text,
  unfinished text,
  test_url text,
  status text not null default 'open',
  round_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.coop_beta_votes (
  version_id uuid not null references public.coop_beta_versions (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  choice text not null,
  created_at timestamptz not null default now(),
  primary key (version_id, user_id)
);

create table if not exists public.coop_beta_unlocks (
  version_id uuid not null references public.coop_beta_versions (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (version_id, user_id)
);

-- Mission
create table if not exists public.coop_mission_principles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  body text not null,
  sort_order int not null default 0
);

create table if not exists public.coop_mission_supports (
  principle_id uuid not null references public.coop_mission_principles (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (principle_id, user_id)
);

-- Economics + roles
create table if not exists public.coop_economics_assumptions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  label text not null,
  monthly_cents int not null default 0,
  notes text,
  sort_order int not null default 0
);

create table if not exists public.coop_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  responsibilities text,
  hours_week text,
  risks text,
  sort_order int not null default 0
);

-- Dues preference (does not charge)
create table if not exists public.coop_dues_votes (
  user_id uuid primary key references public.users (id) on delete cascade,
  amount_cents int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_coop_dues_votes_updated_at
  before update on public.coop_dues_votes
  for each row execute function public.set_updated_at();

create table if not exists public.coop_waitlist (
  id uuid primary key default gen_random_uuid(),
  email_hmac text,
  user_id uuid references public.users (id) on delete cascade,
  interest text,
  created_at timestamptz not null default now()
);

-- SECURITY: RLS on; Nest uses service role for writes.
alter table public.coop_ideas enable row level security;
alter table public.coop_idea_supports enable row level security;
alter table public.coop_idea_comments enable row level security;
alter table public.coop_beta_versions enable row level security;
alter table public.coop_beta_votes enable row level security;
alter table public.coop_beta_unlocks enable row level security;
alter table public.coop_mission_principles enable row level security;
alter table public.coop_mission_supports enable row level security;
alter table public.coop_economics_assumptions enable row level security;
alter table public.coop_roles enable row level security;
alter table public.coop_dues_votes enable row level security;
alter table public.coop_waitlist enable row level security;

create policy coop_ideas_select on public.coop_ideas
  for select to authenticated
  using (public = true or author_id = auth.uid());
create policy coop_idea_supports_select on public.coop_idea_supports
  for select to authenticated using (true);
create policy coop_idea_comments_select on public.coop_idea_comments
  for select to authenticated using (true);
create policy coop_beta_versions_select on public.coop_beta_versions
  for select to authenticated using (true);
create policy coop_beta_votes_select on public.coop_beta_votes
  for select to authenticated using (true);
create policy coop_mission_principles_select on public.coop_mission_principles
  for select to anon, authenticated using (true);
create policy coop_mission_supports_select on public.coop_mission_supports
  for select to authenticated using (true);
create policy coop_economics_select on public.coop_economics_assumptions
  for select to anon, authenticated using (true);
create policy coop_roles_select on public.coop_roles
  for select to anon, authenticated using (true);
create policy coop_dues_votes_select on public.coop_dues_votes
  for select to authenticated using (true);

-- Seeds (idempotent via slug / label checks)
insert into public.coop_mission_principles (slug, title, body, sort_order)
select * from (values
  ('people-over-engagement', 'People over engagement', 'We optimize for real connection, not time-on-app.', 0),
  ('no-attention-traps', 'No attention traps', 'No vanity metrics, streaks, or dark patterns.', 1),
  ('one-member-one-vote', 'One member, one vote', 'Governance is equal. Dues do not buy extra votes.', 2),
  ('mission-cant-be-sold', 'The mission cannot be sold', 'Bridger stays a tool for you, not an ad machine.', 3),
  ('value-stays-with-members', 'Value stays with members', 'Surplus serves the community, not extractive growth.', 4),
  ('you-control-your-data', 'You control your data', 'Hard deletes. Matchable only when you opt in.', 5),
  ('transparency-by-default', 'Transparency by default', 'Books, roles, and roadmaps are public to read.', 6)
) as v(slug, title, body, sort_order)
where not exists (select 1 from public.coop_mission_principles limit 1);

insert into public.coop_economics_assumptions (category, label, monthly_cents, notes, sort_order)
select * from (values
  ('hosting', 'App hosting + DB', 12000, 'App Runner + Supabase', 0),
  ('ai', 'AI summaries + quiz', 8000, 'Words only; never photos', 1),
  ('storage', 'Media storage', 5000, 'Story + recap media', 2),
  ('email', 'Email + push', 2000, 'Resend + push provider', 3),
  ('legal', 'Legal + accounting', 4000, 'Annual amortized', 4),
  ('moderation', 'Moderation buffer', 3000, 'Human review capacity', 5)
) as v(category, label, monthly_cents, notes, sort_order)
where not exists (select 1 from public.coop_economics_assumptions limit 1);

insert into public.coop_roles (title, responsibilities, hours_week, risks, sort_order)
select * from (values
  ('Founder / CEO', 'Direction, fundraising stewardship, member communication', '20–40', 'Burnout; single point of failure', 0),
  ('Developer', 'Ship product, keep privacy invariants', '10–30', 'Scope creep', 1),
  ('Designer', 'Magic Patterns → product fidelity, accessibility', '5–15', 'Design debt', 2),
  ('Moderator', 'Reports, safety, community norms', '3–10', 'Emotional load', 3),
  ('Social / Marketing', 'Honest outreach; no growth hacks', '3–10', 'Misaligned incentives', 4)
) as v(title, responsibilities, hours_week, risks, sort_order)
where not exists (select 1 from public.coop_roles limit 1);

-- sha256('bridger-beta-salt:BRIDGER-BETA')
insert into public.coop_beta_versions (label, access_code_hash, release_notes, status, round_ends_at)
select
  'Beta 0.2',
  '134afb25ff93e4f923d7c89076b5ced67b7f87b0d507698dd351f6dc1324809b',
  'Friends, stories, events, and the co-op portal soft launch.',
  'open',
  now() + interval '7 days'
where not exists (select 1 from public.coop_beta_versions limit 1);
