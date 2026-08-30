# Bridger — Discover Page

Build doc for the Discover tab. Maps to `apps/mobile/app/(tabs)/discover.tsx`, the `discovery` and `matching` API modules, `permissions`, and the `ProfileAttribute` model in `ARCHITECTURE.md`. Read that file first.

Discover is where existing friends become a wider circle: it surfaces the friends-of-friends worth meeting, and it's where connection approvals live. Nothing here runs until the user opts in — matching is off by default.

---

## 1 · The intro gate (opt-in)

Before any matching, a stylized **black retro** intro (tunnel rings, pixel spinning globe, arched pixel title): "Making Friends As / An Adult Is Hard." Uses the same top chrome as every other tab (`ScreenHeader`: profile photo, pixel **Discover** title, messages) sitting on top of the starry art (full-bleed; no solid black header bar). In the space under the globe (above **Get started**): "Find the friends you need." then a blank line, then "The more people you add, the better we can grow your friend group." Under the button: "You choose what you share." No em dashes, no stacked clauses. Brand fonts (pixel title, sans body) and brand CTA (metallic primary).

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

Optional, deeper personality intake feeding the private layer, **offered at Get started** (not initiated from settings — settings only keeps the on/off toggle for it). This is where the **deeper matching questions live — deliberately kept out of onboarding**: communication style, social battery (extroverted/introverted), creative vs. analytical, love language, cultural upbringing, values, humor style, and interests. Its questions live in an **authorable question bank** (a DB table you can add to). Runs in the **same Typeform style** as onboarding — one at a time, fun and visual, with **image-choice and multi-select** questions. Results write as private, matchable `ProfileAttribute`s (never shown on the profile) and refresh the person's embedding + summary.

**Location question here too.** If the person **didn't set nearby/anywhere + city during onboarding**, this flow asks it: *"friends near you, or anywhere?"* — always **friends-of-friends, never strangers** — and **city only** (never a street address) if they choose nearby. This is what a future nearby layer will read.

---

## 4 · Friend mapping & suggestions

The working surface once opted in:

- **Two friend-map types** (they render different structures — don't conflate them):
  - **Map A · a friend's friend you should meet.** Three nodes in a line: You — your mutual friend — the person to meet. The mutual friend sits *in the middle*; the dashed link is the suggested You↔them intro. This is the everyday second-degree suggestion.
  - **Map B · after you connect with someone new.** You and the new person (e.g. Sam) are now connected (solid). The map then suggests **cross-introductions**: you meet Sam's friend (Alex), and your friend (Priya) meets Sam. Priya and Sam do **not** already know each other — those are two dashed *suggested* intros, not existing edges. The map is **mirrored on the other person's side** (Sam sees his own version).
- **People you should meet — cards that lead with the overlap, not the name.** **Bridger** is the matchmaker here (not the mutual friend — the mutual is just the *connection path*). A stranger's *name* is the least interesting thing on the card, so the design inverts the hierarchy to make each card a mini-preview of the reveal (`REVEAL.md`):
  - **The shared thread is the headline** — "Same morning loop," "Chili tolerance: high," "You both shoot film" — big and bold. The **name is the subtitle**, under it.
  - **The mutual is stated as a shared connection** — "**You both know Devon**" (you're friends with Devon; so are they — Devon is the link). *Not* "Devon thinks you'd click" — Devon isn't vouching or suggesting anything; **Bridger** is. Framed clearly as Bridger's pick (e.g. a "Bridger's picks · friends of your friends" section label).
  - **Shared-signal chips** — 2–3 quick overlaps as colorful chips (Film · Morning runs · Been to Japan), so relevance is rich at a glance instead of one flat line.
  - **A spotlight for your top match** — the strongest suggestion is a bigger, tinted hero card (chips + prominent Add); the rest are lighter rows. Gives the list a focal point instead of uniform boredom.
  - **Color per interest** — each card carries its shared interest's color, so the list feels varied and alive, not a gray directory.
  - **Prefer the specific, surprising overlap** — the matcher should surface the oddly-specific thread ("Chili tolerance: high") over the safe-generic ("you both like food"). Specificity is what makes a suggestion feel human and exciting; genericness is what makes it feel like a dating app.
  - An **Add** button starts the connection → runs the reveal. Both parties must have opted in to appear.
- **Basis today: friends-of-friends.** Suggestions are people who **share a friend with you** (second-degree). **A "nearby"/location-based layer with a map is planned for later** — not built now; today it's purely the mutual-friend graph.
- **Local map teaser (dormant).** Under People to meet, Discover shows a **"Local map · Coming soon"** friend-radar preview (`LocalMapTeaser`) with the pixel map art. It is a placeholder only (no live location, no pins). Framing: opt-in friends nearby in your city (Snap Map energy, platonic), never strangers and never a dating radar. When the real layer ships, this slot becomes the live map and must stay opt-in + coarse per `PRIVACY.md`.
- **Blocks are a hole in your graph.** Anyone you've **blocked** (`FRIENDS.md`) is excluded from your suggestions entirely — never a candidate, and **never a mutual-connection bridge** (you'll never see "you both know {blocked}", and they can't route anyone to you). The exclusion is symmetric (you're gone from their suggestions too) and local to the two of you — everyone else's graph is unaffected. **"Don't suggest again"** on a card is the lighter version: it drops one person from your suggestions without a full block.
- **"Wants to connect"** cards get the same treatment — lead with the shared thread and state the mutual ("you both know Theo"), not just a name.
- Suggestions recompute after each new connection and after events (the "who you should meet" cards in `EVENTS.md` route here).

---

## 5 · Approvals live here (reconciliation)

Confirm-or-deny for incoming connections happens in Discover under **"Wants to connect"** ("Chris · via Theo" → Confirm / ✕), **not** on Friends. This finalizes the decision noted in `FRIENDS.md` and moves request handling off the `(connect)/requests` screen in `ARCHITECTURE.md` onto Discover. Friends only ever lists confirmed people.

---

## 6 · Adding someone → the reveal, and the re-accessible tab

Adding/confirming triggers the **connection reveal** from `ARCHITECTURE.md` / `REVEAL.md` (how you met → strongest link → other commonalities → close). New here: that "what you have in common" view must be **re-openable any time**, not just at the moment of connecting. So it becomes a **tab on the person's profile**:

```
person/[id]  →  tabs:  [ About them ]  [ In common ]
```

Reveal Screen 3 may also show **friends of friends** across the new bridge (up to 3, threshold-gated) when Discover matching is on, each with who + why + Add. Add posts a normal connect request that lands in the recipient's Discover "Wants to connect" list (`NOTIFICATIONS.md` `connect_request`). When Discover is off, Screen 3 shows a gentle opt-in nudge instead.

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
- [ ] Suggestion cards lead with the shared thread as the headline (name as subtitle), state the mutual as a connection ("you both know {friend}" — not a vouch), show 2–3 shared-signal chips and interest color, and mark them as Bridger's picks; the top match is a spotlight card. Only people who have also opted in appear.
- [ ] The matcher prefers the most specific/surprising shared thread over generic ones for the headline.
- [ ] Suggestions are friends-of-friends today; a nearby/location layer with a map is planned but not built now.
- [ ] Under People to meet, a dormant **Local map · Coming soon** teaser (friend-radar preview) is visible; it does not request location or show real people.
- [ ] The network map shows friends (solid) and could-meet second-degree people (dashed), including friend-to-friend cross-links.
- [ ] Connection approvals (confirm/ignore) happen on Discover, not Friends.
- [ ] Adding someone runs the reveal, and "In common" is reachable again as a tab on that person's profile.
- [ ] When two friends connect through the user, the user gets a Home notification.
