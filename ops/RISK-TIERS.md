# Risk tiers: what merges on its own and what waits for Brant

Decided 2026-09-14 by Brant: **auto-merge low-risk fixes; anything touching auth, payments, or user data waits for review.** This file is the exact definition CI uses (`scripts/risk-tier.mjs`) and the one every agent follows when opening a PR.

## Tier: `risk:low` (auto-merge when CI is green)

A PR is low risk only if **every** changed file is outside the protected list below **and** the change is one of these kinds:

- Lint, formatting, typing, dead code removal, comment and plain-language header fixes
- UI copy changes that do not change meaning of a legal, payment, or permission string
- Small bug fixes in `apps/mobile` screens and components with no schema, auth, or payment impact
- Docs in `guide-docs/` and `ops/` (except `PRIVACY.md`, `TERMS.md`, `ANALYTICS-TAXONOMY.md` renames)
- Test additions and test-only changes
- Analytics `analyticsId` additions that also add the taxonomy rows in the same PR (no renames)
- Dependency bumps of patch versions only, with CI green

Auto-merge is squash merge into `main`. CI must pass (build, typecheck, test, secret scan). One agent-authored approval is not required for `risk:low`; the label plus green CI is the gate.

## Tier: `risk:high` (Brant reviews and merges)

Any PR that touches **any** of these paths, or does any of these things, is high risk. CI labels it automatically; agents must not remove the label.

**Protected paths** (glob, relative to repo root):

```
apps/api/src/auth/**
apps/api/src/coop/**                # payments, Stripe, RevenueCat, membership
apps/api/src/me/**                  # account, export, delete
apps/api/src/posthog/**             # person delete, server-side capture
apps/api/src/load-server-secret*    # secrets loading
apps/api/src/admin/**               # admin console, integrations health
apps/mobile/app/(auth)/**
apps/mobile/app/onboarding/**
apps/mobile/lib/analytics-*.ts
apps/mobile/lib/posthog-sink.ts
apps/mobile/PrivacyInfo.xcprivacy
apps/mobile/app.config.js
apps/mobile/app.json
apps/mobile/eas.json
packages/permissions/**             # tier visibility, RLS helpers
packages/shared/src/analytics/**
infra/**                            # Supabase migrations, CDK, AWS
supabase/**
guide-docs/docs/PRIVACY.md
guide-docs/docs/TERMS.md
guide-docs/DATA.md
guide-docs/INFRASTRUCTURE.md
.github/**                          # CI and auto-merge itself
.cursor/mcp.json
.mcp.json
**/.env*
**/*.sql
```

**Protected kinds of change** (even outside those paths):

- Adds, removes, or upgrades a major or minor dependency
- Adds a new outbound integration (must also register on admin integrations health)
- Renames or removes a shipped analytics id or product event
- Changes a permission purpose string, an age gate, a consent moment, or deletion behavior
- Changes anything a store reviewer would read (privacy manifest, data safety, IAP flow)
- Touches more than 25 files or more than 800 changed lines (big diffs get eyes)

## Tier: `risk:block` (do not open the PR, ask first)

- Secret rotation, production deploys, EAS submit, App Store or Play Console changes
- Deleting data or tables, changing RLS policies to be more permissive
- Anything the guide-docs mark as "stop and ask" (privacy, payments, permissions ambiguity)

## How the label is applied

`scripts/risk-tier.mjs` runs in `.github/workflows/risk-label.yml` on every PR. It compares changed paths against the protected globs above (the list in the script must match this file; when you change one, change both in the same PR). It writes `risk:low` or `risk:high`. Brant or any agent can add `risk:high` by hand to hold a PR; nobody removes `risk:high` except Brant.

`.github/CODEOWNERS` lists the same protected paths with `@brantsjohnson` as owner, so GitHub itself requires his review on them when branch protection is on.

## What Brant has to turn on once (repo settings)

1. Settings > General > Pull Requests: check **Allow auto-merge** and **Allow squash merging**.
2. Settings > Branches > add rule for `main`: **Require status checks to pass** (select `CI / verify` and `Secret scan`), **Require review from Code Owners**.
3. Settings > Actions > General > Workflow permissions: **Read and write**, and allow GitHub Actions to create and approve pull requests.
4. Make the repository **private** (Settings > General > Danger Zone) unless there is a reason to keep it public.
