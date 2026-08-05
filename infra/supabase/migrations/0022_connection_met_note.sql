-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds a short freeform "how we met" note on a connection. Used when two people
-- connect through Discover (or anywhere else with no event / place to record) and
-- want a shared memory like "met at the farmers market booth."
--
-- PRIVACY: only the two people on the connection can see this (same as the
-- other how-you-met fields). It is never used by matching / AI, and never
-- sent to analytics.
-- ============================================

alter table public.connections
  add column if not exists met_note text;
