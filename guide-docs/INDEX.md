# INDEX.md — The Bridger guide-docs map

The master map of every spec in `guide-docs/`. **Read this first, every session.** It tells you where each doc lives, whether it's a living contract or a finished feature, what order to read in, and — most importantly — the **canonical decisions** that win whenever any doc, comment, or older text disagrees.

> **If two docs conflict:** the canonical decisions in §6 win first, then this INDEX, then the permanent contracts (§4.1), then the feature doc, then anything else. Never resolve a conflict by guessing — the answer is almost always written down here.

---

## 1 · How the folder is organized

Docs fall into four buckets, and **where a doc lives tells you its status:**

- **Root `guide-docs/`** holds two kinds of doc: **permanent contracts** (living rules that are never "done" — schema, design, infra, AI policy) and **active build docs** (features still landing).
- **`guide-docs/complete/`** holds **archived, shipped** feature docs. They're done and in the app. Treat as reference, not a build queue. Don't edit them to change behavior — if a shipped feature changes, the change is a new decision (log it in §6 and update the doc in place with a changelog note).
- **`guide-docs/playbooks/`** holds the agent's per-task operating manuals (see `playbooks/README.md`).
- **`guide-docs/docs/`** holds the living legal drafts (`PRIVACY.md`, `TERMS.md`).
- **Cursor rules live OUTSIDE this folder** in `.cursor/rules/` with `alwaysApply: true`. They're permanent and load automatically.

```
guide-docs/
├── INDEX.md                      ← you are here (permanent)
│
│   ── PERMANENT CONTRACTS (never "complete") ──
├── INFRASTRUCTURE.md
├── ARCHITECTURE.md
├── DATA.md
├── DESIGN.md
├── MAGIC-PATTERNS.md
├── ANALYTICS-TAXONOMY.md
├── NOTIFICATIONS.md
├── AI-SYSTEM.md
├── MACHINE-LEARNING.md
│
│   ── ACTIVE BUILD (still landing) ──
├── PROFILE.md
├── PROFILE-CUSTOMIZATION.md
├── AGENT.md
├── AGENT-SCOPE.md
├── ADMIN.md
│
├── complete/                     ← shipped + archived
│   ├── ONBOARDING.md
│   ├── HOME.md
│   ├── STORIES.md
│   ├── FRIENDS.md
│   ├── DISCOVER.md
│   ├── REVEAL.md
│   ├── EVENTS.md
│   ├── MESSAGES.md
│   ├── RECAP-PODCAST.md
│   ├── COOP.md
│   ├── COOP-PORTAL.md
│   ├── ASSISTANT-ACCESS-WIDEN.md
│   ├── TOUCHGRASS-AND-QUIZ.md
│   ├── QUIZ-ENGINE.md
│   ├── PROFILE-MODULES.md
│   ├── MATCHING-ALGORITHMS.md
│   └── DELIGHT.md
│
├── playbooks/                    ← agent operating manuals
│   ├── README.md
│   ├── event-creation.md
│   ├── friend-questions.md
│   ├── notes-and-dates.md
│   ├── profile-update.md
│   ├── notification-triage.md
│   ├── messages.md
│   ├── touch-grass.md
│   ├── reconnect.md
│   ├── quiz-voice.md
│   └── out-of-scope.md
│
└── docs/                         ← living legal drafts
    ├── PRIVACY.md
    └── TERMS.md

.cursor/rules/  (OUTSIDE guide-docs, alwaysApply: true)
├── guide-rules.mdc
├── naming-rules-mdc.mdc
├── analytics-enforcement-mdc.mdc
├── follow-magic-pattern-ui-designs.mdc
├── admin-integrations-health.mdc
└── aws-agent-rules.mdc
```

---

## 2 · Status legend

