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
├── MATCHING-PSYCHOLOGY.md          ← quiz rules + how circles teach the matcher
├── FOUNDER-AGENTS.md               ← founder-only Grokbot org chart + ops agents (not Billy)
│
│   ── ACTIVE BUILD (still landing) ──
├── PROFILE.md
├── PROFILE-CUSTOMIZATION.md
├── AGENT.md
├── AGENT-SCOPE.md
├── ADMIN.md
├── CIRCLES.md                    ← Influencer Circles (docs / infra first)
├── VERSION-OF-ME.md              ← user-authored "what version of me" quiz
├── DELIGHT.md                    ← umbrella for optional delighters
│
├── complete/                     ← shipped + archived
│   ├── ONBOARDING.md
│   ├── HOME.md
│   ├── STORIES.md
│   ├── SCRAPBOOKS.md
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
│   └── MATCHING-ALGORITHMS.md
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
├── ux-design-thinking.mdc        ← every feature: visual-first UX gate
├── founder-agents.mdc            ← founder-only Grokbot; not Billy; not public
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
2. **The permanent contracts** relevant to your task — always `ARCHITECTURE.md`, `DATA.md`, `DESIGN.md` (incl. § Visual-first feature design), `TYPOGRAPHY.md` (any UI copy/size), `MAGIC-PATTERNS.md`; plus `INFRASTRUCTURE.md` for anything backend, `ANALYTICS-TAXONOMY.md` for anything with UI/events, `AI-SYSTEM.md`/`MACHINE-LEARNING.md` for anything AI.
3. **The feature doc(s)** for your task (active in root, or reference in `complete/`).
4. **The relevant `.cursor/rules/`** (they auto-apply, but read them). Especially `ux-design-thinking.mdc` before any new UI.
5. Only then plan. Prove Supabase RLS + hard-delete cascade before feature work (`.cursor/rules/guide-rules.mdc`). Pass the visual-first UX gate before calling UI done.

---

## 4 · The full registry

### 4.1 · Permanent contracts (root — never "complete")

| Doc | Status | What it governs |
|---|---|---|
| `INDEX.md` | [PERMANENT] | This map: structure, reading order, canonical decisions. |
| `INFRASTRUCTURE.md` | [PERMANENT] | Stack, hosting, secrets: Expo + Expo Router (iOS/Android/web), NestJS API on AWS App Runner, Supabase (Postgres/RLS/pgvector/Auth/Storage), server-side AI keys, CI/EAS. **No blockchain.** |
| `ARCHITECTURE.md` | [PERMANENT] | Repo layout, modules, routes; **all complex logic lives in Nest**, incl. matching. |
| `DATA.md` | [PERMANENT] | Schema, the three privacy **zones** (A=PII / B=de-identified-matchable / C=derived-AI), RLS policies, hard-delete cascades, export. The universal `attributes` row (`visibleToTier` + `matchable`). |
| `DESIGN.md` | [PERMANENT] | Visual system + **visual-first feature design gate**: eggshell canvas, pixel headers, flat surfaces, brand fit, personality, no redundant copy. Magic Patterns + 80/20 clean-to-retro. |
| `TYPOGRAPHY.md` | [PERMANENT] | Type token scale: body/input ≥ 16px, caption 13–14px secondary only, h1–h3 bands, line-height + measure by phone vs large. Hard floors when UI feels cramped. |
| `MAGIC-PATTERNS.md` | [PERMANENT] | The component-library contract + screen→doc map. **All UI comes from Magic Patterns (MCP-connected); never hand-roll UI.** |
| `ANALYTICS-TAXONOMY.md` | [PERMANENT] | The naming master sheet: `screen.section.element` registry, surfaces (sheets included), flows, **product events (fire on outcomes, not taps)**, dead-click catalog, renames-log. First-party, consented, de-identified, walled off from matching. |
| `NOTIFICATIONS.md` | [PERMANENT] | Alert-destination map (always-review): every notification kind, its route, and its preference scope. |
| `AI-SYSTEM.md` | [PERMANENT] | The AI gateway + PII firewall, the touchpoint registry (models/temps/tokens), the two lanes (`deidentified` / `personal_agent`), the in-house RAG engine, prompt/eval standards, operational machinery. Invisible-AI doctrine. |
| `MACHINE-LEARNING.md` | [PERMANENT] | Learning policy: the connection-outcomes objective (**never engagement**), the six-component feature dictionary, signal taxonomy, v1→v3 progression, loop hygiene, cold start, alive-not-creepy rules. |
| `MATCHING-PSYCHOLOGY.md` | [PERMANENT] | Founder map: what each Personality quiz looks for (same vs opposite vs style chart), how Close/Friends labels teach weights, embeddings, Nest-not-Edge. |
| `FOUNDER-AGENTS.md` | [PERMANENT] | Founder-only Grokbot (and similar) ops agents: talk + optional repo updates; private to founder; **not** Billy; not a member product surface. Also the living **company-of-agents org chart** (QA, Legal scan, PR, Eng, Finance, etc.), seat responsibilities, living memory, and release swarm. |
| `GROKBOT-BRIEF.md` | [PERMANENT] | Complete orientation for Grokbot when it enters Cursor / connects to the repo: full project scope, tabs, features, backend modules, data/AI/privacy model, build status, founder-only boundary, and pointer to the agent org chart. Summary of INDEX; INDEX still wins on conflict. |

