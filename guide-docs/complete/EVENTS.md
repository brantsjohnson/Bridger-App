# Bridger — Events Page

Build doc for the Events tab. Maps to `apps/mobile/app/(tabs)/events.tsx`, the `events` API module, and its connections to `matching`, `connections`, and `notifications` in `ARCHITECTURE.md`. Read that file first.

Events is where connection becomes in-person. It has four surfaces: the **list**, the **create** flow, the **invitee** event view (RSVP), and the **host** dashboard. Its distinctive job is turning a guest list into introductions — so the same matchmaking that powers Discover runs *inside* an event.

---

## 1 · The list (`events.tsx`)

Sectioned, closest-first:

```
┌─────────────────────────────┐
│  Events           [+ Create]│
├─────────────────────────────┤
│  Hosting     ▸ your events   │
│  Going       ▸ RSVP'd yes    │
│  Invited     ▸ RSVP pending  │
│  Community   ▸ coming soon   │  dormant placeholder
└─────────────────────────────┘
```

Each card: a date chip, title, time + place, and a peek of **who you know going** (avatars + "3 friends going") — never a raw invited/going total. Invited cards carry inline Going / Can't buttons. **Community** stays a dormant "coming soon" placeholder — the reserved slot for a future third-party/community-events plug-in, matching the architecture.

---

## 2 · Create an event

Create is a **full-screen, four-step wizard** (its own analytics surface, `create_event`, launched from the Events `+`), not a popup. The `+` and the empty-state button both open it. It holds one draft in memory and walks the host through four steps, then lands on the new event's page to share.

**Step 1 — Details.**

| Field | Notes |
|---|---|
| Title | required |
| Bio | short description |
| Date / time | tap-to-pick (no keyboard) — feeds calendar + reminders |
| Place | short spot name |
| Address | **live address lookup** via OpenStreetMap Nominatim (free, no key); tap a match to fill address + place. PRIVACY: the typed text goes to OSM only to geocode the host's own venue, with no name/account attached; falls back to manual entry if offline. Address is visible only to people going or invited. |
| Co-host | pick one friend — they can edit the event **and their acquaintances join the invite pool** on step 2 |
| Bring | optional "bring a drink to share" |
| Chip in | optional payment **handle** (Venmo / Cash App) — a stored link, we don't process it |
| Let friends invite friends | toggle — opens the guest list to second-degree invites |

**Step 2 — Invite (de-identified).** Search a single merged pool of **your acquaintances plus your co-host's acquaintances**. PRIVACY: the list is de-identified and sorted A-Z by first name, so you can **never tell whose acquaintance someone is** — you just see people you could invite. Tap to add or remove; the 35-guest cap applies. (Live: the merge + de-identification happen server-side over the `matching` invite graph.)

**Step 3 — Photo + sign-ups.**
- **Cover photo.** Add a cover photo (recommended **1200 x 675, 16:9**, shown as helper text so hosts can design one) or pick an **emoji**. If skipped, a random emoji cover is chosen at create time so the event still has a face. **MEDIA EXCEPTION:** Bridger is capture-only everywhere except **two** spots — the profile photo and this **event cover** — which may be uploaded from the library. That is intentional.
- **Who's bringing what.** A sign-up list modeled on the Bucket List: the host adds bring-items, and each row has a **name dropdown** (avatar + first name + last initial, e.g. "Maya O."). Claiming an item **crosses it off**; it can be re-opened or re-assigned from the same dropdown. Each item also has an optional **per-item chip-in handle** so a guest can send money instead of bringing the thing. Being assigned schedules a **1-day and 2-hour** "bring your thing" reminder (via `notifications`; stubbed in the front-end demo).

**Step 4 — Preview + create.** A read-only render of the event exactly as guests will see it, then the **Create event** button. On create we emit `event_created` with **booleans + counts only** (`has_cohost`, `has_chip_in`, `has_cover`, `assignment_count`, `invited_count`) — never the title, bio, or address text — and route to the new event page.

After creating, the host lands on the **event page** where they can **Share** (native share sheet) or **Copy link**.

