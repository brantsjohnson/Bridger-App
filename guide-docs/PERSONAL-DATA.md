# Personal Data and Personalize

How a member owns their information, and how they may later shape Bridger, without getting around someone else's privacy.

**The rule:** people can customize what Bridger does with data they are allowed to use. They cannot customize their way around someone else's privacy.

This doc wins on that boundary. `DATA.md` still wins on tables and zones. `PRIVACY.md` / `TERMS.md` stay the member-facing drafts. `MATCHING-ALGORITHMS.md` still wins on how the default matcher scores.

---

## What is already true

Do not rebuild these. Extend them.

| Idea in this doc | What Bridger already does |
|---|---|
| Who can see a fact | `visible_to_tier`: Close, Friends, Acquaintances, or `none` (not shown) |
| Permission to understand is not permission to show | `matchable` is a separate yes/no. A fact can be used for matching and still hidden from people. |
| Derived data can be deleted | Zone C embeddings and summaries rebuild from matchable facts and are purged on Discover opt-out or account delete |
| The person being found controls eligibility | Discover only uses facts that person marked matchable, inside Bridger's safety rules (block, age, FoF, discoverable) |
| The person searching can lean the weights | Close / Friends placements and connection-style prefs tune ranking. They do not widen who is eligible. |
| Bridger hosts the datastore | Supabase/Postgres with RLS. Members do not configure a database. |
| We do not train general models on member content | No member "use for training" switch. That permission is not offered. |

**Not built, and not part of the first cut:** device-only storage, a second display string per audience, friends-of-friends or public as visibility tiers, bring-your-own database, Solid Pods, custom matcher code, and third-party extensions.

---

## 1 · Four ideas on every fact

Keep these separate. One must not silently turn on another.

**A. The information.** The thing they actually said. Example: a favorite movie line.

**B. How Bridger may process it.** Today the only processing flag on a profile fact is `matchable` (Discover / overlap). Later flags, each independent:

- Private: do not process
- Matching
- Recommendations
- Search
- Personal AI (Billy, only if they opted in)
- Improve Bridger (product quality, not ads)
- Model training

Training stays **off and not offered**. "Improve Bridger" is not the same as product analytics, and neither one is permission to train a general model. See Terms §7.8a.

**C. Who can see it.** Today one stored value, one tier. Later, a member may keep a fuller line for Close friends and a shorter line for Friends, while matching still uses the original if they allowed that. Showing less is not the same as forbidding processing.

**D. Where it lives.**

| Layer | Meaning | When |
|---|---|---|
| Device only | Bridger's servers never receive it | Later. Not the first cut. |
| Personal Vault | The member's Bridger datastore. We host it. | Now. This is the default. |
| Bridger processing | Derived rows (embeddings, scores) built only from facts they allowed for that purpose | Now for matchable facts (Zone C) |
| Shared | What another person is allowed to see at their relationship | Now, via tier RLS |

---

## 2 · Your Bridger Vault

Members should not configure a database. The default name in the product is **Your Bridger Vault**. They fill it by using Bridger: about-me facts, friends, events, collage pages, and the derived rows those create.

**Now.** The vault is the existing owner-scoped tables (`attributes` and the other owner rows in `DATA.md`). Every profile fact already carries owner, value, visibility, matchable, and timestamps. RLS is the lock.

**Next, still on our Postgres.** A My Data screen where the member can see what Bridger holds, including derived rows, and export JSON or CSV. Each derived row should say what it came from, how it was made, and that it can be deleted and rebuilt. Embeddings are not permanent mystery artifacts.

**Later.** Manual custom fields (name, value, who can see it, use for matching). Then JSON/CSV import. Then a Bridger Data Adapter so someone can point at their own datastore through an authenticated interface. Bridger asks only for the fields that member authorized. Bridger never receives a database root key. Do not ask anyone to paste a Supabase service-role key. That key bypasses RLS and stays server-side only.

Do not build Solid Pods, arbitrary databases, or local-only vaults until there is demand. Those bring auth, schema, latency, deletion, and sync problems this cut does not need.

New information an extension collects later lives under that extension inside the vault. It does not become a normal profile fact until the member agrees to add it to Bridger.

---

## 3 · Matching

The Bridger matcher stays the default.

A future custom matcher may change **how eligible people are ranked**. It may not change **who may be inspected**.

```text
Custom weighting ("humor matters a lot")
        ↓
Bridger privacy and safety
  discoverable? allowed relationship? friend or friend-of-friend
  or shared group or event? fields they allowed for matching?
  block either way? restricted information?
        ↓
Only those people, only those features
        ↓
Custom weights
        ↓
Result
```

The person being discovered controls eligibility. The person searching controls weighting.

Custom code does not get `SELECT * FROM users`. It gets narrow capabilities, and sometimes only scores (`humor_similarity`, `activity_overlap`) so it can weight a result without reading the private answer.

Stranger discovery stays on Bridger's matcher. Custom matching, when it exists, starts inside contexts the member already has: friends, friends of friends, a shared group, a shared event, or another context both sides allowed. It does not open a search of arbitrary strangers.

---

## 4 · Personalize

Do not call this an app store. The name is **Personalize**: make Bridger yours.

**Now (this cut).** Settings → Personalize is a real screen. It says the ecosystem is not here yet, and it previews three lanes:

- **Matchers.** Find your people differently.
- **Social features.** Add new ways to spend time together.
- **Data and connections.** Choose what information Bridger can use for you.

That screen collects nothing. It does not install anything.

**Next.** Sliders on Bridger-approved matching dimensions, saved on the member's account, shareable with friends. Then an extension manifest and a sandbox. Then review tools and import.

**Much later.** Third-party developers, external databases, Solid, on-device models, member-chosen AI providers, federated instances.

An extension that only reweights approved capabilities can take a light review. Deeper review is required when it wants to collect something Bridger does not collect, infer a new sensitive category, widen who can see a fact, send data outside Bridger, keep its own copy, use health or belief or similar sensitive information, reach strangers, or act for the member (messages, invites, requests, payments).

Review looks at data, purpose, audience, duration, and destination together. "Location" alone is not a permission.

---

## 5 · Principles

1. Your identity is yours. Putting something in Bridger does not make it unrestricted Bridger property.
2. Sharing and processing are different.
3. Permission follows purpose. Matching is not advertising, research, or general training.
4. Algorithms do not override privacy. Weights change. Eligibility and permissions do not.
5. Extensions get capabilities, not the database.
6. New collection needs new scrutiny. One extension does not teach the whole platform.
7. Derived information counts. Embeddings, labels, and scores are personal data too.
8. Members can leave: export in a useful format, and hard delete.
9. Bridger secures the permission system. Members decide. Bridger enforces.
10. Personalization is not surveillance. Knowing someone well enough to help them is not the same as showing everyone else what the software knows.
