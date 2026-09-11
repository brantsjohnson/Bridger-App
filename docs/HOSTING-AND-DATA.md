<!--
============================================
WHAT THIS FILE DOES (plain English):
This is the single "where does Bridger live" map. It answers, in one place:
what the software is, where it is hosted (AWS), where the database lives
(Supabase), which outside services it uses (email, payments, AI, analytics),
what the domains are, how a deploy happens, and which environment variables
matter. It exists so agents and teammates stop guessing about infrastructure.

Every claim below is grounded in a real file in this repo, and the file is
named next to the claim. Where the repo does not actually say something, it is
marked UNKNOWN on purpose. Nothing here is invented.

This is a READ-ONLY reference doc. It does not change how the app runs. When
the infra changes, update this file in the same change. For the deeper build
contract see guide-docs/INFRASTRUCTURE.md; for the full schema see
guide-docs/DATA.md; for the AWS stacks see infra/aws/.
============================================
-->

# Bridger — Hosting & Data Map

Last audited from the `main` tree. This is a factual map, not a plan. Sources
are cited inline as `path/to/file`.

---

## 1 · What Bridger is (product role)

Bridger is a private friendship / community social app. The whole thing lives
in one pnpm + Turborepo monorepo (`package.json`, `pnpm-workspace.yaml`).

| Surface | Where in repo | What it is |
|---|---|---|
| Consumer app (iOS + Android + web) | `apps/mobile` | One Expo (React Native) + Expo Router codebase that renders to all three targets (`guide-docs/DATA.md` §1, `guide-docs/ARCHITECTURE.md`). |
| Backend API | `apps/api` | NestJS server, one module per domain. The only place that holds AI keys and DB service keys (`apps/api/package.json`). |
| Admin console | `apps/admin` | A Vite single-page app for organizers. Deployed to its own bucket + CDN so it has a separate blast radius from the consumer app (`infra/aws/lib/foundation-stack.ts`, `guide-docs/ADMIN.md`). |
| Marketing site | `apps/site` | A static "coming soon" page plus the legal pages and the deep-link `.well-known` files (`apps/site/public/index.html`). |
| Shared code | `packages/shared`, `packages/permissions`, `packages/ui`, `packages/ai` | Types, the tier/visibility engine, the design system, and the AI client wrapper. |

### "Bridger-App" vs "Bridger.Social"

The repo does not define these as two separate products with one formal
definition, so this is pieced together from concrete identifiers:

- **The app / product** ships under Apple + Google bundle id `social.bridger.app`
  (`apps/mobile/app.config.js`). The Supabase database project is referred to
  informally as "Bridger-App-db" (see §4). So "Bridger-App" = the product app
  and its backing project.
- **`bridger.social`** is the brand / web domain: the Expo owner account is
  `bridger-social` (`apps/mobile/app.config.js`), the marketing site serves at
  `bridger.social` (`infra/aws/bin/bridger.ts` comment), and the contact address
  is `hello@bridger.social` (`apps/site/public/index.html`, `apps/api/.env.example`).
- **`bridger.app`** is the deep-link / universal-link domain used by invite,
  quiz, and event links (`apps/mobile/app.config.js`,
  `apps/site/public/.well-known/README.md`).

UNKNOWN: whether "Bridger.Social" is a distinct sub-product or just the brand /
domain. The repo only supports the domain / brand reading above.

---

## 2 · Mobile clients (Expo / EAS)

- One Expo app in `apps/mobile`; native builds via **EAS Build**, web via
  `expo export` (`guide-docs/INFRASTRUCTURE.md`).
- App identity (`apps/mobile/app.config.js`): name `Bridger`, slug
  `brantsjohnson`, Expo owner `bridger-social`, version `0.0.1`, scheme
  `bridger://`, iOS `bundleIdentifier` and Android `package` both
  `social.bridger.app`, `usesAppleSignIn: true`.
- EAS project id `6f732be5-8d08-43ad-8463-2e932c2444a8` (default in
  `apps/mobile/app.config.js`, overridable via `EAS_PROJECT_ID`).
- Build profiles (`apps/mobile/eas.json`): `development`, `development_device`,
  `preview` (store distribution, internal), `production`. Demo unlock is on for
  dev / preview and off for production.
- **iOS status:** App Store Connect app id `6801281923` is set in
  `eas.json → submit.*.ios.ascAppId`; Apple Team ID is `DG6NU23FXX`
  (`apps/site/public/.well-known/apple-app-site-association`). Universal Links
  are intentionally **paused** for TestFlight (`ios.associatedDomains` is
  commented out in `app.config.js`); invite/QR links use the `bridger://` scheme
  until Associated Domains is re-enabled.
