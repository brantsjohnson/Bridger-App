-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds one flag, `onboarding_complete`, to each person's settings row. It marks
-- whether someone has finished the first-time setup run (the last onboarding
-- screen, "welcome-in", flips it to true). The app's root gate reads this to
-- decide: show the onboarding flow, or let them into Home.
--
-- WHY IT LIVES HERE: `user_settings` is where per-account switches already live
-- (discoverable, notification prefs, home layout), so this belongs beside them.
-- It defaults to false so every brand-new account starts in onboarding.
--
-- SECURITY: `user_settings` already has RLS with a "you may only touch your own
-- row" policy (see 0012), so no new policy is needed. The Nest API writes it
-- with the service key on the user's behalf.
-- ============================================

alter table public.user_settings
  add column if not exists onboarding_complete boolean not null default false;
