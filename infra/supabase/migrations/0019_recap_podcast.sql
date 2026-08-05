-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Builds the Weekly Recap Podcast. Everyone answers the same 5 short questions
-- by voice; the answers stitch into one "podcast" on the Friends tab.
--
-- Tables:
--   recap_weeks             - one week of 5 questions (admin-hosted, rotating).
--   recap_questions         - the 5 prompts for a week, in order (0-4).
--   recap_submitted_questions - questions friends suggest for a future week.
--   recap_question_votes    - one upvote per person on a submitted question.
--   recap_answers           - a person's recorded audio answer to one question.
--
-- RETENTION (rolling 7 days, per person):
--   Each answer has `expires_at`. Non-co-op members' answers expire 7 days after
--   recording and are purged (audio deleted). Co-op members keep theirs
--   (expires_at stays null) and the server also archives them into the Profile
--   stories calendar so they can relisten. A person can only re-record once
--   their previous answers have expired (enforced in the API).
-- ============================================

-- --- Let a story hold an audio clip (used to archive co-op members' recaps). ---
-- Safe to add; not used within this migration's transaction.
alter type public.story_type add value if not exists 'audio';

-- --- One week of recap questions. ---
create table if not exists public.recap_weeks (
  id uuid primary key default gen_random_uuid(),
  week_of text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_recap_weeks_active
  on public.recap_weeks (active);

-- --- The 5 prompts for a week (index 0-4). ---
create table if not exists public.recap_questions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.recap_weeks (id) on delete cascade,
  idx int not null check (idx between 0 and 4),
  text text not null,
  -- Where the prompt came from: admin-set or a friend's submission.
  source text not null default 'admin' check (source in ('admin', 'submitted')),
  author_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (week_id, idx)
);
create index if not exists idx_recap_questions_week
  on public.recap_questions (week_id);

-- --- Questions friends suggest for a future week. ---
create table if not exists public.recap_submitted_questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  text text not null,
  votes int not null default 0,
  used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_recap_submitted_questions_created
  on public.recap_submitted_questions (created_at desc);

-- --- One upvote per person on a submitted question. ---
create table if not exists public.recap_question_votes (
  question_id uuid not null references public.recap_submitted_questions (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, user_id)
);

-- --- A person's recorded answer to one question. ---
create table if not exists public.recap_answers (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.recap_weeks (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  question_index int not null check (question_index between 0 and 4),
  -- The recorded clip lives in media (kind = 'audio').
  media_id uuid references public.media (id) on delete cascade,
  -- Clip length in seconds, for the scrubber + progress dots (~45s max).
  duration_seconds int not null default 0,
  visible_to_tier tier not null default 'friend',
  created_at timestamptz not null default now(),
  -- Rolling window: when this clip stops being listenable. Null = kept (co-op).
  expires_at timestamptz,
  unique (week_id, author_id, question_index)
);
create index if not exists idx_recap_answers_week on public.recap_answers (week_id);
create index if not exists idx_recap_answers_author on public.recap_answers (author_id);
create index if not exists idx_recap_answers_expires on public.recap_answers (expires_at);

-- SECURITY: RLS on every table.
alter table public.recap_weeks enable row level security;
alter table public.recap_questions enable row level security;
alter table public.recap_submitted_questions enable row level security;
alter table public.recap_question_votes enable row level security;
alter table public.recap_answers enable row level security;

-- Weeks + questions are community-wide reads; writes are server-only (admin).
create policy recap_weeks_select on public.recap_weeks
  for select to authenticated using (true);
create policy recap_questions_select on public.recap_questions
  for select to authenticated using (true);

-- Submitted questions: anyone signed in can read; you may add your own.
create policy recap_submitted_questions_select on public.recap_submitted_questions
  for select to authenticated using (true);
create policy recap_submitted_questions_insert on public.recap_submitted_questions
  for insert to authenticated with check (author_id = auth.uid());

-- Votes: you manage only your own vote row.
create policy recap_question_votes_all on public.recap_question_votes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Answers: you hear an answer only if your tier is close enough AND it has not
-- expired (rolling window). You always see your own. You write only your own.
create policy recap_answers_select on public.recap_answers
  for select to authenticated
  using (
    author_id = auth.uid()
    or (
      (expires_at is null or expires_at > now())
      and public.can_view(author_id, visible_to_tier)
    )
  );
create policy recap_answers_insert on public.recap_answers
  for insert to authenticated with check (author_id = auth.uid());
create policy recap_answers_update on public.recap_answers
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy recap_answers_delete on public.recap_answers
  for delete to authenticated
  using (author_id = auth.uid());

-- --- Cleanup: purge expired, non-kept recap audio. Run on a schedule ---
-- (pg_cron or a scheduled edge function). Deleting the media row cascades the
-- answer via the media_id FK; we also remove any orphan answer rows.
create or replace function public.purge_expired_recaps()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Remove the audio media for expired answers; the answer row goes with it.
  delete from public.media m
  using public.recap_answers a
  where a.media_id = m.id
    and a.expires_at is not null
    and a.expires_at <= now();

  -- Belt-and-suspenders: drop any expired answers that had no media.
  delete from public.recap_answers
  where expires_at is not null and expires_at <= now();
end;
$$;

revoke execute on function public.purge_expired_recaps() from anon, public;
grant execute on function public.purge_expired_recaps() to service_role;
