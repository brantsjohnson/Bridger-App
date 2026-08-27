# Bridger — Profile Page

Build doc for the Profile tab. Maps to `apps/mobile/app/(tabs)/profile.tsx`, the `profiles` / `attributes` / `permissions` modules, plus `stories`, and two new concerns (`quotes`, storage/retention) in `ARCHITECTURE.md`. Read that file first.

Your Profile is three things at once: the **about-you card your friends see** (it populates the "About them" tab on your `person/[id]` in their app), your **archive**, and your **settings**. Top-level tabs: **Profile · Stories · Quotes · Settings**. The **Profile** tab is filled by bite-size **modules**, each answered one question per screen exactly like onboarding; the full question set lives in `PROFILE-MODULES.md`. ("Quiz" is reserved for the shareable who-got-who quizzes.)

---

## 0 · Mandatory intro (once, before first fill)

Before the profile can be filled, a **required marketing screen/video** plays (same pattern as onboarding's welcome — non-skippable, one-off). Its message: *you decide what each group of friends knows, and you can delete anything at any time — it's removed from Bridger's database.* This sets the tone that the data is theirs and always deletable, before a single question is asked.

---

## 1 · Profile tab — sections + how they're filled

### What shows (display sections)

The Profile tab renders these sections, populated by the modules:
- **Header** — photo, display name, and a profile song.
- **Currently** — what they're into now: a song (via connected **Spotify** — share a track they're liking, pick "most played," or choose one) and a **current book**. This is the data the story swipe-up "Currently" widgets pull from (see `STORIES.md`).
- **Ask me** — friend-only icebreakers that *friends* fill in about wanting to hear from you (not owner-filled).
- **About me** — personal fields + important dates. Once filled, it renders **visual and fully expanded** — all answers laid out and readable at a glance — with a **collapse** control if the owner/viewer doesn't want the whole thing open. **Hobbies sit at the top** of this section.
- **Hobbies** — selected hobbies, each with its follow-up answer (shown at the top of About me).
- **Unlocked modules** — List of favs, Places traveled (two-view: map or list), This or that (with "both"), Custom notes.

### How it's filled — bite-size modules

Filling is broken into **modules** (`PROFILE-MODULES.md`), in this order: The basics, **Hobbies**, This or that, List of favs, Places traveled, Deeper questions, Custom notes. Rules:

- **Hobbies come near the top** — they're fast and fun to pick, so they get filled in "in a second" and give the profile immediate personality.
- **All optional.** Fill any subset, in any order.
- **Start easy.** The basics + hobbies are surfaced first and are quick, so the user sees how it works and feels the payoff before committing to more.
- **Save / resume.** Finish part of a module, save, and come back later (from the module picker or by hitting *Edit* on that section of the profile).
- **Cancel = never happened.** Starting a module and cancelling saves nothing — no partial state, no orphaned data.

### Setting who sees what — the review step

At the **end of each module**, a Review & share screen lists every answer with a per-item share control (Close / Friends / Everyone):

- **Set all** at the top applies one level to the whole module in a single tap — most people never touch the per-item controls.
- **Per-item override** lets them drop just one answer to a tighter circle (or open one up) as an exception.
- **Smart defaults by depth:** easy/basic modules default to a wider share; **deeper/personal modules default to Close friends (or Friends)**. So sensitive things start private and the user opts *outward*, not the reverse.

Each answer is a `ProfileAttribute`; the chosen level writes its `visibleToTier`, and that one setting propagates everywhere the field appears (friend cards, matching audience). The same card, filtered by the viewer's tier, is what renders on the **About them** tab of `person/[id]`.

### Delete-anytime

Any field or whole module can be deleted from the profile, which removes it from Bridger's store — the promise made on the intro screen, enforced for real.

---

## 2 · Stories — your archive