### 4.2 · Active build (root — still landing)

| Doc | Status | What's left (high level) |
|---|---|---|
| `PROFILE.md` | [BUILDING] | The Spotify-artist profile layout. Header/tabs/scroll order + most modules there; Settings stubs, storage, some modules/polish, recap-play + customize entry, music still landing. |
| `PROFILE-CUSTOMIZATION.md` | [BUILDING] | Theme + Layout (no-code) mostly there; the **Code tier** (custom CSS + sanitized HTML subset, sandboxed WebView) and some co-op/storage edges still open. |
| `AGENT.md` | [BUILDING] | The assistant's rules/lane/gating/invariants. Billy UI (Widget/Island/Screen) + fill loop in progress; several act-tools still handoffs. |
| `AGENT-SCOPE.md` | [BUILDING] | The assistant capability catalog (fill loop, previews, triage, drafting, photo, activity log). Stays paired with `AGENT.md` until the whole assistant ships. |
| `ADMIN.md` | [BUILDING] | Operator console (separate repo). Exists in some form; doc/acceptance-criteria (plugins, marketing archive, assistant flags, integrations health) not finished. |
| `CIRCLES.md` | [BUILDING] | Influencer role + fan Circles (not friends). Tier-gated sharing, handles for off-app contact, no 1:1 Bridger DM, portal query, Event-to-Circle. Docs/schema only. |
| `VERSION-OF-ME.md` | [BUILDING] | User-authored "What version of {Name} are you?" quiz. Home TBD. Docs/schema only. |
| `DELIGHT.md` | [BUILDING] | Umbrella guide for optional delighters + library/backlog; emoji-bomb is the first built gift. Ideas stay open forever. |

### 4.3 · Complete / archived (`complete/` — shipped, reference only)

| Doc | Status | Feature |
|---|---|---|
| `complete/ONBOARDING.md` | [COMPLETE] | TestFlight stays on Old 19-step. New story onboarding is preview-only (`onboard`) and ends on join / invite, then Home congratulations splash. |
| `complete/HOME.md` | [COMPLETE] | Announcements carousel, stories row, responses, always-visible Touch Grass send, ask-the-group. |
| `complete/STORIES.md` | [COMPLETE] | Story player, the Catch-Up swipe-up (week-hero), responses, AI week summary (words-only). |
| `complete/SCRAPBOOKS.md` | [BUILDING] | Posting an Update as an 8.5 x 11 Collage page: two screens, layouts, camera roll, 1 to 4 pages a day, Only me, drafts, revisions. Supersedes the posting half of STORIES.md. Plan: `design-briefs/SCRAPBOOKS-PHASE-PLAN.md`. |
| `complete/FRIENDS.md` | [COMPLETE] | Roster + tiers, add-friend, inside jokes, Friend Pod, private notes/reminders, report/block. |
| `complete/DISCOVER.md` | [COMPLETE] | The intro gate, overlap-first suggestions, Discover-Me modules, In-common, friends-of-friends basis. |
| `complete/REVEAL.md` | [COMPLETE] | The connection reveal: beat-0 (how-you-met + tier) gates overlap; orbs → also-got → profile. |
| `complete/EVENTS.md` | [COMPLETE] | Event detail/host, cover, co-host, chip-in, assignments, native share, going/to-meet counts, touch-grass. **2026-09-09 changelog:** host notes, scheduled reminders, shared album save/expiry/quota (not shipped). |
| `complete/MESSAGES.md` | [COMPLETE] | Threads, contact-card share, make-a-plan, the 5/day message cap. |
| `complete/RECAP-PODCAST.md` | [COMPLETE] | The weekly recap recorder + stitched podcast player (5 questions). **2026-09-09 changelog:** Monday self-lock; co-op can open earlier locked weeks; this week stays free. |
| `complete/COOP.md` | [COMPLETE] | Two tiers: Join the co-op ($6/mo or $60/yr) or Free Lite (5 Close / 30 Friends, 30-day storage, no ads). |
| `complete/COOP-PAYMENTS-SETUP.md` | [ACTIVE] | Dashboard + prod secrets checklist: RevenueCat webhook, store SKUs, Stripe live, EAS device build. |
| `complete/COOP-PORTAL.md` | [COMPLETE] | The multi-page portal: mission, model, ideas, vote, transparent economics/cost. |
| `complete/ASSISTANT-ACCESS-WIDEN.md` | [COMPLETE] | The ops rollout checklist for widening assistant access (flag stages). |
| `complete/TOUCHGRASS-AND-QUIZ.md` | [COMPLETE] | Touch-grass send (Events) + Home answer cards + quiz take/share/who-got-who. |
| `complete/QUIZ-ENGINE.md` | [COMPLETE] | Deterministic scorer + server moderator; internal quiz ids (personality/values/humor); fun quizzes = same engine. |
| `complete/PROFILE-MODULES.md` | [COMPLETE] | The canonical question bank: all 14 modules, hobby follow-ups, the two closing consents. |
| `complete/MATCHING-ALGORITHMS.md` | [COMPLETE] | Nest matching: discover-refresh / bridge-suggest / event-suggest / pair-overlap; six-feature v1; per-shared-quiz gating. |

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

