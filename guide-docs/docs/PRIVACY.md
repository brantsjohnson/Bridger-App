# Bridger - Privacy Policy (living draft)

> **WHAT THIS FILE IS:** plain-English master draft of Bridger's Privacy Policy. Lawyers will turn this into the real legal document. Agents and builders **must update this file in the same change** whenever a feature collects, uses, shares, or deletes data (see `.cursor/rules/guide-rules.mdc` §8 and the standing reminders at the top of that file).
>
> **STATUS:** scaffolding + seeded from shipped product truth. Sections marked `TODO (legal)` need counsel wording. Sections marked `TODO (product)` need a builder to fill from code when that area is touched.
>
> **RELATED:** `DATA.md` (zones A/B/C, RLS, deletion), `apps/mobile/PrivacyInfo.xcprivacy` (Apple Privacy Manifest), analytics rules (PostHog consent), `AI-SYSTEM.md`, `complete/COOP.md`.

---

## How to update this file (for Cursor / builders)

1. Find the heading that matches what you just built (account, media, analytics, etc.).
2. Add or edit a short bullet: **what**, **why**, **who sees it**, **how long**, **how the user stops it**.
3. If the product does not do the thing yet, say so honestly (`Not shipped yet` or `Soft stub`).
4. Never invent promises the app cannot keep.
5. Keep copy free of em dashes.

---

## 1 · Who we are

- Bridger is a social app for real-world friendship (Updates, Friends, Events, Discover, Co-op).
- Operator / legal entity name, address, and contact for privacy requests: **TODO (legal): fill company identity and privacy email**.
- This draft covers the mobile apps (iOS / Android), the web build, the NestJS API, and Supabase-backed storage.

---

## 2 · Our privacy promises (product truth)

These are enforced in product and schema (`DATA.md`). Do not weaken them in code without updating this file.

- **Hard delete, not soft delete.** Deleting an account, a fact, or a connection erases it and derived AI rows. Nothing is kept "for training."
- **Zones.** Zone A = identity / PII. Zone B = de-identified facts (opaque IDs). Zone C = derived AI (embeddings / summaries from Zone B only). Matching and models never see Zone A names or photos.
- **Capture-only media**, except the **profile photo** (the one upload exception).
- **No vanity metrics** (no follower counts, view counts, invited totals, streaks, leaderboards).
- **No ad tracking** and no third-party ad SDKs.
- **Product analytics (PostHog)** is first-party, **opt-in / consented**, de-identified, deletable with the account, never sold, never fed into matching.
- **Tier visibility** (Close / Friends / Everyone / custom groups) controls who sees shared content; RLS enforces it.

---

## 3 · What we collect

### 3.1 Account and identity (Zone A)

- Sign-in via supported providers (e.g. Google; Sign in with Apple when Google is offered).
- Profile basics collected in onboarding (name/display, and other basics per `ONBOARDING.md` / `PROFILE-QUESTIONS.md`).
- Contact handles the user chooses to share with friends (e.g. on the contact card in Messages) are user-shared, not scraped.
- **TODO (product):** list exact account fields currently stored (email, auth provider IDs, etc.) when Settings / auth is next touched.

### 3.2 Profile attributes and quizzes (Zone B)

- Hobbies, favorites, places, this-or-that, bucket list, deeper questions, Top 5, Current Obsession, life timeline, recommendations, goals, and quiz results tagged with **visibility** (`visibleToTier`) and a separate **`matchable`** flag.
- Every fill module ends with (1) who can see the answers and (2) an explicit "use this to connect me in Discover?" ask. Visibility and matching are independent consents.
- Sensitive About Me Deeper fields (identity / beliefs) default Close and are never bulk-matchable; each is listed individually in the matchable step.
- A mandatory one-time profile intro explains group-based sharing and that deleting a field removes it from Bridger's database.
- Profile search only indexes fields the viewer may already see; search query text is never logged.
- Quiz completion can write attributes such as `quiz.<slug>.<dimension>` with `visible_to_tier = none` until the user chooses otherwise (generic quiz path shipped).
- Discover / matching use only **matchable, consented** facts; names rejoin on-device from opaque IDs.

### 3.3 Content the user creates (UGC)

- **Updates** (photo / text / video per product rules; capture-only except profile photo).
- **Inside Jokes**, poll questions/votes, Touch Grass signals (audience + when + why), event details, recap voice answers, co-op portal ideas/comments (shown as "A member," no person names on the member portal).
- Reactions, replies, and RSVP / attendance related records as needed to run those features.

### 3.4 Friends graph and social graph