- **Android status:** submit config points at the Play **internal** track as a
  **draft** (`eas.json → submit.*.android`). App Links for `bridger.app`
  (`/invite`, `/q`, `/e`) are declared with `autoVerify: true` but need the
  hosted `assetlinks.json` SHA-256 filled in
  (`apps/site/public/.well-known/assetlinks.json`, `.well-known/README.md`).
- CI does **not** run EAS builds yet (`guide-docs/INFRASTRUCTURE.md`).

---

## 3 · Backend hosting (AWS)

Infrastructure is AWS CDK in `infra/aws/` (TypeScript), split into two stacks
(`infra/aws/bin/bridger.ts`).

- **Region: `us-east-1`** for all AWS resources. Chosen because App Runner is
  not offered in Canada and `us-east-1` is nearest to the Supabase database
  region (documented as `ca-central-1`) — see `infra/aws/bin/bridger.ts` and
  `infra/aws/README.md`.

### `BridgerServiceStack` — the API (`infra/aws/lib/service-stack.ts`)

- **AWS App Runner** service named `bridger-api`.
- Runs the NestJS container built from `apps/api/Dockerfile` (build context is
  the repo root; forced to `linux/amd64`; image pushed to ECR by CDK).
- Container port `3000`; health check `GET /health`
  (`apps/api/src/health/health.controller.ts`).
- Size: `0.25 vCPU` / `0.5 GB`; `autoDeploymentsEnabled: false` (deploys are on
  purpose, not on every image push).
- Instance role is least-privilege: it may read only the one server secret and
  decrypt it via that secret's KMS key.
- Secret env fields are injected at runtime from Secrets Manager (see §7).

**Public API base URL:** `https://jiyzei8qqu.us-east-1.awsapprunner.com`
(the value baked into every EAS build profile as `EXPO_PUBLIC_API_URL` in
`apps/mobile/eas.json`). This matches the "known hint" in the audit request.
The exact value is otherwise only printed at deploy time as the `ApiUrl` stack
output. UNKNOWN: whether a custom API domain (e.g. `api.bridger.social`) is in
front of it in production — `API_PUBLIC_URL` exists as a config field but no
value lives in the repo.

### `BridgerFoundationStack` — secrets + web hosting (`infra/aws/lib/foundation-stack.ts`)

- **AWS Secrets Manager** secret `bridger/api/server`, encrypted with a
  dedicated **KMS** key (yearly rotation, `RETAIN` on delete). Starts empty; real
  values are written by a separate write-only step (`infra/aws/scripts/seed-secret.mjs`).
- **Consumer web hosting:** private **S3** bucket + **CloudFront** distribution
  (serves the `expo export` web build; SPA fallback to `/index.html`). Optional
  custom domains via `WEB_DOMAIN_NAMES` (e.g. `bridger.social,www.bridger.social`)
  + an ACM cert in `us-east-1`.
- **Admin console hosting:** a **separate** private S3 bucket + CloudFront
  distribution (serves the `apps/admin` Vite build), kept apart on purpose.

Not used: there is no ECS, Lambda, Amplify, or EC2 in `infra/aws/`. API hosting
is App Runner only. (`guide-docs/INFRASTRUCTURE.md` lists ECS Fargate as an
alternative, but the committed CDK uses App Runner.)

---

## 4 · Database (Supabase)

- **Supabase** provides Postgres + pgvector + Auth + Storage + Row-Level
  Security (`guide-docs/DATA.md` §2, `guide-docs/ARCHITECTURE.md`). There is **no
  Prisma** in the tree despite `ARCHITECTURE.md` mentioning an `infra/prisma`
  folder — the schema is raw SQL migrations under `infra/supabase/migrations/`
  (59 numbered files).
- **Project ref / id:** `fewtcanrxmdzyqhlgpdr` — API URL
  `https://fewtcanrxmdzyqhlgpdr.supabase.co` (`apps/mobile/eas.json`
  `EXPO_PUBLIC_SUPABASE_URL`). Informally called **"Bridger-App-db"** in the
  audit request; this project ref matches the hint.
