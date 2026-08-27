-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Phase B of co-op profile customize:
--   1) Viewer "always show plain pages" preference on user_settings.
--   2) Nullable columns for future Code-tier CSS/HTML (admin-gated OFF;
--      no WebView renderer ships yet). Cascades when the account is deleted.
--   3) Admin storage knobs: included GB for co-op media + stub overage price.
-- Presentation Theme/Layout still live in profile_presentation jsonb from 0027.
-- ============================================

-- --- VIEWER PREF: standing "always original" for other people's pages. ---
alter table public.user_settings
  add column if not exists always_view_original boolean not null default false;

comment on column public.user_settings.always_view_original is
  'When true, this viewer always sees native (unstyled) profiles. Accessibility / taste.';

-- --- CODE TIER (later): store sanitized CSS/HTML when admin turns the flag on. ---
-- SECURITY: no client write path until PROFILE_CODE_TIER_ENABLED is true.
alter table public.user_settings
  add column if not exists profile_custom_css text,
  add column if not exists profile_custom_html jsonb,
  add column if not exists profile_custom_code_status text
    check (
      profile_custom_code_status is null
      or profile_custom_code_status in ('active', 'reverted')
    ),
  add column if not exists profile_custom_code_sanitized_at timestamptz;

comment on column public.user_settings.profile_custom_css is
  'Code-tier CSS (sanitized, scoped). Null until admin-gated Code tier ships.';
comment on column public.user_settings.profile_custom_html is
  'Code-tier HTML blocks (sanitized subset). Null until Code tier ships.';

-- --- STORAGE METER CONFIG: included allotment + soft overage price (stub). ---
alter table public.admin_config
  add column if not exists storage jsonb not null default '{
    "included_gb": 3,
    "overage_cents_per_gb": 99,
    "code_tier": "off"
  }'::jsonb;

update public.admin_config
set storage = '{
  "included_gb": 3,
  "overage_cents_per_gb": 99,
  "code_tier": "off"
}'::jsonb
where storage is null
   or storage = '{}'::jsonb;

comment on column public.admin_config.storage is
  'Co-op media storage: included_gb, overage_cents_per_gb (display stub), code_tier off|on.';
