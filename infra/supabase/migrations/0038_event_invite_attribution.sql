-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Remembers who invited each guest to an event.
--
-- When the host invites someone, invited_by stays empty (null = host invite).
-- When an attendee invites a friend (friends-can-invite is on), we store that
-- attendee's user id so the host's going/invited lists can say "invited by Jade"
-- or "brought by Sam" instead of a separate "brought" count on the event page.
-- ============================================

-- THIS SECTION DOES: add who-invited-this-guest (null means the host did).
alter table public.event_invites
  add column if not exists invited_by uuid references public.users (id) on delete set null;

-- THIS SECTION DOES: speed up "who did this person bring?" lookups.
create index if not exists idx_event_invites_invited_by
  on public.event_invites (invited_by)
  where invited_by is not null;

-- THIS SECTION DOES: plain-English note for future readers.
comment on column public.event_invites.invited_by is
  'User who invited this guest. Null means the host (or co-host acting as host) invited them.';