| Tag | Meaning |
|---|---|
| **[PERMANENT]** | A living contract. Never "complete." Changes are normal and expected. |
| **[BUILDING]** | Active feature doc; parts still landing. The current work. |
| **[COMPLETE]** | Shipped + archived in `complete/`. Reference only. |
| **[PLAYBOOK]** | Agent per-task manual in `playbooks/`. Read-only to the agent. |
| **[LEGAL]** | Living legal draft in `docs/`. |
| **[RULE]** | Cursor rule in `.cursor/rules/` (auto-applied, outside this folder). |

---

## 3 · Reading order for a new build session

1. **This INDEX** (map + §6 canonical decisions).
2. **The permanent contracts** relevant to your task — always `ARCHITECTURE.md`, `DATA.md`, `DESIGN.md`, `MAGIC-PATTERNS.md`; plus `INFRASTRUCTURE.md` for anything backend, `ANALYTICS-TAXONOMY.md` for anything with UI/events, `AI-SYSTEM.md`/`MACHINE-LEARNING.md` for anything AI.
3. **The feature doc(s)** for your task (active in root, or reference in `complete/`).
4. **The relevant `.cursor/rules/`** (they auto-apply, but read them).
5. Only then plan. Prove Supabase RLS + hard-delete cascade before feature work (`.cursor/rules/guide-rules.mdc`).

---

## 4 · The full registry

### 4.1 · Permanent contracts (root — never "complete")

| Doc | Status | What it governs |
|---|---|---|
| `INDEX.md` | [PERMANENT] | This map: structure, reading order, canonical decisions. |
| `INFRASTRUCTURE.md` | [PERMANENT] | Stack, hosting, secrets: Expo + Expo Router (iOS/Android/web), NestJS API on AWS App Runner, Supabase (Postgres/RLS/pgvector/Auth/Storage), server-side AI keys, CI/EAS. **No blockchain.** |
| `ARCHITECTURE.md` | [PERMANENT] | Repo layout, modules, routes; **all complex logic lives in Nest**, incl. matching. |
| `DATA.md` | [PERMANENT] | Schema, the three privacy **zones** (A=PII / B=de-identified-matchable / C=derived-AI), RLS policies, hard-delete cascades, export. The universal `attributes` row (`visibleToTier` + `matchable`). |
| `DESIGN.md` | [PERMANENT] | Visual system: eggshell canvas, pixel headers, flat surfaces (no gradients/shadows), colorful hobby blobs, drifting grid backdrop, motion behind prefers-reduced-motion. |
| `MAGIC-PATTERNS.md` | [PERMANENT] | The component-library contract + screen→doc map. **All UI comes from Magic Patterns (MCP-connected); never hand-roll UI.** |
| `ANALYTICS-TAXONOMY.md` | [PERMANENT] | The naming master sheet: `screen.section.element` registry, surfaces (sheets included), flows, **product events (fire on outcomes, not taps)**, dead-click catalog, renames-log. First-party, consented, de-identified, walled off from matching. |
| `NOTIFICATIONS.md` | [PERMANENT] | Alert-destination map (always-review): every notification kind, its route, and its preference scope. |
| `AI-SYSTEM.md` | [PERMANENT] | The AI gateway + PII firewall, the touchpoint registry (models/temps/tokens), the two lanes (`deidentified` / `personal_agent`), the in-house RAG engine, prompt/eval standards, operational machinery. Invisible-AI doctrine. |
| `MACHINE-LEARNING.md` | [PERMANENT] | Learning policy: the connection-outcomes objective (**never engagement**), the six-component feature dictionary, signal taxonomy, v1→v3 progression, loop hygiene, cold start, alive-not-creepy rules. |

### 4.2 · Active build (root — still landing)

