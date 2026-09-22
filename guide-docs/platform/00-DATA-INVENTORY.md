# 00 · Data inventory (Phase 0)

Factual inventory of Bridger's data layer as it exists in this repo on 2026-09-21. This is discovery, not a target design. The working brief is `PROCESS.md`. Do not treat provisional sensitivity labels as the catalog.

**Machine appendix** (regenerate with `node scripts/data-inventory/generate.mjs`):

| File | What it holds |
|---|---|
| `inventory/schema.json` | Tables, columns, indexes, policies, functions, triggers, enums, grants. |
| `inventory/TABLES.md` | The same facts, with every current RLS policy SQL quoted. |
| `inventory/catalog-seed.json` | One row per column (760). Import seed for a later catalog. Empty purpose and consent fields mean "not decided". |
| `inventory/api-surface.json` | 243 Nest routes, their guards, and every `.from()` / `.rpc()` call. |
| `inventory/summary.json` | Counts and the flag lists below. |

A live database was not queried. If production has drifted from `infra/supabase/migrations`, this inventory will not show that drift.

---

## How this was built

The generator walks migrations in filename order and folds `create table`, `alter table`, indexes, policies, functions, triggers, enums, grants, and `do $$` blocks into one picture. Later `create policy` for the same name replaces the earlier one, matching `drop policy` plus `create policy` in `0027_profile_presentation.sql`.

Checks that passed on this run:

- 57 migration files, 100 public tables, 760 columns, 144 policies still in force, 18 enums, 11 functions, 0 unparsed `create` / `alter` / `drop` statements.
- `create policy` statements in the SQL files sum to 147. Three of those replace policies from `0012_rls_policies.sql` (`0027` rewrites the poll policies). 147 minus 3 equals 144, which is the live set.
- `packages/shared/src/database.types.ts` is missing `disclosure_profiles` and `disclosure_items`. Every other public table in the migrations is in that file. No extra tables exist only in the types file.

Parser limits:

- Policy SQL in the appendix is whitespace-flattened. The statement text is the quote. `using` / `with check` splits are best-effort.
- Column nullability is inferred from `not null` and `primary key`. A column with neither is marked nullable.
- Views: none found (`create view` not found).
- Storage buckets: none found in SQL or in `infra/supabase/config.toml` (the sample bucket there is commented out). The app still uploads to a bucket named `media`.
- Realtime publications: not found.
- `auth.users` is Supabase-managed. We do not create it. We reference `id` and, in `handle_new_user`, `phone` and `raw_app_meta_data`.

Two pairs of migrations share a numeric prefix. Order is filename sort: `0024_coop_portal.sql` then `0024_story_live_until_archive.sql`, and `0049_discoverable_default_off.sql` then `0049_payment_providers.sql`.

---

## Headline findings

