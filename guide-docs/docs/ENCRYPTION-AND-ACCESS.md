# Bridger: Encryption and access (breach-ready architecture)

> **WHAT THIS FILE IS:** the permanent contract for how Bridger protects Zone A and sensitive content at rest, who can decrypt what, and how keys are stored so a single breach (database dump, one vault, or one laptop) is not enough to read member PII or message bodies.
>
> **STATUS:** Pass 2 (docs only, September 2026). Describes the target architecture and rollout phases. Implementation, production key cutover, and mass re-encrypt migrations remain **out of scope** until a later engineering pass.
>
> **RELATED:** `DATA.md` (zones A/B/C, RLS, deletion), `INFRASTRUCTURE.md` (hosting, Secrets Manager, KMS), `docs/PRIVACY.md` (member-facing promises), `AI-SYSTEM.md` (PII firewall for models), `complete/MESSAGES.md` (E2E DM contract), `ADMIN.md` (integrations health; no secret values in health JSON).

---

## 1 · Design goal: no single point of decryption

Bridger's privacy story on Profile intro is simple: **you decide what you share with who.** The infra version of that promise is **split-key custody**:

| What lives where | Examples | If an attacker gets only this… |
|---|---|---|
| **Ciphertext + metadata** | Supabase Postgres rows, Storage object bytes (when encrypted), connection graph ids | They see blobs and opaque ids, not phones, emails, message text, or tier-gated profile answers. |
| **Data encryption keys (DEKs) + envelope keys** | AWS KMS CMKs, per-purpose DEKs wrapped by KMS, rotation metadata | They still cannot decrypt without the matching ciphertext columns and application logic. |
| **Lookup / search keys (separate lockbox)** | HMAC key for normalized phone (and similar) for friend find and `pending_people` merge | They can test guesses or build a rainbow table if they also have ciphertext, but they still do not get DEKs from this secret. |

**Rule:** ciphertext (Supabase) and cryptographic keys (AWS) are never sufficient alone. The **phone lookup HMAC key** lives in a **second** Secrets Manager secret (or second JSON key namespace with separate IAM and rotation), **never** in the same JSON blob as DEKs or database URLs, and **never** colocated with Supabase backups.

Nest is the only runtime that orchestrates decrypt for server-side features (Phase 1). Phase 2 moves Close-tier and DM plaintext off the server for members who opt into true E2E (see §7).

---

## 2 · Attack scenarios (what must still fail)

Each row is the **worst reasonable outcome** if controls in this doc are implemented. Plaintext PII or message bodies must not appear.

| Scenario | Attacker gets | Must NOT get | Why split-key + app crypto holds |
|---|---|---|---|
| **DB dump only** | Full Postgres export (+ Storage metadata paths) | Phones, emails, DM text, tier-gated `attributes.value`, voice/photo/video bytes | Columns and objects are app ciphertext; DEKs and HMAC key are not in the dump. |
| **One vault only** | All of `bridger/api/server` **or** only the phone HMAC secret | Full decrypt of member data | DEKs without ciphertext are useless; ciphertext without DEKs (or without membership/tier authZ) stays opaque. HMAC alone does not unwrap DEKs. |
| **Nest compromise** | Running API container, env injection, memory at runtime | Bulk offline decrypt of all users without audit; long-lived export of keys | Keys stay in KMS/Secrets Manager (not written to disk); decrypt is per-request after authZ; audit log + rate limits; no "dump all plaintext" admin route. |
| **Malicious admin** | `ADMIN.md` console operator account | Message bodies, phones, emails, group-only ciphertext by default | Admin UI is metadata-only; decrypt requires break-glass (§8) with immutable audit. Group unlock tokens (§5.4) exclude founder by default. |
| **Stolen backup** | Old Supabase snapshot or Storage replica from time *T* | Readable PII after keys rotated post-*T* | Re-encrypt job (§9) retires old `key_version`; backups from before rotation die when old DEK versions are destroyed. |

---

## 3 · Key hierarchy (conceptual)

```
AWS KMS CMK (Bridger-owned, per environment)
    └── wraps DEKs (envelope encryption)
            ├── platform_pii_dek          … phones, emails (user_contacts, auth-adjacent fields)
            ├── pending_people_dek      … pending_people.phone_e164, display_name on cards
            ├── messages_dek            … message body + contact-card payload ciphertext (Phase 1 at-rest)
            ├── tier_dek_close          … Phase 1b: attributes visible_to_tier = close
            ├── tier_dek_friend         … Phase 1b
            ├── tier_dek_acquaintance   … Phase 1b
            ├── tier_dek_public_share   … Phase 1b: intentionally wider profile slices
            ├── custom_group_dek_<id>   … Phase 1b: first-class crypto tier per named group
            └── group_share_dek_<id>   … Phase 1b: co-op group shares (text/voice/photo/video)

Separate secret (second lockbox):
    └── phone_lookup_hmac_key           … deterministic HMAC for E.164 lookup/merge only (not reversible to phone)
```