- Connections, tiers, blocks, how-you-met context (optional; place is coarse and opt-in when used).
- Blocks cut the graph locally for the blocker (suggestions and mutual bridges).
- **Invite links and QR codes:** opaque tokens only (UUID). Share links live in `invite_links`; QR codes use short-lived `qr_tokens` (about 15 minutes), deleted when redeemed. The QR encodes a Bridger deep link (`bridger://invite/…` or your configured `APP_LINK_BASE`), not a name or photo. Redeeming creates a connection; you cannot redeem your own invite. Tokens are not used for matching or ads.

### 3.5 Co-op / membership

- Membership status, `dues_paid_through`, cancel-at-period-end / cancelled timestamps.
- Soft-join stub today (no live StoreKit / Play / Stripe yet). Future: platform IAP and/or in-app card processor; joining remains skippable.
- Portal participation (ideas, votes). **Member portal never shows vote tallies or person names**; admin may see aggregates.
- **Profile customization (co-op):** theme (accent, background, font, light/dark) and layout order are presentation-only skins. They never change, hide, or delete canonical attributes or tier visibility. Custom CSS/HTML (later, admin-gated) is sanitized; no user JavaScript; no off-Bridger asset URLs (so a profile cannot leak viewer IPs). Assets are Bridger-hosted. "View original" and a viewer "always show plain pages" preference always reach the native accessible layout. Customized profiles are UGC (report / operator revert). Storage meter shows used vs included; overage is opt-in with price shown before any charge.

### 3.6 Device permissions (requested in context, never at cold launch)

| Permission | Why we ask | If denied |
|---|---|---|
| Camera | Post Updates, video replies | Feature degrades; app still works |
| Microphone | Video replies, recap voice answers, Assistant voice questions (opt-in) | Same |
| Photo library | Profile photo only (upload exception) | User can skip / use capture |
| Notifications | Alerts for friends, Touch Grass, events, etc. | In-app activity still works |
| Contacts | Optional friend-finding / invite (desired in onboarding; not required) | Skip; app works |
| Location (coarse) | Optional "where you met" | Skip; app works |

Purpose strings must stay accurate in `app.json` / store listings when permissions land.

### 3.7 Analytics (PostHog)

- UI events (`click`, `dead_click`, `swipe`, …) with structured `screen.section.element` ids.
- Named product events (e.g. quiz completed, story posted, co-op cancel scheduled).
- Properties are snake_case taxonomy fields only; **no PII**, no message/caption/quiz-explanation text.
- `distinct_id` = opaque `user_ref` **only after consent**; otherwise anonymous.
- Default opt-out until the user accepts (Settings + ATT where applicable).
- Deleting the account must purge the PostHog person as well as our DB.

### 3.8 Diagnostics / ops

- Server logs and infra metrics as needed to run the API (no intentional PII in analytics properties).
- **TODO (product):** document any error-reporting SDK if one is added.

### 3.9 AI / matching

- All model calls go through one server-side **gateway** (`packages/ai`, `AI-SYSTEM.md`). Clients never hold AI keys.
- **Deidentified lane** (summaries, quiz moderator, embeddings, freshness): opaque IDs only; scrubber rejects names, emails, phones, handles, and all media. Summaries are built from the person's **own words / transcripts only**, never photos or likeness.
- **Matching / learning:** Nest scores FoF suggestions on opaque IDs using de-identified Zone B/C facts. Suggestion card “why” titles only cite Everyone+matchable shared facts. Private (`none`+matchable) quiz/personality signals may affect scores silently and never appear as evidence titles. Outcomes land in `matching_feedback` (features + label weights only; no message content, names, or UX-analytics). Opting out of Discoverable or deleting an account purges suggestions, feedback pair-rows, and Zone C embeddings. Feedback snapshots age out (~18 months).
- **Personal-agent lane** (Assistant): may see the requester's own visible data only (notes, tier-visible friend facts, upcoming, events). Off by default; admin-gated (`founder_only` ships first); confirmed acts only (`AGENT.md`). Never feeds matching.
- Assistant sessions store turn text server-side for the open conversation only; turns are deleted on close or when the user disables Assistant. Private `assistant_memory_chunks` are per-user only (not Zone C matching embeddings) and cascade on account delete.
- Voice transcripts for Assistant are used in-request only; never written to analytics or used for training.
- Calendar: OS permission requested in context the first time the user confirms an Assistant calendar act. Purpose: add dates and reminders the user confirms. Denial degrades to a calendar handoff.
- Foundation models: API-only under **no-training / zero-retention** terms. We do **not** fine-tune on user content. RAG + our own ranking (later) supply knowledge; content is discarded per request.
- Fail silent: if a job is disabled, over budget, or fails quality/grounding checks, the surface hides. The app stays fully usable with AI off.
- Cost metadata (job, tokens, latency) may be logged for ops; **never** prompt or answer content.
- Matching v1 is friends-of-friends + attribute overlap; embeddings (Zone C) feed matching v2 when enabled.
- Opting out of Discover / account deletion drops Zone C (embeddings, summaries, module notes, freshness prompts) in the same cascade.

