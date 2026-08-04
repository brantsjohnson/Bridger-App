# Bridger — Co-op Membership (benefits & tiering)

What you get for joining the co-op, and — just as important — what stays free forever. This is the business model made concrete. Ties to `payments`, `coop`, `permissions`, and the membership record in `DATA.md`.

---

## The principle: never pay to connect

**Free covers everything about *reaching people*. The co-op covers richer *self-expression*, *organizing at scale*, and *expensive compute*.** If a gate would ever stop someone from meeting or talking to a person, it's the wrong gate. Connection is the mission; you don't tax the mission.

A corollary: **anyone can always *view* co-op members' richer content** (their videos, their customized profiles). Membership changes what you can *create and organize*, not what you can *see* — so non-members are never walled off from the experience.

---

## Always free (connection + core)

- **Unlimited friends and acquaintances** — the network grows for everyone; friend *count* is never capped.
- **Discover, friends-of-friends suggestions, the reveal** — this is connection; it stays free. (Not co-op-gated.)
- **Adding / accepting / tiering people**; **messages** (the 5/day capped chat); **touch grass**; **answering polls & questions**; **quizzes**; **Inside Jokes**.
- **Photo + text updates** (typed or voice-to-text); **stickers**; **viewing everyone's content**, including co-op video and custom profiles.
- **Attending events**, and **hosting small events** (up to the base 35-guest cap).
- **Weekly recap** (the AI summary — see below).
- **The default profile** everyone can read.
- **Three circles with caps:** up to **10 close**, **25 friends**, **unlimited acquaintances**.

---

## The co-op unlocks

### 1. Profile personalization (flagship)
Co-op members **customize their profile** — background image, colors/vibe, extra photos, and their own **custom widgets** — and **their friends see it the way they saved it**. Full spec: `PROFILE-CUSTOMIZATION.md`.
- **Core widgets stay a fixed, ordered skeleton** — members insert custom widgets into the slots *between* them, never reordering the backbone, so every profile stays legible.
- **Accessibility rule (non-negotiable):** every viewer can always switch a customized profile to the **original/default view**. Personalization can never make a profile unreadable. The default is one tap away, always.

### 2. Bigger circles + custom groups (flagship)
- **Unlimited close & friends** (free caps of 10 / 25 lift entirely).
- **Custom named groups** beyond the three tiers ("climbing crew," "college friends") to share updates with. Free users have the three fixed tiers; co-op adds custom audiences.
- *Why this is the best lever:* it charges for **organization at scale, never for connection** — acquaintances stay unlimited for everyone, so you can always add anyone.

### 3. Video — the co-op superpower
- **Video updates** on stories and **video (Marco-Polo) reactions** are a co-op capability. Free users post photos, text, voice-to-text, and stickers.
- **Everyone can watch** co-op members' videos — viewing is never gated.
- Pairs with unlimited storage (video is the storage-heavy, expensive format).
- **Also media-expression:** co-op members can add **photos to places traveled**, and shared places surface both people's photos in In-common ("you've both been to France") — see `PROFILE.md`.
- *(Open choice: if gating all video feels too cold for the free tier, keep short video reactions free and reserve longer/story video for co-op.)*

### 4. Daily AI recaps
- **Free = weekly recap; co-op = daily recaps** (a couple of sentences per day, richer). Same privacy rule either way: built only from the user's words + transcripts, never their photos (see `STORIES.md` / `DATA.md`).
- This protects the core loop for everyone while making the expensive daily granularity the perk — and it's the main compute-cost lever.

### 5. Unlimited storage
- **Free = rolling 30-day** media retention; **co-op = unlimited** (keep everything). (As previously specced.)

### 6. Event hosting at scale
- Hosting is **free up to 35 guests**; **co-op raises the cap to 100** (and unlocks premium host tools). Hosting itself is never gated — only scale is.

### 7. Special activities / bonus content
- Member-only activities, challenges, and drops the organizer hosts from the admin console.

### 8. Create polls & questions ("Ask the group")
- **Creating** a poll or asking the group a question is a co-op feature; **answering is always free.** (Keeps a fun broadcast-y tool as a member perk without gating anyone's ability to respond.)

### 9. The point
- You're **not the product**. The co-op is how Bridger stays a tool for you instead of an ad machine. That's the real "benefit" — and it's why the pitch lands at signup (`ONBOARDING.md`).

---

## Payment

- **One membership (annual dues) unlocks all of the above.** Recommended: **retire standalone micro-purchases** (e.g. the old $2/mo storage add-on) in favor of the single co-op story — cleaner narrative, and it avoids reintroducing the transactional feel. Storage, video, circles, etc. are **co-op benefits, not separate SKUs**.
- Runs through `payments`; membership is recorded in `coop_memberships` (`DATA.md`).
- **Governance lives in the co-op portal** (`COOP-PORTAL.md`) — where members steer the co-op via ideas, beta votes, mission support, and a **participatory dues vote** that informs this membership price. Public to view, member to participate.

---

## What is NOT gated (guardrails)

Never behind the co-op: meeting people (Discover), adding friends, unlimited acquaintances, messaging, attending events, viewing anyone's content, the weekly recap, and a readable default profile. **Connection and consumption are always free.**

---

## Open decisions (for the founder)

1. **Video:** all video co-op, or keep short video reactions free? (Recommendation: all video co-op, unless the free tier feels too cold.)
2. **Summaries:** confirm weekly-free / daily-co-op (recommended) vs. summaries fully free.
3. **Standalone purchases:** confirm co-op-only (recommended) vs. keeping a low-commitment storage add-on.

---

## Data / enforcement

```ts
interface CoopBenefits {
  personalization: boolean;        // widgets/photos/backgrounds/colors
  circleCaps: { close: number; friends: number; acquaintances: 'unlimited' };  // free: 10/25/∞
  customGroups: boolean;
  video: boolean;                  // post video + video reactions
  summaryCadence: 'weekly' | 'daily';
  storage: 'rolling30' | 'unlimited';
  eventGuestCap: number;           // free 35 / co-op 100
}
```
Enforced server-side by membership status; RLS + API checks gate creation (never viewing).

---

## Acceptance criteria

- [ ] Connection is never gated: Discover, adding friends, unlimited acquaintances, messaging, attending events, and viewing all content are free.
- [ ] Free circles cap at 10 close / 25 friends (acquaintances unlimited); co-op lifts caps and adds custom named groups.
- [ ] Co-op members can personalize their profile; every viewer can switch any profile to the accessible default view.
- [ ] Video updates and video reactions are a co-op capability; everyone can still view video.
- [ ] Free users get a weekly recap; co-op members get daily recaps (same word-only privacy rule).
- [ ] Free storage is rolling 30-day; co-op is unlimited.
- [ ] Hosting is free up to 35 guests; co-op raises the cap to 100.
- [ ] One annual membership unlocks all co-op benefits; no separate SKUs (recommended).
