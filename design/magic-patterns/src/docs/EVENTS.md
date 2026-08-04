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

Each card: a date chip, title, time + place, and a peek of who's going (avatars + "8 going · 5 invited"). Invited cards carry inline Going / Can't buttons. **Community** stays a dormant "coming soon" placeholder — the reserved slot for a future third-party/community-events plug-in, matching the architecture.

---

## 2 · Create an event

A single form, top to bottom:

| Field | Notes |
|---|---|
| Title | required |
| Bio | short description |
| Date / time | feeds calendar + reminders |
| Place | the spot's name |
| Address | street / unit / how to get in — **only shown to people going or invited** |
| Bring | optional "bring a drink to share" |
| Chip in | optional **amount per person + method + handle + what it's for** (Venmo / Cash App / PayPal / Zelle / cash in person) — stored fields, we never process the money |
| Co-hosts | people who can edit the event, invite, and see the dashboard (not delete it) |
| Invite | pick a **handful** of people or a whole **group/tier** |
| Let friends invite friends | toggle — opens the guest list to second-degree invites |
| Suggested invites | friends-of-friends who'd vibe (from `matching`) — invite people *and* connect your friends to each other |

### Guest cap + paid expansion

Default cap is **35 guests**. Inviting beyond 35 costs a small fee, because the introduction-matching runs across every attendee and that has real cost. This is the app's first **processed payment** (distinct from the chip-in handle, which we never touch) → needs a `payments`/`billing` concern. Flagged for architecture: add a `payments` module; the chip-in handle stays a plain field.

### Suggested invites (events as matchmaking)

The create flow doesn't just list your friends — it surfaces friends-of-friends the guest list would click with, so a party grows your friends' network, not just yours. Same `matching` engine as Discover, scoped to the invite graph.

---

## 3 · Invitee view (RSVP)

What a guest sees: cover, title, host **and co-hosts**, then the two things they actually want — **tappable counts** ("3 going", "6 invited") that open a two-tab sheet of the actual people — then **The details**: what it is in the host's words, when (with countdown), where (place, plus the **full address once they're on the list**), what to bring, and the **chip-in** spelled out as amount + method + handle + why. Then:

- **RSVP** — I'm going / Can't make it.
- **Share** — a native-style share sheet (header button and an inline one): a preview card of the event, a row of friends to invite directly, then Copy link / Messages / More / QR code. Link-holders can see and RSVP; the address still waits until they're on the list.
- **Allergy share (opt-in).** "Share any food allergies with [host]?" Food allergies are **sensitive**: collected only if the guest chooses, visible **only to the host**, never to other guests, never used for matching. Opt-in every time — not a stored default.
- **Add to calendar** — one tap to Google / Apple Calendar with time + place prefilled.
- **Who you should meet** — attendees you'd vibe with, whether already **going** or still **invited**. Each card shows the shared thread ("you both love climbing"); tapping routes to **Discover** to add them and see full commonality *before* the event.

---

## 4 · Host dashboard

The host's view of their own event (see mockup):

- **Edit** — the host (or a co-host) edits their own event in place: title, day, time, place, address, what it is, what to bring, and the whole chip-in block.
- **Counts** — "3 going" / "6 invited", both **tappable**, opening the same two-tab people sheet a guest sees (co-hosts badged, no-answers marked).
- **Chipping in, first** — amount per person, the method, and the handle, stated plainly so nobody has to ask where to send it. Guests pay the host directly; we never touch it and never take a cut.
- **Co-hosts** — add anyone who said yes; they can edit and invite, but not delete.
- **Share** — the same share sheet as the guest view.
- **Who's coming** — RSVP'd attendees.
- **Introductions** — who's being introduced to whom and why ("Sam & Alex · both climbers"). This is the "who knows who / who's meeting who" map, powered by `matching` over the attendee set.
- **Allergies** — aggregated from guests who opted to share. "Only you can see these" sits **under the section header**, not inside the box — the promise reads before the data, not after it.
- **Reminders** — automatic notifications, toggleable: **2 days before** and **2 hours before** ("see you soon!"), sent via `notifications`.

---

## Data (shapes)

```ts
interface EventSummary {
  id: string;
  title: string;
  startsAt: string;
  place: string;
  role: 'host' | 'going' | 'invited';
  goingCount: number;
  invitedCount: number;
}

interface EventDetail extends EventSummary {
  hostId: string;
  bio: string;
  bring?: string;
  address?: string;             // only served to people going or invited
  coHostIds?: string[];         // can edit + invite, cannot delete
  chipInAmount?: string;        // "$5" per person
  chipInMethod?: 'Venmo' | 'Cash App' | 'PayPal' | 'Zelle' | 'Cash in person';
  chipInHandle?: string;        // plain handle — not processed by us
  chipInNote?: string;          // what it's for, in the host's words
  allowFriendsToInvite: boolean;
  cap: number;                  // default 35
  shouldMeet: MeetSuggestion[]; // from matching, scoped to attendees
}

interface HostView {
  attendees: Attendee[];
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
- [ ] Default guest cap is 35; going beyond triggers a paid expansion (real payment via `payments`).
- [ ] The chip-in is stored fields only (amount, method, handle, note) — never processed by the app, never taking a cut.
- [ ] Invitee view offers Going / Can't, add-to-calendar (Google/Apple, prefilled), and who-you-should-meet cards that route to Discover.
- [ ] Food-allergy sharing is opt-in per event, visible only to the host, and never used for matching; the "only you can see these" promise sits under the section header, not inside the box.
- [ ] "3 going" / "6 invited" are tappable everywhere they appear and open a two-tab sheet of the actual people, with co-hosts badged and non-answers marked.
- [ ] Both the guest and host views can **share** the event through a native-style sheet: event preview, direct friend invites, copy link, Messages, More, QR.
- [ ] The street address is only shown to people who are going or invited; everyone else sees why it's withheld.
- [ ] A host can **edit their own event** from the host dashboard — title, day, time, place, address, description, bring, and the full chip-in block.
- [ ] A host can add **co-hosts** from the guest list; co-hosts can edit and invite but not delete.
- [ ] Chipping in states the amount per person, the method, the handle, and what it's for — high on the host dashboard and in the guest's details.

### Touch grass on Events

- [ ] The touch grass button is the first thing on the Events page.
- [ ] **Every** friend who has touched grass is listed directly beneath the Touch Grass button (no "Who's free" heading), each showing when + what they want to do; **Home shows only the newest one**, with a link to the rest on Events.
- [ ] A signal card carries enough to want in — what they're doing, roughly where, who's already in — and **opens** for the full detail (what, when, where, who's in, which circle they told) so nobody has to message and ask.
- [ ] Saying "I'm in" tells only the person who posted it.
- [ ] Host dashboard shows counts, attendees, introductions (with the "why"), shared allergies (host-only), the chip-in handle, and reminder toggles.
- [ ] Reminders auto-send 2 days and 2 hours before when enabled.
