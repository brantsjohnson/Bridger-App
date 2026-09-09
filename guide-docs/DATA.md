# Bridger — Data & Infrastructure

Stack, database, privacy architecture, and the RAG matching design. This is the backing for every page doc. Two commitments shape everything here: **one codebase ships iOS + Android + web**, and **the matching AI never sees who a person is — only de-identified facts about them.**

---

## 1 · One repo → iOS, Android, and web

The consumer app is a **single Expo (React Native) app** using **Expo Router**, which renders natively on **iOS and Android** and to **web** (React Native Web) from the same code. So `apps/mobile` in `ARCHITECTURE.md` is really the *universal* app — three targets, one tree.

- **iOS / Android** — native builds via Expo.
- **Web** — Expo Router web output (the app runs in a browser too).
- The **marketing site** and **admin console** stay separate surfaces/repos (per `ADMIN.md`); this is only about the product app being tri-platform.

---

## 2 · Backing: Supabase (yes, it fits well)

Supabase is a strong fit and covers most of what Bridger needs in one managed platform:

| Need | Supabase piece |
|---|---|
| Relational data | **Postgres** |
| Embeddings / vector search (RAG) | **pgvector** (built in) |
| Auth incl. Google + Apple | **Supabase Auth** (matches `ONBOARDING.md`) |
| Media (stories, avatars, reactions) | **Supabase Storage** (signed URLs, retention) |
| Per-tier permissions at the row level | **Row-Level Security (RLS)** |
| Live updates (touch-grass, replies) | **Realtime** (optional) |

**Recommended shape:** keep the **NestJS API in front** for the logic that shouldn't live in a client (matching orchestration, RAG summary generation, payments, admin), with **Supabase as the managed Postgres + pgvector + Auth + Storage + RLS layer** behind it. Simple reads can use RLS directly; anything sensitive or complex goes through the API. Postgres-compatible, so Prisma still works if you want a typed ORM.

---

## 3 · Privacy architecture — the three zones

All data lives in one of three zones, and the wall between them is the product's core privacy promise (see diagram):

### Zone A — Identity / PII
Name, avatar, contact info, media, auth identity. **Never enters the matching pipeline or any model context.** Rejoined to suggestions **only on the user's device, at display time.**

### Zone B — De-identified facts
The attribute pool (hobbies, traits, values, quiz results) keyed by **opaque user IDs**, carrying the `matchable` and `visible_to_tier` tags. Only the **matchable, consented** subset is ever used for matching. No names, no contacts.

### Zone C — Derived AI (RAG)
**Embeddings + AI-generated summaries**, built **only from Zone B's matchable facts**. A summary reads like *"early riser, climbs, values deep 1:1s"* — never *"Jamie in Denver."* Used for retrieval and reasoning; keyed by opaque ID.

**The rules:**
- **Matching (RAG) reads only Zones B and C.** It outputs "user X should meet user Y, because {shared thread}" using opaque IDs. The app turns IDs into names locally.
- **We never train/fine-tune a model on PII.** Embeddings are for *retrieval*, not training; summaries are the user's own derived data, not a training corpus.
- **Opt-out is real.** Turning off Discoverable (`DISCOVER.md`) **drops the user's Zone C** (embeddings + summary) so they can't be retrieved or suggested — instantly unfindable.
- **Deletion is real, not soft.** Deleting a fact rebuilds the affected embeddings; deleting the account **hard-deletes all three zones** (PII, facts, content, embeddings, media) via cascade. Nothing is retained "for training" or otherwise. This is the promise made on the Profile intro screen, enforced at the database.
- **Blocks cut the graph locally.** Matching/discovery must exclude a blocked pair from each other's candidates **and** never traverse a blocked user as a mutual-connection edge for the blocker — the blocked person is a hole in the blocker's graph only. All other edges (the blocked person's other friendships, everyone else's paths) are untouched. `suggestion_skips` similarly removes a single person from one user's suggestions.
- **RLS everywhere.** The tier permission model is enforced at the row level as defense-in-depth: a viewer can only read an attribute whose `visible_to_tier` their relationship satisfies — even a bug in the API can't leak a closer-tier field.
- **"How you met" location is Zone A, coarse, and opt-in.** When two people connect, the app can record the context — an **event**, a **mutual friend**, or a **coarse place** ("RiNo, Denver," never precise coordinates). The place is captured **only with permission**, is **optional**, is stored as PII (Zone A — never fed to the model), is visible **only to the two people**, and **either can edit or delete it**.
- **Weekly summaries are written from words, never from photos.** The AI day/week summaries (see `STORIES.md`) are composed **only from the user's own update text + video transcripts** — never by analyzing faces or training on anyone's photos/likeness. Photos are shown alongside the summary but are never sent to a model for training or identification. Summaries are **pre-generated at post time** and stored per author/day, tier-filtered.

