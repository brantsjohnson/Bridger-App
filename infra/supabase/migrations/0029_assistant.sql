-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds the opt-in relationship Assistant:
--   user_settings.assistant_enabled  - personal opt-in (off by default)
--   admin_config.assistant           - who may see it + per-tool kill switches
--   assistant_sessions / turns       - ephemeral chat (discarded on close)
--   assistant_activity_log           - plain-language act history + undo
--   assistant_memory_chunks          - private per-user RAG (NOT Zone C matching)
--
-- PRIVACY: service-role only for assistant tables. Context is the user's own
-- visible data. Sessions are deleted when the user turns Assistant off.
-- ============================================

alter table public.user_settings
  add column if not exists assistant_enabled boolean not null default false;

alter table public.admin_config
  add column if not exists assistant jsonb not null default '{
    "access":"founder_only",
    "tools":{
      "recall_friend":true,
      "search_notes":true,
      "list_upcoming":true,
      "who_to_reconnect":true,
      "save_note":false,
      "set_reminder":false,
      "draft_message":false,
      "draft_event":false,
      "add_calendar_entry":false,
      "suggest_reconnect_nudge":false
    },
    "allowlist":[]
  }'::jsonb;

-- Backfill existing admin_config rows that predate the column default on insert.
update public.admin_config
set assistant = '{
  "access":"founder_only",
  "tools":{
    "recall_friend":true,
    "search_notes":true,
    "list_upcoming":true,
    "who_to_reconnect":true,
    "save_note":false,
    "set_reminder":false,
    "draft_message":false,
    "draft_event":false,
    "add_calendar_entry":false,
    "suggest_reconnect_nudge":false
  },
  "allowlist":[]
}'::jsonb
where assistant is null;

create table public.assistant_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'open'
    check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index idx_assistant_sessions_user
  on public.assistant_sessions (user_id, status);

create table public.assistant_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assistant_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  -- PRIVACY: live session only; never copied to analytics.
  content text not null,
  tool_name text,
  created_at timestamptz not null default now()
);
create index idx_assistant_turns_session
  on public.assistant_turns (session_id, created_at);

create table public.assistant_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  tool text not null,
  summary text not null,
  undo_payload jsonb,
  created_at timestamptz not null default now(),
  undone_at timestamptz
);
create index idx_assistant_activity_user
  on public.assistant_activity_log (user_id, created_at desc);

create table public.assistant_memory_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null,
  ref_id text,
  text text not null,
  embedding vector(1536),
  updated_at timestamptz not null default now()
);
create index idx_assistant_memory_user
  on public.assistant_memory_chunks (user_id);
create trigger trg_assistant_memory_chunks_updated_at
  before update on public.assistant_memory_chunks
  for each row execute function public.set_updated_at();

-- Pending act proposals waiting for an explicit confirm tap.
create table public.assistant_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  session_id uuid references public.assistant_sessions (id) on delete cascade,
  tool text not null,
  preview text not null,
  args jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.assistant_sessions enable row level security;
alter table public.assistant_turns enable row level security;
alter table public.assistant_activity_log enable row level security;
alter table public.assistant_memory_chunks enable row level security;
alter table public.assistant_proposals enable row level security;

-- When Assistant is turned off, purge open sessions (turns cascade).
create or replace function public.purge_assistant_on_disable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assistant_enabled = false
     and (old.assistant_enabled is distinct from false) then
    delete from public.assistant_turns
      where session_id in (
        select id from public.assistant_sessions
        where user_id = new.user_id and status = 'open'
      );
    update public.assistant_sessions
      set status = 'closed', closed_at = now()
      where user_id = new.user_id and status = 'open';
    delete from public.assistant_proposals
      where user_id = new.user_id and status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_purge_assistant_on_disable on public.user_settings;
create trigger trg_purge_assistant_on_disable
  after update of assistant_enabled on public.user_settings
  for each row execute function public.purge_assistant_on_disable();
