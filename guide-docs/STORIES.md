# Bridger — Stories / Updates (viewer, posting, reactions)

Build doc for the story experience. **Framing: these are "updates," not "stories."** The ask is *"update your friends about today,"* not "tell a story." A post still *looks* like a story (a photo or video in a tap-through viewer), but the real payload is the **update** — what you did — which is what powers the weekly summary. Maps to `apps/mobile/app/story/[id].tsx`, the `stories` and `reactions` modules, and their ties to `polls` / `events` / `touchgrass` / `notifications`. Posting entry is the "Your story" tile on Home; the archive is on Profile.

---

## Posting rules (what you can post)

- **In-the-moment only.** No camera-roll uploads, ever — captured live in the app, Marco-Polo style.
- **3 posts/day**, **video ≤ 20s** (enforced by `stories`).
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

---

## The viewer (`story/[id]`) — player-style layout

Modeled on a music player's now-playing screen (Bridger-original, not a copy):

- **Segmented progress bars** at the very top — one segment per post (≤3).
- **Header** — down-chevron (close), name, timestamp, overflow (⋯).
- **The post** — photo / in-the-moment video, filling the background.
- **Caption block** — the post's context line.
- **Reaction rail (right side, vertical).** Marco-Polo style: small stacked buttons — **Record** (largest, circle-video), **Sticker/emoji**, **Comment**. This is the quick-react rail.
- **Live replies preview.** Where the controls used to sit (lower area), a preview **rotates through recent replies every ~2s** — you see that people you know are commenting (a text reply, a video-reply chip, a sticker). The **video does not auto-play**; it's a signal of activity. Tapping it opens the full comment section.
- **Peek card = the Catch-Up.** A colored card at the bottom edge showing a peek of the Catch-Up's top item, inviting a swipe up.

Tapping the post advances posts; the bars fill as you go.

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
1. **The right rail** on the story — quick **Record** (circle video, min length, ≤20s), **Sticker/emoji**, or **Comment**.
2. **The comment section** — opened by tapping the live replies preview (or the rail's Comment). There you see the full thread — text replies, **replies-to-replies** (nested), circle-video replies, and stickers — and can reply the same three ways.

A video reaction left on someone else's page is visible to mutual friends there too.

### Playful motion (Lapse-style)

Reactions aren't static — they animate over the story, which is half the fun:
- **Comments float like balloons** — as replies come in, they drift up across the screen; **tap a floating bubble to open the comment section**.
- **Emoji/sticker bursts** — reactions rise and burst as viewers watch a story; a sticker pops with a little animation.
- Motion is **transform/opacity only**, kept light, and wrapped in `prefers-reduced-motion` so it's opt-out — delight, never a performance tax or an accessibility problem.

Bigger, opt-in quirks (pet companions, emoji-bombing a friend on app open) live in the separate, toggleable **delight system** — see `DELIGHT.md`.

---

## Reply notifications (Home)

When someone **responds to your post**, or **replies to a comment or video you left on someone else's page**, you're notified — in the Home **notifications preview** (which links to the full **Notifications page**; see `HOME.md`). This is what turns one-off reactions into ongoing threads: "there are new replies."

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
  videoUrl?: string;           // min length enforced; ≤20s
  text?: string;
  stickerId?: string;          // sticker / flash-emoji
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

- [ ] Posting captures media live in-app only — no camera-roll upload path exists.
- [ ] Max 3 posts/day; video ≤20s. One capture button (tap photo / hold video); no Photo or Text buttons.
- [ ] After capture the composer prompts an **update** ("what did you do today"), enterable by typing **or voice-to-text**; video updates are auto-transcribed.
- [ ] Three themed-post squares (admin-rotatable) sit above capture; picking a theme labels the update.
- [ ] The viewer shows one progress segment per post (≤3), the post, the update text, a right-side vertical reaction rail (Record / Sticker / Comment), and a live replies preview that rotates ~every 2s without auto-playing video.
- [ ] The weekly summary is **AI-written, ~1–2 sentences per day with that day's media**, **pre-generated at post time** (not on swipe), tier-filtered.
- [ ] The summary is built **only from the user's update text + video transcripts** — never from analyzing or training on their photos/likeness.
- [ ] Tapping the replies preview (or Comment) opens the full comment section with text, nested replies, video replies, and stickers — a second place to react.
- [ ] The Catch-Up peek card previews its top item.
- [ ] In the Catch-Up, a live poll/question/event renders at the top **compactly** (poll shows a small "closes Xd", not a big block); the event uses its **real cover image** like everywhere else; tapping **Going** starts a countdown on the card.
- [ ] Currently is a **small split** (Listening | Reading), not a big block.
- [ ] The **week is the hero**: each day is a bold day title + a big ~square photo + a caption underneath, stacked down within the sheet.
- [ ] Once the viewer answers a poll/question, it sinks to the **very bottom** and its **results are not shown** (just "You answered '{poll}'").
- [ ] When nothing is actionable, the top/peek reads "{Name} · What you missed" and the week hero is the first thing.
- [ ] Reactions support circle video (min length), text (nested replies), and stickers/emoji.
- [ ] Responses to your posts, and replies to comments/videos you left elsewhere, notify you in the Home notifications preview (→ Notifications page).