---

## 4 · RAG matching design

1. Each person's **matchable facts** (Zone B) are embedded → `person_embeddings` (pgvector).
2. An AI pass writes a **de-identified summary** → `person_summaries`.
3. To find who someone should meet, Nest matching pre-filters FoF candidates (optional pgvector ANN), scores the six named features with transparent weights, and builds the **"why"** from top specificity-weighted **Everyone+matchable** overlap titles (and the quiz evidence gate). **No LLM on the matching hot path** (`MATCHING-ALGORITHMS.md`).
4. Results are **opaque IDs + reasons**; the app joins Zone A locally to show faces and names.

Embeddings/summaries refresh when matchable facts change, and are deleted on opt-out or account deletion.

---

## 5 · The database — clean, domain-grouped schema

Organized by domain so it's easy to navigate. Key columns shown (not exhaustive); all tables have `id`, timestamps, and RLS policies. `⟶` = foreign key.

### Identity & settings (Zone A)
```
users            id · auth_provider · status · created_at
user_identity    user_id⟶users · display_name · avatar_media_id⟶media · avatar_original_media_id⟶media · avatar_filter · profile_song    [PII]
user_contacts    user_id⟶users · email · phone (E.164 via Auth SMS OTP; merge key for pending_people) [PII]
user_settings    user_id⟶users · discoverable · notif_prefs(jsonb {kinds,circles}) · home_city(coarse) · onboarding_complete · profile_intro_seen
                 · meet_scope(nearby|anywhere) · theme · locale · profile_color(#RRGGBB|null)
                 · social_battery(0..7|null) · connection_style(jsonb opaque FoF keys)
                 · membership_interests(text[] opaque) · help_interests(text[] opaque)
                 · page_authoring(auto|manual|assist|null)
                 [home_city = city only, never street address; profile_color tints SynthGrid for this user]
pending_people   id · author_id⟶users · phone_e164 · display_name · merged_user_id⟶users · created_at
                 [author-only private card for someone not on Bridger yet; unique open (author, phone);
                  never a full address book; merge on signup with matching Auth phone]
music_connections user_id⟶users · provider(spotify|apple_music) · refresh_token_enc · access_token_enc
                  · scopes · provider_user_id · connected_at
                  [PII / secrets: encrypted by Nest; NOT Supabase Auth login; owner-only; cascade delete]
music_oauth_states state · user_id⟶users · provider · expires_at   [short-lived Nest OAuth handshake; cascade]
```