- **Postgres major version 17** (`infra/supabase/config.toml`).
- **Connection style:**
  - The app (client) uses the public URL + a **publishable** key
    `sb_publishable_...` (safe to ship; RLS protects data) — `apps/mobile/eas.json`,
    `apps/mobile/.env.example`.
  - The API (server) uses the **secret** key `sb_secret_...`
    (`SUPABASE_SECRET_KEY`) via `@supabase/supabase-js`, bypassing RLS as trusted
    code (`apps/api/src/supabase/supabase.service.ts`).
  - Direct SQL uses `DATABASE_URL`, documented as the Supabase **session
    pooler** URI `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
    (`apps/api/.env.example`).
- **Region:** documented as **`ca-central-1`** (Canada) in `infra/aws/README.md`
  and `infra/aws/bin/bridger.ts`. UNKNOWN: not independently verifiable from the
  repo; treat `ca-central-1` as the documented value and confirm in the Supabase
  dashboard if it matters.

### Key tables (grounded in `guide-docs/DATA.md` §5 + `infra/supabase/migrations/`)

The schema is domain-grouped. Highlights, keyed by privacy zone:

- **Identity & settings (Zone A / PII):** `users`, `user_identity`,
  `user_contacts`, `user_settings`.
- **Attributes (Zone B / de-identified facts):** the tagged-twice `attributes`
  pool (`visible_to_tier` + `matchable`).
- **Relationships:** `connections`, `tiers`, plus the `can_view()` gate function
  used by RLS.
- **Content:** `media`, `stories`, `day_summaries`, `reactions`, `quips`
  (Inside Jokes), `bucket_list`, `events`, `event_invites`, `polls`,
  `touch_grass`, weekly activities, `scrapbook_pages` / `scrapbook_elements`
  (Collage), recap podcast tables.
- **AI / RAG (Zone C / derived, deletable):** `person_embeddings`,
  `person_summaries` (pgvector; RLS on, no policy — server-only by design).
- **Membership & payments:** `coop_memberships`, `coop_promo_codes`,
  `coop_promo_redemptions`, payment-provider tables.
- **Admin / config:** `admin_config`, quizzes / `quiz_registry`, notifications,
  delights, announcements, `client_not_found_hits`.

Privacy invariants (RLS everywhere, hard-delete cascades, AI never sees PII) are
enforced at the DB layer — see `guide-docs/DATA.md` and
`infra/supabase/README.md`.

---

## 5 · Auth, email, payments, and other outbound services

Every outbound integration also has a non-secret health probe in
`apps/api/src/admin/integrations-health.service.ts` (the admin
`GET /admin/integrations/health` page).

| Service | Role | Evidence |
|---|---|---|
| **Supabase Auth** | Email + Google + Apple sign-in; phone OTP | `guide-docs/DATA.md`, `apps/mobile/.env.example`, `infra/supabase/config.toml` |
| **Twilio** | SMS provider behind Supabase Auth phone OTP | `config.toml [auth.sms.twilio]`, `integrations-health.service.ts` (`TWILIO_*`) |
| **Resend** | Transactional email (co-op portal notifications) | `RESEND_API_KEY`, `COOP_IDEA_REVIEW_EMAIL=hello@bridger.social` (`apps/api/.env.example`) |
| **RevenueCat** | iOS / Android co-op membership IAP; product `social_bridger_app_pro` (`monthly` / `yearly`); webhook `POST /coop/webhooks/revenuecat` | `guide-docs/INFRASTRUCTURE.md`, `REVENUECAT_WEBHOOK_SECRET` |
| **Stripe** | Web card membership; Checkout `POST /coop/checkout/stripe`, webhook `POST /coop/webhooks/stripe`; prefers restricted `rk_` keys | `apps/api/package.json` (`stripe` dep), `apps/api/.env.example`, `apps/api/src/coop/stripe.service.ts` |
| **Anthropic (Claude)** | Summaries + quiz moderation; server-side only | `ANTHROPIC_API_KEY` |
| **OpenAI** | Embeddings; server-side only | `OPENAI_API_KEY` |
| **Spotify** | Account linking (not login), search, picks | `SPOTIFY_*`, `apps/api/src/music/` |
| **Apple Music (MusicKit)** | Account linking (not login) | `APPLE_MUSIC_*`, `apps/api/src/music/apple-music-jwt.ts` |
| **PostHog** | Product analytics (US cloud `https://us.i.posthog.com`); on only after sign-in + opt-in | `POSTHOG_*`, `apps/api/src/posthog/`, `apps/api/.env.example` |
| **ImageMagick** | Local binary for server-side photo filters (not an outbound API) | `apps/api/src/photo-filters/` |

Payments note: Stripe Connect is **not** used for co-op dues (dues pay Bridger;
peer chip-in handles like Venmo / Cash App are plain text links, never processed)
— `guide-docs/INFRASTRUCTURE.md`.

---

## 6 · Domains

| Domain | Purpose | Evidence |
|---|---|---|
| `bridger.social` (+ `www.bridger.social`) | Marketing site + brand; contact `hello@bridger.social` | `infra/aws/bin/bridger.ts`, `apps/site/public/index.html`, `apps/api/.env.example` |
| `bridger.app` | Deep links / Universal + App Links: `/invite/<token>`, `/q/<token>`, `/e/<id>` | `apps/mobile/app.config.js`, `apps/site/public/.well-known/` |
| `jiyzei8qqu.us-east-1.awsapprunner.com` | Current public API base (App Runner default host) | `apps/mobile/eas.json` |
| `*.cloudfront.net` | Default web + admin CDN hosts until custom domains are attached | `infra/aws/lib/foundation-stack.ts` |
| `fewtcanrxmdzyqhlgpdr.supabase.co` | Supabase API host for the DB project | `apps/mobile/eas.json` |

