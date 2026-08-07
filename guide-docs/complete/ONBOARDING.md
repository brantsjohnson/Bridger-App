# Bridger — Onboarding Flow

Build doc for the very first run. Maps to `apps/mobile/app/(auth)/welcome.tsx` and the `apps/mobile/app/(onboarding)/` route group in `ARCHITECTURE.md`. Read that file first — this doc only details the onboarding slice and assumes the data model (`ProfileAttribute`, `Tier`, `Layer`) and module names from it.

---

## The shape: two phases, one gate each

```
First app open ──► [ Phase 0 · Welcome ] ──auto──► [ Phase 1 · Auth ] ──► [ Phase 2 · Onboarding ] ──► Home
                    non-skippable, one-off            create account          the essential layer
```

- **Phase 0 (Welcome)** happens *before* an account exists and is seen **once, ever**. Gated by `hasSeenWelcome`.
- **Phase 2 (Onboarding)** happens *after* the account is created and fills only the **essential layer**. Gated by `onboardingComplete`.
- A returning user hits neither and lands straight on Home.

---

## Design principles (apply to every screen)

1. **Typeform feel — one question per screen.** A single ask, big and clean, with a **progress bar** and **smooth transitions** (slide/fade, breathe). Answer, transition, next. Never a stacked form.
2. **Fun and visual.** Prefer **tappable choices over typing**: single-select, **multi-select**, and **image-choice** tiles. Typing only where it's genuinely needed (name, city). Some questions can be image-based.
3. **Purpose before ask.** Each question is prefaced by one short line in the "tech should help you ___" voice, so the person always knows *why*.
4. **Clean, plain wording.** Short sentences, no jargon.
5. **Welcome is non-skippable and auto-advancing.** It flows into auth on its own.
6. **Keep it short.** Onboarding collects only the essentials + notifications + one meeting question. The deep matching/personality questions are **not** here — they live in Discover Me, later (see `DISCOVER.md`).

This one-question-at-a-time pattern is the **same pattern used by every profile module and quiz** (see "Module flow" below) — onboarding is just the first place the person meets it.

---

## Phase 0 · Welcome (`(auth)/welcome.tsx`)

One continuous animated sequence — either a required video or an animated type-out of text beats (design choice; the beat list below drives either). No skip. When the last beat finishes, it **auto-navigates to auth** with no tap.

### Beat sequence (draft copy — edit freely)

| # | Beat | Feel |
|---|---|---|
| 1 | "Social media was supposed to connect us." | quiet open |
| 2 | "It was supposed to help us keep in touch." | building |
| 3 | "To help us make new friends." | building |
| 4 | "To help us live our lives — not watch other people live theirs." | turn |
| 5 | *[phone-time stat — see note]* | emotional low |
| 6 | "So let's try again." | lift |
| 7 | "Welcome to Bridger." → fades into auth | resolve |

> **Phone-time stat (beat 5):** use a real, cited figure before shipping — do not hardcode a made-up number. Store the copy + source in `content/welcome.ts` so it's editable without touching the screen. Present it visually (a filling bar, a shrinking life, etc.), not as plain text.

