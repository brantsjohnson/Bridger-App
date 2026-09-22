# 03 · Policy and security

Authorization, consent, the no-existence-oracle rules, and the threat model. The policy layer is specified in `guide-docs/adr/0001-policy-engine-in-nest.md`. Consent receipts are `guide-docs/adr/0004-consent-receipts-and-omit-denied.md`.

---

## Deny by default

A field is returned only when all of these are true:

1. The catalog grants that field for the requester's purpose.
2. `acting_via` is `core`, or an extension install is active for the actor and the manifest version's capabilities include that purpose and field.
3. Every `owner_subject` who must consent has a covering grant (receipt, or a grandfathered core flag recorded in `06`).
4. Relationship state allows it. Blocked pairs fail closed, same as `can_view`.
5. The operation is in `allowed_operations`.

Otherwise the field is omitted. Not nulled. Not a 403. Not a `"hidden": true` flag.

Row denial is not-found. Same status, same body shape, same headers as a row that does not exist. Today many Nest routes throw `404` and `403` differently. The plan's invariant tests forbid that split on user-data routes. Health, admin login, and webhook signature failures are not user-data rows and may keep their own errors.

---

## Where it runs

In Nest, in one module, before serialization. `visibility.ts` moves behind that module. `this.supabase.admin` is not called from feature services after the enforce flip (`06`, founder gate).

RLS stays. It protects the publishable key. It does not protect the service role, which is why the layer exists. Generated RLS is allowed only when a test proves it matches the catalog for the publishable-key role. Hand-written policies that are wider than the catalog (`media_select`, `activity_posts_select`, `recap_submitted_questions_select`, `coop_beta_votes_select`) are listed in the catalog as `generate_rls: false` until a founder yes tightens them.

The phone does not filter. Extensions do not filter. A field that is omitted must already be gone in the JSON Nest sends.

---

## Wire rule (denied == absent)

Pick: **omit the key**.

| Situation | JSON |
|---|---|
| Requester's grants do not include the field | Key absent, for every subject. |
| Grants include it, subject left it unset | Key present, value `null`. |
| Grants include it, subject set it | Key present, value set. |
| Row not visible | `404` with the same body as an unknown id. No `403` on that route. |

Shape is a function of the requester's grants, not of the subject's settings. Two people with different `visible_to_tier` values produce the same keys for the same viewer. Values differ only on keys that viewer may see.

Why not null-for-denied: a present null is easy to confuse with "they cleared it," and clients start branching on "the key exists." Omission matches "this is not in your world."

Counts, cursors, and `has_more` are computed after the filter. No `total_count` that includes hidden rows. `coop_ideas.support_count` is a stored counter of supports the viewer could also list under the current `USING (true)` policy. When that policy tightens, the counter must be recomputed for the viewer or removed. Do not add new stored counters that include hidden rows.

---

## No existence oracle

These are testable. CI runs them once the policy layer has a fixture harness (`06` Phase 2). A failure fails the build.

1. **Key set.** Same requester, two subjects, different privacy settings, same grants. The sorted key paths of the JSON are equal.
2. **Missing vs denied.** Request a real id the caller cannot see, and a random uuid. Status, JSON body, and the header names we set (ignore date and request id) match.
3. **No field 403.** User-data responses never include `code: "forbidden_field"` or the words hidden, private, or redacted.
4. **Counts.** A feed fixture with one visible story and one Close-only story returns a length of 1 for an acquaintance. It does not return `total: 2`.
5. **Phone.** `POST /me/pending-people` with a number that belongs to an existing user and a number that does not. Response shape matches. Neither body contains `mergedUserId` of someone else or a boolean `onBridger`. The current service already behaves this way. The test locks it.
6. **Friends of friends.** A suggestion route never returns a user the caller is not allowed to know exists. Discover already returns opaque ids inside the product. Extensions do not get a "lookup by phone" or "lookup by email" purpose. That purpose is not in the closed list.
7. **Search.** No autocomplete purpose returns a hit the caller could not open. If we add search later, empty results and denied results look the same.
8. **Aggregates.** Below k, the aggregate is omitted, not returned as 0. Zero would confirm a tiny cohort. k is 10 (see below).
9. **J-name board.** `GET /jname/leaderboard` today returns friends' `percent` via the service role while RLS is own-row. The invariant is: a friend sees that field only if the catalog purpose says so and the subject opted in. Until that purpose is explicit, the shadow log must flag this route. Do not copy it into an extension.

### Side channels

| Channel | Mitigation |
|---|---|
| Timing | Phone merge and "load person by id" for non-connections do the same work on hit and miss. No early return that skips the database on denial. Residual: network timing. Do not claim this is perfect. |
| Error text | One not-found error for user rows. Webhook and admin login keep their own errors. |
| Rate limits | Same limit for found and not-found on person and phone routes. Do not tighten the limit only when the row exists. |
| Cache headers and ETags | Do not put a hash of hidden fields in an ETag. `ETag` is derived from the filtered body only. `Cache-Control` does not vary on the subject's private settings. |
| Ordering | Sort keys are visible fields only. Do not `ORDER BY` a column the caller cannot see (that leaks through position). |
| Ids | Tables already use `uuid`. Do not add `serial` primary keys on user data. Guessing ids must not confirm existence (invariant 2). |
| Insert side effects | Creating a pending person must not notify the other party and must not change the caller's friend list. Merge runs on the new account's own phone only (`merge_pending_people_for_user`, service role). |
| Inference | `inference_risk_with` on catalog entries. First real case: keys inside `attributes.value`. Granting hobby keys must not return the whole jsonb. Birthday stays a separate id. |

