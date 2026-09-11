# Bridger — Friends Page

Build doc for the Friends tab. Maps to `apps/mobile/app/(tabs)/friends.tsx`, the `tiers` and `connections` API modules, and `TierPicker` in `ARCHITECTURE.md`. Read that file first.

Friends is intentionally the simplest tab: it is the roster of people you're **already connected to**, grouped by tier, with one entry point for adding more. It is a management surface, not a discovery or approval surface.

---

## What lives here — and what doesn't

**Here:** your confirmed friends, grouped by tier; moving people between tiers; adding a new friend (link / QR / scan); tapping through to a friend's profile; a search bar **right under Your circle** (name / handle only; query text is never logged).

**Not here (by decision):**
- **Friend requests / approvals.** Confirm-or-deny for people added via Discovery happens **on the Discovery page**, not Friends. Friends only ever shows confirmed connections, so it never mixes "your people" with "maybe your people." (This moves request handling off the `(connect)/requests` screen noted in `ARCHITECTURE.md` and onto Discovery — to be finalized when Discovery is designed.)

---

## Layout

```
┌─────────────────────────────┐
│  Friends        [Add friend]│  Header — labeled Add friend (not a lone +)
├─────────────────────────────┤
│  Friend Pod …               │  Weekly recap block (above the roster)
│  Inside jokes …             │  Quotes wall (above the roster)
├─────────────────────────────┤
│  Your circle [Edit] [Add friend]│  Roster block + Edit + Add friend
│  ⌕ Search friends           │  Filters people already in your circle
│  Close friends · 3          │  Tight under Your circle / search
│  ◐ Jordan · song / book ⠿   │  row: avatar · name · vibe line · handle
│  ◐ Sam · song / book    ⠿   │  (song of the week, else book — not mutuals)
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

- **Friend Pod** — weekly recap above the roster. Questions lock themselves each Monday (rose / thorn / bud + the most-voted extras). The pixel play button (right) opens `/recap` and starts the listen. The arrow (or the rest of the card) opens `/recap` paused. This week is free. Co-op members can open earlier locked weeks. Recording ends with which friend group hears it (Close / Friends / Acquaintances). Spec: `complete/RECAP-PODCAST.md`.
- **Inside jokes** — two newest **square** notes above the roster. A photo note slowly flips between the quote and the photo. Add opens a **full-screen** composer (X to close): type on the square note, pick color, **search** who said it, optionally **search** an event. Co-op may add one photo. A new post is the first note here and also lands on your Profile wall and the tagged friend's wall. Spec: `PROFILE.md`.
- **Header** — "Friends" + a labeled **Add friend** button (opens the add-friend sheet). Not a lone `+` icon. The sheet leads with **Connect your contacts**.
- **Search** — a search bar **right under Your circle** filters people already in your circle (name / handle). It never logs the query text. It does not search Discover or invent new people.
- **Roster block** — section titled **"Your circle"** (not "Friends"), so the page title, the block title, and the middle tier do not all say the same word. **Edit** and the same **Add friend** control sit beside this title. Close friends starts tight under the search (later tiers keep more space).
- **Tier sections** — Close friends, Friends, Acquaintances, each with a live count. Order is fixed (closest first).
- **Circle caps (free vs co-op).** Free Lite can hold up to **5 Close friends** and **30 Friends**; **Acquaintances are unlimited** (so connection is never capped). **Co-op members get 25 Close and 125 Friends, plus custom named groups** ("climbing crew," etc.) beyond the three tiers. See `COOP.md`. When someone hits a cap, adding to that circle never blocks the connection itself (the person just lands in Acquaintances). Free Lite can be offered co-op.
- **Row** — filtered avatar, name, and a drag handle (⠿). Tap the row → that person's profile (`person/[id]`). Use the handle to move them between tiers.
- **Birthday treatment** — on a friend's **birthday**, their row goes festive: a **cake icon + sparkle** and a soft tint so it's unmissable (subtle in the days just before, full on the day). Only for friends who've shared their birthday with your tier. The week-ahead heads-up is a "Coming up" card in Home's announcements carousel (`HOME.md`).
- **Tiering** — drag a row into another section, or long-press → "Move to…". Writes through `tiers`; the same tier that gates visibility everywhere else in the app. This is the only place tiers are re-sorted in bulk.

---

## Add-friend flow

Opened from the header **Add friend** button or the matching **Add friend** beside Your circle. **Connect your contacts** is the first door (pick someone, save their number, open the card you made). QR / link / scan stay instant — no request/accept (both parties act):

| Option | What it does | State |
|---|---|---|
| Share your invite link | Generates a one-time link to send anywhere | live |
| Your QR code (shown directly) | Rendered in the sheet immediately for someone to scan — no "show" tap | live |
| Scan a QR code | Opens the camera to scan theirs | live |

The QR code is displayed inline the moment the sheet opens, so scanning theirs is the only action that needs a tap. All paths run through `connections` (`invite-links` / `qr-tokens`) and land in the connection reveal flow (`reveal/[id]`) from `ARCHITECTURE.md`, then the new person appears in the roster. Search is **not** in this sheet — it lives at the top of the page and only filters people already in your circle.

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
  searchEnabled: boolean;   // true — search under Your circle filters name / handle
  close: FriendRow[];
  friends: FriendRow[];
  acquaintances: FriendRow[];
}

interface FriendRow {
  personId: string;
  name: string;
  avatarUrl: string;   // filtered; placeholder if none
  birthdayToday?: boolean;   // drives the festive cake row treatment
  /** Song of the week (preferred) or book they're reading — roster subtitle */
  song?: { title: string; artist: string };
  book?: { title: string; author: string };
  // no mutual counts, follower counts, or "friends since" on the roster
}
```

