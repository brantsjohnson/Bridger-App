-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Stores every time someone lands on the Magic Patterns 404 ("Fucks not
-- found") or a broken connection path. The app posts the route trail; the
-- admin console reads it so we can see how people got there.
-- PRIVACY: path strings only — no names, messages, or other content.
-- SECURITY: RLS on; no client policies — only the Nest service role writes/reads.
-- ============================================

create table if not exists public.client_not_found_hits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  missing_path text not null,
  path_trail text[] not null default '{}'::text[],
  reason text not null default 'unmatched_route'
    check (reason in ('unmatched_route', 'connection_error', 'runtime_error')),
  platform text,
  app_version text,
  session_id text
);

create index if not exists idx_client_not_found_hits_created
  on public.client_not_found_hits (created_at desc);

alter table public.client_not_found_hits enable row level security;
