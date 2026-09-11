# Bridger — Encryption and access (breach-ready architecture)

> **WHAT THIS FILE IS:** the permanent contract for how Bridger protects Zone A and sensitive content at rest, who can decrypt what, and how keys are stored so a single breach (database dump, one vault, or one laptop) is not enough to read member PII or message bodies.
>
> **STATUS:** Pass 1 (docs only, September 2026). Describes the target architecture and rollout phases. Implementation, production key cutover, and mass re-encrypt migrations are **explicitly out of scope** for this pass.
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

Nest is the only runtime that orchestrates decrypt for server-side features (Phase 1). Phase 2 moves Close-tier and DM plaintext off the server for members who opt into true E2E (see §6).

---

## 2 · Key hierarchy (conceptual)

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
- **Rotation:** new DEK version encrypts new writes; background re-encrypt (future migration pass) retires old versions so **old dumps die** when keys rotate even if a backup leaks later.
- **Logs, analytics, connection payloads:** never carry plaintext Zone A or message bodies; only opaque ids, enums, and taxonomy-safe outcomes (see `ANALYTICS-TAXONOMY.md`).

Current env names in `INFRASTRUCTURE.md` (`EMAIL_HMAC_KEY`, `EMAIL_ENCRYPTION_KEY`) are **legacy portal stubs**; this doc supersedes their shape for the full Bridger rollout (phones, emails, messages, tiers). Cutover is a later engineering pass.

---

## 3 · Phase 1 — platform PII and messages at rest (server-held keys)

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

**Key rotation (Phase 1):**

- Rotate DEKs on a defined schedule and on incident; re-encrypt jobs (future) rewrite columns with new `key_version` so stolen **old** backups remain useless after rotation.

**Plaintext forbidden surfaces:**

- Application logs, load balancers, error trackers, PostHog, admin JSON exports, and **connection API payloads** that echo contact fields must not include decryptable PII or message text.
- Support and admin consoles show **metadata only** (user id, timestamps, tier) unless break-glass (§7).

**Non-goals for pass 1 (docs):** no production key cutover, no schema migration, no mass re-encrypt job shipped.

---

## 4 · Phase 1b — tier DEKs, custom groups, and group shares

Profile attributes today use RLS and `visible_to_tier` (`DATA.md`). Phase 1b adds **cryptographic tier boundaries** on top of RLS (defense in depth if RLS or API regresses).

### 4.1 Per-tier DEKs for profile attributes

- Each `attributes` row (and analogous profile modules) carries ciphertext encrypted under the DEK for its `visible_to_tier`: **Close**, **Friend**, **Acquaintance**, and **public-share** (intentionally exportable or wide-audience slices).
- Nest decrypts only the tiers the **viewer's relationship** allows, same as RLS intent.
- Changing tier on a field re-encrypts under the new tier DEK.

### 4.2 Custom groups as first-class crypto tiers

- Named co-op **groups** are not only RLS labels: each group gets a **`custom_group_dek_<group_id>`** used for attributes and content tagged to that group.
- Membership grants the client/API the ability to unwrap that DEK for reads; non-members see opaque ciphertext or omitted fields.

### 4.3 Group content shares (text / voice / photo / video)

- Co-op group shares use a **`group_share_dek_<group_id>`** (may coincide with group DEK or a child DEK per share thread; engineering chooses one envelope pattern and documents it in a later ADR).
- Media bytes in Storage may be encrypted with the same DEK or a per-object key wrapped by it.

### 4.4 Members-only unlock tokens

- For group-gated material, non-members (including **founder / ops by default**) receive **opaque unlock tokens**: ciphertext or wrapped key material useless without membership.
- Unlock tokens are **not** admin backdoors; they exist so clients can prove membership without exposing the DEK in API responses to outsiders.

---

## 5 · AI, embeddings, and models (no identity-labeled graph)

Encryption docs do not replace `AI-SYSTEM.md`; they reinforce it:

- **Embeddings and summaries** ingest only **scrubbed, opaque strings** from Zone B/C (normalized attribute text, quiz dimensions, person summary jobs). No names, phones, emails, handles, or message bodies.
- **No PII in model inputs.** The gateway PII firewall runs before any Anthropic/OpenAI call.
- **No identity-labeled social graph in model context:** matching and RAG use opaque user ids and de-identified facts; they do not receive "Alice is friends with Bob" as labeled nodes. Graph structure for matching stays in Nest arithmetic/pgvector over opaque ids (`MATCHING-ALGORITHMS.md`, `MACHINE-LEARNING.md`).
- Opt-out and delete cascades drop Zone C regardless of ciphertext state in Zone A.

