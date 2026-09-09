# Bridger: Scrapbooks (posting an Update as a page)

Build doc for **posting**. Users see **Scrapbook** / **Your scrapbook** / **Today's page**; code keeps the `stories` module and tables (naming rule §6). This doc supersedes the "Posting rules" half of `STORIES.md`. The viewer, Catch-Up, reactions, replies, lifecycle, and notifications stay as written in `STORIES.md`.

Design rationale, wireframes, and the founder decisions live in `guide-docs/design-briefs/SCRAPBOOKS-UX-DESIGN-BRIEF.md`. The phase-by-phase build plan lives in `guide-docs/design-briefs/SCRAPBOOKS-PHASE-PLAN.md`.

---

## The one-sentence design

> Take a photo, Bridger lays it on a page, you post. Everything else is one tap deeper and never in the way.

Two screens, ever: **Capture** and **Compose**. No layout screen, caption screen, audience screen, or confirmation screen.

---

## What a Scrapbook is (data)

- A **page** is a portrait **8.5 x 11** sheet (`SCRAPBOOK_ASPECT_RATIO = 8.5 / 11`). Everything on it is an **element** placed by fractions of the page (0..1): `photo`, `video`, `text` (the caption, `data.role = 'caption'`), `date` (the stamp). Later phases add voice, people, place, map, stickers, cutouts, clippings, frames.
- One **post = one `stories` row = one page** (`stories.page_id` → `scrapbook_pages`, elements in `scrapbook_elements`). Old rows with no page render as a one-photo page at read time (`legacyStoryToScrapbookPage`). No data migration needed.
- A **day** holds **1 to 4 pages**. A person can post four separate one-photo pages, one page with four photos, or anything between, and can **merge** or **split** pages during the day.
- **Daily limit: `DAILY_SCRAPBOOK_MEDIA_LIMIT = 4`** photos + videos across all of today's pages (was 3 posts). Captions, stamps, and later decor do not count. Defined once in `packages/shared/src/model/scrapbook.ts`; enforced by the API (`countToday` sums media elements; legacy rows count 1).
- **Revision**: `stories.revision` and `scrapbook_pages.revision` go up on every change after posting. The Home feed tile carries the sum of live revisions, so a friend who already watched sees the ring light again when the author adds to a page. Personal watched-state only, never a count.
- **Audience** is per page: Only me (`tier none`, owner only via `can_view`), Close, Friends, Everyone (acquaintance), or a co-op group once groups exist. Default = last choice used, else Friends.
- **Media source** is kept per element: `bridger_camera | camera_roll | event | shared`.
- **Video** on a page is a co-op perk to post (watching is free). Max 20 s, live or imported.
- **Photos are never edited destructively.** Crops (Phase 3) are stored as fractions in `element.data.crop`.

Layout templates are data (`packages/shared/src/scrapbook/layouts.ts`): 5 families (`simple`, `caption`, `editorial`, `scrapbook`, `freeform`) x 4 photo counts. Re-layout stays inside the family. Elements flagged `userModified` are never moved by auto-layout.

---

## Screen 1: Capture

- Camera fills the screen. Fixed near-black canvas.
- Top row: close (chevron) · **count pill `1/4`** (dead-click, amber when full) · flash (off / on / auto) · flip.
- Bottom rail: **camera roll** (small, secondary) · **shutter** (tap photo, hold video) · **✦ prompts tray**.
- Inside the camera, bottom-left: a tiny thumbnail of the **unposted draft** (amber dot) or **today's latest page**. Tap = open it on the compose screen.
- The **prompts tray** holds the three admin-rotated themed squares and the BeReal-like reminders toggle (same prefs and analytics ids as before; they moved off the main screen).
- At `4/4`: shutter, roll, and `+` options dim (never hidden); the alert says "Day is full".
- Camera and mic permissions are asked at the shutter. Photo-library permission is asked on the roll tap. All purpose strings live in `app.config.js`.
- Copy budget: the count. Nothing else.

## Screen 2: Compose (the page)

