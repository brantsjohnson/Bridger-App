# GROKBOT-BRIEF.md: the complete orientation for Grokbot

Read this first when you (Grokbot) enter Cursor or connect to this repository. It is your single, detailed map of what Bridger is, what has been built, what is still being built, how the code is laid out, and the rules you must never break. When you need the finer print on any topic, this doc tells you exactly which other file to open.

This document is founder facing. You are a private, founder only tool (see `FOUNDER-AGENTS.md`). You are NOT "Billy," the opt in member assistant. Keep those two lanes separate at all times.

---

## 0 · How to behave in this repo (start here every time)

1. **Read `INDEX.md` first.** It is the master map of every spec, plus the "canonical decisions" in its §6 that win on any conflict. This brief summarizes it; INDEX is the source of truth.
2. **Follow the standing rules.** They live in `.cursor/rules/` and auto load every session. The big ones:
   - `guide-rules.mdc`: the stack is decided, UI comes from Magic Patterns, accessibility and app store rules from day one, plain language code comments, privacy invariants, definition of done, and the doc authority order.
   - `ux-design-thinking.mdc`: act as a UX designer before wiring any feature. Appealing, on brand, has personality, sound layout, simple non redundant copy. "It works" is not "it is done."
   - `founder-agents.mdc`: you are private to the founder, not Billy, not a member surface.
   - `naming-rules-mdc.mdc` and `analytics-enforcement-mdc.mdc`: every element, sheet, flow, and outcome is named and measured.
   - `follow-magic-pattern-ui-designs.mdc`, `admin-integrations-health.mdc`, `aws-agent-rules.mdc`.
3. **No em dashes in any copy you author** (UI strings, comments, docs, commit messages, chat). Use commas, colons, parentheses, or hyphenated phrases.
4. **Write plain language comments.** The founder is non technical and reads the code. Every file gets a header comment; every meaningful section gets a one line "what this does" in plain English, with technical terms in parentheses.
5. **When docs and code disagree, the docs in `guide-docs/` win.** When two docs disagree, follow the authority order: INDEX §6 canonical decisions, then INDEX, then permanent contracts, then the feature doc, then anything else. If it is ambiguous on privacy, payments, or permissions, stop and ask the founder.
6. **Keep the docs in lockstep with the code.** If you change behavior, update the matching feature doc, `ANALYTICS-TAXONOMY.md`, `NOTIFICATIONS.md`, and the legal drafts (`docs/PRIVACY.md` / `docs/TERMS.md`) in the same change.
7. **Never ship silently.** Push, production deploy, and secret rotation stay founder approved.

---

## 1 · What Bridger is (the product in one page)

Bridger is a friendship first social app. Its job is to help real people keep and deepen real friendships, and to make good new connections, without the vanity mechanics of mainstream social media.

**The problem it fights:** modern social apps optimize for time in app, follower counts, and public performance. Bridger optimizes for real world connection outcomes. That single choice drives almost every rule below.

**What makes Bridger different (the non negotiables):**
- **No vanity metrics anywhere.** No follower counts, no public view counts, no likes tally, no streaks, no leaderboards. The only numbers allowed are private and useful to the owner (for example, a host seeing headcount versus cap).
- **Privacy is structural, not a setting.** Every fact about a person is tagged twice: who may see it, and whether the matchmaker may use it. This is enforced in the database and the API, not just the UI.
- **Delete means delete.** Removing a field, a connection, or an account hard deletes it and its derived AI rows, and purges third party processors (including the PostHog analytics person). No soft delete.
- **AI is invisible and firewalled.** Models never see faces or raw PII, and are never trained on user content. The one opt in exception is the assistant, "Billy," which runs on a separate single user lane and only ever sees the requester's own data.
- **Capture first media.** Most media is captured live in the app (not uploaded from the camera roll). The few upload exceptions are explicit and listed in the privacy rules.
- **80/20 design.** Roughly 80 percent clean and modern, 20 percent retro personality (pixel headers, metallic buttons, a CRT intro, playful motion). All UI comes from the Magic Patterns component library, ported to React Native. Never hand roll a lookalike UI kit.

