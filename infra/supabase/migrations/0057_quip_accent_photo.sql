-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Inside Jokes (quips) can now remember the sticky-note color and, for
-- co-op members, one photo on the note. Deleting the photo row clears the
-- link. Deleting the account still wipes the joke.
-- ============================================

-- THIS SECTION DOES: the paper color of the sticky note (same names as app accents).
alter table public.quips
  add column if not exists accent text not null default 'amber';

alter table public.quips
  drop constraint if exists quips_accent_check;

alter table public.quips
  add constraint quips_accent_check
  check (accent in ('purple', 'coral', 'teal', 'amber', 'pink', 'blue', 'green'));

-- THIS SECTION DOES: optional photo on the note (co-op). Hard-delete with media.
alter table public.quips
  add column if not exists photo_media_id uuid references public.media (id) on delete set null;

create index if not exists idx_quips_photo on public.quips (photo_media_id)
  where photo_media_id is not null;
