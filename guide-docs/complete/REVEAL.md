# Bridger — Connection Reveal (the 3-screen "In common" flow)

Self-contained spec. This is the celebratory reveal that plays **right after you connect with someone** — it opens by asking **how you met**, then does a story-style tap-through of what you share. Afterward the "in common" part is permanently re-openable as the **"In common"** tab on that person's profile.

---

## Format

- **Full-screen, dark, story-style** (an intentional exception to the eggshell canvas — it's a moment).
- Flow: **Screen 0 (how you met)** → then **Screens 1–3** (the "in common" story, with **3 segmented progress bars** at the top, one per screen). Tap to advance.

---

## Screen 0 — how did you two meet?

The opener. It captures the meeting memory and tells the reveal how to frame itself.

- **Top:** `via {mutualFriend}` (small, muted) when there is one, then their **real photo** (large circle) and name. The photo stays on this screen.
- **Headline:** `How did you two meet?` (large).
- No "next · what you have in common" hint under Continue.
- **Choice (single select, required):** `We just met` / `We already know each other`. Each option shows an empty checkbox so it is obvious you need to pick one. When selected, the **whole row fills with color** and the checkbox gets a checkmark.
- **Tier from the choice:**
  - `We just met` → they land in **Acquaintances** automatically (no extra step).
  - `We already know each other` → optional buckets appear below: **Close / Friends / Acquaintances**. Skipping them soft-defaults to Friends.
- **Memory capture (depends on how you connected):**
  - **In person / QR / link:** checkbox — `Record where you met`, defaulted ON. Saves a **coarse place** ("RiNo, Denver," approximate — never precise coordinates). Only the two of you see it; either can edit or remove it.
  - **Discover (via a mutual):** there usually is no place (unless you also share an event). Centered **Add a note - optional** text (no box). Tap it to open a short how-you-met field (max ~80 chars). Only the two of you see it.
- **Continue** → into the 3-screen story.

*(Screen 0 has no progress bar — it's the setup step. The 3 segments belong to Screens 1–3.)*

---

## Screen 1 — the strongest thing

- **No via chip, name, or header photo** on this screen. The Venn is the only face.
- **Center:** the **connection orbs** — your two profile photos (same size as the circles) float in from opposite sides, meet, then dissolve into two see-through circles (yours yellow, theirs green) whose overlap mixes to orange. That orange middle is the focal point. *(This is the signature detail — keep it. Reduce-motion shows the circles without the float.)*
- **Label:** `What connects you most`
- **Big headline:** the single strongest shared thing — e.g. **"You both live for climbing."**

## Screen 2 — more in common

- **How you line up:** compatibility scores from matching-only quizzes, one number each — e.g. `95% compatible in Humor`, `72% in Values`. The bar is in the quiz's color. PRIVACY: only the dimension + number cross the connection, never the answers.
- **Heading:** `You've also got…`
- **Up to 3** more commonalities, each an **icon + short line**. Shared hobbies show both follow-up answers here (your answer + theirs) — the Discover surface shows the hobby titles only; the answers appear in the reveal / In common.

## Screen 3 — the close

- **Confetti** icon.
- **Big headline:** `You two should click.`
- **Subtext:** `Revisit anytime under "In common"`
- **Primary button:** `See {name}'s profile` — pinned to the **bottom bar** (not inline), so it always sits at the very bottom.

## Navigation

- Screens 1–3 are a **tap-through story**: tap the **right** edge to go forward, the **left** edge to go back. You can never tap back past Screen 1 (that would feel like closing).
- An **X** in the top-right leaves the story early and opens the new connection's profile.
- Screens 1–2: the current progress bar **fills over ~5.5s**, then the story advances. Tap right still skips ahead early. Reduce Motion shows a static full bar and waits for a tap.
- The last card **holds** (progress bar full) until they tap `See {name}'s profile`.

---

## Where the content comes from

- The strongest thing + the list = the **overlap of your and their matchable attributes** (shared hobbies, matching this-or-that answers, shared places traveled, matching quiz results), respecting tier visibility.
- **Shared hobbies can pair both follow-up answers** ("You both run" → your answer + theirs) — the conversation-starter detail, shown in full on the re-openable "In common" tab (see `PROFILE.md`).
- `via {mutualFriend}` = the connection path (who introduced you).
- **If overlap is thin:** show fewer items (screen 2 can shrink to 1–2, or be skipped); screen 1 always shows the single top thing.

## Re-access

- The exact same content is the **"In common" tab** on their profile (`person/[id]`), re-openable anytime — which is what the screen-3 subtext promises.

---

## Components

| Component | Spec |
|---|---|
| `HowYouMetStep` | screen 0: just-met / already-know (checkmarks + filled color) + optional tier buckets (already-know) + place checkbox (in person) or short note (Discover) |
| `RevealProgressBars` | 3 segments; current bar fills over ~5.5s then advances; holds full on the close card |
| `RevealOrbs` | two profile photos float in, dissolve into yellow + green circles, overlap mixes to orange |
| `QuizMatchList` | compatibility scores from matching-only quizzes (e.g. "95% in Humor") |
| `RevealScreen` | dark screen: headline + body |
| `RevealClose` | confetti + big line + subtext (button lives in the bottom bar) |

---

## Copy (use these exactly — they carry the charm)

`{their full name}` (screen 0 top) · `How did you two meet?` · `We just met` · `We already know each other` · `Want to add them to a circle?` · `Optional · Close, Friends, or Acquaintances` · `Record where you met` · `Add a note` · `via {name}` (screens 1–3) · `What connects you most` · `You both live for climbing` (dynamic) · `You've also got…` · `You two should click.` · `See {name}'s profile` · `Revisit anytime under "In common"`

Everything else: minimal copy.