### 4.7 · Designer briefs (`design-briefs/` — hand to a design agent)

| Doc | Status | Role |
|---|---|---|
| `design-briefs/NEW-ONBOARDING-UX-DESIGN-BRIEF.md` | [ACTIVE] | Visual / motion pass for New Onboarding only. TestFlight stays on Old. Copy-paste prompt is at the top of the file. |
| `design-briefs/FOLDABLE-DUO-ADAPTIVE-DESIGN-BRIEF.md` | [ACTIVE] | Big-screen + foldable (iPhone Duo) adaptive layout. Phase 0 shipped: centered comfortable column on web/large via `packages/ui/src/layout/responsive.ts` (used by `Screen` + `FloatingTabBar`). Plans two-column master/detail, side nav rail, posture-aware content. |

### 4.6 · Cursor rules (`.cursor/rules/` — outside guide-docs, auto-applied)

| Rule | Status | Role |
|---|---|---|
| `guide-rules.mdc` | [RULE] | Standing build rules: stack, no-blockchain, UI-from-Magic-Patterns, UX visual-first reminder, accessibility + app-store from day one, plain-language comments, privacy invariants, definition of done, doc-authority order, living PRIVACY/TERMS. |
| `ux-design-thinking.mdc` | [RULE] | Every new/changed feature: act as UX designer first. Visual appeal, brand fit, personality, sound layout, no redundant/duplicated copy. Required gate before UI is "done." |
| `founder-agents.mdc` | [RULE] | Founder-only Grokbot / ops agents may help manage this repo; never a public or member surface; not Billy; same standing build rules when they edit code. |
| `naming-rules-mdc.mdc` | [RULE] | Unique `screen.section.element` IDs; reused-not-prefixed; sheets are surfaces; product events ≠ clicks; the naming/measurement standard. |
| `analytics-enforcement-mdc.mdc` | [RULE] | The conformance gate run before any UI/interaction/outcome code is "done"; PostHog binding; first-party/consented/de-identified/deletable. |
| `follow-magic-pattern-ui-designs.mdc` | [RULE] | Always build UI from the Magic Patterns components/designs, ported to React. |
| `admin-integrations-health.mdc` | [RULE] | Any new outbound Nest integration must register a non-secret check on `GET /admin/integrations/health` in the same change. |
| `aws-agent-rules.mdc` | [RULE] | AWS guidance: prefer IaC + AWS MCP, secret-safety, no em dashes in resource names. |

---

## 5 · Feature build order (for net-new work)

Foundations (permanent contracts) → onboarding → profile + modules → friends/tiers → home → stories → discover/reveal/matching → events → messages → co-op → recap → assistant → admin → delight library. Most of the early chain is already in `complete/`; the current front is **profile redesign + customization + assistant + admin + delight (emoji-bomb + open backlog)**.

