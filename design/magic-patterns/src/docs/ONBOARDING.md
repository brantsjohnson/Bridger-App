# Bridger — Onboarding Flow

Build doc for the very first run. Maps to `apps/mobile/app/(auth)/welcome.tsx` and the `apps/mobile/app/(onboarding)/` route group in `ARCHITECTURE.md`. Read that file first. This doc only details the onboarding slice and assumes the data model (`ProfileAttribute`, `Tier`, `Layer`) and module names from it.

## The shape: two phases, one gate each

```
First app open ──► [ Phase 0 · Welcome ] ──auto──► [ Phase 1 · Auth ] ──► [ Phase 2 · Onboarding ] ──► Home
                    non-skippable, one-off          create account         the essential layer
```

**Phase 0 (Welcome)** happens before an account exists and is seen once, ever. Gated by `hasSeenWelcome`.
**Phase 2 (Onboarding)** happens after the account is created and fills the **essential** layer, a short **desire** preference that seeds Home, and a two-tier join. Gated by `onboardingComplete`.
A returning user hits neither and lands straight on Home.

**Narrative spine:** "the internet promised X. Instead Y. So we're trying again." Strong words (alone, drift, sold us stuff) stay on purpose. Full source of truth: `guide-docs/complete/ONBOARDING.md`.

## Design principles (apply to every screen)

- **Typeform feel.** One question per screen. A single ask, big and clean, with a progress bar and smooth transitions. Answer, transition, next. Never a stacked form.
- **Fun and visual.** Prefer tappable choices over typing: single-select, multi-select, image-choice, ranking tiles. Typing only where genuinely needed (name, city).
- **Purpose before ask.** Each question is prefaced by one short "trying again" purpose line in a solid pill in the step's color.
- **A color per step.** Every step owns an accent from the palette and wears it fully: a washed canvas, a big soft blob behind the question, a colored purpose pill and a matching progress bar. The run reads as a sequence of rooms, not a form. Order: privacy `blue` → desire `purple` → stay-in-touch `amber` → name `purple` → photo `pink` → basics `teal` → meet `green` → review `blue` → co-op `coral` → welcome-in `amber`. Inside a step, content carries color too (promise cards, choice tiles, tier chips), never a page of white cards.
- **The tiers are color-coded** wherever they appear: Close `pink`, Friends `blue`, Everyone `teal`.
- **Clean, plain wording.** Short sentences, no jargon. No em dashes, and never the word "AI" (see `COOP.md`).
- **Welcome is non-skippable and auto-advancing.**
- **Keep it short.** Essentials + desire + notifications + one meeting question + join. The deep matching questionnaire lives in Discover Me (`DISCOVER.md`).

This one-question-at-a-time pattern is the same one every profile module and quiz uses. Onboarding is just where the person first meets it.

## Phase 0 · Welcome (`(auth)/welcome.tsx`)

One continuous animated sequence of text beats. No skip, no scrub, no back. When the last beat finishes it auto-navigates to auth with no tap. Copy lives in `content/welcome.ts`.

| # | Beat | Feel |
|---|------|------|
| 1 | "The internet promised to bring us closer. Instead we've never felt more alone." | quiet open |
| 2 | "It promised to keep us in touch. Instead we drift apart." | building |
| 3 | "It promised to help us live our lives. Instead we just watch everyone else live theirs." | turn |
| 4 | [phone-time stat] | emotional low |
| 5 | "It promised community. Instead it just sold us stuff." | gut punch |
| 6 | "So we're trying again." | lift |
| 7 | "Welcome to Bridger." | resolve |

**Phone-time stat (beat 4):** use a real, cited figure before shipping. Copy + source live in `content/welcome.ts` so they're editable without touching the screen. Present it visually (a filling bar), not as plain text.

On completion → `(auth)/sign-up`, and `hasSeenWelcome = true` (device-local pre-account, persisted to the profile once it exists).

## Phase 1 · Auth (`(auth)/sign-up.tsx`, `sign-in.tsx`)

Owned by `auth`. Google and Apple OAuth alongside email. New account → `(onboarding)`. Existing onboarded account → Home.

## Phase 2 · Onboarding (`(onboarding)/`)

Privacy comes first. Then the desire step. Then essentials, meet, visibility, and the two-tier join.

| # | Step | Purpose line | The ask | Input |
|---|------|--------------|---------|-------|
| 1 | Privacy promise | "It watched everything and asked for nothing. Here, your privacy is yours." | How this works | acknowledge |
| 2 | What you want (desire) | "It decided what you saw. Here, you decide." | What do you want most from Bridger? | rank four options |
| 3 | Stay in touch | "It let us drift. What should we nudge you about?" | What should we nudge you about? | multi-select |
| 4 | Basics · name | "Just you, for the people who already like you." | Your name | text (required) |
| 5 | Basics · photo | "Just you, for the people who already like you." | Add your photo | take **or** upload · skippable |
| 6 | Basics · questions | "A few things friends want to know." | 10 quick questions | Typeform run |
| 7 | Meet new people | "It filled our feeds with strangers. Bridger only ever connects you through friends you already have." | Nearby or anywhere? | choice + city · skippable |
| 8 | Privacy & visibility | "You decide who sees what. Always." | Set who sees each answer | per-row audience + set-all |
| 9 | How do you want to join? | "It promised free, then made us the product. Here's how Bridger actually stays alive." | Join the co-op or Free Lite | two cards |
| 10 | Welcome in | "You're in. We set this up for how you want to stay close." | — | Continue → Home |

### Desire options (rank)