Moving a person = a single `tiers` write updating their tier for the current user.

### Pending people (not on Bridger yet)

**Connect your contacts** lives on Friends (Add friend sheet and the empty state), not as a dump of the address book. After **Not now / Continue**, the phone asks for contacts permission. Names and numbers stay on the device. When you pick one person we save **that one** E.164 number on an author-only `pending_people` card and open the profile **you** made (`pending/[id]`). You can fill private notes there (same Notes & reminders as a real friend). We never upload the whole address book.

When that number later signs up, `merge_pending_people_for_user` attaches your notes and a friend connection to their real account and notifies you (`friend_joined`). Their real profile replaces your card. They do not see your notes. The pending card is marked merged.

Onboarding still has invite slots for the "invite 3 for free access" path. Friends is where you connect contacts to make cards.

---

## States

- **Populated** — the grouped roster above.
- **Empty tier** — a tier with no one is hidden (no empty "Acquaintances · 0" header).
- **No friends at all** — Friends empty state says **Connect your contacts**, then link / QR / scan as backup. Home still says "Bring your people in." If you only have pending cards (nobody has joined yet), Friends shows **Not on Bridger yet** instead of the empty card.

---

## Related: the quiz-link growth loop (feeds the reveal)

**Which "J" name are you** ships this loop. Other quizzes can reuse it later.

1. A user shares their invite link (`/q/<token>`). A friend opens it and **takes the quiz with no Bridger account**.
2. Their first result stays **on that device** (tied to the share token). They see a you-vs-them teaser (the duo %) and a prompt to make an account or add the friend.
3. On sign-up, that first result is uploaded (`jname_results`, first finish only). Fun retakes stay local and are not uploaded.
4. Resolving the share **adds the sharer as a friend** (`made_via: link`). After onboarding they land back on the quiz result so both can see the duo / friend board.

We do **not** turn J-name answers into Discover `ProfileAttribute`s. The payoff is the friendship + the duo result, not a cold-start matching profile. Progressive-profiling via quiz answers remains a later idea.

---

## Component / module mapping