- **DEKs** are generated in KMS, used to encrypt field- or blob-level ciphertext in Postgres (or Storage), and stored wrapped (ciphertext of DEK + key id + version).
- **Rotation:** new DEK version encrypts new writes; background re-encrypt (§9) retires old versions so **old dumps die** when keys rotate even if a backup leaks later.
- **Logs, analytics, connection payloads:** never carry plaintext Zone A or message bodies; only opaque ids, enums, and taxonomy-safe outcomes (see `ANALYTICS-TAXONOMY.md`).

Current env names in `INFRASTRUCTURE.md` (`EMAIL_HMAC_KEY`, `EMAIL_ENCRYPTION_KEY`) are **legacy portal stubs**; this doc supersedes their shape for the full Bridger rollout (phones, emails, messages, tiers). Cutover is a later engineering pass.

---

## 4 · Phase 1: platform PII and messages at rest (server-held keys)

**Scope (encrypt at rest in Supabase; decrypt only inside Nest after authZ):**

| Data class | Tables / fields (see `DATA.md`) | Notes |
|---|---|---|
| Phones | `user_contacts.phone`, Auth-linked E.164 | Merge key for signup; never log plaintext. |
| Emails | `user_contacts.email` (and legacy auth email if present) | Same DEK family as phones or dedicated email DEK. |
| Pending people | `pending_people.phone_e164`, `display_name` | Author-only today; still Zone A. |
| Message bodies | DM text, contact-card field values, encrypted blobs | Aligns with `complete/MESSAGES.md`: DB stores ciphertext; staff tools cannot read plaintext. |

**Friend find / merge without plaintext in the DB:**

- Store **HMAC(normalized E.164)** with the separate lookup key for equality search and merge when someone signs up with the same number.
- Do not store reversible phone encodings in indexes used for lookup unless envelope design requires it; prefer HMAC column + encrypted phone column.

**Plaintext forbidden surfaces:**

- Application logs, load balancers, error trackers, PostHog, admin JSON exports, and **connection API payloads** that echo contact fields must not include decryptable PII or message text.
- Support and admin consoles show **metadata only** (user id, timestamps, tier) unless break-glass (§8).

**Non-goals (docs passes):** no production key cutover, no schema migration, no mass re-encrypt job shipped, no TestFlight / EAS.

---

## 5 · Phase 1b: tier DEKs, custom groups, group shares, and media

Profile attributes today use RLS and `visible_to_tier` (`DATA.md`). Phase 1b adds **cryptographic tier boundaries** on top of RLS (defense in depth if RLS or API regresses).

### 5.1 Per-tier DEKs for profile attributes

- Each `attributes` row (and analogous profile modules) carries ciphertext encrypted under the DEK for its `visible_to_tier`: **Close**, **Friend**, **Acquaintance**, and **public-share** (intentionally exportable or wide-audience slices).
- Nest decrypts only the tiers the **viewer's relationship** allows, same as RLS intent.
- Changing tier on a field re-encrypts under the new tier DEK.

### 5.2 Custom groups as first-class crypto tiers

- Named co-op **groups** are not only RLS labels: each group gets a **`custom_group_dek_<group_id>`** used for attributes and content tagged to that group.
- Membership grants the client/API the ability to unwrap that DEK for reads; non-members see opaque ciphertext or omitted fields.

### 5.3 Group content shares (text / voice / photo / video)

- Co-op group shares use a **`group_share_dek_<group_id>`** (may coincide with group DEK or a child DEK per share thread; engineering chooses one envelope pattern and documents it in a later ADR).

### 5.4 Members-only unlock tokens

- For group-gated material, non-members (including **founder / ops by default**) receive **opaque unlock tokens**: ciphertext or wrapped key material useless without membership.
- Unlock tokens are **not** admin backdoors; they exist so clients can prove membership without exposing the DEK in API responses to outsiders.

### 5.5 Media ciphertext paths (Supabase Storage)

Large bytes never sit as readable files in the bucket. **Object bytes are encrypted**; Postgres holds pointers and crypto metadata only.

