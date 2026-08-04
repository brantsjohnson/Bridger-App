# Bridger — Admin Console Build Plan (execution-ready)

This is the step-by-step build plan for the **Admin** feature. It is written so an
executor (Grok) can implement it end to end without re-deriving decisions. The
product spec lives in `ADMIN.md`, `DELIGHT.md`, and `QUIZ-ENGINE.md`; this document
is the *how to build it* companion. When this plan and a spec disagree, the spec in
`guide-docs/` wins (see doc authority in `.cursor/rules/guide-rules.mdc`).

No em dashes anywhere in code, copy, or resource names (project rule). Every file
gets a plain-English header comment and every meaningful section a one-line comment
(project rule 4).

---

## 0 · Locked decisions (do not re-litigate)

These were decided with the founder before writing this plan:

1. **Where the console lives:** a new workspace app at `apps/admin`, built with
   **Vite + React + TypeScript + Tailwind**. It is a static single-page app,
   deployed to its own S3 + CloudFront (separate from the consumer web build). It
   talks to the same NestJS API. It imports `@bridger/shared` for types. It is
   still "separately deployable" per `ADMIN.md` even though it sits in the monorepo.
2. **Scope of this build:** the full vertical slice —
   - the admin console UI (`apps/admin`),
   - the NestJS admin + public API endpoints (`apps/api`),
   - the mobile-side **quiz-plugin host + registry** and **delight host + registry**,
   - wiring the mobile app's feed / co-op / themed prompts / weekly activity / quiz
     to read from the real API (behind the existing `isDemoMode()` switch, so demo
     mode keeps working untouched).
3. **Admin sign-in:** a single admin (the founder). A **password gate**. The
   password is a **server-side secret** (`ADMIN_PASSWORD`, default `brantsjohnson`,
   changeable via Secrets Manager) — it is NEVER hardcoded in the `apps/admin`
   client bundle. The API checks the password and issues a short-lived signed admin
   session token (JWT signed with `ADMIN_JWT_SECRET`). All admin endpoints require
   that token via an `AdminGuard`.

---

## 1 · What already exists (verified against the repo)

Read these before touching anything; they change the plan meaningfully.

- **Monorepo:** pnpm `10.12.1` + Turbo, workspaces `apps/*`, `packages/*`,
  `infra/*`. Node 20. Shared types in `@bridger/shared`.
- **API (`apps/api`):** NestJS skeleton. Only `GET /health` and auth-guarded
  `GET /me` exist. `SupabaseAuthGuard` (verifies the Supabase user JWT via JWKS)
  and `SupabaseService` (admin client using `SUPABASE_SECRET_KEY`) are already
  working. `.env.example` already lists `ADMIN_API_KEY`, `COOP_ADMIN_EMAILS`,
  `COOP_ADMIN_USERNAMES`. Port 3000. Dockerfile + App Runner (CDK) already set up.
- **Database (Supabase):** most admin tables ALREADY EXIST (migrations 0011+). Do
  not recreate them. Confirmed columns via `packages/shared/src/database.types.ts`:
  - `admin_config`: `home_defaults jsonb`, `live_quiz_slug text|null`,
    `themed_prompts jsonb`, `updated_at`. One row.
  - `quiz_registry`: `slug (PK)`, `title`, `status` (`quiz_status`: live|draft|archived),
    `live_week text|null`, `friends_taken_count int`, `created_at`.
  - `quizzes`: `id`, `version`, `goal`, `dimensions jsonb`, `moderator_instructions`,
    `adaptation_policy jsonb`, `created_at`.
  - `quiz_questions`: `id`, `quiz_id`, `prompt`, `type` (single|multi),
    `options jsonb`, `allow_explain`.
  - `quiz_responses`, `quiz_results` (per-user; RLS in later migrations).
  - `weekly_activities`: `id`, `active`, `title`, `prompt text|null`, `starts_at`,
    `ends_at`, `created_at`.
  - `activity_posts`: `id`, `activity_id`, `author_id`, `media_id|null`, `created_at`.
    `activity_hearts`: `post_id`, `user_id`, `created_at`.
  - `coop_announcements`: `id`, `body`, `published_at|null` — **missing title + CTA**.
  - `coop_memberships`: `user_id (PK)`, `active`, `since`, `dues_paid_through|null`,
    `created_at`, `updated_at`.
  - `delights`: `id`, `enabled`, `scope` (`delight_scope`), `schedule jsonb` —
    **missing a display name/slug and a gift-trigger table**.
  - `notifications`: `id`, `user_id`, `kind`, `payload jsonb`, `read`, `created_at`.
