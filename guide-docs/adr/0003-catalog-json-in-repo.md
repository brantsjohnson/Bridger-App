# ADR 0003 · Catalog JSON in git is the source of truth

**Status:** proposed (2026-09-21)

## Context

The Phase 0 seed is `guide-docs/platform/inventory/catalog-seed.json`, produced by `scripts/data-inventory/generate.mjs` from migrations. Purposes and consent are empty. The standing rule is a pull-request check. Reviewers look at git, not at a production row.

A Postgres-only catalog would drift from migrations the same way `packages/shared/src/database.types.ts` already drifted (`disclosure_profiles`, `disclosure_items` missing).

YAML was considered. The repo has no YAML parser in this path. The seed is already JSON.

## Decision

The enforcing catalog is JSON in git (`guide-docs/platform/catalog/catalog.json`, created in Phase 1). Schema: `guide-docs/platform/02-DATA-CATALOG-SPEC.md`.

A build step compiles types, consent copy, and RLS drafts. The API loads the compiled snapshot at boot and refuses to boot if it is missing. A Postgres `catalog_snapshot` table may cache that JSON for the running process. If git and the cache disagree, git wins and boot fails until the cache is rebuilt.

Edits in the admin UI to proposals and reviews are stored in `catalog_proposals` and `catalog_reviews`. They do not become catalog entries until a PR merges the JSON. Admin cannot silently widen production.

## Consequences

- A catalog change is a PR, with the founder label when the standing rule says so.
- Runtime cannot grow a field because an extension asked at install time. The proposal waits for a merge.
- The generator keeps detecting drift. It does not overwrite `sensitivity_class`.

## Alternatives rejected

- Postgres as the only copy. Harder to review, easy to drift, awkward for CI on a laptop without secrets.
- YAML in git. Nicer to edit, extra parser, no benefit over JSON Schema for the checks we run.
- Both as equals. Two sources of truth is how `database.types.ts` fell behind. The cache is explicitly not equal.