### Guest cap (free vs co-op)

Hosting is **never gated** — anyone can host. But scale is a co-op benefit: the default cap is **35 guests** (free); **co-op members can host up to 100** (`COOP.md`). The larger cap has real cost, because the introduction-matching runs across every attendee — which is exactly the kind of expensive-at-scale feature the co-op covers. (This supersedes the old standalone per-event expansion fee; scale rides on membership, not a separate SKU — see `COOP.md` payment note.)

### Suggested invites (events as matchmaking)

The create flow doesn't just list your friends — it surfaces friends-of-friends the guest list would click with, so a party grows your friends' network, not just yours. Same `matching` engine as Discover, scoped to the invite graph.

---

## 3 · Invitee view (RSVP)

The detail page leads with **clear, complete event info** (see mockup): title, **host (+ any co-host)**, **date & time**, the **full address** (tap → map), a **bio / description**, what to bring, and the chip-in line. Then:

- **Meaningful, tappable counts — never a raw invited/going total.** An event isn't a popularity readout. A guest sees two numbers that matter *to them*, and **each is tappable**:
  - **"{N} going"** — people **you know** going → tap to see **who's coming** (the ones you know).
  - **"{N} to meet"** — attendees **Bridger suggests you'd click with** → tap to see them (routes to Discover).
- **Share** — a share button opens the **native iOS/Android share sheet**: share the event with friends (in-app) or copy a **link**.
- **RSVP** — Going / Can't make it.
- **Allergy share (opt-in).** "Share any food allergies with [host]?" Food allergies are **sensitive**: collected only if the guest chooses, visible **only to the host**, never to other guests, never used for matching. Opt-in every time — not a stored default.
- **Add to calendar** — one tap to Google / Apple Calendar with time + place prefilled.
- **Who you should meet** — the attendees behind the "to meet" count; each card shows the shared thread ("you both love climbing"); tapping routes to **Discover**.

---

## 4 · Host view (editable)

