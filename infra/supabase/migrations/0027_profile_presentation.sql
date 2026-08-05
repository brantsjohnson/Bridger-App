-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds the small presentation settings used by the first profile customize
-- screen, plus a poll audience so each poll keeps the circle it was made for.
-- Both are presentation or visibility metadata. They do not change profile
-- facts, profile widget order, or who can see an underlying profile field.
-- ============================================

-- --- PROFILE: one JSON object holds the approved accent and background tokens. ---
alter table public.user_settings
  add column profile_presentation jsonb;

-- --- POLLS: remember which of the author's circles can see and answer a poll. ---
alter table public.polls
  add column audience_tier tier not null default 'friend';

-- SECURITY: replace the old broad poll read policies with audience-aware checks.
drop policy if exists polls_select on public.polls;
create policy polls_select on public.polls
  for select to authenticated
  using (author_id = auth.uid() or public.can_view(author_id, audience_tier));

drop policy if exists poll_options_select on public.poll_options;
create policy poll_options_select on public.poll_options
  for select to authenticated
  using (
    exists (
      select 1
      from public.polls p
      where p.id = poll_id
        and (p.author_id = auth.uid() or public.can_view(p.author_id, p.audience_tier))
    )
  );

-- SECURITY: votes are append-only and must point to a visible poll and its option.
drop policy if exists poll_votes_write on public.poll_votes;
create policy poll_votes_insert on public.poll_votes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.polls p
      join public.poll_options o on o.poll_id = p.id
      where p.id = poll_id
        and o.id = option_id
        and (p.author_id = auth.uid() or public.can_view(p.author_id, p.audience_tier))
    )
  );
