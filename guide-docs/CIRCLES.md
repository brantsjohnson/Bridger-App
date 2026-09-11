# Bridger: Circles (Influencer connections)

Active build doc. Maps to a planned Nest module `circles`, Expo routes under `apps/mobile/app/circles/` and Settings, plus an Influencer portal. Read `DATA.md`, `complete/DISCOVER.md`, `complete/REVEAL.md`, `complete/MATCHING-ALGORITHMS.md`, and `complete/COOP.md` first.

**Status:** docs + schema only in this pass. No Nest/Expo code, no applied migrations, no live SKUs.

Circles is how someone on Bridger can add an **Influencer** without making them a normal friend. The fan sees what they have in common (books, shows, hobbies) at a visibility tier they choose. The Influencer can query that opted-in Circle to plan events or products. They cannot open a one-to-one Bridger message to a fan.

---

## 0 · Why this is not Friends

Friends (`connections` + `tiers`) is a mutual roster with Close / Friend / Acquaintance caps. Circles is a **separate edge**.

| | Friends | Circles |
|---|---|---|
| Edge | Mutual `connections` | One-way `circle_edges` (fan → Influencer) |
| Caps | Close / Friends caps apply | Does **not** consume friend caps |
| Roster | Friends tab | Settings → Circles, plus the Influencer's own portal |
| Commonalities | Mode 2 after beat-0 friendship tier | Mode 2-style overlap after Circle connect + the fan's chosen visibility tier |
| 1:1 Bridger DM | Yes (5/day cap) | **Never.** Influencer cannot start a Messages thread with a Circle member |
| Off-app contact | Optional contact card | Fan stores platforms + handles at connect so the Influencer can reach them on IG / TikTok / etc. |
| In-app group path | Normal Events invites | Influencer may create an Event aimed at Circle members |
| Pay | Never pay to add a friend | Fan never pays to add. Influencer pays a separate **Influencer** entitlement |

Internal name: `circles`. Never call this `follows` in code or UI. Profile already uses "Following" for friend-tier control (`PROFILE.md`). User-facing copy: **Circles** for the fan, **Influencer** for the paid role.

---

## 1 · Who can be an Influencer

- A Bridger account with an active **Influencer entitlement** (`influencer_entitlements`) and an `influencer_profiles` row in `active` status.
- This SKU is **not** co-op membership and **not** Billy+. Co-op stays expression / storage / host tools. Billy+ stays assistant compute. See `complete/COOP.md`.
- Fans never pay to add an Influencer. That keeps **connection never gated** (`INDEX.md` §6).
- v1 discovery is a **share link or QR** the Influencer sends (Instagram, TikTok, in person). No FoF Discover suggestions for Influencers in v1. No public creator directory in v1.
- Admin may set `pending` / `suspended`. Suspended profiles cannot accept new Circle edges; existing fans can still disconnect.

**TODO (product + legal):** display price and billing period for the Influencer SKU (RevenueCat on iOS/Android, Stripe Checkout on web). Card checkout for this digital SKU is not offered inside the iOS app (Apple 3.1.1), same as co-op.

---

## 2 · Fan connect flow (`connect_circle`)

Launched from an Influencer share link / QR (`bridger://circle/{token}` or `https://bridger.app/c/{token}`). Own surface: `circle_connect`. Parent screen is wherever the deep link landed.

```
1. Confirm who: Influencer display name + photo. "This is not a friend request."
2. Visibility: pick what they may see: Acquaintance / Friend / Close
3. Where you follow them + handles: platforms + your handles there
4. Confirm: creates the edge. Then show In common.
```

### 2.1 Visibility tier

The fan picks **one** `visibility_tier` on the edge: `acquaintance` | `friend` | `close`.

That value is the **lowest friend-tier the Influencer is treated as** when reading the fan's attributes. Same `visible_to_tier` rules as Friends (`packages/permissions`). Example: if the fan sets Acquaintance, the Influencer sees only fields tagged acquaintance (Everyone). If they later raise it to Close, Close-only fields become visible to that Influencer.

This is **not** a friendship tier. It does not put the Influencer on the Friends roster. It does not change Discover FoF.

The fan can change the tier later in Settings without reconnecting.

### 2.2 Platforms and handles

At connect, Bridger asks:

- Where do you follow them? (multi-select: Instagram, TikTok, YouTube, Substack, other)
- What are your handles on those apps?

Stored on `circle_edges.follow_platforms` + `handles_json` (Zone A). **Why:** so the Influencer can find the fan on that app and message them there. Bridger does not send those messages and does not OAuth those apps for Circles.

Handles are visible to that Influencer only (and to the fan). Never used for matching. Never logged to analytics. Fan can edit or clear them in Settings. Disconnect hard-deletes them.

