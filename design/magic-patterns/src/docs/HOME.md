# Bridger — Home Page

Build doc for the Home tab. Maps to `apps/mobile/app/(tabs)/home.tsx`, the `feed` API module, and the `StoryTile` / `ConditionalStrip` / `TouchGrassButton` / `WeekSummaryPeek` components in `ARCHITECTURE.md`. Read that file first — this assumes the `ProfileAttribute` model, tiers, and module names from it.

---

## What Home is (and isn't)

Home is a **bounded hub**, not an infinite algorithmic feed. It shows a finite, refreshable snapshot of your chosen people, ordered by recency and relevance — never ranked to maximize scroll. You see who *you* picked to see. Pull-to-refresh; no endless load.

Two privacy rules are visible here as **absences**, enforced by `feed` (per `ARCHITECTURE.md`): no story view counts and no follower counts appear anywhere on this screen for anyone.

---

## Layout (top → bottom)

```
┌─────────────────────────────┐
│  Search people      [💬]    │  1 · Header — search + messages slot (reserved)
├─────────────────────────────┤
│  📣 Announcements     ● ○ ○ │  2 · Announcements carousel (whole
│  🌱 Maya's free — you in? ✕ │      section absent when empty —
│     [ I'm in ]        swipe→│      touch grass · quick check · co-op)
├─────────────────────────────┤
│  Stories      Close ▾       │  4 · Stories row (tier filter)
│  [+ your story][tile][tile] │
├─────────────────────────────┤
│  [ 🌱 Touch grass ]         │  4b · Touch-grass trigger (in feed)
├─────────────────────────────┤
│  Notifications      See all │  5 · Notifications preview (2, → page)
│  • Sam replied to your story│
│  • You + Alex connected     │
├─────────────────────────────┤
│  Inside jokes · this week 🗒 │  5b · Recent inside jokes (falls back to "moments")
├──────────────┬──────────────┤
│ Create poll  │ Ask question │  6 · Action row (split — actions only)
├──────────────┴──────────────┤
│  Your poll · results ▁▃     │  7 · Your live poll (conditional)
├─────────────────────────────┤
│  This week                  │  8 · Weekly section (conditional)
│  ▸ Friends' week · podcast  │
│  + Add your recap · 45s     │
│  Quiz · take → see results  │
├─────────────────────────────┤
│  🖼 Band Tee Week · post →  │  8c · Weekly activity (conditional, admin-hosted)
├─────────────────────────────┤
│  Join the co-op             │  9 · Co-op footer (opens co-op portal)
├─────────────────────────────┤
│   ( home  cal disc ppl you )│  Floating pill nav (detached, dynamic)
└─────────────────────────────┘
```

### Zone-by-zone

| # | Zone | Contents | Component | Empty behavior |
|---|---|---|---|---|
| 1 | Header | Search (people; events later) + **messages slot** (chat icon, reserved for later — no bell) | `MessagesButton` (reserved) | always shown |
| 2 | **Announcements** | One swipeable carousel holding everything that wants attention today: a friend's **touch grass** (newest only, with a link to the rest on Events), the **quick check**, and **co-op notes**. Dots track the swipe; each card dismisses on its own | `AnnouncementsCarousel` | **the whole section — heading included — is absent when nothing is live** |
| 3 | *(folded into Announcements)* | Co-op notes are cards in zone 2, not a separate banner | — | — |
| 4 | Stories | Tier filter (Close / Friends / Everyone) + tiles; first tile = "Check in" (the only post entry), then **your own story**, ringed and labelled, tappable like anyone else's | `StoryTile` | see state matrix |
| 4a | Replies to your story | Directly beneath the tiles: **what people said back** — video replies as a face with a play badge, text replies as the words. Tap any of them (or the "N replies · 1 video" header) to open the thread and answer | `StoryRepliesRow` | hidden when none |
| 5 | Notifications preview | ~2 recent notifications + **See all → Notifications page** | `NotificationRow` | shows recent; empty → hidden |
| 5b | Inside jokes | A few **new sticky notes** from the week (from the Inside Jokes wall); when none are new, falls back to older ones as **"moments"** | — | always shows something (new or moments) |
| 6 | Action row | Two side-by-side tiles: **Create a poll** \| **Ask a question** — **co-op members only**. For non-members the **whole "Ask the group" widget is absent**, not locked: no teaser card for a feature they didn't ask about. The co-op sells itself in the co-op, where "Ask the group" is listed under Members get | (split row) | members only |
| 7 | Your live poll | Your active poll + running results, visible on your own Home. Beneath it, **See previous polls** → your poll archive | — | hidden when no live poll |
| 8 | This week | Friends' recap **podcast** (play), **add your recap** prompt, and the **quiz** (CTA → results) | — | hidden when nothing active |
| 8c | Weekly activity | Entry card into the hosted collage (e.g. "Band Tee Week · post yours") | — | **hidden unless an activity is live in admin** |
| 9 | Co-op footer | "Join the co-op" — opens the co-op portal (also reachable from Profile settings) | — | always shown (non-member) |

