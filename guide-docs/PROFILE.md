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
- **Hobbies** — every hobby has a **follow-up answer** (see `PROFILE-QUESTIONS.md`). The widget has **two contained views you swipe between** (a page indicator shows which):
  - **Page 1 — clean:** just the colorful hobby chips. **Tapping a chip drops down its follow-up answer** inline (a quick peek), then collapses. Out of the way by default.
  - **Page 2 — answers:** swipe within the widget to a list of **every hobby + its answer**, scrollable **inside the widget** (contained — it never blows out the profile).
  So a viewer can glance at the chips, tap one for a single answer, or swipe to read them all — their choice, all in one tidy widget.
- **Places traveled** — a **two-view module you swipe between** (like the hobbies widget), with a page indicator:
  - **Map view** — a **map with pins** for everywhere they've been (clean/neoclassical map per `DESIGN.md`); tap a pin for the place/note.
  - **List view** — swipe within the module to a scrollable list of places (+ year/note), contained inside the widget.
  - **Co-op: photos per place.** Co-op members can attach **photos** to a place. And the payoff — **when you and a friend have both been somewhere, your photos from that place surface for both of you** in "In common" ("You've both been to France" → your photo + theirs). An instant "wait, you were there too?" moment. (Photos are a co-op expression feature — see `COOP.md`.)
- **This or that** — shown as **two columns in rows** (not a grid of squares): each row is a pair (Coffee | Tea, Mountains | Beach), with the person's **chosen side highlighted** and the other **dimmed**, so you read "coffee, *not* tea" at a glance. Rows are **tappable** (to answer on your own; "both" lights up *both* sides). Choice is **this / that / both**.
- **Bucket list** — has moved to its **own tab** (§8), no longer a section in this card scroll.
- **About me** — personal fields + important dates, rendered **visual and expanded** by default with a **collapse** control.
- **List of favs** — their favorites.
- **Inside Jokes** — the wall (its own tab; see §6).

Each field is a `ProfileAttribute` with a `visible_to_tier` tag; the card is composed from whatever the viewer's tier is allowed to see.

### Built to hold a lot

Profiles are meant to be **deep** — someone might have dozens of hobbies, 50 favorite movies, 40 places, piles of favs across food/entertainment/everyday/sports, a long this-or-that, many quiz results. The data model already supports this with **zero limits**: every item is its own row in `attributes`, each with its own visibility, so a category can hold as many entries as the person wants. The UX makes that volume calm, not overwhelming:

- **Collapsible sections** with an **item count** (e.g. "Movies & shows · 30") — collapsed by default once large.
- **Grouped sub-categories** where they exist (favs → Food / Entertainment / Everyday / Sports).
- **Show all N / show less** within a section, so long lists don't blow out the scroll.
- Sensible ordering (most-recent or pinned first).

So the card stays scannable whether a section has 3 items or 300.

### Personalization (co-op) + the accessible default

**Co-op members can personalize their profile** — background image, colors/vibe, extra photos, and their own **custom widgets** — from **Profile → Settings → "Customize your profile page"** (co-op only). Their friends see it as saved. Full spec: `PROFILE-CUSTOMIZATION.md`. Two rules:
- **Core widgets are a fixed, ordered skeleton.** The core sections always render in the same order and positions on every profile; members can't reorder or move them — they insert custom widgets **into the slots between** them. Consistency keeps every profile legible.
- **The original page is always one tap away.** A persistent **"View original"** lets any viewer drop a customized profile to the clean default (accessibility, or preference). Personalization is presentation-only; the underlying fields and tier visibility never change.

---

## 2 · Own profile (Profile tab)

What *you* see on the Profile tab. Content tabs: **Profile · Stories · Inside Jokes · Bucket List** (Settings is a **gear icon**, not a content tab).

