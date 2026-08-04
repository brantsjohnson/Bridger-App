# Bridger — Discover Page

Build doc for the Discover tab. Maps to `apps/mobile/app/(tabs)/discover.tsx`, the `discovery` and `matching` API modules, `permissions`, and the `ProfileAttribute` model in `ARCHITECTURE.md`. Read that file first.

Discover is where existing friends become a wider circle: it surfaces the friends-of-friends worth meeting, and it's where connection approvals live. Nothing here runs until the user opts in — matching is off by default.

---

## 1 · The intro gate (opt-in)

Before any matching, a stylized **black-and-white retro** screen (wireframe globe on a perspective grid): "Making friends as an adult is hard." One simple sentence beneath it — "Bridger introduces you to the friends of friends worth knowing." — a **Get started** button, and a short line: "You choose what you share." No em dashes, no stacked clauses.

Tapping Get started flips the **Discoverable** master switch on **and launches the Discover Me questionnaire right there** (not tucked in settings). Completing it is optional but it's offered at the moment of opting in, when intent is highest. Bridger can already match on the about-me data and existing quiz results, so matching works even if the questionnaire is skipped.

The gate is shown once to opt in, and its content is reachable again from Discover settings so a user can turn matching back off.

---

## 2 · What you're matched on — two layers

This reuses the `ProfileAttribute` model directly. Every match signal is one of two kinds:

| Layer | Examples | Visibility | Matchable | Shown on profile? |
|---|---|---|---|---|
| **About me** | foods, hobbies, hometown, places traveled, morning/night owl | everyone (or tier) | yes | **yes** |
| **Personality signals** | love language, social battery, personality type, cultural upbringing, values, communication style, humor style | **no one** | yes | **no** |

In `ProfileAttribute` terms: about-me items are `visibleToTier: 'acquaintance'+` and `matchable: true`; personality signals are `visibleToTier: 'none'` (private) and `matchable: true`. Same store, different tags — the model already supports this, so no new data shape is needed, only the `'none'` visibility value for private-but-matchable.

### The reassurance UX (settings)

Discover settings shows the user **what** they're matched on without exposing **how** it's scored:
- **About me · everyone can see** — the public categories, each with a check.
- **Quizzes · results shared, scoring private** — the onboarding quiz and Discover Me questionnaire as toggles.
- A locked note: personality signals help matching but never appear on the profile.

So the user sees "I'm being matched on things about me that are fine for others to see, plus my quiz results" — reassuring — without Bridger revealing the measured dimensions.

### The master + source toggles

- **Discoverable** (master): off → all matching stops and the user isn't findable or suggested to anyone.
- **Per-source** toggles: onboarding quiz, Discover Me questionnaire, about-me usage. **Turning off all quiz sources turns matching off** (nothing left to match on) → effectively not findable, same as flipping the master off.

---

## 3 · The Discover Me questionnaire

Optional, deeper personality intake feeding the private layer, **offered at Get started** (not initiated from settings — settings only keeps the on/off toggle for it). Its questions live in an **authorable question bank** (a DB table you can add to), so new dimensions can be added without shipping code. Results write as private, matchable `ProfileAttribute`s. Never shown on the profile. This is the richer version of the onboarding quiz for people who want better matches; it can be retaken later, but it's presented up front at opt-in.

---

## 3b · "Match me on" — the module stack (top of Discover)

**The first thing on the Discover tab, populated or empty.** Before Bridger can introduce anyone worth knowing it needs something to match on, so on day one the tab is not a blank "no suggestions yet" — it's a stack of short modules you can knock out.

**Placement is deliberate.** The modules sit **above** requests and suggestions so they read as something to get out of the way, not an optional extra buried under empty results. A `done/all` count and a progress bar make the set feel finishable, and a completed module collapses to a muted row with a check that can be re-opened to change your answers.

**Nobody has to take them all**, or any. Each is independent; matches simply get better with each one answered.