Parallel tracks after that (docs landed 2026-09-09; code later): **1.** Events host notes + album save/retention/quota · **2.** Version-of-me data + take/share (home TBD) · **3.** Circles (payments + portal + overlap) last, because it needs the most legal weight.

---

## 6 · Canonical decisions (these win on any conflict)

**Architecture & infra**
- **No blockchain.** User data control = Postgres RLS + hard-delete cascades + export, not immutability.
- **All complex logic runs in the Nest API**, not Supabase Edge Functions (`ARCHITECTURE.md` authoritative).
- **All UI comes from the Magic Patterns library** (MCP-connected); never hand-roll UI.
- **Every new feature is designed visual-first.** Act as a UX designer before wiring: appealing visuals, brand fit (`DESIGN.md`), Bridger personality, sound layout infrastructure, simple copy with no redundancy or duplication. "It works" without that gate is not done (`.cursor/rules/ux-design-thinking.mdc`).
- **Tabs stay built.** After sign-in, pill tabs keep their last painted layout in memory (and a last-seen snapshot on the phone). Switching tabs does not rebuild from empty. Background refresh updates what changed. Sign-out / leave demo clears the snapshot.
- **Founder-only agents (Grokbot)** may chat with the founder and help update this software. Access is private to the founder only. Not Billy, not a member-facing product. Roles (QA, Legal scan, PR, Eng, Finance, and the rest) live as an org chart in `FOUNDER-AGENTS.md` so one bot can wear a hat or seats can split later with the same scope and living memory.

**Privacy & data**
- **Split the person from the facts:** Zone A = PII, Zone B = de-identified matchable, Zone C = derived/AI. Matching/AI operate on B/C via opaque IDs.
- **Delete means delete** — hard-delete cascades across DB, embeddings, summaries, third-party processors (incl. the PostHog person).
- **Two independent per-attribute consents:** `visibleToTier` (who sees it) and `matchable` (may Discover use it). A field can be friend-visible but not matchable. **Identity/beliefs are never bulk-matchable.**
- **No vanity metrics anywhere** (no follower counts, no public totals). Allowed **private owner-only** numbers: host headcount vs cap; Influencer **private** Circle size in their own portal; author-only "friends who finished" on a version-of-me quiz. Never show those totals on profiles, Home, or public share cards.
- **Capture-only media** except: the profile photo; Collage camera-roll picks; the event cover; **event album uploads** (guest camera or roll for that event only).
- **Circles are not friends.** `circle_edges` is a separate connection class. It does not consume Close/Friends caps and is not a Discover FoF bridge. Fan picks a visibility tier (acquaintance / friend / close) that gates what that Influencer may see. Fan can pause or disconnect in Settings.
- **Influencer SKU** is a paid role, distinct from co-op membership and Billy+. Fans never pay to add an Influencer (connection stays ungated).
- **No Influencer → fan 1:1 Bridger DM.** Off-platform handles (IG / TikTok / etc.) are collected at connect so the Influencer can reach them there. In-Bridger group path is an Event to the Circle (plus host notes on that event).
- **Version-of-me quizzes** are user-authored UGC in `user_quizzes`, not admin `quiz_registry` and not Discover measurement. They never feed matching. UI home is TBD (`VERSION-OF-ME.md`). No public leaderboard.
- **Event album** is a shared, event-scoped pool (quota + optional host-paid add-on), not personal `plan_state.storage`. Unsaved album access expires 7 days after the event end. Save-to-device Photos is add-only.