1. **Every public table has RLS enabled.** None have `disable row level security`. None use `FORCE ROW LEVEL SECURITY`.
2. **The Nest API does not use RLS.** `apps/api/src/supabase/supabase.service.ts` builds one client, `SupabaseService.admin`, with `SUPABASE_SECRET_KEY`. That key bypasses RLS. There is no user-scoped Supabase client in the API. Authorization for almost all reads and writes is whatever each service checks in TypeScript.
3. **RLS is the fence for the phone's direct database access, and that access is narrow.** The Expo app's Supabase client uses the publishable key (`apps/mobile/lib/supabase.ts`). The only table write found is `media` insert plus a storage upload, both in `apps/mobile/lib/media-upload.ts`. Everything else found is Auth (session, OTP, OAuth, sign-out).
4. **22 tables have RLS and zero policies.** For the publishable key, that is deny-all. For the service role, it is allow-all. Those tables are safe from the phone and unprotected if a Nest bug or a future extension is handed the service key.
5. **21 policies are `USING (true)` or `WITH CHECK (true)`.** Three of those also grant `anon` (`coop_mission_principles_select`, `coop_economics_select`, `coop_roles_select`). They are listed below. They are not secret user rows, but they are a world-readable surface a later platform must not copy by accident.
6. **There is no messages table.** Threads, ciphertext, contact cards, and the 5-a-day cap exist in `guide-docs/complete/MESSAGES.md` and in demo fixtures (`apps/mobile/data/messages.ts`). `GET /messages` is a TODO in that file. The only message-shaped table is `assistant_scheduled_messages` (Billy drafts, not friend DMs).
7. **There is no consent-receipt table and no terms-acceptance column.** Consent that exists is a handful of booleans and json bags on `user_settings` and on each `attributes` row (`visible_to_tier`, `matchable`). Several notification writes skip the prefs helper.
8. **`attributes.value` is one jsonb column for many kinds of fact** (birthday, job, hobbies, places, this-or-that). Sensitivity cannot be decided at the column. It depends on `key`. The seed classifies the column up to `sensitive` and marks `needs_review`.
9. **Service-role reads are wider than RLS in at least one shipped path.** `jname_results` policies are own-row only, but `GET /jname/leaderboard` loads friends' `j_name` and `percent` through the admin client (`apps/api/src/jname/jname.service.ts`). That may be the product (friends see your result). It is not what RLS expresses. Any extension that is given the service role inherits this gap everywhere, not just here.
10. **A media row is readable by any acquaintance, not by the story's tier.** `stories_select` uses `can_view(author_id, visible_to_tier)`. `media_select` uses `can_view(owner_id, 'acquaintance')`. An acquaintance who can read the `media` row can learn that a file exists even when the story that points at it is Close-only. The bytes themselves depend on storage policies, and those policies were not found in the repo.
11. **Phone lookup is not a client oracle today.** `POST /me/pending-people` stores a card for the author and does not ask whether that number already has an account. `merge_pending_people_for_user` is `SECURITY DEFINER`, revoked from `anon` and `authenticated`, granted to `service_role` only. The API calls it with the signed-in user's own phone, not a phone the client picks (`apps/api/src/pending-people/pending-people.service.ts`). An index on `pending_people.phone_e164` exists for that server merge. A later extension must not grow a "is this number on Bridger?" query on top of it.

---

## RLS posture

### Enabled, no policy (client denied, service role allowed)

`ai_config`, `ai_job_cost_log`, `ai_jobs`, `ai_ops_alerts`, `assistant_activity_log`, `assistant_memory_chunks`, `assistant_proposals`, `assistant_sessions`, `assistant_turns`, `billy_config`, `client_not_found_hits`, `coop_beta_unlocks`, `coop_promo_codes`, `coop_waitlist`, `freshness_prompts`, `matching_config`, `matching_feedback`, `module_moderator_notes`, `music_oauth_states`, `person_embeddings`, `person_summaries`, `week_summaries`.

Assistant session text, embeddings, summaries, moderator notes, OAuth handshake state, promo codes, and the waitlist email hash sit in this group. The phone cannot read them with the publishable key. Nest can read all of them.

`assistant_scheduled_messages` is the exception in the assistant family: it has `assistant_scheduled_messages_select_own`.

### `USING (true)` (any signed-in user, unless noted)

These are the policies the generator flagged. Full SQL is in `inventory/TABLES.md`.

