# Bridger: Co-op Membership (benefits & tiering)

What you get for joining the co-op, and what **Free Lite** keeps forever. Ties to `payments`, `coop`, `permissions`, and the membership record in `DATA.md`. Signup presents exactly **two** tiers (see `ONBOARDING.md`): **Join the co-op** or **Free Lite**. No ads tier.

---

## The principle: never pay to connect

Signup is two paths: **Join the co-op** ($72/year, about $6/month) or **Free Lite**. Both are ad-free. People should never have to pay to connect.

**TLDR:** Co-op pays for more ways to express yourself, more access (named groups beyond the default three circles), and more storage.

Free Lite covers everything about *reaching people*. The co-op covers richer *self-expression*, *organizing at scale*, and *expensive compute*. If a gate would ever stop someone from meeting or talking to a person, it is the wrong gate.

A corollary: **anyone can always view co-op members' richer content** (their videos, their customized profiles). Membership changes what you can *create and organize*, not what you can *see*. Free Lite members are never walled off from the experience.

---

## Two tiers (signup)

| Tier | What it is |
|---|---|
| **Join the co-op** | Paid membership (~$6/mo, display **$72/year**). Expression, bigger circles, storage, and host tools unlocked. No ads. |
| **Free Lite** | All the essentials to stay connected. No ads. Story posting, **30-day rolling** history, smaller Close / Friends caps. |

"Limited" on Free Lite means expression and scale only (storage window, circle size, video, recap cadence, host extras). It never means paywalled connection. Acquaintances stay unlimited for everyone.

---

## Always free (Free Lite)

- **Unlimited acquaintances.** Friend count is capped at **30**. Close friends is capped at **5**.
- **Discover**, friends-of-friends suggestions, and the **reveal** (what is in common).
- **Adding, accepting, and basic grouping** of people (the three default circles).
- **Messages** (the 5/day capped chat).
- **Touch Grass**.
- **Answering** polls and questions.
- **Quizzes**.
- **Inside Jokes** (posting text on the wall). A photo on the note is a co-op perk.
- **Bucket list**.
- **Posting on their story** (photo, text, voice-to-text, stickers). Video posting is co-op.
- **Watching everyone else's stories**, including videos posted by co-op members.
- **Viewing custom profiles**.
- **Attending events**, and **hosting small events** up to **35 guests**.
- **Previous-week recap** of stories.
- **Circles:** up to **5 Close**, **30 Friends**, unlimited Acquaintances.
- **Rolling 30-day storage**.
- **No ads** in the feed (or anywhere else).

The default profile everyone can read stays free. Viewers can always switch a customized profile to the original/default view (`PROFILE-CUSTOMIZATION.md`).

---

## The co-op unlocks

### 1. Profile personalization
Background, colors/vibe, extra photos, custom widgets. Friends see it the way it is saved. Full spec: `PROFILE-CUSTOMIZATION.md`.
- Core widgets stay a fixed, ordered skeleton. Members insert custom widgets into the slots between them, never reordering the backbone, so every profile stays legible.
- **Accessibility (non-negotiable):** every viewer can always switch a customized profile to the original/default view.

### 2. Bigger circles + custom groups
- **25 Close** and **125 Friends**, plus named groups like "climbing crew."
- Acquaintances stay unlimited for everyone.
- Free Lite users have the three fixed tiers with the 5 / 30 caps. Co-op adds custom audiences.
- Hitting a Close or Friends cap never blocks the connection. The person lands in Acquaintances (and Free Lite can be offered co-op).

### 3. Video
- **Post video updates** and **video (Marco Polo) reactions**. Everyone can still watch them, or see them if they share a video response.
- Free Lite users post photos, text, voice-to-text, and stickers.

### 4. Extra photos on places traveled
- Co-op members can add additional photos on places traveled. Shared places can show both people's photos in In common.

### 4b. Photo on an Inside Joke
- Free Lite can still write and post a sticky note.
- Co-op members may add **one photo** on the note (camera or one picked camera-roll item, asked in that moment). Everyone who can see the joke can see the photo.

### 5. Daily recaps
- Free Lite = previous-week recap of stories.
- Co-op = **updated daily recaps**, so it is not a week behind.
- Same privacy either way: built only from the user's words + transcripts, never their photos (`STORIES.md` / `DATA.md`).

### 6. Unlimited storage
- Free Lite = rolling 30-day window.
- Co-op = keep everything.
- **Friend Pod archive:** this week's listen and record stay free (rolling 7 days). Co-op members can open **earlier locked weeks** in the player (`GET /recap/weeks`, `GET /recap/playlist?weekId=`). Free Lite sees an Earlier weeks chip that opens join. This is storage / history, not a paywall on hearing friends this week. It is separate from §5 **daily recaps of stories**.
- **Event album is a separate pool.** Personal unlimited storage does **not** make a shared event album unlimited. Free Lite vs co-op guests get different per-event album caps; the host may buy an **event album storage add-on** for that event (`EVENTS.md` §7).

### 7. Bigger event hosting + premium host tools
- Guest cap goes from **35 to 100**.
- **Premium host tools (co-op):** co-hosts, collect allergies, assignments.
- Hosting itself is never gated. Only scale and those extra host features are gated for co-op members.

