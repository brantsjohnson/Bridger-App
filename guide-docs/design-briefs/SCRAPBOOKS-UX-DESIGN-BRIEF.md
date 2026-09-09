# Bridger Scrapbooks: UX design + build brief (grounded in the current app)

Status: **decided 2026-09-08, Phase 1 built on branch `feat/scrapbooks`**. Written after inspecting the live Updates (stories) code, schema, docs, and design system. Founder decisions: camera roll allowed for pages (replies and stickers stay capture-only); user-facing name Scrapbook; a day holds 1 to 4 pages that can be merged or split; build Phase 1 on a branch with the plan in `SCRAPBOOKS-PHASE-PLAN.md`. The feature doc is `guide-docs/complete/SCRAPBOOKS.md`. This reconciles the outside "Bridger Scrapbooks" technical brief with how Bridger is actually built. Where the outside brief and Bridger's own rules disagree, the disagreement is called out in §11 instead of silently picking a side.

Read alongside: `guide-docs/complete/STORIES.md` (current spec, to be superseded for posting), `guide-docs/DESIGN.md`, `guide-docs/MAGIC-PATTERNS.md`, `guide-docs/ANALYTICS-TAXONOMY.md`, `guide-docs/DATA.md`.

---

## 0. The one-sentence design

> Take a photo, Bridger lays it on a page, you post. Everything else is one tap deeper and never in the way.

The main flow has almost no words. Depth is reached through icons with menus, a layout carousel, tap-to-edit slots on the page, and one `i` popover. Nothing asks the user to read before they can post.

---

## 1. What exists today (so we evolve it, not rewrite it)

| Piece | Today | File |
|---|---|---|
| Capture + compose | One component, two phases (camera, then preview) on a fixed near-black canvas `#0E0E0E` | `apps/mobile/components/story/CaptureCompose.tsx` |
| Route | `/story/capture` (params `eventId`, `from`) | `apps/mobile/app/story/capture.tsx` |
| Camera | `expo-camera`. Tap = photo, hold 1s = video (max 20s). Flip only, no flash. Permission asked at the shutter. | same |
| Camera roll | Not allowed. Copy says "In-app capture only. No camera roll." | same + `STORIES.md` |
| Extra chrome on capture | 3 dashed themed-prompt squares + BeReal reminders card (takes ~40% of the screen under the camera) | same |
| Compose phase | Photo preview (cover), caption `TextInput` under it, `AudiencePicker` (Close / Friends / Everyone), optional event tag chip, metallic Post | same |
| Audience | `AudienceLevel = close \| friend \| everyone`; `everyone` maps to DB tier `acquaintance`. Groups prop exists but composer passes `[]` (co-op groups are not in the DB yet). | `packages/ui/src/primitives/AudiencePicker.tsx`, `apps/mobile/data/stories.ts` |
| Daily cap | `DAILY_CAP = 3` (server) and `DAILY_POST_CAP = 3` (client), counted as `stories` rows per UTC day | `apps/api/src/stories/stories.service.ts`, `apps/mobile/data/stories.ts` |
| Storage | `uploadMedia()` puts bytes in Supabase bucket `media` at `{userId}/{suffix}.jpg\|mp4\|m4a`, inserts a `media` row | `apps/mobile/lib/media-upload.ts` |
| Schema | `stories(id, author_id, type, media_id, update_text, transcript, theme_slug, visible_to_tier, created_at, expires_at, live_until, event_id)`. One row per post. RLS via `can_view(author_id, visible_to_tier)`. | `infra/supabase/migrations/0005`, `0012`, `0024`, `0045` |
| Viewer | Full-bleed media (`resizeMode="cover"`), one progress segment per post, caption block, reaction rail, Catch-Up peek | `apps/mobile/components/story/StoryViewer.tsx` |
| Drafts | None. Leaving abandons the post. | n/a |
| Crop / edit | None for stories. | n/a |
| Analytics | Surface `post_composer`, flow `post_story`, product `story_posted` | `packages/shared/src/analytics/ids.ts`, taxonomy §post_composer |

Useful building blocks already in the repo: `Sheet`, `InfoPopover`, `SegmentedProgress`, `Chip`, `Toggle`, `ButtonPrimary` (metallic), `AnalyticsRegion`, `SurfaceHost`, `whimsy.Reveal`, audio upload path (`kind: 'audio'`), `lib/geocode.ts` (coarse places), `CircleRecorder` (mic + camera permission pattern).

