# 04 · Extension manifest spec

An extension is a reviewed declaration. It is not a program. Runtime decision: `guide-docs/adr/0002-declarative-extensions.md`.

v1 does not run extension JavaScript, WASM, or server code. The app already knows how to render core primitives. The manifest says which primitives, which catalog purposes, and which extra fields (only after review and a receipt).

---

## Runtime options (why this one)

| Model | Power | Privacy | Decision |
|---|---|---|---|
| Declarative only | Layouts, filters, and compositions of existing primitives. Queries are purpose names, not SQL. | Strongest. The author cannot run code next to the service role or the phone's storage. | **Ship this.** |
| Sandboxed client code | Custom UI and logic in an isolated JS or WASM island. Data only through an SDK bridge. No direct network or storage. | The bridge is the whole fence. A bug in the bridge is a data leak onto the device. | Not v1. Revisit only if a first-party manifest cannot express messages after the ciphertext primitive exists. That failure means the primitive is incomplete, not that we should run user code. |
| Server-side extension code | Author code in Nest or a worker. | Rejected. It sits next to `SupabaseService.admin`, which already bypasses RLS. There is no compelling reason. Core features that need code are core, reviewed in this repo. | **Rejected.** |

---

## Manifest

JSON, signed, immutable per version.

```json
{
  "id": "bridger.messages",
  "version": "1.0.0",
  "author": "bridger-core",
  "signing_key_id": "bridger-review-1",
  "primitives": ["thread", "ciphertext_message", "contact_card", "heart"],
  "capabilities": [
    {
      "purpose": "deliver_message",
      "entries": ["public.messages.ciphertext", "public.messages.kind"],
      "operations": ["read", "append"]
    }
  ],
  "proposed_entries": [],
  "storage": {
    "keys": ["draft_local"]
  },
  "network": "none"
}
```

Rules:

- `capabilities` reference catalog ids and purposes. Table names and SQL are invalid. CI rejects them.
- `network` defaults to `none`. `any` is rejected in v1. A specific host is a catalog proposal, founder-reviewed, because it is an exfiltration path.
- `storage.keys` are per-user keys in `extension_storage` (proposed). Owned by the user, deleted with the account and on uninstall, included in export, cataloged as `provenance: extension:<id>@<version>`.
- `proposed_entries` is empty at install time. New data points follow the review flow in `PROCESS.md` (section "New data points") before they appear here.
- The signature covers the canonical JSON. The client and the API both verify. Unsigned or unknown `signing_key_id` does not run.

### Primitives (public surface)

An extension taps these. It does not get the underlying tables.

| Primitive | What the extension may do | Real backing today | Gap |
|---|---|---|---|
| `profile_fact` | Read or append a catalog key the purpose allows. | `attributes` plus `visible_to_tier` and `matchable`. | Must be per key, not the jsonb blob. |
| `update` | Read updates the viewer may see. Append is the owner's, core composer. | `stories`, `scrapbook_pages`, `scrapbook_elements`. | Tier comes from core, not the extension. |
| `voice_recap` | Read recap answers the viewer may hear. | `recap_answers`, `media`. | Question text is currently `USING (true)`. An extension does not get a wider read than the listener's tier. |
| `touch_grass` | Read and respond inside `audience_tier`. | `touch_grass`, `touch_grass_responses`. | |
| `circle_grant` | Read the viewer's own tiers. Not someone else's sort of a third person. | `tiers`. | `can_view` already refuses arbitrary pair probes. |
| `thread` | List threads with a friend. | **Not found.** | Build with messages. |
| `ciphertext_message` | Append ciphertext. Read ciphertext for the two parties. | **Not found.** | Server never sees plaintext. `kind` metadata only. |
| `contact_card` | Share the sender's enabled card fields into a thread. | **Not found.** Spec in `complete/MESSAGES.md`. | Fields are `sensitive`. Receipt required. Not a raw phone dump. |
| `heart` | Toggle a reaction. Not a send. Not a count shown to anyone else. | Reactions exist for stories (`reactions`). Message hearts were not found. | No heart totals (vanity metric). |
| `event` | Read events the viewer is invited to. RSVP is core. | `events`, `event_invites`. | Address and allergies stay `sensitive` and are not in the default capability. |

If a primitive is not in this table, the manifest cannot name it.

---

## Install, friends, versions, kill switch

Proposed tables (not in the database today):

| Table | Purpose |
|---|---|
| `extension_manifests` | Reviewed JSON, signature, status `active` or `revoked`, version. |
| `extension_installs` | `user_id`, `extension_id`, `version`, `installed_at`. The user's row. |
| `extension_storage` | `user_id`, `extension_id`, `key`, `value`. User-owned. |
| `catalog_proposals` | Requested new entries. |
| `catalog_reviews` | Approve, reject, or downgrade. Reviewer id, time, note. No user content. |
| `consent_receipts` | See `adr/0004`. |

Flow:

1. Author submits the manifest in admin. Reviewer checks purposes against the catalog. Sensitive purposes and any `proposed_entries` wait for the founder tag (`07`).
2. On approval the signing key id is attached and the version is immutable.
3. Install shows a screen generated from the manifest's capabilities and the catalog's `consent_copy_id`. No second copy.
4. The API records `extension_installs` and receipts for each new data point. Core friendship data does not get a new receipt just because an extension displays it.
5. A friend can send you an install link. Opening it is the same review screen. Their install does not grant them anything new about you.
6. If they use an extension you have not installed, their client may render their own copy of data core already lets them see. It cannot call the API as an extension against your subject id. `acting_via` for your rows stays `core` unless you installed it.
7. A version with a larger capability set needs a new receipt before those capabilities work. Smaller or equal sets can replace the pin without a new consent. The server compares catalog ids, not version numbers alone.
8. Uninstall deletes `extension_storage` for that pair and stops `acting_via` grants. Core data stays. Receipts for extension data points are withdrawn, and `deletion_cascade` runs.
9. Kill switch: set the manifest `revoked`. All versions fail verification. In-flight requests start omitting extension grants. No client release required.

Admin UI scope (no visual design here): a queue of proposals and manifests, the diff of catalog ids, approve / reject / downgrade to `aggregate_only`, and a revoke button. It lives in the existing admin console, behind `AdminGuard`.

---

## Messages dogfood

`bridger.messages` is the first manifest, first-party, signed by the review key. It is not installable until these catalog entries exist and the policy layer enforces them:

| Entry | Class | Operations | Notes |
|---|---|---|---|
| `public.messages.ciphertext` | `sensitive` | `append`, `read` | Purpose `deliver_message`. Two parties. Policy layer treats the value as opaque. Logs do not store it. |
| `public.messages.kind` | `private` | `read`, `append` | `text`, `contactCard`, `storyReply`. `planNudge` is legacy in the spec and is not a capability. |
| `public.messages.counts_against_cap` | `private` | `read` | Server metadata. Cap is 5 per recipient per day. Hearts and contact cards do not count. |
| `public.contact_cards.fields` | `sensitive` | `read`, `write` | Owner edits. Share is a copy into ciphertext, not a live read of `user_contacts` by the friend. |

The friend reads ciphertext, not `user_contacts.phone`. That split is the whole point of the spec.

If the manifest above cannot cover the acceptance criteria in `complete/MESSAGES.md` (cap, heart not a send, story reply mirror, no read receipts), add a primitive or a catalog entry through review. Do not add server-side extension code to paper over it.

Demo fixtures in `apps/mobile/data/messages.ts` stay for demo mode. They are not the production store. Production never persists the demo plaintext.
