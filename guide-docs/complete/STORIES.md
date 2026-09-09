# Bridger — Stories / Updates (viewer, posting, reactions)

Build doc for the story experience. **Framing: these are "updates," not "stories."** The ask is *"update your friends about today,"* not "tell a story." A post still *looks* like a story (a photo or video in a tap-through viewer), but the real payload is the **update** — what you did — which is what powers the weekly summary. Maps to `apps/mobile/app/story/[id].tsx`, the `stories` and `reactions` modules, and their ties to `polls` / `events` / `touchgrass` / `notifications`. Posting entry is the "Your story" tile on Home; the archive is on Profile.

---

## Posting rules (what you can post)

> **Superseded 2026-09-08 by `SCRAPBOOKS.md`.** Posting is now a two-screen Scrapbook flow: an 8.5 x 11 page with layouts, **4 photos/videos a day across 1 to 4 pages**, **camera roll allowed for pages** (replies and stickers stay capture-only), an **Only me** audience, same-day edits, and a local draft. The bullets below describe the old flow and are kept for history; where they disagree with `SCRAPBOOKS.md`, that doc wins.

- ~~**In-the-moment only.** No camera-roll uploads, ever~~ (pages may import from the roll; see `SCRAPBOOKS.md`).
- ~~**3 posts/day**~~ 4 photos/videos a day across pages; **video ≤ 20s** (enforced by `stories`).
- **One capture button** — tap for a photo, hold to record video. No separate Photo or Text buttons.
- **Video is a co-op capability.** Free members post **photos + text/voice-to-text updates**; **posting video** (updates and video reactions) is a co-op unlock — but **everyone can watch** video. See `COOP.md`.
- **Then write your update.** After capture, the composer prompts **"Update your friends"** / *"What did you do today?"* — a real, slightly longer **update caption** (not a one-word label). Two ways to enter it:
  - **Type** it, or
  - **Voice-to-text** — tap the mic and speak; it transcribes to text.
- **Video is transcribed** — any spoken words in a video update are transcribed to text automatically.
- The update text (typed / dictated / transcribed) is what the **weekly summary** is built from (below) — so the words matter more than the polish of the photo.

### Themed posts (suggested prompts)

Above the capture button sit three **themed-post squares** (dashed) under a "Themed posts" label — e.g. **OOTD** (outfit of the day), **Take 0.5** (the candid/bed-head/after-the-day shot), **Hot take**. Picking one **labels the resulting update** ("Outfit of the day"). Users can ignore them and just capture openly.

The three themes are **rotatable from the admin console** (see `ADMIN.md`).

### BeReal-like reminders (opt-in)

Under the themed posts sits a **toggle: "BeReal-like reminders"** — **1–3 notifications a day** with BeReal-style random timing to capture your life. Off by default. Turning it on:

- Saves notification pref kind `story_prompt` (same row in Profile → Settings → Notifications).
- Asks for notification permission in context (if not already granted).
- Schedules **1–3** push/in-app prompts per day at random times (server-side when push ships; demo schedules locally).
- When you are **hosting or going** to a **live event**, one of those prompts may be a mid-party nudge: **"📸 Don't forget to capture the mems"** at a random time during the party (once per event, per person). Skipped if you already posted **3 updates today**. Opens `/story/capture?eventId=…` with the event pre-tagged; posting saves the photo to that event's **Photo album** on the event page.
- Other prompts open `/story/capture` so they can post right then.
- Not circle-gated (you are nudging yourself). Does **not** appear in the Home notifications widget (push / Notifications page only when delivered).

---

## The viewer (`story/[id]`) — player-style layout

Modeled on a music player's now-playing screen (Bridger-original, not a copy):

- **Segmented progress bars** at the very top — one segment per post (≤3).
- **Header** — down-chevron (close), name, timestamp, overflow (⋯).
- **The post** — photo / in-the-moment video, filling the background.
- **Caption block** — the post's context line, in a dark scrim so it stays readable on any photo.
- **Bottom reaction row (right of the caption, vertically centered).** Order is **emoji → comment → record** (record is a red dot). This is the quick-react rail.
  - **Record** (red dot) opens the **circle recorder**: a round camera view with a ring that drains over **10 seconds**, then stops itself. Watch it back, retake, or send. Camera + mic are asked for at the moment you tap record, never at launch.
  - **Emoji** unrolls the **sticker tray** above the button: a scrollable strip of emoji, with a **"+"** to make your own sticker out of a photo you take. Your own stickers sit at the front of the strip afterwards.
- **Live replies preview.** Floating reply balloons drift up over the media (clamped so they never leave the screen). The **video does not auto-play**; it's a signal of activity. Tapping a bubble opens the full comment section.
- **Peek card = the Catch-Up.** A colored card at the bottom edge showing a peek of the Catch-Up's top item, inviting a swipe up.

