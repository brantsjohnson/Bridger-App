-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Tightens the privacy helper functions after a security review.
--
-- THE PROBLEM: `viewer_tier(owner, viewer)` and `is_blocked(a, b)` took ANY two
-- user ids, and because they're exposed as API endpoints, a signed-in person
-- could ask "how did X sort Y?" or "did X block Y?" about people who aren't
-- them. That leaks private relationship info.
--
-- THE FIX: fold both lookups INSIDE `can_view`, which is always about the
-- logged-in user (auth.uid()). Then delete the two probeable functions so they
-- can't be called at all. `can_view` only ever reveals the CALLER's own access,
-- so it's safe to keep. We also lock its API access to signed-in users only.
-- Finally we pin `set_updated_at`'s search_path (a hardening best practice).
-- ============================================

-- --- Self-contained visibility check: no arbitrary-pair lookups exposed. ---
create or replace function public.can_view(p_owner uuid, p_required tier)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() = p_owner then true
    when p_required = 'none' then false
    -- blocked either direction? then never.
    when exists (
      select 1 from public.blocks b
      where (b.blocker_id = p_owner and b.blocked_id = auth.uid())
         or (b.blocker_id = auth.uid() and b.blocked_id = p_owner)
    ) then false
    -- otherwise: has the owner tiered ME at least as close as required?
    else coalesce(
      (select t.tier from public.tiers t
        where t.user_id = p_owner and t.other_id = auth.uid()
        limit 1) >= p_required,
      false
    )
  end;
$$;

-- --- Remove the two functions that could be used to probe other people. ---
drop function if exists public.viewer_tier(uuid, uuid);
drop function if exists public.is_blocked(uuid, uuid);

-- --- Only signed-in users (and the server) may call can_view; not anonymous. ---
revoke execute on function public.can_view(uuid, tier) from anon, public;
grant execute on function public.can_view(uuid, tier) to authenticated, service_role;

-- --- Pin the trigger function's search_path (it only uses built-ins). ---
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
