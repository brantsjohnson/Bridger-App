# Bridger — Stories (viewer, posting, reactions)

Build doc for the story experience. Maps to `apps/mobile/app/story/[id].tsx`, the `stories` and `reactions` modules, and their ties to `polls` / `events` / `touchgrass` / `notifications` in `ARCHITECTURE.md`. Posting entry is the "Your story" tile on Home; the archive is on Profile.

---

## Posting rules (what you can post)

- **In-the-moment only.** No camera-roll uploads, ever — captured live in the app, Marco-Polo style.
- **3 posts/day**, **video ≤ 20s** (enforced by `stories`).
- **One capture button** — tap for a photo, hold to record video. There are **no separate Photo or Text buttons**.
- **Text is added after capture**, layered onto the photo/video (a caption/overlay step), not a separate post mode.

### Themed posts (suggested prompts)

Above the capture button sit three **themed-post squares** (dashed) under a "Themed posts" label — e.g. **OOTD** (outfit of the day), **Take 0.5** (the candid/bed-head/after-the-day shot), **Hot take**. Picking one **labels the resulting story** ("Outfit of the day post"). Users can ignore them and just capture openly.

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

**Catch-Up** is the name of the swipe-up element (working name — alternatives: "The Loop", "The Rundown"). It's also what peeks above the story's bottom edge. It's a scroll of **big widget cards** (Hinge-prompt feel), with one firm ordering rule:

**Actionable items are always at the very top, most obvious.** A live **poll**, **question**, or **event** sits at the top and is what peeks up — nothing buries them.
- An **accepted event** shows a **countdown** ("Game night · in 2 days").
- A **poll** shows its own countdown; **duration is the poster's choice, max one week**.
- **Once the viewer has answered** a poll or question, that item **sinks to the bottom** (an "Answered" group), clearing the top for what's still actionable.

**When there's nothing actionable,** the top/peek instead reads **"{Name} · What you missed"** — a day label (Monday…) with a peek of a photo from an older story.

Below the actionable top, in order:
1. **Currently** — Listening to (Spotify) + Reading (book), from their profile.
2. **What you missed** — day-by-day week summary cards with optional media.
3. **Answered** — polls/questions the viewer already responded to (bottom).
4. **Replies** — opens into the comment section (or reach it from the live preview / rail).

**It must be unambiguous in code that a live poll, question, or event always renders at the top and as the peek** — that's the whole point of the element.

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
interface StoryPost {
  id: string;
  authorId: string;
  type: 'photo' | 'video';     // one capture button: tap = photo, hold = video (no text-only mode)
  mediaUrl: string;            // captured in-app only
  overlayText?: string;        // text added AFTER capture, layered on the media
  caption?: string;            // optional context line
  themeSlug?: string;          // if posted via a themed prompt (labels the story)
  createdAt: string;           // media deleted after the retention window (PROFILE.md)
}
```

### Replying to a reply

Under every comment, video reply and sticker sits a **quiet "Reply"** — small, muted, never competing with the words above it. Tapping it aims the composer at that one person ("Replying to Devon", with the placeholder changing to match) and the reply nests under theirs. You can back out of it with the ✕. Responding to a specific friend shouldn't require shouting at the whole thread.

### The tray scrolls sideways only

The story tray is a **horizontal** scroller and nothing else. Setting only `overflow-x` leaves the vertical axis computed as `auto`, which let the tray drift up and down a few pixels; the y axis is explicitly locked, with bottom padding so the "+" that hangs off your own tile still shows.

### Your own story in the tray

Once you've posted, the tray shows **your story tile with a "+" in its bottom-right corner** — that's how you keep adding through the day. The separate "Check in" tile only exists before your first post of the day, so there's never both a tile and an add button competing. Your tile carries an **inset** ink ring (an outer ring with offset got clipped by the horizontal scroller, which is why it wasn't showing).

### Catch-Up ordering and weight

The panel is ordered by what still needs the viewer, and weighted by what they actually came for.

1. **Live actionables** — polls, questions and events awaiting an answer. Compact cards: the kind and the countdown share one small line ("POLL · closes in 2 days") rather than the countdown taking a chip on its own row.
2. **Events carry their cover art**, the same photo they wear on the Events page and in Coming up. An event should look like an event everywhere; a bare colored box was an inconsistency.
3. **Saying "Going" starts a live countdown** — days / hrs / min / sec ticking in place of the buttons. The card stops being a decision and becomes anticipation.
4. **Currently** — listening and reading, split into two half-width tiles. A detail, not a headline.
5. **The week** — the reason people open this at all, so it's the loudest thing here: one card per day with the **day name large**, a **near-full-width square photo**, and the **caption underneath** ("Kit picked the spicy one and regretted it out loud for an hour"). All days live in the same section so the week reads as one story.
6. **"You already answered"** — at the very bottom, one quiet line per item with a check. It never re-shows results the viewer has already seen; it's a receipt, not a card.

```ts
interface CatchUpItem {
  kind: 'poll' | 'question' | 'event' | 'weekSummary' | 'currently';
  actionable: boolean;         // poll/question/event that the viewer hasn't answered/passed
  answeredByViewer?: boolean;  // true → sinks to the quiet group at the very bottom
  countdown?: string;          // rendered inline with the kind label, not as its own chip
  cover?: Cover;               // events wear the same cover art as everywhere else
  startsInMinutes?: number;    // drives the live countdown once you say you're going
}

interface WeekDay {
  day: string;                 // "Sunday" — rendered large
  photo: string;               // near-full-width square
  caption: string;             // what they actually did, under the photo
}

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
| Capture (tap photo / hold video), limits, text-after-capture | `stories` |
| Themed-post prompts (rotatable) | `stories` + admin (see `ADMIN.md`) |
| Viewer, progress bars, reaction rail, peek | `story/[id]` + `stories` |
| Live replies preview + comment section | `reactions` |
| Catch-Up · actionable top (poll/question/event, countdowns, poll ≤1wk) | `polls` / `events` |
| Catch-Up · Currently (listening / reading) | `profiles` (Spotify + current book) |
| Catch-Up · What you missed / week summaries | `quizzes` (weekly-questions) / `stories` |
| Circle-video / text / sticker reactions + threaded replies | `reactions` |
| Reply notifications | `notifications` |

---

## Acceptance criteria

- [ ] Posting captures media live in-app only — no camera-roll upload path exists.
- [ ] Max 3 posts/day; video ≤20s. One capture button (tap photo / hold video); no Photo or Text buttons; text is added after capture.
- [ ] Three themed-post squares (admin-rotatable) sit above capture; picking a theme labels the story.
- [ ] The viewer shows one progress segment per post (≤3), the post, caption, a right-side vertical reaction rail (Record / Sticker / Comment), and a live replies preview that rotates ~every 2s without auto-playing video.
- [ ] Tapping the replies preview (or Comment) opens the full comment section with text, nested replies, video replies, and stickers — a second place to react.
- [ ] The Catch-Up peek card previews its top item.
- [ ] In the Catch-Up, a live poll/question/event always renders at the very top and as the peek; accepted events and polls show a countdown; poll duration is poster-set, max one week.
- [ ] Once the viewer answers a poll/question, it moves to the "Answered" group at the bottom.
- [ ] When nothing is actionable, the top/peek reads "{Name} · What you missed" with a day label and a peek of an older photo.
- [ ] Reactions support circle video (min length), text (nested replies), and stickers/emoji.
- [ ] Responses to your posts, and replies to comments/videos you left elsewhere, notify you in the Home notifications preview (→ Notifications page).
