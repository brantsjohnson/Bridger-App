-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Lets an event repeat (weekly / monthly / yearly) by storing a small JSON
-- rule on the event. starts_at stays the next time it happens.
-- ============================================

alter table public.events
  add column if not exists recurrence jsonb;

comment on column public.events.recurrence is
  'Optional repeat rule: {freq, interval, by_weekday, by_monthday, by_setpos, until, count}. Null = one-off.';