- **Mobile (`apps/mobile`):** demo-first. Every feed/quiz/coop/activity path is a
  fixture with a `// TODO: GET/POST ...` stub. Confirmed shapes and dead-ends:
  - `data/feed.ts`: `getQuiz()`, `getWeeklyActivity()`, `listCoopAnnouncements()`,
    `getHomeFlags()` (returns `{ empty, member }`).
  - Home quiz "Take" → `Alert('Quiz take flow ships next.')`. Weekly activity tap →
    `Alert('Weekly activity collage ships next.')`. Co-op CTA → `Alert('Co-op portal ships next.')`.
  - Home layout edit exists but is **session-only** (`app/(tabs)/home.tsx`,
    `DEFAULT_LAYOUT` / `EMPTY_LAYOUT`, `useState`, no persistence).
  - Themed capture prompts: `data/fixtures/stories.ts` `THEMED_PROMPTS`,
    `data/stories.ts` `listThemedPrompts()`.
  - No `apps/mobile/quizzes/` and no `apps/mobile/delight/` folders yet.
- **Infra:** CDK `BridgerFoundationStack` (Secrets Manager + one S3/CloudFront for
  the consumer web build) and `BridgerServiceStack` (API on App Runner). The
  server secret template lists the env vars; add the two new admin secrets there.

---

## 2 · Architecture overview

Four surfaces share one API and one database:

```
apps/admin (Vite web, password-gated)  ──┐
                                         ├── apps/api (NestJS)  ──  Supabase (Postgres + RLS)
apps/mobile (Expo, user-auth)         ───┘        │
                                                  └── Anthropic (quiz AI moderator, server-only)
```

Two write paths, kept apart:

- **Admin writes** (set live quiz, publish announcement, toggle delight, edit home
  defaults): `apps/admin` → `AdminGuard`-protected `POST/PATCH /admin/*` → Supabase
  via the service-role client (bypasses RLS by design; the guard is the gate).
- **User reads/writes** (take quiz, post to activity, heart a post): `apps/mobile`
  → `SupabaseAuthGuard`-protected `/*` endpoints → Supabase. The AI moderator runs
  here, server-side. Public read endpoints (current quiz, current activity,
  published announcements, enabled delights, themed prompts, home defaults) are
  served by the API so the mobile client needs no broad RLS SELECT policies.

Isolation guarantees carried from the specs:

- **Every quiz is a folder** in `apps/mobile/quizzes/<slug>/` with scoped styles;
  the shared `registry.ts` is the only cross-quiz file. Adding a quiz = one folder +
  one registry line. Nothing else in the app changes (`ADMIN.md` §1).
- **Every delight is a folder** in `apps/mobile/delight/<id>/` behind a flag; a
  failing delight is caught and skipped so it can never take the app down
  (`DELIGHT.md`).

---

## 3 · Design language for the admin console

`apps/admin` is web React, so it cannot import the RN Magic Patterns component
library (those are React Native). Rule of thumb:

- **Reuse `DESIGN.md` tokens and visual language** (eggshell/black canvas, pixel
  headers, beveled metallic primaries, floating pill nav feel, no gradients or
  shadows, motion behind `prefers-reduced-motion`). Put the tokens in a small
  `apps/admin/src/theme.ts` + Tailwind config so the console feels like Bridger.