### Notifications (header bell)

The top-right bell opens the **notifications center**, which is where reply activity surfaces:
- Someone **responded to your post**.
- Someone **replied to a comment or circle-video you left** on another person's page.
- Two of your friends **connected through you** (the mutual-connection payoff).
- Touch-grass answers ("Sam's in").

Moving notifications to the header (and touch-grass into the feed) makes "you have new replies" the prominent, glanceable thing — conversations are what should pull people back, not a broadcast button.

### Announcements (the one attention slot)

Everything that wants attention *today* shares a single spot at the top of Home, under one **Announcements** heading, as a **swipeable carousel**. Three things feed it:

- **Touch grass** — a friend is free. Newest only (see below).
- **Quick check** — the profile-freshness re-check, one question ("Still into beatboxing?").
- **Co-op** — a vote closing, the books published, a call to join.

Why a carousel and not a stack: these arrive in ones and twos, unpredictably, and stacking them pushes stories and everything else off the screen on a busy day. Swiping keeps the cost of a busy day fixed at one card's height.

**Any of them can be missing, and often all of them are.** When the list is empty the entire section is gone — heading, dots and all. There is no empty announcements state, because a heading over nothing is worse than no heading: it teaches people to ignore the slot. Conversely, when an announcement *is* there, it's genuinely worth a look.

Each card dismisses individually (✕), and the carousel re-pages itself when the list shrinks.

**Every card is roughly the same height** (a shared minimum, with actions pinned to the bottom) so swiping doesn't make the page jump. That constraint sets the rule for card content: a card carries only the **headline** — who, when, and the one number that matters ("2 people in") — and the detail lives **behind a tap**, not on the face of the card. Touch grass, for instance, no longer prints the plan on the widget; you tap through to read "walking the loop at Rowan Park, then maybe tacos."

### Touch grass on Home vs Events

Home carries **one** signal — the newest — so it stays a glance, not a queue. The full list of everyone who's free lives on **Events**, directly under the touch grass button (see `EVENTS.md`), and Home links to it when there's more than one. A card is rich enough to want in (what they're doing, roughly where, who's already said yes) and **opens** for the rest: the full plan, when, where, who's in, and which circle they told. That's the difference between a ping and an invitation — nobody should have to message to find out what "free tonight" means.

### Asking the group is a co-op feature

**Create a poll** and **Ask a question** belong to co-op members. Non-members see the slot occupied by a single locked card that says plainly what it unlocks and what membership costs, rather than the feature being hidden — the point is honesty about how the app is funded, not a teaser. Answering someone else's poll is never gated.

**See previous polls** sits under the live polls and opens **your poll archive** (`polls/`): still-open ones first, then closed ones, each with its winning option, the vote spread, who answered, and when it closed. Opening any of them shows the same results sheet as a live poll — every option, who picked it, who never answered.

### Inside jokes on Home

New sticky-note **inside jokes** from the week surface here — a few recent ones from the Inside Jokes wall (see `PROFILE.md`) so people catch the funny things being said. When there are no new ones, the zone **falls back to "moments"**: older jokes resurfaced, so it's never empty and always a little joy. Tapping one opens it on the relevant profile.

### Weekly activity (hosted collage)

When the organizer has a weekly activity **live** (turned on in admin), a card appears here that opens the **activity collage** — a themed, communal feed. The activity is a prompt like "your favorite band t-shirt this week"; anyone can **post into it** (in-app capture only, per the app-wide rule). The collage reads like a light, normal scrolling feed but themed: **Polaroid-style photos** of people doing the activity, each **double-tap to heart**. It's celebratory, not competitive — hearts, no rankings or view counts.

The zone is **absent entirely** until an activity is switched on in admin, and disappears when the activity ends — so Home only carries it when there's genuinely something running. See `ADMIN.md` (hosting) and the `activities` module.

### Notifications (feed preview → page)

Notifications no longer live behind a header bell. Instead:
- A **Notifications preview** zone in the feed shows ~2 recent items with **"See all"** → a dedicated **Notifications page** (its own screen) with the full list.
- Notification kinds: someone **replied to your post**; someone **replied to a comment or circle-video you left** elsewhere; two friends **connected through you**; touch-grass answers ("Sam's in"); friend requests to confirm.
- The old "Updates" section is folded into this — friend changes/plans surface here too.

### Messages slot (reserved for chat)

The header's top-right is **reserved for Messages (chat)** — a chat icon that's dormant until chat ships. Bridger has no chat element yet but will; this slot is where it goes, replacing where a notification bell would otherwise sit. See `ARCHITECTURE.md` (`messages` planned module).

