-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- This is the privacy enforcement layer. Every table already has row-level
-- security turned ON; here we add the actual RULES that say who may read/write
-- each row. The golden rule for facts is `can_view(owner, required_tier)` from
-- 0004: it returns true only if the logged-in person is the owner, or the owner
-- has tiered them close enough, and there's no block.
--
-- HOW ROLES WORK: `authenticated` = a logged-in app user. The server uses the
-- Supabase "service key", which BYPASSES all of these rules, so complex/admin
-- logic still works. These policies constrain what the app (a normal user) can
-- do directly. Tables with NO policy below (embeddings, summaries, quiz config
-- writes, plan writes) are server-only by design: the app cannot touch them.
-- ============================================

-- ===== Identity & settings =====

-- Your own account row; plus you can see accounts you're at least acquainted with.
create policy users_select on public.users
  for select to authenticated
  using (id = auth.uid() or public.can_view(id, 'acquaintance'));

-- Names/avatars: yours always; others only if you're allowed to see them.
create policy user_identity_select on public.user_identity
  for select to authenticated
  using (user_id = auth.uid() or public.can_view(user_id, 'acquaintance'));
create policy user_identity_write on public.user_identity
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Contacts are private to you.
create policy user_contacts_all on public.user_contacts
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Settings are private to you.
create policy user_settings_all on public.user_settings
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== Attributes (the tier-gated heart) =====

-- Read a fact only if your tier satisfies its visible_to_tier (owner always sees own).
create policy attributes_select on public.attributes
  for select to authenticated
  using (public.can_view(owner_id, visible_to_tier));
create policy attributes_insert on public.attributes
  for insert to authenticated
  with check (owner_id = auth.uid());
create policy attributes_update on public.attributes
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy attributes_delete on public.attributes
  for delete to authenticated
  using (owner_id = auth.uid());

-- ===== Relationships =====

-- How you sort others is private to you (the sorter).
create policy tiers_all on public.tiers
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A connection is visible to and editable by either party.
create policy connections_select on public.connections
  for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());
create policy connections_insert on public.connections
  for insert to authenticated
  with check (user_a = auth.uid() or user_b = auth.uid());
create policy connections_update on public.connections
  for update to authenticated
  using (user_a = auth.uid() or user_b = auth.uid())
  with check (user_a = auth.uid() or user_b = auth.uid());
create policy connections_delete on public.connections
  for delete to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

-- Only the blocker manages (and sees) their blocks.
create policy blocks_all on public.blocks
  for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Only you manage your "don't suggest again" list.
create policy suggestion_skips_all on public.suggestion_skips
  for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- You manage your own invite links / QR tokens (redeeming is done server-side).
create policy invite_links_all on public.invite_links
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy qr_tokens_all on public.qr_tokens
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Friend notes are private to their author.
create policy friend_notes_all on public.friend_notes
  for all to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- ===== Content =====

-- Media viewable by owner or someone allowed to see the owner.
create policy media_select on public.media
  for select to authenticated
  using (owner_id = auth.uid() or public.can_view(owner_id, 'acquaintance'));
create policy media_insert on public.media
  for insert to authenticated with check (owner_id = auth.uid());
create policy media_update on public.media
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy media_delete on public.media
  for delete to authenticated using (owner_id = auth.uid());

-- Stories follow their own visible_to_tier.
create policy stories_select on public.stories
  for select to authenticated
  using (public.can_view(author_id, visible_to_tier));
create policy stories_insert on public.stories
  for insert to authenticated with check (author_id = auth.uid());
create policy stories_update on public.stories
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy stories_delete on public.stories
  for delete to authenticated using (author_id = auth.uid());

-- Day summaries follow their own visible_to_tier.
create policy day_summaries_select on public.day_summaries
  for select to authenticated
  using (public.can_view(author_id, visible_to_tier));
create policy day_summaries_write on public.day_summaries
  for all to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- A reaction is visible if you can see its story (or it's yours).
create policy reactions_select on public.reactions
  for select to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.stories s
      where s.id = story_id and public.can_view(s.author_id, s.visible_to_tier)
    )
  );
create policy reactions_insert on public.reactions
  for insert to authenticated with check (author_id = auth.uid());
create policy reactions_update on public.reactions
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy reactions_delete on public.reactions
  for delete to authenticated using (author_id = auth.uid());

-- ===== Social content =====

-- A quip is visible to its author, the quoted person, anyone tagged, or per tier.
create policy quips_select on public.quips
  for select to authenticated
  using (
    author_id = auth.uid()
    or quoted_person_id = auth.uid()
    or exists (select 1 from public.quip_tags qt where qt.quip_id = id and qt.tagged_user_id = auth.uid())
    or public.can_view(author_id, visible_to_tier)
  );
create policy quips_insert on public.quips
  for insert to authenticated with check (author_id = auth.uid());
create policy quips_update on public.quips
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy quips_delete on public.quips
  for delete to authenticated using (author_id = auth.uid());

-- Quip tags: the tagged person or the quip's author can see; author manages.
create policy quip_tags_select on public.quip_tags
  for select to authenticated
  using (
    tagged_user_id = auth.uid()
    or exists (select 1 from public.quips q where q.id = quip_id and q.author_id = auth.uid())
  );