- **Profile tab** = the shared card above, **as you** — every field editable inline, plus a **"View as"** switch (Close friends / Friends / Everyone) so you can preview exactly what each tier sees. This is the WYSIWYG guarantee: your profile *is* the friend-facing card.
- **Edit / manage** surfaces **every section at once** — each collapsible with its item count, empty ones shown as "add", each item with its own visibility eye — so no matter how much a person has filled in, they can find and manage all of it in one place. The **"View as"** filter works here too, so they can check how Close friends vs. Friends vs. Everyone see the whole thing while editing.
- **Stories tab** = your **calendar archive** (§5) — **tap a day that has a post to open and watch that story**. Own-profile only — friends don't see your story archive.
- **Inside Jokes tab** = your wall (§6).
- **Bucket List tab** = your bucket list (§8) — its own tab, not a card in the Profile scroll.
- **Settings** (gear) = permissions, storage/plan, Discover, co-op, account (§7). Own-profile only.
- **No "your polls" on the profile** — polls now live on Home ("See previous polls"), so there's no polls section here.

Filling happens through the bite-size modules (§3).

---

## 3 · Friend profile (`person/[id]`)

What you see when you tap into a friend. Tabs: **About them · In common · Inside Jokes · Bucket List** (plus your private note).

- **About them** = the shared card, **filtered by your tier** with them — you only see fields they've shared with your circle. Not editable.
- **In common** = the re-openable **connection reveal**: strongest shared thing, shared hobbies, matching this-or-that answers, places you've both been, matching quiz results. **Shared hobbies show *both* follow-up answers** — "You both run" → *your* answer and *their* answer, side by side — so there's an instant conversation starter, not just a matched label. This is the "what you have in common" view made permanent and re-accessible (from `DISCOVER.md`). Own profiles don't have this tab.
- **Inside Jokes** = their wall.
- **Bucket List** = their public bucket-list items (private ones stay hidden).
- **How you met** = a small memory on their profile — "Met at Game Night · Mar 3 · via Priya," or "Met in RiNo, Denver," or "Met through Priya." Captured from the connection context (event / mutual friend / coarse place). The place is **opt-in and coarse** (see `DATA.md`), visible only to the two of you, and **either can edit or remove it**.
- **Private note** = your author-only note about them (never shown to them; detailed under "Related" below).

