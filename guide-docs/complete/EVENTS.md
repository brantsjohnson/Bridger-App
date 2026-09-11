# Bridger — Events Page

Build doc for the Events tab. Maps to `apps/mobile/app/(tabs)/events.tsx`, the `events` API module, and its connections to `matching`, `connections`, and `notifications` in `ARCHITECTURE.md`. Read that file first.

Events is where connection becomes in-person. It has five surfaces: the **gate** (first-time host marketing page), the **list**, the **create** flow, the **invitee** event view (RSVP), and the **host** dashboard. Its distinctive job is turning a guest list into introductions — so the same matchmaking that powers Discover runs *inside* an event.

---

## 0 · Events gate (first visit)

Before the user has **explored Events** (or ever hosted), the Events tab shows a Discover-style marketing page instead of Touch Grass + the calendar.

```
┌─────────────────────────────┐
│  Events                     │  no + / messages on the gate
├─────────────────────────────┤
│  Create places where        │
│  memories happen.           │
│  Plans, dinners, clubs…     │
│                             │
│  [=== idea chips scrolling] │  centered in the middle
│                             │
│  [ Explore Events ]         │  pinned at the bottom
└─────────────────────────────┘
```

- **Headline:** "Create places where memories happen."
- **Wall:** three offset horizontal marquees of small decorative idea chips (political activism / share-ideas first, then book club, game night, Sunday dinner, cocktail night, movie night, poetry, etc.) plus miniature Touch Grass marks (same green Sprout icon as the Touch Grass button). Chips bleed off the screen edges and loop seamlessly (no hard restart). Chips are **not** tappable for prefill. The wall sits in the **vertical middle** of the screen.
- **Chrome:** gate hides header `+` and messages so the first look stays title + picture + Explore. After Explore, both shortcuts return on the normal list.
- **Canvas:** black intro (`Screen tone="intro"`), same family as the Discover gate, with the drifting graph-paper grid behind the headline and chips. Headline and body are white. After Explore, Events returns to the eggshell canvas.
- **CTA:** "Explore Events" sits at the **bottom** (above the tab bar), dismisses the gate, and opens the normal Events list (Touch Grass + calendar). It does **not** open the create wizard. Header `+` opens create on the list after Explore.
- **Exit:** after Explore once (saved on device) or after the user hosts their first event, the gate never returns. The normal list appears (real Touch Grass, Hosting/Going/Invited, calendar empty state when empty).
- **Reduce Motion:** freeze marquees (chips stay visible).
- **QA:** `EXPO_PUBLIC_FORCE_EVENTS_GATE=1` shows the gate even when host fixtures exist. Tapping Explore Events still dismisses it. The flag must not pin the user on the marketing page.

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
│  Community   ▸ coming soon   │  same teaser layout as Discover Local map (art card + Coming soon chip)
└─────────────────────────────┘
```

Each card: a date chip, title, time + place, and a peek of **who you know going** (avatars + "3 friends going") — never a raw invited/going total. Invited cards carry inline Going / Can't buttons. **Community** stays a dormant "coming soon" placeholder in the same card style as Discover's Local map teaser (pixel street art + short promise) — the reserved slot for a future third-party/community-events plug-in, matching the architecture.

---

## 2 · Create an event

Create is a **full-screen, four-step wizard** (its own analytics surface, `create_event`, launched from the Events `+`), not a popup. The `+` and the empty-state button both open it. It holds one draft in memory and walks the host through four steps, then lands on the new event's page to share.

**Step 1 — Details.**

| Field | Notes |
|---|---|
| Event title\* | required (red asterisk) |
| Details | short description (was "Bio") |
| Day / time | Google-Calendar style: tap date → month grid; tap time → 15-min list |
| Repeats | optional toggle. Off = one-off (`recurrence` null). On = weekly / monthly / yearly rule (interval, weekdays or month day / Nth weekday, ends never / on date / after N). One row per series; `starts_at` is the next occurrence. Preview + event page show a short human label under When. |
| Address | **live address lookup** via Photon (Komoot / OpenStreetMap) for fuzzy autocomplete; Nominatim fallback. Tap a match to fill address + short place name. No separate Place field. PRIVACY: typed text goes only to geocode the host's own venue, with no name/account attached; falls back to manual entry if offline. Address is visible only to people going or invited. |
| Add co-hosts? | toggle; when on, search and multi-select friends (close + friend). Co-hosts can edit; their acquaintances may appear in invite suggestions |
| Chip in | **toggle**; when on: amount (auto `$`, no `$$`), method, and **username/handle** (auto `@` or Cash App `$`) — stored link only; we never process payment and there is no wallet OAuth |
| Let friends invite friends | toggle — when on, show helper "Guests can bring someone you don't know yet" and a **guest cap** (default 35; clamp **2–35** on Free Lite, **2–100** on co-op — free hosts cannot type past 35) |

There is **no** global "Bring" field — use Assignments on step 3 instead.

**Step 2 — Invite.**

- **Your connections:** all of your connections (close + friend + acquaintance), searchable, A–Z. Selected rows turn **green** with a check.
- **Might be a good fit:** friends-of-friends suggestions. Subcopy: "People your friends know who would vibe here." Each row shows `Mutual: {FirstName}` — **never** tier words (close / friends / acquaintance).
- Guest cap applies (`guestCap` / event `cap`).

**Step 3 — Cover + Assignments.**

- **Cover modes:** Photo · Emoji. Photo can include **banner text** over the image. Emoji uses the system keyboard (clearable) plus a **vibrant** background color. Tap the cover preview anytime to change it. If skipped, a random emoji cover is chosen at create time. **MEDIA EXCEPTION:** Bridger is capture-only except the profile photo, Collage camera-roll picks, this event cover, and **event album uploads** (see §7).
- **Assignments** (renamed from "Who's bringing what"): host adds items. List is public on the event. Assigning someone does **not** check the item off. No per-item chip-in. Checking off happens on the event page — the **assignee or the host/co-host** can do it (hosts can check off anyone's item). Open items can be snagged; assignees can remove themselves (host is notified).

**Step 4 — Preview + create.** A read-only render of the event exactly as guests will see it (including the recurrence label under When when Repeats is on), then the **Create event** button. On create we emit `event_created` with **booleans + counts only** (`has_cohost`, `has_chip_in`, `has_cover`, `assignment_count`, `invited_count`, `has_recurrence`, optional `recurrence_freq`) — never the title, bio, address, or schedule prose — and route to the new event page.

### Recurring events (v1)

- Stored as `events.recurrence` jsonb on a **single** event row (not materializing future rows).
- Patterns: weekly (weekdays), monthly (calendar day or Nth weekday), yearly.
- Ends: never, until a date, or after a count.
- Hosts edit the series from the event page Edit mode (same Repeats controls). No "this occurrence only" editing in v1.
- Guests and hosts see the human label under When; countdown still uses `starts_at` (next occurrence).

After creating, the host lands on the **event page** where they can **Share** (one action: the native share sheet, which covers AirDrop, Messages, and copy link; on web without a share sheet we copy the link). If friends-invite-friends is on, share is emphasized so guests can invite within the cap. Guests never see the guest cap or invited totals on this page.

**Shared-link visibility (open the link when you are not already on the list):**

| Host setting | What the opener sees | RSVP |
|---|---|---|
| Friends can invite **ON** | Basics (title, host, when, place name, bio). No going / to-meet counts, no full address, no assignments until they join. | Can tap Going / Can't (joins the invite list, cap still applies). |
| Friends can invite **OFF** | Basics only. No who's going, no meet list, no RSVP. | Must be invited by the host (or a going friend after the setting is on). |

People the host already invited always get full invitee RSVP (Going / Can't) and the usual friends-going / to-meet pills.

### Guest cap and host tools (free vs co-op)

Hosting is **never gated** — anyone can host. Scale and extra host features are co-op benefits (`COOP.md`):

- **Guest cap:** default **35 guests** on Free Lite; **co-op members can host up to 100**. The create UI caps the guest-cap field at the plan max (free cannot enter 36+), and the API silently clamps. The larger cap has real cost, because introduction-matching runs across every attendee.
- **Premium host tools (co-op only):** co-hosts, collect allergies, and assignments. Free Lite hosts still run the event; they do not get those extras.

This supersedes the old standalone per-event expansion fee; scale and host tools ride on membership, not a separate SKU.

### Suggested invites (events as matchmaking)

The create flow doesn't just list your friends — it surfaces friends-of-friends the guest list would click with, so a party grows your friends' network, not just yours. Same `matching` engine as Discover, scoped to the invite graph.

---

## 3 · Invitee view (RSVP)

The detail page leads with **clear, complete event info** (see mockup): title, **host (+ any co-host)**, **date & time**, the **full address** (tap → map), a **bio / description**, Assignments, and the chip-in line. Then:

- **Meaningful, tappable counts — never a raw invited/going total.** An event isn't a popularity readout. A guest sees two numbers that matter *to them*, and **each is tappable**:
  - **"{N} going"** — people **you know** going → tap to see **who's coming** (the ones you know).
  - **"{N} to meet"** — attendees **Bridger suggests you'd click with** → tap to see them (routes to Discover).
- **Share** — one control in the **top-right header** (iOS-style share icon) opens the **native iOS/Android share sheet** (Messages, AirDrop, Copy link). There is no separate Copy link button and **no Share at the bottom** of the page.
- **RSVP** — Going / Can't make it.
- **Allergy share (opt-in).** "Share any food allergies with [host]?" Food allergies are **sensitive**: collected only if the guest chooses, visible **only to the host**, never to other guests, never used for matching. Opt-in every time — not a stored default.
- **Add to calendar** — one tap opens Google Calendar (prefilled) or shares an `.ics` for Apple Calendar.
- **Who you should meet** — people at the event (invited or going) Bridger suggests you'd click with; each card shows the shared thread; tapping routes to **Discover**.
- **Assignments** — public list. Tap **Open** (or a name) for a colorful dropdown to assign / reassign / leave open. No "Snag" label. The assignee or the host/co-host can check an item off; other guests only see the done state.

---

## 4 · Host view (editable)

The host's own view of their event — **fully editable in place** via **Edit / Done** in the header (same page unlocks title, bio, when, where, chip-in, friends-invite, reminders, assignments). It shows:

- **Tappable counts** — two wide pills: **"{N} going"** and **"{N} invited"** (each → people sheet). Big display numerals. Invited is host-only planning — never vanity for guests. There is no third "brought" pill; when friends-can-invite is on, each row in the people sheet shows who invited that person ("invited by Jade" / "brought by Sam"). Host-invited people have no tag. When the setting is off, lists render plainly.
- **Header date** — the 31 / FRI date square sits next to the event title (not inside the When row).
- **Flip-tile countdown** — under When, a live days · hours · minutes · seconds flip-clock replaces the grey "in 2 days" pill. Respects Reduce Motion (numbers still update; no flip animation).
- **Co-host** — shown at the top with the host; can edit and manage too.
- **Chip-in.** Amount + method + handle (Venmo / Cash App / person). Plain link the app never processes.
- **Introductions** — who's being introduced to whom and why ("Sam & Alex · both climbers"), from `matching` over **invited + going**. Suggested people can get an `event_introduction` notification.
- **Allergies** — aggregated from guests who opted to share. **The "Only you can see this" note sits *under the Allergies header*, not inside the box**.
- **Reminders** — toggleable in Edit: **2 days before** and **2 hours before**. Prefs persist on the event (`remind_day`, `remind_hours`) and a Nest job emits `event_reminder` at those times. Toggles that are only on the client are not enough; the API must store them and a worker must fire them.
- **Host notes** — one-way notes to guests (text + optional photo). See §6.

---

## 5 · Touch grass on the Events page

Because Events is where plans happen, the **Touch Grass button lives here too** (as well as Home), and **below it, the touch-grass signals**: friends who want to get out.

- **One featured** signal at a time (the freshest / most relevant), then **the rest listed below**.
- **Each shows enough to know *why*** — the person, when (now / tonight / this weekend), and a short line ("anyone want to grab food + walk?").
- **Each card has a split action row: "I'm in" and "Details."** "I'm in" says yes right there; "Details" (or tapping anywhere on the card) opens the full signal sheet. The old ✕ still quietly dismisses it from the list.
- **The detail sheet offers "I'm in" and "Quietly decline."** Declining tells the poster nothing — it just clears the card for you. Same touch-grass mechanics as `TOUCHGRASS-AND-QUIZ.md` — no counts, no public "no," private who's-in.
- **Who to tell is Close / Friends only.** A signal may show it went to **Close** or **Friends**. Older leftover "Everyone" rows show *no* circle label.

---

## 6 · Host notes (reminders you write)

The host (and co-hosts who can already edit) can send a short **Event note** to people on the guest list. This is how the house says "someone left a jacket," "doors at 7," or attaches a photo of what was left behind.

- **One-way.** Not a group chat. Guests receive a notification (`event_host_note`) and see the note on the event page. They do not reply in-thread.
- **Audience:** `going`, `invited`, or both (host picks). Never outsiders who only opened a share link.
- **Body:** short text. Optional one photo (capture or camera roll, in context). Photo is UGC; reportable.
- **Not a 1:1 DM.** It does not create Messages threads and does not burn anyone's 5/day cap.
- Circle-sourced events (`CIRCLES.md`) use the same note path for the Influencer-as-host.

Scheduled 2-day / 2-hour reminders stay automatic (no custom text). Host notes are the freeform path.

```ts
interface EventHostNote {
  id: string;
  eventId: string;
  authorId: string;          // host or co-host
  text: string;
  photoMediaId?: string;
  audience: 'going' | 'invited' | 'both';
  createdAt: string;
}
```

Product event: `event_host_note_sent` after the server accepts the note (not on composer open). Analytics: audience enum + `has_photo` only. Never the text.

---

## 7 · Shared photo album

The guest-list **Photo album** is the shared roll from a night. Backbone stays tagged Updates (`stories.event_id`) plus album-only uploads that still store as `media` tied to the event.

**Who can see it:** everyone on the guest list (invited or going). Not shared-link outsiders.

**Who can add:** anyone on the guest list. Capture in-app or pick from the camera roll **for this event only** (permission in context; we read only the items they pick). This is a listed capture-only exception (`INDEX.md` §6).

**Viewer:** full-screen tiles (not emoji placeholders). Tap opens the photo. Dead-click the section title. Interactive: open, save, (author) delete.

### Save to device photos

- **Save** writes the image to the phone's library (iOS Photos / Android Pictures or the user's chosen cloud Photos app via the OS).
- Permission is **add-only** (same pattern as saving a quiz result card). We never scan the library for this action.
- Per person, per media: `event_album_saves` (`user_id`, `media_id`, `saved_to_device_at`). Saving is personal. One guest saving does not mark it saved for others.
- Web: download the file (browser download). No photo-library permission.

Product event: `event_album_saved` (`method`: `photos` | `download`) after the OS/browser confirms. Never the image.

### Auto-delete if not saved

- Album copies expire **7 days after the event end** (`starts_at` + duration; one-off events treat end as `starts_at` + 6 hours if no end time) **unless** that viewer has a save row.
- Expiry deletes the **shared album access** for that person (they can no longer fetch the signed URL). The author's own Update may still follow personal story retention (Free Lite ~30 days / co-op keep) on their profile. Album vs story retention must not fight: the album listing hides expired unsigned photos even if the story row still exists for the author.
- Saving to the device is the way to keep a copy after the album window. Bridger does not keep a second forever copy for Free Lite guests who never saved.

### Storage quotas (event-scoped, not personal `plan_state`)

Personal co-op storage (`rolling30` vs `unlimited`) is about **your** Updates. The event album is a **shared pool** on the event.

| Who | Included album pool |
|---|---|
| Free Lite guests adding photos | Small per-event cap (count + bytes). Default: **50 photos or 500 MB** per event, whichever hits first. |
| Co-op guests adding photos | Higher included cap. Default: **200 photos or 2 GB** per event. |
| Host pays for more | Host (or the house) can buy an **event album storage add-on** that raises that event's cap. Recorded on `event_album_quota`. Separate from co-op dues and from Billy+. |

- Meter is per event (`used_bytes`, `used_count` vs `quota_bytes`, `quota_count`).
- Hitting the cap blocks new uploads with a clear message. Viewing and saving already-uploaded photos still works.
- Co-op "unlimited" personal storage does **not** make every event album unlimited. The host add-on is how a house buys a bigger shared roll.
- Soft-join era: show the cap and the add-on price; do not silently charge until the SKU is live (`COOP.md` changelog).

**TODO (product):** exact add-on price and whether leftover unused add-on bytes expire with the 7-day album window (yes: unused quota dies with the event album).

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
  attendees: Attendee[];       // each may carry invitedById when friends-can-invite
  invited: Attendee[];         // same; UI shows "invited by" / "brought by"
  inviteByIds?: Record<string, string>; // personId → inviter; omit = host invited
  introductions: Introduction[];   // pairwise, with the "why"
  sharedAllergies: string[];       // host-only, opt-in
  reminders: { twoDays: boolean; twoHours: boolean }; // persisted as remind_day / remind_hours
  hostNotes: EventHostNote[];
  album: {
    photos: EventAlbumPhoto[];
    usedCount: number;
    usedBytes: number;
    quotaCount: number;
    quotaBytes: number;
  };
}

interface EventAlbumPhoto {
  mediaId: string;
  authorId: string;
  createdAt: string;
  savedByMe: boolean;              // this viewer has a save row
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
| Auto reminders (2d / 2h) | `events` prefs + worker → `notifications` (`event_reminder`) |
| Host notes (text + photo) | `events` (`event_host_notes`) → `notifications` (`event_host_note`) |
| Shared album + save + expiry | `stories` (`event_id`) + `event_album_saves` + album quota |
| Event album storage add-on | `payments` (`event_album_storage`) |
| Guest-cap expansion payment | **retired** (co-op guest cap 35→100; see `COOP.md`) |
| Chip-in handle | plain field on `events` (not processed) |

---

## Acceptance criteria

- [ ] First-time visitors (not yet explored, no hosted events) see the Events gate (headline + three-row idea wall centered in the middle + Explore Events CTA at the bottom; header + and messages hidden), not the empty calendar alone.
- [ ] Explore Events opens the normal Events list without opening create; header + and messages return on the list. After Explore once (or hosting once), the gate never returns; post-gate Events still has Touch Grass + calendar EmptyState when empty.
- [ ] Idea chips are decorative only (no create prefill); Reduce Motion freezes the marquees.
- [ ] List groups events into Hosting / Going / Invited; Community is a dormant "coming soon" placeholder.
- [ ] Create Details can mark an event as repeating (weekly / monthly day or Nth weekday / yearly + ends); Preview and detail show the human label; `event_created` includes `has_recurrence` (and optional `recurrence_freq` enum only).
- [ ] Create supports inviting all connections plus FoF suggestions with mutual names (no tier labels), plus a "let friends invite friends" toggle with a guest cap.
- [ ] Create surfaces friend-of-friend suggested invites from `matching`.
- [ ] Hosting is free (never gated); the guest cap is 35 for Free Lite and 100 for co-op members. Free Lite cannot enter a guest cap above 35 in create (no "Guest cap max" error). Co-hosts, allergy collection, and assignments are co-op host tools (see `COOP.md`).
- [ ] The chip-in handle is a stored link only — never processed by the app (no Venmo/Cash App OAuth).
- [ ] Assignments are public; assign ≠ done; the assignee or host/co-host can check off (hosts can check anyone's); open items use an assign dropdown (no "Snag" label); leave-open / reassign notifies the host.
- [ ] Invitee view offers Going / Can't, add-to-calendar (Google/Apple, prefilled), and who-you-should-meet cards that route to Discover.
- [ ] Food-allergy sharing is opt-in per event, visible only to the host, and never used for matching.
- [ ] Guests see only "{N} going" (people they know) and "{N} to meet" — never a raw invited/going total — and both counts are tappable.
- [ ] Shared-link outsiders (not on the invite list) see basics only: no going / to-meet counts. If friends-can-invite is on they may RSVP Going; if off they cannot RSVP until invited.
- [ ] The event detail clearly shows host (+ co-host) with real profile photos when available, date/time, full address (maps link), a bio/description, assignments, and the chip-in line; one header Share control (iOS-style icon) opens the native share sheet (web without Share copies the link). Guests never see invited totals or guest caps. Host and guest views share the same layout.
- [ ] When guests tag updates to the event (party capture flow) or upload to the album, a **Photo album** section shows those photos on the event detail for everyone on the guest list (not outsiders). Tiles are real thumbnails; tap opens the photo.
- [ ] Guests can **Save** an album photo to the device library (add-only permission on iOS/Android; file download on web). Save is per user (`event_album_saves`).
- [ ] Album access expires **7 days after the event end** for a viewer who has not saved that photo. Author profile Updates still follow personal retention.
- [ ] Free Lite vs co-op guests hit different per-event album caps. Hosts may buy an event album storage add-on. Personal co-op unlimited storage does not lift the album pool.
- [ ] Host (or co-host) can send an Event note (text + optional photo) to going / invited / both. Guests get `event_host_note` and see it on the event page. Not a chat. Not a Messages thread.
- [ ] The host view is fully editable in place (Edit / Done); it shows tappable "{N} going" and "{N} invited" (wide pills, big numerals). When friends-can-invite is on, people-sheet rows show invite attribution ("invited by" / "brought by"); no separate "brought" count pill.
- [ ] The date square sits next to the title; the When row uses a live flip-tile countdown (Reduce Motion: update without flip animation).
- [ ] The host can add a co-host who can also edit/manage.
- [ ] The chip-in sits at the top and includes an amount and a method + handle (Venmo / Cash App / person); the app never processes it.
- [ ] The Allergies "Only you can see this" note sits under the header, not inside the box.
- [ ] The Events page shows the Touch Grass button with friend signals listed directly under it (no separate "Who's free" heading), each showing when + what they want to do, with a split "I'm in" / "Details" action row; tapping the card opens a detail sheet offering "I'm in" or "Quietly decline."
- [ ] The send sheet offers **Close** and **Friends** only (no Everyone). A signal only names those two circles; any leftover wide send shows no circle label.
- [ ] Host view shows introductions (with the "why"), shared allergies (host-only), and reminder toggles.
- [ ] Reminder toggles persist on the event (`remind_day`, `remind_hours`). A worker sends `event_reminder` 2 days and 2 hours before when enabled.

---

## Changelog

| Date | Change |
|---|---|
| 2026-09-09 | Host notes (one-way text + photo). Reminder prefs persist + scheduled `event_reminder`. Shared album: real viewer, save-to-Photos, 7-day unsaved expiry, per-event quota, host-paid add-on. Capture-only exception list includes album uploads. Docs only; no migration yet. |