**Friendship tiers** are the backbone of visibility. Everyone you connect with sits in one of three circles: **Close**, **Friends**, or **Acquaintances**. What each person sees about you depends on the circle you put them in, and (importantly) it is asymmetric: each side sees only what the other side granted their circle.

---

## 2 · The one idea the whole codebase is built around

Everything reduces to a single type: a **fact about a person, tagged twice**. It lives in `packages/shared/src/model/profile-attribute.ts` and is imported by both the API (to enforce) and the app (to predict what to show).

```ts
export type Tier = 'close' | 'friend' | 'acquaintance' | 'none';
// 'none' = private but still matchable (a signal Discover can use, shown to no one)

export interface ProfileAttribute<T = unknown> {
  id: string;
  ownerId: string;
  key: string;              // e.g. "favorite_candy", "love_language"
  value: T;
  layer: 'essential' | 'profile' | 'connection';
  visibleToTier: Tier;      // TAG 1: the lowest circle that may see it
  matchable: boolean;       // TAG 2: may the matchmaker read it?
  updatedAt: string;
}
```

Two independent consents per fact: `visibleToTier` (who sees it) and `matchable` (may Discover use it). A field can be visible to friends but not matchable, or matchable but shown to no one. Identity and beliefs are never bulk matchable.

The pure logic that reads these tags lives in `packages/permissions/` (functions like `canView`, `visibleAttributes`, `matchableAttributes`). The API imports it to enforce; the app imports it to predict, so the UI never shows a control the server would reject.

---

## 3 · The tech stack (decided, do not re litigate)

Full detail in `INFRASTRUCTURE.md` and `ARCHITECTURE.md`. In short:

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| App (iOS + Android + web) | Expo (React Native) + Expo Router, one codebase for all three targets |
| API | NestJS (TypeScript), containerized, modular by domain |
| Database + vectors | Supabase: Postgres + Row Level Security (RLS) + pgvector |
| Auth | Supabase Auth: email + Google + Apple |
| Media | Supabase Storage (signed URLs, retention windows) |
| API hosting | AWS App Runner (container autoscale) |
| AI | Anthropic (summaries, quiz moderation) + OpenAI (embeddings), server side only |
| Payments | RevenueCat (iOS/Android co-op dues) + Stripe (web card) |
| Analytics | PostHog (first party product analytics, consented, de-identified) |
| IaC / CI | Terraform or AWS CDK, GitHub Actions + EAS |

**Hard lines:** no blockchain (data control is RLS + hard delete + export, not a ledger). All complex logic runs in the Nest API, never Supabase Edge Functions. All AI and DB service keys are server side only (AWS Secrets Manager); the client holds only the Supabase anon key and public config. Do not add a new database, hosting provider, state library, or major dependency without explicit founder approval.

---

## 4 · Repo layout (where everything lives)

```
bridger/
├── apps/
│   ├── mobile/      # the Expo app (iOS + Android + web): the tabs and every screen
│   ├── api/         # the NestJS backend: one module per domain
│   ├── admin/       # operator console (separate surface; talks to the same API)
│   └── site/        # marketing website + .well-known deep link files
├── packages/
│   ├── shared/      # types + the ProfileAttribute model + DTOs + analytics ids (source of truth)
│   ├── permissions/ # pure tier/visibility/matchable logic (imported by api AND mobile)
│   ├── ui/          # the Magic Patterns design system, ported (tokens, primitives, layout)
│   └── ai/          # shared AI helpers
├── infra/           # Supabase migrations, IaC, env templates
├── guide-docs/      # all the specs (this file lives here)
├── design/          # the Magic Patterns prototype import (reference, not app code)
├── coop/            # DEPRECATED orphan Express tree (ignore; real coop is in apps/api/src/coop)
└── scripts/, supabase/, turbo.json, pnpm-workspace.yaml
```

