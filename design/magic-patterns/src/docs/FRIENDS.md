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
- **Row** — filtered avatar, name, and a drag handle (⠿). Tap the row → that person's profile (`person/[id]`). Use the handle to move them between tiers.
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
| Person actions (mute / remove / block / report) | `PersonActionsSheet` | `connections` + `blocks` |
| Unblock | `BlockedPeopleSheet` (Profile → Settings) | `blocks` |

---

## Leaving is as easy as arriving

Every person's profile carries a **⋯ menu** in the header, next to Messages. Nobody should have to hunt through settings to get out of a relationship, and nobody is ever notified when they do.

The menu is ordered gentlest-first, because most of the time the right answer isn't removal:

1. **Their circle** — Close / Friends / Acquaintances, changed inline. Moving someone out is quieter than removing them.
2. **Mute** — stay friends, stop seeing their updates. Fully reversible, never disclosed.
3. **Remove from your circles** — you both stop seeing each other. They are not told. You can add them again later.
4. **Block** — removed from your circles, and they cannot find you, search you, message you, or see anything you post. Not told.
5. **Report a problem** — a person reads every report.

**Remove and block both confirm** in a second sheet that states in plain words exactly what happens, then acts. After acting, the profile becomes a short receipt with an **Undo**, so a mis-tap is never permanent.

**Unblocking** lives at Profile → Settings → **Blocked people**, which lists everyone blocked with a one-tap Unblock. The person is not told either way.

Blocking is symmetric and total; removing is quiet and reversible. Neither ever sends a notification — a friendship ending should not come with an announcement.

---

## Acceptance criteria

- [ ] Friends shows only confirmed connections — never pending requests.
- [ ] People are grouped by tier (Close friends, Friends, Acquaintances), closest first, with counts.
- [ ] Empty tiers are hidden; no zero-count headers.
- [ ] A row can be moved to another tier via drag handle or long-press menu, writing through `tiers`.
- [ ] Tapping a row opens that person's profile.
- [ ] The `Add` sheet shows the user's QR code directly (no "show QR" tap), plus share-link and scan-QR as live instant paths.
- [ ] A search bar exists at the top of the page behind `searchEnabled`; when false it is not rendered and shows no "coming soon" label.
- [ ] The search backend/route is stubbed and ready so the flag is the only switch needed to enable it.
- [ ] No follower counts or "friends since" rankings appear anywhere.
- [ ] With zero friends, the page shows the shared Home cold-start invitation.
- [ ] Every person profile has a ⋯ menu in the header offering change-circle, mute, remove, block, and report.
- [ ] Remove and block each require a confirmation that states plainly what happens, and neither notifies the other person.
- [ ] After removing or blocking, the profile shows a receipt with an Undo.
- [ ] A blocked person cannot find, search, message, or see anything from the person who blocked them.
- [ ] Profile → Settings → Blocked people lists everyone blocked and unblocks in one tap.