The friend profile header also has a **Message** button → opens the conversation with them (Bridger's limited 5/day chat; see `MESSAGES.md`), and an **overflow menu (…)** with **Remove friend / Block / Report** (behavior in `FRIENDS.md`).

The In-common tab is computed from the overlap of your and their matchable attributes, respecting tier visibility.

---

## 4 · Profile fill flow (modules)

### What shows → how it's filled

Filling is broken into **modules** (`PROFILE-QUESTIONS.md`), in this order: The basics, **Hobbies**, This or that, List of favs, Places traveled, **Bucket list**, Deeper questions, Custom notes. **Every module uses the same baseline Typeform flow** — one question per screen, progress bar, smooth transitions, tappable/multi-select/image choices — the *same* feel as the onboarding basics and about-me questions (see the "Module flow" section in `ONBOARDING.md`). So filling favs or this-or-that feels quick and familiar, never like a dense form. Rules:

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

A **calendar** of your posted stories — not a grid of squares. Each date shows a **dot** (a story was posted that day) or a small **thumbnail** (a peek of that day's photo). **Tapping a day that has a post opens the full story player** so you can actually watch it back (previously the images weren't tappable — now they are). Months are navigable. This reads like a memory archive, not a content dump.

### Storage bar + retention (deferred, honest)

- A **subtle storage bar** lives at the **bottom of the calendar** — how much of the month you've used vs. what you have, with a quiet "Upgrade" link. It's ambient, not a nag.
- **Everyone gets a rolling free month.** Story media older than 30 days is **deleted** (rolling) to keep co-op costs low.
- The **buy prompt only appears once the free month is fully used (100%)** — that's when the bar surfaces the choice: **join the co-op** (unlimited storage is a membership benefit — standalone storage SKUs are retired per `COOP.md`), otherwise old posts keep rolling off. No upfront banner nagging people who haven't hit the limit.
- Retention applies to **story media** (the expensive part). Lighter data — **quiz results, events attended, about-you fields, inside jokes** — persists regardless.

Reuses the `payments` module (same billing surface as the events cap); co-op membership unlocks full retention as a member benefit.

---

## 6 · Inside Jokes (sticky notes)

The **Inside Jokes** wall: colorful text sticky-notes — inside jokes, one-liners, "things said." Instead of two sub-tabs, there's a **single filter** (All / About you / By you) so it's one clean view.

Mechanics:
- A sticky note is a **quote/one-liner**. The **quoted person's profile picture** sits on the note (with their name) — so you see *whose* line it is at a glance.
- **Tap a note** to reveal its details: **who posted it** ("Posted by Sam"), **at what event / where**, and **the date**. (The face is the quoted person; the detail says who created it.)
- **Adding is inline and light:** a small **"+" tile among the notes** — no big menu. The **null state is an inviting container** — an empty dashed note that reads **"Add an Inside Joke."**
- **Tagging drives sharing:** a note **shares to the people you tagged + everyone at the tagged event**, and tagging a person **cross-posts it to their wall**.
- **Photo tagging** works the same way: people tagged in photos surface on their profile.
- They carry visibility like other fields (default: Friends), so the wall respects tiers.
- **New ones also surface on Home** (in the announcements carousel / recent strip); when there are none, older ones resurface as "moments."

Backed by the **`quotes`** module. *(User-facing name: "Inside Jokes"; internal module stays `quotes`.)*

---

## 7 · Settings — the control center (own profile)

Because Profile is "practically your settings page," Settings (the gear icon) holds:

- **Who sees what** — a per-tier overview of what each group (Close friends / Friends / Everyone) can see, complementing the per-field chips on About.
- **Storage & plan** — current usage, co-op status, add-storage.
- **Discover** — link to the Discoverable master toggle and match sources (see `DISCOVER.md`).
- **Co-op** — a co-op icon that opens the co-op portal (external, gatekept — see `ADMIN.md`); the other entry point besides the Home footer.
- **Customize your profile page** — (co-op only) background, colors/vibe, photos, and custom widgets; see `PROFILE-CUSTOMIZATION.md`.
- **Notifications**, **account**, **log out**.

---

## 8 · Bucket List (its own tab)

The bucket list is a **dedicated tab** on the profile (own and friend), not a card in the Profile scroll. Things the person wants to do.

- Each item is **written solo** ("Learn to surf") or **tags friends** ("Hike the Inca Trail · with Sam & Priya"), and each is **public or private** (private = just them; public = friends per tier — a friend's tab shows only public items).
- Items can be **checked off** when done.
- **Add inline** — a "+" and a friendly null-state container ("Add to your bucket list"); filled via the same baseline module flow.
- Tagging a friend puts it on the radar as something to do *together* (and can surface in In-common when you share a want).

---

## Related: notes & reminders on a friend's profile

On someone else's `person/[id]`, you can keep **private notes & reminders** — visible only to you, never shown to them or anyone else. Each entry is one of two kinds:

- **Note (text)** — a little thing to remember: "loves obscure horror films," "allergic to peanuts."
- **Date** — a date you care about: "graduation · May 5," "work anniversary." A date entry **reminds you on Home** (a "Coming up" card in Home's announcements carousel — `HOME.md`) **1 week before and again on the day**.

Add via a small Text / Date toggle. These are your own scratchpad on that person (author-only, private), editable and deletable anytime.

**Birthdays** are separate: a birthday is the *friend's own* shared attribute (from their profile), so it drives the birthday reminders on Home and the festive row in Friends automatically — you don't add it as a private note.

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

interface FriendNote {                 // private, author-only
  id: string;
  personId: string;
  kind: 'text' | 'date';
  text?: string;                       // "loves horror movies", or the date's label ("Graduation")
  date?: string;                       // for kind 'date' → reminds 1 week before + day-of, on Home
}
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
| Settings · who-sees-what | `permissions` |
| Discoverable / match sources | `discovery` |
| Private friend note | `profiles` (author-scoped) |

---

## Acceptance criteria

- [ ] Own profile and friend profile render the **same shared card**; the difference is edit access, tier filtering, and which tabs appear.
- [ ] The card is a Hinge-style scroll of modules: header, currently (listening/reading), hobbies, **places-traveled map with pins**, **this-or-that grid**, about me, favs, inside jokes.
- [ ] Every hobby has a follow-up answer; the hobbies widget has a clean chips view (tap a chip → drop-down its answer) and a swipe-to page listing every hobby + answer, scrollable within the widget.
- [ ] Places traveled is a two-view module (map with pins / list) you swipe between within the widget.
- [ ] Co-op members can add photos per place; shared places surface both people's photos in the In-common view.
- [ ] This-or-that renders as two columns in rows with the chosen side highlighted and the other dimmed, tappable; answers can be this, that, or both.
- [ ] All profile modules use the baseline Typeform flow (one question per screen), matching onboarding.
- [ ] In the In-common tab, shared hobbies show both people's follow-up answers side by side.
- [ ] Own profile content tabs are Profile / Stories / Inside Jokes / Bucket List (Settings is a gear, not a content tab); the Profile tab is editable with a **"View as" (Close/Friends/Everyone)** preview. There is no polls section on the profile.
- [ ] Every category holds an **unlimited** number of items (one `attributes` row each, each independently visible); the model imposes no per-category cap.
- [ ] Long sections display calmly: collapsible, item counts, grouped sub-categories where relevant, and show-all/show-less.
- [ ] Edit/manage surfaces **all** sections at once (empty ones as "add"), each item with its own visibility control, and the "View as" filter works in edit too.
- [ ] Friend profile (`person/[id]`): tabs About them / In common / Inside Jokes / Bucket List (public items only), plus a private note; no Stories or Settings.
- [ ] The **In common** tab (friend profiles only) shows strongest shared thing, shared hobbies, matching this-or-that answers, shared places, and matching quiz results — computed from attribute overlap, tier-respecting.
- [ ] A mandatory, non-skippable intro screen plays once before the first fill, covering group-based sharing and delete-anytime.
- [ ] Filling starts with basics + hobbies (hobbies near the top, quick to fill), then the rest; all optional, any order.
- [ ] A module can be saved partway and resumed; cancelling a module saves nothing (no partial state).
- [ ] Each module ends with a Review & share screen offering a set-all control plus per-item overrides.
- [ ] Easy modules default to a wider share; deeper/personal modules default to Close friends.
- [ ] Setting a share level writes the attribute's visibility and propagates everywhere it's used.
- [ ] The About them card is the shared card filtered by the viewer's tier.
- [ ] Once filled, About me renders visually with all answers open and a collapse control.
- [ ] Any field or module can be deleted, which removes it from Bridger's store.
- [ ] Stories renders as a **calendar**: dot or thumbnail per posted day; tapping a day with a post opens the full story player (own profile only).
- [ ] A subtle storage bar sits at the bottom of the calendar; the join-the-co-op prompt appears only once the free month is 100% used (no standalone storage SKU — see `COOP.md`).
- [ ] Story media older than 30 days is deleted (rolling); quiz results, events, about-fields, and inside jokes persist.
- [ ] The Inside Jokes wall uses a single filter (All / About you / By you), not two tabs; each sticky note shows the quoted person's profile photo and, on tap, who posted it + event/place + date. Adding is a "+" tile among the notes, with an "Add an Inside Joke" container as the null state; tagging shares to tagged people + event attendees and cross-posts.
- [ ] Bucket list is its own profile tab: items written solo or friend-tagged, each public/private, checkable, added inline with a null-state container.
- [ ] New inside jokes also surface on Home (a few recent; fall back to older "moments" when none are new).
- [ ] A private, author-only entry (text note or date) can be added on any friend's profile; a date reminds you on Home 1 week before and on the day.
- [ ] A friend's shared birthday drives the "Coming up" card in Home's announcements carousel and the festive Friends row automatically (not added as a private note).
- [ ] Settings (own profile) exposes who-sees-what, storage/plan, Discover, co-op, notifications, and account.