Key idea: `packages/shared` feeds everyone, `packages/permissions` is imported by both the API and the app (enforce plus predict), and the app only ever talks to the outside world through a typed API client (`apps/mobile/lib/api-client.ts`).

---

## 5 · The app: tabs and screens (`apps/mobile/app`)

Routing is file based (Expo Router): the folder structure is the navigation graph. The main shell uses a floating pill tab bar.

**The five pill tabs (visible nav):**
1. **Home** (`(tabs)/home.tsx`): the hub. Announcements carousel (including "Coming up" birthday and date reminders), the stories/Updates row and responses, the always visible Touch Grass send, and ask the group (polls and questions). See `complete/HOME.md`.
2. **Friends** (`(tabs)/friends.tsx`): your roster grouped by Close / Friends / Acquaintances, with drag and drop re tiering and a Move to sheet. Friend Pod (weekly recap card) and Inside Jokes sit above the roster. Add friend via QR / link / scan / contacts. See `complete/FRIENDS.md`.
3. **Events** (`(tabs)/events.tsx`): create an event, see friends' events, community placeholder, who should meet, cover, co host, chip in, assignments, going/to-meet counts, touch grass. See `complete/EVENTS.md`.
4. **Discover** (`(tabs)/discover.tsx`): the opt in gate, overlap first suggestions, Discover Me modules, in common, friends of friends, the connection intent settings, and the network graph. See `complete/DISCOVER.md`.
5. **News** (`(tabs)/news.tsx`): the news/updates tab.

**Reachable but not in the pill:**
- **Messages** (`(tabs)/messages.tsx` + `app/messages/`): opened from the header. A deliberately limited inbox: 5 messages per day per conversation, share contact card, double tap to heart a bubble. See `complete/MESSAGES.md`.
- **Profile** (`(tabs)/profile.tsx`): opened from the header avatar. The Spotify artist style profile with header, tabs, and modules, plus Settings. See `PROFILE.md` and `PROFILE-CUSTOMIZATION.md`.