---

## 4 · How we use data

- Run the core app: friends, Updates, Events, Messages (limited), Discover, quizzes, Touch Grass, recap Friend Pod, co-op portal.
- Enforce tiers, blocks, and membership perks.
- Send in-app (and later push) notifications the user has allowed.
- Improve the product via **consented** PostHog analytics (not ads, not sold).
- Moderate reported content and enforce Terms.
- Process membership payments when real IAP / card checkout ships.
- **We do not** sell personal data. **We do not** use third-party ad networks. **We do not** train foundation models on user content.

---

## 5 · Who we share with

- **Other users**, only as the user chose (tier / audience / public co-op portal reads).
- **Service providers** that host or process data for us: Supabase (DB/Auth/Storage), AWS (API host), PostHog (product analytics, consented), AI providers (Anthropic / OpenAI) **server-side only** through the PII firewall when AI is enabled, and future payment processors for membership.
- **Law enforcement / legal** when required by law: **TODO (legal): standard compulsion language**.
- Co-op portal public pages are readable without membership; writes require membership. Portal comments display as "A member," not a name.

---

## 6 · Retention and deletion

- Account deletion: hard-delete cascade across Zones A/B/C, media, and derived rows (`DATA.md`). Also purge PostHog person.
- Story / Update storage: free tier rolling ~30 days; co-op members keep longer while membership is active (perks until `dues_paid_through` after cancel-at-period-end).
- Recap answers: rolling window with lazy purge on playlist load (see `complete/RECAP-PODCAST.md`).
- Export on request: **TODO (product + legal): document how a user requests export**.
- In-app account deletion must remain reachable from Settings (App Store requirement).

---

## 7 · Children's privacy / age

- Minimum age appropriate to a social app; age gate at signup: **TODO (legal + product): set exact age (e.g. 13+ / 16+ / 18+) and questionnaire**.
- We do not knowingly collect data from children below that age.

---

## 8 · User choices and controls

- Audience / tier pickers on posts, Touch Grass, polls, recap share.
- Discoverable / matching opt-out (drops Zone C).
- Analytics consent toggle (Settings; ATT on iOS when required).
- Block and report (person and content).
- Cancel co-op at period end; keep perks until paid-through date.
- Skip joining the co-op entirely and keep using the free app.
- "View original" on customized profiles (accessibility / contrast).

---

## 9 · International transfers / security

- **TODO (legal):** hosting regions, SCCs / transfer language if needed.
- RLS on every table; secrets only server-side (Secrets Manager); clients never hold AI or service keys.

---

## 10 · Changes to this policy

- **TODO (legal):** how we notify users of material changes.
- Builders: when product behavior changes, update this draft the same day; do not wait for counsel.

---

## 11 · Contact

- Privacy requests / deletion / export: **TODO (legal): email and mailing address**.

---

## Changelog (builders keep this short)

| Date | What was added / changed |
|---|---|
| 2026-08-06 | AI System gateway: deidentified lane jobs, cost log, fail silent, Zone C cascade; personal_agent lane reserved for opt-in assistant |
| 2026-08-06 | Assistant (opt-in): sessions/turns/private memory; calendar + mic in context; voice transcripts in-request only; no analytics content |
| 2026-08-06 | Matching v1: Nest FoF scorer + matching_feedback; Everyone+matchable evidence; silent none+matchable for quiz/embeddings; Discoverable off purges |
| 2026-08-06 | Spotify-style profile: Top 5 / Current Obsession / Favorites; per-module who-sees + matchable consent; profile intro; co-op Theme + Layout customize; View original / always-plain preference; storage meter honesty |
| 2026-08-06 | Invite links / QR: opaque UUID tokens; QR short-lived (~15m) and deleted on redeem; deep link encodes token only (no name/photo) |
| 2026-08-05 | Initial scaffolding seeded from shipped co-op portal, soft join, PostHog analytics rules, Touch Grass Events-only send, Friend Pod on Friends, quiz-without-AI, polls, profile customize MVP, hard-delete / zones promises. |
