# ADR 0004 · Consent receipts, and omitted denials

**Status:** proposed (2026-09-21)

## Context

Consent today is columns, not a log of what was asked. Examples: `attributes.visible_to_tier`, `attributes.matchable`, `user_settings.discoverable`, `user_settings.assistant_enabled`, `user_settings.notif_prefs`. There is no terms-acceptance column (not found). Extensions must not collect a new fact without a per-user yes, and withdrawal has to delete the values.

Field-level 403 and `"private": true` tell the caller that a value exists. The inventory's phone path already avoids "is this number on Bridger?" The wire format has to keep that property for every field.

## Decision

**Wire.** A field the requester may not read is omitted. It is not null, not an error, not a redaction marker. Null is reserved for "you may see this, and it is unset." A row the requester may not see is HTTP 404, identical to an unknown id. Full rules: `guide-docs/platform/03-POLICY-AND-SECURITY.md`.

**Receipts.** Append-only table `consent_receipts` (Phase 4, not migrated yet):

| Column | Meaning |
|---|---|
| `id` | uuid |
| `user_id` | the person who agreed or withdrew |
| `catalog_id` | one data point, not a whole extension |
| `extension_id` | null for core |
| `extension_version` | null for core |
| `action` | `grant` or `withdraw` |
| `copy_id` | catalog `consent_copy_id` |
| `copy_text` | the words shown, snapshotted |
| `created_at` | time |
| `source` | `ui` or `grandfathered` |

The latest action wins. Withdraw runs `deletion_cascade` from the catalog, including derived rows and `extension_storage`.

Existing flags stay in force without a new prompt (`08` question 4, recommendation: grandfather, `source: grandfathered`). Extension data points never grandfather.

`discoverable` stays the column `trg_discoverable_purge_matching` reads. The receipt is the log. The column is the cache. Do not make the trigger depend on a join it does not have today until Phase 4 tests prove the same deletes.

## Consequences

- Clients must tolerate missing keys. They must not treat a missing key as "set this default."
- Two subjects with different privacy settings return the same keys to the same requester.
- We will not have historical copy for grandfathered flags. The row says so.
- PRIVACY.md and TERMS.md update when receipts ship.

## Alternatives rejected

- Null for denied. Callers treat null as "empty" and branch on key presence. That becomes a marker.
- One receipt per extension. A later version can add a field the user never saw. Consent is per catalog id.
- Mutable receipt rows. Withdrawal must not erase the fact that a grant existed. The values go. The receipt history stays, without the values.
