# Bridger — Infrastructure (build & deploy guide for Cursor)

This is the infrastructure contract Cursor should follow. It makes one codebase ship to **iOS, Android, and web**, keeps the **privacy/deletion** guarantees real, and keeps **all AI + secrets server-side**. Read `ARCHITECTURE.md` and `DATA.md` alongside this.

> **Where things actually live right now:** for a factual, evidence-cited map of the deployed hosting (AWS App Runner + S3/CloudFront), the Supabase database project, domains, and env vars, see [`docs/HOSTING-AND-DATA.md`](../docs/HOSTING-AND-DATA.md). This doc is the contract; that one is the current map.

---

## The stack (recommended, decided)

| Layer | Choice | Why |
|---|---|---|
| Clients (iOS + Android + web) | **Expo + Expo Router** (one `apps/mobile` codebase) | one codebase → all three platforms; EAS builds native, `expo export` builds web |
| API | **NestJS**, containerized | domain modules already speced in `ARCHITECTURE.md` |
| API hosting | **AWS App Runner** (simplest) or **ECS Fargate** (more control) | autoscaling containers; AWS startup credits help; Cursor can script it via IaC |
| Data | **Supabase** — Postgres + **RLS** + **pgvector** + Auth + Storage | one managed service for DB, auth, media, and vectors; delivers the tier/privacy model |
| AI | **Anthropic API** (summaries, quiz moderation) + **OpenAI embeddings** | called **only** from the API server |
| IaC | **Terraform** or **AWS CDK** | Cursor generates it; no console clicking |
| CI/CD | **GitHub Actions** + **EAS** | build/test/deploy on push; EAS for app-store builds |

### Explicitly decided
- **No blockchain.** User data control is a *permissions + deletion* problem, not a ledger. Blockchain is immutable/append-only — the opposite of "delete anytime." Postgres + RLS + hard-delete cascades + export **is** the answer (see "Data ownership" below).
- **Stay with Supabase.** Known to the team, excellent with Cursor, and it's what `DATA.md` assumes.
- **Don't scatter providers.** Supabase (data) + AWS (API) + Expo/EAS (clients). Vercel is optional and only for the web build if desired — not required.

---

## One codebase → three platforms

- `apps/mobile` is the single Expo app. **Expo Router** gives file-based routing across iOS, Android, and web.
- **Native builds:** EAS Build (`eas build -p ios|android`). **Web:** `expo export --platform web` → static hosting (S3 + CloudFront, or Vercel/Netlify).
- Write **platform-agnostic** code; isolate the rare platform-specific bits behind `.ios/.android/.web` files or `Platform.select`.
- Media capture (camera-only for stories) uses Expo modules; the **profile photo** allows library upload (the one exception — see `ONBOARDING.md`).

---

## Data ownership & deletion (the privacy guarantee, in infra terms)

This is *why* we don't need a blockchain — Postgres already gives users full control:

- **RLS everywhere.** Every table has row-level security enforcing the tier model (`DATA.md` zones A/B/C). A viewer can only read rows their relationship + `visible_to_tier` allow — defense-in-depth even if the API errs.
- **Hard-delete cascades.** Deleting a field, a connection, or an account triggers `ON DELETE CASCADE` (and edge cleanup) so data is *actually gone*, not soft-flagged. Opting out of matching drops the person's embeddings + summaries.
- **Export.** A user can export their data (their own rows) on request.
- **Turn it off.** "Turn off my data" = flip discoverability/matchable flags and drop derived AI rows (embeddings/summaries); the source rows stay only as long as the user keeps them.
- **AI never sees PII.** Embeddings/summaries are built from Zone B (de-identified facts) + user words only — never faces/photos/likeness, never trained on.

---

## Secrets & AI keys (server-side only)

