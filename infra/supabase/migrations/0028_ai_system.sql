-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds the AI System tables:
--   ai_config          - per-job kill switch, model, temp, budget
--   ai_job_cost_log    - de-identified spend receipts (never prompt content)
--   ai_jobs            - async queue so user taps never wait on a model
--   week_summaries     - pre-generated Catch-Up week hero text
--   module_moderator_notes - Zone C notes from Discover modules
--   freshness_prompts  - the weekly "still into X?" pick
--
-- PRIVACY: RLS on, no client policies (service-role only), same as Zone C.
-- Agent jobs (11–13) seed enabled=false until the AGENT plan.
-- ============================================

-- --- Per-job live config (kill switch = enabled=false). ---
create table public.ai_config (
  job text primary key,
  lane text not null check (lane in ('deidentified', 'personal_agent')),
  model_id text not null,
  temperature double precision not null default 0,
  max_tokens integer not null default 0,
  timeout_ms integer not null default 10000,
  schema_id text,
  monthly_budget_usd double precision not null default 0,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger trg_ai_config_updated_at
  before update on public.ai_config
  for each row execute function public.set_updated_at();

-- --- Cost log: tokens and dollars only, never content. ---
create table public.ai_job_cost_log (
  id uuid primary key default gen_random_uuid(),
  job text not null references public.ai_config (job),
  prompt_version text,
  latency_ms integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_usd double precision not null default 0,
  subject_ref text not null,
  created_at timestamptz not null default now()
);
create index idx_ai_job_cost_log_job_created
  on public.ai_job_cost_log (job, created_at desc);

-- --- Async job queue. ---
create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  job text not null references public.ai_config (job),
  subject_ref text not null,
  content_hash text not null,
  payload_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'done', 'failed', 'dead')),
  attempts integer not null default 0,
  run_after timestamptz not null default now(),
  last_error text,
  result_json jsonb,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Idempotency: a completed (job, subject, hash) must not double-spend.
create unique index uq_ai_jobs_done_idempotent
  on public.ai_jobs (job, subject_ref, content_hash)
  where status = 'done';

create index idx_ai_jobs_poll
  on public.ai_jobs (status, run_after)
  where status in ('pending', 'failed');

-- --- Week summary for Catch-Up (words-only, pre-generated). ---
create table public.week_summaries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  week_start date not null,
  days_json jsonb not null default '{}'::jsonb,
  built_at timestamptz not null default now(),
  unique (author_id, week_start)
);
create index idx_week_summaries_author on public.week_summaries (author_id);

-- --- Zone C module moderator notes. ---
create table public.module_moderator_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  module_key text not null,
  notes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, module_key)
);
create trigger trg_module_moderator_notes_updated_at
  before update on public.module_moderator_notes
  for each row execute function public.set_updated_at();

-- --- Freshness quick-check pick (one active row per user). ---
create table public.freshness_prompts (
  user_id uuid primary key references public.users (id) on delete cascade,
  attribute_id uuid,
  question text,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

-- SECURITY: service-role only.
alter table public.ai_config enable row level security;
alter table public.ai_job_cost_log enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.week_summaries enable row level security;
alter table public.module_moderator_notes enable row level security;
alter table public.freshness_prompts enable row level security;

-- --- Seed registry (jobs 1–13). Agent jobs start disabled. ---
insert into public.ai_config
  (job, lane, model_id, temperature, max_tokens, timeout_ms, schema_id, monthly_budget_usd, enabled)
values
  ('transcription', 'deidentified', 'whisper-1', 0, 0, 30000, null, 50, true),
  ('day_summary', 'deidentified', 'claude-haiku-4-5-20251001', 0.4, 150, 10000, null, 40, true),
  ('week_summary', 'deidentified', 'claude-sonnet-4-20250514', 0.4, 600, 15000, 'week_summary', 80, true),
  ('quiz_moderator', 'deidentified', 'claude-sonnet-4-20250514', 0.2, 800, 10000, 'quiz_moderator', 100, true),
  ('module_notes', 'deidentified', 'claude-sonnet-4-20250514', 0.3, 300, 10000, 'module_notes', 40, true),
  ('person_summary', 'deidentified', 'claude-haiku-4-5-20251001', 0.3, 250, 10000, null, 40, true),
  ('embeddings', 'deidentified', 'text-embedding-3-small', 0, 0, 15000, null, 30, true),
  ('freshness', 'deidentified', 'claude-haiku-4-5-20251001', 0, 200, 10000, 'freshness', 20, true),
  ('voice_captions', 'deidentified', 'whisper-1', 0, 0, 30000, null, 30, true),
  ('recap_podcast', 'deidentified', 'none', 0, 0, 60000, null, 0, true),
  ('agent_reasoning', 'personal_agent', 'claude-sonnet-4-20250514', 0.3, 2000, 30000, null, 200, false),
  ('agent_query', 'personal_agent', 'claude-haiku-4-5-20251001', 0.2, 300, 10000, 'agent_query', 40, false),
  ('agent_voice', 'personal_agent', 'whisper-1', 0.4, 400, 30000, null, 80, false);

-- --- Opt-out of Discoverable drops Zone C derived rows (including new tables). ---
create or replace function public.drop_zone_c_on_undiscoverable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.discoverable = false and (old.discoverable is distinct from false) then
    delete from public.person_embeddings where user_id = new.user_id;
    delete from public.person_summaries where user_id = new.user_id;
    delete from public.module_moderator_notes where user_id = new.user_id;
    delete from public.freshness_prompts where user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_drop_zone_c_on_undiscoverable on public.user_settings;
create trigger trg_drop_zone_c_on_undiscoverable
  after update of discoverable on public.user_settings
  for each row execute function public.drop_zone_c_on_undiscoverable();