**The promise, stated before every single module.** A matching module always opens on a dedicated privacy screen — never a question — reading *"These answers are never shared. They are only used to connect you with more relevant friends. Nobody sees them, they never appear on your profile, and you can delete them any time."* This is `ModuleFlow`'s **private mode**: same one-question-per-screen flow as every profile module, but there's no audience picker at the end (there's no audience), just the promise restated and **"Use this to match me."** The reasoning: people only answer honestly when they know where the answers go, and a promise buried in settings isn't a promise.

**Two kinds of entry**, rendered identically apart from a small `quiz` tag: a **module** (a few questions) and a **quiz** (same flow, framed with a result).

**Adding modules and quizzes is an admin action, not a code change.** The registry lives in one array (`state/match-modules.ts` in the prototype, an authorable table in production). Add an entry — title, one-line blurb, emoji, accent, questions — and it appears at the top of Discover for everyone, in the order listed. Remove it and it's gone. This is the same authorable-question-bank idea as the Discover Me intake, extended to whole modules.

Shipping set: How you spend a weekend · Your social battery · What you find funny (quiz) · How you eat · How you move · What matters to you (quiz).

---

## 4 · Friend mapping & suggestions

The working surface once opted in:

- **Two friend-map types** (they render different structures — don't conflate them):
  - **Map A · a friend's friend you should meet.** Three nodes in a line: You — your mutual friend — the person to meet. The mutual friend sits *in the middle*; the dashed link is the suggested You↔them intro. This is the everyday second-degree suggestion.
  - **Map B · after you connect with someone new.** You and the new person (e.g. Sam) are now connected (solid). The map then suggests **cross-introductions**: you meet Sam's friend (Alex), and your friend (Priya) meets Sam. Priya and Sam do **not** already know each other — those are two dashed *suggested* intros, not existing edges. The map is **mirrored on the other person's side** (Sam sees his own version).
- **People you should meet** — cards, each showing the **mutual friend** and the **shared thread**: "Alex · via Sam · you both love climbing." Both parties must have opted in for anyone to appear. An **Add** button starts the connection.
- Suggestions recompute after each new connection and after events (the "who you should meet" cards in `EVENTS.md` route here).

---

## 5 · Approvals live here (reconciliation)

Confirm-or-deny for incoming connections happens in Discover under **"Wants to connect"** ("Chris · via Theo" → Confirm / ✕), **not** on Friends. This finalizes the decision noted in `FRIENDS.md` and moves request handling off the `(connect)/requests` screen in `ARCHITECTURE.md` onto Discover. Friends only ever lists confirmed people.

---

## 6 · Adding someone → the reveal, and the re-accessible tab

Adding/confirming triggers the **connection reveal** from `ARCHITECTURE.md` (strongest link → other commonalities). New here: that "what you have in common" view must be **re-openable any time**, not just at the moment of connecting. So it becomes a **tab on the person's profile**:

```
person/[id]  →  tabs:  [ About them ]  [ In common ]
```

`In common` replays the same commonality content on demand. This means `person/[id]` in `ARCHITECTURE.md` gains a tabbed layout, and the reveal component is reused inside it.

---

## 7 · Mutual-connection notification (the communal payoff)

When two of your friends connect **through you** (you're the mutual link), you get a Home notification: "Sam and Alex just connected — through you." It's the small reward for being the bridge, and it reinforces the communal loop the whole app is built around. Delivered via `notifications`, surfaced in Home's touch-grass/co-op signal area.

---

## Data (shapes)

```ts
interface DiscoverSettings {
  discoverable: boolean;           // master
  sources: {
    aboutMe: boolean;
    onboardingQuiz: boolean;
    discoverMe: boolean;
  };
}

interface Suggestion {
  personId: string;
  viaFriendId: string;             // the mutual friend
  sharedThread: string;            // the "why", human-readable
  bothOptedIn: true;               // invariant — never suggest a non-opted-in person
}

interface ApprovalRequest {
  personId: string;
  viaFriendId?: string;
}

// ProfileAttribute gains one visibility value:
type Tier = 'close' | 'friend' | 'acquaintance' | 'none';  // 'none' = private but matchable
```

---

## Module mapping

| Piece | Backend |
|---|---|
| Gate + opt-in + settings | `discovery` |
| Match computation, suggestions, network map | `matching` + `permissions` |
| Discover Me question bank + results | `quizzes` (question bank) → private `ProfileAttribute`s |
| Approvals (confirm/ignore) | `connections` |
| Reveal + "In common" profile tab | `connections` (reveal) reused in `person/[id]` |
| Mutual-connection notification | `notifications` |

---

## Acceptance criteria

- [ ] Matching is off until the user passes the intro gate; the gate flips the Discoverable master switch.
- [ ] About-me signals are visible + matchable; personality signals are matchable but visible to no one and never shown on the profile.
- [ ] Settings shows what the user is matched on (categories + quiz results) without exposing scoring dimensions.
- [ ] Turning off Discoverable, or all quiz sources, stops matching and makes the user unfindable/unsuggested.
- [ ] The Discover Me questionnaire is optional, its questions come from an authorable bank, and results stay private.
- [ ] Suggestions show the mutual friend and shared thread, and only ever include people who have also opted in.
- [ ] The network map shows friends (solid) and could-meet second-degree people (dashed), including friend-to-friend cross-links.
- [ ] Connection approvals (confirm/ignore) happen on Discover, not Friends.
- [ ] Adding someone runs the reveal, and "In common" is reachable again as a tab on that person's profile.
- [ ] When two friends connect through the user, the user gets a Home notification.
