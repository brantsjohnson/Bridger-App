# 02 · Data catalog spec

The catalog is the only definition of what data Bridger has and how it may be used. RLS drafts, API types, extension permissions, consent copy, and the "what we know" screen are generated from it or rejected when they disagree.

Phase 0 seed: `inventory/catalog-seed.json` (760 column rows). Purposes, operations, consent, retention, and visibility are null there. Null means not decided. This spec is the shape those rows must grow into. Filling them is Phase 1 in `06-IMPLEMENTATION-PLAN.md`, not a silent rewrite of the seed.

Storage decision: `guide-docs/adr/0003-catalog-json-in-repo.md`. Git JSON is the source of truth. A compiled snapshot is loaded by the API. A Postgres copy is a cache, not the authority.

---

## Identity

Two kinds of entry.

**Column entry.** One per physical column.

`id`: `public.<table>.<column>`

Example: `public.user_contacts.phone`

**Key entry.** Required when a jsonb column mixes facts. The column entry stays, classified at the worst key it can hold, and is not readable as a blob. Each known key is its own entry.

`id`: `public.<table>.<column>#<key>`

Examples, from `DATA.md` and the inventory:

- `public.attributes.value#about:about-birthday`
- `public.attributes.value#about:about-job`
- `public.user_settings.onboarding_draft` (column). Keys inside the draft are key entries once the phone-OTP flow names them. Until then the column stays `sensitive` and owner-only.
- `public.user_settings.notif_prefs` is one consent document. It may stay one entry if the purposes are only `notifications`. Do not let an extension read the raw jsonb to infer circles.

Unknown keys in `attributes.value` are denied to everyone except the owner, and logged as `needs_review`. They are not matched and not exported to extensions.

---

## Field schema

Every entry, column or key, has these properties. Types are the closed sets below. Do not add a stringly-typed class in a PR.

| Property | Type | Rule |
|---|---|---|
| `id` | string | As above. Stable. Renames go in a changelog, not a silent edit. |
| `entity` | string | Table name, or `table.column` for a key entry. |
| `field` | string | Column name, or the key. |
| `type` | string | Postgres type from the inventory (`text`, `uuid`, `jsonb`, `tier`, ...). |
| `nullable` | boolean | From the migration. |
| `since_version` | string | Migration filename or app version that introduced it. Seed uses the migration name. |
| `deprecated_in` | string or null | Set when reads stop. Do not delete the row. |
| `owner_subject` | array | Every party. See below. |
| `sensitivity_class` | enum | Closed set. |
| `needs_review` | boolean | True when we classified up and a person has not confirmed. |
| `purpose_tags` | array of enum | Empty is illegal once Phase 1 flips CI to enforcing. Until then empty means not decided. |
| `allowed_operations` | array of enum | What a grant can include. |
| `derivable_to` | array of enum | Empty means no derivation. |
| `inference_risk_with` | array of ids | Other entries that, together, reconstruct this one. |
| `consent_basis` | enum | Required before CI enforcing mode. |
| `consent_copy_id` | string or null | Points at the words shown. Required for `opt_in`, `per_relationship`, and `extension_opt_in`. |
| `retention` | object | `{ "rule": "...", "max": "..." }`. |
| `deletion_cascade` | array of ids | What else is deleted with this, including derived rows and extension storage. |
| `export_included` | boolean | Account export. |
| `visibility_default` | enum or null | `owner`, `acquaintance`, `friend`, `close`, `none`, `public_catalog`. |
| `user_can_override` | boolean | False for system internals and for `core_required` identity needed to run the account. |
| `provenance` | string | `core` or `extension:<id>@<version>`. |
| `review_id` | string or null | Required when provenance is an extension. |
| `lineage` | array of ids | Empty unless the value is derived. |
| `backing` | object | `{ "table", "column", "key"?: string }` or `{ "endpoint": "GET /..." }` or `{ "analytics_event": "..." }`. An entry with no backing fails CI. |

### owner_subject

Each item:

```json
{ "role": "owner", "column": "owner_id" }
```

Roles: `owner`, `author`, `party`, `counterparty`, `tagged`, `quoted`, `non_user_contact`, `system`.

Multi-party rows list every role. Examples from real tables:

| Entry | Subjects |
|---|---|
| `public.connections` | `party` `user_a`, `party` `user_b`. Both consents apply to `met_place_label` and `met_approx_geo`. |
| `public.tiers` | `owner` `user_id` (the person who sorted), `counterparty` `other_id` (they must not learn the tier if the product hides it). |
| `public.pending_people` | `author` `author_id`, `non_user_contact` `phone_e164` (may not have an account). |
| `public.quips` | `author` `author_id`, `quoted` `quoted_person_id`. |
| `public.friend_notes` | `author` `author_id` only. The subject of the note does not get a read. |
| `public.jname_results` | `owner` `user_id`. Friend read is a separate purpose, not a silent service-role exception. |

`not found: no obvious owner column` on the seed means the heuristic failed. Phase 1 assigns `system` or a real owner. Do not leave that string in the enforcing catalog.

### sensitivity_class

| Class | Use |
|---|---|
| `public_profile` | Would be safe on a logged-out page. Almost nothing qualifies. Do not use this for `display_name` without a founder yes. The seed marked it `friends_only`. |
| `friends_only` | A connected person at acquaintance or above. `user_identity_select` is this pattern (`can_view(..., 'acquaintance')`). |
| `circle_scoped` | Depends on `visible_to_tier` or an audience column. Stories, quips, recap answers, attributes that are not `none`. |
| `private` | Owner, or the parties on the row, and not a circle slider. Friend notes, blocks, assistant memory. |
| `sensitive` | Health, location, biometric, likeness, another person's contact, a minor's data, secrets. Default for phone, email, allergies, home city, geo, tokens, `attributes.value` until split by key. |
| `system_internal` | Ids, timestamps, operator config, job logs with no user content. |