- Stay close with people I already have (`frequency` → `stay_close`)
- Go deeper with my people (`depth` → `go_deeper`)
- Actually make plans happen (`plans` → `make_plans`)
- Meet the right people through friends (`commonality` → `meet_people`)

Seeds a named Home layout preset deterministically. No model. See guide-docs `ONBOARDING.md`.

### Join cards

- **Join the co-op** · about $6/mo ($72/year). Everything unlocked. No ads.
- **Free Lite.** Limited use for expression/scale, essentials to stay connected still here. No ads. Photos and text, 30-day rolling history.

### Step notes

- **1 · Privacy promise.** Read-and-continue, not a form. You control all of it; nothing is sold; what you share is only used to connect you.
- **2 · Desire.** Rank the four options. Writes `connection_style` + Home seed.
- **3 · Stay in touch.** Multi-select: close friends' updates · birthdays · big moments · events. Writes `notifications` prefs.
- **4–6 · The basics.** Name (required) → photo → 10 quick questions.
- **Photo: take OR upload.** The profile photo is the one place uploads are allowed; stories stay capture-only. One house filter is applied either way. Skippable → filtered placeholder.
- **7 · Meet (skippable).** Lead with the promise: friends of your friends, never strangers. One choice: people near me / people anywhere. City only if nearby, never a street address. If skipped, the same question appears on first opening Discover.
- **8 · Privacy & visibility.** Every answer is a row with an audience control (Close / Friends / All) plus a set-all, defaulting to all friends. They learn the tiers by using them. Writes each answer's `visibleToTier`.
- **9 · Join.** Two cards: co-op or Free Lite (`COOP.md`). Soft join; Free Lite is first-class, not a guilty skip.
- **10 · Welcome in.** An arrival, not a receipt. A full amber screen with confetti falling behind it, a bloom of accent-colored circles that springs open, "You're in." at 40px, and the one honest line: *no feed to scroll, just the people you actually know*. Beneath it, the three things that actually happen next — add your people · post your first story · say when you are free — each on a bordered card with its own colored token, staggering in. Then a single **Let's go**. Every bit of motion is skipped under reduced-motion. This is the only place `onboardingComplete` is set (and where the Home seed is applied if needed).

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

Each answer writes an attribute (visibility set in step 8) and feeds the back-end embedding + summary. Desire prefs do not enter embeddings.

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
| `connection_style` | `profiles` / `user_settings` | · | primary + ranking + Home seed |
| `home_layout` | `feed` (per-user) | · | seeded from desire preset |
| notification prefs | `notifications` | · | multi-select |
| `name` | `person.name` (`profiles`) | · | required |
| `avatar` | media store + `person.avatar` | · | filtered; optional |
| the 10 basics | `attributes` (`ProfileAttribute[]`) | essential | visibility set in step 8 |
| meet scope + city | `matching` | essential | skippable |
| co-op membership | `coop` | · | co-op or Free Lite |
| `onboardingComplete` | `profiles` | · | one-off gate for Phase 2 |

Everything richer (travel, foods, bucket list, more quizzes, Discover Me) flows in later through the profile-depth and connection layers. Onboarding's job is to make day one non-empty, non-creepy, and already pointed at what they said they want.

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
- [ ] Welcome beats use the "promised / instead / trying again" refrain.
- [ ] Every screen is one question with a progress bar and smooth transitions; tappable choices are preferred over typing.
- [ ] Order: privacy → desire → stay-in-touch → name → photo → basics (10) → meet → review → join (co-op / Free Lite) → welcome-in.
- [ ] Desire ranks four opaque options and seeds a named Home preset.
- [ ] Join offers Join the co-op or Free Lite; no ads tier; connection never limited.
- [ ] The privacy promise is the first screen after login, read-and-continue.
- [ ] `name` is required; every other step is skippable.
- [ ] The profile photo can be taken **or** uploaded; skippable.
- [ ] The review step shows every answer with a per-row audience control and a set-all, defaulting to all friends.
- [ ] The meet step is skippable, states "friends of friends, never strangers," offers nearby/anywhere, and asks for city only.
- [ ] The deep Discover Me questionnaire is NOT in onboarding.
- [ ] Answers write to `attributes` with visibility and feed the back-end embeddings, never built from PII or photos. Desire prefs do not enter embeddings.
- [ ] A profile-freshness re-check can appear later as a single top-of-Home question.
- [ ] Every step wears its own accent: canvas wash, blob, purpose pill and progress bar, and no step is a page of plain white cards.
- [ ] The final screen celebrates: confetti, a spring-in mark, and the three things to do next, all reduced-motion safe.
- [ ] `onboardingComplete` is set only on the final screen.

## Route files

```
apps/mobile/app/
├── (auth)/welcome.tsx          # Phase 0 · animated, non-skippable
└── (onboarding)/
    ├── privacy.tsx             # 1 · privacy promise
    ├── desire.tsx              # 2 · what you want (rank → Home seed)
    ├── notifications.tsx       # 3 · stay-in-touch prefs
    ├── name.tsx                # 4 · required
    ├── photo.tsx               # 5 · take OR upload
    ├── basics.tsx              # 6 · the 10 questions
    ├── meet.tsx                # 7 · nearby / anywhere + city
    ├── review.tsx              # 8 · per-row visibility
    ├── coop.tsx                # 9 · Join the co-op / Free Lite
    └── welcome-in.tsx          # 10 · sets onboardingComplete

apps/mobile/content/
└── welcome.ts                  # editable beat copy + cited phone-time stat
```