### Behavior
- Plays automatically on first open.
- No skip, no scrub, no back.
- On completion → `router.replace('(auth)/sign-up')`.
- Sets `hasSeenWelcome = true` (device-local before account; persisted to the profile once the account exists, so a reinstall on the same account doesn't replay it).

---

## Phase 1 · Auth (`(auth)/sign-up.tsx`, `sign-in.tsx`)

Create-account / sign-in, owned by the `auth` module. Offers **Sign in with Google** and **Sign in with Apple** (OAuth) alongside email — the fast, familiar paths people expect. On successful **new** account creation → enter `(onboarding)`. On sign-in to an existing, onboarded account → Home.

---

## Phase 2 · Onboarding (`(onboarding)/`)

One screen per step, Typeform-style, in order. **Privacy comes first** — the promise sets the tone before a single question is asked.

| # | Step | Purpose line (draft) | The ask | Input |
|---|---|---|---|---|
| 1 | **Privacy promise** | "Privacy is crucial — and it's yours." | Read the promise, continue | acknowledge |
| 2 | **Stay in touch** | "Tech should help you stay close." | What should we nudge you about? | **multi-select**: close friends' updates · birthdays · big moments · events |
| 3 | Basics · name | "So your people know it's you." | Your name | text (**required**) |
| 4 | Basics · photo | "One look — take it or pick it." | Add your photo | **take or upload** · skippable |
| 5 | Basics · questions | "A few things friends want to know." | 10 quick questions | Typeform run (below) |
| 6 | **Meet new people** | "Friends of your friends — never strangers." | Nearby or anywhere? | choice + city · **skippable** |
| 7 | **Privacy & visibility** | "You decide who sees what." | Set who sees each answer | per-row audience + set-all |
| 8 | Co-op pitch | "A tool for you, not an ad machine." | Join the co-op? | Join / Use free |
| 9 | Welcome in | "You're in." | — | Continue → Home |

### Step notes

- **1 · Privacy promise (first).** Right after login, before anything is asked: a short, warm promise — *"Privacy is crucial, and it's yours. You control all of it. We only ever use your info to connect you with your friends and people worth meeting — never to sell you."* Read-and-continue, not a form. Trust before the ask.
- **2 · Stay in touch.** Notification prefs (multi-select): close friends' updates · birthdays · big moments · events. Writes `notifications` prefs.
- **3–5 · The basics.** Name (required) → photo → 10 quick questions.
  - **Photo — take OR upload.** Unlike stories (which are capture-only), the **profile photo can be uploaded from the library *or* taken in-app.** Optional house filter for a shared look; skippable → default placeholder.
  - **The 10 questions** (below) are simple, tappable where possible, and the things friends actually want to know. Only `name` is required; each question is skippable.
- **6 · Meet new people (skippable).** The only connection question in onboarding, kept simple. Lead with the promise: **friends of your friends — never strangers.** One choice: **People near me** / **People anywhere** (both friends-of-friends). **City only** if nearby (never a street address; reuses the city from the basics if given). The deep Discover Me questionnaire is **not** here — it runs later in Discover. If this step is skipped, the same nearby/anywhere + city question appears when they first open Discover.
- **7 · Privacy & visibility.** The summary, and the first time they use the sharing model. Copy: *"These are set to all your friends for now — change any of it, anytime. You'll build custom groups later."* Every answer is a **row with an audience control** (All friends / Close / Friends) plus a **"set all."** They learn the tiers by using them. Writes each answer's `visibleToTier`. (Placed after "meet" so the whole picture — profile + intent — is reviewed together before finishing.)
- **8 · Co-op pitch** — funding expectation set early (see `COOP.md`).
- **9 · Welcome in** — sets `onboardingComplete`.

### The 10 basics questions

Simple, mostly tappable, and things friends genuinely want to know. All skippable.

1. **When's your birthday?** — date. (Powers birthday reminders.)
2. **Where are you from?** — hometown (search / text).
3. **Where do you live now?** — city (search / text). *(Reused by the meet step.)*
4. **What are you up to these days?** — work / school / what you're into (short text or select).
5. **What are you into?** — interests, **multi-select image/icon tiles** (the fun, visual one).
6. **Any pets?** — yes/no → type + names.
7. **Where'd you go to school?** — high school / college (text).
8. **Any nicknames?** — short text.
9. **Morning person or night owl?** — a playful this-or-that tap.
10. **Anything else your friends should know?** — optional free text.

Each answer writes an `attribute` (visibility set in step 7) and feeds the back-end embedding + summary.
- **8 · Welcome in** — the only place `onboardingComplete` is set.

---

## Module flow (Typeform — used by onboarding, profile modules, and quizzes)

Every fill experience — onboarding, the profile modules (`PROFILE-MODULES.md`), and quizzes — uses the **same one-question-at-a-time pattern**:

- **One question per screen**, a **progress bar**, and a **smooth transition** between questions (slide/fade; respects reduced-motion).
- **Question types:** single-select, **multi-select**, **image-choice** (pick from picture tiles), short text, date, this-or-that, ranking. Prefer tappable types over typing; make it fun and visual.
- **Skippable** where optional; **save-and-resume** for profile modules (cancel = nothing saved).
- **Ends with a review** — for profile modules, the Review & share step (set-all + per-row visibility). Onboarding's step 5 *is* this review.
- **Writes to the database** as `attributes` (one row per answer, each with its visibility), and **feeds the AI layer** below.

---

## AI back-end (embeddings + summaries — invisible to the user)

Answers don't just sit in fields — they build the person's **de-identified AI profile** used for matching:

- As answers are saved, the backend generates **embeddings + a short summary** of the person ("early riser, creative, values deep 1:1s") — **from their matchable, de-identified facts only**, keyed by opaque IDs. **The user never sees these**; they're for the matcher to read (see `DATA.md`, Zone C). Never trained on PII/likeness.
- This is how the database "knows what kind of person this is" without exposing or training on who they are.

### Profile freshness (the "do you still…?" nudge)

People change. When the model's picture looks **stale or contradicted by newer activity**, Bridger can surface a **single, light re-check** — a **"quick check" card in Home's announcements carousel** (see `HOME.md`): *"Still into beatboxing?"* → **Yes** keeps it, **No / edit** updates it, which refreshes the embedding + summary. It's occasional, one question at a time, never a chore — just a gentle way to keep the profile (and matches) true over time.

---

| Aspect | Spec |
|---|---|
| Capture | **Take in-app OR upload from library** — the profile photo is the one place uploads are allowed (stories stay capture-only). |
| Filter | One house filter applied to all users → unified profile look. |
| Storage | Object store (signed URLs, never public), same as stories. |
| Refresh | Nudge to retake every ~3 months; user may also add/replace anytime from profile. |
| Skip | Allowed at onboarding → default filtered placeholder until they add one. |
| Owner | Media handling per `ARCHITECTURE.md`; filter config lives in `packages/ui/tokens` so it's consistent app-wide. |

---

## Data written during onboarding

| Field | Model / module | Layer | Notes |
|---|---|---|---|
| `hasSeenWelcome` | `profiles` (or device pre-account) | — | one-off gate for Phase 0 |
| `name` | `person.name` (`profiles`) | — | required |
| `avatar` | media store + `person.avatar` | — | filtered; optional |
| likes | `attributes` (`ProfileAttribute[]`) | essential | defaults from `permissions/defaults.ts` |
| quiz result | `quizzes` → `attributes` | essential | matchable |
| co-op membership | `coop` | — | boolean + "not now" state |
| `onboardingComplete` | `profiles` | — | one-off gate for Phase 2 |

Everything richer — travel, foods, bucket list, more quizzes, connection-intent rules — is **not** collected here. It flows in later through the profile-depth and connection layers, exactly as designed. Onboarding's job is only to make day one non-empty and non-creepy.

---

## Navigation & gating logic

```
root _layout:
  if !hasSeenWelcome        → (auth)/welcome
  else if !authenticated    → (auth)/sign-in | sign-up
  else if !onboardingComplete → (onboarding)/privacy
  else                      → (tabs)/home
```

- Welcome → auto-advances to auth (no button).
- Each onboarding screen advances on continue; skippable screens show "Skip for now."
- `welcome-in.tsx` is the only place `onboardingComplete` is set to true.

---

## Acceptance criteria

- [ ] Welcome plays on first open, cannot be skipped, and auto-advances to auth on completion.
- [ ] Every screen is one question, Typeform-style, with a progress bar and smooth transitions; tappable/multi-select/image choices are preferred over typing.
- [ ] Onboarding order: privacy promise → stay-in-touch → name → photo → basics (10) → meet (skippable) → privacy & visibility review → co-op → welcome-in.
- [ ] The privacy promise is the first screen after login (read-and-continue), before any question.
- [ ] `name` is required; every other step is skippable.
- [ ] The profile photo can be **taken or uploaded** (unlike stories, which are capture-only); skippable.
- [ ] The 10 basics are simple, skippable, mostly tappable, and things friends want to know.
- [ ] The review step shows every answer with a per-row audience control and a "set all", defaulting to All friends, and teaches the tier model by use.
- [ ] The meet step is skippable, states "friends of friends, never strangers," offers nearby/anywhere, and asks for **city only** (never street address) when nearby.
- [ ] The deep Discover Me / personality questionnaire is NOT in onboarding; it runs later in Discover.
- [ ] Answers write to `attributes` (with visibility) and feed the back-end AI embeddings + summary, which the user never sees and which is never built from PII/photos.
- [ ] A profile-freshness re-check can appear later as a single top-of-Home question when the model looks stale.
- [ ] `onboardingComplete` is set only on the final screen; a returning onboarded user lands on Home.

---

## Route files to create

```
apps/mobile/app/
├── (auth)/welcome.tsx          # Phase 0 — animated, non-skippable
└── (onboarding)/
    ├── privacy.tsx             # 1 · privacy promise (first)
    ├── notifications.tsx       # 2 · stay-in-touch prefs (multi-select)
    ├── name.tsx                # 3 · required
    ├── photo.tsx               # 4 · take OR upload
    ├── basics.tsx              # 5 · 10 basic questions (Typeform run)
    ├── meet.tsx                # 6 · friends-of-friends + nearby/anywhere + city (skippable)
    ├── review.tsx              # 7 · privacy & per-row visibility summary
    ├── coop.tsx                # 8 · join the co-op?
    └── welcome-in.tsx          # 9 · sets onboardingComplete → Home

apps/mobile/content/
└── welcome.ts                  # editable beat copy + cited phone-time stat
```
