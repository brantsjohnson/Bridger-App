# Bridger — Onboarding Flow

Build doc for the very first run. Maps to `apps/mobile/app/(auth)/welcome.tsx` and the `apps/mobile/app/(onboarding)/` route group in `ARCHITECTURE.md`. Read that file first. This doc only details the onboarding slice and assumes the data model (`ProfileAttribute`, `Tier`, `Layer`) and module names from it.

## The shape: two phases, one gate each

```
First app open ──► [ Phase 0 · Welcome ] ──auto──► [ Phase 1 · Auth ] ──► [ Phase 2 · Onboarding ] ──► Home
                    non-skippable, one-off          create account         the essential layer
```

**Phase 0 (Welcome)** happens before an account exists and is seen once, ever. Gated by `hasSeenWelcome`.
**Phase 2 (Onboarding)** happens after the account is created and fills only the **essential** layer. Gated by `onboardingComplete`.
A returning user hits neither and lands straight on Home.

## Design principles (apply to every screen)

- **Typeform feel.** One question per screen. A single ask, big and clean, with a progress bar and smooth transitions. Answer, transition, next. Never a stacked form.
- **Fun and visual.** Prefer tappable choices over typing: single-select, multi-select, image-choice tiles. Typing only where genuinely needed (name, city).
- **Purpose before ask.** Each question is prefaced by one short line in the "tech should help you ___" voice, carried in a solid pill in the step's color.
- **A color per step.** Every step owns an accent from the palette and wears it fully: a washed canvas, a big soft blob behind the question, a colored purpose pill and a matching progress bar. The run reads as a sequence of rooms, not a form. Order: privacy `blue` → stay-in-touch `amber` → name `purple` → photo `pink` → basics `teal` → meet `green` → review `blue` → co-op `coral` → welcome-in `amber`. Inside a step, content carries color too (promise cards, choice tiles, tier chips), never a page of white cards.
- **The tiers are color-coded** wherever they appear: Close `pink`, Friends `blue`, Everyone `teal`.
- **Clean, plain wording.** Short sentences, no jargon. No em dashes, and never the word "AI" (see `COOP.md`).
- **Welcome is non-skippable and auto-advancing.**
- **Keep it short.** Essentials + notifications + one meeting question. The deep matching questionnaire lives in Discover Me (`DISCOVER.md`).

This one-question-at-a-time pattern is the same one every profile module and quiz uses. Onboarding is just where the person first meets it.

## Phase 0 · Welcome (`(auth)/welcome.tsx`)

One continuous animated sequence of text beats. No skip, no scrub, no back. When the last beat finishes it auto-navigates to auth with no tap.

| # | Beat | Feel |
|---|------|------|
| 1 | "Social media was supposed to connect us." | quiet open |
| 2 | "It was supposed to help us keep in touch." | building |
| 3 | "To help us make new friends." | building |
| 4 | "To help us live our lives, not watch other people live theirs." | turn |
| 5 | [phone-time stat] | emotional low |
| 6 | "So let's try again." | lift |
| 7 | "Welcome to Bridger." | resolve |

**Phone-time stat (beat 5):** use a real, cited figure before shipping. Copy + source live in `content/welcome.ts` so they're editable without touching the screen. Present it visually (a filling bar), not as plain text.

On completion → `(auth)/sign-up`, and `hasSeenWelcome = true` (device-local pre-account, persisted to the profile once it exists).

## Phase 1 · Auth (`(auth)/sign-up.tsx`, `sign-in.tsx`)

Owned by `auth`. Google and Apple OAuth alongside email. New account → `(onboarding)`. Existing onboarded account → Home.

## Phase 2 · Onboarding (`(onboarding)/`)

Privacy comes first. The promise sets the tone before a single question is asked.

