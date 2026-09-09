-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Lets someone keep a private card about a person who is not on Bridger yet,
-- keyed to that person's phone number. When that person later signs up with
-- the same number, we attach the notes and a friend connection to their real
-- account. Also:
--   * stores the new account's phone on user_contacts
--   * remembers a few onboarding preferences (what membership they care about,
--     what they want help with, how they like scrapbook pages made)
--
-- PRIVACY: pending_people rows are author-only. We never upload a whole
-- address book. Phones are stored in E.164 form (+15551234567).
-- ============================================

-- --- Pending people: a private card you made for someone not on Bridger yet. ---
create table public.pending_people (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  phone_e164 text not null,
  display_name text,
  merged_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index uq_pending_people_author_phone_open
  on public.pending_people (author_id, phone_e164)
  where merged_user_id is null;

create index idx_pending_people_phone on public.pending_people (phone_e164);
create index idx_pending_people_author on public.pending_people (author_id);

alter table public.pending_people enable row level security;

-- Author-only: nobody else can read another person's pending cards.
create policy pending_people_all on public.pending_people
  for all to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- --- Friend notes can now point at a pending person until they join. ---
alter table public.friend_notes
  alter column person_id drop not null;

alter table public.friend_notes
  add column pending_person_id uuid references public.pending_people (id) on delete cascade;

alter table public.friend_notes
  add constraint friend_notes_target_one
  check (
    (person_id is not null and pending_person_id is null)
    or (person_id is null and pending_person_id is not null)
  );

create index idx_friend_notes_pending on public.friend_notes (pending_person_id);

-- --- Onboarding preference columns (opaque keys, never free text). ---
alter table public.user_settings
  add column if not exists membership_interests text[] not null default '{}'::text[],
  add column if not exists help_interests text[] not null default '{}'::text[],
  add column if not exists page_authoring text
    check (page_authoring is null or page_authoring in ('auto', 'manual', 'assist'));

-- --- After a new login is created, copy their Auth phone onto user_contacts. ---
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

  -- Copy the Auth phone (already E.164 from Supabase) onto our contacts row.
  if new.phone is not null and length(new.phone) > 0 then
    insert into public.user_contacts (user_id, phone)
      values (new.id, new.phone)
      on conflict (user_id) do update
        set phone = excluded.phone;
  end if;

  return new;
end;
$$;

-- --- Merge pending cards that match this new phone into the real user. ---
create or replace function public.merge_pending_people_for_user(p_user uuid, p_phone text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  merged_count integer := 0;
  rec record;
begin
  if p_phone is null or length(p_phone) = 0 then
    return 0;
  end if;

  for rec in
    select id, author_id
    from public.pending_people
    where phone_e164 = p_phone
      and merged_user_id is null
      and author_id <> p_user
  loop
    -- Connect the author and the new person if they are not already linked.
    if not exists (
      select 1 from public.connections c
      where least(c.user_a, c.user_b) = least(rec.author_id, p_user)
        and greatest(c.user_a, c.user_b) = greatest(rec.author_id, p_user)
    ) then
      insert into public.connections (user_a, user_b, status, made_via)
        values (rec.author_id, p_user, 'accepted', 'add');
    else
      update public.connections
        set status = 'accepted'
      where least(user_a, user_b) = least(rec.author_id, p_user)
        and greatest(user_a, user_b) = greatest(rec.author_id, p_user)
        and status <> 'accepted';
    end if;

    -- Default the new person as an acquaintance for the author if no tier yet.
    insert into public.tiers (user_id, other_id, tier)
      values (rec.author_id, p_user, 'acquaintance')
      on conflict (user_id, other_id) do nothing;

    -- Move private notes off the pending card onto the real user.
    update public.friend_notes
      set person_id = p_user,
          pending_person_id = null
      where author_id = rec.author_id
        and pending_person_id = rec.id;

    update public.pending_people
      set merged_user_id = p_user
      where id = rec.id;

    insert into public.notifications (user_id, kind, payload, read)
      values (
        rec.author_id,
        'friend_joined',
        jsonb_build_object('personId', p_user),
        false
      );

    merged_count := merged_count + 1;
  end loop;

  return merged_count;
end;
$$;

-- Fire merge whenever we store a phone on user_contacts.
create or replace function public.user_contacts_phone_merge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phone is not null and length(new.phone) > 0 then
    perform public.merge_pending_people_for_user(new.user_id, new.phone);
  end if;
  return new;
end;
$$;

drop trigger if exists on_user_contacts_phone_merge on public.user_contacts;
create trigger on_user_contacts_phone_merge
  after insert or update of phone on public.user_contacts
  for each row execute function public.user_contacts_phone_merge();

-- SECURITY: only the server (and this trigger, which runs as the owner) may
-- run the merge. A signed-in client must not pass an arbitrary phone.
revoke execute on function public.merge_pending_people_for_user(uuid, text)
  from public, anon, authenticated;
grant execute on function public.merge_pending_people_for_user(uuid, text)
  to service_role;