| Policy | Table | Who | Notes |
|---|---|---|---|
| `weekly_activities_select` | `weekly_activities` | authenticated | Activity prompt is community-wide. |
| `activity_posts_select` | `activity_posts` | authenticated | Anyone signed in can read posts. Writes are author-only. |
| `activity_hearts_select` | `activity_hearts` | authenticated | Anyone signed in can read hearts. |
| `admin_config_select` | `admin_config` | authenticated | Home defaults, demo week, assistant flags. Writes are server-only (no insert policy). |
| `quiz_registry_select` | `quiz_registry` | authenticated | Quiz catalog. |
| `quizzes_select` | `quizzes` | authenticated | Live quiz shell. |
| `quiz_questions_select` | `quiz_questions` | authenticated | Question text. |
| `delights_select` | `delights` | authenticated | Delight catalog. |
| `coop_announcements_select` | `coop_announcements` | authenticated | Co-op announcements. |
| `recap_weeks_select` | `recap_weeks` | authenticated | Which week is live. |
| `recap_questions_select` | `recap_questions` | authenticated | Prompt text, including AI or builtin source. |
| `recap_submitted_questions_select` | `recap_submitted_questions` | authenticated | Suggested questions and vote totals. |
| `coop_idea_supports_select` | `coop_idea_supports` | authenticated | Who supported an idea. |
| `coop_idea_comments_select` | `coop_idea_comments` | authenticated | Comment bodies. |
| `coop_beta_versions_select` | `coop_beta_versions` | authenticated | Beta version rows. Any signed-in user. |
| `coop_beta_votes_select` | `coop_beta_votes` | authenticated | Any signed-in user can read `user_id` and `choice`. Not anon. |
| `coop_mission_principles_select` | `coop_mission_principles` | anon, authenticated | Mission copy. |
| `coop_mission_supports_select` | `coop_mission_supports` | authenticated | Supports. |
| `coop_economics_select` | `coop_economics_assumptions` | anon, authenticated | Cost assumptions. |
| `coop_roles_select` | `coop_roles` | anon, authenticated | Role descriptions. |
| `coop_dues_votes_select` | `coop_dues_votes` | authenticated | Dues votes. |

