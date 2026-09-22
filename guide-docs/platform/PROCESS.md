# Data rails, consent, and the extension platform

Working brief for this effort. Read this file at the start of every session that continues the work. `guide-docs/INDEX.md` is the map of the repo. This file is the map of this effort.

**Status (2026-09-21):** The plan is written (`01` through `08`, ADRs, the Cursor rule). Implementation has not started. Phase 1 in `06-IMPLEMENTATION-PLAN.md` is the next step. It does not change the running app.

**Privacy is the first requirement.** Extensibility is acceptable only when the privacy posture after the change is at least as strong as before it. Where they conflict, choose privacy and say so.

**The visual layer is out of scope.** Do not spend this effort on UI frameworks, theming, or rendering. This effort is the data rails: what data exists, who may see or write it, under what consent, through what interface, and how that stays true as the code changes.

---

## How to use this file

1. Re-read the status line above. Implementation follows `06-IMPLEMENTATION-PLAN.md`. Do not skip a founder gate.
2. Do the next unchecked deliverable only. Do not skip ahead.
3. Cite real names from `00-DATA-INVENTORY.md` and `inventory/`. If a table, column, route, or policy is not in the inventory, write "not found". Do not invent one.
4. When a deliverable lands, check it off here and add the row to `guide-docs/INDEX.md` in the same change.
5. Product principles stay in force: no endless scroll, no AI as a product promise, no influencers-as-follows, no follower counts, no ads, co-op governance. If a technical option pressures one of these, flag it. Do not decide it.

The older onboarding flow stays. It is kept for demos. Catalog it. Do not plan its removal.

Assume the phone-OTP onboarding branch (`design/new-onboarding`) will land. Catalog both flows. The columns for both already exist on `user_settings` (see the inventory).

---

## Deliverables

All of these live in `guide-docs/platform/` unless a later note says otherwise. Update `INDEX.md` when a file appears.

| File | What it is | Status |
|---|---|---|
| `PROCESS.md` | This brief. | Written |
| `00-DATA-INVENTORY.md` | Phase 0 findings. | Written |
| `inventory/` | Generated schema, quoted policies, API map, catalog seed. | Written |
| `01-ARCHITECTURE.md` | Target architecture and diagrams. | Written |
| `02-DATA-CATALOG-SPEC.md` | Schema of the catalog registry. | Written |
| `03-POLICY-AND-SECURITY.md` | Authorization, consent, threat model, no-existence-oracle rules. | Written |
| `04-EXTENSION-MANIFEST-SPEC.md` | What an extension declares, review, install, sandbox, revoke. | Written |
| `05-CONNECTION-CONTRACTS.md` | How someone posts vs how a friend wants to receive. | Written |
| `06-IMPLEMENTATION-PLAN.md` | Phases, dependencies, migration, effort, founder gates. | Written |
| `07-STANDING-RULE.md` | CI and review design. The Cursor rule is `.cursor/rules/data-catalog.mdc`. | Written |
| `08-OPEN-QUESTIONS.md` | Decisions that need Brant. | Written |
| `guide-docs/adr/0001` through `0004` | Policy engine, declarative extensions, catalog in git, receipts and omit. | Written, proposed |

No product code in this effort except the inventory generator (`scripts/data-inventory/generate.mjs`) and, when deliverable 07 is reached, `.cursor/rules/data-catalog.mdc`. Each implementation phase in `06` must be shippable on its own and must not break TestFlight users.

---

## Phase 0 (done)

Discovery of the data layer as it exists in this repo. Findings: `00-DATA-INVENTORY.md`.

Regenerate the machine appendix after any migration or route change:

```bash
node scripts/data-inventory/generate.mjs
```

That command reads `infra/supabase/migrations` and `apps/api/src`. It does not connect to a live database and it does not print secrets. It writes:

- `inventory/schema.json` full parse (tables, columns, indexes, policies, functions, triggers, enums)
- `inventory/TABLES.md` the same facts with policy SQL quoted
- `inventory/catalog-seed.json` one row per column, provisional sensitivity, empty purpose and consent fields
- `inventory/api-surface.json` Nest routes, guards, and `.from()` / `.rpc()` calls
- `inventory/summary.json` counts and flags

Limits of the generator are listed in the inventory. A live `information_schema` pass was not run.

---

## Required design (later files must cover this)

Do not write these until Phase 0 is accepted. When you do, every claim about a table, column, route, or policy must point at the inventory.

### 1. Data catalog

A machine-readable, versioned registry that is the only definition of what data Bridger has and how it may be used. RLS, API types, extension permissions, consent copy, and docs are generated from it or checked against it.

