-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Housekeeping: moves the pgvector extension out of the `public` schema into the
-- dedicated `extensions` schema (Supabase best practice - keeps `public` for our
-- own tables only). Vector casts still work because `extensions` is on the
-- database search path. Written as a safe no-op if it's already been moved.
-- ============================================

do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'vector' and n.nspname = 'public'
  ) then
    alter extension vector set schema extensions;
  end if;
end
$$;
