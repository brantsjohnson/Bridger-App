# AGENTS.md

<!--
WHAT THIS FILE DOES (plain English):
Notes for future coding agents working in this repo. The section below is
specifically about running Bridger inside a Cursor Cloud VM: which Node version
to use, how to start each app, and which failures are pre-existing (not your
fault) so you do not waste time "fixing" them.
-->

## Cursor Cloud specific instructions

This is the **Bridger** monorepo (pnpm + Turborepo). Three runnable apps live in
`apps/`: `api` (NestJS backend), `admin` (Vite + React console), and `mobile`
(Expo app that also runs on web). Shared code lives in `packages/`
(`shared`, `permissions`, `ai`, `ui`).

### Node version (important, non-obvious)

- The repo pins Node 20 (`.nvmrc`, `engines: ">=20 <21"`) and CI uses Node 20.
  Node 20 is fine for `install` / `build` / `typecheck` / `test`.
- BUT the **API server needs Node 22 to boot**: `@supabase/supabase-js` v2.112
  requires a native global `WebSocket`, which Node 20 does not provide (it throws
  `Node.js detected but native WebSocket not found` at startup). Node 22 has it.
- The Cloud VM default is Node 22 (via nvm; `corepack` provides pnpm 10.12.1).
  Node 22 runs everything including the API, so prefer Node 22 in this VM. The
  `Unsupported engine` warning from pnpm under Node 22 is harmless.

### Install / build / test

- Install with **`pnpm install`** (the update script does this on startup).
  Do NOT use `--frozen-lockfile` here: `main`'s `pnpm-lock.yaml` has a
  pre-existing `typescript` specifier mismatch, so `--frozen-lockfile` (and
  therefore CI's install step) currently fails. Plain `pnpm install` self-heals
  the lockfile locally.
- Root scripts (see root `package.json`): `pnpm build`, `pnpm typecheck`,
  `pnpm test` (all via Turbo). `build` and `test` pass. `typecheck` passes for
  9/10 packages (see "Known pre-existing failures").
- `pnpm lint` is **not fully wired**: `eslint` is not installed/configured for
  the `shared`, `mobile`, and `ui` packages, so their `lint` scripts fail. Only
  `admin` (`tsc --noEmit`) and `ai` (`scripts/check-ai-sdk-imports.mjs`) lint
  successfully. CI intentionally runs only build/typecheck/test, not lint.

### Environment files (gitignored, create locally)

Each app reads a local env file (all gitignored; copy from the committed
`.env.example`). Minimal values that let the apps run in this VM:

- `apps/api/.env` — needs `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
  `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET` at boot. Placeholder Supabase values
  (e.g. `SUPABASE_URL=http://127.0.0.1:54321`, any `SUPABASE_SECRET_KEY`) let
  the server boot; the `ADMIN_*` defaults from `.env.example` work. Routes that
  hit the database will error until a real Supabase is configured.
- `apps/mobile/.env` — set `EXPO_PUBLIC_DEMO_MODE=1` to run the whole UI with
  fake fixtures and no backend. `EXPO_PUBLIC_API_URL=http://localhost:3000`
  points it at the local API when not in demo mode.
- `apps/admin/.env.local` — `VITE_API_URL=http://localhost:3000`.

### Running the services (dev)

- API: `pnpm --filter @bridger/api dev` (NestJS `--watch`) → port **3000**.
  Health check: `curl http://localhost:3000/health`. Admin auth works without a
  database: `POST /admin/login` with `ADMIN_PASSWORD` returns a JWT.
- Admin console: `pnpm --filter @bridger/admin dev` (Vite) → port **5173**
  (falls back to 5174 if taken). Log in with `ADMIN_PASSWORD` (default
  `brantsjohnson`).
- Mobile (web): `pnpm --filter @bridger/mobile web` (i.e. `expo start --web`) →
  port **8081**. First load compiles a Metro bundle and can take ~60s.
- Native iOS/Android and EAS builds cannot run in this headless Linux VM.
- There is no Docker or Supabase CLI in the VM. To exercise real
  database-backed flows, install them or point env at a hosted Supabase project.

### Known pre-existing failures (NOT environment problems; do not "fix" as setup)

CI on `main` is currently red. These are unfinished/unmerged code issues, not
VM setup issues:

- `@bridger/mobile` `typecheck` fails and `expo start` cannot finish bundling
  because `app/_layout.tsx` and `components/profile/ProfileSettings.tsx` import
  modules that do not exist in the repo: `providers/bridge-live-provider`,
  `providers/billy-voice-provider`, `components/assistant/AgentIsland`,
  `data/music`, `lib/spotify-connect`, `delight/effects/emoji-rain`, plus some
  missing `@bridger/shared` exports. Also `app.config.js` lists Expo plugins
  whose packages are not declared in `apps/mobile/package.json`
  (`expo-media-library`, `expo-sharing`, `expo-localization`). Running the
  mobile app requires that missing feature code to land first.
