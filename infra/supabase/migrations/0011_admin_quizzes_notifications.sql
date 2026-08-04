-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Creates the back-office + quiz + notification tables:
--   admin_config       - global knobs: the Home defaults, which quiz is "live",
--                        and themed prompts. One row, edited from the admin console.
--   quiz_registry      - the catalog of quizzes (slug, title, live/draft/archived,
--                        which week it's live, how many friends have taken it).
--   quizzes            - a quiz's design: its goal, the dimensions it measures,
--                        the moderator instructions, and how it adapts.
--   quiz_questions     - the questions, their choices (with dimension weights),
--                        and whether an "explain your answer" box is allowed.
--   quiz_responses     - a person's raw answers.
--   quiz_results       - the scored outcome that feeds attributes -> matching.
--   coop_announcements - co-op notices.
--   delights           - toggles for the little surprise/easter-egg moments.
--   notifications      - the per-user notification feed.
-- ============================================

-- --- Global settings, edited by admins. Kept to a single row in practice. ---
create table public.admin_config (
  id uuid primary key default gen_random_uuid(),
  home_defaults jsonb not null default '{}'::jsonb,
  live_quiz_slug text,
  themed_prompts jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger trg_admin_config_updated_at
  before update on public.admin_config
  for each row execute function public.set_updated_at();

-- --- The catalog of quizzes. slug is the human-readable id used elsewhere. ---
create table public.quiz_registry (
  slug text primary key,
  title text not null,
  status quiz_status not null default 'draft',
  live_week text,
  friends_taken_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- --- A quiz's design/blueprint. ---
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  version integer not null default 1,
  goal text,
  dimensions jsonb not null default '[]'::jsonb,
  moderator_instructions text,
  adaptation_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- --- The questions in a quiz. options carries labels + per-dimension weights. ---
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  prompt text not null,
  type quiz_question_type not null default 'single',
  options jsonb not null default '[]'::jsonb,
  allow_explain boolean not null default false
);
create index idx_quiz_questions_quiz on public.quiz_questions (quiz_id);

-- --- A person's raw answers to a quiz. ---
create table public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  selected_option_ids jsonb not null default '[]'::jsonb,
  explain_text text,
  created_at timestamptz not null default now()
);
create index idx_quiz_responses_user on public.quiz_responses (user_id);
create index idx_quiz_responses_quiz on public.quiz_responses (quiz_id);

-- --- The scored result. One per person per quiz. Feeds attributes -> matching. ---
create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  dimension_scores jsonb not null default '{}'::jsonb,
  confidence jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  unique (user_id, quiz_id)
);

-- --- Co-op announcements shown in the app. ---
create table public.coop_announcements (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  published_at timestamptz
);

-- --- Toggles for surprise/delight moments. schedule holds timing rules. ---
create table public.delights (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default false,
  scope delight_scope not null default 'global',
  schedule jsonb not null default '{}'::jsonb
);

-- --- The per-user notification feed. payload carries the specifics per kind. ---
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications (user_id, read);

-- SECURITY: RLS on. Admin/quiz-config tables are server-managed; per-user
-- policies for responses/results/notifications are added in 0012.
alter table public.admin_config enable row level security;
alter table public.quiz_registry enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_responses enable row level security;
alter table public.quiz_results enable row level security;
alter table public.coop_announcements enable row level security;
alter table public.delights enable row level security;
alter table public.notifications enable row level security;