UNKNOWN: whether `bridger.social` and `bridger.app` DNS are pointed at the
CloudFront distributions / App Runner today (the CDK supports custom web domains
via env vars, but no committed value proves the live DNS wiring).

---

## 7 · How deploys work

- **CI (checks only):** `.github/workflows/ci.yml` runs on every PR and on push
  to `main`: install (pnpm), `pnpm build`, `pnpm typecheck`, `pnpm test`. There
  is **no automated deploy** in CI yet (no EAS, no App Runner rollout, no S3
  sync in the workflow).
- **API deploy (manual, CDK):** per `infra/aws/README.md` —
  1. `pnpm --filter @bridger/infra deploy BridgerFoundationStack` (secret vault +
     web hosting).
  2. Fill the secret with `node infra/aws/scripts/seed-secret.mjs` (write-only;
     merges from `apps/api/.env`).
  3. `pnpm --filter @bridger/infra deploy BridgerServiceStack` (builds the Docker
     image, pushes to ECR, rolls out App Runner). Prints `ApiUrl`.
  - Requires Docker running + active AWS credentials.
- **Web deploy:** `expo export` the web build, upload to the foundation stack's
  S3 bucket, invalidate CloudFront (`infra/aws/README.md` notes this is not yet
  scripted in CI).
- **Admin deploy:** Vite build of `apps/admin` → the admin S3 bucket + CloudFront.
- **Native deploy:** EAS Build → TestFlight (iOS) / Play internal track (Android)
  via `eas submit` (`apps/mobile/eas.json`, `guide-docs/INFRASTRUCTURE.md`).

---

## 8 · Environment variables that matter (names only, no secrets)

### API server (`apps/api/.env.example`, seeded into Secrets Manager `bridger/api/server`)

`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`,
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `AI_WORKER_INTERVAL_MS`,
`ASSISTANT_FOUNDER_USER_IDS`, `APP_WEB_URL`, `API_PUBLIC_URL`,
`RESEND_API_KEY`, `COOP_IDEA_REVIEW_EMAIL`,
`COOP_ADMIN_USERNAMES`, `COOP_ADMIN_EMAILS`, `ADMIN_API_KEY`,
`ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`,
`EMAIL_HMAC_KEY`, `EMAIL_ENCRYPTION_KEY`,
`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`,
`MUSIC_TOKEN_ENCRYPTION_KEY`,
`APPLE_MUSIC_TEAM_ID`, `APPLE_MUSIC_KEY_ID`, `APPLE_MUSIC_MEDIA_ID`,
`APPLE_MUSIC_PRIVATE_KEY` (or `_PATH`), `APPLE_MUSIC_ORIGIN`,
`POSTHOG_HOST`, `POSTHOG_API_HOST`, `POSTHOG_PROJECT_ID`,
`POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_API_KEY`,
`REVENUECAT_WEBHOOK_SECRET`,
`STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`,
`STRIPE_WEBHOOK_SECRET`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGE_SERVICE_SID`,
`TWILIO_FROM_NUMBER`,
`BRIDGER_SERVER_SECRET_NAME` (tells Nest which vault to read at boot),
`AWS_REGION`, `PORT`.
(Canonical field list: `infra/aws/server-secret-keys.json`.)

### Mobile app — public only (`apps/mobile/.env.example`, `apps/mobile/eas.json`)

`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`,
`EXPO_PUBLIC_AUTH_MODE`, `EXPO_PUBLIC_APP_LINK_BASE`,
`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`,
`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`,
`EXPO_PUBLIC_REVENUECAT_API_KEY` / `_IOS_KEY` / `_ANDROID_KEY`,
plus demo flags (`EXPO_PUBLIC_DEMO_MODE`, `EXPO_PUBLIC_DEMO_UNLOCK`, etc.),
and `EAS_PROJECT_ID`.

### Admin console (`apps/admin/.env.example`)

`VITE_API_URL` (points at the NestJS API). The admin password stays on the
server, never here.

### Supabase Auth (local config, `infra/supabase/config.toml`)

`SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN`, `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET`,
and the OrioleDB/S3 experimental `S3_*` keys (all via env substitution, never
committed).

---

## 9 · Open UNKNOWNs (not in the repo; do not guess)

- Live DNS wiring of `bridger.social` / `bridger.app` to CloudFront / App Runner.
- Whether a custom API domain fronts App Runner in production (`API_PUBLIC_URL`
  has no committed value).
- The actual Supabase project region (documented `ca-central-1`, not verifiable
  in-repo).
- AWS account id / any per-environment (staging vs prod) split — the CDK uses a
  single account from active credentials and one region.
- Real values of any secret (by design: the vault ships empty).