- Where a consumer screen has a Magic Patterns component, **recreate the same look**
  in a plain web component and add a comment:
  `// Recreated from Magic Patterns <Name> for web; keep visuals in sync.`
- This is a documented, allowed deviation (the MP library is RN-only). Do not pull
  in a third-party UI kit; hand-build small primitives (Button, Card, Field,
  Toggle, Tabs) styled from the tokens.
- Accessibility still applies: semantic HTML, labels/roles, focus states, keyboard
  nav, contrast >= 4.5:1, tap targets >= 44px, respect reduced motion.

---

## 4 · Database changes (one new migration)

Create `infra/supabase/migrations/0016_admin_content_gaps.sql`. Only fill gaps; do
not recreate existing tables. After applying, regenerate
`packages/shared/src/database.types.ts` (Supabase MCP `generate_typescript_types`
or the CLI, per `infra/supabase/README.md`).

What the migration must do (plain English at the top of the file, per rule 4):

1. **Co-op announcements need a title and a call to action.** Add `title text`,
   `cta_label text`, `cta_url text` (all nullable except keep `body` required).
2. **Delights need a human name.** Add `name text not null default ''` to
   `delights` (the `id` stays the stable slug). Add a **gift-trigger table**:

```sql
-- --- Gift delights (e.g. emoji bomb): plays on the recipient's next app open. ---
create table public.delight_triggers (
  id uuid primary key default gen_random_uuid(),
  delight_id uuid not null references public.delights (id) on delete cascade,
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id uuid not null references public.users (id) on delete cascade,
  played boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_delight_triggers_to on public.delight_triggers (to_user_id, played);
alter table public.delight_triggers enable row level security;
```

3. **Link a registry slug to its quiz design.** Add `quiz_id uuid references
   public.quizzes (id)` to `quiz_registry` so "the live quiz" resolves from
   `admin_config.live_quiz_slug` → `quiz_registry.slug` → `quizzes.id` →
   `quiz_questions`. Also add `web_takeable boolean not null default true` and
   `comparable boolean not null default false` to `quiz_registry` (the mobile
   fixture already carries `comparable`; `web_takeable` is from `ADMIN.md` §5).
4. **RLS policies for user-facing writes** (reads go through the API service role,
   so client SELECT policies are optional; writes from the authenticated user must
   be allowed):
   - `activity_posts`: authenticated users may `insert` where `author_id = auth.uid()`;
     `select` published activity posts; `delete` own.
   - `activity_hearts`: authenticated users may `insert`/`delete` their own row.
   - `delight_triggers`: a user may `insert` a trigger where
     `from_user_id = auth.uid()`; may `select`/`update(played)` rows where
     `to_user_id = auth.uid()`.
   - Confirm `quiz_responses` / `quiz_results` per-user policies already exist
     (later migration); if missing, add: user may insert/select own rows.
   Admin-managed tables (`admin_config`, `quiz_registry`, `quizzes`,
   `quiz_questions`, `weekly_activities`, `coop_announcements`, `delights`) stay
   **server-managed** (no anon/authenticated write policy). The API service-role
   client is the only writer; the `AdminGuard` is the human gate.
5. **Seed one `admin_config` row** if none exists (idempotent `insert ... where not
   exists`), with sensible `home_defaults` (the current `DEFAULT_LAYOUT` order) and
   the three `themed_prompts` (ootd, take-05, hot-take).

Add matching RLS proof lines to `infra/supabase/tests/rls_and_cascade_proof.sql`
(a non-admin cannot write admin tables; a user can only heart/post/trigger as
themselves; deleting a user cascades their activity posts, hearts, triggers).

---

## 5 · Shared types (`packages/shared`)

Add thin, hand-written model files that wrap the generated DB types into friendly
shapes the API and both clients import. New files under
`packages/shared/src/model/`, each exported from `index.ts`:

