# Bridger — Weekly Recap Podcast (spec)

Self-contained. Keep UI copy minimal (short real labels only). Lives in the **Friend Pod on the Friends tab** (opens `/recap`). Founder decision: not on Home.

---

## What it is

A **weekly audio check-in** with your friends. Everyone answers the **same 5 short questions by voice**; all the answers stitch into **one continuous "podcast"** you play from the **Friend Pod on the Friends tab** (opens `/recap`), not Home. As each person talks, **their photo and name pop up**. It's how you actually hear your friends' voices each week — not another feed to scroll.

---

## The 5 questions

- Each week has **5 questions**, the same for everyone.
- They can be **set** (rotating, admin-hosted) **and/or submitted by friends** — anyone can **submit a question** for the group to answer, and the week's 5 can be drawn from those.

---

## Recording your recap

1. On the **Friends** tab (Friend Pod), tap **Add your recap**.
2. First **see all 5 questions** (and that each answer is **20 seconds**), then record audio in-app for each. Re-record if you flub one.
3. Pick **who to share with** — Close friends / Friends / Everyone (or a group).
4. **Post.**

(Audio is recorded in the app, like everything else — no uploads.)

---

## Listening (the podcast)

- On the **Friends** tab (Friend Pod), hit **Play** — opens a **full page** (not a popup).
- Filter by circle: **Close** (default) → **Friends** → **Acquaintances**.
- It plays as **one continuous audio** within the chosen circle.
- As each answer plays, the **speaker's photo + name** show, plus the **current question** and **how many days until that person's clips expire** (rolling 7 days).
- It's a **roundtable**: everyone's answer to Q1, then everyone's Q2, and so on.
- Controls: play/pause, skip forward/back, scrub, and **playback speed** (1× / 1.3× / 1.5× / 2×) that **stays on for every speaker**.
- **"In this week"** is a scrollable row of faces — tap someone to listen or relisten.
- **Send a sticker** (emoji) in response; that reaction lands in the **Notifications** strip.
- You only hear answers people **shared with your tier**.

---

## Cadence

- **Weekly** — resets each week. Only friends who posted that week are in the podcast. If you didn't record, you're simply not in it.

---

## Screens / components

- **RecapRecorder** — the 5 questions, record audio per question, pick audience, post.
- **RecapPlayer** — full-page player: filter, speed, expiry, play/pause/skip/scrub, speaker photo + name, question, progress dots, scrollable "in this week" avatars, sticker reactions.
- **SubmitQuestion** — suggest a question for the group.

---

## Data (shapes)

```ts
interface RecapWeek {
  id: string;
  weekOf: string;
  questions: string[];               // the 5
}
interface RecapAnswer {
  weekId: string;
  authorId: string;
  questionIndex: number;             // 0–4
  audioUrl: string;                  // recorded in-app; ~20s
  visibleToTier: 'close' | 'friend' | 'acquaintance';
}
```

Playback stitches `RecapAnswer`s grouped by `questionIndex`, filtered to what the listener's tier can hear, showing each `authorId`'s photo as their clip plays.

---

## Copy discipline
Short labels only: "Add your recap", "Play", "Post", "Submit a question", "In this week". No sentences inside components.