Not in the repo: any canvas/element renderer, layout templates, page flattening, transcription client for a caption, people tagging on posts, scrapbook decorative assets.

---

## 2. Vocabulary (user-facing vs code)

Per the naming rule (users never see internal names; never rename DB tables to chase copy):

| User sees | Code says |
|---|---|
| **Scrapbook** (the feature), **Today's page** (the daily page), **Post** | `stories` module, `scrapbook_pages` / `scrapbook_elements` tables, `story_posted` event |
| **Layouts** | `layout templates`, `LayoutFamily` |
| **Add** (`+`) | add-media sheet |
| **Customize** | customize tray (Phase 3+) |
| **Who sees this** | `visible_to_tier` |

The Home tile keeps the label "Your story" until the rename decision in §11 is made. Everything below writes "Scrapbook" assuming the rename is approved.

---

## 3. Design principles for this feature

1. **Two screens, ever.** Capture. Compose. No third screen for layout, caption, audience, or confirmation.
2. **Post is always visible and always enabled** once one photo exists.
3. **No sentences on the main path.** Words allowed on screen 1: the count (`1/4`). Words allowed on screen 2: `Post`, the audience chip label (`Friends`), and the caption placeholder inside the slot. Everything else is an icon with a menu or a popover.
4. **Complexity opens downward.** Sheets and trays slide up from the bottom bar. Nothing navigates away. The page stays visible behind every sheet so the user never loses context.
5. **The page is the hero.** It is a real 8.5 x 11 portrait page sitting on the dark canvas, with visible margin around it. It should feel like a physical page in a viewer, not a full-bleed Story.
6. **Bridger does the design work.** A layout is already applied when the compose screen appears. Tapping another layout thumbnail swaps instantly. No Apply.
7. **Guidance is hidden, not missing.** A single `i` (`InfoPopover`) on screen 2 explains: "Tap a layout to change it. Tap the page to add words. + adds more from today." First-run only: a one-time soft highlight on the layout row (respects Reduce Motion, dismisses on any tap).
8. **Live flow stays fast.** Dark canvas, same shutter, same tap/hold gesture, same permission timing. Nothing added before the shutter.

---

## 4. Screen 1: Capture

```text
┌──────────────────────────────────────┐
│ (v)                    [1/4]  ⚡  ⟲  │   close · count pill · flash · flip
│                                      │
│                                      │
│                                      │
│           LIVE CAMERA                │   full height, rounded 24
│                                      │
│                                      │
│                                      │
│  ┌────┐                              │
│  │page│  ← "Today's page" thumb      │   only when a page already exists today
│  └────┘                              │
│                                      │
│   [roll]        ( ● )         [✦]    │   camera roll · shutter · prompts tray
│                                      │
└──────────────────────────────────────┘
```

**What changed from today**

- The camera fills the screen. The themed-prompt squares and the BeReal reminders card move into the `✦` **prompts tray** (bottom right). Tap `✦` → a small bottom tray with the three dashed prompt squares and, as its footer row, the existing BeReal reminders `Toggle`. Same prefs, same analytics ids, one tap away instead of always on screen.
- **Count pill** `1/4` top center: how many photos/videos are on today's page out of the shared limit. It is a dead-click region (tagged `interactive:false`). It never reads "3 left"; the fraction is enough.
- **Flash** `⚡` cycles off / on / auto (icon changes, plus `accessibilityValue`). New control; expo-camera `flash` prop.
- **Camera roll** thumbnail bottom left: shows the most recent roll photo, small (44pt), muted border. Tap → OS picker (`expo-image-picker`, multiple select up to remaining count, photos + videos ≤ 20s). This is visually secondary to the shutter on purpose. Gated on the decision in §11.1.
- **Today's page thumb**: when a Daily Scrapbook already exists for today, a small 8.5 x 11 thumbnail of the current page floats bottom left above the roll thumb. Tap → opens Compose directly on the existing page (no capture needed). Read as "I am adding to this."
- Shutter unchanged: tap photo, hold video, co-op lock on video stays.
- At the cap (`4/4`): the shutter dims, count pill turns amber, tap shows the existing alert copy updated to "4 photos or videos a day".

**Copy budget on this screen**: `1/4`. That is it. (Plus the OS permission prompt and the two alerts that already exist.)