- `quiz.ts` — `QuizRegistryEntry`, `QuizDefinition`, `QuizQuestion`, `QuizOption`,
  `QuizDimension`, `QuizResult`, `AdaptationPolicy`, `ModeratorState` (mirror
  `QUIZ-ENGINE.md` §1–4 exactly).
- `weekly-activity.ts` — `WeeklyActivity`, `ActivityPost`.
- `delight.ts` — `DelightEntry`, `DelightTrigger`, `DelightScope`.
- `admin-config.ts` — `HomeWidgetKey`, `HomeWidgetDefault { key; size: 'half'|'full' }`,
  `HomeDefaults { layout: HomeWidgetDefault[] }`, `ThemedPrompt` (reuse the one in
  `model/story.ts`), `AdminConfig`.
- Extend `model/coop.ts` with `CoopAnnouncement { id; title; body; ctaLabel?; ctaUrl?; publishedAt? }`.

These are the wire contracts; the admin and mobile clients and the API all speak
them. Keep them de-identified where the spec requires (quiz scores/embeddings are
Zone B/C — never carry PII in these types).

---

## 6 · API (`apps/api`) — modules and endpoints

Each module is a folder under `apps/api/src/`. Use `SupabaseService.admin` for DB
access. Add Zod (or class-validator) DTO validation on every write. Every controller
file starts with a plain-English header comment.

### 6.1 Admin auth (`admin-auth/`)
- `admin-auth.controller.ts`: `POST /admin/login { password }` → compares against
  `process.env.ADMIN_PASSWORD` in constant time; on success returns a JWT signed
  with `ADMIN_JWT_SECRET` (`jose`, already a dependency), `exp` ~12h, claim
  `{ role: 'admin' }`. On failure, 401. Rate-limit (simple in-memory throttle) to
  blunt brute force.
- `admin.guard.ts` (`AdminGuard`): reads `Authorization: Bearer <token>`, verifies
  it with `ADMIN_JWT_SECRET`, requires `role: 'admin'`. Applied to every `/admin/*`
  controller. Comment it `// SECURITY: gate for the whole back office`.
- `GET /admin/session` → `{ ok: true }` so the console can check its token on load.

### 6.2 Admin content (`admin/`)  — all under `@UseGuards(AdminGuard)`
- **Home defaults + featured:** `GET/PUT /admin/config/home-defaults`.
- **Themed prompts:** `GET/PUT /admin/config/themed-prompts` (array of `{slug,label,icon}`).
- **Live quiz:** `PUT /admin/config/live-quiz { slug }` (sets `live_quiz_slug` and
  `quiz_registry.status='live'` + `live_week`; demotes the previous live quiz).
- **Quiz registry:** `GET /admin/quizzes` (list all with status + friendsTakenCount);
  `POST /admin/quizzes` (scaffold: create `quiz_registry` + empty `quizzes` +
  starter `quiz_questions`, status `draft`); `PATCH /admin/quizzes/:slug`
  (title/status/comparable/webTakeable); `GET/PUT /admin/quizzes/:slug/design`
  (goal, dimensions, moderator instructions, adaptation policy, questions with
  option→dimension weights, per `QUIZ-ENGINE.md` §1). Bump `quizzes.version` on
  question changes.
- **Weekly activity:** `GET /admin/activities`; `POST /admin/activities`
  (title + prompt, `active=false`); `PATCH /admin/activities/:id` (title, prompt,
  toggle `active`, `starts_at`/`ends_at`). Only one active at a time.
- **Co-op announcements:** `GET /admin/coop/announcements`;
  `POST /admin/coop/announcements` (draft: `published_at=null`);
  `PATCH /admin/coop/announcements/:id`; `POST /admin/coop/announcements/:id/publish`
  (sets `published_at=now()`). "Publish to members" is what appears in the Home
  co-op banner for members.