| Content | Postgres anchor | Storage path pattern (conceptual) | DEK used |
|---|---|---|---|
| Collage photo/video element | `scrapbook_elements.media_id` → `media.id` | `media.storage_path` in private bucket | Tier DEK for page audience (`scrapbook_pages` / `stories.visible_to_tier` or group id); or per-page content key wrapped by that DEK |
| Collage voice note | `scrapbook_elements` type voice + `media_id` | same bucket, voice kind | Same as page tier; transcript text (if any) is a separate ciphertext field (Zone B words only for AI, still encrypted at rest) |
| Profile / joke / event photos | `media` row (avatar, quips, event album) | `storage_path` | Owner tier or event visibility DEK; co-op group album uses `group_share_dek_<id>` |
| Group share media | share row + `media_id` (when migrated) | group prefix in bucket | `group_share_dek_<group_id>` |
| DM attachments (if added) | message row ciphertext blob or `media_id` | messages prefix | `messages_dek` (Phase 1) then participant E2E wrap (Phase 2) |

**`media` row (future columns, docs only):** keep `storage_path`, `kind`, `owner_id`; add `content_enc` metadata (`key_id`, `key_version`, `nonce`, optional `wrapped_dek`) either on `media` or a side table. Signed URLs return **ciphertext bytes**; client or Nest decrypts after authZ. Flattened Collage preview JPEGs follow the same rule as their page tier.

**`scrapbook_elements.data` (JSON):** typed captions, sticker ids, and layout stay JSON; any user-typed string in `data` that is not already in `attributes` moves to ciphertext fields inside JSON or a parallel `text_ciphertext` column keyed by page tier DEK.

---

## 6 · Table mapping (current schema, target ciphertext)

No migration in this pass. This maps **today's tables** to **where ciphertext lands** when implementation ships.

| Table | Sensitive columns today | Target treatment |
|---|---|---|
| **`attributes`** | `value` (jsonb), `key` (semantic id) | Phase 1b: encrypt `value` (and free-text inside json) with `tier_dek_*` or `custom_group_dek_*` per `visible_to_tier` / group tag. Keep `key`, `matchable`, `layer` plaintext for indexing policy. Matching pipeline reads normalized scrubbed text only after decrypt inside Nest gateway (never logs plaintext). |
| **`scrapbook_elements`** | `data` jsonb, `media_id` | Phase 1b: encrypt caption/voice text in `data`; media bytes via `media` + Storage (§5.5). Layout numbers (`x`, `y`, `width`, `height`) stay plaintext. |
| **`media`** | `storage_path` | Phase 1b: object bytes encrypted at rest; row carries `key_id` + `key_version`. Path reveals owner id only (already true). |
| **`messages`** (conversation module; shapes in `packages/shared/src/model/message.ts`) | `text`, contact-card values | Phase 1: `ciphertext` + `key_id` + `key_version` at rest; no plaintext `text` column in Postgres. `conversationId`, `senderId`, timestamps, `kind`, cap flags stay plaintext metadata. API matches `complete/MESSAGES.md`. |
| **`user_contacts`** | `phone`, `email` | Phase 1: encrypted columns + `phone_hmac` for lookup. |
| **`pending_people`** | `phone_e164`, `display_name` | Phase 1: `pending_people_dek`. |

Related rows that must stay plaintext or metadata-only: `connections`, `tiers`, `blocks`, `stories` ids/timestamps/audience enums, notification `payload` (no message body or phone).

---

## 7 · Phase 2: client-held Close keys, true E2E DMs, blind in-common, location

Phase 2 is **documented now, built later.** It satisfies the long-term `complete/MESSAGES.md` contract (Nest never sees DM plaintext) and strengthens Close-tier promises.

| Capability | Target behavior |
|---|---|
| **Client-held Close keys** | Close-tier profile material can be encrypted so the server holds only ciphertext; unlock requires device keys or member-granted wraps. |
| **True E2E DMs** | Encrypt on sender device before upload; decrypt only on participants' devices. Nest routes ciphertext and handshake metadata only. |
| **Blind in-common (PSI-style)** | Shared-interest overlap without revealing full attribute sets to the server or to the other party's raw profile. |
| **Location for AI (unlinkable store)** | "How you met" and coarse location for future AI features live in a **separate store** with **pairwise opaque ids**, not joinable to global user id in model pipelines. Zone A rules in `DATA.md` still apply for product display; model inputs stay scrubbed. |

Phase 1 server-side encryption **does not** block Phase 2: message tables should store versioned ciphertext blobs and key ids from day one so clients can take over wrapping later.