**Accessibility**: every control has a role + label (`Flash: auto`, `Add from camera roll`, `Open today's page`, `Prompts and reminders`). Count pill is `accessibilityLabel="1 of 4 photos on today's page"`. Shutter keeps "Tap for a photo, hold for video".

---

## 5. Screen 2: Compose (preview, layouts, edit, post, all in one)

```text
┌──────────────────────────────────────┐
│ (<)             [2/4]     [Friends ▾]│   back · count · audience chip
│                                      │
│        ┌────────────────────┐        │
│        │                    │        │
│        │    THE PAGE        │        │   8.5 x 11, ~78% of screen width
│        │    (8.5 x 11)      │        │   sits on the dark canvas
│        │                    │        │   caption slot reads "Add something…"
│        │  · Add something…  │        │
│        └────────────────────┘        │
│                                      │
│   [▣] [▤] [▥] [▦] [▧]   ‹ swipe ›    │   layout carousel (thumbs, no labels)
│                                      │
│   (+)         (✎)          [ POST ]  │   add · customize · metallic Post
│                                (i)   │   info popover, tiny, bottom right
└──────────────────────────────────────┘
```

**The page**

- Rendered by one new `ScrapbookPage` component at `SCRAPBOOK_ASPECT_RATIO = 8.5 / 11`. Positions are normalized (0..1). This same component renders in Compose, in the viewer, and later in print.
- Background default: eggshell `#F4F1E7` (the app canvas color) so the page reads as paper against the dark chrome. Later aesthetics can change it.
- Day and place stamps (small, top corner) are elements too, generated by the template, so the user can move or delete them later.
- Tapping a **photo slot** (Phase 1): shows a small chip row above the page: `Replace` `Remove`. Tapping elsewhere clears it. (Crop, frame, layering arrive in Phase 3.)
- Tapping the **caption slot** opens the caption sheet (§6). Selecting a caption layout does not open the keyboard by itself.
- Tapping a **date/place stamp** (Phase 2): toggles it or opens a tiny picker.

**Layout carousel**

- Horizontal row of page-shaped thumbnails (each ~44 x 57pt), no text. Current layout has the tier-blue outline; others hairline. Swipe to see more; tap to apply instantly. `Reveal` animates the reflow (transform + opacity, 220ms, still under Reduce Motion).
- The set changes with media count (1, 2, 3, 4). When a photo is added, Bridger stays in the same **layout family** (simple / caption / editorial / scrapbook / freeform) so intent survives. Family is remembered per page.
- Long-press a thumbnail: a `Chip` tooltip with its name (`Photo + caption`) for screen readers and the curious. Each thumb has `accessibilityLabel="Layout: photo with caption, 2 of 5"`.
- Analytics record `method: swipe|tap`, `page_index`, `carousel_depth`.

**Bottom bar**

- `+` **Add**: opens the add sheet: `Camera` `Camera roll` (and later `Voice`, `People`, `Place`, `Event photo`). With 1 remaining, both media options still show; at `4/4`, media options are dimmed with the count shown, not hidden.
- `✎` **Customize**: Phase 1 shows a compact tray with only `Style` (page background swatches: eggshell, white, kraft, notebook). Phase 3 grows it to `Add · Text · Decorate · Background · Layout` as icon tabs, still in a tray, still with the page visible above it.
- `POST`: `ButtonPrimary` (metallic), always enabled when ≥ 1 media. If the page already exists today the label stays `Post` (the user does not need to know it is an update). Product event differs (`story_posted` on first post of the day, `scrapbook_page_updated` afterward).
- `i`: `InfoPopover` with three short lines. Never a modal.

**Top row**

- `<` back returns to the camera without losing the page (draft persists, §8).
- Count pill as on screen 1.
- **Audience chip** `Friends ▾`: tap → `Sheet` containing the existing `AudiencePicker` plus a new `Only me` row at the top and, for co-op members with groups, the existing `Or a group` block. Audience is per page (per day). Default = last used, else Friends. Sheet is its own surface `audience_sheet`.

**Copy budget on this screen**: `Post`, the audience label (`Friends`), and the placeholder inside the caption slot (`Add something…`). The `i` popover holds the only sentences.

---

## 6. Caption sheet (Type or Record)

Opens from tapping the caption slot. Half-height `Sheet`, the page stays visible above it.