- Top row: back (keeps the draft) · count pill · **audience chip** (tier color; tap opens the audience sheet).
- **Page strip** (only when other pages exist today): tiny page thumbnails + a filled marker for the page you are on. Tap another page to open it. If your current page is new and unposted, tapping offers "Add to that page?" (merge).
- **The page** at 8.5 x 11 with margin. Tap the caption slot → caption sheet. Tap a photo → chip row: `Replace` · `Remove` · `Move to…` (other pages or a new page = split).
- **Layout carousel**: page-shaped thumbnails, no labels. Tap = instant swap (`Reveal`, still under Reduce Motion). Long-press shows the name; screen readers always hear it.
- **Composer bar**: `+` (add sheet: Camera / Camera roll) · pencil (customize tray: paper color + Undo) · **POST** (metallic `ButtonPrimary`, enabled once one photo exists) · `i` (`InfoPopover`, the only sentences on the screen).
- Sheets are their own analytics surfaces; the page stays visible behind them.
- **Post** flattens the page (`react-native-view-shot`, 1275 px wide) to a preview JPEG that becomes `stories.media_id` (what the Home tile and Catch-Up show), uploads any un-uploaded media, then `POST /stories` (new) or `PATCH /stories/posts/:id/page` (a page from earlier today). Product events fire only after the server confirms.
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
| PATCH | `/stories/posts/:postId/page` | Replace the page behind your post; bumps `revision`; may change caption / audience / preview |
| DELETE | `/stories/posts/:postId` | Delete your page (merge empties a page) |

Validation: known element types, clamped numbers, media rows owned by the caller, video requires co-op, `visible_to_tier` accepts `none`. Every post DTO now returns `page`, `revision`, `visibleToTier`.

## Components

`packages/ui`: `ScrapbookPage` (renderer; `renderMedia` prop so video stays in the app), `LayoutCarousel` + `LayoutThumb`, `CountPill`, `AudiencePicker` (`allowOnlyMe`).
`apps/mobile/components/story`: `CaptureCompose` (screen 1 + flow), `PageCompose` (screen 2), `ComposeSheets` (caption / audience / add / customize), `PromptsTray`.
`apps/mobile/hooks/useScrapbookDraft.ts`: draft, undo, today's pages, quota, post, move/merge/split.
`apps/mobile/lib/pick-scrapbook-media.ts`: camera roll (permission in context, 20 s video cap, `media_imported`).

Magic Patterns: these are new components to design in the library (`MAGIC-PATTERNS.md` lists them). The current build follows the design brief's wireframes until the library versions land.

---

## Acceptance criteria (Phase 1)

- [ ] Open camera, tap shutter, tap Post: three taps, zero typing, zero choices. Post succeeds and the page shows on the Home tile in the live window.
- [ ] Screen 1 shows only the count as text; prompts and reminders sit behind `✦`; flash, flip, roll are icons.
- [ ] Screen 2 shows the page at 8.5 x 11 with margin, a layout carousel, `+`, pencil, `Post`, audience chip, count, `i`. Tapping a layout thumbnail changes the page instantly with no confirm.
- [ ] Adding a second photo (camera or roll) keeps the layout family and the caption.
- [ ] A second capture later the same day can land on the same page (via the page thumb or the strip) or be its own page. The count pill reads across all pages. Saving a posted page bumps `revision`; friends' rings re-light.
- [ ] `4/4` dims the shutter and both add options; nothing is hidden.
- [ ] Audience sheet offers Only me · Close · Friends · Everyone (and groups when they exist). Only me pages are invisible to everyone else (RLS + API tier check; verify with a second account).
- [ ] Leaving mid-compose and returning the same day restores the page from the local draft.
- [ ] Viewer draws real pages letterboxed under the header; legacy posts still fill the screen; a video slot plays.
- [ ] Every new control has role, label, and a 44 pt target; Reduce Motion disables the reflow animation; the caption field respects Dynamic Type.
- [ ] Every new element, sheet, flow step, and product event exists in `ANALYTICS-TAXONOMY.md` and `packages/shared/src/analytics/ids.ts`.
- [ ] `PRIVACY.md`, `TERMS.md`, `PrivacyInfo.xcprivacy`, `app.config.js` purpose strings updated. No new notification kind (`NOTIFICATIONS.md` unchanged). No new outbound integration (`ADMIN.md` health unchanged).
