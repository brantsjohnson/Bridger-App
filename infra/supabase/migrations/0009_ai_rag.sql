-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the AI layer (Zone C). These are DERIVED from a person's matchable
-- facts and contain NO names, photos, or contact info.
--   person_embeddings - a math "fingerprint" of someone's matchable facts, used
--        to find similar people by meaning. Deleted the instant someone turns
--        off Discoverable, and on account deletion.
--   person_summaries  - a short de-identified blurb ("early riser, climbs,
--        values deep 1:1s") written only from the user's own words. maybe_stale
--        flags when facts changed so we can nudge "still into X?".
--
-- PRIVACY: both are keyed by opaque user id and are safe to feed to matching.
-- Names/faces are re-joined only on the user's device at display time.
--
-- EMBEDDING SIZE: 1536 matches OpenAI text-embedding-3-small. If INFRASTRUCTURE.md
-- pins a different model, change vector(1536) and rebuild the index.
-- ============================================

-- --- The vector fingerprint used to retrieve "who is similar to whom." ---
create table public.person_embeddings (
  user_id uuid primary key references public.users (id) on delete cascade,
  embedding vector(1536),
  model text,
  updated_at timestamptz not null default now()
);

-- --- Approximate-nearest-neighbor index (cosine distance) for fast retrieval. ---
create index idx_person_embeddings_hnsw
  on public.person_embeddings
  using hnsw (embedding vector_cosine_ops);

create trigger trg_person_embeddings_updated_at
  before update on public.person_embeddings
  for each row execute function public.set_updated_at();

-- --- The de-identified summary blurb. maybe_stale drives the "still into X?" nudge. ---
create table public.person_summaries (
  user_id uuid primary key references public.users (id) on delete cascade,
  summary_text text,
  maybe_stale boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger trg_person_summaries_updated_at
  before update on public.person_summaries
  for each row execute function public.set_updated_at();

-- SECURITY: RLS on. These are server-only (matching runs with the service key);
-- no end-user policy is added, so clients cannot read Zone C directly.
alter table public.person_embeddings enable row level security;
alter table public.person_summaries enable row level security;
