-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Lays the groundwork for the whole database:
--   1. Turns on pgvector (lets us store AI "embeddings" for matching).
--   2. Creates the fixed lists of allowed values ("enums") used everywhere —
--      the most important being `tier`, defined so that close > friend >
--      acquaintance > none. That ordering is what lets the privacy rules ask
--      "is this viewer's tier high enough to see this?" with a simple compare.
--   3. Adds a small reusable trigger that stamps `updated_at` whenever a row
--      changes, so we always know how fresh a row is.
-- No tables yet — this is just the vocabulary the rest of the schema speaks.
-- ============================================

-- --- pgvector: the AI embedding storage used by matching (Zone C) ---
-- Installed into the `extensions` schema (not public) per Supabase best practice.
create extension if not exists vector with schema extensions;

-- --- The tier ladder. Order matters: later = closer. 'none' = private-but-matchable. ---
create type tier as enum ('none', 'acquaintance', 'friend', 'close');

-- --- Which of the three depth layers a fact belongs to ---
create type attr_layer as enum ('essential', 'profile', 'connection');

-- --- Relationships ---
create type connection_status as enum ('pending', 'accepted');
create type made_via as enum ('link', 'qr', 'add', 'suggestion');
create type met_context as enum ('event', 'place', 'mutual', 'qr', 'link');
create type friend_note_kind as enum ('text', 'date');

-- --- Content ---
create type media_kind as enum ('photo', 'video', 'audio');
create type story_type as enum ('photo', 'video');
create type reaction_kind as enum ('circleVideo', 'text', 'sticker');

-- --- Events ---
create type event_invite_status as enum ('going', 'cant', 'invited');

-- --- Touch grass timing ---
create type touch_grass_when as enum ('now', 'tonight', 'weekend');

-- --- Membership & plan ---
create type coop_plan as enum ('free', 'coop');
create type storage_plan as enum ('rolling30', 'unlimited');
create type summary_cadence as enum ('weekly', 'daily');
-- Only one kind of payment exists: the annual co-op dues (no standalone SKUs).
create type payment_kind as enum ('coop_dues');

-- --- Quizzes & delights ---
create type quiz_status as enum ('live', 'draft', 'archived');
create type quiz_question_type as enum ('single', 'multi');
create type delight_scope as enum ('global', 'opt-in', 'gift');

-- --- Reusable trigger: keep `updated_at` current on every row change ---
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
