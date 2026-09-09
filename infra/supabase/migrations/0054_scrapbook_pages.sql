-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Turns an Update (story) into an editable "Scrapbook page". A page is a
-- portrait 8.5 x 11 sheet; everything on it (photos, the caption, the little
-- date stamp) is an "element" whose position is stored as fractions of the
-- page (0 to 1) so it draws the same on any phone, on web, and on paper later.
--
--   scrapbook_pages     - one page per stories row (daily pages; event pages later)
--   scrapbook_elements  - the things on the page
--   stories.page_id     - points at the page (null = old one-photo post, still works)
--   stories.revision    - goes up each time the author changes the page after
--                         posting, so friends' story rings can light again
--
-- Old posts need no data change: the app draws a legacy post as a one-photo
-- page at read time (legacyStoryToScrapbookPage in packages/shared).
--
-- PRIVACY: a page and its elements are visible exactly when the story is
-- (same can_view + visible_to_tier). Writes are author-only. Deleting the story
-- deletes the page and its elements; deleting a media file nulls the pointer.
-- The daily limit (4 photos/videos across all of today's pages) is enforced by
-- the API, not here, because it counts across rows.
-- ============================================

-- --- The page ---
create table public.scrapbook_pages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  story_id uuid references public.stories (id) on delete cascade,
  aspect_ratio numeric not null default 0.772727,
  background jsonb not null default '{"kind":"solid","color":"#F4F1E7"}'::jsonb,
  layout_id text,
  layout_family text,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_scrapbook_pages_author on public.scrapbook_pages (author_id);
create index idx_scrapbook_pages_story on public.scrapbook_pages (story_id);

-- --- The things on the page. x/y/width/height are 0..1 fractions of the page. ---
create table public.scrapbook_elements (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.scrapbook_pages (id) on delete cascade,
  type text not null,
  x numeric not null,
  y numeric not null,
  width numeric not null,
  height numeric not null,
  rotation numeric not null default 0,
  z_index integer not null default 0,
  slot integer,
  locked boolean not null default false,
  user_modified boolean not null default false,
  source text,
  media_id uuid references public.media (id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint scrapbook_elements_type_check check (
    type in (
      'photo', 'video', 'text', 'voice', 'person', 'place', 'map', 'sticker',
      'cutout', 'clipping', 'frame', 'shape', 'image', 'date', 'event_reference'
    )
  ),
  constraint scrapbook_elements_source_check check (
    source is null or source in ('bridger_camera', 'camera_roll', 'event', 'shared')
  )
);
create index idx_scrapbook_elements_page on public.scrapbook_elements (page_id);
create index idx_scrapbook_elements_media on public.scrapbook_elements (media_id)
  where media_id is not null;

-- --- Point the story at its page + track edits after posting. ---
alter table public.stories
  add column if not exists page_id uuid references public.scrapbook_pages (id) on delete set null,
  add column if not exists revision integer not null default 1;
create index if not exists idx_stories_page on public.stories (page_id)
  where page_id is not null;

-- SECURITY: RLS on. A page follows its story's audience; author writes only.
alter table public.scrapbook_pages enable row level security;
alter table public.scrapbook_elements enable row level security;

create policy scrapbook_pages_select on public.scrapbook_pages
  for select to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.stories s
      where s.id = scrapbook_pages.story_id
        and public.can_view(s.author_id, s.visible_to_tier)
    )
  );
create policy scrapbook_pages_insert on public.scrapbook_pages
  for insert to authenticated with check (author_id = auth.uid());
create policy scrapbook_pages_update on public.scrapbook_pages
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy scrapbook_pages_delete on public.scrapbook_pages
  for delete to authenticated using (author_id = auth.uid());

create policy scrapbook_elements_select on public.scrapbook_elements
  for select to authenticated
  using (
    exists (
      select 1 from public.scrapbook_pages p
      where p.id = scrapbook_elements.page_id
        and (
          p.author_id = auth.uid()
          or exists (
            select 1 from public.stories s
            where s.id = p.story_id
              and public.can_view(s.author_id, s.visible_to_tier)
          )
        )
    )
  );
create policy scrapbook_elements_write on public.scrapbook_elements
  for all to authenticated
  using (
    exists (
      select 1 from public.scrapbook_pages p
      where p.id = scrapbook_elements.page_id and p.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.scrapbook_pages p
      where p.id = scrapbook_elements.page_id and p.author_id = auth.uid()
    )
  );

-- --- Keep updated_at honest. ---
create or replace function public.touch_scrapbook_page()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger trg_scrapbook_pages_touch
  before update on public.scrapbook_pages
  for each row execute function public.touch_scrapbook_page();
