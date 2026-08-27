-- ============================================
-- WHAT THIS FILE DOES (plain English):
-- Queued Bridger messages the Assistant schedules after you approve the
-- full draft AND the exact send time. Cancelable until they fire.
-- Hard-delete cascades with the account.
-- ============================================

create table if not exists public.assistant_scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  person_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  send_at timestamptz not null,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'cancelled', 'failed')),
  activity_id uuid references public.assistant_activity_log (id) on delete set null,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  sent_at timestamptz
);

create index if not exists assistant_scheduled_messages_due_idx
  on public.assistant_scheduled_messages (send_at)
  where status = 'queued';

create index if not exists assistant_scheduled_messages_user_idx
  on public.assistant_scheduled_messages (user_id);

alter table public.assistant_scheduled_messages enable row level security;

-- Owner can read their own scheduled rows (service role writes via Nest).
create policy assistant_scheduled_messages_select_own
  on public.assistant_scheduled_messages
  for select
  using (auth.uid() = user_id);