Skip is allowed, but the confirm screen says the Influencer will not be able to reach them off Bridger without a handle.

### 2.3 After confirm

- Server writes `circle_edges` (`status=active`). Product event: `circle_connected` (outcome only).
- Fan sees **In common** using the overlap engine with Circle eligibility (below).
- Influencer gets `circle_connected` (in-app; push if prefs on). Copy may use the fan's first name in UI; analytics never logs names or handles.
- No Messages thread is created. There is no "Message" button on the fan card in the Influencer portal.

---

## 3 · Settings (fan)

Surface: `circles_settings`. Parent: Profile Settings.

- List of Influencers in this person's Circle (name + photo + current visibility tier). No follower-style count on this screen for anyone but the signed-in fan's own list length (private to them).
- Per row:
  - Change visibility (Acquaintance / Friend / Close)
  - Edit platforms + handles
  - **Pause** (`status=paused`): Influencer cannot query this fan or see In common until resumed. Edge stays so they can resume without re-entering handles.
  - **Disconnect**: hard-delete the edge. Query access stops. In common stops. Product event: `circle_disconnected`.
- Empty state: "You have not added anyone to your Circle yet." (`interactive:false` on the empty body)

---

## 4 · Commonalities (In common)

Reuse `matching` pair-overlap (`complete/MATCHING-ALGORITHMS.md` Mode 2) with a **new eligibility path**:

- There is an `active` `circle_edges` row for (fan, influencer).
- Attribute reads for the Influencer use the fan's `visibility_tier` on that edge (not a `tiers` friendship row).
- Attribute reads for the fan looking at the Influencer use the Influencer profile's public / acquaintance-visible facts (Influencer profiles are meant to be readable).
- Pre-connection Discover (Mode 1 FoF) does **not** use Circle edges as mutual bridges.

Fan can open In common from the post-connect screen and later from the Influencer's person card (Circle badge, not a Friend badge).

Identity/beliefs stay never bulk-matchable. Zone A (name, handles, photos) never enters the matcher.

---

## 5 · Influencer portal (query + events)

Surface: `influencer_portal`. This is **not** the co-op governance portal (`complete/COOP-PORTAL.md`). Separate routes, e.g. `apps/mobile/app/influencer/*`.

### 5.1 What they can ask

The Influencer can filter their Circle by Zone B facts each fan opted to share at that fan's visibility tier. Examples:

- People who listed a given hobby or book-shaped attribute
- People who overlap with the Influencer on a catalog pick (music, a place)
- People who follow them on TikTok vs Instagram (platform flags only)

Results are a **private working list** for the Influencer: first name, photo, handles they stored, and the matched themes. This is the CRM-like view you asked for. It is allowed because the fan connected on purpose and can disconnect.

Rules:

- No public follower count on profiles, Home, or share cards.
- The Influencer may see a **private Circle size** in their own portal only (same exception family as host headcount vs cap). Never show that number to fans or on the Influencer's public profile.
- Query audit rows (`circle_queries`) store query **shape** only (which filters, result count). No names, no handles, no attribute values in the log.
- Blocks: if the fan blocks the Influencer (or the reverse), the edge is deleted and they disappear from the portal.

### 5.2 What they cannot do

- Open or send a 1:1 Bridger DM to a Circle member (no `messages` thread create from portal).
- See fields above the fan's chosen visibility tier.
- See paused or disconnected fans.
- Use Circle data for third-party ads or export a raw dump to an ad network. Portal use is in-Bridger segmenting + off-app handles the fan typed.

### 5.3 Group outreach: Event to Circle

The in-Bridger way to reach many people at once is an **Event**.

- From the portal, Influencer can create an Event with audience = current query / whole Circle (or a saved segment).
- That is a normal `events` row with a flag `audience_kind=circle` (and optional segment snapshot of opaque user ids at send time).
- Invites emit `event_invite` as today, plus `circle_event_invite` so we can tell Circle-sourced invites from friend invites.
- Fans RSVP on the event page like any guest. The event page is the group channel (host notes in `EVENTS.md` apply).
- Creating the event is the confirmed outcome (`event_created` + `circle_event_created`). Opening the composer is only a flow step.

---

## 6 · Payments

- Entitlement recorded on `influencer_entitlements` (provider `revenuecat` | `stripe`, status, period).
- Product event: `influencer_joined` when the store / Checkout / admin grant confirms (not the tap on Join).
- Period-end cancel: portal tools stay until paid-through, then new queries and new Circle-event creates stop. Existing fans can still disconnect; In common for already-connected fans stays readable on the fan side until they disconnect (the Influencer simply cannot run new portal queries).
- **TODO (product):** exact grace behavior if we later want In common to dim after lapse.