- **Co-op membership:** `GET /admin/coop/members` → the list/count from
  `coop_memberships` (active members, since dates). Read-only in this build.
- **Delights:** `GET /admin/delights`; `POST /admin/delights` (scaffold a new
  registered delight: `id/slug`, `name`, `scope`, `enabled=false`);
  `PATCH /admin/delights/:id` (enabled, scope, schedule window).

### 6.3 Public + user endpoints (`content/`, `quiz/`, `activity/`, `coop/`, `delight/`)
These serve the mobile app. Reads are public-ish (require `SupabaseAuthGuard` since
the app is signed-in) and write paths require it too.
- `GET /content/home-defaults` → `admin_config.home_defaults`.
- `GET /content/themed-prompts` → `admin_config.themed_prompts`.
- `GET /quizzes/current` → resolves live quiz: registry entry + questions (no
  weights sent to the client; weights stay server-side). Shape matches the mobile
  `getQuiz()` consumer (id/slug, title, comparable, and questions for taking).
- `GET /quizzes/archived` → untaken past quizzes for this user + `friendsTakenCount`
  each (`ADMIN.md` §5; count only, no names).
- `POST /quizzes/:slug/responses` → save a user's answer(s); run the **AI moderator**
  (Anthropic, server-only) to set per-dimension confidence and flags, adapt within
  `adaptation_policy` and `maxInsertedQuestions`; return the next question (possibly
  reworded/inserted). Never let the LLM set scores.
- `POST /quizzes/:slug/complete` → compute deterministic `dimension_scores` from
  option weights (pure arithmetic, no LLM), store `quiz_results`, return the result
  (+ "who got who" grouping if `comparable`). Emit quiz product events.
- `GET /activities/current` → active weekly activity + its posts (author ids only;
  names rejoin on-device).
- `POST /activities/:id/posts` and `POST/DELETE /activities/:id/posts/:postId/heart`.
- `GET /coop/announcements` → published only.
- `GET /coop/membership` → this user's `{ member, since }` (drives Home `member`).
- `POST /coop/membership` → record join / "use free" (wire onboarding `joinCoop`).
- `GET /delights/active` → enabled delights (id, scope, schedule) for the app to
  mount; `GET /delights/triggers` → pending gift triggers for this user;
  `POST /delights/triggers` → gift a delight to another user;
  `POST /delights/triggers/:id/played` → mark a gift as played.

Register all modules in `app.module.ts`. Add tests where cheap (guard rejects
missing/invalid token; login rejects wrong password; scoring is deterministic).

---

## 7 · Admin console (`apps/admin`)

### 7.1 Scaffold
- `apps/admin/package.json` (name `@bridger/admin`, private), Vite + React + TS +
  Tailwind + `@bridger/shared`. Scripts: `dev` (vite), `build` (`tsc && vite build`),
  `lint`, `typecheck`, `preview`. Add to `pnpm-workspace.yaml` (already globs
  `apps/*`, so no change needed) and confirm Turbo picks up `build/lint/typecheck`.
- `vite.config.ts`, `tailwind.config.js` (import DESIGN.md tokens), `index.html`,
  `src/main.tsx`, `src/App.tsx`.
- `.env.example` → `VITE_API_URL` (points at the NestJS API). No secrets here.

### 7.2 Auth + API client
- `src/lib/api.ts`: a tiny fetch wrapper that attaches the admin token from
  `localStorage` and handles 401 by bouncing to the login screen. Comment:
  `// SECURITY: the admin token is the only credential; never store the password.`
- `src/lib/auth.tsx`: `AuthProvider` + `useAdminAuth()` — login posts the password
  to `POST /admin/login`, stores the returned token, exposes `logout()`.
- `src/pages/Login.tsx`: single password field, submit → login. No password ever
  compiled into the bundle.
- A route guard component that renders children only when a valid token exists
  (verified on mount via `GET /admin/session`).