**Tap zones on the media:** left third = previous post, **center = pause / resume**, right third = next post. Progress bars fill as you go.

**End of an author's posts:**
- From the **Home tray**, advance to the next friend in tray order (query `sequence=`). Keep going until the sequence ends or the viewer closes. Catch-Up stays **collapsed at the peek** while swapping friends (never flash open-then-closed).
- When the **last friend in the sequence** finishes (or a lone author with no next), show **"You're all caught up"** with confetti (skipped under Reduce Motion) and a Done button that closes the player.
- When you finish someone's posts, that tile is **marked watched for you**: the colored outline drops, and on the next Home paint the tile moves to the **back of the tray** (Your story stays first). Unwatched stay up front. This is personal "have I watched?" state only — never a public view count.
- From a **profile / Friends page** (`from=profile`), after their posts end, show the same caught-up screen, then Done returns there.
- If **Catch-Up is open**, do not advance or close under the sheet.

---

## The Catch-Up (the swipe-up sheet)

**Catch-Up** is the name of the swipe-up element. It's a single scrolling sheet whose hierarchy is: **quick actionable stuff up top (compact)**, then **the week as the hero**, then answered items at the very bottom.

### Top — actionable, but compact

A live **poll**, **question**, or **event** sits at the top and is what peeks up — but each is **kept small** so it doesn't dominate:
- **Poll** — a **compact** card: question + option chips + a tiny **"closes 2d"** (poster-set duration, max one week). It should *not* take a ton of space.
- **Event** — shows its **real cover image**, like events do everywhere else (consistent design, not a bespoke card). Tapping **Going** starts a **countdown** right on the card ("You're going · in 3 days").
- **Question** — a compact prompt.

### Currently (compact, split)

Directly under the actionable top: **Currently**, shrunk into a **split, two-cell row** — **Listening · {song}** | **Reading · {book}** — small side-by-side cells, not a big block.

### The week — the hero (why people swipe up)

This is the main event and should **feel important**, not subtle. The pre-generated weekly summary renders **day by day, each day predominant**:
- **A bold day title** — **"Sunday"**.
- **A big ~square photo** — that day's story image, filling **almost the whole widget width**.
- **A caption right underneath** — a real sentence of what they did ("Sent the climbing route she'd been projecting for weeks").
- Then the next day: **"Tuesday"** + big photo + caption. And so on, stacked down — all within the same Catch-Up sheet.

The photo is prominent and the caption is clear, so the week reads like a real recap worth opening — the fix for it feeling "too subtle."

### Very bottom — answered