Admin integrations health: when the Influencer SKU is wired, register a non-secret check next to the existing RevenueCat / Stripe probes (`ADMIN.md`). Do not put it on public `GET /health`.

---

## 7 · Data (shapes)

Planned tables live in `DATA.md` (not migrated yet). Client-facing shapes:

```ts
type CircleVisibility = 'acquaintance' | 'friend' | 'close';
type CirclePlatform = 'instagram' | 'tiktok' | 'youtube' | 'substack' | 'other';

interface CircleEdge {
  influencerId: string;
  status: 'active' | 'paused';
  visibilityTier: CircleVisibility;
  followPlatforms: CirclePlatform[];
  // handles never sent to analytics
  connectedAt: string;
}

interface InfluencerPortalMember {
  userId: string;           // opaque; name joined on device
  visibilityTier: CircleVisibility;
  platforms: CirclePlatform[];
  matchedKeys: string[];    // attribute keys only, never values in analytics
}

interface CircleQueryResult {
  memberCount: number;      // private to the Influencer
  members: InfluencerPortalMember[];
}
```

RLS (when migrated):

- Fan can read/update/delete their own `circle_edges` rows.
- Influencer can read `active` edges where they are `influencer_id`, plus attributes allowed by that row's `visibility_tier`.
- Handles are Zone A: Influencer-read, fan-write, never matchable.
- Account delete or disconnect cascades the edge, handles, and that Influencer's query rows that referenced only this fan (query logs are shape-only and may remain as counts).

---

## 8 · Notifications

See `NOTIFICATIONS.md`. New kinds:

| kind | Opens |
|---|---|
| `circle_connected` | Fan: In common / Influencer card. Influencer: portal member row |
| `circle_event_invite` | Event detail |

Circle kinds are **not** circle-gated by Close/Friends/Acquaintance friendship, because the actor is an Influencer edge. Prefs still have a per-kind toggle.

---

## 9 · Analytics

Flows: `connect_circle` (confirm → visibility → handles → create). `influencer_join` (pick plan → pay → confirmed).

Surfaces: `circle_connect`, `circles_settings`, `influencer_portal`, `influencer_join`.

Product events (outcomes only): `circle_connected`, `circle_disconnected`, `circle_visibility_changed`, `circle_paused`, `circle_resumed`, `influencer_joined`, `circle_event_created`. Never handles, never attribute values, never names.

IDs live in `ANALYTICS-TAXONOMY.md`.

---

## 10 · Magic Patterns

Needed components are **TO DESIGN** (do not hand-roll): see `MAGIC-PATTERNS.md` (`CircleConnectWizard`, `CircleSettingsList`, `InfluencerPortal`, `CircleSegmentFilters`). Until those exist, implementation stays behind a clearly marked placeholder.

---

## 11 · Naming

| User sees | Code / module |
|---|---|
| Circles | `circles` |
| Influencer | `influencer_profiles` / entitlement |
| In common | same as friends (`commonality`) |
| Co-op portal | stays `coop` (governance) |

Never surface `follows`, `followers`, or `fans` in UI copy.

---

## Acceptance criteria

- [ ] Adding an Influencer creates a `circle_edges` row, not a `connections` friendship, and does not consume Close / Friends caps.
- [ ] Fan picks Acquaintance / Friend / Close visibility at connect and can change it later. Influencer only sees attributes at or below that tier.
- [ ] Connect asks where they follow the Influencer and for handles. Handles are Influencer-visible, editable, and hard-deleted on disconnect.
- [ ] Influencer cannot create a 1:1 Bridger Messages thread with a Circle member.
- [ ] Influencer portal can filter the Circle by opted-in Zone B facts + platforms, and can see a private Circle size. No public follower counts.
- [ ] Influencer may create an Event for the Circle / a segment. That is the in-Bridger group message path.
- [ ] Settings lists Circles with pause and disconnect. Disconnect hard-deletes the edge and stops query access.
- [ ] In common uses pair-overlap with Circle eligibility, not friendship beat-0.
- [ ] v1 add path is share link / QR only (no FoF Discover).
- [ ] Influencer SKU is separate from co-op and Billy+. Fans never pay to add.
- [ ] New kinds, surfaces, flows, and product events are in `NOTIFICATIONS.md` + `ANALYTICS-TAXONOMY.md`. PRIVACY / TERMS describe consent, handles, marketing use, and no Bridger DM.
- [ ] UI uses Magic Patterns components once designed; placeholders stay marked until then.

---

## Changelog

| Date | Change |
|---|---|
| 2026-09-09 | First contract: Circles edge, tier visibility, handles, no 1:1 DM, portal query, Event-to-Circle, separate Influencer SKU. Docs only. |