---

## 6 · Phase 2 — client-held Close keys, true E2E DMs, blind in-common, location

Phase 2 is **documented now, built later.** It satisfies the long-term `complete/MESSAGES.md` contract (Nest never sees DM plaintext) and strengthens Close-tier promises.

| Capability | Target behavior |
|---|---|
| **Client-held Close keys** | Close-tier profile material can be encrypted so the server holds only ciphertext; unlock requires device keys or member-granted wraps. |
| **True E2E DMs** | Encrypt on sender device before upload; decrypt only on participants' devices. Nest routes ciphertext and handshake metadata only. |
| **Blind in-common (PSI-style)** | Shared-interest overlap without revealing full attribute sets to the server or to the other party's raw profile. |
| **Location for AI (unlinkable store)** | "How you met" and coarse location for future AI features live in a **separate store** with **pairwise opaque ids**, not joinable to global user id in model pipelines. Zone A rules in `DATA.md` still apply for product display; model inputs stay scrubbed. |

Phase 1 server-side encryption **does not** block Phase 2: message tables should store versioned ciphertext blobs and key ids from day one so clients can take over wrapping later.

---

## 7 · Founder break-glass (Zone A only, logged)

Some incidents (account recovery, legal process, abuse investigations on metadata) may require **limited** decryption of Zone A fields by a **founder break-glass** path.

**Principles:**

- Break-glass is **not** daily admin access. Normal admin (`ADMIN.md`) does not decrypt phones, emails, or messages.
- Break-glass uses a **short-lived token** (hardware-backed or SSO step-up) stored and audited separately from DEKs.
- Every use emits an **immutable audit row**: who, when, which user id, which field classes, legal/ticket reference. No bulk export without a second control.
- **Group unlock tokens (§4.4)** and **Close client keys (§6)** are **out of break-glass by default:** founder does not read member-only group ciphertext unless a future policy explicitly adds a separate, logged legal path.

This aligns the Profile intro mandate with engineering: **you decide what you share with who**, enforced by KMS field encryption, tier keys, and E2E where shipped; break-glass is the narrow exception for Zone A platform data, never a silent backdoor.

---

## 8 · Hosting and operations alignment

| Concern | Where it lives |
|---|---|
| Ciphertext data | Supabase Postgres + Storage (backups encrypted at rest by provider; app-level ciphertext is still required). |
| KMS + DEKs | AWS KMS + Secrets Manager (`bridger/api/server` and **separate** lookup secret). See `INFRASTRUCTURE.md` and `infra/aws/README.md`. |
| Runtime decrypt | NestJS on App Runner only; service role to Supabase; no DEKs in mobile bundle. |
| Health checks | `GET /admin/integrations/health` may report **config present** for KMS and crypto secrets (key names only, never values). Public `GET /health` stays shallow. |

---

## 9 · Explicit non-goals (this documentation pass)

- No production key cutover or rotation drill in live environments.
- No mass re-encrypt migration or dual-read cutover code.
- No TestFlight / EAS or client key distribution work.
- No change to RLS policies or schema in this pass (docs only).

---

## 10 · Implementation checklist (future passes)

Use this as the engineering acceptance list when implementation starts:

- [ ] Split Secrets Manager entries: DEK envelope vs `phone_lookup_hmac_key` (separate secret or key with separate IAM).
- [ ] Column-level ciphertext + `key_id` + `key_version` on Phase 1 fields.
- [ ] Nest crypto module: envelope encrypt/decrypt, no plaintext in logger middleware.
- [ ] Friend find/merge uses HMAC column only in queries.
- [ ] Key rotation runbook + re-encrypt worker (staggered; old dumps die).
- [ ] Phase 1b tier and group DEKs wired to `visible_to_tier` and group membership.
- [ ] Phase 2 E2E message wire format + device key backup story documented in `complete/MESSAGES.md`.
- [ ] Break-glass audit table + founder-only route behind step-up auth.
- [ ] `docs/PRIVACY.md` and `PrivacyInfo.xcprivacy` updated when encryption ships to members.
- [ ] Admin integrations health entries for KMS/crypto secrets (config only).

---

## Changelog

| Date | Change |
|---|---|
| 2026-09-11 | Pass 1: breach-ready split-key architecture, Phases 1 / 1b / 2, AI boundaries, break-glass, non-goals. Docs only. |