Classify up when unsure, set `needs_review: true`. The seed already did that for 520 columns.

### purpose_tags (closed)

An extension requests a purpose. It does not request a table.

| Purpose | Meaning | Typical backing |
|---|---|---|
| `account_self` | The signed-in user reading or editing their own row. | `GET /me`, `user_settings`, `user_contacts` |
| `render_profile` | Show a profile the viewer is allowed to see. | `GET /people/:id/profile`, `attributes` under `can_view` |
| `render_feed` | Home, updates, touch grass, activities the viewer may see. | `stories`, `feed/*` |
| `friend_matching` | Discover. Only `matchable` facts with `visible_to_tier = acquaintance` and `discoverable = true`. | `matching/*`, `person_embeddings` inside the worker only |
| `notifications` | Write or read that user's alerts, after `notif_prefs`. | `notifications` |
| `deliver_message` | Ciphertext in, ciphertext out, the two parties only. | Not found yet. Spec: `complete/MESSAGES.md` |
| `coop_public` | Mission, economics, roles. | The three anon `USING (true)` policies |
| `admin_ops` | Operator console. Not an extension purpose. | `AdminGuard` routes |
| `assistant_self` | Billy, the requester's own visible data, confirm before acting. | `assistant_*`. No policy on those tables today. The layer is the fence. |
| `analytics_aggregate` | PostHog. De-identified. k-anonymity if an extension asks for a count. | Not a Postgres table. Taxonomy ids. |

New purposes are catalog proposals. They are not added in an extension manifest.

### allowed_operations

`read`, `write`, `append`, `aggregate_only`, `derive_from`.

`aggregate_only` returns a count or a bucket, never a row, and only when the cohort is at least k (`03-POLICY-AND-SECURITY.md`, k = 10 unless `08` changes it).

### derivable_to

`transcript`, `summary`, `still_frame`, `waveform_card`, `text_to_speech`.

Empty means none. Poster opt-in is separate (`05-CONNECTION-CONTRACTS.md`) and defaults off. Derived rows inherit the source visibility and the source deletion cascade.

Lineage is required when `derivable_to` produced a stored value. Known lineages from the inventory: `stories.transcript`, `day_summaries`, `week_summaries`, `person_embeddings`, `person_summaries`, `quiz_results`, `matching_suggestions`, filtered `avatar_media_id`.

### consent_basis

| Value | When |
|---|---|
| `core_required` | The account cannot function without it. Signup capture. A PR that sets this must say why in the catalog `retention.rule` text and in the PR. Forbidden as a shortcut for extensions. |
| `opt_in` | This user turned it on. `discoverable`, assistant, delight opt-ins. |
| `per_relationship` | This user granted it toward a person or a circle. `visible_to_tier`, `matchable` is not this (matchable is `opt_in` against the Discover system, not against one friend). |
| `extension_opt_in` | Exists only because a reviewed extension proposed it. No value until a receipt exists. |

### retention

```json
{ "rule": "account_life", "max": null }
```

Rules: `account_life`, `rolling_30d`, `until_event_end_plus_7d`, `session`, `receipt_kept_after_delete`.

Real examples to encode in Phase 1, not new behavior:

- Free-tier story media: `expires_at` 30 days (`stories`, `media`). Co-op: no expiry. See `plan_state.storage`.
- Recap answers: `expires_at` 7 days for free, null for co-op (`recap_answers_select` already hides expired rows).
- `music_oauth_states`: short-lived. `session`.
- Embeddings: deleted when `discoverable` flips off (`drop_zone_c_on_undiscoverable`). Retention rule `account_life` plus cascade on that flag.

`deletion_cascade` lists ids. Account delete already cascades from `users.id` to `auth.users`. The catalog must also list derived rows and, later, `extension_storage` and PostHog person purge (`POST /me/analytics/purge`).

---

## Compiler outputs

From the git JSON, one command writes:

1. `packages/shared` types for catalog ids and purpose enums. Hand-written duplicates are a CI failure.
2. A SQL file of RLS policies that the catalog marks `generate_rls: true`. Policies that are intentionally wider (the founder-gated ones) stay hand-written until the gate flips, and CI diffs them against the catalog so they cannot widen quietly.
3. Consent strings keyed by `consent_copy_id`. The product UI reads those strings. It does not invent a second sentence.
4. A runtime snapshot the API loads at boot. If git and the snapshot disagree, boot fails.

The Postgres cache table, created in a later migration, is `catalog_snapshot` (one row, jsonb, no client policy). It is a cache. Edits to it are not source of truth.

---

## What Phase 1 must fill before enforcing CI

- `purpose_tags` and `consent_basis` on every row that is not `deprecated_in`.
- Split `public.attributes.value` into key entries for keys the app already writes. The column entry remains `sensitive`, `allowed_operations: []` for extensions (owner `account_self` only via key entries).
- `owner_subject` replacements for every seed row that says `not found`.
- Analytics events from `packages/shared/src/analytics/ids.ts` as entries with `analytics_aggregate` and no content payload. The seed does not include them yet.
- Backing endpoints from `inventory/api-surface.json`.

`needs_review: true` does not fail CI. Shipping a new `sensitive` field, a `consent_basis` change, or an extension capability does. That is the founder gate in `07`.
