# Bridger — Weekly Recap Podcast (spec)

Self-contained. Keep UI copy minimal (short real labels only). Lives in the Home "This week" section.

---

## What it is

A **weekly audio check-in** with your friends. Everyone answers the **same 5 short questions by voice**; all the answers stitch into **one continuous "podcast"** you play on Home. As each person talks, **their photo and name pop up**. It's how you actually hear your friends' voices each week — not another feed to scroll.

---

## The 5 questions

- Each week has **5 questions**, the same for everyone.
- They can be **set** (rotating, admin-hosted) **and/or submitted by friends** — anyone can **submit a question** for the group to answer, and the week's 5 can be drawn from those.

---

## Recording your recap

1. On Home ("This week"), tap **Add your recap**.
2. Answer each of the 5 questions by **recording audio** in-app (short — about **45s each**). Re-record if you flub one.
3. Pick **who to share with** — Close friends / Friends / Everyone (or a group).
4. **Post.**

(Audio is recorded in the app, like everything else — no uploads.)

---

## Listening (the podcast)

- On Home, hit **Play** on the weekly recap.
- It plays as **one continuous audio** — all your friends' answers stitched together.
- As each answer plays, the **speaker's photo + name pop up**, along with the **current question**.
- It's a **roundtable**: everyone's answer to Q1, then everyone's Q2, and so on — so you hear the whole group on each prompt.
- Controls: play/pause, skip forward/back, scrub. Progress dots show which question you're on.
- **"In this week"** shows the friends included.
- You only hear answers people **shared with your tier**.

---

## Cadence

- **Weekly** — resets each week. Only friends who posted that week are in the podcast. If you didn't record, you're simply not in it.

---

## Screens / components

- **RecapRecorder** — the 5 questions, record audio per question, pick audience, post.
- **RecapPlayer** — play/pause/skip/scrub, speaker photo + name pop-up, current question, progress dots, "in this week" avatars.
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
  audioUrl: string;                  // recorded in-app; ~45s
  visibleToTier: 'close' | 'friend' | 'acquaintance';
}
```

Playback stitches `RecapAnswer`s grouped by `questionIndex`, filtered to what the listener's tier can hear, showing each `authorId`'s photo as their clip plays.

---

## Copy discipline
Short labels only: "Add your recap", "Play", "Post", "Submit a question", "In this week". No sentences inside components.