Every entity and field carries at least: `id`, `entity`, `field`, `type`, `nullable`, `since_version`, `deprecated_in`, `owner_subject` (every party, including both sides of a friendship, message, or shared memory), `sensitivity_class`, `purpose_tags`, `allowed_operations`, `derivable_to`, `consent_basis`, `retention`, `deletion_cascade`, `export_included`, `visibility_default` and whether the user can override it, `provenance`, and `lineage` for derived fields.

Sensitivity classes to define and then use: `public_profile`, `friends_only`, `circle_scoped`, `private`, `sensitive` (health, location, biometric, someone else's contact, minors), `system_internal`. Another person's phone or contact is `sensitive` by default.

`consent_basis`: `core_required` (the product cannot function without it, captured at signup), `opt_in`, `per_relationship`, `extension_opt_in`.

`allowed_operations`: `read`, `write`, `append`, `aggregate_only`, `derive_from`.

`provenance`: `core` or `extension:<id>@<version>` plus the review record.

Decide catalog storage. The option to evaluate: YAML or JSON Schema in the repo as source of truth, compiled at build time into a runtime policy table, shared TypeScript types, generated RLS where feasible, and consent copy. Record the decision as an ADR.

The Phase 0 seed leaves `purpose_tags`, `allowed_operations`, `consent_basis`, `retention`, and `visibility_default` empty on purpose. Empty means "not decided", not "allowed".

### 2. Policy engine

Deny by default. No field is readable unless the catalog grants it for that requester's purpose and the subject's consent covers it.

Enforcement lives on the server, in one place (a policy layer inside `api`, plus RLS as defense in depth). The phone app and extensions are untrusted. The inventory shows the API uses the service-role key for data access, so RLS does not currently constrain Nest. The plan must say how every direct Supabase call from the Expo app moves behind the gateway, or behind generated RLS that is provably the same as the catalog. Pick one and say why.

Every access has a requester context: actor, acting via core or `extension:<id>@<version>`, purpose, subject users, relationship state, consent grants. Decisions are logged.

Field filtering happens before serialization, not in the client.

Show which existing RLS policies stay, which are generated, and which are replaced. Quote them from `inventory/TABLES.md`.

### 3. No existence oracle

A requester who is denied a value must not learn that the value exists, that the field is set, that a row exists, or that a relationship exists.

- Denied equals absent. One representation everywhere (omit the field, or null). Never a field-level 403. Never a "hidden" or "private" marker on the wire.
- Response shape depends only on the requester's own grants. Two subjects with different privacy settings produce the same response shape for the same requester. Values differ only where that requester is allowed to see them.
- A denied row is not-found, identical in status, body, and headers to a missing row.
- Counts, aggregates, cursors, and "has more" are computed only over rows the requester can see. No total that includes hidden rows.
- Search, autocomplete, and friend-of-friend discovery never confirm a user or attribute the requester cannot see. Define the phone-number rule so "is this number on Bridger?" is not answerable. The inventory records what the current pending-contact path does.
- Side channels to list and mitigate: timing, error text, rate limits, cache headers, ETags, ordering, sequential ids.
- Extension aggregates need a minimum cohort (k-anonymity) and no drill-down. Specify k.
- Flag field combinations that can reconstruct a denied field (`inference_risk_with`). `attributes.value` is already a mixed bag (see the inventory).

Write these as tests. The plan includes a privacy-invariants suite in CI, including a differential test of response shapes across subjects with different privacy settings.

### 4. Extension model

An extension is a module, custom view, or custom feature other people can install. Evaluate at least:

- Declarative only. Configuration against the public API. No user-written code runs. Safest. Least powerful.
- Sandboxed client code (isolated JS or WASM, no direct network or storage, data only through an SDK bridge).
- Server-side extension code. Reject unless there is a compelling reason, and explain why.

Recommend one. State the privacy tradeoff.

Every extension has a manifest: identity, version, author, signing key, capabilities as `(purpose, entity/field set, operations)` from the catalog (never raw SQL, never table names), which existing primitives it uses, any new data points it proposes, its own per-user storage (owned by the user, deletable, exportable, cataloged as `provenance: extension:*`), and network access (default none).

Also plan: install and uninstall, a consent screen generated from the manifest, friend-to-friend install, what happens when a friend uses an extension you have not installed (it must not gain access to your data beyond what core already grants them as your friend), version pin and re-consent when capabilities grow, revocation and a kill switch, a review queue in `admin`, and signing so only reviewed manifests run.

Dogfood: rebuild one first-party feature as an extension. Recommend messages, because it was named explicitly. The inventory shows messages are not in Postgres yet (demo and fixtures only). If the public rails cannot support that feature, the rails are not done.

### 5. New data points

An extension may not collect anything the catalog does not already describe.

1. Author submits a catalog proposal (same schema as a catalog entry).
2. Company review in `admin`: approve, reject, or downgrade (for example `aggregate_only`). Record reviewer and decision.
3. On approval, add the entry with `provenance: extension:<id>` and `consent_basis: extension_opt_in`.
4. Nothing is collected from a user until that user opts in to that data point. Store a versioned consent receipt: words shown, time, extension version. Consent is per data point, not per extension.
5. Withdrawal deletes the values (cascade from the catalog) and revokes the extension's read.

Show the tables, the admin UI scope, and the enforcement point that makes step 4 impossible to bypass.

### 6. Connection contracts

Each person chooses how they share (text, photo, video, voice memo, weekly podcast-style update, prompts) and how they want to receive connection. These do not always match.

A receive preference filters or transforms what the recipient is already allowed to see. It never grants access. Permission comes only from the poster's sharing choice and consent.

Define:

- A canonical content item: source modality, plus zero or more derived representations (transcript, summary, still, waveform card, text-to-speech). A derivation exists only if `derivable_to` allows it and the poster allowed that derivation. Default off when the derivation changes meaning (a summary). Derived items inherit the source visibility exactly.
- A matrix of post modality by receive modality: native match, allowed derivation, or no compatible representation.
- Graceful degradation when nothing matches. Recommendation to evaluate: a minimal honest placeholder ("Sam shared a voice update") with one tap to open the original, because the poster did share it and hiding it would silently drop the friendship loop. State the alternative (hide entirely) and its cost.
- Where a derivation needs ML: the product principle is no AI. Options for Brant, do not decide: on-device OS transcription, no derivations, or a narrow explicit exception. Put this in `08-OPEN-QUESTIONS.md` with the privacy implication of each.
- Server-side enforcement at query time. If phase 1 cannot do full granularity, say what subset ships, and add the catalog fields so the rest does not need a model migration.

### 7. Cross-cutting

- Audit log of extension data access (who, via what, purpose, fields, decision), queryable by the user for their own data.
- A "what Bridger knows and who can see it" view generated from the catalog, plus per-extension access history.
- Deletion and export generated from the catalog so extension-created and derived data is not orphaned.
- Analytics: anything sent to PostHog is a catalog entry with `purpose_tags: [analytics_aggregate]` and its own sensitivity ceiling. Extension telemetry uses the same gate.
- Threat model: malicious extension author, malicious friend distributing an extension, compromised signing key, curious insider, scraped public surface. For each, the control that stops it and the residual risk.

---

## Standing rule (deliverable 07, not a follow-up)

This is part of the plan, written when we reach `07`, not before the inventory is accepted.

1. `.cursor/rules/data-catalog.mdc` (`alwaysApply: true`): any change that adds, renames, or removes a table, column, enum value, storage bucket, RLS policy, API field, analytics event, derived field, or extension capability updates the catalog in the same change (sensitivity, subjects, purposes, consent basis, retention, deletion cascade, derivability). If the class is unclear, classify up and set `needs_review: true`. Never add `consent_basis: core_required` without saying why the product cannot function without it. Never merge a user-data migration without a catalog diff.
2. CI: the inventory generator fails the PR if migrations, API DTO fields, or analytics events contain something absent from the catalog, or if a catalog entry has no backing column or endpoint. The privacy-invariants suite fails the build on a violation.
3. Codegen: types, consent copy, and RLS where feasible, generated from the catalog.
4. Nightly drift check in `ops/` and the nightly loop. Open a PR or issue when drift is found.
5. PR template checklist. Changes to `sensitive` fields, consent basis, or extension capabilities are tagged for founder review and are not auto-merged. This matches the existing rule that auth, payments, and data changes wait for Brant.

---

## Constraints

- Follow `.cursor/rules` and the `guide-docs/` taxonomy. `INDEX.md` wins on where a doc lives.
- Reference real paths, tables, columns, and policy names.
- No em dashes in new copy.
- Small, reversible steps. Day 1 / Day 30 / Day 100 belong in `06`, with what blocks what.
- Uncertainty goes in `08-OPEN-QUESTIONS.md` as a concrete choice, a recommendation, and the privacy implication. Do not invent precision.
- Living `guide-docs/docs/PRIVACY.md` and `TERMS.md` update when behavior changes. Phase 0 is documentation of the current layer, not a new collection practice. Later phases that add receipts, extension storage, or new purposes must update both drafts in the same change.

---

## Session log

| Date | What changed |
|---|---|
| 2026-09-21 | Plan written: architecture, catalog spec, policy, extensions, connection contracts, implementation phases, standing rule, open questions, four ADRs. Cursor rule `data-catalog.mdc` and the PR template added. No app behavior change. CI catalog job not wired yet (Phase 1). |
| 2026-09-21 | Process doc and Phase 0 inventory written. Generator checked in. |
