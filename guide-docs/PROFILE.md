# Bridger — Profile Page (Spotify-artist layout)

Build doc for **both profile surfaces** — your **own profile** (the Profile tab) and a **friend's profile** (`person/[id]`). They render the **same composed page**, so you always see yourself the way friends do. Maps to `apps/mobile/app/(tabs)/profile.tsx` and `app/person/[id].tsx`, plus the `profiles` / `attributes` / `permissions` / `quotes` / `stories` modules. Read `ARCHITECTURE.md`, `DESIGN.md`, and `PROFILE-MODULES.md` (the canonical question bank for every fill-out module) alongside this; customization lives in `PROFILE-CUSTOMIZATION.md`.

> **The metaphor:** a Bridger profile is laid out like a **Spotify artist page**. The person is the "artist." This is deliberate — people already understand that mental model (here's who this act *is right now*, their top tracks, what they're into lately), and it reframes a profile away from a résumé toward **who you are today**. Every Spotify element maps to a Bridger one; the table in §1 is the Rosetta stone.

**One page, two views.** Own and friend profiles render the **same composition**. The only differences: what's editable, which tiers can see which fields, and which tabs are present.

---

## 0 · Mandatory intro (once, before first fill)

Before the profile can be filled, a **required, non-skippable intro** plays once (same pattern as onboarding's welcome). Its message: *you decide what each group of friends knows, and you can delete anything at any time — it's removed from Bridger's database.* The CTA is **Hell yeah**; tapping it sets `user_settings.profile_intro_seen` (and a device flag in demo) so the intro never returns for that account.

---

## 1 · The Spotify → Bridger map (read this first)

| Spotify artist page | Bridger profile | Notes |
|---|---|---|
| Artist header photo | **Header photo** | Full-bleed square cover (onboarding photo); circle everywhere *else* in the app. |
| Artist name | **Person's name** | |
| "1.3M monthly listeners" | **Their city** | The quiet line under the name. |
| **Following** button | **Friend-level (tier) control** | On a friend's page: shows your current tier with them (Close / Friend / Acquaintance) and taps to change it right there; **`+ group`** makes a new custom group (co-op). On your own page this slot is **Edit / View as**. |
| Shuffle / **▶ Play** (green) | **▶ Play their recap** | Appears only if they have a recap/podcast entry to listen to (`RECAP-PODCAST.md`). |
| Little square by "Following" | **Their current story** | Home-style story cover tile (not a face Avatar). Tap to watch; ring if unseen. |
| Music / Video / Events / Merch tabs | **Profile · Stories · Inside jokes · Bucket list** | The page's tab bar. Settings is a gear next to Edit on your own profile only. |
| Top-right (none) | **🔍 Search** | In the action row (fills width after the compact tier / View as pill). Searches this profile's visible fields. |
| "You liked · 31 songs" | **Mutuals** | The mutual friends row. Tap → who you both know. |
| **Popular** (top tracks) | **Top 5** | "5 things anyone who knows you well needs to know about you." |
| About the artist | **About me** | Moved to **under Top 5**; bio + a grid of about-me fields; shows city before you open it. |
| (upcoming shows) | **Upcoming events** | Events *the viewer* has been invited to, surfaced on the page. |
| Artist Pick + Popular Releases | **Current Obsession** | Combined. "Reading… / Building… / Training for…" squares — who you are *today*. |
| "Featuring {artist}" playlists | **Favorites** | Answerable modules styled like albums; **hobbies** sit under this. |
| Music videos | **Places traveled** (map) | The world map with pins takes the "music videos" slot. |
| (none) | **Where you met** | If recorded (coarse, opt-in, mutual). |
| (none) | **Greatest hits** (co-op) | Up to 3 large photos, placeable between any section. |

---

## 2 · Page wireframe (own profile, overview)

```
┌───────────────────────────────────────────┐
│ ‹ Profile                                 │  back · title (search lives in the row below)
│███████████████████████████████████████████│
│██     full-bleed header photo (edge→edge)██│  square cover from onboarding
│███████████████████████████████████████████│
│                                           │
│   Priya Shah                  Edit  ⚙  ▶  │  pixel name · Edit + gear (own) · play recap
│   📍 Denver, CO                           │  pin + city
│                                           │
│   ┌────┐ ┌──────┐ ┌─────────────────────┐ │
│   │story│ │Close▾│ │ 🔍 Search           │ │  Home-style story cover · compact
│   │tile │ │     │ │                     │ │  View as / tier pill · search fills row
│   └────┘ └──────┘ └─────────────────────┘ │
│                                           │
│   Profile   Stories   Jokes   Bucket      │  tab bar (Settings is the gear, not a tab)
├───────────────────────────────────────────┤
│  Mutuals (avatar row)                     │  you both know…
│  ┌─ widget box ─────────────────────────┐ │  every section is a clear container
│  │ TOP 5                                │ │
│  │  1 ▢ Twin sister…                    │ │
│  └──────────────────────────────────────┘ │
│  ┌─ widget box ─────────────────────────┐ │
│  │ ABOUT ME  bio preview…          ⌄    │ │  collapsed: bio (or city); open →
│  │  bio · square profile photo · grid   │ │  bio first, then photo, then fields
│  └──────────────────────────────────────┘ │
│  Upcoming events (viewer-invited)         │
│  ┌─ widget box ─────────────────────────┐ │
│  │ CURRENT OBSESSION                    │ │
│  │  ┌────┐ ┌────┐                       │ │
│  │  │ …  │ │ …  │   top 4 squares       │ │
│  │  └────┘ └────┘                       │ │
│  │         ( See all )   <- pill CTA    │ │
│  └──────────────────────────────────────┘ │
│  ┌─ widget box ─────────────────────────┐ │
│  │ FAVORITES   (same: top 4 + See all)  │ │
│  └──────────────────────────────────────┘ │
│  … hobbies · places · where you met …     │
└───────────────────────────────────────────┘
```

The order is the Spotify order (Mutuals → Top 5 → About me → Upcoming → Obsession → Favorites → …). Each content section sits in a **widget box**. Own **Edit** enters rearrange mode (up/down on boxes + pencil to edit that box's contents); **Customize look** opens co-op theme. Co-op **Greatest hits** photos (§9) can sit between sections. Customization rules live in `PROFILE-CUSTOMIZATION.md`; **"View original"** always returns this native layout.

---

## 3 · The header block

```
┌─ photo (full bleed) ──────────────────┐
│ ‹ back                    Edit / Msg  │  ← overlaid top
│                                       │
│ Priya Shah                            │  ← pixel name overlaid bottom-left
│ 📍 Denver, CO                         │  ← pin+city (Verified Artist slot)
└───────────────────────────────────────┘
   ┌────┐ ┌──────┐ ┌────────────┐  ▶
   │story│ │Close▾│ │ 🔍 Search  │     ← below the photo
   └────┘ └──────┘ └────────────┘
```

- **Header photo** — **full-bleed** across the top (edge to edge), square cover from onboarding. Circles are used everywhere else; this is the banner treatment.
- **Back** — overlaid top-left on the photo (semi-transparent circle), Spotify-style.
- **Name** — large **pixel** font, overlaid bottom-left on the photo (white on a dark fade).
- **City** — pin icon + city overlaid under the name on the photo (the "Verified Artist" slot).
- **Edit** (own) — overlaid top-right on the photo; toggles rearrange mode **and** opens the **Photo look** sheet so you can switch among the four looks (Pop art / Comic / Sepia / X-ray) you first picked in onboarding. The **active look is painted over the Spotify hero** (Pop art = Warhol 4-tile from the original; other looks = baked avatar). Theme/CSS stay on Settings → Customize / Customize look.
- **⚙ Settings** (own) — gear to the right of Edit on the photo; opens Settings (§14). Not a tab.
- **▶ Play recap** — appears only when the person has a recap/podcast entry; opens the player (`RECAP-PODCAST.md`).
- **Story tile** — Home-style cover (story media), not a second face Avatar. Ring if unseen. **Own + empty:** dashed tile; tap opens capture to post an update (`post_prompt`).
- **Compact pill** — View as (own) or friend-level tier (friend), small, to the left of search.
- **Search** — fills the rest of the action row; searches visible fields on *this* profile (never logs query text). Replaces the old top-right / overflow search slot.
- **Tier / View as pill** — compact control left of search. Friend: re-tier (fires `friend_retiered` on change). Own: View as Close / Friends / Everyone. Message stays in the friend screen header.
- **Tab bar** — Profile · Stories · Inside jokes · Bucket list.

---

## 4 · Top 5 — "things to know about me"

The **Popular tracks** slot. The prompt: *"5 things anyone who knows you well needs to know about you."* A numbered 1–5 list, each row an optional little image/emoji + a short line.

```
TOP 5  ─ 5 things anyone who knows me should know
  1 ▢  Twin sister — we finish each other's sentences
  2 ▢  Recovering perfectionist
  3 ▢  Will drive 3 hours for good tacos
  4 ▢  Grew up on a dairy farm
  5 ▢  Equal parts terrified of and obsessed with AI
```

- Exactly up to 5, ordered, reorderable by the owner.
- Each carries its own tier visibility (default: Friends).
- This is the **signature identity module** — it sits highest because it's the fastest way to "get" someone.

---

## 5 · About me (moved under Top 5)

Spotify-style **About card**: wide photo on top (defaults to their **profile photo**; own Edit mode can Take / Upload a new one — same upload exception as the header avatar), name + pin/city, and a bio snippet you can already read. Tap to expand for the full bio plus the about-me field grid. No follower count, no follow button. On a **friend** profile, Favorites album tiles open a **read-only answers sheet** (never the fill-out quiz).

```
ABOUT ME                                   ⌃
  “Studio potter, twin, perpetual beginner. Ask
   me about the dairy farm.”                       ← bio first
  ┌──────────┐
  │  photo   │   (optional)
  └──────────┘
  HOMETOWN     Missoula, MT
  LIVES IN     Portland, OR
  WORK         Studio potter
  BIRTHDAY     March 4
  ALLERGIES    Peanuts
  LOVE LANG.   Acts of service
```

- The header badge shows a count ("About me · 6").
- Fields are the about-me question set (`PROFILE-MODULES.md`); each independently tier-visible.
- **Allergies note:** the "only you can see this" style line (where used) sits **under** the field, not boxed (consistent with `EVENTS.md`).

---

## 6 · Upcoming events (viewer-aware)

Under About me, surface **events the *viewer* has been invited to** with this person — so on Priya's page you see the game night *you're both* going to, with RSVP state. On your own profile this shows events you're hosting/attending. Pulls from `EVENTS.md`; respects invite visibility.

---

## 7 · Current Obsession (who you are *today*)

Spotify's **Artist Pick + Popular Releases**, combined. A grid of **squares**, each a "right now" statement with a picture or emoji (empty → an emoji stands in). The whole point, in the founder's words: *this tells people who you are today, not five years ago.*

**Listening + music link:** Settings → **Spotify** or **Apple Music** links a music account (not Bridger login). **Listening track** picks a catalog song via Spotify search (`music_picks.listening_now`). Friend/viewer can play a ~30s preview when Spotify provides `preview_url`, open in Spotify/Apple Music, or add to their Spotify library if they are linked. Synced top artists (up to 50 per provider) can surface in reveal / In common.

```
CURRENT OBSESSION
  ┌──────────┐ ┌──────────┐
  │ Reading  │ │ Building │
  │  📖      │ │  🛠      │      top 4 shown
  │ Tomorrow…│ │ a kiln   │
  └──────────┘ └──────────┘
  ┌──────────┐ ┌──────────┐
  │ Training │ │Listening │
  │  🏃      │ │  🎧      │
  │ a 10k    │ │ boygenius│
  └──────────┘ └──────────┘
           ( See all )                 <- pill under the four
```

- **Prompt palette:** Reading… · Watching… · Listening… · Obsessed with… · Working on… · Traveling to… · Training for… · Currently watching… · Building: · Writing: · Learning: · Launching: (extendable).
- Add a **picture or emoji** per square; empty squares fall back to an emoji.
- **Editable anytime, reorderable;** the **top 4** show, then a **See all** pill under the grid.
- Absorbs the old **Currently (Listening/Reading)** chips — "Listening…" and "Reading…" are now Current-Obsession squares (still feed the story swipe-up "Currently" in `STORIES.md`).

---

## 8 · Favorites (+ hobbies)

Spotify's **"Featuring {artist}"** row becomes **Favorites** — answerable modules styled like **albums** (Food orders, Entertainment, Desert-island, Comfort films…), and this is where **This-or-that now lives**.

**Own profile = two rows:**
- **To start** (top): modules you *haven't* filled — tap to begin. Own-profile only (friends don't see your empty prompts).
- **Filled** (below): completed modules as a **2-up grid** (two boxes per row), **top 4** then a **See all** pill under the four. Not a left/right scroll — a grid.

```
FAVORITES
  ┈ to start ┈                      (own profile only)
  ┌──────────┐ ┌──────────┐
  │ Food     │ │ This or  │
  │ order  + │ │ that   + │
  └──────────┘ └──────────┘
  ┈ filled ┈
  ┌──────────┐ ┌──────────┐
  │ Comfort  │ │ Desert   │
  │ films    │ │ island   │
  └──────────┘ └──────────┘
           ( See all )                 <- pill under the four
```

**Hobbies** sit **under** Favorites, keeping the existing Bridger widget: a **swipe between two views** (a page indicator shows which) —
- **Chips view:** colorful hobby chips; **tap a chip** to drop its follow-up answer inline.
- **Answers view:** swipe within the widget to a scrollable list of every hobby + its answer, contained inside the widget.
- **Whichever view they last stopped on becomes the default** next time a profile opens (a small saved preference).

---

## 9 · Places traveled · Where you met · Greatest hits

- **Places traveled** (the "Music videos" slot) — a **map with pins** (clean/neoclassical per `DESIGN.md`); tap a pin for the place/note; swipe to a contained list view. **Co-op:** attach **photos per place**, and when you and a friend have both been somewhere, your photos surface for both in **In common** ("You've both been to Lisbon").
- **Where you met** — under the map on a friend's profile, if recorded: "RiNo, Denver · via Sam." Coarse, opt-in, mutual, either can edit/remove (`DATA.md`).
- **Greatest hits (co-op)** — up to **3 large photos**, each about the size of the About-me block, **insertable between any two sections**. Pure expression; co-op only; carries tier visibility.

---

## 10 · The fill-out modules (menu)

All profile content is filled through **modules** — the full question bank lives in **`PROFILE-MODULES.md`** (canonical). The builder presents them as cards (description, time estimate, answered count, Continue/Edit, live preview):

**About Me Basics** · **About Me Deeper** · **Hobbies & Interests** · **Favorite Food & Drinks** · **Favorite Entertainment** · **Everyday Favorites** · **Sports Favorites** · **This or That** · **Places You've Been** · **Top 5** (§4) · **Current Obsession** (§7) · **Life Timeline** · **Recommendations** · **Goals** (feeds Bucket List §13)

- **Life timeline** — Education · Jobs · Cities, plus **defining moments** (not brag-achievements): "Started a nonprofit," "Climbed Kilimanjaro," "Built an app," "Published a book," "Ran a marathon." Moments that made you, not a CV.
- **Recommendations** — things others *have to* do: Books · Movies · Restaurants · Games · Music · Podcasts, each with an optional note.
- **Goals** — the shape of a life ("where I want to travel before I die"); feeds the Bucket List tab.

Unfilled modules surface in Favorites' "to start" row (§8, own profile only) and the module menu; all use the baseline one-question-per-screen flow.

## 11 · Every module ends the same two ways

At the end of **every** module's fill flow:

1. **Who sees this** — the Review & share step: a **Set all** (Close / Friends / Everyone) plus **per-item overrides**. Smart defaults by depth: light modules default wider, personal ones default to Close. Writes each item's `visibleToTier` and propagates everywhere.
2. **Use this to connect me?** — a single explicit ask: *"Can these answers help connect you with friends of friends in Discover?"* Yes/No. This sets the attribute's `matchable` flag (`DATA.md`, `MATCHING-ALGORITHMS.md`). Sharing with friends and being used for matching are **separate consents** — a field can be visible to friends but not matchable, or matchable but held close.

---

## 12 · Own vs friend profile (what differs)

Same page; the differences:

| | Own profile | Friend profile (`person/[id]`) |
|---|---|---|
| Tabs | Profile · Stories · Inside jokes · Bucket list | About them · In common · Inside jokes · Bucket list |
| Header action | Edit · ⚙ Settings · **View as ▾** | **Tier control** · Message · … |
| Editing | Every field inline | None |
| Tier filter | You see all; preview via View as | Filtered to your tier with them |
| Stories tab | Your **calendar archive** (tap a day → play) | — |
| In common | — | The re-openable reveal (shared things, both hobby answers side-by-side) |
| Settings | Gear (§14) | — |

**In common** (friend only) is the permanent, re-openable version of the connection reveal (`REVEAL.md`, `DISCOVER.md`): strongest shared thing, shared hobbies **showing both people's follow-up answers side by side**, matching this-or-that, shared places (with co-op photos), matching quiz results — computed from attribute overlap, tier-respecting.

---

## 13 · Stories tab (own) · Inside jokes · Bucket list

- **Stories** (own only) — a **calendar archive**; each day with a post shows a dot/thumbnail; **tap a day to play that story**. A subtle **storage bar** sits at the bottom (§14 / `PROFILE-CUSTOMIZATION.md` for storage economics). Story media older than 30 days rolls off (co-op = full retention).
- **Inside jokes** — the sticky-note wall: quoted person's photo on each note; tap for who-posted + event/place + date; a single **All / About you / By you** filter; add via a "+" tile with an "Add an Inside Joke" null state; tagging shares to tagged people + event attendees and cross-posts. Backed by `quotes`.
- **Bucket list** — its own tab: items solo or friend-tagged, each public/private, checkable; the **Goals** module (§10) feeds it. A friend's tab shows only public items.

---

## 14 · Settings (own profile, gear)

Who-sees-what overview · Storage & plan (usage + co-op status + overage — `PROFILE-CUSTOMIZATION.md`) · Discover (Discoverable toggle + match sources) · Co-op portal · **Customize your profile page** (co-op — `PROFILE-CUSTOMIZATION.md`) · Notifications · Account · Log out.

---

## 15 · Related: private notes & reminders on a friend

On a friend's `person/[id]`, keep **private, author-only** entries (never shown to them): **Note** ("loves obscure horror") or **Date** ("graduation · May 5" → reminds you on Home a week before + day-of). These feed, and are fed by, the in-context capture in `AGENT.md`/reconnect. **Birthdays** are the friend's *own* shared attribute (they drive Home's Coming-up and the festive Friends row automatically) — not a private note.

---

## Data (shapes)

```ts
interface ProfilePage {
  header: { name: string; city?: string; headerPhotoId?: string;
            hasRecap: boolean; currentStoryId?: string; };
  top5: Top5Item[];                         // ≤5, ordered
  about: AboutField[];                      // bio + grid fields
  bio?: { text?: string; photoId?: string };
  currentObsession: ObsessionSquare[];      // top 4 shown
  favorites: FavoriteModule[];              // album-style; incl. this-or-that
  hobbies: Hobby[];                         // chips ⇄ answers
  places: Place[];                          // map pins (+ co-op photos)
  greatestHits?: PhotoBlock[];              // co-op, ≤3, slotted
  whereMet?: { label: string; via?: string }; // friend view, if recorded
}

interface Top5Item { id: string; text: string; imageId?: string; visibleToTier: Tier; }

interface ObsessionSquare {
  id: string; prompt: string;               // "Reading…", "Building:", …
  text?: string; imageId?: string; emoji?: string;
  order: number; visibleToTier: Tier;
}

interface AboutField { attributeId: string; key: string; value: string; visibleToTier: Tier; }

interface Attribute {                        // the universal row (unchanged)
  id: string; key: string; value: string;
  visibleToTier: Tier;                       // who sees it
  matchable: boolean;                        // §11 — separate consent for Discover
}
```

Every field is an `Attribute` with its own `visibleToTier` **and** `matchable` flag; the page composes from whatever the viewer's tier may see. Categories are **unlimited** (one row per item).

---

## Module mapping

| Piece | Backend |
|---|---|
| Composed page (own + friend), tier-filtered | `profiles` + `attributes` + `permissions` |
| Header tier control / re-tier | `friends` (tier) |
| Top 5 · Current Obsession · Favorites · Recommendations · Life timeline | `attributes` (typed) |
| Places map (+ co-op photos) | `attributes` + map render + storage |
| In-common (friend) | `matching` (overlap) + `permissions` |
| "View as" (own) | `permissions` (render as tier) |
| Upcoming events (viewer-aware) | `events` + `permissions` |
| Recap play button | `recap` |
| Search this profile | `profiles` (local field index) |
| Module end: who-sees + matchable ask | `permissions` + `discovery` |
| Greatest hits / customization | `profiles` + `coop` (see `PROFILE-CUSTOMIZATION.md`) |
| Stories archive · storage | `stories` + storage/`payments` |
| Inside jokes | `quotes` |
| Private notes & reminders | `profiles` (author-scoped) |

---

## Acceptance criteria

- [ ] Own and friend profiles render the **same Spotify-style composition**; differences are edit access, tier filtering, and tabs.
- [ ] Header: square photo, name, city line, ▶ recap (only if present), current-story square (own empty → tap opens capture), **tier control** (friend) / **Edit + ⚙ Settings + View as** (own), and a **search** control that searches this profile's content.
- [ ] The page order matches §2: Mutuals → Top 5 → About me → Upcoming → Current Obsession → Favorites (+hobbies) → Places → Where you met.
- [ ] **Top 5** captures up to 5 ordered "things to know," each optionally imaged, each tier-visible.
- [ ] **About me** sits under Top 5, shows city when collapsed, and expands to bio-first + a grid of fields; no follower/follow UI.
- [ ] **Upcoming events** shows events the *viewer* is invited to with this person.
- [ ] **Current Obsession** is a grid of picture/emoji squares from the prompt palette, top 4 + See all, editable/reorderable; absorbs the old Listening/Reading chips.
- [ ] **Favorites** shows (own) a "to start" row + a filled **2-up grid** (top 4 + See all), styled like albums, and includes **This-or-that**; **Hobbies** sit under it as the swipe (chips ⇄ answers) widget whose last view is remembered.
- [ ] **Places traveled** is the map-with-pins module (co-op photos per place; shared places surface both photos in In common).
- [ ] **Where you met** shows on friend profiles when recorded (coarse, mutual, editable/removable).
- [ ] **Greatest hits** (co-op) allows up to 3 large photos insertable between sections.
- [ ] **Life timeline** (education/jobs/cities + defining moments) and **Recommendations** (books/movies/etc.) modules exist and fill via the standard flow.
- [ ] **Every module ends with** (1) a who-sees Set-all + per-item step and (2) an explicit "use this to connect me in Discover?" toggle writing `matchable`; the two consents are independent.
- [ ] Friend profiles show an **In common** tab (shared things; shared hobbies show *both* answers side by side); own profiles show a **Stories calendar** (tap a day to play).
- [ ] Categories are **unlimited**; long sections stay calm (counts, collapse, See all).
- [ ] A mandatory one-time intro covers group-based sharing + delete-anytime; any field/module is deletable (removed from Bridger's store).
- [ ] The native layout is always reachable via **View original** regardless of customization (`PROFILE-CUSTOMIZATION.md`).
