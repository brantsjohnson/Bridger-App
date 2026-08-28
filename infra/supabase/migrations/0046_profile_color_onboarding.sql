-- ============================================
-- WHAT THIS FILE DOES (plain English):
-- Stores three onboarding answers that used to be silently dropped by the
-- settings API: the personal grid-line tint, nights-out social battery, and
-- friends-of-friends connection style picks.
-- ============================================

-- THIS SECTION DOES: add the three new columns on user_settings.
alter table public.user_settings
  add column if not exists profile_color text,
  add column if not exists social_battery integer,
  add column if not exists connection_style jsonb;

-- THIS SECTION DOES: keep profile_color as a hex like #RRGGBB (or null).
alter table public.user_settings
  drop constraint if exists user_settings_profile_color_hex;
alter table public.user_settings
  add constraint user_settings_profile_color_hex
  check (
    profile_color is null
    or profile_color ~ '^#[0-9A-Fa-f]{6}$'
  );

-- THIS SECTION DOES: keep social_battery in the 0..7 range the onboarding slider uses.
alter table public.user_settings
  drop constraint if exists user_settings_social_battery_range;
alter table public.user_settings
  add constraint user_settings_social_battery_range
  check (
    social_battery is null
    or (social_battery >= 0 and social_battery <= 7)
  );

comment on column public.user_settings.profile_color is
  'Personal SynthGrid line tint (#RRGGBB). Null = default purple.';
comment on column public.user_settings.social_battery is
  'Nights out per week from onboarding (0..7; 7 means 7+). Own pacing only.';
comment on column public.user_settings.connection_style is
  'Opaque FoF matching style keys from onboarding (humor, values, …).';