### 7.3 Shell + navigation
- `src/components/AdminShell.tsx`: left nav (or top pill nav in Bridger style) with
  sections below. Small shared primitives in `src/components/ui/`
  (`Button`, `Card`, `Field`, `Toggle`, `Tabs`, `Badge`, `Modal`), styled from tokens.

### 7.4 Panels (one page each, mapped to `ADMIN.md` §2)
1. **This week's quiz** (`pages/QuizLive.tsx`): pick which registry quiz is live;
   shows current live + schedule; sets `live_quiz_slug`.
2. **Quiz registry** (`pages/QuizRegistry.tsx`): table of all quizzes (status
   badges live/draft/archived, friendsTakenCount, webTakeable); **New quiz** button
   scaffolds a folder-shaped draft; row → **Quiz editor**.
3. **Quiz editor** (`pages/QuizEditor.tsx`): edit goal, dimensions, questions +
   options with per-dimension weights, `allow_explain`, moderator instructions, and
   adaptation policy (`QUIZ-ENGINE.md` §1, §6). Save bumps version.
4. **Weekly activity** (`pages/WeeklyActivity.tsx`): set title + prompt, turn
   on/off, schedule; shows live status. "Band Tee Week" style.
5. **Co-op announcements** (`pages/CoopAnnouncements.tsx`): compose title + body +
   optional CTA, save draft, **Publish to members**; list published/drafts.
6. **Co-op members** (`pages/CoopMembers.tsx`): membership count + list (read-only).
7. **Home defaults / featured** (`pages/HomeDefaults.tsx`): drag/reorder the default
   widget layout + sizes and any featured/pinned items; saves `home_defaults`.
8. **Themed prompts** (`pages/ThemedPrompts.tsx`): edit the three capture squares
   (slug, label, emoji); swap in/out.
9. **Delights** (`pages/Delights.tsx`): toggle each registered delight, set scope
   (global/opt-in/gift) + schedule, **New delight** scaffold entry.

Each panel: loading/empty/error states, optimistic-but-confirmed saves, accessible
forms, no em dashes in copy.

---

## 8 · Mobile — quiz plugin host, delight host, and live wiring

### 8.1 Quiz plugins (`apps/mobile/quizzes/`) — per `ADMIN.md` §1
- `_host/QuizHost.tsx`: reads `registry.ts`, resolves the live slug (from
  `GET /quizzes/current`), and mounts that quiz folder's `Quiz.tsx`. Generic loader;
  knows nothing about any specific quiz's internals.
- `registry.ts`: `Array<{ slug; status; component: () => Promise<...> }>` — the one
  shared file. Adding a quiz appends one entry.
- First quiz folder `which-road-trip/` (matches the existing fixture) with
  `manifest.ts`, `Quiz.tsx`, `questions.ts`, `result.ts`, and scoped styles. Uses
  the shared `ModuleFlow` feel but stays inside its folder; scoring/AI calls go
  through the API (`POST /quizzes/:slug/responses|complete`).
- Route `app/quiz/[slug].tsx`: the take flow (Typeform-style), then the result
  screen (big result + Share quiz + "Who got who" dashboard when `comparable`), per
  `TOUCHGRASS-AND-QUIZ.md`. Replace the Home `Alert('Quiz take flow ships next.')`
  and `Alert('Results dashboard ships next.')` with navigation into this route.
- Profile: add an "Untaken past quizzes" list with per-quiz friend count from
  `GET /quizzes/archived` (`ADMIN.md` §5).
- Emit quiz product events (`quiz_started`, `quiz_question_answered`,
  `quiz_adapted`, `quiz_abandoned`, `quiz_completed`) per `QUIZ-ENGINE.md` §6b and
  `ANALYTICS-TAXONOMY.md` §3b.