- **Never** put `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or DB service keys in the client bundle. The app holds only the Supabase **anon** key + public config.
- Store secrets in **AWS Secrets Manager** secret `bridger/api/server` (JSON, one field per env name). App Runner injects a short allow-list. Nest also **reads the whole vault at boot** (`BRIDGER_SERVER_SECRET_NAME`) so Stripe, RevenueCat, and the MusicKit `.p8` are used even when they were added later. Never log values. Local laptop keeps using `apps/api/.env` when that name is unset.
- All AI calls (day/week summaries, quiz moderation, embedding generation) run in the **API server**, which is the only thing holding the keys.
- **Field encryption keys** for member PII and messages follow **`docs/ENCRYPTION-AND-ACCESS.md`**: ciphertext in Supabase, DEKs in KMS/Secrets Manager, phone lookup HMAC in a **second** lockbox. No production cutover in the docs-only pass; when live, admin health reports config presence only (never secret values).

### Env vars (API server)
```
# Auth / DB (Supabase)
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, DATABASE_URL
# AI
ANTHROPIC_API_KEY            # Claude — summaries + quiz moderator
OPENAI_API_KEY               # embeddings
# Email (co-op portal notifications, per COOP-PORTAL.md)
RESEND_API_KEY, COOP_IDEA_REVIEW_EMAIL
# Co-op admin allowlists (COOP-PORTAL.md)
COOP_ADMIN_USERNAMES, COOP_ADMIN_EMAILS, ADMIN_API_KEY
# Crypto — see docs/ENCRYPTION-AND-ACCESS.md (split-key custody; pass 1 docs only)
# Legacy portal stubs until platform cutover:
EMAIL_HMAC_KEY, EMAIL_ENCRYPTION_KEY
# Future: KMS-wrapped DEKs, separate phone_lookup_hmac secret (never same JSON as DEKs)
# Product analytics (PostHog Cloud; host is configurable for EU / self-host)
POSTHOG_HOST, POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY
# Optional override if REST API host differs from ingest host
# POSTHOG_API_HOST
```
Client env (public): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`.

The PostHog **project** key (`phc_...`) is write-only and may live in the app. The **personal** API key stays on the Nest server so we can purge a person on opt-out / account delete. Capture is off until the person opts in under Settings.

---

## AI services (where each runs)

| Job | Model | Trigger | Notes |
|---|---|---|---|
| Day/week summaries | Anthropic | at post time (not on view) | from update text + transcripts only (`STORIES.md`) |
| Video transcription | speech-to-text | at post time | powers summaries + accessibility |
| Embeddings | OpenAI | on new/changed matchable attributes | stored in pgvector, de-identified |
| Person summary (matching) | Anthropic | on attribute change / freshness | Zone C, opaque IDs (`DATA.md`) |
| **Quiz moderator** | Anthropic | during a quiz, per response | confidence + adaptation, never sets the score (see `QUIZ-ENGINE.md`) |
| Matching / suggestions | pgvector + rules | on demand | reads B+C → opaque IDs, names rejoined on-device |

---

## Deployment topology

- **API** → container image → App Runner service (autoscale on CPU/req). Health check `/health`.
- **Supabase** → managed project (DB migrations via Supabase CLI / Prisma migrate in CI).
- **Web** → `expo export` → S3 + CloudFront (or Vercel).
- **Native** → EAS Build → TestFlight / Play Console.
- **Background jobs** (summary regen, co-op idea 48h auto-approve per `COOP-PORTAL.md`, reminder fan-out) → a scheduled worker (App Runner cron / EventBridge + a small worker service).

---

## TestFlight / EAS (iOS ship checklist)

Repo pieces live under `apps/mobile`: `eas.json` (build profiles), `app.config.ts` (bundle id `social.bridger.app`, privacy stubs, env mirrors). CI does **not** run EAS yet. No Apple or Expo secrets belong in git.

**Profiles**

| Profile | Who gets it | Demo long-press (`EXPO_PUBLIC_DEMO_UNLOCK`) |
|---|---|---|
| `development` | Dev client / simulator | on |
| `preview` | Internal TestFlight-style builds | on |
| `production` | App Store | **off** for now (flip later if we want store demos) |

**Your account steps (do once)**

