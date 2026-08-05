-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Extends private friend notes so you can set a "check in sometimes" nudge
-- (no calendar date). Adds check_in to the kind enum, plus cadence and when
-- the next soft reminder should fire. Author-only RLS stays as-is.
-- ============================================

-- Allow a third kind of private note: occasional check-in (no fixed date).
alter type public.friend_note_kind add value if not exists 'check_in';

-- How often to nudge (check_in only). Null for text / date notes.
alter table public.friend_notes
  add column if not exists cadence text
    check (cadence is null or cadence in ('week', 'biweek', 'month'));

-- When the next soft reminder should fire (check_in). Null until scheduled.
alter table public.friend_notes
  add column if not exists next_remind_at timestamptz;

comment on column public.friend_notes.cadence is
  'check_in only: week | biweek | month. Author-private.';
comment on column public.friend_notes.next_remind_at is
  'check_in only: next soft nudge time. Advanced after each fire.';

-- Speeds up "which check-ins are due?" for the author.
create index if not exists idx_friend_notes_author_next_remind
  on public.friend_notes (author_id, next_remind_at)
  where kind = 'check_in' and next_remind_at is not null;