The host's own view of their event — and it's **fully editable in place** (an **Edit** control; you can change every detail after creating, which you currently can't). It shows:

- **Tappable counts** — **"{N} going"** (tap → who's coming) and **"{N} invited"** (tap → who you invited). The host *does* see the invited list — that's functional planning, not the vanity number hidden from guests.
- **Co-host** — add a **co-host** (they can edit and manage the event too). Shown at the top with the host.
- **Chip-in (top of the page).** If the host wants help covering costs, they set **an amount** ("$8 suggested · for tacos") and **the method + handle** — e.g. **Venmo @maya-r**, **Cash App $mayar**, or "send to {person}" — so guests know exactly *how much* and *where to send it*. It's a plain link/handle the app never processes.
- **Introductions** — who's being introduced to whom and why ("Sam & Alex · both climbers"), from `matching` over the attendee set.
- **Allergies** — aggregated from guests who opted to share. **The "Only you can see this" note sits *under the Allergies header*, not inside the box** (it labels the section, not the data).
- **Reminders** — automatic, toggleable: **2 days before** and **2 hours before**, via `notifications`.

---

## 5 · Touch grass on the Events page

Because Events is where plans happen, the **Touch Grass button lives here too** (as well as Home), and **below it, the touch-grass signals**: friends who want to get out.

- **One featured** signal at a time (the freshest / most relevant), then **the rest listed below**.
- **Each shows enough to know *why*** — the person, when (now / tonight / this weekend), and a short line ("anyone want to grab food + walk?").
- **Each card has a split action row: "I'm in" and "Details."** "I'm in" says yes right there; "Details" (or tapping anywhere on the card) opens the full signal sheet. The old ✕ still quietly dismisses it from the list.
- **The detail sheet offers "I'm in" and "Quietly decline."** Declining tells the poster nothing — it just clears the card for you. Same touch-grass mechanics as `TOUCHGRASS-AND-QUIZ.md` — no counts, no public "no," private who's-in.
- **PRIVACY — the circle is never fully named.** A signal shows it went to **Close** or **Friends**, but an **Everyone** broadcast shows *no* circle label, so a wide send never looks less personal than a close-circle one.

---

## Data (shapes)

```ts
interface EventSummary {
  id: string;
  title: string;
  startsAt: string;
  place: string;
  role: 'host' | 'going' | 'invited';
  friendsGoingCount: number;    // people the viewer knows going (shown)
  peopleToMeetCount: number;    // relevant suggestions for the viewer (shown)
  // no public invited/going totals surfaced to guests
}

interface EventDetail extends EventSummary {
  hostId: string;
  coHostIds: string[];          // co-hosts can edit/manage
  bio: string;                  // description
  address: string;              // full address (maps link)
  bring?: string;
  chipIn?: {                    // optional; app never processes it
    amount?: string;            // "$8 suggested"
    note?: string;              // "for tacos"
    methods: { kind: 'venmo' | 'cashapp' | 'other'; handle: string }[];
  };
  allowFriendsToInvite: boolean;
  cap: number;                  // default 35 (co-op 100)
  shouldMeet: MeetSuggestion[]; // from matching, scoped to attendees
}

interface HostView {           // editable in place
  invitedCount: number;        // host-only (tap → invited list)
  goingCount: number;          // tap → who's coming
  attendees: Attendee[];
  invited: Attendee[];
  introductions: Introduction[];   // pairwise, with the "why"
  sharedAllergies: string[];       // host-only, opt-in
  reminders: { twoDays: boolean; twoHours: boolean };
}

interface RsvpInput {
  status: 'going' | 'cant';
  allergies?: string;              // opt-in; host-only
}
```

---

## Module mapping

| Piece | Backend |
|---|---|
| List, create, detail, RSVP | `events` |
| Suggested invites · who-you-should-meet · introductions | `matching` |
| "Add them" from who-you-should-meet | `connections` (routes to Discover) |
| Auto reminders (2d / 2h) | `notifications` |
| Guest-cap expansion payment | **`payments` (new module — flag)** |
| Chip-in handle | plain field on `events` (not processed) |

---

## Acceptance criteria

- [ ] List groups events into Hosting / Going / Invited; Community is a dormant "coming soon" placeholder.
- [ ] Create supports inviting a handful or a whole group/tier, plus a "let friends invite friends" toggle.
- [ ] Create surfaces friend-of-friend suggested invites from `matching`.
- [ ] Hosting is free (never gated); the guest cap is 35 for free members and 100 for co-op members (see `COOP.md`).
- [ ] The chip-in handle is a stored link only — never processed by the app.
- [ ] Invitee view offers Going / Can't, add-to-calendar (Google/Apple, prefilled), and who-you-should-meet cards that route to Discover.
- [ ] Food-allergy sharing is opt-in per event, visible only to the host, and never used for matching.
- [ ] Guests see only "{N} going" (people they know) and "{N} to meet" — never a raw invited/going total — and both counts are tappable.
- [ ] The event detail clearly shows host (+ co-host), date/time, full address (maps link), a bio/description, bring, and the chip-in line; a Share button opens the native iOS/Android share sheet (share with friends or copy link).
- [ ] The host view is fully editable in place; it shows tappable "{N} going" (→ who's coming) and "{N} invited" (→ who you invited).
- [ ] The host can add a co-host who can also edit/manage.
- [ ] The chip-in sits at the top and includes an amount and a method + handle (Venmo / Cash App / person); the app never processes it.
- [ ] The Allergies "Only you can see this" note sits under the header, not inside the box.
- [ ] The Events page shows the Touch Grass button with friend signals listed directly under it (no separate "Who's free" heading), each showing when + what they want to do, with a split "I'm in" / "Details" action row; tapping the card opens a detail sheet offering "I'm in" or "Quietly decline."
- [ ] A signal only ever names the **Close** or **Friends** circle; an **Everyone** send shows no circle label at all.
- [ ] Host view shows introductions (with the "why"), shared allergies (host-only), and reminder toggles.
- [ ] Reminders auto-send 2 days and 2 hours before when enabled.
