# Bridger — Touch Grass & Quiz (spec for Magic Patterns)

Self-contained. Two behaviors Magic Patterns kept missing. Keep UI copy minimal (short real labels only).

---

## Touch Grass

**What it is:** a **big, fun green button** labeled **"TOUCH GRASS"** — on the **Events page** (founder decision: **send is Events-only**, not on Home). It broadcasts "I'm free to hang" to a group of friends — a one-tap "who wants to do something?" signal. It is **not** a subtle row; it's a large, satisfying-to-tap green button. On **Home** there is no send button; friends' signals appear as answer cards in the announcements carousel.

**The button**
- Big green rounded button, sprout icon, bold **"TOUCH GRASS"**, one small subtext line ("tell friends you're free").
- Lives prominently on the **Events page** (where plans happen). It is **not** on Home.

**Tap → quick sheet**
1. **Who to tell** — Close / Friends only. Concentric: Friends includes Close. Acquaintances never get a Touch Grass signal.
2. **When** — Now / Tonight / This weekend.
3. **Why (short line)** — "grab food + walk?" — so friends know what they're saying yes to.
4. **Send signal** (green button).

**On send**
- Everyone in the chosen circle (Close, or Friends which includes Close) gets a **notification**.
- Your signal shows for them: on **Events** below the button, and on **Home** as a card in the announcements carousel.
- **No view counts** anywhere.

**Browsing signals**
- On **Events** (below the button): **one featured** signal at a time, then **the rest listed below**.
- On **Home**: friends' signals appear as **answer cards in the announcements carousel** (no send button on Home).
- Each shows **who + when + why** — enough to decide — and is **tappable** to open the full signal.

**Recipients respond** (on the card or its detail) with two options only:
- **I'm in** → notifies *you* they're in (it becomes a plan).
- **✕** → dismiss. (There is no "no.")

**You** see a small list of who's in — visible to **you only**. The signal **expires** after its window (e.g. a few hours / end of the chosen period).

---

## Quiz

**Take → result → share → compare.**

**On Home:** a quiz card with **"Take the quiz"**. After you finish, that CTA becomes **"See your result"** (never "Take the quiz" again for that first finish).

**Take it** → answer the questions → **get your result** (shown big) **and** a second payoff: **Connect with friends** (share the link so they can take it) plus the friend board.

**After taking, the same card on Home shows:**
1. **Your result.**
2. **See your result**: opens the final result screen (poster + connect-with-friends + board).
3. **Share quiz**: a shareable link (friends, or people without an account).
4. **"Who got who" / "Your versions" dashboard** *(only if the quiz supports comparison)*: your friends **grouped by result**, each group showing avatars + a count. Example: *Coastal cruiser · 3 · [avatars] · Mountain roamer · 2 · [avatars]*.
5. **See your result / tap a result** → full breakdown: who got each result, **how you compare** (for Which J name: a fun % compatible when both of you finished your **first** result), and the friend-group dynamic (e.g. "you and Priya matched").

**Which J name extras**
- The **first** finish is the durable result (server + Profile). Home may later feature a different quiz; Profile still shows this card.
- **Retake for fun** is optional. The latest fun run stays on this phone. You can flip **Your result** / **Fun retake**. Fun retakes do **not** look up friend compatibility and do **not** overwrite the first result.
- **Share link is visible.** The result (and Profile) show the actual invite URL with Copy and Preview so you can send it or open the guest page yourself.
- **No account needed to take it.** A friend opens `/q/<token>`, taps Take the quiz, and finishes. Their first result stays on the device until they make an account. Signup (or Add friend while signed in) adds the sharer so both can see the duo %.

If a quiz has **no comparison feature**, show only the result + share (no dashboard).

**Copy discipline (Home / result):** "Take the quiz" only before the first finish. After that: **"See your result"**.

---

## Copy discipline
Short labels only: "TOUCH GRASS", "Send signal", "I'm in", "Take the quiz", "See your result", "Share quiz", "Who got who", "See more". No sentences inside components.
