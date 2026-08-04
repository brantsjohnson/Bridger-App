# Bridger — Co-op Membership (benefits & tiering)

What you get for joining the co-op, and — just as important — what stays free forever. This is the business model made concrete. Ties to `payments`, `coop`, `permissions`, and the membership record in `DATA.md`.

## The principle: never pay to connect

Free covers everything about reaching people. The co-op covers richer self-expression, organizing at scale, and expensive compute. If a gate would ever stop someone from meeting or talking to a person, it's the wrong gate. Connection is the mission; you don't tax the mission.

A corollary: anyone can always view co-op members' richer content (their videos, their customized profiles). Membership changes what you can **create and organize**, not what you can **see** — so non-members are never walled off from the experience.

## Always free (connection + core)

- Unlimited friends and acquaintances — the network grows for everyone; friend count is never capped.
- Discover, friends-of-friends suggestions, the reveal — this is connection; it stays free.
- Adding / accepting / tiering people; messages (the 5/day capped chat); touch grass; **answering** anyone's poll or question; quizzes; the Inside Jokes wall.
- Photo + text updates (typed or voice-to-text); stickers; viewing everyone's content, including co-op video and custom profiles.
- Attending events, and hosting small events (up to the base 35-guest cap).
- Weekly recap (the AI summary — see §4).
- The default profile everyone can read.
- Three circles with caps: up to 10 close, 25 friends, unlimited acquaintances.

## The co-op unlocks

### 1. Profile personalization (flagship)
Co-op members customize their profile — widgets, added photos, backgrounds, colors — and their friends see it the way they saved it.

**Accessibility rule (non-negotiable):** every viewer can always switch a customized profile to the default/plain view. Personalization can never make a profile unreadable or inaccessible. The default is one tap away, always.

Full spec, including the locked core-widget order and the insert slots, in `PROFILE-CUSTOMIZATION.md`.

### 1b. Shared-place photos
When a member and a friend have both been to the same place, their photos from that place surface together in **In common** — your Paris shot beside their Nice shot. It's the warmest version of the "wait, you were there too?" moment. Co-op, because photos are the expressive, storage-heavy layer. Viewing is never gated: a free user still sees a member's shared-place photos.

### 1c. Asking the group (polls & questions)
**Creating** a poll or an open question is a member capability; **answering** one never is. A non-member sees the slot on Home occupied by a single locked card that states what it unlocks and what membership costs — visible and honest, not hidden. Polls fan out to a chosen circle or group like any other post, and every member keeps a **poll archive** (`polls/`) of everything they've asked, with results and who answered.

Why this gate and not another: asking your whole circle a question is a broadcast, and broadcasts are the part of a social network that costs real money to run. Nobody is ever stopped from replying to a friend.

### 2. Bigger circles + custom groups (flagship)
Unlimited close & friends (free caps of 10 / 25 lift entirely). Custom named groups beyond the three tiers ("climbing crew," "college friends") to share updates with.

Why this is the best lever: it charges for organization at scale, never for connection — acquaintances stay unlimited for everyone.

### 3. Video — the co-op superpower
Video updates on stories and video (Marco-Polo) reactions are a co-op capability. Free users post photos, text, voice-to-text, and stickers. Everyone can watch co-op members' videos; viewing is never gated. Pairs with unlimited storage.

*(Open choice: if gating all video feels too cold, keep short video reactions free and reserve longer/story video for co-op.)*

### 4. Daily AI recaps
Free = weekly recap; co-op = daily recaps (a couple of sentences per day, richer). Same privacy rule either way: built only from the user's words + transcripts, never their photos (see `STORIES.md` / `DATA.md`). This is the main compute-cost lever, which is why the daily granularity is the perk.

**Naming:** internally (docs, schema, modules) this is the **AI summary / AI recap**. In the product it is only ever a **recap** or **summary**. See the copy rule below.

### 5. Unlimited storage
Free = rolling 30-day media retention; co-op = unlimited.

### 6. Event hosting at scale
Hosting is free up to 35 guests; co-op raises the cap to 100 (and unlocks premium host tools). Hosting itself is never gated — only scale is.

### 7. Special activities / bonus content
Member-only activities, challenges, and drops the organizer hosts from the admin console.

### 8. The point
You're not the product. The co-op is how Bridger stays a tool for you instead of an ad machine. That's the real benefit, and it's why the pitch lands at signup (`ONBOARDING.md`).

## Copy rule (user-facing) — applies app-wide, not just here

Two hard rules for every string a user can read (UI labels, empty states, notifications, recap and summary output, marketing screens, store copy):

1. **Never the word "AI."** Docs, schema, and module names say AI summary; the product says **recap** or **summary**. No "AI-powered," no sparkle-AI framing.
2. **Never an em dash (—) or en dash (–).** Use a period, a comma, or a middle dot (·). This includes generated recap text, so the summary prompt must forbid dashes explicitly.

Enforce in review: any user-facing string containing `AI` or `—` is a bug.

## Payment

One membership (annual dues) unlocks all of the above. Recommended: retire standalone micro-purchases (e.g. the old $2/mo storage add-on) in favor of the single co-op story. Runs through `payments`; membership is recorded in `coop_memberships` (`DATA.md`).

## What is NOT gated (guardrails)

Never behind the co-op: meeting people (Discover), adding friends, unlimited acquaintances, messaging, attending events, viewing anyone's content, the weekly recap, and a readable default profile.

## Open decisions

- Video: all video co-op, or keep short video reactions free? (Recommendation: all video co-op.)
- Summaries: confirm weekly-free / daily-co-op (recommended) vs. summaries fully free.
- Standalone purchases: confirm co-op-only (recommended) vs. keeping a storage add-on.

## Data / enforcement

```ts
interface CoopBenefits {
  personalization: boolean
  circleCaps: { close: number; friends: number; acquaintances: 'unlimited' }
  customGroups: boolean
  video: boolean
  summaryCadence: 'weekly' | 'daily'
  storage: 'rolling30' | 'unlimited'
  eventGuestCap: number
}
```

Enforced server-side by membership status; RLS + API checks gate creation (never viewing).

## Acceptance criteria

- [ ] Connection is never gated: Discover, adding friends, unlimited acquaintances, messaging, attending events, and viewing all content are free.
- [ ] Free circles cap at 10 close / 25 friends (acquaintances unlimited); co-op lifts caps and adds custom named groups.
- [ ] Co-op members can personalize their profile; every viewer can switch any profile to the accessible default view.
- [ ] Video updates and video reactions are a co-op capability; everyone can still view video.
- [ ] Free users get a weekly recap; co-op members get daily recaps.
- [ ] Free storage is rolling 30-day; co-op is unlimited.
- [ ] Hosting is free up to 35 guests; co-op raises the cap to 100.
- [ ] One annual membership unlocks all co-op benefits; no separate SKUs.
- [ ] **Ask the group** (creating polls and open questions) is a member unlock. **Answering** any poll or question you're sent is always free — the never-pay-to-connect rule holds. Non-members don't see the widget at all rather than a locked teaser.
- [ ] No user-facing copy contains the word "AI" or an em dash, including generated recap text.
- [ ] Docs and schema still call it the AI summary; the product calls it a recap.
