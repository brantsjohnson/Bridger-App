# Bridger — Admin & Quiz Infrastructure

The organizer-facing side of Bridger. Covers the admin console, the isolated quiz-plugin system, the home-widget model, co-op membership, and how past quizzes stay accessible. The admin console is a **separate repository** (see Repository topology); the rest maps to the `quizzes`, `coop`, and `feed` modules in `ARCHITECTURE.md`.

---

## 1 · Quiz plugins — every quiz is an island

Quizzes vary wildly — different questions, layouts, answer flows, even visual style. So a quiz is **not** a row of config against a shared renderer; it's a **self-contained plugin in its own folder**. Building or restyling one must never touch another quiz or the app's global UI.

```
apps/mobile/quizzes/
├── _host/                      # generic loader: reads the registry, mounts a quiz by slug
├── registry.ts                 # list of quizzes + status (live | draft | archived)
├── which-road-trip/
│   ├── manifest.ts             # slug, title, status, schedule, result mapping
│   ├── Quiz.tsx                # this quiz's own component + flow
│   ├── questions.ts
│   ├── result.ts               # scoring → result
│   └── styles.module.css       # SCOPED — cannot leak out
├── disney-princess/            # …entirely independent
└── love-language/
```

Rules that make "ask AI to build a new quiz" safe:
- **New quiz = new folder.** Nothing outside that folder changes.
- **Scoped styles only** (CSS modules / scoped classes) so a quiz's custom look can't bleed into the app or other quizzes.
- **A manifest per quiz** is the only thing the rest of the app reads — the host mounts whatever the folder exports. Custom internal layout/flow is invisible to the app.
- **The registry** is the one shared file, and it only lists slugs + status. Adding a quiz appends one entry.

Result: you can tell an AI "build a new quiz that looks like X" and it works entirely inside one folder, with zero risk to the rest of the app.

---

## 2 · The admin console (separate repo)

A separate organizer-only surface in its **own repository** (not shipped in the consumer app, not in the app monorepo — so it can be rebuilt freely without risk to live users). It talks to the same API. What it controls:

- **This week's quiz** — pick which registry quiz is live; it schedules and pushes to everyone's Home.
- **Side Quest / weekly challenge** — host a themed wall prompt ("Notes App Discovery", "Share a blurb from your notes app archives"): set the **title + prompt**, choose **photo polaroid** or **text blurb** mode, turn it **on/off**, and schedule it. While on, it appears on everyone's Home as a wall people post into (double-tap to heart); while off, it's absent. Lets you wait until enough people are on before launching one.
- **Co-op announcement** — write and **publish to members**; appears in the Home co-op banner for co-op members.
- **Co-op members** — the recorded membership list/count.
- **Auth codes** — make a promo / auth code that grants a **free year of the co-op** with no payment. Set how many people can use each code (the "amount", default 25), rename it, turn it off, and see **who redeemed each code** (opaque user ids only). Redemption happens server-side (`POST /coop/membership/redeem`); a person can use a given code once, and a code stops working once its amount is reached. Backed by `coop_promo_codes` + `coop_promo_redemptions` (see `DATA.md`) and `GET/POST/PATCH /admin/coop/promo-codes`.
- **Quiz registry** — see every quiz folder with its status (live / draft / archived), and **New quiz** to scaffold a fresh folder.
- **Home defaults / featured** — set the default widget arrangement and any pinned/featured content everyone starts with.
- **Themed post prompts** — **retired from capture** (OOTD / Take 0.5 / Hot take squares no longer appear). Admin editor may still exist for historical rows; do not treat it as a live capture surface.
- **Surprises (delights)** — open backlog of optional delighters (`idea` / `built` / `live` + notes), plus toggle/scope/schedule for live standalones; scaffold via repo script (see `DELIGHT.md`).
- **Weekly recap (Friend Pod)** — optional. If you do not create a week, Monday locks itself (rose / thorn / bud, then the most-voted unused suggestions, then fill-ins). You can still type all 5, make a week live, or tap **Lock this week now** (`POST /admin/recap/rollover`). APIs: `GET/POST /admin/recap/weeks`, `PATCH /admin/recap/weeks/:id`, `GET /admin/recap/submitted-questions`.

Admin sets **content and defaults**; it does not reach into each user's personal arrangement (that's the user's, below).

---

## 3 · Home widgets — two layers of control

The Home sections become **widgets**:

