-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Lets someone pick up onboarding exactly where they left off. It adds two
-- fields to each person's settings row:
--   `onboarding_step`  - the name of the screen they were last on (e.g.
--                        "social-battery"). Null once they finish or before
--                        they start.
--   `onboarding_draft` - a small snapshot of the answers they have typed so far
--                        (name, birthday, color, towns, invite slots, etc.),
--                        saved as JSON so a crash or force-quit never sends them
--                        back to the very first screen.
--
-- Each real answer is ALSO written to its normal home (identity, attributes,
-- settings) as they advance. This draft is only the "resume point" copy the
-- onboarding run reads on relaunch, and it is wiped the moment onboarding is
-- marked complete.
--
-- WHY IT LIVES HERE: `user_settings` already holds per-account onboarding state
-- (onboarding_complete), so the resume point belongs beside it. Both fields
-- default to null so brand-new accounts simply start at the beginning.
--
-- PRIVACY: the draft can contain the person's own onboarding answers (their
-- name, birthday, towns). It is their own row, protected by the existing
-- `user_settings` RLS "you may only touch your own row" policy (see 0012), and
-- it is hard-deleted with the account (and cleared on completion), so nothing
-- lingers. The Nest API writes it with the service key on the user's behalf.
-- ============================================

alter table public.user_settings
  add column if not exists onboarding_step text,
  add column if not exists onboarding_draft jsonb;

comment on column public.user_settings.onboarding_step is
  'Resume point: the last onboarding screen this person was on. Null before start / after finish. Cleared on completion; hard-deleted with the account.';

comment on column public.user_settings.onboarding_draft is
  'Resume snapshot: the in-progress onboarding answers (JSON) so a crash/force-quit does not restart the run. Cleared on completion; hard-deleted with the account.';
