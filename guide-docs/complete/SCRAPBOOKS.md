# Bridger: Collages (posting an Update as a page)

Build doc for **posting**. Users see **Collage** / **Your collage** / **Today's page**; code keeps the `stories` module and `scrapbook_pages` / `scrapbook_elements` tables (naming rule §6; never rename tables to chase UI copy). This doc supersedes the "Posting rules" half of `STORIES.md`. The viewer, Catch-Up, reactions, replies, lifecycle, and notifications stay as written in `STORIES.md`.

Design rationale, wireframes, and the founder decisions live in `guide-docs/design-briefs/SCRAPBOOKS-UX-DESIGN-BRIEF.md`. The phase-by-phase build plan lives in `guide-docs/design-briefs/SCRAPBOOKS-PHASE-PLAN.md`. (Filenames keep "SCRAPBOOKS" for history; the product name is Collage.)

**Rename log:** Updates → Scrapbook (2026-09-08) → **Collage** (2026-09-09).

---

## The one-sentence design

> Take a photo. It is already on today's page. Done posts it. Collage tools stay one tap deeper.

**Camera is the front door.** After the shutter you see Just shot (Retake, save to camera roll, On today's page, Done, Make it a collage). Done posts with the last audience you used. Make it a collage (or the today's-page thumb) opens the editor: one canvas, a `+` hub, drag to move, bin to delete. Editor Next still opens Who sees this.

Pages stay **8.5 x 11 for print** and fill the available screen of that shape (letterboxed, same as before).

---

## What a Collage is (data)

- A **page** is a portrait **8.5 x 11** sheet (`SCRAPBOOK_ASPECT_RATIO = 8.5 / 11`). Everything on it is an **element** placed by fractions of the page (0..1): `photo`, `video`, `text` (caption or free words), `date`, `voice` (audio + optional transcript), `person` (friend ids only), `cutout`. Stickers / maps stay reserved.
- One **post = one `stories` row = one page** (`stories.page_id` → `scrapbook_pages`, elements in `scrapbook_elements`). Old rows with no page render as a one-photo page at read time (`legacyStoryToScrapbookPage`). No data migration needed.
- A **day** holds **1 to 4 pages**. A person can post four separate one-photo pages, one page with four photos, or anything between, and can **merge** or **split** pages during the day.
- **Daily limit: `DAILY_SCRAPBOOK_MEDIA_LIMIT = 4`** photos + videos across all of today's pages (was 3 posts). Captions, stamps, and later decor do not count. Defined once in `packages/shared/src/model/scrapbook.ts`; enforced by the API (`countToday` sums media elements; legacy rows count 1).
- **Revision**: `stories.revision` and `scrapbook_pages.revision` go up on every change after posting. The Home feed tile carries the sum of live revisions, so a friend who already watched sees the ring light again when the author adds to a page. Personal watched-state only, never a count.
- **Audience** is per page: Only me (`tier none`, owner only via `can_view`), Close, Friends, Everyone (acquaintance), or a co-op group once groups exist. Default = last choice used, else Friends.
- **Media source** is kept per element: `bridger_camera | camera_roll | event | shared`.
- **Video** on a page is a co-op perk to post (watching is free). Max 20 s, live or imported.
- **Photos are never edited destructively.** Crops, frames, filters, and shape clips live in `element.data`. Subject lift uses the phone's own tools (Vision on iOS) when the native module is linked; otherwise a clean shape (circle, heart, flower, scallop). No hand-drawn lasso.
- **Voice notes** are recorded in-app, uploaded as `media.kind = audio`, and can be transcribed server-side (`POST /stories/transcribe`). Words may join the day summary. Never logged to analytics.
- **Friend tags** store opaque person ids. Names rejoin on the phone. After a confirmed post, tagged friends get `collage_tag` (prefs-gated). Analytics only records `tag_count`.

Layout templates are data (`packages/shared/src/scrapbook/layouts.ts`): 5 families (`simple`, `caption`, `editorial`, `scrapbook`, `freeform`) x 4 photo counts. Re-layout stays inside the family. Elements flagged `userModified` are never moved by auto-layout. (Layout family id `scrapbook` is internal template naming, not the product name.)

---

## Screen 1: Capture

- Camera fills the screen. Fixed near-black canvas.
- Top row: close (chevron) · **count pill "2 photos"** (dead-click, amber when full; spoken label still says "2 of 4") · flash (off / on / auto) · flip.
- Inside the camera: **zoom chips** (.5 / 1 / 2 / 4) for factors this phone actually supports (iOS lenses when available; otherwise digital 1 and 2).
- Bottom rail: **camera roll** (small, secondary) · **shutter** (tap photo, hold video). No themed "OOTD / Hot take" suggestions.
- Inside the camera, bottom-left: a tiny thumbnail of the **unposted draft** (amber dot) or **today's latest page**. Tap = open it on the compose screen.
- At 4 photos: shutter, roll, and `+` options dim (never hidden); the alert says "Day is full".
- Camera and mic permissions are asked at the shutter. Photo-library permission is asked on the roll tap. All purpose strings live in `app.config.js`.
- Copy budget: the photo count + zoom chip labels. Nothing else.

## Screen 2: Compose (the page)

