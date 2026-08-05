# Bridger — Magic Patterns Brief

A brief for building Bridger's **component library + screens** in Magic Patterns. Visual language lives in `DESIGN.md`; screen content lives in each page doc. This doc is the how-to-build-it-cleanly layer.

---

## Golden rule: minimal copy

Magic Patterns tends to over-write. **Don't.** Match the clean reference mockups:

- UI shows **short, real labels only** — the words a shipped screen would actually show. "Post yours", "See all", "Add", "Continue". Not sentences.
- **No filler, no marketing paragraphs, no lorem, no helper text** inside components unless a screen genuinely needs one short line.
- If a real button says one word, use one word. If a section needs no description, give it none.
- Pull labels from the page docs; **don't invent explanatory copy.**

When in doubt: fewer words.

Two hard bans in user-facing copy (see `COOP.md`):

- **Never the word "AI."** Internally it's the AI summary; in the product it's a **recap** or **summary**.
- **Never an em dash (—) or en dash (–).** Use a period, a comma, or a middle dot (·). This includes generated recap text.

---

## Visual language (summary — full spec in DESIGN.md)

- **Canvas:** eggshell white (`#F4F1E7`) light / near-black (`#0E0E0E`) dark. Onboarding & fill-flows may go full color.
- **Flat & rounded:** no heavy shadows, soft corners, colorful accents on a calm canvas.
- **Headers:** pixel font (Pixelify Sans) for section titles; clean sans for everything else. Never pixel body copy.
- **Primary buttons:** 90s-metallic (beveled via borders — light top/left, dark bottom/right; silver face; black text). Everything else flat.
- **Motion:** subtle; things ease and breathe; transform/opacity only; respect `prefers-reduced-motion`.
- ~80% clean modern, ~20% retro. Retro is seasoning.

---

## Navigation

- **Floating tab bar** — a **detached, rounded pill** (inset from the bottom edge with margin), Apple's newer dynamic/"liquid-glass" feel: translucent where possible, may subtly shrink or tuck away on scroll. **5 destinations:** Home · Events · Discover · Friends · Profile. Active = filled circle; inactive = muted icon. Not a full-width bottom bar flush to the edge.
- **Header:** pixel screen title on the left. **Top-right slot is reserved for Messages (chat)** — a chat icon (dormant until chat ships). **No notification bell** — notifications live in the feed + a dedicated page (below).

---

## Component library (build these)

One line each; keep them dumb and reusable.

| Component | Spec |
|---|---|
| `PixelHeading` | pixel-font section title |
| `ButtonPrimary` | metallic beveled CTA |
| `ButtonSecondary` | flat pill, hairline border |
| `Chip` / `TierChip` | rounded pill; selected = solid, else outline |
| `Card` / `ColorCard` | flat rounded container; color variants |
| `ListRow` | avatar + label + trailing (chevron/handle/toggle) |
| `Avatar` | circle; filtered photo or color |
| `SegmentedTabs` | About / Stories / Quotes / Settings style |
| `FloatingTabBar` | the 5-destination floating pill |
| `StoryTile` | rectangular, pic-in-corner, image fills |
| `StoryProgressBars` | 1–3 segments |
| `PolaroidCard` | white frame, photo, name, heart; slight rotation |
| `InsideJokeNote` | colored sticky note; quoted person's avatar on the note, taps to reveal who posted it, where and when |
| `AddNoteTile` | the dashed "+" tile that sits among the notes and doubles as the empty state |
| `InsideJokesWall` | one wall with an All / About / By filter, notes grid with a "+" tile, tag-people-and-event sheet |
| `BucketList` | profile-only module: solo or with-friends items, public/private, checkable |
| `InterestBlob` | colorful rounded blob, icon + label + check |
| `AudiencePicker` | Close/Friends/Everyone concentric multi-select + co-op groups; used by stories, polls **and** activity contributions |
| `ModuleFlow` | the one baseline fill flow: one question per screen, progress bar, skip, closing review. `mode="private"` opens on the "never shared" promise and ends without an audience picker |
| `MatchModules` | the "Match me on" stack at the top of Discover: admin-authored modules and quizzes, done count, progress bar |
| `HobbiesWidget` | two swipeable views in one contained widget: chips (tap for a peek), or every hobby with its answer |
| `TravelMap` | two swipeable views: map with pins, or a scrollable list of places |
| `SharedPlacePhotos` | co-op: both people's photos from a place they've both been |
| `ThisOrThatGrid` | A/B picks, with **both** as a first-class answer |
| `CustomizeProfileScreen` | co-op, from Settings: presets, background photo, page/card/text/accent colors, type, corners, widgets, live preview |
| `ProfileSkin` | applies a member's saved look by overriding the theme tokens; wraps any profile |
| `ViewOriginalToggle` | a viewer's header button, beside Messages, switching a visited page to plain |
| `Toggle` | pill switch |
| `Sheet` / `Modal` | rounded bottom sheet |
| `CalendarCell` | day cell: dot or thumbnail |
| `StorageBar` | thin usage bar |
| `NotificationRow` | avatar + text + time |
| `CountdownChip` | "in 2 days" |
| `EventCountdown` | live days/hrs/min/sec ticker shown after you say you're going |
| `NetworkMap` | clean node/edge friend map (neoclassical) |
| `EmptyState` | icon + short line + action |
| `AnnouncementsCarousel` | Home's one attention slot: swipeable touch grass / quick check / co-op cards; absent entirely when empty |
| `CoopAnnouncementCard` | a note from the co-op inside the announcements carousel |
| `FreeSignalCard` | a friend's touch grass: what they're up to, who's in, "I'm in", opens for detail |
| `GrassSignalSheet` | the full signal — what, when, where, who's in, which circle they told |
| `StoryRepliesRow` | replies to your story under the tray: video replies as faces, text as words |
| `CountButton` | "3 going" with faces — a count that opens the people behind it |
| `EventPeopleSheet` | two tabs, going / invited, co-hosts badged, non-answers marked |
| `ShareEventSheet` | native-style share: event preview, friend invites, copy link, Messages, More, QR |
| `AddCoHostSheet` | pick co-hosts from the guest list |
| `EditEventSheet` | the host editing their own event, chip-in block included |
| `PollsArchiveScreen` | your poll archive: open then closed, each with its winner and answerers |

---

## Screens (build these — content from the linked doc)

| Screen | Doc |
|---|---|
| Welcome / onboarding flow | `ONBOARDING.md` |
| Auth (email · Google · Apple) | `ONBOARDING.md` |
| Home (+ notifications preview) | `HOME.md` |
| Notifications page | `HOME.md` / `NOTIFICATIONS.md` |
| Story viewer + Catch-Up | `STORIES.md` |
| Post / capture (themed) | `STORIES.md` |
| Friends + add-friend sheet | `FRIENDS.md` |
| Events: list (touch grass + who's free) / detail / host | `EVENTS.md` |
| Your polls archive | `HOME.md` |
| Discover: gate / main / settings | `DISCOVER.md` |
| Profile: About / Stories(calendar) / Inside jokes / Bucket list / Settings | `PROFILE.md` |
| Connection reveal (3 screens) | `DISCOVER.md` / `ARCHITECTURE.md` |
| Weekly activity collage | `HOME.md` / `ADMIN.md` |
| Messages / chat | *reserved — not yet designed* |

---

## Reminder

Clean and minimal beats complete. Short labels, real content, flat colorful UI on the eggshell canvas, floating nav, pixel headers, metallic primary buttons. Fewer words.
