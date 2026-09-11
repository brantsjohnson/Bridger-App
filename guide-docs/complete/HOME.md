# Bridger — Home Page

Build doc for the Home tab. Maps to `apps/mobile/app/(tabs)/home.tsx`, the `feed` API module, and the `StoryTile` / `ConditionalStrip` / `TouchGrassButton` / `WeekSummaryPeek` components in `ARCHITECTURE.md`. Read that file first — this assumes the `ProfileAttribute` model, tiers, and module names from it.

---

## What Home is (and isn't)

Home is a **bounded hub**, not an infinite algorithmic feed. It shows a finite, refreshable snapshot of your chosen people, ordered by recency and relevance — never ranked to maximize scroll. You see who *you* picked to see. Pull-to-refresh; no endless load.

Two privacy rules are visible here as **absences**, enforced by `feed` (per `ARCHITECTURE.md`): no story view counts and no follower counts appear anywhere on this screen for anyone.

### Onboarding seeds the starting arrangement

Admin still owns the **global** default widget arrangement (`ADMIN.md`). Onboarding's desire step writes a per-user `home_layout_seed` (`stay_close` / `go_deeper` / `make_plans` / `meet_people`) and seeds that person's starting Home order + empty-state teach from a deterministic map in `ONBOARDING.md`. Same bones for everyone; desire only changes emphasis. The person can rearrange anytime (`home_layout_saved`). Desire prefs never enter matching embeddings.

The last Home they saw (widget order plus the last stories / cards) stays on the phone so tapping Home does not rebuild from empty. New items still refresh in the background. Edit → Done writes that arrangement locally and to the server.

---

## Layout (top → bottom)

```
┌─────────────────────────────┐
│  Search people      [💬]    │  1 · Header — search + messages slot (reserved)
├─────────────────────────────┤
│ ‹ 🌱 Maya's free—you in? › ●○○│  2 · Announcements carousel (swipe; conditional)
│     [ I'm in ]  ✕           │     touch grass · quick check · co-op · birthdays
├─────────────────────────────┤
│  Stories      Close ▾       │  4 · Stories row (tier filter)
│  [+ your story][tile][tile] │
├─────────────────────────────┤
│  ▸ What people said · reply │  4a · Responses to your update (conditional)
├─────────────────────────────┤
│  Notifications      See all │  5 · Notifications preview (2, → page)
│  • Sam replied to your story│
│  • You + Alex connected     │
├─────────────────────────────┤
│  Inside jokes · new 🗒    │  5b · Recent inside jokes (falls back to "moments")
├──────────────┬──────────────┤
│ Create poll  │ Ask question │  6 · Action row (split — actions only)
├──────────────┴──────────────┤
│  Your poll · results ▁▃     │  7 · Your live poll (conditional)
├─────────────────────────────┤
│  This week                  │  8 · Weekly section (conditional)
│  Quiz · take → who got who  │  (recap podcast lives on Friends, not here)
├─────────────────────────────┤
│  ✏️ Notes App Discovery · post →  │  8c · Side Quest (conditional, admin-hosted)
├─────────────────────────────┤
│  $6 a month                 │  9 · Co-op footer (opens co-op portal)
├─────────────────────────────┤
│   ( home  cal disc ppl you )│  Floating pill nav (detached, dynamic)
└─────────────────────────────┘
```

### Zone-by-zone