**Polls/questions the viewer already answered** (that are still live on the friend's story) sink to the **very very bottom**, shown **compactly and *without* revealing the results/answers** — just "You answered '{poll}'." Below that, **Replies** open the comment section.

**It must stay unambiguous in code that a live, unanswered poll/question/event renders at the top and as the peek** — and that once answered, it drops to the bottom without showing results.

**When there's nothing actionable,** the top/peek reads **"{Name} · What you missed"** and the week hero simply becomes the first thing.

---

## The weekly summary (AI, pre-generated, from their own words)

The "{Name}'s week" content is an **AI-written summary** of that friend's week — **a couple of sentences per day** (Mon → Sun), each paired with the media they posted that day, and rendered as the **hero of the Catch-Up**: a bold day title, a big ~square photo, and the caption underneath (above). Two hard requirements:

- **Pre-generated at post time, not on view.** Each time someone posts an update, their day/week summary is (re)built and stored. It is **already sitting there** when a friend swipes up — it does **not** generate on-demand per viewer. (Cheaper, instant, and identical for everyone who can see it.)
- **Built from their own words, never from their photos.** The summary is composed from the user's **update captions + video transcriptions** (what they *said* they did). Bridger does **not** analyze faces or train on anyone's photos/likeness to write it. This is the privacy line: the AI describes the day from the person's text, and the photos are just shown alongside (see `DATA.md`).

Tier-filtered: a viewer only sees the days/updates shared with their tier. If a day had no update, it's simply omitted.

**Cadence by plan:** **free members get a weekly recap; co-op members get daily recaps** (richer, more compute) — same word-only privacy rule either way. See `COOP.md`.

---

## Reactions & replies — two entry points

You can react from **two places**, by design:
1. **The bottom reaction row** on the story (right of the caption) — quick **emoji** (tray + your own stickers), **Comment**, or **Record** (red dot → circle video, **≤10s**, hard-stopped).
2. **The comment section** — opened by tapping a floating reply (or Comment). There you see the full thread — text replies, **replies-to-replies** (nested), circle-video replies, and stickers — and can reply the same three ways.

A video reaction left on someone else's page is visible to mutual friends there too.

### Playful motion (Lapse-style)

Reactions aren't static — they animate over the story, which is half the fun:
- **Comments float like balloons** — as replies come in, they drift up across the screen; **tap a floating bubble to open the comment section**.
- **Emoji/sticker bursts** — reactions rise and burst as viewers watch a story; a sticker pops with a little animation.
- Motion is **transform/opacity only**, kept light, and wrapped in `prefers-reduced-motion` so it's opt-out — delight, never a performance tax or an accessibility problem.

Bigger, opt-in quirks (pet companions, emoji-bombing a friend on app open) live in the separate, toggleable **delight system** — see `DELIGHT.md`.

---

## Reply notifications (Home + Messages)

When someone **responds to your post**:

- **Home replies row** under Stories is the primary Home surface ("N replies to your story").
- **Do not** also show that alert in the Home Notifications widget (duplicate). Full rules: `NOTIFICATIONS.md` § Story replies.
- It **does** appear on the full Notifications page, can push, and **mirrors into Messages** as a `storyReply` bubble that **does not count** against the 5/day cap.
- Opening **one chip** clears that person only; opening the **header**, opening that DM, or replying in the story **clears** the matching notification(s) **and** removes those people from the Home replies row.

When someone **replies to a comment or video you left on someone else's page** (`story_reply_elsewhere`), that still uses the Home Notifications widget (there is no replies row for it).

### After the story expires (~24h)

Viewers can no longer open the expired story. The author can still answer a late reply; that answer lands as a normal DM to the replier. Tap destinations for stale reply alerts go to Messages, not the dead story.

### Lifecycle (two clocks)

| Clock | Field | What happens |
|---|---|---|
| **Live window (~24h)** | `live_until` (= `created_at + 24h`, generated) | Leaves the Home tray. Friends can no longer open it. **The picture is archived** on the author's Profile → Stories calendar so they can watch it back. |
| **Retention (~30 days free / forever co-op)** | `expires_at` | Free: media may be deleted when this passes. Co-op: `expires_at` stays null — archive keeps everything. |

Demo fixtures always show a populated calendar; live mode uses `GET /stories/archive`.

---

## Data (shapes)

```ts
interface UpdatePost {              // "story" surface, but it's an update
  id: string;
  authorId: string;
  type: 'photo' | 'video';          // one capture button: tap = photo, hold = video
  mediaUrl: string;                 // captured in-app only
  updateText: string;               // "what did you do today" — typed OR voice-to-text
  transcript?: string;              // for video: spoken words auto-transcribed
  themeSlug?: string;               // if posted via a themed prompt
  visibleToTier: 'close' | 'friend' | 'acquaintance';
  createdAt: string;                // media deleted after the retention window (PROFILE.md)
}

interface DaySummary {              // pre-generated at post time, per author per day
  authorId: string;
  date: string;                     // rendered with a bold day title ("Sunday")
  text: string;                     // caption — ~1–2 sentences, from updateText + transcript ONLY
  mediaRefs: string[];             // that day's photos/videos — shown BIG (~square, hero)
  visibleToTier: 'close' | 'friend' | 'acquaintance';
}

interface CatchUpItem {
  kind: 'poll' | 'question' | 'event' | 'weekSummary' | 'currently';
  layout: 'compact' | 'hero';  // poll/question/event/currently = compact; weekSummary = hero
  actionable: boolean;         // unanswered poll/question/event → top
  answeredByViewer?: boolean;  // true → sinks to the very bottom, results HIDDEN
  eventCoverUrl?: string;      // events use their real cover image (consistent)
  goingCountdownTo?: string;   // tapping "Going" starts this countdown on the card
}
// order: [compact actionable] → [Currently split] → [week HERO, day by day] → [Answered, no results] → [Replies]

interface Poll {
  id: string;
  closesAt: string;            // poster-chosen duration, MAX 1 week
}

interface Reaction {
  id: string;
  postId: string;
  authorId: string;
  kind: 'circleVideo' | 'text' | 'sticker';
  videoUri?: string;           // the round reply; ≤10s, hard cap at capture
  videoSeconds?: number;       // how long it actually ran
  text?: string;
  stickerId?: string;          // an emoji from the built-in strip
  stickerUri?: string;         // a sticker they made themselves (capture only)
  parentReactionId?: string;   // threading (replies-to-replies)
}

interface ThemedPrompt { slug: string; label: string; icon: string; }  // admin-rotated (ADMIN.md)
```

---

## Module mapping

| Piece | Backend |
|---|---|
| Capture (tap photo / hold video), limits | `stories` |
| Update caption (type or voice-to-text) | `stories` (dictation → text) |
| Video transcription | `stories` (speech-to-text) |
| Themed-post prompts (rotatable) | `stories` + admin (see `ADMIN.md`) |
| Viewer, progress bars, reaction rail, peek | `story/[id]` + `stories` |
| Live replies preview + comment section | `reactions` |
| Catch-Up · actionable top (poll/question/event, countdowns, poll ≤1wk) | `polls` / `events` |
| Catch-Up · Currently (listening / reading) | `profiles` (Spotify + current book) |
| **Weekly summary (AI, pre-generated from update text + transcripts, never photos)** | `stories` + AI summarizer (see `DATA.md`) |
| Circle-video / text / sticker reactions + threaded replies | `reactions` |
| Reply notifications | `notifications` |

---

## Acceptance criteria

- [ ] ~~Posting captures media live in-app only~~ Posting follows `SCRAPBOOKS.md` (camera or camera roll for pages; replies and stickers capture-only).
- [ ] ~~Max 3 posts/day~~ 4 photos/videos a day across 1 to 4 pages (`SCRAPBOOKS.md`); video ≤20s. One capture button (tap photo / hold video); no Photo or Text buttons.
- [ ] After capture the composer prompts an **update** ("what did you do today"), enterable by typing **or voice-to-text**; video updates are auto-transcribed.
- [ ] Three themed-post squares (admin-rotatable) sit above capture; picking a theme labels the update.
- [ ] Capture screen offers an opt-in "BeReal-like reminders" toggle (1–3 notifications a day); pref is `story_prompt`, also in Settings → Notifications; taps open `/story/capture`.
- [ ] The viewer shows one progress segment per post (≤3), the post, the update text, a bottom row with caption on the left and emoji → comment → record (red dot) on the right (vertically centered), and floating reply balloons that stay on-screen and do not auto-play video.
- [ ] Tap left = previous, center = pause/resume, right = next. Finishing the last post advances the Home tray sequence with Catch-Up staying at the peek (no open-then-close flash). End of the sequence (or a lone author) shows **"You're all caught up"** with confetti + Done. Opened from a profile still marks watched, then shows the same end screen. Never dismisses under an open Catch-Up. Finishing an author marks them watched: colored tray ring off, tile moves behind unwatched on the next Home paint.
- [ ] The weekly summary is **AI-written, ~1–2 sentences per day with that day's media**, **pre-generated at post time** (not on swipe), tier-filtered.
- [ ] The summary is built **only from the user's update text + video transcripts** — never from analyzing or training on their photos/likeness.
- [ ] Tapping the replies preview (or Comment) opens the full comment section with text, nested replies, video replies, and stickers — a second place to react.
- [ ] The Catch-Up peek card previews its top item.
- [ ] In the Catch-Up, a live poll/question/event renders at the top **compactly** (poll shows a small "closes Xd", not a big block); the event uses its **real cover image** like everywhere else; tapping **Going** starts a countdown on the card.
- [ ] Currently is a **small split** (Listening | Reading), not a big block.
- [ ] The **week is the hero**: each day is a bold day title + a big ~square photo + a caption underneath, stacked down within the sheet.
- [ ] Once the viewer answers a poll/question, it sinks to the **very bottom** and its **results are not shown** (just "You answered '{poll}'").
- [ ] When nothing is actionable, the top/peek reads "{Name} · What you missed" and the week hero is the first thing.
- [ ] Reactions support circle video (**≤10s, stops itself**, watch-back + retake before sending), text (nested replies), and stickers/emoji.
- [ ] The sticker button unrolls a **side tray** of scrollable emoji plus a **"+" to make your own sticker**; your stickers appear first in the strip and can be sent like any emoji.
- [ ] Sticker photos and video replies are **capture only** — there is no library picker anywhere in this flow (the profile photo stays the app's one upload exception).
- [ ] Camera and mic permissions are requested **in context** (on tapping record / the shutter) with a plain purpose string; declining leaves comments and emoji still usable.
- [ ] The caption and each floating reply sit in **their own solid bubble** so they stay readable over any photo.
- [ ] Responses to your posts surface in the Home **replies row** (not the Home Notifications widget), the full Notifications page, push, and a Messages mirror that does not burn the 5/day cap. Clear on engage. After expiry, late answers are DMs only. See `NOTIFICATIONS.md`.
- [ ] At **24h**, posts leave the Home tray and are **archived** on Profile → Stories (author can rewatch; friends cannot). At **~30d** free media may delete; co-op keeps forever. See lifecycle table above.
- [ ] Replies to comments/videos you left elsewhere notify you in the Home notifications preview (→ Notifications page). Tap destination map: `NOTIFICATIONS.md`.
