# Bridger — Friends Page

Build doc for the Friends tab. Maps to `apps/mobile/app/(tabs)/friends.tsx`, the `tiers` and `connections` API modules, and `TierPicker` in `ARCHITECTURE.md`. Read that file first.

Friends is intentionally the simplest tab: it is the roster of people you're **already connected to**, grouped by tier, with one entry point for adding more. It is a management surface, not a discovery or approval surface.

---

## What lives here — and what doesn't

**Here:** your confirmed friends, grouped by tier; moving people between tiers; adding a new friend (link / QR / scan); tapping through to a friend's profile.

**Not here (by decision):**
- **Friend requests / approvals.** Confirm-or-deny for people added via Discovery happens **on the Discovery page**, not Friends. Friends only ever shows confirmed connections, so it never mixes "your people" with "maybe your people." (This moves request handling off the `(connect)/requests` screen noted in `ARCHITECTURE.md` and onto Discovery — to be finalized when Discovery is designed.)
- **Search.** Not turned on yet. Its bar lives at the **top of the Friends page**, built and wired in the architecture but **dormant behind a feature flag** (`searchEnabled = false`). It shows **no "coming soon" label** — when off it simply isn't rendered; flip the flag to turn it on. The point is that the slot and backend are already there, waiting.

---

## Layout

```
┌─────────────────────────────┐
│  Friends            [+ Add] │  Header — title + add-friend entry
│  ⌕ Search  (dormant · off)  │  Search bar slot — flagged off, not rendered now
├─────────────────────────────┤
│  Close friends · 3          │  Tier section (header + count)
│  ◐ Jordan               ⠿   │  row: avatar · name · drag handle
│  ◐ Sam                  ⠿   │
│  ◐ Priya                ⠿   │
├─────────────────────────────┤
│  Friends · 3                │
│  ◐ Theo … Maya … Alex   ⠿   │
├─────────────────────────────┤
│  Acquaintances · 2          │
│  ◐ Chris … Dana         ⠿   │
├─────────────────────────────┤
│  home  cal  disc  ppl  you  │  Tab bar (Friends active)
└─────────────────────────────┘
```

- **Header** — "Friends" + an `Add` button (opens the add-friend sheet).
- **Search slot** — a search bar reserved at the top, above the roster, gated by `searchEnabled`. Off now → not rendered (no placeholder, no label). On → live people search.
- **Tier sections** — Close friends, Friends, Acquaintances, each with a live count. Order is fixed (closest first).
- **Circle caps (free vs co-op).** Free members can hold up to **10 Close friends** and **25 Friends**; **Acquaintances are unlimited** (so connection is never capped). **Co-op members lift the close/friends caps entirely and can create custom named groups** ("climbing crew," etc.) beyond the three tiers. See `COOP.md`. When a free member hits a cap, adding to that circle prompts a co-op upsell — never blocks the connection itself (the person just lands in Acquaintances).
- **Row** — filtered avatar, name, and a drag handle (⠿). Tap the row → that person's profile (`person/[id]`). Use the handle to move them between tiers.
- **Birthday treatment** — on a friend's **birthday**, their row goes festive: a **cake icon + sparkle** and a soft tint so it's unmissable (subtle in the days just before, full on the day). Only for friends who've shared their birthday with your tier. The week-ahead heads-up is a "Coming up" card in Home's announcements carousel (`HOME.md`).
- **Tiering** — drag a row into another section, or long-press → "Move to…". Writes through `tiers`; the same tier that gates visibility everywhere else in the app. This is the only place tiers are re-sorted in bulk.

---

## Add-friend flow

Opened from the header `Add`. Both doors are **instant — no request/accept** (both parties act):

| Option | What it does | State |
|---|---|---|
| Share your invite link | Generates a one-time link to send anywhere | live |
| Your QR code (shown directly) | Rendered in the sheet immediately for someone to scan — no "show" tap | live |
| Scan a QR code | Opens the camera to scan theirs | live |

The QR code is displayed inline the moment the sheet opens, so scanning theirs is the only action that needs a tap. All paths run through `connections` (`invite-links` / `qr-tokens`) and land in the connection reveal flow (`reveal/[id]`) from `ARCHITECTURE.md`, then the new person appears in the roster. Search is **not** in this sheet — it lives at the top of the page (dormant, see above).

### Removing & blocking

Two weights of action, from a friend's profile (`person/[id]`), their roster row, or a suggestion card:

- **Remove friend** — a quiet disconnect. They leave your circles and you leave theirs; no notification. You *can* reconnect or be re-suggested later. This is for "we drifted," not "I need them gone."
- **Block** — remove **plus** a permanent, protective cut:
  - **Never suggested again**, either direction — they never appear in your Discover and you never appear in theirs.
  - **Invisible + unreachable both ways** — you can't see each other's profiles or updates, and neither can message or react to the other.
  - **A hole in *your* graph.** Bridger stops using the blocked person as a **mutual-connection bridge** for you: you'll never get a "you both know {blocked}" suggestion, and they can't route anyone to you. From your side, they effectively don't exist.
  - **Everyone else is untouched.** The blocked person keeps all their *other* friendships, and everyone else's suggestions still work normally — the block only removes them from *your* view of the network. (Someone you'd have met through them can still reach you via a different mutual.)
  - **Past "how you met" references are anonymized** in your view (a connection you made "via {blocked}" no longer names them) — but that friendship itself stays.
  - Silent (they're not told) and **reversible** from Settings → Blocked (unblocking doesn't auto-reconnect you).
