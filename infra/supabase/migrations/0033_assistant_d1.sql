-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Phase D1 for Bridge (the opt-in Assistant):
--   - session fill_state JSON for one-question-at-a-time slots
--   - playbook_id + playbook_version on turns and activity (which manual ran)
--   - admin tool flags for new act tools (all OFF by default)
-- ============================================

-- THIS SECTION DOES: let a live session remember what Bridge is filling in.
alter table public.assistant_sessions
  add column if not exists fill_state jsonb not null default '{}'::jsonb;

-- THIS SECTION DOES: stamp which playbook version ran on each turn.
alter table public.assistant_turns
  add column if not exists playbook_id text,
  add column if not exists playbook_version text;

-- THIS SECTION DOES: same stamp on the activity receipt when an act lands.
alter table public.assistant_activity_log
  add column if not exists playbook_id text,
  add column if not exists playbook_version text;

-- THIS SECTION DOES: merge new tools into admin_config.assistant.tools as OFF.
-- Existing keys stay as-is; missing keys get false so nothing new is live.
update public.admin_config
set assistant = jsonb_set(
  coalesce(assistant, '{}'::jsonb),
  '{tools}',
  coalesce(assistant->'tools', '{}'::jsonb) || '{
    "send_touch_grass": false,
    "schedule_message": false,
    "reply_message": false,
    "run_notification_triage": false,
    "take_quiz_voice": false,
    "attach_photo": false
  }'::jsonb,
  true
);