| # | Step | Purpose line | The ask | Input |
|---|------|--------------|---------|-------|
| 1 | Privacy promise | "Privacy is crucial, and it's yours." | How this works | acknowledge |
| 2 | Stay in touch | "Tech should help you stay close." | What should we nudge you about? | multi-select |
| 3 | Basics · name | "So your people know it's you." | Your name | text (required) |
| 4 | Basics · photo | "One look, everyone. Your version of it." | Add your photo | take **or** upload · skippable |
| 5 | Basics · questions | "A few things friends want to know." | 10 quick questions | Typeform run |
| 6 | Meet new people | "Friends of your friends, never strangers." | Nearby or anywhere? | choice + city · skippable |
| 7 | Privacy & visibility | "You decide who sees what." | Set who sees each answer | per-row audience + set-all |
| 8 | Co-op pitch | "A tool for you, not an ad machine." | Join the co-op? | Join / Use free |
| 9 | Welcome in | "You're in." | — | Continue → Home |

### Step notes

- **1 · Privacy promise.** Read-and-continue, not a form. You control all of it; nothing is sold; what you share is only used to connect you.
- **2 · Stay in touch.** Multi-select: close friends' updates · birthdays · big moments · events. Writes `notifications` prefs.
- **3–5 · The basics.** Name (required) → photo → 10 quick questions.
- **Photo: take OR upload.** The profile photo is the one place uploads are allowed; stories stay capture-only. One house filter is applied either way. Skippable → filtered placeholder.
- **6 · Meet (skippable).** Lead with the promise: friends of your friends, never strangers. One choice: people near me / people anywhere. City only if nearby, never a street address. If skipped, the same question appears on first opening Discover.
- **7 · Privacy & visibility.** Every answer is a row with an audience control (Close / Friends / All) plus a set-all, defaulting to all friends. They learn the tiers by using them. Writes each answer's `visibleToTier`.
- **8 · Co-op pitch.** Funding expectation set early (see `COOP.md`).
- **9 · Welcome in.** An arrival, not a receipt. A full amber screen with confetti falling behind it, a bloom of accent-colored circles that springs open, "You're in." at 40px, and the one honest line: *no feed to scroll, just the people you actually know*. Beneath it, the three things that actually happen next — add your people · post your first story · say when you are free — each on a bordered card with its own colored token, staggering in. Then a single **Let's go**. Every bit of motion is skipped under reduced-motion. This is the only place `onboardingComplete` is set.

### The 10 basics questions

Simple, mostly tappable, all skippable.

1. When's your birthday? (date — powers birthday reminders)
2. Where are you from? (hometown)
3. Where do you live now? (city — reused by the meet step)
4. What are you up to these days? (select)
5. What are you into? (multi-select interest tiles, the fun visual one)
6. Any pets? (yes/no → type + names)
7. Where'd you go to school? (text)
8. Any nicknames? (text)
9. Morning person or night owl? (this-or-that tap)
10. Anything else your friends should know? (free text)

Each answer writes an attribute (visibility set in step 7) and feeds the back-end embedding + summary.

## Module flow (Typeform — onboarding, profile modules, quizzes)

- One question per screen, a progress bar, smooth transitions (respects reduced motion).
- Question types: single-select, multi-select, image-choice, short text, date, this-or-that, ranking. Tappable beats typing.
- Skippable where optional; save-and-resume for profile modules (cancel = nothing saved).
- Ends with a review: set-all plus per-row visibility. Onboarding's step 7 is this review.
- Writes to `attributes` (one row per answer, each with its visibility).

## AI back-end (embeddings + summaries, invisible to the user)

As answers save, the backend generates embeddings and a short summary ("early riser, creative, values deep 1:1s") from **matchable, de-identified facts only**, keyed by opaque IDs. Never trained on PII or likeness. The user never sees these (see `DATA.md`, Zone C). Internally this is the AI layer; in the product it is never named (see `COOP.md`).

## Profile freshness (the "do you still…?" nudge)