---

## 8 · Founder break-glass (Zone A only, logged)

Some incidents (account recovery, legal process, abuse investigations on metadata) may require **limited** decryption of Zone A fields by a **founder break-glass** path.

**Principles:**

- Break-glass is **not** daily admin access. Normal admin (`ADMIN.md`) does not decrypt phones, emails, or messages.
- Break-glass uses a **short-lived token** (hardware-backed or SSO step-up) stored and audited separately from DEKs.
- Every use emits an **immutable audit row** (see §10): who, when, which user id, which field classes, legal/ticket reference. No bulk export without a second control.
- **Group unlock tokens (§5.4)** and **Close client keys (§7)** are **out of break-glass by default:** founder does not read member-only group ciphertext unless a future policy explicitly adds a separate, logged legal path.

This aligns the Profile intro mandate with engineering: **you decide what you share with who**, enforced by KMS field encryption, tier keys, and E2E where shipped; break-glass is the narrow exception for Zone A platform data, never a silent backdoor.

---

## 9 · Key rotation runbook (operations)

Docs-only specification for when crypto ships.

### 9.1 Schedule

| Key material | Routine rotation | Emergency rotation |
|---|---|---|
| KMS CMK | Annual (or provider best practice) | Immediately on suspected CMK leak |
| Platform / tier / group DEKs | Quarterly, staggered by family | On DEK material exposure or Nest compromise |
| `phone_lookup_hmac_key` | Annual; dual-write HMAC column during cutover | On lookup key leak (forces re-hash job, not phone decrypt) |

### 9.2 Re-encrypt job shape

1. **Discover:** query rows where `key_version < current_version` for each DEK family (batched by `owner_id` or `id` range).
2. **Decrypt** with old wrapped DEK (in Nest worker, not in SQL).
3. **Re-encrypt** with new DEK version; write `key_id`, `key_version`, ciphertext in one transaction per row.
4. **Checkpoint** cursor in a job table (`crypto_reencrypt_jobs`) for resumability.
5. **Throttle** (max rows/minute) to protect Postgres and KMS quotas.
6. **Verify** canary rows (§10.1) after each batch.
7. **Retire** old DEK version in KMS only after job reports 100% for that family (plus backup retention window if legal requires).

### 9.3 Retiring old key versions

- Old wrapped DEKs are **disabled** in KMS (not deleted) for a short quarantine (e.g. 7 days) then **scheduled deletion**.
- Backups taken **before** retirement remain ciphertext-only; without the retired DEK they are permanently unreadable.
- Runbook owner: infra + security review sign-off before `ScheduleKeyDeletion`.

---

## 10 · Canary attributes and decrypt audit log

### 10.1 Canary attributes

- In each environment, maintain **synthetic canary rows** (fake users) with known plaintext for each DEK family: one phone, one email, one `attributes` row per tier, one `scrapbook_elements` caption, one `media` object, one message ciphertext.
- Canary ids are listed in internal runbooks (not in this public doc).
- **After deploy, rotation, or re-encrypt batch:** automated check decrypts canaries and compares to expected plaintext; failure pages on-call.
- Canaries must never appear in Discover, suggestions, or analytics funnels.

### 10.2 Decrypt audit log (required for every unwrap)

Append-only table (or SIEM stream) **`crypto_decrypt_audit`** (name TBD in migration):

| Field | Purpose |
|---|---|
| `occurred_at` | UTC timestamp |
| `actor_type` | `nest_request` \| `break_glass` \| `reencrypt_worker` \| `canary_job` |
| `actor_id` | service principal, user id, or break-glass session id |
| `subject_user_id` | whose data was touched |
| `resource_type` | `user_contacts` \| `attributes` \| `messages` \| `media` \| `scrapbook_elements` \| … |
| `resource_id` | row uuid |
| `field_class` | enum (phone, email, message_body, tier_value, media_bytes, …) |
| `dek_family` | e.g. `tier_dek_close` |
| `key_version` | version used |
| `reason` | `api_read` \| `break_glass_ticket` \| `reencrypt` \| `canary` |
| `ticket_ref` | required for `break_glass` |

**Rules:** no decrypted bytes in the audit row; no full ciphertext dump; retention per legal hold policy; member-exportable summary is **TODO (legal)**.

---

## 11 · No plaintext in loadings or connection payloads (Nest + mobile)

Explicit checklist for code review when encryption ships. **Docs-only today.**

### 11.1 Nest API

