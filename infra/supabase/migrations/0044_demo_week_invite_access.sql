-- ============================================
-- Demo week invite access (TestFlight closed beta).
-- Seed users invite friends to unlock the app; invitees may use Bridger but
-- cannot create invite links until demo week ends.
-- ============================================

alter table public.user_settings
  add column if not exists can_invite boolean not null default true,
  add column if not exists demo_invite_sent_at timestamptz;

comment on column public.user_settings.can_invite is
  'When false during demo week, this person cannot create invite links (typically joined via someone else invite).';

comment on column public.user_settings.demo_invite_sent_at is
  'When set during demo week, this person sent an invite to unlock app access.';

alter table public.admin_config
  add column if not exists demo_week jsonb not null default '{"enabled":false,"starts_at":null,"ends_at":null}'::jsonb;

comment on column public.admin_config.demo_week is
  'Closed-beta window: enabled flag plus optional ISO starts_at / ends_at bounds.';