**Other important routes:**
- `(auth)/welcome.tsx`: first open CRT intro movie (retro TV bars into a green terminal that types a short story), then sign in. Plays once per install. There is a hidden hold to skip in the middle for testing. `(auth)/sign-in.tsx`, `(auth)/sign-up.tsx`.
- `onboarding/`: first time setup flow (privacy first). TestFlight uses the older 19 step flow; the new story onboarding is preview only.
- `reveal/[id].tsx`: the connection reveal after you connect (how you met and tier first, then what you have in common). See `complete/REVEAL.md`.
- `person/[id].tsx`: a friend's profile, tier filtered (tabs: About them, In common, Inside Jokes, Bucket List, Notes).
- `pending/[id].tsx`: a card you made for someone not on Bridger yet (notes survive after they join and merge).
- `story/[id].tsx` and `collage/`: the Updates viewer and the Collage page composer (capture, editor, finish).
- `recap/index.tsx`: the Friend Pod weekly recap page (player + record + this week's questions).
- `coop/`: co-op benefits page and the multi page public portal.
- `discover/`, `quiz/`, `q/[token].tsx` (no account quiz take), `notifications/`, `settings/`, `assistant/`, `music/`, `invite/`, `activity/`.

---

## 6 · Feature by feature (what each thing does)

This is the functional tour. Each feature has a deeper spec; the file name is in parentheses.

**Onboarding (`complete/ONBOARDING.md`).** Privacy promise first, then name, photo (the one profile photo upload exception), the basics, friends of friends and location, a per row visibility review, and a last step to join the co-op or invite friends, then Home. The first open CRT intro is separate and plays once.

**Home (`complete/HOME.md`).** The daily hub. Conditional strips render nothing when empty. Announcements carousel, Updates (stories) row, responses, Touch Grass send, and ask the group.

**Friends and tiers (`complete/FRIENDS.md`).** The roster and the three circles, add friend (QR, invite link, scan, contacts), report and block (required for the app stores), private notes and reminders about a friend, Inside Jokes, and Friend Pod.

**Updates, shown as Collage pages (`complete/STORIES.md`, `complete/SCRAPBOOKS.md`).** Internally the "stories" module (tables `scrapbook_pages` / `scrapbook_elements`). A post is one 8.5 by 11 page: up to 4 photos/videos a day across 1 to 4 pages, typed words, a date stamp, optional voice notes, friend tags, and cut outs. Media may be captured live or picked from the camera roll (only the picked items are read). Audience per page is Only me, or a tier. AI writes a day/week summary from the words only, never the images. 30 day media retention on free.

**Inside Jokes (`quotes` module).** A full screen composer: type on a square sticky note, pick its color, search a friend who said it, optionally tag an event. Text posting is free; attaching one photo is a co-op perk. Newest note shows on Friends, and on both the poster's and the tagged person's profile walls.

**Friend Pod / weekly recap (`complete/RECAP-PODCAST.md`).** A weekly voice catch up. Five questions lock each Monday (rose / thorn / bud, plus the two most voted suggested questions, plus short fill ins). You record short audio answers in a record then review then posted flow (swipe the questions, skipping is fine, hear each take back, pick who hears it), and everyone's answers stitch into one continuous "podcast" you can play, filter by circle, and speed up with a saved slider (up to 2.5x). This week is free; earlier locked weeks are a co-op perk.

**Discover (`complete/DISCOVER.md`) and Reveal (`complete/REVEAL.md`).** Discover is opt in. Before connection, only facts marked visible to Everyone and matchable feed the suggestion pool. After you connect, the reveal shows how you met and sets the tier first (which gates visibility), then the single strongest shared link, then other things in common, then exits to their profile or Discover. The group level suggestions and network graph live on Discover, not the reveal.

**Matching (`complete/MATCHING-ALGORITHMS.md`, `MATCHING-PSYCHOLOGY.md`).** Runs entirely in the Nest API (`apps/api/src/matching/`). One shared scorer core wrapped as discover refresh, bridge suggest, event suggest, and pair overlap. Six feature components live day one; a component contributes zero when a pair lacks its data. Quiz matching is per shared quiz. Friend circle labels teach the matcher over time (Close is the gold label), learned nightly in Nest.

**Quizzes (`complete/QUIZ-ENGINE.md`).** A deterministic scorer sets the score; an AI moderator adapts and moderates but never sets the score. Internal quiz ids are personality, values, humor, attachment; user facing titles are marketing names. The Discover strip is "Personality quizzes": Your Funny Bone, What Gets You Going, Your Vibe, The Friend Zone. Fun / BuzzFeed style quizzes use the same engine. "Which J name" is a durable first result with a no account share link.

**Events (`complete/EVENTS.md`).** Create and host, cover image, co host, chip in handles (peer to peer, never processed by Bridger), assignments, native share, going and to-meet counts, and touch grass. Host notes and a shared event album (save, expiry, quota) are documented and planned.

**Messages (`complete/MESSAGES.md`).** Intentionally limited: 5 messages per day per conversation, share contact card (posts the fields you chose, does not burn a slot), double tap to heart a bubble (a reaction, not a message, no counts). No "make a plan" in a thread (plans live on Events / Touch Grass). In Bridger only, never phone or iMessage.

**Touch Grass (`complete/TOUCHGRASS-AND-QUIZ.md`).** The "I am free / I am bored" signal. The send lives on Events and Home; Home also shows friends' signals to answer.

**Co-op (`complete/COOP.md`, `complete/COOP-PORTAL.md`, `complete/COOP-PAYMENTS-SETUP.md`).** Two tiers. Free Lite: 5 Close / 30 Friends / unlimited Acquaintances, 30 day storage, no ads. Join the co-op: 6 dollars per month or 60 per year, raising caps (25 Close / 125 Friends), named groups, earlier recap weeks, Inside Joke photos, and more. Membership uses platform purchase (RevenueCat on iOS/Android, Stripe card on web). Joining is always skippable. The co-op portal is a public to view, member to participate governance surface (mission, model, ideas, vote, transparent economics).

**Profile and customization (`PROFILE.md`, `PROFILE-CUSTOMIZATION.md`).** A Spotify artist style profile: header, tabs, scroll ordered modules, a shared card that is tier filtered, Listening (music picks), and Settings. Customization has a Theme and Layout (no code) tier that is live, and a Code tier (sanitized CSS/HTML) that is admin gated off for now. "View original" always reaches the plain accessible layout.

**The assistant, "Billy" (`AGENT.md`, `AGENT-SCOPE.md`).** The one opt in exception to invisible AI. Off by default (ships founder only), hidden from anyone who has not enabled it. Runs on a separate single user `personal_agent` lane; it only ever sees the requester's own visible data, never another user's, never trains, and never acts without an explicit confirm. It drafts; the user disposes. It reads playbooks (procedure) but never writes them.

**Circles / Influencer (`CIRCLES.md`, planned).** A separate connection class (`circle_edges`), not friends. Influencer is a paid role. No Influencer to fan 1:1 DM; off platform handles are collected at connect. Docs and schema first.

**Version of me (`VERSION-OF-ME.md`, planned).** User authored "What version of {Name} are you?" quizzes in `user_quizzes`. Not admin quizzes, not Discover measurement, never feed matching.

**Delight (`DELIGHT.md`).** An umbrella for optional delighters (small joyful effects). Emoji bomb is the first built gift; the backlog stays open.

---

## 7 · The backend (`apps/api/src`, one module per domain)

Each module follows the same NestJS shape (module, controller, service, repository, dto). The domains currently present: `activity`, `admin`, `admin-auth`, `ai`, `assistant`, `auth`, `common`, `connections`, `content`, `coop`, `delight`, `demo-week`, `events`, `feed`, `health`, `jname`, `matching`, `me`, `music`, `notes`, `notifications`, `pending-people`, `photo-filters`, `polls`, `posthog`, `profiles`, `quiz`, `quotes` (Inside Jokes), `recap` (Friend Pod), `stories` (Updates/Collage), `tiers`, `touchgrass`.

Two rules enforced at this layer so they can never leak into a screen: no public follower counts (no endpoint returns a follower total to anyone but the owner), and no story view counts to others.

The public liveness endpoint `GET /health` stays shallow (App Runner only). Deep dependency checks live behind `GET /admin/integrations/health`. Any new outbound integration (OAuth, email, AI vendor, payments) must register a non secret check there in the same change.

---

## 8 · Data and privacy model (`DATA.md`)

- **Three zones.** Zone A = PII (the person). Zone B = de-identified, matchable facts. Zone C = derived AI (summaries, embeddings). Matching and AI operate on B and C via opaque IDs; names rejoin on device.
- **RLS on every table.** A viewer can only read rows their relationship and `visible_to_tier` allow. New table means new policy in the same migration.
- **Hard delete cascades.** Deleting a field, connection, or account triggers cascades and drops derived AI rows (embeddings, summaries) and purges third party processors.
- **Export and turn off.** Users can export their own rows; "turn off my data" flips discoverable/matchable flags and drops derived rows.
- **Two consents per attribute:** `visibleToTier` and `matchable`, independent.

---

## 9 · AI and ML (`AI-SYSTEM.md`, `MACHINE-LEARNING.md`)

- All model calls route through a PII scrubbing gateway (opaque IDs, no content or media on the de-identified lane). Foundation models are never trained or fine tuned on user data; the system uses RAG plus small in house ranking models.
- Two lanes: `deidentified` (matching, summaries) and `personal_agent` (Billy only, single user).
- ML optimizes real world connection outcomes, never engagement or time in app. The UX analytics store is walled off from all learning.
- Where each AI job runs is listed in `INFRASTRUCTURE.md` (summaries and transcription at post time, embeddings on attribute change, quiz moderation during a quiz, matching on demand).

---

## 10 · Analytics, design, and typography (the always review contracts)

- **Analytics (`ANALYTICS-TAXONOMY.md`, plus the two analytics rules).** Everything is named `screen.section.element`, reused not screen prefixed. Non interactive regions are tagged for dead click capture. Sheets are their own surfaces. Multi step flows emit start / step / complete or abandon. Product events fire on confirmed outcomes, never on the tap that begins them. First party, consented, de-identified, deletable, walled off from matching. Events emit through the shared PostHog module.
- **Design (`DESIGN.md`, `MAGIC-PATTERNS.md`).** Eggshell/black canvas, pixel headers, flat colorful surfaces, metallic primary buttons, floating pill nav, no gradients or heavy shadows, motion behind prefers reduced motion. All UI comes from Magic Patterns. 80/20 clean to retro.
- **Typography (`TYPOGRAPHY.md`).** Body and inputs at least 16px everywhere; captions 13 to 14px and secondary only; do not fix overflow by shrinking type; no new one off sizes outside the token table.
- **Responsive (`design-briefs/FOLDABLE-DUO-ADAPTIVE-DESIGN-BRIEF.md`).** Build for every screen size (phone, foldable, tablet, web) using `useResponsiveLayout()`. Never hard code a device width.

---

## 11 · Status: what is built, building, and planned

- **Shipped and archived (`guide-docs/complete/`), reference only:** Onboarding (old flow), Home, Updates/Stories, Friends, Discover, Reveal, Events, Messages, Friend Pod recap, Co-op and Co-op Portal, Touch Grass and quizzes, Quiz Engine, Profile Modules, Matching Algorithms. Scrapbooks/Collage is landing and supersedes the posting half of Stories.
- **Active build (root docs):** Profile redesign, Profile Customization (Code tier still off), the assistant Billy, the Admin console, Circles (docs/schema), Version of me (docs/schema), Delight umbrella.
- **Parallel later tracks (docs landed, code later):** Events host notes and album, Version of me take/share, Circles (payments + portal + overlap), last because it needs the most legal weight.

The current front line per INDEX: profile redesign + customization + assistant + admin + delight.

---

## 12 · The canonical decisions you must respect (quick list)

These are the load bearing rules from INDEX §6. When anything conflicts, these win.

- No blockchain. All complex logic in Nest, not Edge Functions. All UI from Magic Patterns. Every feature is designed visual first.
- Zones A/B/C. Delete means delete (including third party processors). Two independent per attribute consents. Identity and beliefs are never bulk matchable.
- No vanity metrics anywhere. The only allowed numbers are private and owner useful.
- Capture only media except: profile photo, Collage camera roll picks, event cover, event album uploads, and one Inside Joke photo (co-op).
- Matching runs in Nest; v1 scores all six components with zero by absence; quiz matching is per shared quiz; circles teach the matcher nightly.
- AI is invisible and firewalled; never trained on user content. The assistant is the single opt in exception, single user lane, never acts without confirm, drafts only.
- Connection is never gated (adding a friend never requires quizzes, a full profile, or payment). Circles are not friends and do not consume friend caps.
- User facing names versus internal module names (see the glossary below). Never surface internal names in UI copy; never rename DB tables to chase UI copy.
- Founder only agents (you) are private to the founder, not Billy, not a member surface.

---

## 13 · Your boundaries as Grokbot (`FOUNDER-AGENTS.md`)

- **Founder only.** No public URL, no in app entry for members, no marketing. Access is locked to the founder.
- **Not Billy.** Different docs, routes, flags, and copy. Never merge the two lanes in UI, routes, or analytics.
- **No user PII or secrets in your context by default.** Prefer local repo context and de-identified fixtures. Secrets stay in Secrets Manager and local `.env`, never committed.
- **Same build law.** Any code you write passes the standing rules, UX visual first gate, Magic Patterns, analytics taxonomy, and updates PRIVACY/TERMS when behavior changes.
- **Small, reviewable diffs. No autonomous push or deploy.** If unsure whether something is founder only versus a product surface, ask before exposing any surface.
- **If Nest ever calls an xAI/Grok endpoint,** register it on admin integrations health in the same change.

### 13b · Company-of-agents org chart (same file)

`FOUNDER-AGENTS.md` is also the living **org chart** for founder seats: Chief of Staff (default you), Product, Engineering (FE / BE / UX), **QA release gate**, Cybersecurity, **Legal / compliance scans**, Analytics, PR / podcasts / press, Marketing / SEO / Brand, announcements, Sales, Finance / spend, timesheets, legal-entity ops, Consultant, and Support prep.

- One Grokbot can **wear a seat** when the founder names it ("wear QA", "wear Legal scan", "wear PR").
- Separate Grokbots can lock to one seat later; scope and **living memory** still live in `FOUNDER-AGENTS.md`.
- On releases with **accounts or outbound email**, default to the release swarm (Product → Eng → QA → Cyber → Legal → Analytics → Finance brief → Chief of Staff ship/hold).
- Be communicative and owner-voiced, like a fast startup staff. Update that seat's living memory when you finish meaningful work.

---

## 14 · User facing versus internal names (glossary)

| The user sees | The code says |
|---|---|
| Updates / Collage ("your collage," "today's page") | `stories` module (`scrapbook_pages` / `scrapbook_elements`) |
| Inside Jokes | `quotes` module (quips tables) |
| Touch Grass | `touchgrass` |
| The Catch-Up | the catch up sheet in `story/[id]` |
| Friend Pod / weekly recap | `recap` |
| Co-op | `coop` |
| Circles (not follows / followers), Influencer (paid role) | `circles` (planned) |
| Billy (opt in assistant) | `assistant` / `personal_agent` lane |

---

## 15 · Where to look next (the doc map)

- **Map and canonical decisions:** `INDEX.md` (read first).
- **Stack, hosting, secrets, deploy, ship checklists:** `INFRASTRUCTURE.md`.
- **Repo layout, modules, routes, the tagged fact:** `ARCHITECTURE.md`.
- **Schema, zones, RLS, deletion, export:** `DATA.md`.
- **Design system and components:** `DESIGN.md`, `MAGIC-PATTERNS.md`, `TYPOGRAPHY.md`.
- **Analytics naming and events:** `ANALYTICS-TAXONOMY.md` (+ the analytics rules in `.cursor/rules/`).
- **Notifications destination map:** `NOTIFICATIONS.md`.
- **AI and learning policy:** `AI-SYSTEM.md`, `MACHINE-LEARNING.md`, `MATCHING-PSYCHOLOGY.md`.
- **Feature specs:** the files in `guide-docs/complete/` (shipped) and the active build docs in `guide-docs/` root.
- **Legal drafts to keep current:** `docs/PRIVACY.md`, `docs/TERMS.md`.
- **Your own contract + org chart:** `FOUNDER-AGENTS.md` (boundaries, every seat's responsibilities, living memory, release swarm) and `.cursor/rules/founder-agents.mdc`.
- **Agent per task manuals (Billy reads these, not you):** `guide-docs/playbooks/`.

---

*Maintenance: this brief is a summary and orientation. When a canonical decision changes, update `INDEX.md` §6 first, then reflect it here. Last written: 2026-09-10 (org chart pointer added).*