- [ ] List/load endpoints (`GET /friends`, `/connections`, `/me`, thread list) return **opaque ids**, display names only where already public to viewer, and **no** phone, email, or decrypted attribute blobs in JSON.
- [ ] Connection accept/invite payloads never echo the other party's phone or email; merge uses server-side HMAC only.
- [ ] Error responses and validation messages never reflect submitted phone/email/message body.
- [ ] Serializers strip `text` on messages; clients receive `ciphertext` + crypto metadata only (until client decrypt).
- [ ] OpenAPI / admin export tools default to metadata columns; break-glass is a separate audited route.
- [ ] Request/response logging middleware allowlists fields; crypto and PII field names are denylisted.

### 11.2 Mobile (`apps/mobile`)

- [ ] React Query / loader caches store decrypted plaintext **in memory only**; no AsyncStorage of phones, emails, DM text, or tier-gated answers unless explicitly designed (Phase 2 key backup is a separate spec).
- [ ] Demo mode plaintext never written to production API or disk paths shared with live builds.
- [ ] Share extensions and deep links do not append contact fields to URLs.
- [ ] Analytics (`@bridger/shared` + `packages/ui`) never receives decrypted loader payloads (only ids and taxonomy outcomes).
- [ ] Connection UI shows names and avatars from tier-safe endpoints, not raw `user_contacts` rows.

---

## 12 · AI, embeddings, and models (no identity-labeled graph)

Encryption docs do not replace `AI-SYSTEM.md`; they reinforce it:

- **Embeddings and summaries** ingest only **scrubbed, opaque strings** from Zone B/C (normalized attribute text, quiz dimensions, person summary jobs). No names, phones, emails, handles, or message bodies.
- **No PII in model inputs.** The gateway PII firewall runs before any Anthropic/OpenAI call.
- **No identity-labeled social graph in model context:** matching and RAG use opaque user ids and de-identified facts; they do not receive labeled friend edges as names. Graph structure for matching stays in Nest arithmetic/pgvector over opaque ids (`MATCHING-ALGORITHMS.md`, `MACHINE-LEARNING.md`).
- Opt-out and delete cascades drop Zone C regardless of ciphertext state in Zone A.

---

## 13 · Hosting and operations alignment

| Concern | Where it lives |
|---|---|
| Ciphertext data | Supabase Postgres + Storage (backups encrypted at rest by provider; app-level ciphertext is still required). |
| KMS + DEKs | AWS KMS + Secrets Manager (`bridger/api/server` and **separate** lookup secret). See `INFRASTRUCTURE.md` and `infra/aws/README.md`. |
| Runtime decrypt | NestJS on App Runner only; service role to Supabase; no DEKs in mobile bundle. |
| Health checks | `GET /admin/integrations/health` may report **config present** for KMS and crypto secrets (key names only, never values). Public `GET /health` stays shallow. |

---

## 14 · Explicit non-goals (documentation passes)

- No production key cutover or rotation drill in live environments.
- No mass re-encrypt migration or dual-read cutover code.
- No TestFlight / EAS or client key distribution work.
- No change to RLS policies or schema in docs-only passes.

---

## 15 · Implementation checklist (future engineering)

- [ ] Split Secrets Manager entries: DEK envelope vs `phone_lookup_hmac_key` (separate secret or key with separate IAM).
- [ ] Column-level ciphertext + `key_id` + `key_version` on Phase 1 fields (§6).
- [ ] Nest crypto module: envelope encrypt/decrypt, no plaintext in logger middleware (§11).
- [ ] Friend find/merge uses HMAC column only in queries.
- [ ] Key rotation runbook automated: job shape in §9, retirement gated on re-encrypt completion.
- [ ] Canary suite + decrypt audit log (§10).
- [ ] Phase 1b tier and group DEKs wired to `visible_to_tier` and group membership; Storage bytes encrypted (§5.5).
- [ ] Phase 2 E2E message wire format + device key backup story documented in `complete/MESSAGES.md`.
- [ ] Break-glass audit + founder-only route behind step-up auth (§8).
- [ ] `docs/PRIVACY.md` and `PrivacyInfo.xcprivacy` updated when encryption ships to members.
- [ ] Admin integrations health entries for KMS/crypto secrets (config only).

---

## Changelog

| Date | Change |
|---|---|
| 2026-09-11 | Pass 1: breach-ready split-key architecture, Phases 1 / 1b / 2, AI boundaries, break-glass, non-goals. Docs only. |
| 2026-09-11 | Pass 2: attack scenarios, media ciphertext paths, rotation runbook, canary + decrypt audit, loader/payload checklist, table mapping. Docs only. |