- Top row: back (keeps the draft) · count pill ("2 photos"). Who-sees is not on this row.
- **Page strip** (only when other pages exist today): tiny page thumbnails + a filled marker for the page you are on. Tap another page to open it. If your current page is new and unposted, tapping offers "Add to that page?" (merge).
- **The page** at 8.5 x 11 with margin. Tap the caption slot → caption sheet. Tap a photo → chip row: `Replace` · `Remove` · `Move to…` (other pages or a new page = split).
- **Layout carousel**: page-shaped thumbnails, no labels. Tap = instant swap (`Reveal`, still under Reduce Motion). Long-press shows the name; screen readers always hear it.
- **Composer bar**: `+` (add sheet: Camera / Camera roll) · pencil (customize tray: paper color + Undo) · **Next** (opens who-sees) · `i` (`InfoPopover`, the only sentences on the screen).
- **Who sees this** sheet: Only me / Close / Friends / Everyone (+ groups later). Footer confirm is **Post to Friends** (or Close / Only me / Everyone). Product events fire only after the server confirms.
- Sheets are their own analytics surfaces; the page stays visible behind them.
- **Post** flattens the page (`react-native-view-shot`, 1275 px wide) to a preview JPEG that becomes `stories.media_id` (what the Home tile and Catch-Up show), uploads any un-uploaded media, then `POST /stories` (new) or `PATCH /stories/posts/:id/page` (a page from earlier today).
- **Draft**: saved on the phone (`AsyncStorage`, one key per day) after every change; restored on reopen the same day; cleared on post. Undo keeps the last 20 page states.

## Viewer (unchanged behavior, new frame)

- A post with a real page is drawn with `ScrapbookPage` (view mode), letterboxed on the dark canvas below the header and above the caption row, so chrome never covers photos. The first video element plays in its slot with the shared player; other videos show a poster. Legacy posts still fill the screen.
- One progress segment per page, as before (a day with 3 pages = 3 segments).
- Finishing an author records the revision watched; a later add re-lights the ring.

---

## API (`apps/api/src/stories`)

| Method | Path | What |
|---|---|---|
| GET | `/stories/quota` | `{ left, cap }` counting photo/video elements across today's pages |
| GET | `/stories/today` | Your pages from today, oldest first (page strip) |
| POST | `/stories` | Create. Body adds `page: { layoutId, layoutFamily, background, elements[] }`. Legacy body (no `page`) still works |
| POST | `/stories/transcribe` | Voice note → words. Body: `audioBase64`, optional `filename`. Returns `{ text }`. Never logged |
| PATCH | `/stories/posts/:postId/page` | Replace the page behind your post; bumps `revision`; may change caption / audience / preview |
| DELETE | `/stories/posts/:postId` | Delete your page (merge empties a page) |

Validation: known element types, clamped numbers, media rows owned by the caller, video requires co-op, `visible_to_tier` accepts `none`. Every post DTO now returns `page`, `revision`, `visibleToTier`.

## Components

`packages/ui`: `ScrapbookPage` (renderer; `renderMedia` prop so video stays in the app), `LayoutCarousel` + `LayoutThumb`, `CountPill`, `AudiencePicker` (`allowOnlyMe`).
`apps/mobile/components/story`: `CaptureCompose` (screen 1 + flow), `PageCompose` (screen 2), `ComposeSheets` (caption / audience / add / customize).
`apps/mobile/hooks/useScrapbookDraft.ts`: draft, undo, today's pages, quota, post, move/merge/split.
`apps/mobile/lib/pick-scrapbook-media.ts`: camera roll (permission in context, 20 s video cap, `media_imported`).

Magic Patterns: these are new components to design in the library (`MAGIC-PATTERNS.md` lists them). The current build follows the design brief's wireframes until the library versions land.

---

## Acceptance criteria (Phase 1)

- [ ] Open camera, tap shutter, tap Next, pick who, tap Post to Friends: page posts and shows on the Home tile in the live window.
- [ ] Screen 1 shows "N photos" (not "N/4" step-style); no themed prompt squares; zoom chips match device capacity; flash, flip, roll are icons.
- [ ] Screen 2 shows the page at 8.5 x 11 with margin, a layout carousel, `+`, pencil, **Next**, `i`. Next opens who-sees with **Post to {audience}**.
- [ ] Adding a second photo (camera or roll) keeps the layout family and the caption.
- [ ] A second capture later the same day can land on the same page (via the page thumb or the strip) or be its own page. The count pill reads across all pages. Saving a posted page bumps `revision`; friends' rings re-light.
- [ ] `4/4` dims the shutter and both add options; nothing is hidden.
- [ ] Audience sheet offers Only me · Close · Friends · Everyone (and groups when they exist). Only me pages are invisible to everyone else (RLS + API tier check; verify with a second account).
- [ ] Leaving mid-compose and returning the same day restores the page from the local draft.
- [ ] Viewer draws real pages letterboxed under the header; legacy posts still fill the screen; a video slot plays.
- [ ] Every new control has role, label, and a 44 pt target; Reduce Motion disables the reflow animation; the caption field respects Dynamic Type.
- [ ] Every new element, sheet, flow step, and product event exists in `ANALYTICS-TAXONOMY.md` and `packages/shared/src/analytics/ids.ts`.
- [ ] `PRIVACY.md`, `TERMS.md`, `PrivacyInfo.xcprivacy`, `app.config.js` purpose strings updated. No new notification kind (`NOTIFICATIONS.md` unchanged). No new outbound integration (`ADMIN.md` health unchanged).
