-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds event cover art (emoji or photo) and a real Assignments table so guests
-- can snag "chips" / "drinks" items. The old freeform `bring` text column stays
-- unused for new events.
--
-- MEDIA EXCEPTION: event cover photos are one of the two upload exceptions
-- (with the profile photo). Matching never sees cover images.
-- ============================================

-- Cover art JSON: { kind: 'emoji', value, bg } or { kind: 'photo', mediaId, bannerText? }
alter table public.events
  add column if not exists cover jsonb;

-- Assignments sign-up list (replaces freeform bring for new events).
create table if not exists public.event_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  label text not null,
  assignee_id uuid references public.users (id) on delete set null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_event_assignments_event
  on public.event_assignments (event_id);

create trigger trg_event_assignments_updated_at
  before update on public.event_assignments
  for each row execute function public.set_updated_at();

alter table public.event_assignments enable row level security;

-- SECURITY: same visibility as the parent event (host, co-host, or invitee).
create policy event_assignments_select on public.event_assignments
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          e.host_id = auth.uid()
          or auth.uid() = any (e.co_host_ids)
          or exists (
            select 1 from public.event_invites ei
            where ei.event_id = e.id and ei.user_id = auth.uid()
          )
        )
    )
  );

-- Host / co-host add rows (Nest also inserts via service role).
create policy event_assignments_insert on public.event_assignments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))
    )
  );

-- Host/co-host can change any row; assignee can update their own claim/done.
create policy event_assignments_update on public.event_assignments
  for update to authenticated
  using (
    assignee_id = auth.uid()
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))
    )
  )
  with check (
    assignee_id = auth.uid()
    or assignee_id is null
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))
    )
  );

create policy event_assignments_delete on public.event_assignments
  for delete to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))
    )
  );
