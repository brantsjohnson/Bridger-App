-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Makes sign-up "just work." Supabase creates the login row in auth.users, but
-- our app data lives in public.users (and friends: settings, plan). This trigger
-- fires right after a new login is created and sets up that person's starter
-- rows automatically:
--   * public.users        - their app account (needed for every foreign key)
--   * public.user_settings - default switches (discoverable on, nearby, etc.)
--   * public.plan_state    - starts everyone on the free plan
--
-- It runs as the database owner (SECURITY DEFINER) so it can write these rows
-- even though row-level security is on. Deleting the login still cascades all of
-- this away, so the "deletion is real" promise is unaffected.
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, auth_provider)
    values (new.id, new.raw_app_meta_data ->> 'provider')
    on conflict (id) do nothing;

  insert into public.user_settings (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

  insert into public.plan_state (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Fire the setup function after each new login is created.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