- **Users arrange their own Home.** Stories, updates, quiz, poll, This week, co-op banner, etc. can be reordered/toggled by each user for their own layout (widget-style).
- **Admin sets the defaults + shared content.** The starting arrangement, the live quiz, co-op announcements, and any featured items come from admin. Users customize from there.
- **Onboarding can seed a per-user starting arrangement.** The desire step in `ONBOARDING.md` maps to a named Home preset (`stay_close` / `go_deeper` / `make_plans` / `meet_people`) and writes that person's initial layout from the preset. Admin's global default is the fallback when desire is skipped. Admin still does **not** reach into each user's personal arrangement after that.

So the organizer curates *what's available and featured*; onboarding can point the first Home at what they said they want; each person curates *their own view of it* from there.

---

## 4 · Co-op membership (recorded in the DB)

Co-op members are stored as membership records. Membership:
- Unlocks **co-op widgets** (announcements, member-only content) on Home.
- Unlocks **full story storage** (the retention benefit from `PROFILE.md`).
- Is what the admin "publish to members" targets.

```ts
interface CoopMembership { userId: string; since: string; active: boolean; }
```

---

## 5 · Previous quizzes stay alive

A quiz doesn't die when its week ends — it goes **archived · takeable**:

- **On Bridger's marketing website:** every launched quiz is **permanently takeable**, even by people without an account (this is the on-ramp — it ties into the quiz-link growth loop noted in `FRIENDS.md` / the still-to-write `QUIZZES.md`).
- **In the app (Profile):** you can see **old quizzes you haven't taken**, each with a **count of how many of your friends have taken it** — light social proof that nudges "oh, I want to take this." No names, just a number.

```ts
interface QuizRegistryEntry {
  slug: string;
  title: string;
  status: 'live' | 'draft' | 'archived';
  liveWeek?: string;
  friendsTakenCount?: number;   // shown in-app to encourage taking
  webTakeable: boolean;         // archived quizzes stay takeable on the site
}
```

---

## Module mapping

| Piece | Where |
|---|---|
| Quiz plugins + host + registry | `apps/mobile/quizzes/*` |
| Admin console | separate **admin repo** (see topology below) |
| Live-quiz scheduling, results | `quizzes` |
| Co-op announcements + membership | `coop` |
| Home widget defaults + arrangement | `feed` (defaults) + per-user layout |
| Marketing-site takeable quizzes | Bridger website (+ growth loop) |

---

## Matching learning dashboard

Admin section for connection-outcome learning (`MACHINE-LEARNING.md` §10):

- **Metrics:** `GET /admin/matching/metrics` — add→Close (north star), suggestion→add, dismiss/block rates, reveal_plan / event_attended counts. Computed from `matching_feedback` + domain only (never PostHog).
- **Config / rollback:** `GET/PUT /admin/matching/config`, `POST /admin/matching/config/activate/:version`.
- **Nightly refresh:** `POST /admin/matching/nightly` (Discover batch + feedback TTL purge + weight-learn preview; live weights flip only when Close-label volume is high enough).
- **Learn preview / apply:** `GET /admin/matching/learn` (proposed weights from Close / Friends / skip labels). `POST /admin/matching/learn` with `{ "apply": true }` writes a new `matching_config` version (rollback via activate). See `MATCHING-PSYCHOLOGY.md`.

## Assistant / Billy (opt-in relationship helper)

Admin section `assistant` (AGENT.md):

- **Access flag:** `off` · `founder_only` (default) · `allowlist` · `coop` · `everyone`. Stored on `admin_config.assistant`.
- **Per-tool kill switches:** read tools may ship on; act tools (`draft_message`, `draft_event`, `add_calendar_entry`, `save_note`, etc.) default off until ready.
- **Founder ids:** `ASSISTANT_FOUNDER_USER_IDS` (comma-separated) and/or `COOP_ADMIN_EMAILS` for `founder_only`.
- **Model jobs:** reuse `ai_config` rows `agent_query` / `agent_reasoning` / `agent_voice` (enable only after gating ships).
- **Cost:** de-identified spend for the `personal_agent` lane via `/admin/ai/cost`.
- API: `GET/PUT /admin/assistant`.

### Billy / AI economics (admin page `/billy`)

- Config: taste grant, Billy+ price/grant, rollover multiplier (`billy_config`).
- Overview: open `ai_ops_alerts` (vendor 429 / hard limit / job budget), personal_agent spend this month, top users by spend (opaque ids).
- Soft actions: grant Billy+, resolve alert, ledger adjust.
- APIs: `GET/PUT /admin/assistant/billy/config`, `GET /admin/assistant/billy/overview`, `POST .../alerts/:id/resolve`, `POST .../grant-plus`, `POST .../adjust`.