### 8.2 Delights (`apps/mobile/delight/`) — per `DELIGHT.md`
- `_host/DelightHost.tsx`: mounts enabled delights from `GET /delights/active` and
  plays pending gift triggers from `GET /delights/triggers`; **wrap each in an error
  boundary so a failing delight is caught and skipped** (never crashes the app).
  No-op when nothing is enabled. Mount it once high in the app tree.
- `registry.ts`: `{ id, enabled, scope, component }[]` (local mirror; server flags
  win at runtime).
- First delight folder `emoji-bomb/` (gift scope) with `manifest.ts`, `Delight.tsx`,
  scoped styles; plays on next app open with attribution ("emoji-bombed by {name}"),
  then `POST /delights/triggers/:id/played`. Motion transform/opacity only, respects
  `prefers-reduced-motion`.

### 8.3 Wire the data layer to the API (behind `isDemoMode()`)
In each `data/*.ts` function, keep the demo branch exactly as-is and fill the
`// TODO` live branch with a real `fetch` to `EXPO_PUBLIC_API_URL`:
- `data/feed.ts`: `getQuiz` → `GET /quizzes/current`; `getWeeklyActivity` →
  `GET /activities/current`; `listCoopAnnouncements` → `GET /coop/announcements`;
  `getHomeFlags` → derive `member` from `GET /coop/membership`, `empty` from friend
  count. Add `getHomeDefaults()` → `GET /content/home-defaults`.
- `data/stories.ts`: `listThemedPrompts` → `GET /content/themed-prompts`.
- `data/onboarding.ts`: `joinCoop` → `POST /coop/membership`.
- New `data/quiz.ts`, `data/activity.ts`, `data/delight.ts` for the take/post/heart/
  gift flows.

### 8.4 Home layout persistence (two layers, `ADMIN.md` §3)
- **Admin default:** `app/(tabs)/home.tsx` initializes `layout` from
  `getHomeDefaults()` (falls back to the current `DEFAULT_LAYOUT` if the fetch
  fails). Admin controls the starting arrangement + featured content only.
- **Per-user arrangement:** persist the user's own reordering. Add a
  `home_layout jsonb` to `user_settings` (small migration or reuse existing
  settings write path) and save on "Done editing". Admin never overwrites a user's
  personal layout — it only sets the default for people who have not customized.

---

## 9 · Analytics

Register every new admin surface and every new mobile element in
`ANALYTICS-TAXONOMY.md` and `packages/shared/src/analytics/ids.ts`, then instrument
as you build (the enforcement rule blocks "done" without instrumentation):
- Admin console: page views + key actions (login, set live quiz, publish
  announcement, toggle delight, save home defaults, new quiz). These are internal
  operator events; keep them first-party and de-identified like everything else.
- Mobile: the quiz product events above; weekly-activity post/heart; delight gift
  sent/played; co-op join/use-free; home layout edited.
- Never put quiz explanation *text* or PII into analytics (`QUIZ-ENGINE.md` §6b).

---

## 10 · Infra + deploy

- **Secrets:** add `ADMIN_PASSWORD` and `ADMIN_JWT_SECRET` to the server secret
  template in `infra/aws/lib/foundation-stack.ts` (empty in code; real values
  written out-of-band). Add both to `apps/api/.env.example`. Default local dev
  password is `brantsjohnson`.
- **Admin hosting:** add an `AdminWebBucket` + `AdminWebCdn` (mirror the existing
  web bucket/CDN) in the foundation stack, or a small dedicated stack, with the same
  SPA error-response fallback to `/index.html`. Output the admin URL.
- **CI:** the root `.github/workflows/ci.yml` already runs `pnpm build/typecheck/
  test` across the workspace, so `apps/admin` and the new API modules are covered
  once they build cleanly. Optionally add an admin deploy step (build → sync to the
  admin bucket → CloudFront invalidate).

---

## 11 · Build order (suggested todo checklist)

Do these in order; each is independently verifiable.