When the picture looks stale, Bridger surfaces one light re-check at the top of Home, announcement style: "Still into beatboxing?" Yes keeps it, Not anymore updates it, which refreshes the embedding and summary. Occasional, one question at a time, never a chore.

## Photo spec

| Aspect | Spec |
|--------|------|
| Capture | Take in-app **or** upload from library. The one place uploads are allowed. |
| Filter | One house filter applied to all users → unified profile look. |
| Storage | Object store (signed URLs, never public), same as stories. |
| Refresh | Nudge to retake every ~3 months; replaceable anytime from profile. |
| Skip | Allowed → default filtered placeholder. |
| Owner | Media handling per `ARCHITECTURE.md`; filter config in `packages/ui/tokens`. |

## Data written during onboarding

| Field | Model / module | Layer | Notes |
|-------|----------------|-------|-------|
| `hasSeenWelcome` | `profiles` (or device pre-account) | · | one-off gate for Phase 0 |
| notification prefs | `notifications` | · | multi-select |
| `name` | `person.name` (`profiles`) | · | required |
| `avatar` | media store + `person.avatar` | · | filtered; optional |
| the 10 basics | `attributes` (`ProfileAttribute[]`) | essential | visibility set in step 7 |
| meet scope + city | `matching` | essential | skippable |
| co-op membership | `coop` | · | boolean + "not now" state |
| `onboardingComplete` | `profiles` | · | one-off gate for Phase 2 |

Everything richer (travel, foods, bucket list, more quizzes, connection-intent rules) flows in later through the profile-depth and connection layers. Onboarding's job is only to make day one non-empty and non-creepy.

## Navigation & gating logic

```
root _layout:
  if !hasSeenWelcome         → (auth)/welcome
  else if !authenticated     → (auth)/sign-in | sign-up
  else if !onboardingComplete → (onboarding)/privacy
  else                       → (tabs)/home
```

## Acceptance criteria

- [ ] Welcome plays on first open, cannot be skipped, and auto-advances to auth.
- [ ] Every screen is one question with a progress bar and smooth transitions; tappable choices are preferred over typing.
- [ ] Order: privacy → stay-in-touch → name → photo → basics (10) → meet → review → co-op → welcome-in.
- [ ] The privacy promise is the first screen after login, read-and-continue.
- [ ] `name` is required; every other step is skippable.
- [ ] The profile photo can be taken **or** uploaded; skippable.
- [ ] The review step shows every answer with a per-row audience control and a set-all, defaulting to all friends.
- [ ] The meet step is skippable, states "friends of friends, never strangers," offers nearby/anywhere, and asks for city only.
- [ ] The deep Discover Me questionnaire is NOT in onboarding.
- [ ] Answers write to `attributes` with visibility and feed the back-end embeddings, never built from PII or photos.
- [ ] A profile-freshness re-check can appear later as a single top-of-Home question.
- [ ] Every step wears its own accent — canvas wash, blob, purpose pill and progress bar — and no step is a page of plain white cards.
- [ ] The final screen celebrates: confetti, a spring-in mark, and the three things to do next, all reduced-motion safe.
- [ ] `onboardingComplete` is set only on the final screen.

## Route files

```
apps/mobile/app/
├── (auth)/welcome.tsx          # Phase 0 · animated, non-skippable
└── (onboarding)/
    ├── privacy.tsx             # 1 · privacy promise
    ├── notifications.tsx       # 2 · stay-in-touch prefs
    ├── name.tsx                # 3 · required
    ├── photo.tsx               # 4 · take OR upload
    ├── basics.tsx              # 5 · the 10 questions
    ├── meet.tsx                # 6 · nearby / anywhere + city
    ├── review.tsx              # 7 · per-row visibility
    ├── coop.tsx                # 8 · join the co-op?
    └── welcome-in.tsx          # 9 · sets onboardingComplete

apps/mobile/content/
└── welcome.ts                  # editable beat copy + cited phone-time stat
```