**Matching & quizzes**
- **Matching runs in Nest** (`apps/api/src/matching/`); one shared scorer core wrapped as `discover-refresh` (cron/worker + endpoint), `bridge-suggest`, `event-suggest`, `pair-overlap`.
- **v1 scores with all six feature-dictionary components live day one**; a component contributes **0 when a pair lacks its data** (zero-by-absence), never a config phase.
- **Pre-connection suggestion pool = attributes with `visibility = Everyone` AND `matchable = true`;** Friends/Close-tier fields feed only the post-connection overlap engine under beat-0 tier gating.
- **Quiz matching is per shared quiz** (both completed, compatible versions). Discover quiz **internal ids** `personality`/`values`/`humor`/`attachment`; user-facing titles are marketing names; matching/analytics use internal ids only. Humor and values = similarity. Assertiveness = complementarity (opposites). Attachment = style matrix. Neuroticism is never a match gate. Dictionary: `packages/shared/src/model/quiz-match.ts` + `MATCHING-PSYCHOLOGY.md`.
- **Friend circles teach the matcher.** Close is the gold label; Friends is a real (weaker) label; We just met → Acquaintances is not a style label. Nightly Nest learns new `matching_config` weights from `matching_feedback`. Live flip waits for enough Close labels. Not Edge Functions.
- **Your Vibe (`personality`)** measures sociability, assertiveness, agreeableness, conscientiousness, openness, neuroticism. Matching: agreeableness = similarity; assertiveness = complementarity; sociability/conscientiousness/openness = mild similarity; neuroticism = never a match gate. Disclosure (keys + impact only) rides along for preference-vs-capacity confidence.
- **The Friend Zone (`attachment`)** measures continuous anxiety + avoidance (friendship-worded), derives secure/anxious/avoidant/fearful. Matching uses a hand-authored **style matrix** (secure works widely; anxious+avoidant is the classic trap) — not similarity or complementarity. SES is interpretive only.
- **What Gets You Going (`values`)** is the load-bearing similarity quiz: 30 forced-choice Schwartz-inspired items → adventure↔stability, giving↔striving, hedonism dials. Loyalty/honesty norms are a later friendship add-on (separate scores). Politics-word-free.
- **"Fun"/BuzzFeed quizzes use the same QUIZ-ENGINE** (rubric + moderator); no separate path. **Version-of-me** is the exception: user-authored, simplified version-weights only, no Discover dims, no matching (`VERSION-OF-ME.md`).
- **Which J name first result is durable.** The first finish writes `jname_results` and is what friends, compatibility, share links, Home, and Profile use. Later "retake for fun" runs stay on-device only and never overwrite matching. After Home rotates the featured quiz, Profile still shows **See your result**.
- **J-name share links are a no-account take.** A friend can open `/q/<token>`, finish the quiz without a Bridger account, then make an account (or add the sharer). Signup uploads the first result and adds the friendship so both can see the duo result. The invite URL is visible on the result and Profile (copy / preview), not share-sheet-only.
- **Circle commonalities** reuse Mode 2 pair-overlap with Circle-edge eligibility + the fan's `visibility_tier` (not friendship beat-0). Circle edges are not FoF bridges.
- **Deterministic rubric sets the score; the AI moderator moderates/adapts but never sets a score.** AI adapts only below each quiz's `adaptBelowConfidence` floor (disclosure = off).
- **Evidence gate:** below threshold, Discover returns FEW/ZERO — never desperate backfill.
- **Connection is never gated** (answering polls is free; creating requires co-op). Connecting never costs. Adding a friend is never blocked on quizzes or a filled profile.
- **Behind the Scenes (`disclosure`) is archived from the live Discover list.** Code, tables, and analytics IDs stay. The Discover strip is **Personality quizzes** (route / analytics `connect_over`): Your Funny Bone, What Gets You Going, Your Vibe, The Friend Zone.
- **Post-connection overlap is one-way (asymmetric).** Each person sees what the *other* labeled for the circle they put this viewer in. We just met = Acquaintances = acquaintance-visible facts (the Everyone layer). Friends / Close friends unlock more only on the side that granted that circle. If they put you as Friends and you put them as Acquaintances, you may see their Friends-labeled facts; they only see your Acquaintance-labeled facts. Thin overlap never invents filler: reveal + In common show a Personality quizzes CTA.
- **Circle caps:** Free Lite is **5 Close / 30 Friends / unlimited Acquaintances**. Co-op is **25 Close / 125 Friends / unlimited Acquaintances**, plus named groups. Hitting a cap never blocks the connection (they land in Acquaintances). Host extras (co-hosts, allergies, assignments) and guest cap 100 are co-op; hosting itself is free up to 35.