1. **DB migration 0016** + regenerate `database.types.ts` + RLS proof lines.
2. **Shared types** (`quiz`, `weekly-activity`, `delight`, `admin-config`, coop
   announcement) exported from `@bridger/shared`.
3. **API admin-auth** (login + `AdminGuard` + session) with tests.
4. **API admin content endpoints** (config, quizzes, activities, coop, delights).
5. **API public/user endpoints** (current quiz + AI moderator + deterministic
   scoring, activity posts/hearts, announcements, membership, delights/triggers).
6. **apps/admin scaffold** (Vite, tokens, auth, shell) + login working against 3.
7. **Admin panels** 1–9 wired to the endpoints from 4.
8. **Mobile quiz plugin host + registry + first quiz + take/result routes**, replace
   the Home alerts.
9. **Mobile delight host + registry + first gift delight** with error boundaries.
10. **Wire `data/*.ts` live branches** + home defaults + per-user layout persistence.
11. **Analytics** taxonomy + instrumentation across new admin and mobile surfaces.
12. **Infra** secrets + admin hosting + deploy step.
13. **Verify** against the acceptance criteria below; typecheck, lint, RLS proof.

---

## 12 · Definition of done (acceptance criteria)

From `ADMIN.md`, `DELIGHT.md`, `QUIZ-ENGINE.md`, plus this build:

- [ ] Admin signs in with a password; the password lives only server-side; all
      `/admin/*` endpoints reject requests without a valid admin token.
- [ ] Admin can set the week's live quiz, and it appears on everyone's Home.
- [ ] Admin can set a weekly activity (title + prompt), toggle it on/off, and
      schedule it; while on it shows on Home as a collage (double-tap to heart);
      while off it is absent.
- [ ] Admin can compose and publish a co-op announcement; it appears in the Home
      co-op banner for members; admin can view the membership list/count.
- [ ] Admin can see the quiz registry (live/draft/archived) and scaffold a New quiz
      as an isolated folder; adding a quiz appends one registry entry and touches
      nothing else.
- [ ] Admin can set Home defaults/featured; users can still rearrange their own Home
      and their arrangement persists; admin never overwrites a user's layout.
- [ ] Admin can edit the three themed capture prompts.
- [ ] Admin can toggle/scope/schedule/scaffold delights; a failing delight is caught
      and skipped; gift delights play on the recipient's next app open with
      attribution; all delight motion is transform/opacity and respects reduced
      motion.
- [ ] Quizzes support single, multi-select, and optional free-text explanation;
      scores are deterministic from option→dimension weights (no LLM in the scoring
      path); the AI moderator sets confidence/flags and adapts within the policy cap
      and never sets the score; scores/embeddings are de-identified; explanations are
      author-owned and never in analytics.
- [ ] Co-op membership is stored in the DB and gates co-op widgets + full storage.
- [ ] Launched quizzes become archived-but-takeable; in-app Profile shows untaken
      past quizzes with a friends-taken count (number only, no names).
- [ ] Demo mode still works unchanged; live mode reads from the API.
- [ ] Everything passes lint/typecheck, has plain-English comments, accessibility
      labels + reduced-motion, RLS covers new data, and no secrets are in client
      code. No em dashes anywhere.

---

## 13 · Open items to confirm while building (do not guess on these)

- **Marketing-site takeable quizzes** (`ADMIN.md` §5, web on-ramp) are a separate
  surface and out of scope here; the API `web_takeable` flag is set now so the site
  can consume it later.
- **Payments for co-op** (Apple/Google Pay, card) are stubbed as intents in
  onboarding today; real IAP/processing is its own effort (`COOP.md`,
  store-compliance rules). This build only records membership.
- **AI moderator prompt + adaptation tuning** should follow `QUIZ-ENGINE.md`
  precisely; if anything about scoring, confidence, or adaptation is ambiguous,
  stop and ask rather than inventing behavior (privacy/AI is load-bearing).