create policy quip_tags_write on public.quip_tags
  for all to authenticated
  using (exists (select 1 from public.quips q where q.id = quip_id and q.author_id = auth.uid()))
  with check (exists (select 1 from public.quips q where q.id = quip_id and q.author_id = auth.uid()));

-- Bucket list: owner always; public items to acquaintances; tagged friends too.
create policy bucket_list_select on public.bucket_list
  for select to authenticated
  using (
    owner_id = auth.uid()
    or (is_public and public.can_view(owner_id, 'acquaintance'))
    or exists (select 1 from public.bucket_list_tags t where t.item_id = id and t.tagged_user_id = auth.uid())
  );
create policy bucket_list_write on public.bucket_list
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy bucket_list_tags_select on public.bucket_list_tags
  for select to authenticated
  using (
    tagged_user_id = auth.uid()
    or exists (select 1 from public.bucket_list b where b.id = item_id and b.owner_id = auth.uid())
  );
create policy bucket_list_tags_write on public.bucket_list_tags
  for all to authenticated
  using (exists (select 1 from public.bucket_list b where b.id = item_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.bucket_list b where b.id = item_id and b.owner_id = auth.uid()));

-- ===== Events =====

-- Visible to host, co-hosts, invitees, or acquaintances of the host.
create policy events_select on public.events
  for select to authenticated
  using (
    host_id = auth.uid()
    or auth.uid() = any (co_host_ids)
    or exists (select 1 from public.event_invites ei where ei.event_id = id and ei.user_id = auth.uid())
    or public.can_view(host_id, 'acquaintance')
  );
create policy events_insert on public.events
  for insert to authenticated with check (host_id = auth.uid());
create policy events_update on public.events
  for update to authenticated
  using (host_id = auth.uid() or auth.uid() = any (co_host_ids))
  with check (host_id = auth.uid() or auth.uid() = any (co_host_ids));
create policy events_delete on public.events
  for delete to authenticated using (host_id = auth.uid());

-- Invites: the guest sees their own row; host/co-hosts see all rows for the event.
create policy event_invites_select on public.event_invites
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)))
  );
create policy event_invites_insert on public.event_invites
  for insert to authenticated
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)))
  );
create policy event_invites_update on public.event_invites
  for update to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)))
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)))
  );
create policy event_invites_delete on public.event_invites
  for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)))
  );

-- Intros: the two people involved, or the host/co-hosts.
create policy event_intros_select on public.event_intros
  for select to authenticated
  using (
    a = auth.uid() or b = auth.uid()
    or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)))
  );
create policy event_intros_write on public.event_intros
  for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))))
  with check (exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))));

-- ===== Polls, touch grass, activities =====

create policy polls_select on public.polls
  for select to authenticated
  using (author_id = auth.uid() or public.can_view(author_id, 'acquaintance'));
create policy polls_write on public.polls
  for all to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy poll_options_select on public.poll_options
  for select to authenticated
  using (exists (select 1 from public.polls p where p.id = poll_id and (p.author_id = auth.uid() or public.can_view(p.author_id, 'acquaintance'))));
create policy poll_options_write on public.poll_options
  for all to authenticated
  using (exists (select 1 from public.polls p where p.id = poll_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.polls p where p.id = poll_id and p.author_id = auth.uid()));

create policy poll_votes_select on public.poll_votes
  for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.polls p where p.id = poll_id and p.author_id = auth.uid()));
create policy poll_votes_write on public.poll_votes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Touch grass follows its chosen audience_tier.
create policy touch_grass_select on public.touch_grass
  for select to authenticated
  using (author_id = auth.uid() or public.can_view(author_id, audience_tier));
create policy touch_grass_write on public.touch_grass
  for all to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Weekly activity is community-wide: any logged-in user can read it.
create policy weekly_activities_select on public.weekly_activities
  for select to authenticated using (true);

create policy activity_posts_select on public.activity_posts
  for select to authenticated using (true);
create policy activity_posts_write on public.activity_posts
  for all to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy activity_hearts_select on public.activity_hearts
  for select to authenticated using (true);
create policy activity_hearts_write on public.activity_hearts
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== Membership & payments (read-own; writes are server-only) =====

create policy coop_memberships_select on public.coop_memberships
  for select to authenticated using (user_id = auth.uid());
create policy plan_state_select on public.plan_state
  for select to authenticated using (user_id = auth.uid());
create policy payments_select on public.payments
  for select to authenticated using (user_id = auth.uid());

-- ===== Admin / quiz / notifications =====

-- Config the app needs to render is readable; writes are server/admin only.
create policy admin_config_select on public.admin_config
  for select to authenticated using (true);
create policy quiz_registry_select on public.quiz_registry
  for select to authenticated using (true);
create policy quizzes_select on public.quizzes
  for select to authenticated using (true);
create policy quiz_questions_select on public.quiz_questions
  for select to authenticated using (true);
create policy coop_announcements_select on public.coop_announcements
  for select to authenticated using (true);
create policy delights_select on public.delights
  for select to authenticated using (true);

-- Your quiz answers/results are private to you.
create policy quiz_responses_all on public.quiz_responses
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy quiz_results_select on public.quiz_results
  for select to authenticated using (user_id = auth.uid());

-- Notifications: read/update/delete your own (e.g., mark read). Inserts server-side.
create policy notifications_select on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on public.notifications
  for delete to authenticated using (user_id = auth.uid());
