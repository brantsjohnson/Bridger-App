-- ============================================
-- WHAT THIS FILE DOES (plain English):
-- Turns Surprises into an open backlog (idea / built / live) with notes, and
-- lets people opt into standalone delighters for themselves.
-- ============================================

-- THIS SECTION DOES: catalog fields on each surprise row.
alter table public.delights
  add column if not exists status text not null default 'idea'
    check (status in ('idea', 'built', 'live'));

alter table public.delights
  add column if not exists kind text not null default 'standalone'
    check (kind in ('standalone', 'effect'));

alter table public.delights
  add column if not exists notes text not null default '';

comment on column public.delights.status is
  'idea = parked thought; built = code exists; live = may be enabled for users.';
comment on column public.delights.kind is
  'standalone = host-mounted plugin; effect = reusable importable motion.';
comment on column public.delights.notes is
  'Free-text where it might live or vibe notes for humans + Cursor.';

-- THIS SECTION DOES: opt-in list of plugin slugs on the person's settings.
alter table public.user_settings
  add column if not exists delight_opt_ins text[] not null default '{}';

comment on column public.user_settings.delight_opt_ins is
  'Plugin slugs the user opted into (opt-in scope standalones only).';

-- THIS SECTION DOES: seed example backlog rows (incomplete on purpose).
insert into public.delights (slug, name, scope, kind, status, enabled, notes)
values
  (
    'emoji-bomb',
    'Emoji bomb',
    'gift',
    'standalone',
    'live',
    true,
    'Gift: friend sends; rains emojis on recipient next open. Worked example.'
  ),
  (
    'emoji-rain',
    'Emoji rain',
    'global',
    'effect',
    'built',
    false,
    'Reusable rain effect under delight/effects/emoji-rain. Import from any screen. Example, not a host plugin.'
  ),
  (
    'pet-cat',
    'Pet cat',
    'opt-in',
    'standalone',
    'idea',
    false,
    'Example idea only: opt-in companion. Not a commitment.'
  ),
  (
    'confetti-moment',
    'Confetti moment',
    'global',
    'standalone',
    'idea',
    false,
    'Example idea only: seasonal global overlay. Not a commitment.'
  )
on conflict (slug) where (slug is not null) do update
  set
    name = excluded.name,
    kind = excluded.kind,
    notes = excluded.notes;

-- THIS SECTION DOES: make sure the worked gift example is live-ready after older rows.
update public.delights
set
  status = 'live',
  kind = 'standalone',
  scope = 'gift',
  enabled = true,
  notes = 'Gift: friend sends; rains emojis on recipient next open. Worked example.'
where slug = 'emoji-bomb';
