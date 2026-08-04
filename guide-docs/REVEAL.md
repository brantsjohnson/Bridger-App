# Bridger — Connection Reveal (the 3-screen "In common" flow)

Self-contained spec. This is the celebratory reveal that plays **right after you connect with someone** — it opens by asking **how you met**, then does a story-style tap-through of what you share. Afterward the "in common" part is permanently re-openable as the **"In common"** tab on that person's profile.

---

## Format

- **Full-screen, dark, story-style** (an intentional exception to the eggshell canvas — it's a moment).
- Flow: **Screen 0 (how you met)** → then **Screens 1–3** (the "in common" story, with **3 segmented progress bars** at the top, one per screen). Tap to advance.

---

## Screen 0 — how did you two meet?

The opener. It captures the meeting memory and tells the reveal how to frame itself.

- **Top:** `via {mutualFriend}` (small, muted) when there is one.
- **Headline:** `How did you two meet?`
- **Choice (single select):** `We just met` / `We already know each other`. (This seeds context — a fresh meet vs. reconnecting — and can suggest an initial tier.)
- **Checkbox — `Record where you met`, defaulted ON.** When checked, saves a **coarse place** ("RiNo, Denver," approximate — never precise coordinates) as the "how you met" memory. Shows a place chip; **only the two of you see it; either can edit or remove it.** Unchecking skips it. (This is the "how you met" capture from `FRIENDS.md` / `DATA.md`.)
- **Continue** → into the 3-screen story.

*(Screen 0 has no progress bar — it's the setup step. The 3 segments belong to Screens 1–3.)*

---

## Screen 1 — the strongest thing

- **Top:** `via {mutualFriend}` — small, muted (who connects you).
- **Center:** a **Venn diagram** — two overlapping circles, your color + theirs, the overlap as the focal point. *(This is the signature detail — keep it.)*
- **Label:** `What connects you most`
- **Big headline:** the single strongest shared thing — e.g. **"You both live for climbing."**

## Screen 2 — more in common

- **Heading:** `You've also got…`
- **Up to 3** more commonalities, each an **icon + short line**:
  - `Both early risers`
  - `Both been to Japan`
  - `Same road-trip result`

## Screen 3 — the close

- **Confetti** icon.
- **Big headline:** `You two should click.`
- **Primary button:** `See {name}'s profile`
- **Subtext:** `Revisit anytime under "In common"`

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
| `HowYouMetStep` | screen 0: just-met / already-know choice + "Record where you met" checkbox (default on) + place chip |
| `RevealProgressBars` | 3 segments, fill on advance (Screens 1–3) |
| `VennDiagram` | two overlapping circles (you + them), overlap highlighted |
| `RevealScreen` | dark screen: headline + body |
| `RevealClose` | confetti + big line + primary button + subtext |

---

## Copy (use these exactly — they carry the charm)

`via {name}` · `How did you two meet?` · `We just met` · `We already know each other` · `Record where you met` · `What connects you most` · `You both live for climbing` (dynamic) · `You've also got…` · `You two should click.` · `See {name}'s profile` · `Revisit anytime under "In common"`

Everything else: minimal copy.
