-- ============================================
-- WHAT THIS FILE DOES (plain English):
-- This is the proof that our privacy promises actually hold at the database.
-- It creates three throwaway people, gives the "owner" three facts (one for
-- each tier), tells the owner to treat person B as a close friend and person C
-- as only an acquaintance, then logs in AS each of them to check what they can
-- see. Finally it deletes the owner and confirms every trace is gone.
--
-- HOW TO RUN: paste into the Supabase SQL editor (or run via the MCP). It cleans
-- up after itself. Expected results are noted inline.
-- These two checks map directly to DATA.md's acceptance criteria:
--   * RLS prevents reads above a viewer's tier.
--   * Deleting an account hard-deletes all of that user's rows via cascade.
-- ============================================

-- --- 1) Make three test logins and profiles ---
insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'owner@test.local', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'close@test.local', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'acq@test.local', now(), now());

insert into public.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

-- --- 2) Owner posts one fact per tier ---
insert into public.attributes (id, owner_id, key, value, layer, visible_to_tier, matchable) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'secret_close', '"climbing"', 'connection', 'close', true),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'mid_friend',   '"coffee"',   'profile',    'friend', true),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'open_acq',     '"denver"',   'essential',  'acquaintance', true);

-- --- 3) Owner sorts B as close, C as acquaintance ---
insert into public.tiers (user_id, other_id, tier) values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'close'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'acquaintance');

-- --- 4) Log in AS the acquaintance -> should see ONLY the acquaintance row ---
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  -- EXPECT: 1 row -> open_acq
  select key, visible_to_tier from public.attributes
  where owner_id = '11111111-1111-1111-1111-111111111111' order by key;
rollback;

-- --- 5) Log in AS the close friend -> should see ALL three rows ---
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
  -- EXPECT: 3 rows -> mid_friend, open_acq, secret_close
  select key, visible_to_tier from public.attributes
  where owner_id = '11111111-1111-1111-1111-111111111111' order by key;
rollback;

-- --- 6) Delete the owner login -> everything keyed to them must vanish ---
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
-- EXPECT: all zeros
select
  (select count(*) from public.users      where id = '11111111-1111-1111-1111-111111111111') as users_left,
  (select count(*) from public.attributes where owner_id = '11111111-1111-1111-1111-111111111111') as attributes_left,
  (select count(*) from public.tiers      where user_id = '11111111-1111-1111-1111-111111111111') as tiers_left;

-- --- 7) Clean up the remaining test logins ---
delete from auth.users where id in (
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- ============================================
-- Admin content gaps (0016) proofs
-- A regular user must not write admin-managed tables.
-- A user may only heart / post / gift as themselves.
-- Deleting a user cascades their activity posts, hearts, and delight triggers.
-- ============================================

-- --- A) Fresh users for activity / delight cascade checks ---
insert into auth.users (id, email, created_at, updated_at) values
  ('44444444-4444-4444-4444-444444444444', 'author@test.local', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'recipient@test.local', now(), now());
insert into public.users (id) values
  ('44444444-4444-4444-4444-444444444444'),
  ('55555555-5555-5555-5555-555555555555');

insert into public.weekly_activities (id, title, prompt, active)
values ('66666666-6666-6666-6666-666666666666', 'Proof Week', 'Say hi', true);

insert into public.delights (id, name, slug, enabled, scope)
values ('77777777-7777-7777-7777-777777777777', 'Emoji bomb', 'emoji-bomb', true, 'gift');

insert into public.activity_posts (id, activity_id, author_id)
values ('88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444');

insert into public.activity_hearts (post_id, user_id)
values ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555');

insert into public.delight_triggers (id, delight_id, from_user_id, to_user_id)
values (
  '99999999-9999-9999-9999-999999999999',
  '77777777-7777-7777-7777-777777777777',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

-- --- B) Authenticated user cannot write admin_config ---
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  -- EXPECT: error / 0 rows affected (no insert policy)
  insert into public.admin_config (home_defaults, themed_prompts)
  values ('{}'::jsonb, '[]'::jsonb);
rollback;

-- --- C) User cannot heart as someone else ---
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  -- EXPECT: error (with check user_id = auth.uid())
  insert into public.activity_hearts (post_id, user_id)
  values ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555');
rollback;

-- --- D) Delete author -> their posts / hearts-as-author / sent triggers vanish ---
delete from auth.users where id = '44444444-4444-4444-4444-444444444444';
-- EXPECT: all zeros for author-owned rows
select
  (select count(*) from public.activity_posts where author_id = '44444444-4444-4444-4444-444444444444') as posts_left,
  (select count(*) from public.delight_triggers where from_user_id = '44444444-4444-4444-4444-444444444444') as triggers_left;

-- --- E) Clean up ---
delete from auth.users where id = '55555555-5555-5555-5555-555555555555';
delete from public.weekly_activities where id = '66666666-6666-6666-6666-666666666666';
delete from public.delights where id = '77777777-7777-7777-7777-777777777777';
