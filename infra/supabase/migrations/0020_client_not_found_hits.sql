-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Stores every time someone lands on the Magic Patterns 404 ("Fucks not
-- found") or a broken connection path. The app posts the route trail; the
-- admin console ("Broken paths") reads it so we can see how people got there.
--
-- PRIVACY: path strings only — no names, messages, or other content.
-- SECURITY: RLS on with NO client policies on purpose — same pattern as
-- person_embeddings / person_summaries. Only the Nest service role (which
-- bypasses RLS) may write or read. The mobile app talks to Nest, not this
-- table directly.
-- ============================================

create table if not exists public.client_not_found_hits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- The path that did not resolve (or the screen that failed).
  missing_path text not null,
  -- Recent routes leading here, oldest → newest. No query strings / PII.
  path_trail text[] not null default '{}'::text[],
  reason text not null default 'unmatched_route'
    check (reason in ('unmatched_route', 'connection_error', 'runtime_error')),
  platform text,
  app_version text,
  -- Opaque session id only — never email or name.
  session_id text
);

create index if not exists idx_client_not_found_hits_created
  on public.client_not_found_hits (created_at desc);

-- SECURITY: RLS on; no policies = clients cannot touch these rows.
alter table public.client_not_found_hits enable row level security;