- **Report to moderators** — available alongside block for harmful behavior (routes to `admin`/moderation).

**Settings → Blocked** lists everyone you've blocked, with an unblock control.

**Don't suggest again** — a lighter control on a **suggestion card**: dismiss someone so they're never suggested to you again, without the full block relationship.

### How you met (connection context)

Every connection records **how you met**, shown later on that person's profile ("Met at Game Night," "Met through Priya," "Met in RiNo, Denver"):
- **Via an event** — if you connected around a shared event, the event is recorded automatically.
- **Via a mutual friend** — the reveal/Discovery path records who introduced you.
- **In person (QR/link)** — the connection reveal's **first screen** ("How did you two meet?") includes a **"Record where you met" checkbox, defaulted on**, which saves a **coarse place** ("save where you met?"). Approximate only, visible to just the two of you, editable/removable by either, stored as PII and never used by the model (see `REVEAL.md` and `DATA.md`). Unchecking skips it.
- **Discover (via a mutual)** — there usually is no place to record. The reveal offers an optional short **how-you-met note** instead. Same visibility rules (only the two of you; either can edit or remove).
- **Tier at connect:** "We just met" always starts them in **Acquaintances**. "We already know each other" optionally lets you pick Close / Friends / Acquaintances (skipping soft-defaults to Friends).

---

## Data

```ts
interface FriendsPage {
  searchEnabled: boolean;   // feature flag — false now; renders the top search bar when true
  close: FriendRow[];
  friends: FriendRow[];
  acquaintances: FriendRow[];
}

interface FriendRow {
  personId: string;
  name: string;
  avatarUrl: string;   // filtered; placeholder if none
  birthdayToday?: boolean;   // drives the festive cake + sparkle row treatment
  // no follower counts, no "friends since" leaderboards
}
```

Moving a person = a single `tiers` write updating their tier for the current user.

---

## States

- **Populated** — the grouped roster above.
- **Empty tier** — a tier with no one is hidden (no empty "Acquaintances · 0" header).
- **No friends at all** — reuse the Home cold-start invitation: "Bring your people in," with the same link / QR / scan actions. Friends and Home share one empty state so a new user meets the same clear next step wherever they land.

---

## Related: the quiz-link growth loop (feeds the reveal)

Quizzes can be shared to people **without an account**. This is a growth loop that pays off *on this page*, and it reuses the connection-reveal machinery rather than adding new surface:

1. A user shares a quiz link. A non-user opens it and takes the quiz in the browser — no account required.
2. Their answers and result are **stored locally** (localStorage / device) under the sender's referral, and they see a teaser of how they'd relate to the sender, then a prompt to create an account to see the rest.
3. On sign-up, the locally-stored answers **merge into their new profile** as `essential`/`matchable` `ProfileAttribute`s — so a latecomer isn't starting blank (this is the progressive-profiling principle in `ONBOARDING.md`).
4. When they **add the sender** (who's pre-linked via the referral), the connection reveal already has real commonality to show — "here's how you relate" — with no cold start.

Net effect: the quiz is both a fun artifact and the on-ramp, and the payoff surfaces the moment the new friend lands in this roster. This deserves its own short doc (`QUIZZES.md` / quiz-sharing) covering the local stash, the merge-on-signup, and referral attribution — flagged for next.

---

## Component / module mapping

| Piece | Component | Backend |
|---|---|---|
| Page + grouped roster | `friends.tsx` | `tiers` |
| Move between tiers | `TierPicker` | `tiers` |
| Add-friend sheet | (sheet) | `connections` |
| Row → profile | → `person/[id]` | `profiles` + `permissions` |
| Empty state | (reuse Home cold-start) | `connections` |

---

## Acceptance criteria

- [ ] Friends shows only confirmed connections — never pending requests.
- [ ] People are grouped by tier (Close friends, Friends, Acquaintances), closest first, with counts.
- [ ] Free members cap at 10 Close / 25 Friends (Acquaintances unlimited); hitting a cap prompts co-op, never blocks the connection. Co-op lifts caps and adds custom named groups.
- [ ] Empty tiers are hidden; no zero-count headers.
- [ ] A row can be moved to another tier via drag handle or long-press menu, writing through `tiers`.
- [ ] Tapping a row opens that person's profile.
- [ ] The `Add` sheet shows the user's QR code directly (no "show QR" tap), plus share-link and scan-QR as live instant paths.
- [ ] A search bar exists at the top of the page behind `searchEnabled`; when false it is not rendered and shows no "coming soon" label.
- [ ] The search backend/route is stubbed and ready so the flag is the only switch needed to enable it.
- [ ] No follower counts or "friends since" rankings appear anywhere.
- [ ] On a friend's birthday, their row shows a festive cake + sparkle treatment (only if they've shared their birthday with your tier).
- [ ] Every connection records how you met (event / mutual friend / optional coarse place); it shows on that person's profile and either party can edit or remove the place.
- [ ] A friend can be **removed** (quiet disconnect, reconnectable) or **blocked** from their profile, roster row, or a suggestion card.
- [ ] Blocking permanently stops mutual suggestions both ways, hides and un-reaches both people, and removes the blocked person as a mutual-connection bridge in the blocker's graph — while leaving all other friendships (theirs and everyone's) intact.
- [ ] Blocking is silent and reversible from Settings → Blocked; past "how you met via {blocked}" references are anonymized in the blocker's view.
- [ ] A suggestion card offers "don't suggest again" without a full block.
- [ ] With zero friends, the page shows the shared Home cold-start invitation.