| Piece | Component | Backend |
|---|---|---|
| Page + grouped roster | `friends.tsx` | `tiers` |
| Move between tiers | drag into group (Edit) + `TierPicker` fallback | `tiers` |
| Add-friend sheet | (sheet) | `connections` + contacts picker |
| Row → profile | → `person/[id]` | `profiles` + `permissions` |
| Card you made | → `pending/[id]` | `pending_people` + `friend_notes` |
| Empty state | Friends: Connect your contacts | `pending_people` |

---

## Acceptance criteria

- [ ] Friends shows confirmed connections, plus author-only **Not on Bridger yet** cards. Never friend-request inboxes.
- [ ] People are grouped by tier (Close friends, Friends, Acquaintances), closest first, with counts.
- [ ] Free Lite caps at 5 Close / 30 Friends (Acquaintances unlimited); co-op is 25 Close / 125 Friends plus custom named groups. Hitting a cap never blocks the connection (they land in Acquaintances).
- [ ] Empty tiers are hidden; no zero-count headers.
- [ ] A row can be moved to another tier via drag handle or long-press menu, writing through `tiers`.
- [ ] Tapping a row opens that person's profile.
- [ ] Header shows a labeled **Add friend** button. Your circle shows **Edit** plus the same **Add friend** control. Not a lone `+` in the header. Close friends sits tight under Your circle / search.
- [ ] The `Add` sheet shows a real scannable QR (deep link encoded) the moment it opens. **Scan a code** opens the live camera (`expo-camera` `CameraView`, `barcodeTypes: ['qr']`); reading a friend's Bridger QR redeems it instantly (no code to type or paste). Camera permission is asked in context and denial degrades gracefully (turn-on / Open Settings prompt). Tapping a friend's invite link routes through `app/invite/[token].tsx`, which redeems when signed in (or stashes it and redeems right after sign-in). All paths land in the connection reveal (`reveal/[id]`). Demo uses the same URL shape (with a "Try sample invite" button because one phone cannot scan its own screen); live uses `invite_links` / `qr_tokens`.
- [ ] Roster rows show song of the week (or book they're reading), never mutual counts; mutuals live on the friend profile → In common.
- [ ] The search bar sits right under Your circle and filters people already in your circle by name or handle; query text is never logged.
- [ ] No follower counts or "friends since" rankings appear anywhere.
- [ ] On a friend's birthday, their row shows a festive cake + sparkle treatment (only if they've shared their birthday with your tier).
- [ ] Every connection records how you met (event / mutual friend / optional coarse place); it shows on that person's profile and either party can edit or remove the place.
- [ ] A friend can be **removed** (quiet disconnect, reconnectable) or **blocked** from their profile, roster row, or a suggestion card.
- [ ] Blocking permanently stops mutual suggestions both ways, hides and un-reaches both people, and removes the blocked person as a mutual-connection bridge in the blocker's graph — while leaving all other friendships (theirs and everyone's) intact.
- [ ] Blocking is silent and reversible from Settings → Blocked; past "how you met via {blocked}" references are anonymized in the blocker's view.
- [ ] A suggestion card offers "don't suggest again" without a full block.
- [ ] With zero friends and zero pending cards, Friends shows **Connect your contacts** (plus link / QR / scan). Picking a contact saves that one number and opens the card you made.
- [ ] Pending cards appear under **Not on Bridger yet**. Notes you write there stay after the person joins with the same number.
- [ ] Adding an Inside Joke is a full-screen page (not a tiny sheet). Search friends and events instead of listing every chip. Notes are square. A posted note is newest on Friends and on the poster's + tagged person's Profile walls. A photo on the note is co-op only and flips quote ↔ photo.

---

## Changelog

| Date | Change |
|---|---|
| 2026-09-09 | Inside Joke notes are square. A photo note flips quote ↔ photo. |
| 2026-09-09 | Edit moved from the Friends header to Your circle (next to Add friend). Close friends sits tighter under that block. |
| 2026-09-09 | Inside Joke add is full-screen: type on the note, pick color, search who said it / an event, co-op photo. Newest-first on Friends and both walls. |
