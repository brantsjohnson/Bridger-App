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

- **Floating tab bar** — a **detached, rounded pill** (inset from the bottom edge with margin), Apple's newer dynamic/"liquid-glass" feel: translucent where possible, may subtly shrink or tuck away on scroll. **5 destinations:** Home · Friends · Messages · Events · Discover. Active = filled circle; inactive = muted icon. Not a full-width bottom bar flush to the edge.
- **Header:** pixel screen title on the left. **Top-right slot is your profile photo circle** — tap opens Profile (Profile is not in the floating pill). **No notification bell** — notifications live in the feed + a dedicated page (below).

---

## Component library (build these)

One line each; keep them dumb and reusable.

| Component | Spec |
|---|---|
| `PixelHeading` | pixel-font section title |
| `TypeformStep` | one-question screen: progress bar, purpose line, single/multi/image-choice, Continue (see `ONBOARDING.md`) |
| `MultiSelectTiles` | tappable icon/image tiles, multi-select with checks |
| `VisibilityReviewRow` | answer + per-row audience (All/Close/Friends) + set-all |
| `MeetLocationStep` | friends-of-friends promise + nearby/anywhere + city-only input |
| `ProfileCustomizeEditor` | co-op: background + vibe colors + core widgets locked in order with add-widget insert slots (see `PROFILE-CUSTOMIZATION.md`) |
| `ViewOriginalToggle` | persistent control to view a customized profile's default page |
| `ButtonPrimary` | metallic beveled CTA |
| `ButtonSecondary` | flat pill, hairline border |
| `Chip` / `TierChip` | rounded pill; selected = solid, else outline |
| `Card` / `ColorCard` | flat rounded container; color variants |
| `ListRow` | avatar + label + trailing (chevron/handle/toggle) |
| `Avatar` | circle; filtered photo or color |
| `SegmentedTabs` | Profile / Stories / Inside Jokes / Bucket List style |
| `FloatingTabBar` | the 5-destination floating pill |
| `StoryTile` | rectangular, pic-in-corner, image fills |
| `StoryProgressBars` | 1–3 segments |
| `UpdateComposer` | post-capture: photo/video + "what did you do today" caption, type or voice-to-text mic, audience, Post update |
| `DaySummaryCard` | **hero** day card: bold day title + big ~square photo + caption underneath (see `STORIES.md`) |
| `CatchUpEventCard` | compact event card with its **real cover image**; "Going" starts an on-card countdown |
| `CatchUpPollCard` | **compact** poll: question + option chips + tiny "closes Xd" |
| `CurrentlySplit` | small two-cell row: Listening \| Reading |
| `AnsweredRow` | very-bottom "You answered '{poll}'" — results hidden |
| `PolaroidCard` | white frame, photo, name, heart; slight rotation |
| `InsideJokeNote` | sticky note: quoted person's photo + quote; tap → posted-by + event/place + date |
| `InsideJokeWall` | sticky notes + "+" tile + null container; single All/About-you/By-you **filter** (not tabs) |
| `InsideJokeComposer` | quote note + tag people + tag event; "shares to tagged + event guests" |
| `BucketListTab` | own profile tab: items (solo or friend-tagged), public/private, check-off, "+" add + null container |
| `InterestBlob` | colorful rounded blob, icon + label + check |
| `HobbiesWidget` | two contained views: clean chips (tap = drop-down answer) + swipe page listing every hobby + answer, scroll inside (see `PROFILE.md`) |
| `InCommonAnswers` | a shared hobby with both people's follow-up answers side by side |
| `AudiencePicker` | Close/Friends/Everyone multi-select + per-person caret |
| `Toggle` | pill switch |
| `Sheet` / `Modal` | rounded bottom sheet |
| `CalendarCell` | day cell: dot or thumbnail; tap a posted day → opens story player |
| `StorageBar` | thin usage bar |
| `NotificationRow` | avatar + text + time |
| `CountdownChip` | "in 2 days" |
| `TouchGrassButton` | **big green** "TOUCH GRASS" button (Home + Events; see `TOUCHGRASS-AND-QUIZ.md`) |
| `AnnouncementsCarousel` | top-of-Home swipeable strip: touch-grass · quick check · co-op · birthdays; page dots; hidden when empty (see `HOME.md`) |
| `TouchGrassSignalList` | one featured signal + list below; who/when/why, tappable → "I'm in" / ✕ |
| `ResponseStrip` | under stories: video/text responses to your update, tap to reply |
| `EventShareSheet` | native iOS/Android share (friends or link) |
| `ChipInEditor` | amount + method(s) (Venmo/Cash App/person) + handle |
| `CoHostRow` | co-host chip + "add a co-host" |
| `QuizResultDashboard` | your result + share + "who got who" grouping (see `TOUCHGRASS-AND-QUIZ.md`) |
| `ConversationRow` | avatar + name + snippet + time + unread dot |
| `MessageBubble` | them (left) / you (right); text only |
| `DailyLimitCounter` | "{n} of 5 left today" + composer lock at cap (see `MESSAGES.md`) |
| `ContactCard` | set-up-once card (name + phone/IG/email); one-tap share |
| `FriendOptionsSheet` | remove friend (soft) vs block (hard, with the "others stay intact" note) + report (see `FRIENDS.md`) |
| `RecapPlayer` | audio player; speaker photo + name pop-up, current question, progress dots (see `RECAP-PODCAST.md`) |
| `RecapRecorder` | record audio answers to 5 questions, pick audience, post |
| `NetworkMap` | clean node/edge friend map (neoclassical) |
| `TravelMap` | places-traveled two-view: map with pins + swipe to scrollable list; co-op photos per place (see `PROFILE.md`) |
| `SharedPlacePhotos` | in-common: a shared place with both people's photos side by side (co-op) |
| `ThisOrThatColumns` | two columns in rows; chosen side highlighted, other dimmed; tappable; A/B/**both** |
| `RevealOrbs` | two profile photos float in, dissolve into overlapping yellow + green circles (overlap mixes to orange); reveal screen 1 (see `complete/REVEAL.md`) |
| `HowYouMetStep` | reveal screen 0: just-met/already-know (check + filled color), optional tier buckets, place or note |
| `SuggestionCard` | leads with shared thread (headline) + name (subtitle) + mutual as connection ("you both know {friend}") + shared chips + interest color; marked as Bridger's pick; spotlight variant for top match (see `DISCOVER.md`) |
| `RevealProgressBars` | 3 story-style segments for the connection reveal |
| `EmptyState` | icon + short line + action |

---

## Screens (build these — content from the linked doc)

| Screen | Doc |
|---|---|
| Welcome / onboarding flow | `ONBOARDING.md` |
| Auth (email · Google · Apple) | `ONBOARDING.md` |
| Home (+ notifications preview) | `HOME.md` |
| Notifications page | `HOME.md` |
| Story viewer + Catch-Up | `STORIES.md` |
| Post / capture (themed) | `STORIES.md` |
| Friends + add-friend sheet | `FRIENDS.md` |
| Events: list / detail / host | `EVENTS.md` |
| Discover: gate / main / settings | `DISCOVER.md` |
| Profile: Profile / Stories(calendar) / Inside Jokes / Bucket List | `PROFILE.md` |
| Connection reveal (3 screens) | `complete/REVEAL.md` |
| Weekly activity collage | `HOME.md` / `ADMIN.md` |
| Weekly recap: record + player | `RECAP-PODCAST.md` |
| Messages: list + conversation | `MESSAGES.md` |

---

## Reminder

Clean and minimal beats complete. Short labels, real content, flat colorful UI on the eggshell canvas, floating nav, pixel headers, metallic primary buttons. Fewer words.