| # | Zone | Contents | Component | Empty behavior |
|---|---|---|---|---|
| 1 | Header | Search (people; events later) + **messages icon** (opens Messages — see `MESSAGES.md`) | `MessagesButton` | always shown |
| 2 | **Announcements carousel** | One **swipeable** strip holding whatever's live — **one-time intro** (until dismissed), **touch-grass signals** (I'm in / ✕), the **quick check-in** (model-backed; demo may seed a sample), **co-op** announcements, and **coming up** (birthdays ≤1wk + day-of, custom date reminders, check-in nudges). Page dots; each card tappable | `AnnouncementsCarousel` | **hidden entirely when there are no announcements** (intro counts until dismissed) |
| 4 | Stories | Tier filter (Close / Friends / Everyone) + tiles; **first tile = "Your story"** — post *and* **tap to view your own** posted update. When Assistant is opted in, the **AgentWidget** (Billy) sits **directly under** this row (and under "what people said" when present); full-screen AgentScreen for longer threads; AgentIsland when live off Home | `StoryTile` + `AgentWidget` | see state matrix |
| 4a | What people said | Under the stories row: **reactions & video responses** to your update ("this is what people said") — **tap to watch/read and reply** | `ResponseStrip` | hidden when no responses |
| 5 | Notifications preview | ~2–3 unread; **tap the card or See all → Notifications page**; tap a row → that item's destination; no unread → **"All caught up!"** | `NotificationRow` | shows unread; empty → All caught up |
| 5b | Inside jokes | A few **new sticky-note inside jokes** from the week (from the Inside Jokes wall); when none are new, falls back to older ones as **"moments"** | — | always shows something (new or moments) |
| 6 | Ask the group | **Create a poll** \| **Ask a question** — **co-op only** (creating; answering is free) — plus a **"See previous polls"** link into past/other polls | (split row) | shown; create gated to co-op |
| 7 | Your live poll | Your active poll + running results, visible on your own Home | — | hidden when no live poll |
| 8 | This week | The **quiz**: **Take the quiz** until the first finish, then **See your result** + **Share quiz** + **"who got who"** (see `TOUCHGRASS-AND-QUIZ.md`). The recap **podcast** and **add-your-recap** prompt (the Friend Pod) are **not on Home**; they live on the **Friends** tab (see `RECAP-PODCAST.md`) | — | hidden when nothing active |
| 8c | Side Quest | Entry card into the hosted wall (e.g. "Notes App Discovery · post yours"). Photo quests use polaroids; text quests use a notes-style blurb input. | — | **hidden unless a Side Quest is live in admin** |
| 9 | Co-op footer | Hero **"$6 a month"** · "Join the co-op · you are not the product" — opens the co-op portal (also reachable from Profile settings) | — | always shown (non-member) |

### Notifications (header bell)

The top-right bell opens the **notifications center**, which is where reply activity surfaces:
- Someone **responded to your post**.
- Someone **replied to a comment or circle-video you left** on another person's page.
- Two of your friends **connected through you** (the mutual-connection payoff).
- Touch-grass answers ("Sam's in").

Moving notifications to the header (and touch-grass into the feed) makes "you have new replies" the prominent, glanceable thing — conversations are what should pull people back, not a broadcast button.

### Inside jokes on Home

New sticky-note **inside jokes** from the week surface here — a few recent ones from the Inside Jokes wall (see `PROFILE.md`) so people catch the funny things being said. When there are none new, the zone **falls back to "moments"**: older ones resurfaced, so it's never empty and always a little joy. Tapping one opens it on the relevant profile.

### Side Quest (hosted wall)

When the organizer has a Side Quest **live** (turned on in admin), a card appears here that opens the **quest wall** — a themed, communal feed. The quest is a prompt like "Notes App Discovery" ("Share a blurb from your notes app archives."); anyone can **post into it**. **Posting asks who you want to share it with** — the **same audience picker as a story/update** (Close / Friends / Everyone, or a group) — so contributing respects tiers exactly like every other post.

Quests have a **post style**:
- **Photo** — in-app capture only (app-wide rule); the wall is **Polaroid-style photos**, each **double-tap to heart**.
- **Text** (e.g. Notes App Discovery) — a **notes-style blurb input** on the same yellow-card vibe; the wall is **tilted text-note cards**, still double-tap to heart.

It's celebratory, not competitive — hearts, no rankings or view counts. Each viewer only sees contributions shared with their tier.

The zone is **absent entirely** until a Side Quest is switched on in admin, and disappears when it ends — so Home only carries it when there's genuinely something running. See `ADMIN.md` (hosting) and the `activities` module.

### Notifications (feed preview → page)

Notifications no longer live behind a header bell. Instead:
- A **Notifications preview** zone in the feed shows ~2–3 recent items with **"See all"** → a dedicated **Notifications page** (its own screen) with the full list.
- **Tapping the card** (or See all) always opens that page. **Tapping one row** goes to what that notification is about (Discover request, event, etc.).
- **Story replies are not in this widget.** They already have the Home replies row under Stories. They still appear on the full Notifications page and in Messages. Full rules: **`NOTIFICATIONS.md`**.
- The old "Updates" section is folded into this — friend changes/plans surface here too.

### Announcements carousel (the top strip)

The top of Home is a single **swipeable carousel** that consolidates what used to be separate strips. It holds only what's **actually live**, one card per item, with **page dots** — swipe through them:

