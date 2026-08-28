# Bridger — Onboarding Flow

Build doc for the very first run. Maps to `apps/mobile/app/(auth)/welcome.tsx` and the `apps/mobile/app/onboarding/index.tsx` container in `ARCHITECTURE.md`. Read that file first — this doc only details the onboarding slice and assumes the data model (`ProfileAttribute`, `Tier`, `Layer`) and module names from it.

---

## CURRENT FLOW (2026 rebuild) — this is what ships

The run was rebuilt to feel full, visual, and animated, with four "the internet promised X, instead Y" stat interstitials woven between the questions. This section is the source of truth; the older detailed sections below are kept for history and are superseded where they disagree.

**Order** (single container `apps/mobile/app/onboarding/index.tsx`, driven by `hooks/useOnboarding.ts`):

1. **Confirm profile** — first name, last name, profile photo (take or upload). Name required.
2. **Birthday** — the drill-down picker (year → month → day), then a white "Is this right?" panel with the date and two stacked full-width answers ("Yes, that is my birthday" / "No, pick again"). The panel is anchored at the top of the body, the same place the year, month and day cells start, so it does not jump between stages. Required; no skip.
3. **Stat 1 · Feed reality** — "supposed to connect us, instead it's all about ads." Animated feed of 10 cards, 9 ads / 1 friend. Bridge: "Let's try again."
4. **Contacts** — "Bridger's a group chat on steroids." Connect contacts (Apple / Android permission, on-device only) + **Invite 3 friends** as three separate slots labelled "Invite friends #1 / #2 / #3". Each slot opens the contact picker or the system share sheet. On web there is no contacts book and no share sheet, so Connect contacts says so plainly (it does not mark itself connected) and a slot falls back to copying the invite link. A share that cannot happen shows a sentence on the screen, never an error page. Skippable.
5. **Stat 2 · Isolation** — "supposed to help us make friends, instead it isolated us." Top: **1 in 12** Americans have no close friends. Middle: pie chart (12% + 48%, rest faint). Bottom: **1 in 2** have only 1–4 close friends. Source: Survey Center on American Life (2021).
6. **Friends of friends** — "Friends of your friends, never strangers." / "Stop swiping to make friends." Multi-select what kind of friend you could use right now: workout, go out, creative, industry, travel, nearby, someone who gets me, plus "All of the above" (ticks every row and sprays every option emoji). Quiet note: all answers are private. Skippable.
7. **Stat 3 · Retention** — "supposed to keep us in touch, instead it kept us scrolling." 240 thumbnails, all but 5 dissolve.
8. **Notifications** — six coarse rows with emojis: birthdays, life updates, friends you should meet, activities & hangouts, direct messages, reconnect reminders. Each row carries the phone's own system switch, and **every switch starts off**: nothing is pre-selected for you. "All of the above" turns every switch on and sprays every emoji. Skippable. (Native OS permission dialog is a follow-up; see below.)
9. **Taste intro** — "Let's fill out some of your profile!" Words pop in one at a time with haptics, then auto-advances after 4 seconds (or Let's go sooner).
10. **Right now** — "Let's have some fun!" Split into two asks stacked on one screen: "What do you currently do?" with its typing box, then "What's your dream to do for work?" with its typing box, plus "Change anytime. Always optional." Skippable.
11. **Obsession** — the song on repeat: connect Spotify / Apple Music, or type it. Skippable.
12. **Social battery** — nights out per week as one bar of cells, **0 through 7+**, so "no nights out" is the 0 cell in the bar rather than a separate opt-out box. Nothing is highlighted until they tap. Skippable.
13. **Your color** — pick a color; live grid-background preview uses the chosen color. Skippable.
14. **Your places** — hometown and current town as text (towns only); favorite place via map search that seeds a FAV pin on Places traveled. Skippable.
15. **Recap** — share a quick voice update: big heading "Share quick updates with your friends," one question by the mic ("Best part of your week?"), up to 20 second voice memo (no typing option on this screen). Skippable. No "Q1 of 5" chrome; onboarding is one question only.
16. **Privacy & control** — audience per shared item (birthday, job, dream job, place traveled, song, weekly recap) with Close / Friends / Acquaintances + set-all, and a legal footer linking Terms + Privacy. Chip: "Privacy First."
17. **Stat 4 · Screen time** — "supposed to help us live life, instead we became the product." An 80-year life colors in one beat at a time: the whole life, then sleeping (26.6 years), then upkeep (work and school, chores, commuting, exercise), then devices (23.3 years), then 4.0 years spent in person with people. Each beat opens a short years accordion under that color band (previous band collapses) so lower rows slide down; tap a filled band later to reopen its row. Thick bright year-bars match the caption color for each beat. Under the bars: "(Average over 80 years)". Captions (average note + each beat line) type in letter by letter; Reduce Motion shows the full line at once. "Let's try again" appears only after the last caption finishes typing. Sources: Eyesafe 2025 (device time) and BLS American Time Use Survey (the rest). Work/school hours are averaged across all 80 years, including childhood, weekends, holidays, and retirement.
18. **Co-op** — Option A: invite 3 friends for free access (shows `N/3 already invited` when some slots were filled on Contacts; when all 3 are done, shows "Continue with free access"). Option B: join directly, $6/mo (shares profits). Auth code for a free year: the "Have an auth code?" link appears only after 10 seconds on this screen so join and invite stay front and center. No separate "use free tier" skip: free access is only via the invite path. Member perks list matches the Co-op page (`MEMBER_UNLOCKS`). Promise box: "No ads."
19. **Welcome in** — sets `onboardingComplete`, lands on Home (unchanged).

**Progress bar:** the four stat screens and welcome-in do not count; the bar reflects real question screens only. It is the design's segmented bar: a white strip outlined in blue with one segment per question, filling pink, and "3/14" beside it.

**Look:** onboarding keeps its own shape language (square white boxes, hard 2px ink outlines, square pink Continue button), documented in DESIGN.md § "Onboarding is its own room". **Colors match the app:** accent blue headings (`#1D6FE8`), pink Continue (`#FF3E8A`), pale blue selected wash (`#BBD6FB`), amber chips, coral kickers, teal for on-switches, eggshell canvas. The four stat screens invert it (flat accent-blue page, white type). It is light only, so dark mode never muddies the paper. Nothing in this shape language is used outside onboarding.

**Layout rule:** every step is pinned to the height of the display, the body takes the leftover room, and the button row is glued to the bottom, so Continue never moves between steps. On iOS it rises above the keyboard. Only birthday and color scroll their body.

**Demo mode:** every save stays in memory (no Supabase writes), so the whole run can be previewed with `EXPO_PUBLIC_DEMO_MODE=1` and a cleared `bridger.onboardingComplete` flag.

**Removed / retired from the previous flow:** the standalone privacy-promise screen, the ranked desire step, the separate name and photo screens (now combined into confirm-profile), the groups-explainer screen, and the near/anywhere meet step. Their components and analytics ids are kept in the repo so historical events still parse.

**Now live (were follow-ups):**
- **Native notification permission** — after the Notifications step, `lib/notifications.ts` shows the real OS dialog once (only when at least one nudge is chosen), via `expo-notifications`. Saying no never dead-ends the run.
- **Real profile-photo upload** — `lib/pick-image.ts` opens the camera or photo library (`expo-image-picker`, permission asked in context), previews the square crop, and `data/onboarding.savePhoto` uploads it through the shared `lib/media-upload` helper and points `PATCH /me { avatarMediaId }` at the new `media` row.
- **Recap voice capture + upload** — `RecapStep` records up to 20s with `expo-audio` (mic asked in context), lets you play the take back, and `data/onboarding.saveRecap` uploads the clip via `lib/media-upload` and stores the `mediaId` on the `weekly_recap` attribute.
- **Video upload** — reuses the same shared path already used app-wide (`CircleRecorder` video replies + `CaptureCompose` story updates → `lib/media-upload`). Onboarding itself has no video step.

**Known follow-ups (not blockers):**
- Music-account OAuth: live Spotify authorize + live Apple Music (MusicKit) authorize; demo mode fakes connected state.

---

## The shape: two phases, one gate each

```
First app open ──► [ Phase 0 · Welcome ] ──auto──► [ Phase 1 · Auth ] ──► [ Phase 2 · Onboarding ] ──► Home
                    non-skippable, one-off            create account          essential layer + desire seed
```

- **Phase 0 (Welcome)** happens *before* an account exists and is seen **once, ever**. Gated by `hasSeenWelcome`.
- **Phase 2 (Onboarding)** happens *after* the account is created and fills the **essential layer**, a short **connection-style (desire)** preference that seeds Home, and a two-tier join choice. Gated by `onboardingComplete`.
- A returning user hits neither and lands straight on Home.

---

## Narrative spine: "we're trying again"

Every step rides a one-line refrain. Phase 0 names the broken promises with strong words (alone, drift, FOMO, sold us stuff). Phase 2 answers each promise with the actual thing they do about it. Purpose lines stay short; the ask stays tappable.

This is product onboarding, not the Assistant. Billy stays founder-only and is never in signup.

---

## Design principles (apply to every screen)

1. **Typeform feel — one question per screen.** A single ask, big and clean, with a **progress bar** and **smooth transitions** (slide/fade, breathe). Answer, transition, next. Never a stacked form.
2. **Fun and visual.** Prefer **tappable choices over typing**: single-select, **multi-select**, **image-choice**, and **ranking** tiles. Typing only where it's genuinely needed (name, city).
3. **Purpose before ask.** Each question is prefaced by one short "trying again" purpose line so the person always knows *why*.
4. **Clean, plain wording.** Short sentences, no jargon. No em dashes.
5. **Welcome is non-skippable and auto-advancing.** It flows into auth on its own.
6. **Keep it short.** Onboarding collects essentials + connection style + notifications + one meeting question + join tier. The deep matching / personality questions are **not** here — they live in Discover Me, later (see `DISCOVER.md`).

This one-question-at-a-time pattern is the **same pattern used by every profile module and quiz** (see "Module flow" below) — onboarding is just the first place the person meets it.

---

## Phase 0 · Welcome (`(auth)/welcome.tsx`)

One continuous animated sequence — either a required video or an animated type-out of text beats (design choice; the beat list below drives either). No skip. When the last beat finishes, it **auto-navigates to auth** with no tap.

### Beat sequence (source of truth: `apps/mobile/content/welcome.ts`)

| # | Beat | Feel |
|---|---|---|
| 1 | "The internet promised to bring us closer. Instead we've never felt more alone." | quiet open |
| 2 | "It promised to keep us in touch. Instead we drift apart." | building |
| 3 | "It promised to help us live our lives. Instead we just watch everyone else live theirs." | turn |
| 4 | *[phone-time stat — see note]* | emotional low |
| 5 | "It promised community. Instead it just sold us stuff." | gut punch |
| 6 | "So we're trying again." | lift |
| 7 | "Welcome to Bridger." → fades into auth | resolve |

> **Phone-time stat (beat 4):** use a real, cited figure before shipping — do not hardcode a made-up number. Store the copy + source in `content/welcome.ts` so it's editable without touching the screen. Present it visually (a filling bar, a shrinking life, etc.), not as plain text.

### Behavior
- Plays automatically on first open.
- No skip, no scrub, no back.
- On completion → `router.replace('(auth)/sign-in')`.
- Sets `hasSeenWelcome = true` (device-local before account; persisted to the profile once the account exists, so a reinstall on the same account doesn't replay it).

---

## Phase 1 · Auth (`(auth)/sign-in.tsx`)

One Sign in screen. **Continue with Google** and **Continue with Apple** are the main paths: first use creates the account (then onboarding); returning use signs in and goes Home (or onboarding if incomplete). Email + password stays as a secondary "Sign in with email" for existing password accounts. There is **no separate Create account screen** (old `/sign-up` redirects here).

---

## Phase 2 · Onboarding (`(onboarding)/`)

One screen per step, Typeform-style, in order. **Privacy comes first** — the promise sets the tone before a single question is asked. Then the **desire** step (what they want Bridger to prioritize), then the rest.

| # | Step | Purpose line | The ask | Input |
|---|---|---|---|---|
| 1 | **Privacy promise** | "It watched everything and asked for nothing. Here, your privacy is yours." | Read the promise, continue | acknowledge |
| 2 | **What you want** (desire) | "It decided what you saw. Here, you decide." | What do you want most from Bridger? | **rank** the four options (below) |
| 3 | **Stay in touch** | "It let us drift. What should we nudge you about?" | What should we nudge you about? | **multi-select**: close friends' updates · birthdays · big moments · events |
| 4 | Basics · name | "Just you, for the people who already like you." | Your name | text (**required**) |
| 5 | Basics · photo | "Just you, for the people who already like you." | Add your photo | **take or upload** · skippable |
| 6 | Basics · questions | "A few things friends want to know." | 10 quick questions | Typeform run (below) |
| 7 | **Meet new people** | "It filled our feeds with strangers. Bridger only ever connects you through friends you already have." | Nearby or anywhere? | choice + city · **skippable** |
| 8 | **Privacy & visibility** | "You decide who sees what. Always." | Set who sees each answer | per-row audience + set-all |
| 9 | **How do you want to join?** | "It promised free, then made us the product. Here's how Bridger actually stays alive." | Join the co-op, invite 3 for free access, or auth code | join / invite / redeem (below) |
| 10 | Welcome in | "You're in. We set this up for how you want to stay close." | — | Continue → Home (already seeded) |

### Step notes

- **1 · Privacy promise (first).** Right after login, before anything is asked: a short, warm promise — *"Privacy is crucial, and it's yours. You control all of it. We only ever use your info to connect you with your friends and people worth meeting — never to sell you."* Read-and-continue, not a form. Trust before the ask.
- **2 · What you want (desire).** Short ranked pick of what Bridger should prioritize for *them*. Writes `connection_style` and seeds a named Home layout preset (see Desire step below). Deterministic mapping. No model. Not matching identity.
- **3 · Stay in touch.** Notification prefs (multi-select): close friends' updates · birthdays · big moments · events. Writes `notifications` prefs. Can lean on the desire ranking (e.g. "make plans" suggests events checked by default) but the person can change any toggle.
- **4–6 · The basics.** Name (required) → photo → 10 quick questions.
  - **Photo — take OR upload.** Unlike stories (which are capture-only), the **profile photo can be uploaded from the library *or* taken in-app.** Optional house filter for a shared look; skippable → default placeholder.
  - **The 10 questions** (below) are simple, tappable where possible, and the things friends actually want to know. Only `name` is required; each question is skippable.
- **7 · Meet new people (skippable).** The only connection question in onboarding, kept simple. Lead with the promise: **friends of your friends — never strangers.** One choice: **People near me** / **People anywhere** (both friends-of-friends). **City only** if nearby (never a street address; reuses the city from the basics if given). The deep Discover Me questionnaire is **not** here — it runs later in Discover. If this step is skipped, the same nearby/anywhere + city question appears when they first open Discover.
- **8 · Privacy & visibility.** The summary, and the first time they use the sharing model. Copy: *"These are set to all your friends for now — change any of it, anytime. You'll build custom groups later."* Every answer is a **row with an audience control** (All friends / Close / Friends) plus a **"set all."** They learn the tiers by using them. Writes each answer's `visibleToTier`.
- **9 · How do you want to join?** **Join the co-op**, **invite 3 friends** for free access, or redeem an **auth code**. Soft join. See Join screen below and `COOP.md`.
- **10 · Welcome in** — writes `onboardingComplete`, applies the Home layout seed from step 2, lands on Home.

### The desire step (connection style)

One screen. Rank (or pick top-first) these four short options. Opaque keys only in analytics and storage (never free-text rants).

| Option (UI copy) | Key | Pillar it maps to |
|---|---|---|
| Stay close with people I already have | `frequency` | Frequency (stories, coming up, nudges) |
| Go deeper with my people | `depth` | Depth (modules, quiz, inside jokes) |
| Actually make plans happen | `plans` | Plans (events, touch grass) |
| Meet the right people through friends | `commonality` | Commonality (Discover / friends-of-friends) |

Writes:

```ts
connection_style: {
  primary: 'frequency' | 'depth' | 'plans' | 'commonality';
  ranking: Array<'frequency' | 'depth' | 'plans' | 'commonality'>; // full order if ranked
  home_layout_seed: 'stay_close' | 'go_deeper' | 'make_plans' | 'meet_people';
}
```

#### Deterministic Home preset mapping

No LLM. Primary desire → named Home layout seed. Admin still owns the global default; onboarding **seeds the per-user starting arrangement** from that seed. The person can always rearrange later (`home_layout_saved`). See `HOME.md` and `ADMIN.md`.

| Primary desire | `home_layout_seed` | What leads on day-one Home | Empty-state teach first |
|---|---|---|---|
| `frequency` | `stay_close` | Stories + Coming up / announcements + Notifications preview high | Post a story / catch up |
| `depth` | `go_deeper` | Stories still present; quiz / inside jokes / freshness-style prompts higher | One depth module invite later in week 1 |
| `plans` | `make_plans` | Events / touch-grass answer cards near top; announcements lean plans | Start a hang / open Events |
| `commonality` | `meet_people` | Soft Discover path clearer; meet prefs already set if they answered meet | Add friends / friends of friends |

Bones stay the same for everyone. Desire only changes **order**, **which empty states teach first**, and **notification defaults lean**. Widgets are not permanently hidden from one answer.

### The join screen (two tiers)

Copy (tight):

> **Don't be the product, join the co-op**
> Members get perks and share the profits. Free access unlocks when you invite 3 friends.
>
> - **Join the co-op** · about $6/mo ($72/year)
>   Member perks match the Co-op page list (`MEMBER_UNLOCKS`): Make it yours, Bigger circles, Post video, Ask the group, Daily recaps, Keep everything, Host up to 100. No ads. You fund it, you own a piece of it.
>
> - **Invite 3 friends** (free access / Free Lite benefits once complete)
>   All the essentials to stay connected. No ads. Stories, Inside Jokes, Bucket list, 5 Close / 30 Friends, unlimited acquaintances, 30 days of rolling history. Auth code grants a free year of membership instead.

**Guardrail:** "Limited" applies to **expression and scale only** (rolling 30-day storage, photo/text not video, 5/30 circle caps, weekly not daily recap, host extras). It never limits **connection** (adding people, messaging, meeting people, attending events, viewing content). Soft-join stub today (`COOP.md`). Free Lite is only via invite 3 friends (or an auth code for a free year of co-op); there is no early "use free tier" skip on this screen. The auth-code link is delayed 10 seconds after the screen opens.

Confirmed outcome (not the first tap that merely opens a payment sheet): product event `onboarding_tier_chosen` with `method: coop | free_lite`, plus `coop_joined` when a soft join / IAP actually completes.

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

Each answer writes an `attribute` (visibility set in step 8) and feeds the back-end embedding + summary.

---

## Module flow (Typeform — used by onboarding, profile modules, and quizzes)

Every fill experience — onboarding, the profile modules (`PROFILE-MODULES.md`), and quizzes — uses the **same one-question-at-a-time pattern**:

- **One question per screen**, a **progress bar**, and a **smooth transition** between questions (slide/fade; respects reduced-motion).
- **Question types:** single-select, **multi-select**, **image-choice** (pick from picture tiles), short text, date, this-or-that, ranking. Prefer tappable types over typing; make it fun and visual.
- **Skippable** where optional; **save-and-resume** for profile modules (cancel = nothing saved).
- **Ends with a review** — for profile modules, the Review & share step (set-all + per-row visibility). Onboarding's visibility step is this review.
- **Writes to the database** as `attributes` (one row per answer, each with its visibility), and **feeds the AI layer** below.

---

## AI back-end (embeddings + summaries — invisible to the user)

Answers don't just sit in fields — they build the person's **de-identified AI profile** used for matching:

- As answers are saved, the backend generates **embeddings + a short summary** of the person ("early riser, creative, values deep 1:1s") — **from their matchable, de-identified facts only**, keyed by opaque IDs. **The user never sees these**; they're for the matcher to read (see `DATA.md`, Zone C). Never trained on PII/likeness.
- The desire / `connection_style` preference is **not** matching identity. It only seeds the person's own Home layout and notification lean. It does not enter embeddings.
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
| `connection_style` | `profiles` / `user_settings` | — | primary + ranking + `home_layout_seed`; own-Home only |
| `home_layout` | `feed` (per-user layout) | — | seeded from desire → preset; user can rearrange later |
| `name` | `person.name` (`profiles`) | — | required |
| `avatar` | media store + `person.avatar` | — | filtered; optional |
| likes | `attributes` (`ProfileAttribute[]`) | essential | defaults from `permissions/defaults.ts` |
| notification prefs | `notifications` | — | from Stay in touch |
| co-op membership | `coop` | — | `coop` or Free Lite (via invite 3 / continue after invites) |
| `onboardingComplete` | `profiles` | — | one-off gate for Phase 2 |

Everything richer — travel, foods, bucket list, more quizzes, Discover Me — is **not** collected here. It flows in later through the profile-depth and connection layers, exactly as designed. Onboarding's job is to make day one non-empty, non-creepy, and already pointed at what they said they want.

---

## Navigation & gating logic

```
root _layout:
  if !hasSeenWelcome        → (auth)/welcome
  else if !authenticated    → (auth)/sign-in
  else if !onboardingComplete → (onboarding)/privacy
  else                      → (tabs)/home
```

- Welcome → auto-advances to auth (no button).
- Each onboarding screen advances on continue; skippable screens show "Skip for now."
- `welcome-in.tsx` is the only place `onboardingComplete` is set to true (and where the Home layout seed is applied if not already written).

---

## Acceptance criteria

- [ ] Welcome plays on first open, cannot be skipped, and auto-advances to auth on completion.
- [ ] Welcome beats use the "promised / instead / trying again" refrain (copy in `content/welcome.ts`).
- [ ] Every screen is one question, Typeform-style, with a progress bar and smooth transitions; tappable/multi-select/image/rank choices are preferred over typing.
- [ ] Onboarding order: privacy promise → desire → stay-in-touch → name → photo → basics (10) → meet (skippable) → privacy & visibility review → join (co-op / Free Lite) → welcome-in.
- [ ] Desire step ranks four opaque options and seeds a named Home preset deterministically (no model).
- [ ] Join screen offers **Join the co-op**, **invite 3 friends** for free access (Continue after 3), or **auth code**; no early free-tier skip; Free Lite limits expression/scale only, never connection; no ads.
- [ ] The privacy promise is the first screen after login (read-and-continue), before any question.
- [ ] `name` is required; every other step is skippable (desire may default to `frequency` / `stay_close` if skipped).
- [ ] The profile photo can be **taken or uploaded** (unlike stories, which are capture-only); skippable.
- [ ] The 10 basics are simple, skippable, mostly tappable, and things friends want to know.
- [ ] The review step shows every answer with a per-row audience control and a "set all", defaulting to All friends, and teaches the tier model by use.
- [ ] The meet step is skippable, states "friends of friends, never strangers," offers nearby/anywhere, and asks for **city only** (never street address) when nearby.
- [ ] The deep Discover Me / personality questionnaire is NOT in onboarding; it runs later in Discover.
- [ ] Answers write to `attributes` (with visibility) and feed the back-end AI embeddings + summary, which the user never sees and which is never built from PII/photos. Desire prefs do not enter embeddings.
- [ ] A profile-freshness re-check can appear later as a single top-of-Home question when the model looks stale.
- [ ] `onboardingComplete` is set only on the final screen; a returning onboarded user lands on Home.

---

## Files (2026 rebuild — one container, one step per component)

```
apps/mobile/app/
├── (auth)/welcome.tsx                 # Phase 0 — animated, non-skippable
└── onboarding/index.tsx               # the container: renders the ordered steps

apps/mobile/hooks/
└── useOnboarding.ts                    # order + draft + save-on-advance + progress

apps/mobile/components/onboarding/
├── onboarding-theme.ts                 # the paint: tan paper, blue, navy, pink, amber
├── onboarding-ui.tsx                   # the parts: heading, chip, tile, field, CTA, step bar
├── OnboardingStep.tsx                  # the frame every step sits in (pinned layout)
├── StepTransition.tsx                  # the slide between steps
├── ConfirmProfileStep.tsx              # 1 · name + photo
├── BirthdayStep.tsx                    # 2 · birthday (reused)
├── StatScreen.tsx                      # the 4 stat interstitials (variant prop)
├── ContactsStep.tsx                    # 4 · connect contacts + invite #1/#2/#3
├── FriendsOfFriendsStep.tsx            # 6 · matching-style multi-select
├── NotificationsStep.tsx               # 8 · six coarse chips
├── TasteIntroStep.tsx                  # 9 · fun lead-in
├── RightNowStep.tsx                    # 10 · job + dream job
├── ObsessionStep.tsx                   # 11 · song / connect music
├── SocialBatteryStep.tsx              # 12 · nights out 0..7+
├── ColorStep.tsx                       # 13 · color + grid preview
├── PlacesStep.tsx                      # 14 · hometown / current text + favorite map search
├── OnboardingPlacePicker.tsx           # favorite place: WorldMapSvg + geocode search
├── RecapStep.tsx                       # 15 · voice memo or typed
├── PrivacyControlStep.tsx              # 16 · per-row audience + legal footer
├── CoopStep.tsx                        # 18 · invite 3 free / join $6/mo
└── WelcomeInStep.tsx                   # 19 · sets onboardingComplete → Home

apps/mobile/data/onboarding.ts          # per-step saves (demo in-memory + live)
apps/mobile/content/welcome.ts          # editable welcome beat copy
```
