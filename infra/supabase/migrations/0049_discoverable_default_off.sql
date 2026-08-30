-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Discover matching stays OFF until someone taps Get started on the Discover
-- splash. New accounts used to land with discoverable=true, which skipped that
-- gate. This flips the column default to false so new people see the splash.
-- Existing rows keep whatever they already have.
-- ============================================

alter table public.user_settings
  alter column discoverable set default false;
