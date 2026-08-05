# Supabase database (Bridger)

Plain-English guide to how the database is built and how to keep it in sync.

## What's here

- `migrations/` — the numbered SQL files that build the whole schema, in order.
  Each file has a plain-English header explaining what it does. They translate
  `guide-docs/DATA.md` into real tables, with row-level security (RLS), pgvector,
  and delete cascades.
- `tests/rls_and_cascade_proof.sql` — a self-cleaning script that proves the two
  core privacy promises: a lower tier cannot read a higher-tier row, and
  deleting an account erases everything it owns.

## The privacy model in one paragraph

Every fact in `attributes` carries two tags: `visible_to_tier` (who may SEE it)
and `matchable` (whether the matchmaker may USE it). The `tiers` table records
how each person privately sorts others (close / friend / acquaintance). The
`can_view(owner, required_tier)` function is the single gate: it returns true
only if the logged-in user is the owner, or the owner has tiered them close
enough, and there's no block. RLS policies call `can_view` so the rule is
enforced at the row level — even a bug in the API can't leak a closer-tier field.

## Migration order

| File | What it adds |
|---|---|
| 0001 | pgvector, enums (incl. the ordered `tier`), shared updated_at trigger |
| 0002 | Identity & settings (Zone A): users, user_identity, user_contacts, user_settings |
| 0003 | attributes (Zone B) — the tagged-twice fact pool |
| 0004 | Relationships + the `can_view` helper |
| 0005 | media, stories, day_summaries, reactions |
| 0006 | quips (Inside Jokes), bucket_list |
| 0007 | events, invites, intros |
| 0008 | polls, touch_grass, weekly activities |
| 0009 | AI/RAG (Zone C): person_embeddings, person_summaries |
| 0010 | membership & payments |
| 0011 | admin config, quizzes, notifications, delights, announcements |
| 0012 | all RLS policies |
| 0013 | security hardening of the helper functions |
| 0014 | move pgvector into the `extensions` schema |
| 0015 | new-user trigger |
| 0016 | admin content gaps (announcement title/CTA, delight name/slug + triggers, quiz_registry links, home_layout, seed) |
| 0017 | quiz + weekly activity covers (`cover`, `emoji`, `closes_in`, `description`) |
| 0018 | Touch Grass: `expires_at` + `touch_grass_responses` (I'm in / dismiss) + RLS |
| 0019 | Weekly Recap Podcast tables, `story_type` audio, rolling expiry, purge function + RLS |
| 0020 | `client_not_found_hits` — 404 / broken-path trail for the admin console (server-only) |
| 0021 | `user_settings.onboarding_complete` |
| 0022 | `connections.met_note` — Discover how-you-met freeform note |
| 0023 | `events.cover` + `event_assignments` (+ RLS) |

## Regenerating the TypeScript types

After any schema change, refresh `packages/shared/src/database.types.ts` so the
app and API stay type-safe. Generate fresh types from the project (via the
Supabase MCP `generate_typescript_types`, or the Supabase CLI
`supabase gen types typescript`) and paste the result into that file.

## Known, accepted advisor notes

- `person_embeddings` / `person_summaries` have RLS on but no policy — this is
  intentional: only the server (service key) touches Zone C.
- `client_not_found_hits` has RLS on but no policy — intentional: only Nest
  (service key) writes/reads 404 path trails; the app never queries this table
  directly.
- `can_view` is executable by signed-in users — required, because RLS policies
  call it; it only ever reveals the caller's own access, so it's safe.