| Doc | Status | What's left (high level) |
|---|---|---|
| `PROFILE.md` | [BUILDING] | The Spotify-artist profile layout. Header/tabs/scroll order + most modules there; Settings stubs, storage, some modules/polish, recap-play + customize entry, music still landing. |
| `PROFILE-CUSTOMIZATION.md` | [BUILDING] | Theme + Layout (no-code) mostly there; the **Code tier** (custom CSS + sanitized HTML subset, sandboxed WebView) and some co-op/storage edges still open. |
| `AGENT.md` | [BUILDING] | The assistant's rules/lane/gating/invariants. Bridge UI (Widget/Island/Screen) + fill loop in progress; several act-tools still handoffs. |
| `AGENT-SCOPE.md` | [BUILDING] | The assistant capability catalog (fill loop, previews, triage, drafting, photo, activity log). Stays paired with `AGENT.md` until the whole assistant ships. |
| `ADMIN.md` | [BUILDING] | Operator console (separate repo). Exists in some form; doc/acceptance-criteria (plugins, marketing archive, assistant flags, integrations health) not finished. |

### 4.3 · Complete / archived (`complete/` — shipped, reference only)

| Doc | Status | Feature |
|---|---|---|
| `complete/ONBOARDING.md` | [COMPLETE] | Welcome video → 9-step signup + one-question-at-a-time fill pattern. |
| `complete/HOME.md` | [COMPLETE] | Announcements carousel, stories row, responses, always-visible Touch Grass send, ask-the-group. |
| `complete/STORIES.md` | [COMPLETE] | Story player, the Catch-Up swipe-up (week-hero), responses, AI week summary (words-only). |
| `complete/FRIENDS.md` | [COMPLETE] | Roster + tiers, add-friend, inside jokes, Friend Pod, private notes/reminders, report/block. |
| `complete/DISCOVER.md` | [COMPLETE] | The intro gate, overlap-first suggestions, Discover-Me modules, In-common, friends-of-friends basis. |
| `complete/REVEAL.md` | [COMPLETE] | The connection reveal: beat-0 (how-you-met + tier) gates overlap; orbs → also-got → profile. |
| `complete/EVENTS.md` | [COMPLETE] | Event detail/host, cover, co-host, chip-in, assignments, native share, going/to-meet counts, touch-grass. |
| `complete/MESSAGES.md` | [COMPLETE] | Threads, contact-card share, make-a-plan, the 5/day message cap. |
| `complete/RECAP-PODCAST.md` | [COMPLETE] | The weekly recap recorder + stitched podcast player (5 questions). |
| `complete/COOP.md` | [COMPLETE] | The co-op membership + benefits surface (single annual membership). |
| `complete/COOP-PORTAL.md` | [COMPLETE] | The multi-page portal: mission, model, ideas, vote, transparent economics/cost. |
| `complete/ASSISTANT-ACCESS-WIDEN.md` | [COMPLETE] | The ops rollout checklist for widening assistant access (flag stages). |
| `complete/TOUCHGRASS-AND-QUIZ.md` | [COMPLETE] | Touch-grass send (Events) + Home answer cards + quiz take/share/who-got-who. |
| `complete/QUIZ-ENGINE.md` | [COMPLETE] | Deterministic scorer + server moderator; internal quiz ids (personality/values/humor); fun quizzes = same engine. |
| `complete/PROFILE-MODULES.md` | [COMPLETE] | The canonical question bank: all 14 modules, hobby follow-ups, the two closing consents. |
| `complete/MATCHING-ALGORITHMS.md` | [COMPLETE] | Nest matching: discover-refresh / bridge-suggest / event-suggest / pair-overlap; six-feature v1; per-shared-quiz gating. |
| `complete/DELIGHT.md` | [COMPLETE] | The isolated delight/gift plugin host + fail-safe + admin toggles. |

### 4.4 · Playbooks (`playbooks/` — agent operating manuals)

