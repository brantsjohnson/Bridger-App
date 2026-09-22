# 07 · Standing rule

The catalog stays current on every change. This is not a later cleanup. The Cursor rule is `.cursor/rules/data-catalog.mdc` (`alwaysApply: true`). This file is the CI and review design around that rule.

`ops/` was not found in this repo. The nightly loop the brief asked for is specified as a GitHub scheduled workflow. If an agent hub is added later, it calls the same script. It does not get a second definition of drift.

---

## Cursor rule

Already in force for agents: `.cursor/rules/data-catalog.mdc`.

It requires the same PR to update the catalog when a change adds, renames, or removes a table, column, enum value, storage bucket, RLS policy, API field, analytics event, derived field, or extension capability. Unsure classification goes up, with `needs_review: true`. `core_required` needs a reason. User-data migrations need a catalog diff.

The rule does not by itself fail CI. The workflow below does, once Phase 1 turns it on (`06`).

---

## CI gate

Job: add to `.github/workflows/ci.yml` or a sibling workflow `catalog.yml`. Do not add it until `guide-docs/platform/catalog/catalog.json` exists (Phase 1). Adding it before that fails every PR.

Steps:

1. `node scripts/data-inventory/generate.mjs`
2. Compare generated tables and columns to catalog `backing.table` and `backing.column`.
3. Compare Nest route request and response fields we can see statically (controller DTOs and shared types) to catalog ids. Where static analysis cannot see a field, the PR checklist requires a human row. Do not pretend the generator sees every DTO today. It sees `.from()` tables and route paths (`inventory/api-surface.json`).
4. Compare analytics event names in `packages/shared/src/analytics/ids.ts` to catalog entries with `backing.analytics_event`.
5. Fail if a live column, enum value, or generator-visible route has no catalog row.
6. Fail if a catalog row has `backing` pointing at a column or event that the generator cannot find.
7. Fail if `consent_basis` is `core_required` and `retention.rule` is empty.
8. Do not fail on `needs_review: true`.
9. Run the privacy-invariants suite when it exists (Phase 2). Until then this step is skipped, not greenwashed. The workflow comment says "invariants: not wired."

Week 1 after the catalog file lands: the job posts a PR comment and exits 0. Week 2: steps 5 through 7 exit 1.

The generator must stay free of secrets. It already reads migrations and source, not the live database. The CI job does not get `SUPABASE_SECRET_KEY`.

---

## Codegen

Phase 1 command, name it in the catalog package when that package exists:

- Types into `packages/shared` for purpose tags and catalog ids.
- Consent copy module keyed by `consent_copy_id`.
- RLS SQL only for entries with `generate_rls: true`, written to a migration the human reviews. Never auto-applied.

Until that command exists, hand-edited catalog JSON is allowed and the CI diff is the check. Do not block Phase 1 on perfect codegen.

---

## Nightly drift

Workflow `catalog-nightly.yml`, schedule daily.

1. Run the generator.
2. If the diff is non-empty, open a GitHub issue titled `Catalog drift` with the file list. Do not open a PR that rewrites classifications. A bot must not assign `sensitivity_class`.
3. If `ops/` appears later, the nightly agent reads that issue. It does not reclassify.

Not found today: `ops/`, a nightly agent workflow, a PR template. The template is added with this plan (see below). The nightly workflow is Phase 1, same as CI, so we do not alert on an empty catalog.

---

## PR checklist

File: `.github/PULL_REQUEST_TEMPLATE.md`.

Required section: **Catalog**. The author pastes the catalog diff or writes "no data change" and the CI job agrees.

Founder review, label `founder-review`, never auto-merge, when the diff:

- changes a `sensitive` entry,
- changes `consent_basis`,
- adds or widens an extension capability,
- touches auth, payments, or RLS on user tables.

That matches the existing practice that auth, payments, and data changes wait for Brant. GitHub branch protection is a repo setting, not something this markdown can flip. Phase 1 notes that an admin must require the label. Until then, reviewers follow the template.

---

## What agents do on the next data change

1. Read `data-catalog.mdc`.
2. Update the catalog entry in the same change.
3. If the class is unclear, use the more sensitive class and `needs_review: true`.
4. Do not set `core_required` without the reason in the entry and the PR.
5. Do not hand an extension or the phone a new direct `.from()` on a user table.
