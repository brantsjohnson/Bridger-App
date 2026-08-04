# Bridger — Profile Page

Build doc for **both profile surfaces** — your **own profile** (the Profile tab) and a **friend's profile** (`person/[id]`). They share one composed card, so you always see yourself the way friends do. Maps to `apps/mobile/app/(tabs)/profile.tsx` and `app/person/[id].tsx`, plus the `profiles` / `attributes` / `permissions` / `quotes` / `stories` modules. Read `ARCHITECTURE.md` first.

**One card, two views.** Own and friend profiles render the **same Hinge-style card** (below). The differences are only: what's editable, which tiers can see which fields, and which tabs are present.

---

## 0 · Mandatory intro (once, before first fill)

Before the profile can be filled, a **required marketing screen/video** plays (same pattern as onboarding's welcome — non-skippable, one-off). Its message: *you decide what each group of friends knows, and you can delete anything at any time — it's removed from Bridger's database.*

---

## 1 · The shared profile card (Hinge-style modules)

A vertical scroll of visual modules — the same composition wherever a profile is shown:

- **Header** — photo, display name, a line (e.g. "Denver · night owl"), profile song.
- **Currently** — a **Listening** chip (connected **Spotify** — a track they're liking, "most played," or chosen) and a **Reading** chip (current book). Feeds the story swipe-up "Currently" (see `STORIES.md`).
- **Hobbies** — colorful blob chips (at the top, per the fill order).
- **Places traveled** — a **two-view swipeable module**, the same contained idiom as Hobbies. Page 1 is a clean/neoclassical **map with pins** (tap a pin for the note/tag); swipe for page 2, a **scrollable list** of every place with its note and year, scrolling inside the module so a long travel history never blows out the profile.
- **This or that** — a visual grid of their A/B picks. **"Both" is a first-class answer** — plenty of people genuinely are both a morning person and a night owl, and forcing a false binary makes the module feel untrue. A "both" pick renders both sides with neither struck through.
- **About me** — personal fields + important dates, rendered **visual and expanded** by default with a **collapse** control.
- **List of favs** — their favorites.
- **Inside jokes** — the Inside Jokes wall (its own tab; see §6).
- **Bucket list** — a profile-only module (see §6b).

Each field is a `ProfileAttribute` with a `visible_to_tier` tag; the card is composed from whatever the viewer's tier is allowed to see.

### Built to hold a lot

Profiles are meant to be **deep** — someone might have dozens of hobbies, 50 favorite movies, 40 places, piles of favs across food/entertainment/everyday/sports, a long this-or-that, many quiz results. The data model already supports this with **zero limits**: every item is its own row in `attributes`, each with its own visibility, so a category can hold as many entries as the person wants. The UX makes that volume calm, not overwhelming:

- **Collapsible sections** with an **item count** (e.g. "Movies & shows · 30") — collapsed by default once large.
- **Grouped sub-categories** where they exist (favs → Food / Entertainment / Everyday / Sports).
- **Show all N / show less** within a section, so long lists don't blow out the scroll.
- Sensible ordering (most-recent or pinned first).

So the card stays scannable whether a section has 3 items or 300.

---

## 2 · Own profile (Profile tab)

What *you* see on the Profile tab. Tabs: **Profile · Stories · Inside jokes · Bucket list · Settings**.

- **Profile tab** = the shared card above, **as you** — every field editable inline, plus a **"View as"** switch (Close friends / Friends / Everyone) so you can preview exactly what each tier sees. This is the WYSIWYG guarantee: your profile *is* the friend-facing card.
- **Edit / manage** surfaces **every section at once** — each collapsible with its item count, empty ones shown as "add", each item with its own visibility eye — so no matter how much a person has filled in, they can find and manage all of it in one place. The **"View as"** filter works here too, so they can check how Close friends vs. Friends vs. Everyone see the whole thing while editing.
- **Stories tab** = your private calendar archive (§5). Own-profile only — friends don't see your story archive.
- **Inside jokes tab** = your Inside Jokes wall (§6).
- **Settings tab** = permissions, storage/plan, Discover, co-op, account (§7). Own-profile only.

Filling happens through the bite-size modules (§3).

---

## 3 · Friend profile (`person/[id]`)

What you see when you tap into a friend. Tabs: **About them · In common · Inside jokes** (plus your private note).

- **About them** = the shared card, **filtered by your tier** with them — you only see fields they've shared with your circle. Not editable.
- **In common** = the re-openable **connection reveal**: strongest shared thing, shared hobbies, matching this-or-that answers, places you've both been, matching quiz results. This is the "what you have in common" view made permanent and re-accessible (from `DISCOVER.md`). Own profiles don't have this tab.
  - **A shared hobby pairs both follow-up answers.** "You both run · You: trail half in the fall · Jamie: just started weekend trail runs." A matched label is a dead end; two answers are a conversation. No new data is needed — every hobby already stores its follow-up as its own attribute.
  - **Shared-place photos (co-op).** When you and a friend have both been somewhere, your photos from that place surface together — your Paris shot next to their Nice shot, under "You have both been here." Same instinct as the paired hobby answers, but warmer, because a photo carries a memory. Co-op only, since photos are the expressive, storage-heavy layer (see `COOP.md`).
- **Inside jokes** = their Inside Jokes wall.
- **Private note** = your author-only note about them (never shown to them; detailed under "Related" below).

The In-common tab is computed from the overlap of your and their matchable attributes, respecting tier visibility.

---

## 4 · Profile fill flow (modules)

### What shows → how it's filled

**Every module uses one baseline flow.** The basics, Hobbies, This or that, List of favs, Places traveled, Deeper questions — all of them are answered **one question per screen**, with the same progress bar, the same smooth transitions, the same "Skip for now," and the same closing review as onboarding. Filling out your favorites should feel as quick and painless as the onboarding basics, never like a dense form. This is a rule, not a preference: a module that renders a stacked form is wrong.

Filling is broken into **modules** (`PROFILE-QUESTIONS.md`), in this order: The basics, **Hobbies**, This or that, List of favs, Places traveled, Deeper questions, Custom notes. Rules:

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

## 5 · Stories — your archive (own profile)

A **calendar** of your posted stories — not a grid of squares. Each date shows a **dot** (a story was posted that day) or a small **thumbnail** (a peek of that day's photo); tapping a date opens that day's story. Months are navigable. This reads like a memory archive, not a content dump.

### Storage bar + retention (deferred, honest)

- A **subtle storage bar** lives at the **bottom of the calendar** — how much of the month you've used vs. what you have, with a quiet "Upgrade" link. It's ambient, not a nag.
- **Everyone gets a rolling free month.** Story media older than 30 days is **deleted** (rolling) to keep co-op costs low.
- The **buy prompt only appears once the free month is fully used (100%)** — that's when the bar surfaces the choice: **add storage (~$2/mo)** or **join the co-op**, otherwise old posts keep rolling off. No upfront banner nagging people who haven't hit the limit.
- Retention applies to **story media** (the expensive part). Lighter data — **quiz results, events attended, about-you fields, inside jokes** — persists regardless.

Reuses the `payments` module (same billing surface as the events cap); co-op membership unlocks full retention as a member benefit.

---

## 6 · Quotes — the Inside Jokes wall (sticky notes)

The **Inside Jokes wall**: text sticky-notes — one-liners, "things said," the bits only a few people get. Two sub-tabs:

- **About you** — inside jokes others posted about/quoting you.
- **By you** — things you said.

Mechanics:
- A sticky note **quotes a person** and can **tag the people who were in it** and **the event where it happened**.
- It shares to **everyone tagged plus everyone who was at that event**, and tagging a person **cross-posts** it to their wall.
- **Photo tagging** works the same way: people tagged in photos surface on their profile.
- Inside jokes carry visibility like other fields (default: Friends), so the wall respects tiers.
- **New inside jokes also surface on Home** (see `HOME.md`): a few recent ones from the week; when there are none, it falls back to older ones as "moments."

**Adding one is a small "+", never a central menu.** A "+" tile sits among the notes, and on an empty wall that tile *is* the null state — an inviting dashed **"Add an Inside Joke"** container, so an empty wall reads as something to fill in rather than a void.

This is a new **`quotes`** module (text quotes + photo tags, with tagging that cross-posts to tagged people's profiles).

---

## 6b · Bucket list (profile-only module)

Lives **only on the profile page**, never in a central create menu. Each item is either solo ("Learn to surf") or **tags friends to do it together** ("Hike the Inca Trail · with Sam & Priya"), is **public or private**, and can be **checked off** when done. Adding uses the same light "+" treatment: a dashed **"Add to your bucket list"** row that doubles as the empty state.

---

## 7 · Settings — the control center (own profile)

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
| Shared card (own + friend), tier-filtered | `profiles` + `attributes` + `permissions` |
| Places-traveled map | `attributes` (places) + map render |
| This-or-that grid | `attributes` |
| "View as" preview (own profile) | `permissions` (render as tier) |
| In-common tab (friend profile) | `matching` (attribute overlap) + `permissions` |
| Mandatory intro screen (once) | `profiles` (flag) |
| Fill modules + question bank | `profiles` + question bank (see `PROFILE-QUESTIONS.md`) |
| Module save / resume / cancel | `profiles` (draft state, discarded on cancel) |
| Review & share (set-all + per-item) | `attributes` + `permissions` |
| "Ask me" icebreakers (friend-filled) | `profiles` |
| Story archive (calendar) | `stories` |
| Storage / retention / add-storage | storage-retention policy + `payments` |
| Inside Jokes wall + photo tags (cross-posting) | `quotes` |
| Bucket list (solo / with friends, public / private, checkable) | `bucket` |
| Settings · who-sees-what | `permissions` |
| Discoverable / match sources | `discovery` |
| Private friend note | `profiles` (author-scoped) |

---

## Acceptance criteria

- [ ] Own profile and friend profile render the **same shared card**; the difference is edit access, tier filtering, and which tabs appear.
- [ ] The card is a Hinge-style scroll of modules: header, currently (listening/reading), hobbies, **places-traveled map with pins**, **bucket list**, **this-or-that grid**, about me, favs, inside jokes.
- [ ] Own profile (Profile tab): tabs Profile / Stories / Inside jokes / Bucket list / Settings; the Profile tab is editable and has a **"View as" (Close/Friends/Everyone)** preview.
- [ ] Every category holds an **unlimited** number of items (one `attributes` row each, each independently visible); the model imposes no per-category cap.
- [ ] Long sections display calmly: collapsible, item counts, grouped sub-categories where relevant, and show-all/show-less.
- [ ] Edit/manage surfaces **all** sections at once (empty ones as "add"), each item with its own visibility control, and the "View as" filter works in edit too.
- [ ] Friend profile (`person/[id]`): tabs About them / In common / Inside jokes, plus a private note; no Stories or Settings tab.
- [ ] The **In common** tab (friend profiles only) shows strongest shared thing, shared hobbies, matching this-or-that answers, shared places, and matching quiz results — computed from attribute overlap, tier-respecting.
- [ ] A shared hobby in **In common** shows **both people's follow-up answers**, side by side.
- [ ] Co-op members see **shared-place photos** in **In common** when both people have been to the same place.
- [ ] **Places traveled** is a two-view swipeable module: map with pins, swipe for a scrollable list.
- [ ] **This or that** accepts **"both"** as a first-class answer.
- [ ] Every profile module is filled one question per screen, with the same progress bar, transitions, and review step as onboarding.
- [ ] A mandatory, non-skippable intro screen plays once before the first fill, covering group-based sharing and delete-anytime.
- [ ] Filling starts with basics + hobbies (hobbies near the top, quick to fill), then the rest; all optional, any order.
- [ ] A module can be saved partway and resumed; cancelling a module saves nothing (no partial state).
- [ ] Each module ends with a Review & share screen offering a set-all control plus per-item overrides.
- [ ] Easy modules default to a wider share; deeper/personal modules default to Close friends.
- [ ] Setting a share level writes the attribute's visibility and propagates everywhere it's used.
- [ ] The About them card is the shared card filtered by the viewer's tier.
- [ ] Once filled, About me renders visually with all answers open and a collapse control.
- [ ] Any field or module can be deleted, which removes it from Bridger's store.
- [ ] Stories renders as a **calendar**: dot or thumbnail per posted day, tap a date to open that story (own profile only).
- [ ] A subtle storage bar sits at the bottom of the calendar; the buy prompt (add storage ~$2/mo or join co-op) appears only once the free month is 100% used.
- [ ] Story media older than 30 days is deleted (rolling); quiz results, events, about-fields, and inside jokes persist.
- [ ] The Inside Jokes wall is sticky-note text with About you / By you sub-tabs; a joke quotes a person and can tag people and an event; it shares to those tagged plus everyone at the event; tagging cross-posts; photo tags behave the same.
- [ ] Inside jokes are added with a small "+" tile among the notes — no central create menu — and an empty wall shows an inviting dashed "Add an Inside Joke" container.
- [ ] New inside jokes also surface on Home (a few recent; fall back to older "moments" when none are new).
- [ ] The bucket list is a profile-only module: solo or with-friends items, public or private, checkable, with the same "+" / "Add to your bucket list" container.
- [ ] A private, author-only custom note can be added on any friend's profile.
- [ ] Settings (own profile) exposes who-sees-what, storage/plan, Discover, co-op, notifications, and account.
