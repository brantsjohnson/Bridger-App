# Bridger — Weekly Recap Podcast (spec)

Self-contained. Keep UI copy minimal (short real labels only). Lives in the **Friend Pod on the Friends tab** (opens `/recap`). Founder decision: not on Home.

---

## What it is

A **weekly audio check-in** with your friends. Everyone answers the **same 5 short questions by voice**; all the answers stitch into **one continuous "podcast"** you play from the **Friend Pod on the Friends tab** (opens `/recap`), not Home. As each person talks, **their photo and name pop up**. It's how you actually hear your friends' voices each week, not another feed to scroll.

---

## The 5 questions (self-running)

The week **locks itself every Monday (UTC)**. You do not need to set questions in admin.

**If admin already made a week live for that Monday, that week wins.**

**If admin did nothing:**

1. **Rose** — something good that happened
2. **Thorn** — something that sucked
3. **Bud** — something they are looking forward to
4. The **most-voted unused** suggested question from friends
5. The **next most-voted**, or a short fill-in if there are not enough votes

Fill-ins are generic weekly prompts ("What is your favorite thing that happened this week?"). The worker may ask the model for those leftover slots. Opening Friend Pod never waits on a model: it uses the canned bank instead. The model only sees Bridger's already-chosen prompts (rose / thorn / bud). It never sees a friend's name or a question a friend typed.

Friends **suggest and vote** all week. Those votes decide the last two questions for **next** Monday. Rose, thorn, and bud stay.

---

## Recording your recap

Three moves: **record → review → posted**.

1. Open the **recap page** (tap the Friend Pod card, or its pixel play, on the Friends tab) and tap **Add your recap**. (Recording and suggesting a question live on the recap page now, not on the Friends-tab card. The card is just the play entry point.)
2. **Record.** The 5 questions are a **swipeable deck** (each answer is **20 seconds**). Answer the ones you feel like: **skipping is normal**, not a failure, so nothing gates you on the next card. After you record a question you can **hear the take back** and **re-record** it. A green segment in the bar marks a question you have recorded.
3. **Review.** Pick **which friend group hears it** (Close / Friends / Acquaintances) and see exactly **what is going out and what you skipped**.
4. **Post.** Once the clips actually upload, a green **"You're in this week"** confirmation stays on screen (it does **not** close on its own) until you tap **Done**.

(Audio is recorded in the app, like everything else. No uploads from the camera roll.)

---

## Listening (the podcast)

- On the **Friends** tab (Friend Pod), the **pixel play** button opens a **full page** and starts audio. The **arrow** opens that same page paused.
- **This week** is free for everyone (rolling 7 days). **Co-op members** can tap an earlier locked week in the week strip. Free Lite sees an **Earlier weeks** chip that opens join co-op. The list only includes weeks the listener can hear. No voice counts on the chips.
- Suggest / vote for next week only shows on the **live** week.
- Filter by group: **Close** (default) → **Friends** → **Acquaintances**.
- It plays as **one continuous audio** within the chosen group.
- As each answer plays, the **speaker's photo + name** show, plus the **current question** and **how many days until that person's clips expire** (rolling 7 days).
- It's a **roundtable**: everyone's answer to Q1, then everyone's Q2, and so on.
- Controls: play/pause, skip forward/back, scrub, and **playback speed**. Speed is a small **pill** (shows the current rate, default **1×**); tap it to open a **slider up to 2.5×**. The rate **stays on for every speaker**, and it is **saved on the device** so it is still your default the next time you open the recap, even next week.
- **"In this week"** is a scrollable row of faces. Tap someone to listen or relisten.
- **Send a sticker** (emoji) in response; that reaction lands in the **Notifications** strip.
- You only hear answers people **shared with your group**.

---

## Cadence

- **Weekly** — a new question set locks each Monday. This week's podcast only includes friends who posted in the rolling 7 days. If you didn't record, you're simply not in it.
- **Earlier weeks (co-op):** kept clips (co-op `expires_at` null) stay listenable. Free clips from those weeks are already purged. `GET /recap/weeks` and `GET /recap/playlist?weekId=` enforce the perk. A past week you cannot hear is omitted / 404, not an empty teaser.

---

## Screens / components

- **RecapRecorder** — three phases (record → review → posted). Uses **QuestionCarousel** (swipeable 5) and **TakePlayback** (hear a take back / re-record). Record audio per question, pick friend group, post, then a confirmation that waits for Done.
- **QuestionCarousel** — the five questions as a swipeable deck; tap a segment to jump; green = recorded.
- **TakePlayback** — plays back a take you just recorded (real audio), waveform moves only while playing, optional Re-record.
- **RecapSpeedControl** — the speed pill + slider (up to 2.5×), saved on device via `lib/recap-speed.ts`.
- **RecapPlayer**: full-page player: week strip, filter, speed, expiry, play/pause/skip/scrub, speaker photo + name, question, progress dots, scrollable "in this week" avatars, sticker reactions.
- **RecapWeekStrip**: This week + past week chips (co-op), or Earlier weeks to `/coop` (Free Lite).
- **ThisWeeksQuestions**: this week's 5 plus suggest / vote for next week (hidden on an older week).

---

## Data (shapes)

```ts
interface RecapWeek {
  id: string;
  weekOf: string;
  weekStart?: string;            // Monday UTC, YYYY-MM-DD
  origin?: 'admin' | 'auto';
  questions: string[];           // the 5
}
interface RecapAnswer {
  weekId: string;
  authorId: string;
  questionIndex: number;         // 0–4
  audioUrl: string;              // recorded in-app; ~20s
  visibleToTier: 'close' | 'friend' | 'acquaintance';
}
```

Playback stitches `RecapAnswer`s grouped by `questionIndex`, filtered to what the listener's group can hear, showing each `authorId`'s photo as their clip plays.

---

## Copy discipline
Short labels only: "Add your recap", "Play", "Post", "Submit a question", "In this week". No sentences inside components.

---

## Changelog

- **2026-09-09:** Co-op members can open earlier locked weeks in the player. Free Lite stays on this week (Earlier weeks opens join). Suggest / vote stays on the live week only.
- **2026-09-09:** Week self-locks each Monday. Admin is optional. Auto week is rose / thorn / bud + top votes + fill-ins. Share picks Close / Friends / Acquaintances.
