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