```text
┌──────────────────────────────────────┐
│  ───                                 │
│   [ Type ]   [ Record ]              │   SegmentedTabs, icons + one word
│  ┌──────────────────────────────┐    │
│  │ Add something about this     │    │   Type: keyboard up, multiline
│  └──────────────────────────────┘    │
│                                      │
│   Record:   ●  0:07  ▂▃▅▂▆▃▂   ■     │   red dot · timer · waveform · stop (20s cap)
│                                      │
│                      [ Done ]        │
└──────────────────────────────────────┘
```

- **Type**: multiline `TextInput`, Dynamic Type friendly, no character counter (no vanity numbers; the slot simply truncates on the page with a soft fade and the full text lives in `update_text`).
- **Record** (Phase 2): mic permission asked here, in context. Up to 20s. On stop: save audio (`media.kind = 'audio'`), transcribe server-side (`stories` module already owns transcription for video), drop transcript into the text field where the user can edit it. Both audio and text are kept (`VoiceData.displayMode`). A tiny `▶ 0:16` voice chip can be placed on the page as its own element.
- `Done` writes to `update_text` (this is what the AI day summary reads; unchanged privacy line: words only, never photos).
- Escape hatch: swipe down dismisses without saving (`surface_dismissed`, `dwell_ms`).

---

## 7. Viewer changes (kept the same on purpose)

Friends still tap a Home tile and tap through. What changes is only what is inside the frame:

- The media area shows the **flattened page preview** (an 8.5 x 11 JPEG generated on post) letterboxed on the dark viewer canvas, `contentFit="contain"`. Progress bars, header, caption block, and reaction rail all sit outside the page instead of over the photo, which fixes the readability problems `STORIES.md` had to work around with scrims.
- If the page has a video element, the viewer swaps in the live `ScrapbookPage` renderer so the video slot plays in place. The flattened image is the poster frame.
- **One progress segment per page** in the live window (today's page, plus any event page they posted to). Up to now segments were per post (≤3).
- **Re-lighting**: when a page's `revision` increases after a friend already watched it, the tile ring lights again and the segment shows a small dot. Personal watched-state only, never a count.
- Caption block shows `update_text` exactly as today.
- The Catch-Up week hero uses the same flattened page image as its "big ~square photo" (it becomes a big portrait page; the hero stays the hero).

---

## 8. Daily page lifecycle (how "it updates through the day" works)

```text
07:40  capture → template 1A applied → Post
       ┌ stories row created (type photo, media_id = flattened preview)
       └ scrapbook_pages row (revision 1) + 1 photo element + date stamp element

12:15  open camera → count pill 1/4 → capture → lands on the SAME page
       Bridger re-lays out within the same family (caption family stays caption)
       Post → revision 2, preview regenerated, friends' rings re-light

18:30  + Add → Camera roll → 2 photos → revision 3
```

- **One `stories` row per page, 1 to 4 pages a day** (decided). Each page keeps its own row so the Home tray, archive calendar, RLS, reactions, Catch-Up, and notifications work untouched. Pages can be merged (move a photo onto another page) or split (move a photo to a new page). New columns: `page_id`, `revision`. The flattened preview reuses `media_id`.
- Elements live in `scrapbook_elements` and reference `media` rows. Photos are never edited destructively; crops are stored as `CropConfig` in element `data`.
- **Draft persistence**: a local draft (AsyncStorage, key per date) holds media URIs, layout id, caption, and audience so a back-swipe or app switch never loses the page. Upload starts as soon as a photo is captured (local preview on canvas immediately, temp id swapped when the `media` row exists), so Post is fast.
- **Undo**: the compose screen keeps an in-memory stack of page states; `✎` tray has an Undo chip when the stack is non-empty. Auto-relayout never touches elements flagged `user_modified`.
- The daily limit counts **photo + video elements on today's page** (decor, text, voice, stamps, maps do not count). Constant lives once in `packages/shared`:

```ts
export const DAILY_SCRAPBOOK_MEDIA_LIMIT = 4;
export const SCRAPBOOK_ASPECT_RATIO = 8.5 / 11;
```

---

## 9. Layout templates for Phase 1 (deterministic, no AI)

Each template is data: `{ id, family, mediaCount, slots: NormalizedRect[], captionSlot?: NormalizedRect, stamps: [...] }`. Rendering is pure.

| Count | Templates (family) |
|---|---|
| 1 | `1a` full page (simple) · `1b` photo + caption strip (caption) · `1c` photo upper 60% + open white space (editorial) · `1d` Polaroid center (scrapbook) · `1e` free photo on paper (freeform) |
| 2 | `2a` stacked (simple) · `2b` hero + small + caption (caption) · `2c` offset editorial (editorial) · `2d` two Polaroids, tilted 3° and -2° (scrapbook) · `2e` freeform |
| 3 | `3a` 1 hero + 2 under (simple) · `3b` same + caption (caption) · `3c` column of 3 with margin notes (editorial) · `3d` scattered Polaroids (scrapbook) · `3e` freeform |
| 4 | `4a` 2 x 2 (simple) · `4b` 2 x 2 + caption strip (caption) · `4c` 1 hero + 3 small + wide caption (editorial) · `4d` scrapbook scatter with tape (scrapbook) · `4e` freeform |

Rule for family persistence: on media count change, pick the template with the same family letter for the new count. The user's manual pick wins over the default.

Default template on first capture: `1b` (photo + caption) if the person has typed a caption before, else `1a`. Kept simple and deterministic; aesthetic-aware selection is Phase 5.

---

## 10. Component map (Magic Patterns first)

**Reuse as-is**: `ButtonPrimary`, `Sheet`, `InfoPopover`, `SegmentedTabs`, `Chip`, `Toggle`, `SegmentedProgress`, `StoryTile`, `AnalyticsRegion`, `SurfaceHost`, `Reveal`.

**Extend**: `AudiencePicker` (add `Only me` level that maps to DB tier `none`; `can_view` already returns false for everyone but the owner when tier is `none`, so no migration is needed for privacy).

**New, to be designed in Magic Patterns before build** (flag, do not improvise):

| Component | Job |
|---|---|
| `ScrapbookPage` | The 8.5 x 11 renderer: background + elements in normalized coords. Used in compose, viewer, thumbnails, print. |
| `LayoutCarousel` + `LayoutThumb` | Page-shaped thumbnails, selected outline, swipe/tap |
| `ComposerBar` | `+` · `✎` · `POST` row with the `i` popover |
| `CountPill` | `1/4` dead-click pill (amber at cap) |
| `CaptureRail` | flash · flip · roll thumb · today's-page thumb around the existing shutter |
| `PromptsTray` | the three dashed prompt squares + reminders toggle, as a tray |
| `CaptionSheet` | Type / Record with timer + waveform |
| `AudienceSheet` | wraps `AudiencePicker` + Only me + groups |
| `CustomizeTray` | Phase 1: background swatches + Undo. Phase 3: icon tabs |
| `VoiceChip` | `▶ 0:16` element on the page (Phase 2) |

Visual rules that apply (from `DESIGN.md`): flat, no shadows; the page gets one hairline edge, not a drop shadow; metallic only on Post; pixel font only for the screen title if one is shown (Compose has none, on purpose); tier colors for the audience chip (Close green, Friends blue, Acquaintances orange, Only me yellow "you"); motion transform/opacity only and off under Reduce Motion.

---

## 11. Decisions (taken 2026-09-08; kept for the record)

Outcome: 1 approved (camera roll for pages only). 2 approved (Scrapbook). 3 approved. 4 changed: a day holds 1 to 4 pages, mergeable and splittable, each with its own row and segment. 5 kept (audience per page). 6 noted. 7 kept (autoplay with sound).

1. **Camera roll import.** `guide-rules.mdc` §5 says "Capture-only media except the profile photo (the one upload exception)", and `STORIES.md` acceptance criteria say "no camera-roll upload path exists." The Scrapbooks brief removes this. If approved: add a photo-library purpose string requested in context (only when the roll thumb or `+ Camera roll` is tapped), update `apps/mobile/PrivacyInfo.xcprivacy`, `guide-docs/docs/PRIVACY.md`, `STORIES.md`, and store `source: 'bridger_camera' | 'camera_roll' | 'event' | 'shared'` on every media element. Recommendation: approve, keep the roll thumb visually secondary, and keep circle replies and stickers capture-only.
2. **Rename "Updates / Your story" to "Scrapbook".** The naming table says users see "Updates". Recommendation: user-facing "Scrapbook" and "Today's page"; code stays `stories`. Needs the Home tile label, profile tab label, empty states, and notification copy touched. Should the profile tab read "Scrapbook" or stay "Stories"?
3. **Daily limit 3 to 4**, counted as media elements on the page rather than posts. Recommendation: approve; it is a one-constant change once centralized.
4. **One publish record per day.** Today each capture is its own `stories` row and the viewer shows a segment per post. The proposal collapses today's posts into one page with one segment, re-lit on updates. Reactions and replies attach to the page (the day), not to a single photo. Confirm this matches how you want friends to react.
5. **Audience is per page, not per photo.** A photo added at 18:30 inherits the page's audience. Changing the chip changes the whole day. Per-element audience is possible later but adds a lot of UI. Confirm.
6. **Co-op groups** do not exist in the DB. The audience sheet will show `Or a group` only once a groups table ships (`AudiencePicker` already hides it when empty). Scrapbooks does not block on it.
7. **Video autoplay in the viewer.** With video inside a page slot, should it autoplay with sound (today's behavior for full-bleed video) or start muted with a tap-to-unmute? Recommendation: autoplay with sound as today, since the user opened the story on purpose.

---

## 12. Analytics additions (register in `ANALYTICS-TAXONOMY.md` in the same PR as the code)

Surface `post_composer` (kept) gains:

| section | elements |
|---|---|
| `capture` | `photo`, `hold_video`, `switch_camera`, **`flash`** (`method: off\|on\|auto`), **`roll`**, **`today_page_thumb`**, **`prompts_tray_open`**, **`count_pill` (dead)** |
| `page` | **`canvas` (dead)**, **`photo_slot`**, **`caption_slot`**, **`stamp`**, **`replace`**, **`remove`** |
| `layouts` | **`thumb`** (`method: swipe\|tap`, `page_index`, `carousel_depth`, `layout_id`, `layout_family`) |
| `actions` | `post`, `add_another`, `discard`, **`add`**, **`customize`**, **`info`**, **`undo`**, **`back`** |
| `audience` | `close`, `friends`, `everyone`, `group`, **`only_me`**, **`chip`** |

New surfaces (each with `parent_screen: post_composer`, open/dismiss, `dwell_ms`): `caption_sheet`, `audience_sheet`, `add_media_sheet`, `customize_tray`, `prompts_tray`, `layout_tooltip`.

Flow `post_story` steps become: `open_composer → capture (method photo|video|roll) → layout_picked → caption (method text|voice) → audience → post`. `flow_completed` fires only after the server confirms.

Product events:

- `story_posted` (kept) adds properties: `media_count`, `layout_id`, `layout_family`, `has_words`, `words_method: text|voice|both|none`, `source_mix: live|roll|mixed`, `audience: only_me|close|friend|acquaintance|group`.
- **`scrapbook_page_updated`**: a later add on the same day. `revision`, `media_count`, `layout_family`, `added_via: camera|roll`.
- **`layout_changed`**: `from_layout_id`, `to_layout_id`, `method`.
- **`media_imported`**: fires on successful import (not on opening the picker). `count`, `kinds`.
- **`caption_recorded`** (Phase 2): `duration_ms`, `transcribed: boolean`. Never the text.

No content, no captions, no filenames, no place names in any property.

---

## 13. Data model deltas (Phase 1 only; reversible migrations)

```sql
-- scrapbook_pages: one editable page per stories row (daily) or per event page later
create table public.scrapbook_pages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  aspect_ratio numeric not null default 0.772727,
  background jsonb not null default '{"kind":"solid","color":"#F4F1E7"}',
  layout_id text,
  layout_family text,
  revision int not null default 1,
  preview_media_id uuid references public.media(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- scrapbook_elements: everything visible on a page, normalized coords
create table public.scrapbook_elements (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.scrapbook_pages(id) on delete cascade,
  type text not null,            -- photo | video | text | voice | date | place | ... (enum later)
  x numeric not null, y numeric not null, width numeric not null, height numeric not null,
  rotation numeric not null default 0,
  z_index int not null default 0,
  locked boolean not null default false,
  user_modified boolean not null default false,
  source text,                   -- bridger_camera | camera_roll | event | shared
  media_id uuid references public.media(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.stories add column page_id uuid references public.scrapbook_pages(id) on delete set null;
alter table public.stories add column revision int not null default 1;
```

RLS: pages and elements are readable when `can_view(author_id, (select visible_to_tier from stories where id = story_id))`; writes author-only. Deleting the story cascades pages and elements; deleting media nulls the pointer (existing convention). Legacy stories with no `page_id` render through `legacyStoryToScrapbookPage()` at runtime (one full-bleed photo element), so no data migration is required to ship.

Retention: pages follow the parent story's two clocks (`live_until`, `expires_at`). Co-op keeps forever as today.

PRIVACY.md / TERMS.md bullets to add in the same change: camera roll access and why; audio captions stored and transcribed server-side; page data (positions, layout) stored to re-render; nothing new sent to AI beyond words.

---

## 14. Phased plan mapped to this codebase

**Phase 1: Foundation** (ship the new posting flow)
- `packages/shared`: `DAILY_SCRAPBOOK_MEDIA_LIMIT`, `SCRAPBOOK_ASPECT_RATIO`, scrapbook types, layout template data, `legacyStoryToScrapbookPage`.
- `packages/ui`: `ScrapbookPage`, `LayoutCarousel`, `CountPill`, `ComposerBar`, `AudiencePicker` + Only me.
- `apps/mobile`: `CaptureCompose` becomes `CaptureCompose` (screen 1) + `PageCompose` (screen 2) sharing a `useScrapbookDraft` hook (AsyncStorage). Roll import via `expo-image-picker` (behind decision 11.1). Flash. Prompts tray. Caption sheet (Type only).
- `apps/api`: `POST /stories` accepts `{ page, elements, previewMediaId }`; `PATCH /stories/:id/page` for same-day adds; quota counts media elements. Flatten preview client-side first (`react-native-view-shot`) with a server fallback later.
- Viewer: render flattened preview `contain`; segment per page; re-light on revision.
- Docs: new `guide-docs/complete/SCRAPBOOKS.md` supersedes the posting half of `STORIES.md`; taxonomy rows; PRIVACY/TERMS; `PrivacyInfo.xcprivacy` (photo library + reasons).

**Phase 2: Memory context**: Record caption (audio + transcript), date and place stamps as elements, people chip (`userIds`, avatars or names), simple map element from `lib/geocode.ts` coarse data, event photo pull-in.

**Phase 3: Real scrapbooking**: drag, resize, rotate, crop params, z-order, backgrounds, Polaroid frames, tape, stickers, paper, clippings. Customize tray grows to icon tabs. Undo/redo.

**Phase 4: Personalization**: paste, cutouts, My Stuff, saved text styles, custom fonts, My Style aesthetic profile, per-page style override (`Style: My Style` chip inside Customize).

**Phase 5: Intelligence**: auto-compose engine (structured output only, never flattened), aesthetic-aware template pick, hero photo ranking, duplicate and blur detection, contextual map and people suggestions. All output is the same `scrapbook_elements` the editor uses.

**Phase 6: Events + books**: event pages on the same renderer, shared media pool, personal event versions, multi-page, month/year/friendship collections, print export at print resolution.

---

## 15. Acceptance tests for Phase 1

- [ ] Open camera, tap shutter, tap Post: three taps, zero typing, zero choices. Post succeeds and the page shows on the Home tile within the live window.
- [ ] Screen 1 shows only the count as text; prompts and reminders are behind `✦`; flash and roll are icons.
- [ ] Screen 2 shows the page at 8.5 x 11 with margin, a layout carousel, `+`, `✎`, `Post`, audience chip, count, `i`. Tapping a layout thumbnail changes the page instantly with no confirm.
- [ ] Adding a second photo (camera or roll) keeps the layout family and the caption.
- [ ] A second capture later the same day lands on the same page; the count pill reads `2/4`; Post bumps `revision`; friends' rings re-light.
- [ ] `4/4` dims the shutter and both add options; nothing is hidden.
- [ ] Audience sheet offers Only me · Close · Friends · Acquaintances (and groups when they exist). Only me posts are invisible to everyone else (RLS verified with a second account).
- [ ] Leaving mid-compose and returning restores the page from the local draft.
- [ ] Viewer renders the flattened page `contain` on the dark canvas; the caption block and reaction rail do not cover the page. Legacy posts still render.
- [ ] Every new control has role, label, 44pt target; Reduce Motion disables the reflow animation and the first-run highlight; the caption field respects Dynamic Type.
- [ ] Every new element, sheet, flow step, and product event in §12 exists in `ANALYTICS-TAXONOMY.md` and `packages/shared/src/analytics/ids.ts`.
- [ ] PRIVACY.md, TERMS.md, `PrivacyInfo.xcprivacy`, `NOTIFICATIONS.md` (re-light does not create a new notification kind) updated in the same change.