- **Intro (one-time)** — when nothing else is live yet, a short explainer: this strip is for co-op notes and exciting things about the app. Tap the card or the X to dismiss forever (device flag). After dismiss, the carousel hides until something real appears.
- **Touch grass** — a friend's signal ("Maya's free tonight — grab food?") with **I'm in** / **✕**. (Sending your own happens on the **Events page**, not Home; see that section.)
- **Quick check** — the profile-freshness nudge ("Still into beatboxing?" → **Yes** / **update**), from the model when your profile looks stale (see `ONBOARDING.md`). Demo may seed a sample card; live never shows a fake one.
- **Co-op** — announcements / feedback asks from the co-op (community call, dues vote, a new feature).
- **Coming up** — **birthdays** (within ~a week, and again on the day — cake icon; only friends who shared their birthday with your tier), **custom date reminders** (dates you saved on a friend, firing 1 week before + on the day — "Priya's graduation · in 1 week"), and optional **check-in nudges** ("Check in with Jade?") from private friend notes with no calendar date. **Row color = their circle** (green Close / blue Friends / orange Acquaintances). **Order is soonest first** (now → Today → weekday → in N days). Tapping opens that friend's profile. Check-ins also push as `friend_check_in` when due.

**When there are no announcements (and the intro was dismissed or never needed), the whole carousel is hidden** — the top of Home is simply empty, and Stories become the first thing. Cards are aggregated from existing sources (`touchgrass`, `coop`, `notifications` for birthdays/reminders, the freshness signal) plus the one-time intro; the carousel is a presentation layer, not a new data store.

### Editable widgets (containers stay)

Home keeps its widget shells for a new user. Quiz, Side Quest, Stories, Co-op, and Notifications each show their own null copy inside the box. Announcements show the one-time intro until dismissed; after that they stay out until something is live.

- **This week** (next-event widget) — when empty, one quiet line; tap opens the **Events** tab.
- **Coming up** — when empty (new account / nothing due), a **blue** teach row (calendar icon + copy + **X**): **"Anything important about your friends, like birthdays or custom dates you've saved, will show up here when it's coming up!"** X dismisses forever on-device; the section hides until a real item appears. When filled, rows open that friend's profile.

### Assistant on Home (opt-in)

When the person has turned Assistant on in Settings, the **AgentWidget** (user-facing name: Billy) appears **under Stories** (after the story tiles and the replies row). Short asks can finish on Home; longer threads open the full-screen AgentScreen. If work is still live when they leave Home, **AgentIsland** pins a small capsule at the top (never on Home itself; idle = hidden). Confirmed acts still use Bridger drafts/previews (messages are in-Bridger only). Settings keeps the toggle + Open entry. People who never opted in never see Widget, Screen, or Island. See `AGENT.md` / `AGENT-SCOPE.md` and Magic Patterns `components/assistant/`.

### Messages (header icon)

The header's top-right icon opens **Messages** — Bridger's intentionally-limited chat (5/day per conversation, built to push people to share a contact card; see `MESSAGES.md`). You can also start a message from a friend's profile.

### Floating nav

The five destinations sit in a **floating elongated capsule** — detached from the bottom edge with a little side margin, and slightly dynamic (Apple's newer style; may tuck on scroll). Active destination = filled elongated pill in that tab's color (Home teal · Friends coral · Events touch-grass green · Discover amber · News purple). A matching-color dot marks unread activity on a tab; opening the tab clears that nav dot and leaves a matching little dot beside the section title the news is in. See `DESIGN.md` and `NOTIFICATIONS.md`.

### Co-op portal access

Two entry points, no third: the **Join the co-op** footer here, and a **co-op icon in Profile → Settings**. The co-op portal itself is **not built inside the app** — it's an existing external surface, gatekept to members; it opens in-app for members or in the browser otherwise. Bridger only links to it.

> **Split vs stack rule:** side-by-side layout is for *actions* (buttons/tiles), never for two live content feeds — two content columns are too cramped at phone width. Zone 6 splits; everything else stacks full-width.

### Posting — one entry, with audience choice

There is **no top-right `+`**. All posting happens from the **"Your story" tile**. After capture, the user picks the audience. Tiers are **concentric and shown as multi-select** — choosing a wider circle auto-checks the tighter ones, and both stay lit so the reach is visible:

- Close friends → Close friends checked.
- Friends → Close friends **and** Friends both checked.
- Everyone → all three checked.

Each tier row has a **caret** (tucked, not prominent) that expands the people in that tier, each with a checkbox to **deselect individuals** for this post. Advanced; ignorable by default.

### What people said (under stories)

Right under the stories row, a strip surfaces the **reactions and video responses to your update** — "this is what people said." Each is **tappable**: watch a friend's video reply or read a text one, and **reply back** right there. It brings the conversation *to* Home instead of hiding it inside the story viewer. Hidden when your update has no responses (or you haven't posted).