`coop_ideas_select` is not in this list. Its policy is scoped (public ideas, or the author's own). Confirm the exact predicate in `inventory/TABLES.md` before treating idea bodies as public.

Quiz answers (`quiz_responses`) and quiz scores (`quiz_results` select) are own-row, not `USING (true)`.

### The visibility helper

`public.can_view(p_owner uuid, p_required tier)` in `0013_harden_functions.sql` is `SECURITY DEFINER`. It returns true for the owner, false when the required tier is `none`, false when either person has blocked the other, otherwise true when the owner's `tiers` row for the caller is at least `p_required`. Execute is granted to `authenticated` and `service_role`, revoked from `anon` and `public`.

`viewer_tier(uuid, uuid)` and `is_blocked(uuid, uuid)` were dropped in that same migration because a signed-in caller could probe other people's tiers and blocks. That is the existing "no existence oracle" fix for relationship data. It does not cover the service-role API.

Example, names are not world-readable. They require a tier:

```sql
create policy user_identity_select on public.user_identity
  for select to authenticated
  using (user_id = auth.uid() or public.can_view(user_id, 'acquaintance'))
```

`users_select` uses the same acquaintance check. `user_contacts_all` is own-row only (`user_id = auth.uid()`). Email and phone are not on the identity policy.

`attributes_select` is `can_view(owner_id, visible_to_tier)`. Tier `none` is invisible to everyone except the owner.

---

## Direct Supabase use from the Expo app

Client: `apps/mobile/lib/supabase.ts` (publishable key, session in AsyncStorage).

| Call | File | What it does |
|---|---|---|
| `storage.from('media').upload` | `apps/mobile/lib/media-upload.ts` | Puts bytes at `{userId}/{suffix}` in the `media` bucket. |
| `.from('media').insert` | same file | Inserts `owner_id`, `storage_path`, `kind`. RLS policy `media_insert` requires `owner_id = auth.uid()`. |
| `auth.getSession`, `getUser`, `onAuthStateChange`, `signInWithPassword`, `signUp`, `signInWithOtp`, `verifyOtp`, `signOut`, `signInWithOAuth`, `signInWithIdToken`, `setSession`, `updateUser`, `startAutoRefresh` | `providers/auth-provider.tsx`, `lib/oauth.ts`, `lib/api.ts`, `app/(auth)/sign-in.tsx`, `hooks/useOnboarding.ts`, `data/onboarding.ts`, `app/invite/[token].tsx` | Login only. |

No other `.from()` or `.rpc()` calls were found under `apps/mobile`. `apps/site` has none. The admin console is not a second Supabase client in this repo. It calls the Nest admin routes.

`apps/mobile/lib/api.ts` sends the user JWT to Nest. That is the normal data path.

Storage policies for bucket `media` were **not found** in migrations. The table RLS does not, by itself, prove the object store is private. That is a gap.

---

## Nest API

Routes have no global prefix (`apps/api/src/main.ts`). Guards are `SupabaseAuthGuard` (JWT via Supabase JWKS, audience `authenticated`), `OptionalSupabaseAuthGuard`, `AdminGuard`, or `RequireCoopMemberGuard`. The JWT check does not apply RLS. After the guard, services use `this.supabase.admin`.

### Routes with no Nest guard

| Route | Why it is open | Data note |
|---|---|---|
| `GET /health` | App Runner liveness. | No user data. |
| `POST /admin/login` | Password check, then an admin JWT. | Not a user-data read. Rate limiting lives in the controller. |
| `POST /coop/webhooks/stripe` | Stripe signature on the raw body. | Writes membership and payments. |
| `POST /coop/webhooks/revenuecat` | Shared Authorization secret in the controller. | Writes membership. |
| `GET /coop/portal/economics` | Public co-op page. | Reads `coop_economics_assumptions` (anon-readable policy). |
| `GET /coop/portal/roles` | Public co-op page. | Reads `coop_roles` (anon-readable policy). |
| `GET /music/spotify/callback` | Spotify redirects the browser. `state` maps to the user. | Completes OAuth. `music_oauth_states` is service-role only. |
| `GET /music/apple/authorize` | Browser page. `state` maps to the user. | Returns HTML. |
| `POST /music/apple/complete` | MusicKit posts `state` and `musicUserToken`. | Stores an encrypted token if `state` matches. |
| `POST /telemetry/not-found` | No login. | Inserts `client_not_found_hits` (path, trail, platform, app version, session id). Table is service-role only, so the phone cannot read it back. Paths can still carry whatever the client sends. |

Other portal reads (`overview`, `ideas`, `mission`, `beta/current`, `waitlist`) use `OptionalSupabaseAuthGuard`. `GET /coop/portal/dues` uses `AdminGuard`.

Module to tables (union of `.from()` in that folder) is in `inventory/api-surface.json` under `modules`. High-traffic user-data modules: `stories`, `connections`, `profiles`, `matching`, `events`, `recap`, `music`, `assistant`, `me`, `quiz`, `feed`, `quotes`, `pending-people`.

`pending-people` is the only module that calls `.rpc()`: `merge_pending_people_for_user`.

---

## Consent today

| What is captured | Where it is stored | Enforced? |
|---|---|---|
| Who may see a fact | `attributes.visible_to_tier` (`none`, `acquaintance`, `friend`, `close`) | Yes for publishable-key reads, via `can_view`. Nest must re-check. `apps/api/src/common/visibility.ts` loads `blocks` and `tiers` for some callers. It is not a single gateway in front of every query. |
| Whether Discover may use a fact | `attributes.matchable` | Matching services filter on it (`matching-idf`, discover eligibility). Not a column privilege. Identity and belief keys are a product rule in `INDEX.md` §6, not a database constraint. |
| Discover on or off | `user_settings.discoverable`, default `false` after `0049_discoverable_default_off.sql` | Turning it off runs `trg_discoverable_purge_matching` and `drop_zone_c_on_undiscoverable` (`SECURITY DEFINER`). Embeddings and matching rows are deleted in the database, not only in the client. |
| Notification kinds and circles | `user_settings.notif_prefs` jsonb | `NotificationsService.notifyIfAllowed` skips the insert when the kind is off. Direct inserts bypass it. Found in `connections.service.ts`, `events.service.ts`, `recap.service.ts`, `jname.service.ts`, `delight.service.ts`, `polls.service.ts`, and `merge_pending_people_for_user` in `0055_pending_people.sql` (`friend_joined`). |
| Assistant on or off | `user_settings.assistant_enabled` | `purge_assistant_on_disable` deletes open sessions when the flag flips off. |
| Delight opt-in | `user_settings.delight_opt_ins` text[] | Catalog is readable by any signed-in user. Opt-in is a column. Per-delight enforcement was not fully traced in this pass. |
| Allergies shared with a host | `event_invites.allergies_optin`, `event_invites.allergies_text` | Opt-in column exists. Host visibility is application code. Classified `sensitive`. |
| How you met | `connections.met_context`, `met_place_label`, `met_approx_geo`, `met_event_id`, `met_at` | Place and geo are classified `sensitive`. Visibility is the connection row's policies, not a separate consent table. |
| Pending contact | `pending_people.phone_e164`, `display_name` | Author-only RLS (`pending_people_all`). API sets `author_id` from the JWT. Cap of 100 open cards in the service. |
| Profile code the user typed | `user_settings.profile_custom_css`, `profile_custom_html`, `profile_custom_code_status` | Stored. Sandbox and review are a product doc (`PROFILE-CUSTOMIZATION.md`), not a catalog. |
| Onboarding answers in progress | `user_settings.onboarding_draft` jsonb, `onboarding_step` | Draft can hold facts before they become `attributes`. Classified `sensitive`, `needs_review`. |
| Old onboarding finished | `user_settings.onboarding_complete` | Kept. Do not drop. |
| New onboarding preferences | `membership_interests`, `help_interests`, `page_authoring`, `profile_color`, `social_battery`, `connection_style` | Columns exist. `social_battery` classified `sensitive` (health-adjacent) pending review. |
| Co-op waitlist | `coop_waitlist.email_hmac` | RLS on, no policy. HMAC, not raw email, but still `sensitive`. |
| Music account link | `music_connections` encrypted tokens | Select and delete policies are own-row. Token columns are `sensitive`. |
| Terms, EULA, age gate, consent receipt | **Not found** as a table or column. | Not stored in Postgres. Signup agreement, if any, is not in this schema. |

PostHog is not a Postgres table. `DATA.md` says events are de-identified and the person is deleted with the account. `POST /me/analytics/purge` exists on `me.controller.ts`. The event names live in `guide-docs/ANALYTICS-TAXONOMY.md` and `packages/shared/src/analytics/ids.ts`. They are not in the catalog seed yet. Phase 0's column seed does not cover analytics. The standing rule (later) has to, or analytics will be an uncataloged store.

---

## User-facing primitives

Internal table names stay internal. This maps the product word to the tables and the write path.

| Product word | Tables | Who can write | Visibility in RLS |
|---|---|---|---|
| Account | `users` (id = `auth.users.id`, on delete cascade), created by `handle_new_user` | Trigger on `auth.users` insert. Service role. | Select: self, or `can_view(..., 'acquaintance')`. No client insert policy. |
| Name, avatar, song | `user_identity`, `media` | Owner. Avatar file via direct storage upload plus `media` insert, or Nest. | Identity: acquaintance tier. Media rows: any acquaintance (`can_view(owner_id, 'acquaintance')`), which is wider than a Close-only story. |
| Email, phone | `user_contacts`, plus Auth phone | `handle_new_user` copies Auth phone. Nest upserts on merge. | Own row only. |
| Settings and both onboarding flows | `user_settings` (29 columns) | Owner policy `user_settings_all`. Nest also upserts with the service role (`content.controller.ts`, `me.controller.ts`). | Own row only. |
| Facts (hobbies, favs, places, this-or-that, about, quiz facts) | `attributes` | Owner insert/update/delete. | `can_view(owner_id, visible_to_tier)`. |
| Profile photos (greatest hits) | `profile_greatest_hits`, `media` | Owner, co-op checks in `greatest-hits.service.ts` | Tier policies on the table. |
| Filtered avatar | `user_identity.avatar_filter`, `avatar_original_media_id`, `avatar_media_id` | `POST /photo-filters/apply` | Likeness. Classified `sensitive`. |
| Friends | `connections`, `tiers` | Nest `connections` and `tiers` services. | Parties on the row. `tiers` is per viewer (`user_id` tiers `other_id`). |
| Blocks, "don't suggest" | `blocks`, `suggestion_skips` | Nest, owner. | Own rows. |
| Invite / QR | `invite_links`, `qr_tokens` | Nest insert. | Own rows. |
| Private notes | `friend_notes` (person or `pending_person_id`) | `notes` service, author. | Author-only policy. |
| Someone not on Bridger yet | `pending_people` | `POST /me/pending-people` | Author-only. |
| Updates / Collage | `stories`, `scrapbook_pages`, `scrapbook_elements`, `media` | `stories` service. Phone uploads media first. | `can_view` on `visible_to_tier`. |
| Catch-up | No `catch_up` table. API: `GET /stories/:authorId/catch-up`, `POST /stories/catch-up/:itemId/answer`. Backed by stories and replies. | Author and viewers the story allows. | Same as stories and `reactions`. |
| Day / week AI text | `day_summaries`, `week_summaries` | AI worker, service role. | `day_summaries` has select + write policies. `week_summaries` has **no policy** (service role only). |
| Transcripts | `stories.transcript` | `POST /stories/transcribe` | Same row as the story. Derived from the author's media. |
| Voice replies, text, stickers | `reactions` | Author, if they can see the story. | Select if you can see the parent story. |
| Inside Jokes | `quips`, `quip_tags`, optional `photo_media_id` | `quotes` service. | Tier plus tagged people. See policies in the appendix. |
| Weekly podcast / Friend Pod | `recap_weeks`, `recap_questions`, `recap_submitted_questions`, `recap_question_votes`, `recap_answers`, `media` | Author inserts answers. Week rows are admin or the Monday lock. | Weeks and questions: any signed-in user. Answers: tier policies. |
| Prompts / quizzes | `quiz_registry`, `quizzes`, `quiz_questions`, `quiz_responses`, `quiz_results`, `disclosure_profiles`, `disclosure_items`, `jname_results`, `jname_shares`, `jname_referrals` | Owner writes answers. Admin writes the catalog. | Catalog is `USING (true)`. Answers are own-row in RLS. Nest shows friends' J-name results anyway (see headline 9). |
| Activities ("anyone" weekly prompt) | `weekly_activities`, `activity_posts`, `activity_hearts` | Author writes their post. | Posts and hearts are readable by any signed-in user. |
| Touch Grass ("anyone free") | `touch_grass`, `touch_grass_responses` | Author. | `can_view(author_id, audience_tier)`. |
| Polls | `polls`, `poll_options`, `poll_votes` | Author creates. Invitees vote. | Select policies were rewritten in `0027_profile_presentation.sql`. |
| Events | `events`, `event_invites`, `event_assignments`, `event_intros` | Host, and invitees for RSVP. | See appendix. Address is `sensitive`. Allergies are `sensitive`. |
| Friend-of-friend discovery | `matching_suggestions`, `matching_feedback`, `matching_config`, `person_embeddings`, `connections.mutual_friend_id` | Matching jobs, service role. | Suggestions: select-own policy. Config, feedback, embeddings: no policy. |
| Memories | **Not found** as a table. Closest: story archive (`stories.live_until`) and `day_summaries`. | | |
| Messages, contact card, daily cap | **Not found** in Postgres. Demo fixtures only. | | Spec requires ciphertext at rest. No schema for that yet. |
| Circles / influencers | **Not found.** `DATA.md` lists `circle_edges` and related tables as planned. | | |
| Version-of-me quizzes | **Not found.** Docs say `user_quizzes`. | | |
| Event host notes, shared album | **Not found** as tables. `DATA.md` marks them planned. | | |
| Co-op membership | `coop_memberships`, `plan_state`, `payments`, `coop_promo_codes`, `coop_promo_redemptions` | Webhooks and Nest. Client select-own on membership, plan, payments. Promo codes: no policy. | |
| Co-op portal | `coop_ideas` and the mission, economics, roles, beta, dues, waitlist tables | Member writes are guarded `SupabaseAuthGuard` + `RequireCoopMemberGuard`. | Several selects are `USING (true)`, including anon. |
| Billy (assistant) | `assistant_sessions`, `assistant_turns`, `assistant_memory_chunks`, `assistant_proposals`, `assistant_activity_log`, `assistant_scheduled_messages`, `billy_*` | Assistant service, service role. | Sessions and turns: no RLS policy. Scheduled messages: own-row select. |
| Music | `music_connections`, `music_oauth_states`, `music_picks`, `music_taste_artists`, plus `attributes` keys written on sync | Music service. | Picks and taste: tier policies. Tokens: own-row. OAuth state: no policy. |

`handle_new_user` (latest body is in `0055_pending_people.sql`) inserts `users`, `user_settings`, `plan_state`, and copies `auth.users.phone` onto `user_contacts`. The phone trigger `user_contacts_phone_merge` then runs the merge.

---

## Derived data

Derived data is data. The seed does not yet fill `lineage` on every column. These are the lineages found in schema and workers:

| Derived | Source | Where it is written |
|---|---|---|
| `person_embeddings.embedding` | Matchable `attributes` (Zone B, per `DATA.md`) | AI / matching jobs. Table has no RLS policy. |
| `person_summaries` | Matchable attributes, de-identified text | AI worker. No RLS policy. |
| `day_summaries` | Story `update_text` plus `transcript`. Not photos. | `ai` module. Has policies. |
| `week_summaries` | Week of day text | `ai` module. No RLS policy. |
| `stories.transcript` | The author's audio or video | `POST /stories/transcribe`. |
| `quiz_results` | `quiz_responses` via the quiz engine | Quiz services. |
| `module_moderator_notes` | Quiz answers | AI module. No RLS policy. |
| `freshness_prompts` | Profile facts | AI module. No RLS policy. |
| `matching_suggestions` | Attributes, quizzes, graph | Matching services. Select-own policy. |
| `user_identity.avatar_media_id` when a filter is set | `avatar_original_media_id` | `photo-filters` service. |
| `attributes` rows with music keys | `music_taste_artists` sync | `music.service.ts` inserts attributes. |
| J-name compatibility percents | Computed at read time from `jname_results` | Not a stored column. Returned by the leaderboard route. |
| `coop_ideas.support_count` | Denormalized from supports | Portal. A count, not a hidden row count. Still a number other members see. |
| Recap question `source = ai` | Worker fill-in, or the canned bank | `recap_questions`. Prompt text is `USING (true)` to signed-in users. |

Not found in the schema: streaks, follower counts, view counts. `GET /jname/leaderboard` is a friend-grouped board (group size, then compatibility), not a public scoreboard. The route name still says leaderboard. Product rule in `INDEX.md` §6 forbids public leaderboards. Flag for the plan: do not let an extension aggregate this into a rank.

---

## Provisional classification

The seed uses the classes from `PROCESS.md`. It classifies up when unsure. It does **not** assign `circle_scoped` or `public_profile`. Tiered posts are `private` plus `needs_review: true` until a person confirms they are circle-scoped. That is intentional. Do not read `private` as the final class.

| Class | Columns | Meaning in this pass |
|---|---|---|
| `sensitive` | 23 | Contact, location, health-adjacent, likeness, token, or a json bag that can hold those. |
| `friends_only` | 2 | `user_identity.display_name`, `user_identity.profile_song`. Both `needs_review`. |
| `private` | 506 | Default classify-up. Most are `needs_review: true`. |
| `system_internal` | 229 | Ids and timestamps, plus operator config that did not match a sensitive name. |
| `circle_scoped` | 0 | Not auto-assigned. |
| `public_profile` | 0 | Not auto-assigned. |
| `needs_review: true` | 520 | A human still has to confirm. |

Sensitive columns:

- `user_contacts.user_id`, `email`, `phone`
- `pending_people.author_id`, `phone_e164`, `display_name`, `merged_user_id`
- `user_identity.avatar_media_id`, `avatar_original_media_id`, `avatar_filter`
- `user_settings.home_city`, `social_battery`, `onboarding_draft`
- `attributes.value`
- `connections.met_place_label`, `met_approx_geo`
- `events.address`
- `event_invites.allergies_optin`, `allergies_text`
- `music_connections.refresh_token_enc`, `access_token_enc`, `provider_user_id`
- `coop_waitlist.email_hmac`

`purpose_tags`, `allowed_operations`, `consent_basis`, `retention`, `export_included`, and `visibility_default` are null on every seed row. Null means not decided.

`owner_subject` is a heuristic from column names (`owner_id`, `author_id`, `user_a`/`user_b`, and so on). Multi-party rows are called out when both columns exist. Rows with no owner column say `not found: no obvious owner column` (catalog tables, config). Review those before they are treated as owned by nobody.

Birthday, job, and similar About Me facts are not their own columns. They are `attributes` keys (`about:about-birthday` and the others named in `DATA.md`). A catalog that stops at the column will under-classify them.

---

## Gaps

1. **Service role is the real data API.** RLS is defense in depth for one client write (`media`) and for any future client that uses the publishable key. It is not what Nest enforces.
2. **RLS and Nest disagree** on friend-visible J-name results. Expect more of these. This pass did not diff every service's filters against every policy.
3. **Notification prefs are optional in practice.** The helper exists. Many features insert `notifications` themselves.
4. **No consent receipt, no EULA acceptance row, no age column.**
5. **`attributes.value` and `onboarding_draft` mix sensitivities in one jsonb.**
6. **Messages are unspecified in the database** while the product and the extension dogfood plan both depend on them.
7. **Storage bucket `media` has no DDL and no storage policy in the repo.** The `media` table policy is acquaintance-wide, while `stories` are tiered. Those two fences do not match.
8. **`database.types.ts` is behind** `disclosure_profiles` and `disclosure_items`. Client types can drift from migrations.
9. **Duplicate migration prefixes** (`0024`, `0049`) make order depend on the rest of the filename.
10. **Docs describe tables that are not migrated:** Circles, version-of-me `user_quizzes`, event host notes, shared event album, messages. Catalog them as absent, not as if they exist.
11. **`client_not_found_hits` is an unauthenticated write** of navigation trails.
12. **OAuth `state` is a capability token** on unauthenticated music routes. The state table has no RLS policy (service role only), which is right, and the routes are still a sensitive entry point.
13. **Anon can read three co-op portal tables** (mission principles, economics assumptions, roles). Beta versions and beta votes are `USING (true)` for signed-in users only. `coop_beta_votes` includes `user_id` and `choice`, so any account can see who voted. Comments and supports of ideas are readable by any signed-in user.
14. **Activity posts and hearts are readable by any signed-in user**, not by a friend graph.
15. **Recap suggested questions are readable by any signed-in user**, including the text a friend typed.
16. **Embeddings and summaries have no RLS policy.** Correct for "the phone must not read Zone C directly". Dangerous if anything in the API returns them to a client or an extension without a purpose check.
17. **Old and new onboarding both write `user_settings`.** Do not drop `onboarding_complete` when the phone-OTP flow lands. `onboarding_step` and `onboarding_draft` are the newer pair.
18. **Classification is not a catalog.** 520 columns still need a person. The generator's `sensitive` rule had a bug on this pass (substring `lat` inside `platform` and `latency_ms`). That bug is fixed in `scripts/data-inventory/generate.mjs`. Re-run the generator after editing the rules. Do not hand-edit `inventory/`.

---

## What the next phase must not assume

- That RLS describes what the API returns.
- That `private` in the seed is the final sensitivity class.
- That an empty `consent_basis` means the field is required, or that it is optional.
- That messages can be dogfooded on an existing table. They cannot. The rails have to include a ciphertext store, or the dogfood waits on that schema.
- That the phone is already free of direct table access. The `media` insert is real, and the bucket policy is not in git.
- That "is this number on Bridger?" is already leaked. The current pending-person path does not answer it. Do not add a lookup that does.

Next file, after this inventory is accepted: `01-ARCHITECTURE.md`, using these table and policy names. Not before.
