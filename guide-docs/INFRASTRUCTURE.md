# Bridger — Infrastructure (build & deploy guide for Cursor)

This is the infrastructure contract Cursor should follow. It makes one codebase ship to **iOS, Android, and web**, keeps the **privacy/deletion** guarantees real, and keeps **all AI + secrets server-side**. Read `ARCHITECTURE.md` and `DATA.md` alongside this.

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
- Store secrets in **AWS Secrets Manager** (or App Runner env from Secrets Manager); inject at runtime.
- All AI calls (day/week summaries, quiz moderation, embedding generation) run in the **API server**, which is the only thing holding the keys.

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
# Crypto (email hashing / encryption, per existing portal)
EMAIL_HMAC_KEY, EMAIL_ENCRYPTION_KEY
```
Client env (public): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`.

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
