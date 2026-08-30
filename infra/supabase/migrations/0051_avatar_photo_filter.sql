-- ============================================
-- WHAT THIS FILE DOES (plain English):
-- Remembers which profile-photo "look" you picked (Pop art / Comic / X-ray /
-- Sepia) and keeps a pointer to the unfiltered original. That way Profile can
-- show the filtered face everywhere, and Edit can switch to another look
-- without asking you to re-upload.
-- ============================================

-- THIS SECTION DOES: add the look key + original photo pointer on identity.
alter table public.user_identity
  add column if not exists avatar_filter text,
  add column if not exists avatar_original_media_id uuid;

-- THIS SECTION DOES: only allow the four known looks (or null = plain photo).
alter table public.user_identity
  drop constraint if exists user_identity_avatar_filter_check;
alter table public.user_identity
  add constraint user_identity_avatar_filter_check
  check (
    avatar_filter is null
    or avatar_filter in ('pop_art', 'comic', 'x_ray', 'sepia')
  );

-- THIS SECTION DOES: wire the original photo to media (same cascade rules as avatar).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_identity_avatar_original_media_id_fkey'
  ) then
    alter table public.user_identity
      add constraint user_identity_avatar_original_media_id_fkey
      foreign key (avatar_original_media_id)
      references public.media (id)
      on delete set null;
  end if;
end $$;

comment on column public.user_identity.avatar_filter is
  'Profile photo look: pop_art | comic | x_ray | sepia. Null = no look applied.';
comment on column public.user_identity.avatar_original_media_id is
  'Unfiltered source photo used to bake avatar looks. avatar_media_id points at the filtered copy.';
