-- ============================================
-- WHAT THIS FILE DOES (plain English):
-- Quizzes and weekly activities get the same kind of cover art events already
-- have: a photo (or emoji / color / text) that fills the whole card. Activities
-- also get a short "ends Sunday" label and a pickable emoji for the widget.
-- ============================================

-- --- Weekly activity: cover + display bits ---
alter table public.weekly_activities
  add column if not exists cover jsonb,
  add column if not exists emoji text,
  add column if not exists closes_in text;

-- --- Quiz catalog: cover + short description under the title ---
alter table public.quiz_registry
  add column if not exists cover jsonb,
  add column if not exists description text;
