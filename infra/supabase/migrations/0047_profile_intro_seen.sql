-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds one flag, `profile_intro_seen`, to each person's settings row. It marks
-- whether they already tapped through the one-time Profile welcome screen
-- ("Hell yeah"). Once true, the Profile tab never shows that intro again.
--
-- WHY IT LIVES HERE: `user_settings` already holds per-account switches
-- (onboarding_complete, discoverable, etc.), so this belongs beside them.
-- It defaults to false so every brand-new account sees the intro once.
--
-- SECURITY: `user_settings` already has RLS with a "you may only touch your
-- own row" policy (see 0012), so no new policy is needed. The Nest API writes
-- it with the service key on the user's behalf.
-- ============================================

alter table public.user_settings
  add column if not exists profile_intro_seen boolean not null default false;

comment on column public.user_settings.profile_intro_seen is
  'True after the one-time Profile welcome intro was dismissed. Hard-deleted with the account.';