### Attributes — the pool (Zone B)
```
attributes       id · owner_id⟶users · key · value(jsonb) · layer(essential|profile|connection)
                 · visible_to_tier(close|friend|acquaintance|none) · matchable(bool) · updated_at
```
*(hobbies, favs, places, this-or-that, deeper answers, quiz results all live here as rows — **one row per item, unlimited per category**, each independently visible; a person can have hundreds of entries. A **place** row's `value` can carry tags + note + **photo media refs (co-op)** + optional **`favorite: true`** (FAV star on the map; at most one starred place per person); matching two people's place rows surfaces **shared-place photos** in In-common. Onboarding seeds About Me via `about:about-from` / `about:about-town` / `about:about-job` / `about:about-dream-job` / `about:about-birthday`, and seeds Listening via `currently_song`. A **this-or-that** row's value is `this | that | both`. Synced Spotify top artists also write `music.artist.<id>` rows for reveal overlap.)*

```
profile_greatest_hits  id · owner_id⟶users · media_id⟶media · placement_index(0..2)
                       · after_module · visible_to_tier · created_at
                       [co-op only; ≤3 Bridger-hosted photos; unique (owner, placement); cascade on user/media delete]

music_picks            id · owner_id⟶users · kind(listening_now|song_of_week|fav_*)
                       · spotify_id/uri · apple_music_id · isrc · title · artist_name · album_name
                       · artwork_url · preview_url · visible_to_tier · matchable
                       [catalog metadata only, no tokens; tier RLS via can_view; cascade]

music_taste_artists    id · owner_id⟶users · provider · artist_id · artist_name · rank
                       · artwork_url · visible_to_tier · matchable · synced_at
                       [top artists for In common; up to 50 per provider; cascade]
```

### Relationships
```
connections      id · user_a⟶users · user_b⟶users · status(pending|accepted)
                 · made_via(link|qr|add|suggestion) · mutual_friend_id⟶users
                 · met_context(event|place|mutual|qr|link) · met_event_id⟶events
                 · met_place_label · met_approx_geo · met_at        [place fields = coarse PII, opt-in]
blocks           blocker_id⟶users · blocked_id⟶users · created_at
                 [excludes both directions from suggestions + as mutual bridge for the blocker; hides/unreaches; other friendships untouched; unblockable]
suggestion_skips blocker_id⟶users · skipped_id⟶users        ["don't suggest again" — soft, one-directional]
product analytics  stored in PostHog (not Postgres), so matching cannot join taps.
                 Events are taxonomy ids + opaque user_ref while signed in (demo/logged-out do not send).
                 No PII, no message/caption text. Person is purged on opt-out and
                 account delete. See ANALYTICS-TAXONOMY.md and analytics-enforcement.mdc.
tiers            user_id⟶users · other_id⟶users · tier(close|friend|acquaintance)   [per-viewer]
invite_links     token · owner_id⟶users · expires_at
qr_tokens        token · owner_id⟶users · expires_at
friend_notes     id · author_id⟶users · person_id⟶users (nullable) · pending_person_id⟶pending_people (nullable)
                 · kind(text|date|check_in)
                 · text · date · remind(1wk+dayOf for dates)
                 · cadence(week|biweek|month) · next_remind_at
                 [private, author-only; exactly one of person_id / pending_person_id; never matching/AI]
```

### Content
```
media            id · owner_id⟶users · storage_path · kind · created_at · expires_at   [retention]
stories          id · author_id⟶users · type(photo|video) · media_id⟶media · update_text
                 · transcript(video speech→text) · theme_slug · visible_to_tier
                 · created_at · live_until(created_at+24h → Profile archive)
                 · expires_at(30d free / null co-op)
day_summaries    author_id⟶users · date · text(AI, from update_text + transcript ONLY)
                 · media_refs · visible_to_tier · built_at     [pre-generated at post time]
reactions        id · story_id⟶stories · author_id⟶users · kind(circleVideo|text|sticker)
                 · media_id⟶media · text · sticker_id · parent_reaction_id⟶reactions
quips (Inside Jokes)  id · author_id⟶users(posted by) · quoted_person_id⟶users(pic on note)
                 · text · context_event_id⟶events · place · created_at · visible_to_tier
                 [note shows quoted person's photo; tap → posted-by + event/place + date]
                 [shares to tagged people + tagged event's attendees; cross-posts to tagged people's walls]
quip_tags        quip_id⟶quips · tagged_user_id⟶users            [tagged people — receive + cross-post]
bucket_list      id · owner_id⟶users · text · is_public · done · created_at   [profile module]
bucket_list_tags item_id⟶bucket_list · tagged_user_id⟶users     [friends tagged to do it together]
events           id · host_id⟶users · co_host_ids · title · bio · starts_at · address · place · bring
                 · chip_in(amount,note,methods[{kind,handle}]) · allow_friends_invite · cap(35|coop 100)
                 · recurrence(jsonb|null)  [weekly|monthly|yearly rule; null = one-off; starts_at = next]
event_invites    event_id⟶events · user_id⟶users · status(going|cant|invited)
                 · invited_by⟶users|null   [null = host invited; else the attendee who invited]
                 · allergies_optin · allergies_text            [host-only, opt-in]
event_intros     event_id⟶events · a⟶users · b⟶users · why
polls            id · author_id⟶users · question · closes_at(≤7d)   [CREATE = co-op; answering free]
poll_options     poll_id⟶polls · label      /   poll_votes  poll_id · option_id · user_id
touch_grass      id · author_id⟶users · audience_tier · when · why · created_at   [send on Events only; answer cards shown on Home]
weekly_activities id · title · prompt · active · starts_at · ends_at · closes_in · emoji · cover · post_mode(photo|text)
activity_posts   activity_id⟶weekly_activities · author_id⟶users · media_id⟶media · caption · emoji
activity_hearts  post_id⟶activity_posts · user_id⟶users
```

### AI / RAG (Zone C — de-identified, deletable)
```
ai_config          job · lane(deidentified|personal_agent) · model_id · temperature · max_tokens · timeout_ms · schema_id · monthly_budget_usd · enabled
ai_job_cost_log    job · prompt_version · latency_ms · tokens · estimated_usd · subject_ref · created_at   [NO CONTENT]
ai_ops_alerts      source · code · detail · job · resolved_at · created_at   [admin; NO CONTENT]
billy_config       singleton grants/prices (taste/plus/rollover)
billy_subscriptions user_id⟶users · plan(taste|plus|none) · status · period · cancel_at_period_end
billy_balances     user_id⟶users · balance_usd · lifetime_granted/spent   [USD of model cost]
billy_ledger       user_id · kind(grant/spend/expire/…) · amount_usd · balance_after · job · cost_log_id   [NO CONTENT]
ai_jobs            job · subject_ref · content_hash · payload_json · status · attempts · run_after · last_error   [queue]
week_summaries     author_id⟶users · week_start · days_json · built_at
module_moderator_notes  user_id⟶users · module_key · notes(jsonb) · updated_at   [NO PII]
freshness_prompts  user_id⟶users · attribute_id · question · created_at · answered_at
person_embeddings  user_id⟶users · embedding(vector) · model · updated_at    [NO PII]
person_summaries   user_id⟶users · summary_text · updated_at · maybe_stale(bool)  [NO PII; refreshes on new answers; maybe_stale drives the "still into X?" nudge]
matching_config    version · active · weights · thresholds/knobs · v2_enabled · holdout_pct
matching_suggestions  viewer_id · candidate_id · surface · score · evidence · feature_snapshot · is_exploration
matching_feedback  opaque_a · opaque_b · pair_features_snapshot · outcome · weight · superseded_at
                   [NO CONTENT / names; TTL ~18 months; purge on delete / discoverable=false]
```

Mode 1 evidence / `shared_attributes` = attributes with `visible_to_tier=acquaintance` AND `matchable`. Silent `none`+matchable (quiz dims) may feed embeddings + `quiz_alignment` only, never evidence titles.

### Assistant (personal-agent lane — single-user, not Zone C matching)
```
user_settings.assistant_enabled  bool default false
admin_config.assistant           jsonb { access, tools, allowlist }
assistant_sessions               user_id · status(open|closed) · created_at · closed_at
assistant_turns                  session_id · role · content · tool_name   [deleted on close/disable]
assistant_activity_log           user_id · tool · summary · undo_payload · undone_at
assistant_memory_chunks          user_id · kind · ref_id · text · embedding   [private RAG; NOT person_embeddings]
assistant_proposals              user_id · session_id · tool · preview · args · status
assistant_scheduled_messages     user_id · person_id · body · send_at · status(queued|sent|cancelled|failed)
                                   · activity_id? · cancelled_at? · sent_at?
                                   [queued only after approve of full draft + exact send time; cancel via activity undo until fire; hard-delete with account]
```
Reconnect ranking today uses connection `created_at` + overdue check-ins (messages last-activity timestamps not yet in schema). Document when messaging timestamps land. A worker will deliver `assistant_scheduled_messages` when the messaging send path exists.

### Membership & payments
```
coop_memberships   user_id⟶users · since · active · dues_paid_through
                   · cancel_at_period_end(bool) · cancelled_at(timestamptz?)
                   [unlocks all co-op benefits, see COOP.md; cancel_at_period_end keeps perks until dues_paid_through]
plan_state         user_id⟶users · plan(free|coop) · storage(rolling30|unlimited) · used_bytes
                   · circle_caps(free 5/30/∞, coop 25/125/∞) · video(bool) · summary(weekly|daily) · event_cap(35|100)
payments           id · user_id⟶users · kind(coop_dues) · amount · provider_ref   [one membership; no à-la-carte SKUs]
coop_promo_codes   id · code(unique, UPPER) · label · grant_months(12) · max_redemptions(the "amount", e.g. 25) · redeemed_count · active(bool)
                   [admin-issued auth codes for a free year; server-only writes; RLS: no client read]
coop_promo_redemptions promo_code_id⟶coop_promo_codes · user_id⟶users · redeemed_at   [PK(promo_code_id,user_id): one use per person; RLS select-own; hard-delete with account]
```
*(Recommended model: the co-op is the single paid membership; storage/video/circles/hosting-scale are benefits of it, not separate purchases — see `COOP.md`.)*

### Admin / config
```
admin_config       home_defaults(jsonb) · live_quiz_slug · themed_prompts(jsonb)
quiz_registry      slug · title · status(live|draft|archived) · live_week · friends_taken_count
quizzes            id · version · goal · dimensions(jsonb) · moderator_instructions · adaptation_policy(jsonb)   [see QUIZ-ENGINE.md; includes adaptBelowConfidence]
quiz_questions     id · quiz_id⟶quizzes · prompt · type(single|multi) · options(jsonb: label + dimension weights) · allow_explain
quiz_responses     id · quiz_id · user_id⟶users · question_id · selected_option_ids · explain_text
quiz_results       user_id⟶users · quiz_id · dimension_scores(jsonb, deterministic rubric) · confidence(jsonb, AI moderator) · completed_at   [feeds attributes → matching Zone B/C]
jname_results      user_id⟶users(PK) · j_name · percent · top_names(text[]: top J-names by score, for match alerts) · updated_at   [Which J name; retakes overwrite; RLS owner-only; friend reads via Nest; pairwise fun compatibility % derived at read time from both results; cascade]
jname_shares       token(PK) · sharer_id⟶users(unique) · j_name · percent   [one stable public share link per person; snapshot; public web view reads via Nest service role; cascade]
jname_referrals    id · token⟶jname_shares · sharer_id⟶users · invited_user_id⟶users|null · anon_ref(opaque, logged-out) · opened_at · resolved_at   [who opened a link / who-invited-whom; resolved after signup by Nest; RLS: sharer or invited can read; cascade]
disclosure_profiles user_id⟶users · version · status(pending|skipped|completed) · match_weight_preference(use|a_little|barely?) · matching_enabled · completed_at · updated_at
                   [Behind the Scenes; owner-only; NEVER profile / NEVER reveal evidence; additive matching only]
disclosure_items   id · user_id⟶users · condition_key · condition_label_custom? · impact_level(1–4)? · context_note? · unique(user_id, condition_key)
                   [sensitive free text stays owner-only; hard-delete with account]
coop_announcements id · body · published_at
delights           id · slug · name · status(idea|built|live) · kind(standalone|effect) · notes · enabled · scope(global|opt-in|gift) · schedule
delight_triggers   id · delight_id · from_user_id · to_user_id · played · created_at   # gift plays once on recipient open
# user_settings.delight_opt_ins  text[]  # opt-in standalone plugin slugs
notifications      id · user_id⟶users · kind · payload(jsonb) · read · created_at
```

### Deletion cascade
Deleting a `users` row cascades to **every** table above keyed by that user — identity, attributes, relationships, content, embeddings, summaries, media (and the storage objects) — so account deletion leaves nothing behind. Opt-out (Discoverable off) deletes Zone C derived rows: `person_embeddings`, `person_summaries`, `module_moderator_notes`, `freshness_prompts` (and related week/day summary rows stay with the author's content cascade on full account delete).

---

## Acceptance criteria

- [ ] One Expo codebase builds iOS, Android, and web (Expo Router web output).
- [ ] Postgres + pgvector back the app (Supabase), with Auth (phone OTP by default; Google/Apple/email in legacy mode), Storage (media + retention), and RLS enabling the tier model at the row level.
- [ ] Data is separated into Identity/PII (Zone A), de-identified facts (Zone B), and derived AI (Zone C).
- [ ] Matching/RAG reads only Zones B and C and outputs opaque IDs + reasons; names/photos are joined only on-device at display.
- [ ] No model is trained/fine-tuned on PII; embeddings are retrieval-only; summaries are de-identified and user-owned.
- [ ] Turning off Discoverable deletes the user's embeddings + summary (instantly unfindable).
- [ ] Deleting an attribute rebuilds affected embeddings; deleting an account hard-deletes all zones and storage objects via cascade — nothing retained.
- [ ] RLS prevents reads above a viewer's tier even if the API errs.
