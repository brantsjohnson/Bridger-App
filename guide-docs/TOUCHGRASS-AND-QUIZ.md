# Bridger — Touch Grass & Quiz (spec for Magic Patterns)

Self-contained. Two behaviors Magic Patterns kept missing. Keep UI copy minimal (short real labels only).

---

## Touch Grass

**What it is:** a **big, fun green button** labeled **"TOUCH GRASS"** — on **both Home and the Events page**. It broadcasts "I'm free to hang" to a group of friends — a one-tap "who wants to do something?" signal. It is **not** a subtle row; it's a large, satisfying-to-tap green button.

**The button**
- Big green rounded button, sprout icon, bold **"TOUCH GRASS"**, one small subtext line ("tell friends you're free").
- Lives prominently on **Home** and on the **Events page** (where plans happen).

**Tap → quick sheet**
1. **Who to tell** — Close friends / Friends / Everyone. Concentric: Friends includes Close; Everyone includes all three.
2. **When** — Now / Tonight / This weekend.
3. **Why (short line)** — "grab food + walk?" — so friends know what they're saying yes to.
4. **Send signal** (green button).

**On send**
- Everyone in the chosen group gets a **notification**.
- Your signal shows on their Home/Events **below the button**.
- **No view counts** anywhere.

**Browsing signals (below the button, on Home and Events)**
- **One featured** signal at a time, then **the rest listed below**.
- Each shows **who + when + why** — enough to decide — and is **tappable** to open the full signal.

**Recipients respond** (on the card or its detail) with two options only:
- **I'm in** → notifies *you* they're in (it becomes a plan).
- **✕** → dismiss. (There is no "no.")

**You** see a small list of who's in — visible to **you only**. The signal **expires** after its window (e.g. a few hours / end of the chosen period).

---

## Quiz

**Take → result → share → compare.**

**On Home:** a quiz card with **"Take the quiz"**.

**Take it** → answer the questions → **get your result** (shown big).

**After taking, the same card on Home shows:**
1. **Your result.**
2. **Share quiz** — a shareable link (friends, or people without an account).
3. **"Who got who" dashboard** *(only if the quiz supports comparison)* — your friends **grouped by result**, each group showing avatars + a count. Example: *Coastal cruiser · 3 · [avatars] · Mountain roamer · 2 · [avatars]*.
4. **See more / tap a result** → full breakdown: who got each result, **how you compare**, and the friend-group dynamic (e.g. "you and Priya matched").

If a quiz has **no comparison feature**, show only the result + share (no dashboard).

---

## Copy discipline
Short labels only: "TOUCH GRASS", "Send signal", "I'm in", "Take the quiz", "Share quiz", "Who got who", "See more". No sentences inside components.