1. Create a free [Expo](https://expo.dev) account.
2. In a terminal: `cd apps/mobile` → `npx eas-cli login` → `npx eas-cli init` (links the project; paste the printed `projectId` into `app.config.ts` → `extra.eas.projectId`, or set `EAS_PROJECT_ID` in the EAS dashboard env).
3. In [Apple Developer](https://developer.apple.com) / [App Store Connect](https://appstoreconnect.apple.com): create a new iOS app with bundle id **`social.bridger.app`**. Note the numeric App Store Connect app id and put it in `eas.json` → `submit.*.ios.ascAppId` (replace `REPLACE_AFTER_APP_STORE_CONNECT`).
4. First build (EAS can create certs/profiles for you):  
   `pnpm --filter @bridger/mobile eas:build:ios:preview`  
   or `cd apps/mobile && npx eas-cli build -p ios --profile preview`.
5. Submit to TestFlight:  
   `pnpm --filter @bridger/mobile eas:submit:ios`  
   or `npx eas-cli submit -p ios --latest` (use the preview submit profile when prompted).
6. In App Store Connect → TestFlight → Internal Testing: add yourself, install from the TestFlight app.
7. On Sign in: long-press the Bridger logo → confirm → walk the fake-data demo (preview / development builds only).

**Local unlock without a store build:** set `EXPO_PUBLIC_DEMO_UNLOCK=1` in `apps/mobile/.env` (see `.env.example`). `EXPO_PUBLIC_DEMO_MODE=1` still forces demo on at launch for localhost.

---

## Deep links / Universal Links (tappable `https://bridger.app/…`)

Tapping a friend's "add me" invite link, a shared quiz result, or an event link should open the app directly. Two layers make that work; the app side is wired, the hosting side needs two account values.

**Already wired (app side):**
- Custom scheme `bridger://` (works immediately once installed; e.g. `bridger://invite/<token>`). This is the default the QR/link currently uses, so scanning a QR and tapping a `bridger://` link already open the app.
- `apps/mobile/app.config.js`: `ios.associatedDomains: ['applinks:bridger.app']` and `android.intentFilters` (`autoVerify: true`) for `https://bridger.app/invite|/q|/e`.
- Routes exist for the paths: `app/invite/[token].tsx`, `app/q/[token].tsx` (event handled elsewhere). Expo Router matches the incoming link path to these automatically.

**Remaining steps to make `https://` links open the app (do once):**
1. Fill `apps/site/public/.well-known/apple-app-site-association` → replace `REPLACE_WITH_APPLE_TEAM_ID` with the Apple Team ID (`eas credentials -p ios`). Result: `<TEAMID>.social.bridger.app`.
2. Fill `apps/site/public/.well-known/assetlinks.json` → replace `REPLACE_WITH_ANDROID_SHA256_CERT_FINGERPRINT` with the app-signing SHA-256 (`eas credentials -p android`).
3. Serve both files over HTTPS from **`bridger.app`** at `/.well-known/…` (`assetlinks.json` with `Content-Type: application/json`, AASA as JSON, no redirects). See `apps/site/public/.well-known/README.md`.
4. Switch invite links to https so they are tappable in messages: set `EXPO_PUBLIC_APP_LINK_BASE=https://bridger.app` (mobile) and `APP_LINK_BASE=https://bridger.app` (API). Leave unset to keep the `bridger://` scheme.
5. Rebuild native apps with EAS so iOS/Android re-fetch the association files.

Note: the invite link domain (`bridger.app`) must be the same domain that serves the `.well-known` files. If the marketing site is on a different host, that host must still serve `bridger.app`'s `.well-known` files.

---

## Play Console / EAS (Android ship checklist)

You do **not** need an Android phone to open Play Console, create the app, or upload the first build. EAS builds the Android App Bundle (`.aab`) in the cloud. Play Console is the Google equivalent of App Store Connect. Internal testing is the Google equivalent of TestFlight internal.

Repo pieces live under `apps/mobile`: `eas.json` (Android submit goes to the **internal** track as a **draft** until we flip it), `app.config.js` (package `social.bridger.app`). No Google service-account JSON belongs in git.

**Profiles**

| Profile | Who gets it | Demo long-press (`EXPO_PUBLIC_DEMO_UNLOCK`) |
|---|---|---|
| `development` | Dev client / emulator | on |
| `preview` | Internal testing (friends / you) | on |
| `production` | Play Store listing | **off** for now |

**Your account steps (do once, in a browser)**

1. Create a [Google Play Developer](https://play.google.com/apps/publish/signup/) account ($25 one-time). Use the company Google account if we have one; a **personal** account created after Nov 2023 cannot go public until a closed test with **12 opted-in testers for 14 continuous days**. An **organization** account skips that tester gate. Identity verification is required either way.
2. In [Play Console](https://play.google.com/console) → **Create app**. Name: Bridger. Default language: English (US). App or game: App. Free. Confirm the declarations.
3. Package name must stay **`social.bridger.app`** (already in `app.config.js`). Do not change it after the first upload. Google registers it to this developer account.
4. Complete the dashboard checklist far enough to unlock testing: store listing (short + full description, 512×512 icon, feature graphic 1024×500, phone screenshots), **Privacy policy URL**, Data safety form, Content rating questionnaire, Target audience, News app declaration (we have a News tab: answer honestly), Ads declaration (**no ads**). Soft-join era answers: **purchase digital goods = No** (co-op billing not live yet); **precise location shared with other users = No** (Local map not shipped).
5. Create a Google Cloud **service account** and invite it into Play Console so EAS can upload for you. Follow Expo's [creating a Google Service Account key](https://expo.fyi/creating-google-service-account) guide. Upload the JSON to Expo (project → Credentials → Android → Google Service Account Key). **Never commit that JSON.**

**Co-op payments:** iOS/Android membership uses RevenueCat (`social_bridger_app_pro`, packages `monthly` / `yearly`). Mobile public keys: `EXPO_PUBLIC_REVENUECAT_API_KEY` (Test Store) or platform `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`. Server webhook: `POST /coop/webhooks/revenuecat` with `REVENUECAT_WEBHOOK_SECRET`. **Stripe card (web):** `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`, `STRIPE_WEBHOOK_SECRET`; Checkout at `POST /coop/checkout/stripe`, webhook `POST /coop/webhooks/stripe`. Prefer restricted keys (`rk_`). Connect is not used for co-op dues (dues pay Bridger; chip-in stays peer P2P). Server product events `coop_renewed` / `coop_expired` need `POSTHOG_PROJECT_API_KEY`. Step-by-step remaining dashboard work: `guide-docs/complete/COOP-PAYMENTS-SETUP.md`. Update Play Console / App Store Connect data-safety answers when store products go live.
- App content → **Does the app allow users to purchase digital goods?** → flip to **Yes**
- Set up the co-op product / subscription in Play Console Monetize (and mirror on Apple)
- Data safety: declare purchase / financial info as collected if applicable
- Privacy policy URL page + `guide-docs/docs/PRIVACY.md` / `TERMS.md`: real payment processor, refunds, cancel-at-period-end
- Ads stays **No** unless that changes

**TODO when Local map / friend location sharing ships:** App content → **share current and precise physical location with other users?** → update honestly (likely **Yes** if friends see live/precise position; keep **No** if only coarse opt-in towns). Update Data safety + privacy policy the same day.
6. First Android build (EAS creates the upload keystore; keep it on Expo, not in git):  
   `pnpm --filter @bridger/mobile eas:build:android:preview`  
   or `cd apps/mobile && npx eas-cli build -p android --profile preview`.
7. First submit lands on **internal testing** as a **draft** (see `eas.json` → `submit.*.android`):  
   `pnpm --filter @bridger/mobile eas:submit:android`  
   or `npx eas-cli submit -p android --latest`. Then in Play Console, finish the draft release so testers can install from the opt-in link.
8. Add yourself (and later friends) as **internal testers**. They install from the Play Store opt-in link on a real Android device. You can also use Play Console **Pre-launch report** (Google runs the `.aab` on their devices) without owning a phone.
9. Before a **public** listing, if this is a new personal developer account: run **closed testing** with at least 12 opted-in testers for 14 continuous days, then apply for production access from the Play Console dashboard.

**Testing without an Android phone**

- **Mac emulator:** install Android Studio, create a Pixel virtual device, run `pnpm --filter @bridger/mobile android` (Expo Go / dev client) or install a preview **APK** from EAS (set `android.buildType` to `apk` only for that local/emulator install; Play Console still needs an `.aab`).
- **Play Console Pre-launch report:** after the first `.aab` upload, Google crawls the app on real devices and posts screenshots + crash logs.
- **Internal testing link:** send to anyone with an Android phone. They do not need to sideload.

**Do not**

- Put `google-services.json` or the Play service-account key in the repo.
- Change `android.package` after the first Play upload.
- Submit an `.apk` to Play. New apps must be an Android App Bundle (`.aab`). The `preview` / `production` profiles already set `buildType: app-bundle`.

---

## Build order for Cursor (so nothing's missed)

1. **Monorepo scaffold** — pnpm + Turborepo; `apps/mobile` (Expo Router), `apps/api` (NestJS), `packages/shared|permissions|ui`.
2. **Supabase project + schema** — translate `DATA.md` into migrations (all tables, RLS policies, pgvector). Seed the co-op portal defaults (`COOP-PORTAL.md`).
3. **Auth** — Supabase Auth (email + Google + Apple); session middleware in the API.
4. **Core domain modules** — profiles, attributes, tiers, connections, then the rest per `ARCHITECTURE.md`.
5. **Privacy plumbing** — RLS policies, delete cascades, export endpoint, matchable/discoverable flags. Verify a delete actually erases.
6. **AI layer** — server-side Anthropic/OpenAI clients; summaries at post time; embeddings on attribute change; the **quiz engine** (`QUIZ-ENGINE.md`).
7. **Clients from Magic Patterns** — bring the built components in as the `packages/ui` kit; wire screens to the API.
8. **Co-op portal** — Nest `apps/api/src/coop/` + Expo `/coop` routes (`complete/COOP-PORTAL.md`), reusing app auth + `coop_memberships`.
9. **IaC + CI/CD** — Terraform/CDK for App Runner + Secrets Manager + S3/CloudFront; GitHub Actions + EAS.
10. **Ship** — EAS builds for stores; web to CloudFront.

---

## Acceptance criteria

- [ ] One Expo codebase builds iOS, Android, and web; no platform-forked business logic.
- [ ] All AI + DB service keys are server-side (Secrets Manager); the client holds only the Supabase anon key.
- [ ] RLS enforces the tier model on every table; a delete hard-cascades and drops derived AI rows; export works.
- [ ] No blockchain; data is mutable + erasable in Postgres.
- [ ] Summaries/embeddings/quiz moderation run only in the API; embeddings live in pgvector; nothing trains on PII/photos.
- [ ] IaC provisions the API host, secrets, and web hosting; CI builds/tests/deploys on push.
