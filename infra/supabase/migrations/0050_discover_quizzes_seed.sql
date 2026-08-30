-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Seeds the four Discover "Connect Over" quizzes so matching can find them:
-- Your Funny Bone (humor), Your Vibe (personality), What Gets You Going
-- (values), and The Friend Zone (attachment). Each gets a design row with
-- the dimensions matching uses, plus a registry row with the in-app title.
-- The weekly Home quiz still picks from admin_config.live_quiz_slug, so
-- these never leak into that surface. Re-run safe (on conflict do nothing).
-- ============================================

-- THIS SECTION DOES: insert the four quiz designs with fixed uuids so the
-- registry can point at them, and so re-runs do not create duplicates.
insert into public.quizzes (id, version, goal, dimensions)
values
  (
    'a1000000-0000-4000-8000-000000000001'::uuid,
    1,
    'Measure humor taste so friends who laugh alike can find each other.',
    '[
      {"key":"absurdity","label":"Absurd"},
      {"key":"edge","label":"Edgy"},
      {"key":"register","label":"Dry vs silly"},
      {"key":"craft","label":"Craft"},
      {"key":"irony","label":"Irony"},
      {"key":"breadth","label":"Range"}
    ]'::jsonb
  ),
  (
    'a1000000-0000-4000-8000-000000000002'::uuid,
    1,
    'Measure vibe traits so friends who click on personality can find each other.',
    '[
      {"key":"sociability","label":"Sociability"},
      {"key":"assertiveness","label":"Assertiveness"},
      {"key":"agreeableness","label":"Warmth"},
      {"key":"conscientiousness","label":"Follow-through"},
      {"key":"openness","label":"Openness"}
    ]'::jsonb
  ),
  (
    'a1000000-0000-4000-8000-000000000003'::uuid,
    1,
    'Measure values dials so friends who share priorities can find each other.',
    '[
      {"key":"adventure_stability","label":"Adventure vs stability"},
      {"key":"giving_striving","label":"Giving vs striving"},
      {"key":"hedonism","label":"Hedonism"}
    ]'::jsonb
  ),
  (
    'a1000000-0000-4000-8000-000000000004'::uuid,
    1,
    'Measure friendship attachment so friends who connect the same way can find each other.',
    '[
      {"key":"anxiety","label":"Reassurance need"},
      {"key":"avoidance","label":"Independence"}
    ]'::jsonb
  )
on conflict (id) do nothing;

-- THIS SECTION DOES: register each design under its internal slug with the
-- user-facing title. comparable=false (no who-got-who). web_takeable=false
-- (client-authored quizzes). status=live is fine: weekly UI uses live_quiz_slug.
insert into public.quiz_registry (
  slug,
  title,
  status,
  live_week,
  friends_taken_count,
  quiz_id,
  web_takeable,
  comparable,
  description
)
values
  (
    'humor',
    'Your Funny Bone',
    'live',
    null,
    0,
    'a1000000-0000-4000-8000-000000000001'::uuid,
    false,
    false,
    'What makes you laugh, and how you joke with friends.'
  ),
  (
    'personality',
    'Your Vibe',
    'live',
    null,
    0,
    'a1000000-0000-4000-8000-000000000002'::uuid,
    false,
    false,
    'How you show up with friends (private match signal).'
  ),
  (
    'values',
    'What Gets You Going',
    'live',
    null,
    0,
    'a1000000-0000-4000-8000-000000000003'::uuid,
    false,
    false,
    'What you prioritize when you spend time with people.'
  ),
  (
    'attachment',
    'The Friend Zone',
    'live',
    null,
    0,
    'a1000000-0000-4000-8000-000000000004'::uuid,
    false,
    false,
    'How you connect and ask for closeness in friendship.'
  )
on conflict (slug) do nothing;