### 8. Create polls & "Ask the group"
- **Creating** is a co-op feature. **Answering stays free.**

### 9. Co-op portal
- Ideas, beta votes, mission, and the **how much will this feature cost** portal.
- Anyone can **read** this page. Only members can **participate**.
- Vote tallies stay off the member portal (admin only). Comments appear as "A member."

### 10. The point
You are not the product. The co-op is how Bridger stays a tool for you instead of an ad machine. Free Lite and co-op are both ad-free.

---

## Payment

- **Annual co-op dues** unlock all of the above. Display price **$72/year** (about $6/mo). Storage, video, circles, hosting scale, and host tools are **co-op benefits**, not separate micro-SKUs.
- **Exception, Billy+:** the opt-in relationship assistant (Billy) is metered separately. Co-op members who enable Billy get a small taste allowance (~$0.50/mo of model cost). **Billy+** (~$5/mo) grants more Billy time with capped rollover. See `AGENT.md`. Ambient AI (recaps, quiz moderator, embeddings) stays in the co-op / platform budget, not Billy balances.
- **Exception, Influencer SKU (planned):** a paid creator role (`CIRCLES.md`). Not a co-op benefit. Fans never pay to add an Influencer.
- **Exception, event album storage (planned):** a host can pay to raise one event's shared album cap (`EVENTS.md`). Not a membership perk and not personal storage.
- Runs through `payments` (`coop_dues` and `billy_plus`); membership is recorded in `coop_memberships` (`DATA.md`).
- **Governance lives in the co-op portal** (`complete/COOP-PORTAL.md`).
- **Cancel is period-end.** You keep member perks until you are paid through (`dues_paid_through`), then you drop back to Free Lite (including the 30-day storage window). Quiet manage screen: `/coop/portal/manage`.

---

## What is NOT gated (guardrails)

Never behind the co-op: meeting people (Discover), adding friends, unlimited acquaintances, messaging, attending events, viewing anyone's content (including co-op video and custom profiles), answering polls, Inside Jokes, Bucket list, posting photo/text stories, **this week's** Friend Pod, and a readable default profile. **Earlier Friend Pod weeks** are a co-op storage perk. **Connection and consumption of what is live this week are always free on Free Lite.** Neither tier shows ads.

---

## Data / enforcement

```ts
interface CoopBenefits {
  personalization: boolean;        // widgets/photos/background/colors
  circleCaps: { close: number; friends: number; acquaintances: 'unlimited' };
  // Free Lite: 5 / 30 / ∞ · co-op: 25 / 125 / ∞
  customGroups: boolean;
  video: boolean;                  // post video + video reactions
  placePhotos: boolean;            // extra photos on places traveled
  summaryCadence: 'weekly' | 'daily';
  storage: 'rolling30' | 'unlimited';
  eventGuestCap: number;           // Free Lite 35 / co-op 100
  premiumHostTools: boolean;       // co-hosts, collect allergies, assignments
  askTheGroup: boolean;
}
```
Enforced server-side by membership status; RLS + API checks gate creation (never viewing).

---

## Acceptance criteria

- [ ] Signup offers exactly two tiers: Join the co-op or Free Lite (no ads tier).
- [ ] Connection is never gated: Discover, adding friends, unlimited acquaintances, messaging, attending events, and viewing all content are free on Free Lite.
- [ ] Free Lite circles cap at 5 Close / 30 Friends (Acquaintances unlimited); co-op is 25 Close / 125 Friends plus custom named groups. Hitting a cap never blocks the connection.
- [ ] Co-op members can personalize their profile; every viewer can switch any profile to the accessible default view.
- [ ] Video updates and video reactions are a co-op capability; everyone can still view video.
- [ ] Free Lite users get a previous-week recap; co-op members get daily recaps (same word-only privacy rule).
- [ ] Free Lite storage is rolling 30-day; co-op is unlimited.
- [ ] This week's Friend Pod is free. Co-op members can open earlier locked weeks; Free Lite is offered join.
- [ ] Hosting is free up to 35 guests on Free Lite; co-op raises the cap to 100 and unlocks co-hosts, allergy collection, and assignments.
- [ ] Creating polls / Ask the group is co-op; answering is free.
- [ ] Portal is public to read, member to participate, including the feature-cost page.
- [ ] One annual membership ($72/yr display, about $6/mo) unlocks all co-op benefits. Intentional extra SKUs: Billy+, Influencer (planned), event album storage add-on (planned).
- [ ] Neither Free Lite nor co-op shows ads in the feed.

---

## Changelog

| Date | Change |
|---|---|
| 2026-09-09 | Inside Joke text posting stays free. One photo on the note is a co-op perk. |
| 2026-09-09 | Friend Pod: this week stays free; earlier locked weeks are a co-op storage perk (separate from daily story recaps). |
| 2026-09-09 | Event album is a separate per-event pool (not personal unlimited storage). Extra SKUs called out: Influencer role, event album add-on (planned). Billy+ unchanged. |
| 2026-08-14 | Caps: Free Lite 5 Close / 30 Friends; co-op 25 Close / 125 Friends (not unlimited). Bucket list + Inside Jokes posting called out as free. Host extras (co-hosts, allergies, assignments) are co-op. Daily recaps vs previous-week recap. Video viewing stays free. |