| Doc | Status | Handles |
|---|---|---|
| `playbooks/README.md` | [PLAYBOOK] | The standard shape + the rules: agent **reads** playbooks (only humans **write**), zero PII, same-commit-as-flow, versioned. |
| `playbooks/event-creation.md` | [PLAYBOOK] | The worked reference: making an event by voice/text. |
| `playbooks/friend-questions.md` | [PLAYBOOK] | Answering "what does X like?" from the person's own saved data. |
| `playbooks/notes-and-dates.md` | [PLAYBOOK] | Saving a note / date / reminder about a friend. |
| `playbooks/profile-update.md` | [PLAYBOOK] | Editing the person's own profile by voice/text. |
| `playbooks/notification-triage.md` | [PLAYBOOK] | One-item-at-a-time reply/react/skip/save/dismiss triage. |
| `playbooks/messages.md` | [PLAYBOOK] | Drafting / scheduling an in-Bridger message. |
| `playbooks/touch-grass.md` | [PLAYBOOK] | Sending a touch-grass signal by voice/text. |
| `playbooks/reconnect.md` | [PLAYBOOK] | Surfacing who's gone quiet and acting on it. |
| `playbooks/quiz-voice.md` | [PLAYBOOK] | Taking a quiz by voice with read-back. |
| `playbooks/out-of-scope.md` | [PLAYBOOK] | Declining anything outside the catalog with the nearest offer. |

### 4.5 · Legal (`docs/` — living drafts)

| Doc | Status | Role |
|---|---|---|
| `docs/PRIVACY.md` | [LEGAL] | Living privacy-policy draft; must track what's actually collected (zones, deletion, no-tracking, consented analytics). |
| `docs/TERMS.md` | [LEGAL] | Living terms/EULA draft; includes the UGC no-tolerance clause (App Store 1.2). |

### 4.6 · Cursor rules (`.cursor/rules/` — outside guide-docs, auto-applied)

| Rule | Status | Role |
|---|---|---|
| `guide-rules.mdc` | [RULE] | Standing build rules: stack, no-blockchain, UI-from-Magic-Patterns, accessibility + app-store from day one, plain-language comments, privacy invariants, definition of done, doc-authority order, living PRIVACY/TERMS. |
| `naming-rules-mdc.mdc` | [RULE] | Unique `screen.section.element` IDs; reused-not-prefixed; sheets are surfaces; product events ≠ clicks; the naming/measurement standard. |
| `analytics-enforcement-mdc.mdc` | [RULE] | The conformance gate run before any UI/interaction/outcome code is "done"; PostHog binding; first-party/consented/de-identified/deletable. |
| `follow-magic-pattern-ui-designs.mdc` | [RULE] | Always build UI from the Magic Patterns components/designs, ported to React. |
| `admin-integrations-health.mdc` | [RULE] | Any new outbound Nest integration must register a non-secret check on `GET /admin/integrations/health` in the same change. |
| `aws-agent-rules.mdc` | [RULE] | AWS guidance: prefer IaC + AWS MCP, secret-safety, no em dashes in resource names. |

---

## 5 · Feature build order (for net-new work)

Foundations (permanent contracts) → onboarding → profile + modules → friends/tiers → home → stories → discover/reveal/matching → events → messages → co-op → recap → assistant → admin/delight. Most of the early chain is already in `complete/`; the current front is **profile redesign + customization + assistant + admin**.

---

## 6 · Canonical decisions (these win on any conflict)

**Architecture & infra**
- **No blockchain.** User data control = Postgres RLS + hard-delete cascades + export, not immutability.
- **All complex logic runs in the Nest API**, not Supabase Edge Functions (`ARCHITECTURE.md` authoritative).
- **All UI comes from the Magic Patterns library** (MCP-connected); never hand-roll UI.

**Privacy & data**
- **Split the person from the facts:** Zone A = PII, Zone B = de-identified matchable, Zone C = derived/AI. Matching/AI operate on B/C via opaque IDs.
- **Delete means delete** — hard-delete cascades across DB, embeddings, summaries, third-party processors (incl. the PostHog person).
- **Two independent per-attribute consents:** `visibleToTier` (who sees it) and `matchable` (may Discover use it). A field can be friend-visible but not matchable. **Identity/beliefs are never bulk-matchable.**
- **No vanity metrics anywhere** (no follower counts, no public totals; host headcount vs cap is the one allowed number).
- **Capture-only media** except the one profile-photo upload exception.