**AI, ML & the agent**
- **AI is invisible & firewalled:** all model calls route through the PII-scrubbing gateway (opaque IDs, no content/media on the deidentified lane); foundation models are **never trained/fine-tuned on user data** (RAG + our own small ranking models instead).
- **ML optimizes real-world connection outcomes, never engagement/time-in-app.** The UX-analytics store is walled off from all learning.
- **The assistant is the one opt-in exception to invisible AI:** off by default (admin flag ships `founder_only`), hidden from anyone who hasn't enabled it; runs on a separate single-user `personal_agent` lane where it sees only the requester's **own** visible data (assembled through the app's own permission layer), never another user's data, never training, never acting without an explicit confirm.
- **The agent drafts; the user disposes.** No autonomous sends. **Scheduled sends** are allowed but the user approves the **full draft + exact send time** before it queues. **Messages are in-Bridger only — never phone/iMessage.**
- **Style-aware drafting** is on by default (with a toggle), learned only from the user's own Bridger messages as a **style profile (how you write), not a content log.**
- **The agent reads playbooks (procedure), never writes them.** Playbooks are human-authored, versioned, PII-free, and updated in the same commit as the flow. Playbooks are procedure; the app's data is memory; the two never mix.

**Onboarding / first-open**
- **Welcome CRT reading hold:** after each typed first-open screen finishes, Next appears with a 5-second progress fill. Tap Next or wait. Typing itself is not skippable. Reduce Motion shows Next with no auto-advance.
- **New onboarding ends on join / invite**, then Home. Congratulations is a splash over Home, not a last onboarding page.
- **New onboarding look:** rounded cards, no outlines on fields or pick rows, pink Continue (not the gray Windows CTA), one arrow on the button, square progress bar only. Comic / Sepia / X-ray keep the on-device "not AI" badge. Help-pick emoji showers do not block scroll.

**Analytics**
- **First-party, consented, de-identified, walled off** from matching/ML; deletable.
- **Product events fire on confirmed outcomes, never on the tap that begins them.**
- **Everything named from scratch:** `screen.section.element`, reused-not-prefixed; sheets/overlays are their own surfaces.

**Messages**
- **Share contact** posts your contact card (the fields you chose). It is not a raw "share my number" shortcut, and it does not burn a daily slot.
- **No Make a plan in a thread.** Plans live on Events / Touch Grass. That button does not belong in Messages.
- **Double-tap a friend's bubble to heart it.** A heart is a reaction, not a sent message, and never counts against the 5/day cap. No heart counts (no vanity metrics).

**Friend Pod**
- **The weekly recap self-locks each Monday (UTC).** If admin already made a week live for that Monday, that week wins. If not: rose / thorn / bud, then the two most-voted unused suggested questions, then short fill-ins (AI on the worker, canned bank when someone opens Friend Pod so a tap never waits on a model). Friends vote all week for next Monday's extras. Sharing a recap still picks **Close / Friends / Acquaintances**.
- **This week's listen is free. Earlier locked weeks are a co-op perk.** Free Lite sees an Earlier weeks chip that opens join. The week list is tier-filtered (no empty teasers, no voice counts). Suggest / vote stays on the live week.

**Inside Jokes**
- **Composer is full-screen** (close with X). Type on the **square** sticky note, pick its color, search a friend who said it, optionally search an event. Do not dump every friend or event as chips.
- **Text posting stays free.** One photo on the note is a **co-op** perk (camera or one picked roll item, asked in context). After a photo is on the note, the note slowly flips quote ↔ photo.
- **A posted note is newest on Friends** and appears on the poster's Profile wall and the tagged person's wall.

**User-facing vs internal names**
- **Updates** (not stories) · **Inside Jokes** (not quips) · **Touch Grass** · **The Catch-Up** · **Co-op** · **Circles** (not follows / followers) · **Influencer** (paid role). Never surface internal module names in UI copy; never rename DB tables to chase UI copy.

---

## 7 · Keeping this INDEX from going stale (maintenance rules)

An earlier INDEX rotted because docs moved and it didn't. Rules to prevent that:

- **When a doc moves to `complete/`,** update its path here **and** flip its status to [COMPLETE] in the same commit. A move without an INDEX update is an incomplete commit.
- **When a flow changes,** update its feature doc AND (if it's an agent flow) its playbook AND the taxonomy — same commit (the discipline the renames-log already proves).
- **When a decision is made that overrides a doc,** add it to §6 canonical decisions — that list, not the prose in a feature doc, is what future sessions trust on conflict.
- **When a new doc is created,** add a registry row (§4.x) with path + one-line role + status.
- **Deletions** get a one-line note here so a stale reference is explainable, not mysterious.

*Last rebuilt: 2026-09-10. Canonical + rules: visual-first UX gate; founder-only Grokbot ops agents + company-of-agents org chart (`FOUNDER-AGENTS.md`, not Billy, private to founder); tabs stay built from a last-seen snapshot. 2026-09-09: Circles, Version-of-me, and Event host-notes/album contracts added (docs only). 2026-08-07: DELIGHT.md returned to active build as the umbrella guide for optional delighters (not archived).*