### k = 10

Extension `aggregate_only` results require at least 10 distinct subject users in the cohort, no drill-down, no per-user residue. Under 10, omit the aggregate.

Why 10: it is a common floor, and it is above the free Close cap (5), so a Close circle cannot be re-identified as "all of them." Cost: a lot of Bridger circles are smaller than 10, so extension analytics will often be empty. That is the privacy choice. Raising or lowering k is `08` question 1. Do not ship a lower k to make a chart look full. Charts that need small-n counts are a product pressure toward vanity metrics. Refuse them.

---

## Consent enforcement

Receipts: `adr/0004`. Short version:

- `core_required` is grandfathered for fields the account already has (email on the auth user, display name once set). New `core_required` needs a written reason and founder review.
- `opt_in` is a receipt. `user_settings.discoverable` and `assistant_enabled` are the current storage. Phase 4 writes a receipt when they change, and keeps the column as the cache the trigger `trg_discoverable_purge_matching` already reads. Do not remove that trigger.
- `per_relationship` is `attributes.visible_to_tier` and audience columns (`stories.visible_to_tier`, `touch_grass.audience_tier`, `recap_answers.visible_to_tier`). The tier row is the grant. A receipt is added when the UI copy is versioned. Until then the column is the grant, and the catalog says so.
- `extension_opt_in` does nothing without a receipt for that data-point id and that extension version. The policy layer checks the receipt table, not the manifest.

Notification prefs are `opt_in` (or a default-on core choice, which is question 4 in `08`). Today `NotificationsService.notifyIfAllowed` enforces them, and these files insert into `notifications` on their own: `connections.service.ts`, `events.service.ts`, `recap.service.ts`, `jname.service.ts`, `delight.service.ts`, `polls.service.ts`, plus `merge_pending_people_for_user`. Phase 3 routes those inserts through the helper. That changes behavior for people who turned a kind off. It is a privacy fix. It is called out so TestFlight notes can mention quieter alerts, not a crash.

Withdrawal deletes values listed in `deletion_cascade` and revokes the read. Derived rows go too (`person_embeddings` already drop when Discover turns off). Extension storage goes too.

---

## Audit

`data_access_log` (proposed table, not in the inventory):

| Column | Notes |
|---|---|
| `id` | uuid |
| `at` | time |
| `actor_user` | who |
| `acting_via` | `core` or extension id and version |
| `purpose` | catalog purpose |
| `subject_ids` | opaque uuids |
| `field_ids` | catalog ids considered |
| `decision` | `allow` or `omit` or `not_found` |
| `request_id` | no body, no field values |

The user can read rows where they are the actor or a subject. Nobody else can, including extensions (`account_self` only). Admins do not get a "read all logs" purpose in v1. A breach review is a founder-operated SQL session, not a product feature.

Do not log field values, message ciphertext, phone numbers, or quiz text.

Volume: shadow mode logs denies and a sample of allows. Enforce mode logs extension allows and all denies. Logging every core feed read at full fidelity will be too noisy. The sample rate is an ops choice, not a privacy weakening: denies are never sampled away.

---

## Threat model

| Threat | What stops it | Residual |
|---|---|---|
| Malicious extension author | Declarative manifest, purposes not SQL, review, no network, no service role, omit-by-default, receipts per data point. | A reviewed manifest can still ask for a sensitive purpose. Review is human. `needs_review` and founder tag on `sensitive` capabilities. |
| Malicious friend distributing an extension | Install is per user. Their install does not grant them your data. Your data moves only under core friendship rules plus your receipts. | They can still see what core already allows a friend to see, then show it inside their UI. That is friendship, not a new grant. |
| Stolen extension signing key | Kill switch flips `extension_manifests.status` to `revoked`. Clients refuse revoked versions. Rotate the key. | Already-fetched ciphertext on a device is the device's problem. Server stops new reads. |
| Curious insider with database access | Service role is the insider path today. The layer does not stop someone with production SQL. Mitigation: no field values in app logs, embeddings are not names, message bodies are ciphertext (once messages exist), audit log has no values. | A person with the service key can still read `user_contacts` and `attributes`. This plan does not claim otherwise. Production SQL access stays founder-controlled. |
| Scraped public surface | Anon policies are only mission, economics, and roles. Person routes 404. Phone lookup does not answer membership. | `USING (true)` signed-in policies leak activity posts, recap suggestions, and beta votes to any account. Those are founder questions in `08`, not extension features. |
| TestFlight client on the old media path | Old app may still insert `media` until the minimum version. RLS `media_insert` is owner-only, so they cannot write someone else's row. They can still read acquaintance-wide until `media_select` changes. | Window until the floor version. Documented in `06`. |

Product principles checked: no endless scroll (extensions do not get a ranked infinite feed purpose), no AI (derivations that need a model stay off, `05` and `08`), no follower counts (k-anonymity and no public totals), no ads (no advertising purpose in the closed list).