**Matching & quizzes**
- **Matching runs in Nest** (`apps/api/src/matching/`); one shared scorer core wrapped as `discover-refresh` (cron/worker + endpoint), `bridge-suggest`, `event-suggest`, `pair-overlap`.
- **v1 scores with all six feature-dictionary components live day one**; a component contributes **0 when a pair lacks its data** (zero-by-absence), never a config phase.
- **Pre-connection suggestion pool = attributes with `visibility = Everyone` AND `matchable = true`;** Friends/Close-tier fields feed only the post-connection overlap engine under beat-0 tier gating.
- **Quiz matching is per shared quiz** (both completed, compatible versions). Discover quiz **internal ids** `personality`/`values`/`humor` (+addable); user-facing titles are marketing names; matching/analytics use internal ids only.
- **"Fun"/BuzzFeed quizzes use the same QUIZ-ENGINE** (rubric + moderator); no separate path.
- **Deterministic rubric sets the score; the AI moderator moderates/adapts but never sets a score.**
- **Evidence gate:** below threshold, Discover returns FEW/ZERO — never desperate backfill.
- **Connection is never gated** (answering polls is free; creating requires co-op). Connecting never costs.

**AI, ML & the agent**
- **AI is invisible & firewalled:** all model calls route through the PII-scrubbing gateway (opaque IDs, no content/media on the deidentified lane); foundation models are **never trained/fine-tuned on user data** (RAG + our own small ranking models instead).
- **ML optimizes real-world connection outcomes, never engagement/time-in-app.** The UX-analytics store is walled off from all learning.
- **The assistant is the one opt-in exception to invisible AI:** off by default (admin flag ships `founder_only`), hidden from anyone who hasn't enabled it; runs on a separate single-user `personal_agent` lane where it sees only the requester's **own** visible data (assembled through the app's own permission layer), never another user's data, never training, never acting without an explicit confirm.
- **The agent drafts; the user disposes.** No autonomous sends. **Scheduled sends** are allowed but the user approves the **full draft + exact send time** before it queues. **Messages are in-Bridger only — never phone/iMessage.**
- **Style-aware drafting** is on by default (with a toggle), learned only from the user's own Bridger messages as a **style profile (how you write), not a content log.**
- **The agent reads playbooks (procedure), never writes them.** Playbooks are human-authored, versioned, PII-free, and updated in the same commit as the flow. Playbooks are procedure; the app's data is memory; the two never mix.

**Analytics**
- **First-party, consented, de-identified, walled off** from matching/ML; deletable.
- **Product events fire on confirmed outcomes, never on the tap that begins them.**
- **Everything named from scratch:** `screen.section.element`, reused-not-prefixed; sheets/overlays are their own surfaces.

**User-facing vs internal names**
- **Updates** (not stories) · **Inside Jokes** (not quips) · **Touch Grass** · **The Catch-Up** · **Co-op**. Never surface internal module names in UI copy; never rename DB tables to chase UI copy.

---

## 7 · Keeping this INDEX from going stale (maintenance rules)

An earlier INDEX rotted because docs moved and it didn't. Rules to prevent that:

- **When a doc moves to `complete/`,** update its path here **and** flip its status to [COMPLETE] in the same commit. A move without an INDEX update is an incomplete commit.
- **When a flow changes,** update its feature doc AND (if it's an agent flow) its playbook AND the taxonomy — same commit (the discipline the renames-log already proves).
- **When a decision is made that overrides a doc,** add it to §6 canonical decisions — that list, not the prose in a feature doc, is what future sessions trust on conflict.
- **When a new doc is created,** add a registry row (§4.x) with path + one-line role + status.
- **Deletions** get a one-line note here so a stale reference is explainable, not mysterious.

*Last rebuilt: 2026-08-07 — reflects the `complete/` archive split, the five docs moved in (TOUCHGRASS-AND-QUIZ, QUIZ-ENGINE, PROFILE-MODULES, MATCHING-ALGORITHMS, DELIGHT), the profile redesign, the assistant + the ten playbooks now written, and the matching decision locks. Verified against the real repo: no `ANALYTICS-README.md` or `FIRST-PROMPT.md` exist; `.cursor/rules/` filenames corrected.*
