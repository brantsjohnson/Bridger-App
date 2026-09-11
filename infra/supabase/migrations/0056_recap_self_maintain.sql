-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Lets the Friend Pod lock a new week every Monday without someone sitting
-- in admin. Each week remembers which Monday it belongs to, and whether a
-- person set it or the auto-lock did. Question source can now be a built-in
-- rose / thorn / bud prompt or an AI / bank fill-in. Also registers the
-- leftover-question AI job (it never sees a friend's typed question).
-- ============================================

-- THIS SECTION DOES: remember which Monday a week is for, and who locked it.
alter table public.recap_weeks
  add column if not exists week_start date,
  add column if not exists origin text not null default 'admin';

alter table public.recap_weeks
  drop constraint if exists recap_weeks_origin_check;
alter table public.recap_weeks
  add constraint recap_weeks_origin_check
  check (origin in ('admin', 'auto'));

-- Only one row may claim a given Monday (stops two locks racing).
create unique index if not exists recap_weeks_week_start_uidx
  on public.recap_weeks (week_start)
  where week_start is not null;

-- Stamp the current live week so we do not immediately replace it.
update public.recap_weeks
set week_start = (date_trunc('week', created_at at time zone 'utc'))::date
where active = true
  and week_start is null;

-- THIS SECTION DOES: allow built-in and AI fill-in sources on prompts.
alter table public.recap_questions
  drop constraint if exists recap_questions_source_check;
alter table public.recap_questions
  add constraint recap_questions_source_check
  check (source in ('admin', 'submitted', 'ai', 'builtin'));

create index if not exists idx_recap_submitted_questions_unused_votes
  on public.recap_submitted_questions (used, votes desc, created_at desc);

-- THIS SECTION DOES: add the leftover-question job when the AI table exists.
-- Some environments have Friend Pod tables but not ai_config yet. The week
-- still locks itself with the canned fill-in bank.
do $$
begin
  if to_regclass('public.ai_config') is null then
    return;
  end if;
  insert into public.ai_config
    (job, lane, model_id, temperature, max_tokens, timeout_ms, schema_id, monthly_budget_usd, enabled)
  values
    (
      'recap_week_fill',
      'deidentified',
      'claude-haiku-4-5-20251001',
      0.4,
      250,
      8000,
      'recap_week_fill',
      10,
      true
    )
  on conflict (job) do nothing;
end
$$;