### Floating nav

The five destinations sit in a **floating pill nav** — detached from the bottom edge with margin, rounded, and slightly dynamic (Apple's newer style; may tuck on scroll). Active destination = filled circle. See `DESIGN.md`.

### Co-op portal access

Two entry points, no third: the **co-op card** here, and the **Co-op row in Profile → Settings**. Both are membership-aware and land in different places:

- **Member** → straight to the **member portal** (`coop/portal.tsx`): vote on what gets built next, the quarterly books, what shipped from previous votes, and a direct feedback line. "What membership includes" links back to the benefits page.
- **Not a member** → the **membership page** (`coop/index.tsx`): always-free list, what members get, circle caps, and **Join · $24 a year**. Joining makes you a member and drops you straight into the portal.

> **Split vs stack rule:** side-by-side layout is for *actions* (buttons/tiles), never for two live content feeds — two content columns are too cramped at phone width. Zone 6 splits; everything else stacks full-width.

### Posting — one entry, with audience choice

There is **no top-right `+`**. All posting happens from the **"Your story" tile**. After capture, the user picks the audience. Tiers are **concentric and shown as multi-select** — choosing a wider circle auto-checks the tighter ones, and both stay lit so the reach is visible:

- Close friends → Close friends checked.
- Friends → Close friends **and** Friends both checked.
- Everyone → all three checked.

Each tier row has a **caret** (tucked, not prominent) that expands the people in that tier, each with a checkbox to **deselect individuals** for this post. Advanced; ignorable by default.

### Polls (separate from the story composer)

Poll creation is its own action (zone 6), **not** folded into the story composer — a story is an ephemeral capture, a poll is a question with lingering results. A poll uses the same audience picker. While a poll is live, its running results show on the author's own Home (zone 7).

### Touch grass — send and answer

- **Send** (header trigger): pick an audience (same concentric picker) and a rough "when," then send. Everyone in that audience gets a **notification** and sees your signal on their Home. No view counts.
- **Answer** (a friend's signal card): **"I'm in"** or dismiss with an **✕** — there is no explicit "no."

**Saying "I'm in" is a moment, and it lands you in the conversation.** Grass explodes out of the card, then you're taken **straight into the message thread** with the person who posted it, with your yes already sent ("I'm in for touching grass. What's the plan?"). Agreeing and then working out where to meet shouldn't be two separate jobs in two separate places — the whole point of touch grass is getting outside together, so the app hands you the thread and gets out of the way. Only the originator is notified. This works identically from the card and from the detail sheet, on Home and on Events.

### This week (the weekly section)

Home's weekly-cadence content, all conditional:
- **Friends' week podcast** — a play button for the stitched recap of friends' recorded answers ("6 recaps · 4 min").
- **Add your recap** — 3 questions, ~45s each, so the user is included in the podcast (owned by `quizzes`/weekly-questions).
- **Quiz** — this week's quiz: a take-it CTA that becomes a result distribution after completion.

### Story tiles (the peek design)

Rectangular tiles, **not** bubbles. Each: story image fills the tile, profile photo tucked top-left, name bottom-left. A small `week` badge (top-right) marks a `WeekSummaryPeek` — tap opens the day-by-day recap before the story. No view counts on tiles.

---

## Data — the `HomeFeed` payload

`feed` assembles one payload; each zone may be empty. Everything is pre-filtered to the caller's active tier filter via `permissions`.

```ts
interface HomeFeed {
  touchGrass: TouchGrassSignal[];  // friends currently free (answerable / dismissible)
  coopBanner?: CoopBanner;         // announcement / feedback ask; omitted when none
  stories: StoryTile[];            // already tier-filtered; excludes view data
  updates: Update[];               // bounded (e.g. last N), recency-ordered
  yourPoll?: PollResults;          // your live poll + running tallies (author-visible)
  week?: WeeklySection;            // podcast recaps + recap prompt + quiz; omitted off-week
  coopPrompt?: CoopPrompt;         // footer; omitted for co-op members
  friendCount: number;             // drives cold-start vs populated (never shown as a total)
}

interface PostAudience {
  tier: 'close' | 'friend' | 'everyone';   // concentric — expands to all tiers <= this
  excludedPersonIds: string[];             // per-person deselection via the caret
}
```

Tier filter change → re-query (or client-filter) `stories` + `updates` by the selected tier. Touch-grass signals and the co-op banner respect their own audience.

---

## State matrix

Home has three shapes. `friendCount` and per-zone emptiness decide which.

### A · Cold start — no friends (`friendCount === 0`)

The most important state. Header stays; the body becomes a single invitation (see mockup):
- Icon + "Bring your people in" + one line: "Bridger is quiet until your friends are here."
- Three actions, straight into the `(connect)` flow: **Share your invite link** (primary), **Scan a QR code**, **Find someone**.
- A soft mission reminder card: "Social media was supposed to connect us. This is where you start again."
- No empty story row, no empty update list — those are replaced entirely, not shown blank.

Copy is an invitation, not an apology — never "Nothing here yet."

### B · Quiet day — has friends, nothing new today

Friends exist but no active stories/signals/updates:
- Stories row still shows friends' tiles (tap still opens their latest `WeekSummaryPeek` even if today is empty), plus the "Your story" tile nudging the user to post.
- A gentle line where the signals would be: "All quiet today. Post something, or reach out to someone you've been missing."
- The action row (poll / ask a question) and co-op footer show normally; This week shows only if there's active weekly content.

### C · Active — the populated hub

The full layout above. Empty zones (touch-grass, co-op banner, updates, your poll, This week) each hide themselves; the page never shows a labeled-but-empty section, so length tracks how much is actually happening.

---

## Behavior notes

- **No infinite scroll.** Updates are capped; when exhausted, the list simply ends.
- **Pull to refresh** re-fetches `HomeFeed`.
- **Posting is capture-only and story-only from Home** (per app-wide rule): the "Your story" tile opens the camera, never a library picker, then shows the concentric multi-select audience picker (with per-person caret). Limits (3 stories/day, 20s video) are enforced by `stories`.
- **Touch-grass** has two directions: send from the header trigger (audience + when → notifies that circle), and answer on a friend's signal card — **"I'm in"** (notifies the originator) or **✕** to dismiss. No explicit "no."
- **Polls** are created from the action row (separate from stories), use the audience picker, and surface running results on the author's Home while live.
- **This week** is the weekly-cadence hub: friends' recap podcast, the add-your-recap prompt, and the quiz (CTA → results). Hidden entirely off-week.
- **Split for actions, stack for content:** only the poll/ask-a-question action row is side-by-side; content sections never are.
- **Co-op** appears twice by design: a conditional banner above Stories (announcements/feedback) and the persistent footer join-link (swaps to a member state once joined).

---

## Component / module mapping

| Piece | Component | Backend |
|---|---|---|
| Whole page assembly | `home.tsx` | `feed` |
| Touch-grass trigger (header) | `TouchGrassButton` | `touchgrass` |
| Touch-grass signals + answer/dismiss | `ConditionalStrip` | `touchgrass` |
| Co-op banner (above stories) | `ConditionalStrip` | `coop` |
| Story tiles + peek | `StoryTile`, `WeekSummaryPeek` | `stories` |
| Post audience picker (multi-select + caret) | (compose sheet) | `stories` + `permissions` |
| Tier filter | (inline dropdown) | `tiers` + `permissions` |
| Create poll / ask a question | (action row) | `polls` / `quizzes` |
| Your live poll results | (inline card) | `polls` |
| This week (podcast, recap, quiz) | (weekly section) | `quizzes` (weekly-questions) |
| Cold-start actions | (reuse) | `connections` (`(connect)` flow) |
| Co-op footer | (inline) | `coop` |

---

## Acceptance criteria

- [ ] `friendCount === 0` renders the cold-start invitation, not empty zones.
- [ ] There is no generic `+`; the header's right control is the touch-grass trigger, and the only post entry is the "Your story" tile.
- [ ] Touch-grass signals, co-op banner, updates, your poll, and This week each hide independently (no header, no gap) when empty.
- [ ] Posting shows the multi-select audience picker: choosing Friends also checks Close friends (both lit); Everyone checks all three.
- [ ] Each tier row has a caret that expands its members for per-person deselection; deselections apply only to that post.
- [ ] Sending touch-grass notifies the chosen circle; a friend's card offers "I'm in" (notifies the originator) and ✕ to dismiss — no explicit "no."
- [ ] Polls are created from the action row (not the story composer), use the audience picker, and show running results on the author's Home while live.
- [ ] The action row (poll / ask a question) is the only side-by-side zone; content sections stack full-width.
- [ ] This week shows the friends' recap podcast, an add-your-recap prompt, and the quiz (CTA → results), and hides off-week.
- [ ] Co-op banner (above stories) and co-op footer are distinct; banner is conditional, footer persists for non-members.
- [ ] Story tiles are rectangular with pic-in-corner; the week badge opens the summary peek.
- [ ] No story view count or follower count appears anywhere on Home.
- [ ] Changing the tier filter re-filters stories and updates.
- [ ] The page does not scroll infinitely; updates are bounded and end.
- [ ] Posting opens the camera (no library upload) and respects the 3/day, 20s limits.
- [ ] Empty-state and quiet-state copy read as invitations, never "Nothing here yet."