### Ask the group — polls & questions (co-op to create)

**Creating** a poll or asking a question is a **co-op feature** (`COOP.md`) — the split "Create a poll | Ask a question" tiles prompt to join if you're not a member. **Answering** polls is always free. A poll uses the same audience picker; while live, its running results show on the author's Home (zone 7). A **"See previous polls"** link opens your **past and other polls** — tap any to revisit it and its results. (A poll is a question with lingering results, distinct from the ephemeral story capture — so it's its own action, never folded into the story composer.)

### Touch grass — browse & answer (send lives on Events)

**Founder decision:** the big green **"TOUCH GRASS" send button lives only on the Events page**, not on Home. Home never sends a signal; it only surfaces friends' signals for you to answer. Do not re-add the send button to Home unless the founder reverses this.

- **Send** — happens on the **Events page** (the big green button + sheet there). Full spec: `TOUCHGRASS-AND-QUIZ.md`.
- **Browse** — on **Home**, friends' signals appear as **cards in the announcements carousel** (above), each showing **who + when + why**.
- **Answer** (a signal card or its detail): **"I'm in"** or dismiss with **✕** — no explicit "no." "I'm in" notifies the originator, turning the signal into a plan.

### This week (the weekly section)

Home's weekly-cadence content, all conditional:
- **Quiz** — this week's quiz: **"Take the quiz"** until the first finish, then **"See your result"** plus **Share quiz** and the **"who got who"** / **"Your versions"** dashboard. The first J-name result also lives on Profile after Home rotates. A shared invite link lets a friend take Which J name with no account; making an account adds you so both can see the duo result.

**Moved off Home:** the **Friends' week podcast** (play the stitched recap) and the **Add your recap** prompt are the **Friend Pod**, which now lives on the **Friends** tab (opens `/recap`), not Home. See `RECAP-PODCAST.md`.

### Story tiles (the peek design)

Rectangular tiles, **not** bubbles. Each: story image fills the tile, profile photo tucked top-left, name bottom-left. A small `week` badge (top-right) marks a `WeekSummaryPeek` — tap opens the day-by-day recap before the story. No view counts on tiles.

---

## Data — the `HomeFeed` payload

`feed` assembles one payload; each zone may be empty. Everything is pre-filtered to the caller's active tier filter via `permissions`.

```ts
interface Announcement {           // one card in the top carousel
  kind: 'touchGrass' | 'quickCheck' | 'coop' | 'comingUp';
  payload: unknown;                // the underlying signal/nudge/reminder
}

interface HomeFeed {
  announcements: Announcement[];   // top carousel; empty array → carousel hidden
  stories: StoryTile[];            // already tier-filtered; excludes view data
  updates: Update[];               // bounded (e.g. last N), recency-ordered
  responses: UpdateResponse[];     // "what people said" on your update
  yourPoll?: PollResults;          // your live poll + running tallies (author-visible)
  week?: WeeklySection;            // Home shows the quiz only; recap podcast + prompt live on Friends; omitted off-week
  coopPrompt?: CoopPrompt;         // footer; omitted for co-op members
  friendCount: number;             // drives cold-start vs populated (never shown as a total)
}

interface PostAudience {
  tier: 'close' | 'friend' | 'everyone';   // concentric — expands to all tiers <= this
  excludedPersonIds: string[];             // per-person deselection via the caret
}
```

Tier filter change → re-query (or client-filter) `stories` + `updates` by the selected tier. Announcement cards (touch grass, co-op, coming up) respect their own audience.

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

The full layout above. Empty zones (announcements carousel, updates, your poll, This week) each hide themselves; the page never shows a labeled-but-empty section, so length tracks how much is actually happening.

---

## Behavior notes

- **No infinite scroll.** Updates are capped; when exhausted, the list simply ends.
- **Pull to refresh** re-fetches `HomeFeed`.
- **Posting is capture-only and story-only from Home** (per app-wide rule): the "Your story" tile opens the camera, never a library picker, then shows the concentric multi-select audience picker (with per-person caret). Limits (3 stories/day, 20s video) are enforced by `stories`.
- **Touch-grass on Home is answer-only:** a friend's signal card offers **"I'm in"** (notifies the originator) or **✕** to dismiss. No explicit "no." **Sending** a signal happens on the **Events page**, not Home.
- **Polls** are created from the action row (separate from stories), use the audience picker, and surface running results on the author's Home while live.
- **This week** on Home is just the **quiz** (Take the quiz → See your result). The recap podcast + add-your-recap prompt (Friend Pod) live on the Friends tab. Hidden entirely off-week.
- **Split for actions, stack for content:** only the poll/ask-a-question action row is side-by-side; content sections never are.
- **Co-op** appears twice by design: a conditional banner above Stories (announcements/feedback) and the persistent footer join-link (swaps to a member state once joined).

---

## Component / module mapping

| Piece | Component | Backend |
|---|---|---|
| Whole page assembly | `home.tsx` | `feed` |
| Touch-grass send button (**Events page only**, not Home) | `TouchGrassButton` | `touchgrass` |
| Announcements carousel (touch grass answer cards · quick check · co-op · coming up) | `AnnouncementsCarousel` | `touchgrass` / `coop` / `notifications` |
| Responses to your update ("what people said") | `ResponseStrip` | `reactions` |
| Story tiles + peek | `StoryTile`, `WeekSummaryPeek` | `stories` |
| Post audience picker (multi-select + caret) | (compose sheet) | `stories` + `permissions` |
| Tier filter | (inline dropdown) | `tiers` + `permissions` |
| Create poll / ask a question | (action row) | `polls` / `quizzes` |
| Your live poll results | (inline card) | `polls` |
| This week (quiz only on Home) | (weekly section) | `quizzes` (weekly-questions) |
| Cold-start actions | (reuse) | `connections` (`(connect)` flow) |
| Co-op footer | (inline) | `coop` |

---

## Acceptance criteria

- [ ] `friendCount === 0` renders the cold-start invitation, not empty zones.
- [ ] There is no generic `+`; the header's right control is the messages icon, and the only post entry is the "Your story" tile. **Home has no Touch Grass send button** (send lives on the Events page).
- [ ] The top of Home is a single swipeable announcements carousel (one-time intro until dismissed, touch-grass signals, model-backed quick check-in, co-op announcements, coming-up birthdays/reminders/check-ins) with page dots; it hides entirely when there is nothing live (and the intro was dismissed).
- [ ] Live Home never shows a fake "Still into…?" quick check; demo may seed one for design preview.
- [ ] When Assistant is opted in, AgentWidget appears under Stories; AgentScreen / AgentIsland behave per AGENT.md; when off, all three are absent.
- [ ] The announcements carousel hides entirely when empty; updates, your poll, and This week each hide independently (no header, no gap) when empty.
- [ ] Posting shows the multi-select audience picker: choosing Friends also checks Close friends (both lit); Everyone checks all three.
- [ ] Each tier row has a caret that expands its members for per-person deselection; deselections apply only to that post.
- [ ] On Home, a friend's touch-grass card offers "I'm in" (notifies the originator) and ✕ to dismiss — no explicit "no." (Sending a signal is on the Events page, not Home.)
- [ ] Polls are created from the action row (not the story composer), use the audience picker, and show running results on the author's Home while live.
- [ ] The action row (poll / ask a question) is the only side-by-side zone; content sections stack full-width.
- [ ] This week on Home shows only the quiz (Take the quiz until the first finish, then See your result) and hides off-week; the recap podcast + add-your-recap prompt (Friend Pod) are on the Friends tab, not Home.
- [ ] The co-op footer persists for non-members; co-op announcements appear as a card in the announcements carousel (distinct from the footer).
- [ ] Story tiles are rectangular with pic-in-corner; the week badge opens the summary peek.
- [ ] No story view count or follower count appears anywhere on Home.
- [ ] Changing the tier filter re-filters stories and updates.
- [ ] The page does not scroll infinitely; updates are bounded and end.
- [ ] Posting opens the camera (no library upload) and respects the 3/day, 20s limits.
- [ ] Empty-state and quiet-state copy read as invitations, never "Nothing here yet."