A **calendar** of your posted stories — not a grid of squares. Each date shows a **dot** (a story was posted that day) or a small **thumbnail** (a peek of that day's photo); tapping a date opens that day's story. Months are navigable. This reads like a memory archive, not a content dump.

### Storage bar + retention (deferred, honest)

- A **subtle storage bar** lives at the **bottom of the calendar** — how much of the month you've used vs. what you have, with a quiet "Upgrade" link. It's ambient, not a nag.
- **Everyone gets a rolling free month.** Story media older than 30 days is **deleted** (rolling) to keep co-op costs low.
- The **buy prompt only appears once the free month is fully used (100%)** — that's when the bar surfaces the choice: **add storage (~$2/mo)** or **join the co-op**, otherwise old posts keep rolling off. No upfront banner nagging people who haven't hit the limit.
- Retention applies to **story media** (the expensive part). Lighter data — **quiz results, events attended, about-you fields, inside jokes** — persists regardless.

Reuses the `payments` module (same billing surface as the events cap); co-op membership unlocks full retention as a member benefit.

---

## 3 · Quotes — the Inside Jokes wall (sticky notes)

The **Inside Jokes wall**: text sticky-notes — one-liners, "things said," the bits only a few people get. One wall with a **filter**, not two tabs: **All · About {name} · By {name}**, each with its count. A filter keeps it one place to look; tabs made it feel like two separate walls.

**The note itself.** The quoted person's **profile picture sits on the sticky note** beside their name, so you know whose words these are without reading a caption. **Tap the note** and it flips to the credits: who said it, **who wrote it down** and when, where it happened, and how many other people were in it.

Mechanics:
- A sticky note **quotes a person** ("this is what {person} said") and can **tag the people who were in it** and **the event where it happened**.
- It shares to **everyone tagged plus everyone who was at that event**, and tagging a person **cross-posts** it to their wall.
- **Photo tagging** works the same way: people tagged in photos surface on their profile.
- Inside jokes carry visibility like other fields (default: Friends), so the wall respects tiers.
- **New inside jokes also surface on Home** (see `HOME.md`): a few recent ones from the week; when there are none, it falls back to older ones as "moments."

**Adding one is a small "+", never a central menu.** A "+" tile sits among the existing sticky notes. When the wall is empty, that tile *is* the null state: an inviting dashed container reading **"Add an Inside Joke"**, so an empty wall looks like something to fill in rather than a void. The bucket list uses the same light treatment.

This is a new **`quotes`** module (text quotes + photo tags, with tagging that cross-posts to tagged people's profiles).

---

## 3b · Bucket list (profile-only module)

A module that lives **only on the profile page** — it is not in any central create menu. Each line is either written solo ("Learn to surf") or **tags friends to do it together** ("Hike the Inca Trail · with Sam & Priya"), and each item is **public or private**. Items can be **checked off** when done, which strikes them through rather than hiding them.

Private items are visible only to the owner, whatever the tiers say. Adding is the same small "+" pattern: a dashed **"Add to your bucket list"** row at the end of the list, which is also what an empty list shows.

---

## 4 · Settings — the control center

Because Profile is "practically your settings page," the Settings tab holds:

- **Who sees what** — a per-tier overview of what each group (Close friends / Friends / Everyone) can see, complementing the per-field chips on About.
- **Storage & plan** — current usage, co-op status, add-storage.
- **Discover** — link to the Discoverable master toggle and match sources (see `DISCOVER.md`).
- **Co-op** — a co-op icon that opens the co-op portal (external, gatekept — see `ADMIN.md`); the other entry point besides the Home footer.
- **Notifications**, **account**, **log out**.

---

## Related: custom note on a friend's profile

On someone else's `person/[id]`, alongside **About them** and **In common**, you can add a **private custom note** — visible only to you ("met at Priya's hike; loves obscure horror films"). It's your own scratchpad on that person, never shown to them or anyone else. (Add to `person/[id]` in `ARCHITECTURE.md`.)

---

## Data (shapes)

```ts
interface ProfileTabs { about: AboutField[]; stories: StoryThumb[]; quotes: Quote[]; }

interface AboutField {
  attributeId: string;
  key: string;                 // "hobbies", "allergies", ...
  value: string;
  visibleToTier: Tier;         // the per-field chip
}

interface Quote {
  id: string;
  text: string;
  authorId: string;            // who said it
  taggedPersonId: string;      // whose wall it also lands on
  contextEventId?: string;     // if posted from an event
  visibleToTier: Tier;
}

interface StorageState {
  usedBytes: number;
  freeUntil: string;           // rolling-month cutoff for oldest media
  plan: 'free' | 'coop' | 'paid';
}

interface FriendNote { personId: string; note: string; }  // private, author-only
```

---

## Module mapping

| Piece | Backend |
|---|---|
| Mandatory intro screen (once) | `profiles` (flag) |
| Fill modules + question bank | `profiles` + question bank (see `PROFILE-MODULES.md`) |
| Module save / resume / cancel | `profiles` (draft state, discarded on cancel) |
| Review & share (set-all + per-item) | `attributes` + `permissions` |
| About card + fields | `profiles` + `attributes` |
| "Ask me" icebreakers (friend-filled) | `profiles` |
| Story archive | `stories` |
| Storage / retention / add-storage | storage-retention policy + `payments` |
| Quote wall + photo tags (cross-posting) | **`quotes` (new module)** |
| Settings · who-sees-what | `permissions` |
| Discoverable / match sources | `discovery` |
| Private friend note | `profiles` (author-scoped) |

---

## Acceptance criteria

- [ ] Profile has four tabs: Profile, Stories, Quotes, Settings; the Profile tab is filled by modules.
- [ ] A mandatory, non-skippable intro screen plays once before the first fill, covering group-based sharing and delete-anytime.
- [ ] Filling starts with basics + hobbies (hobbies near the top, quick to fill), then the rest; all optional, any order.
- [ ] A module can be saved partway and resumed; cancelling a module saves nothing (no partial state).
- [ ] Each module ends with a Review & share screen offering a set-all control plus per-item overrides.
- [ ] Easy modules default to a wider share; deeper/personal modules default to Close friends.
- [ ] Setting a share level writes the attribute's visibility and propagates everywhere it's used.
- [ ] The Profile tab shows Header (song), Hobbies at the top of About me, About me expanded-and-collapsible, Ask me, and unlocked quizzes.
- [ ] Once filled, About me renders visually with all answers open and a collapse control.
- [ ] The Profile card, filtered by tier, is what renders on a friend's "About them" tab.
- [ ] Any field or module can be deleted, which removes it from Bridger's store.
- [ ] Stories renders as a **calendar**: dot or thumbnail per posted day, tap a date to open that story.
- [ ] A subtle storage bar sits at the bottom of the calendar; the buy prompt (add storage ~$2/mo or join co-op) appears only once the free month is 100% used.
- [ ] Story media older than 30 days is deleted (rolling); quiz results, events, about-fields, and inside jokes persist.
- [ ] The Inside Jokes wall is one wall with an All / About / By **filter** (not sub-tabs); a joke quotes a person and can tag people and an event; it shares to those tagged plus everyone at the event; tagging cross-posts; photo tags behave the same.
- [ ] A sticky note shows the **quoted person's profile picture**, and tapping it reveals who said it, who posted it and when, where it happened, and who else was in it.
- [ ] The Stories tab's calendar is tappable: a posted day **opens that day's story**.
- [ ] This-or-that renders as **two columns per row** — both options side by side with the chosen one filled — and is tappable to change; "both" fills both sides.
- [ ] The **Bucket list** is its own profile tab, sitting after Inside jokes.
- [ ] Polls do **not** appear on the profile; they live on Home and in the poll archive.
- [ ] Inside jokes are added with a small "+" tile among the notes — no central create menu — and an empty wall shows an inviting dashed "Add an Inside Joke" container.
- [ ] New inside jokes also surface on Home (a few recent; fall back to older "moments" when none are new).
- [ ] The bucket list is a profile-only module: each item is solo or tags friends, is public or private, and can be checked off; adding uses the same "+" / "Add to your bucket list" container.
- [ ] A private, author-only custom note can be added on any friend's profile.
- [ ] Settings exposes who-sees-what, storage/plan, Discover, notifications, and account.