### Demo week (admin page `/demo-week`)

- Toggle closed-beta window for TestFlight: `enabled`, optional `startsAt` / `endsAt` (ISO).
- While active: new accounts must **invite a friend** to unlock the app (`GET /me/access`, gate screen `invite-access`).
- People who **join via invite** get `can_invite = false` until demo week ends (they cannot create share/QR links).
- APIs: `GET/PUT /admin/config/demo-week`, `GET /me/access`, `POST /me/access/demo-invite-sent`.

---

## API / integrations health (standing checklist)

Admin console page **API / integrations** (`/integrations-health` in `apps/admin`) calls:

- **`GET /admin/integrations/health`** (AdminGuard) → `{ overall, checkedAt, checks[] }`
- Each check: `id`, `label`, `status` (`ok` | `warn` | `error` | `skip`), `detail` (plain English, **never secrets**), `kind` (`config` | `live` | `self`)

**Current checks:** Nest self, AWS secret vault (whether boot copied `bridger/api/server` JSON fields into env; key names only, never values), Supabase (live query), Spotify (config + client-credentials probe), Apple Music / MusicKit (config + developer JWT mint), Anthropic key, OpenAI key, Resend key, music token encryption key, PostHog (person-purge credentials + live project probe), Twilio SMS (config for phone OTP: account SID, auth token, and messaging service or from-number; never echoes secrets), RevenueCat webhook secret, Stripe (secret + price ids + webhook secret).

Public **`GET /health`** stays a shallow App Runner liveness probe. Do **not** hang dependency checks on it.

### When you add a new outbound API / integration (required in the same change)

1. Add a row in `apps/api/src/admin/integrations-health.service.ts` (`checkAll`):
   - **config:** env key present (never echo the value)
   - **live:** lightweight probe when safe (token, ping, `SELECT 1`) with timeouts; fail closed to `error` / `warn`
2. Keep the admin UI generic (`IntegrationsHealth.tsx` already maps `checks[]`). No per-service page unless you need knobs.
3. Document the new check in this section (one bullet under Current checks).
4. Put secrets only in `apps/api/.env` / Secrets Manager (never `EXPO_PUBLIC_*` / `VITE_*` except intentional public ids).

This is on the **Always review** list in `INDEX.md` and `.cursor/rules/guide-rules.mdc`.

---

## Repository topology (isolation for safety)

Some surfaces are deliberately kept **out of the main app's blast radius** so edits (including AI edits) can't break the live consumer app:

- **Admin console → its own repository.** The organizer surface lives in a separate repo, so you can restructure or rebuild the entire admin freely without any risk to the app users are on. It talks to the same API.
- **Marketing website → separate surface, connected login.** A public marketing/site (also where launched quizzes stay takeable). When a visitor clicks "log in" from the site, it hands off into the app's auth. Whether it's a separate repo or shares the app repo is an open call — the requirement is only that the login connects the two; noted for planning, not decided here.
- **Co-op portal → Nest + Expo.** Public multi-page governance at `/coop/portal/*` (benefits at `/coop`). Admin CRM at console `/portal` (ideas queue + vote tallies via `/admin/coop/portal/*`); announcements stay on `/coop`.

The consumer app, the admin repo, and the co-op portal are three separately deployable things sharing the API; the marketing site is a fourth surface that just needs a login bridge.

---

## Acceptance criteria

- [ ] Each quiz lives in its own folder with scoped styles; creating/editing one never affects others or the app UI.
- [ ] The registry is the only shared quiz file; adding a quiz appends one entry.
- [ ] The admin console can set the week's live quiz, publish co-op announcements, view membership, and scaffold a new quiz.
- [ ] Admin controls defaults/featured content, not individual users' personal layouts.
- [ ] Users can rearrange their own Home widgets.
- [ ] Co-op membership is stored in the DB and gates co-op widgets and full storage.
- [ ] Launched quizzes become archived-but-takeable and remain takeable on the marketing website (including by non-users).
- [ ] The in-app Profile shows untaken past quizzes with a count of how many friends have taken each.
- [ ] Admin **API / integrations** shows health for Nest, Supabase, Spotify, and other outbound keys; new integrations add a check in the same PR.
- [ ] Surprises is an open delighter backlog (`idea` / `built` / `live` + notes); ideas cannot be enabled; live standalones can toggle/scope/schedule; scaffold is via `pnpm delight:scaffold` (see `DELIGHT.md`).
