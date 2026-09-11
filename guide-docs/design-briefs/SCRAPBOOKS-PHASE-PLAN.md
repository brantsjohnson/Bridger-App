# Collages: phase plan and accountability log

This is the working checklist for turning Updates into Collages. Each phase lists what ships, the files it touches, how it is verified, and what "done" means. Check boxes are ticked in the same change that lands the work. Branch: `feat/scrapbooks` (kept off `main` until the founder has used Phase 1 and wants to keep it).

Founder decisions recorded 2026-09-08:
- Camera roll is allowed for collage pages. Circle replies and stickers stay capture-only.
- User-facing name is **Collage** (tile: Your collage, profile tab: Collage). Was Scrapbook briefly; renamed 2026-09-09. Code stays `stories` / `scrapbook_*`.
- A day holds **1 to 4 pages**; pages can be merged or split during the day.
- Build Phase 1 now, on a separate branch, with this plan kept current.

Rules that apply to every phase: guide-rules (comments, accessibility, privacy invariants), naming-rules + analytics-enforcement (every element, sheet, flow, and outcome named and registered), PRIVACY.md / TERMS.md updated in the same change, no em dashes in copy.

---

## Phase 1: Foundation (in progress on `feat/scrapbooks`)

Goal: the new two-screen posting flow with pages, layouts, camera roll, drafts, Only me, and the 4-per-day limit, without breaking the viewer, Catch-Up, replies, or old posts.

### Shipped in this branch
- [x] `packages/shared/src/model/scrapbook.ts`: types, `DAILY_SCRAPBOOK_MEDIA_LIMIT = 4`, `SCRAPBOOK_ASPECT_RATIO`, helpers.
- [x] `packages/shared/src/scrapbook/layouts.ts`: 20 templates (5 families x 1..4 photos), `applyLayout`, `relayoutForCount`, `legacyStoryToScrapbookPage`.
- [x] Analytics ids + product events (`ids.ts`, `types.ts`), exports.
- [x] `database.types.ts` for the new tables and columns.
- [x] Migration `0054_scrapbook_pages.sql`: `scrapbook_pages`, `scrapbook_elements`, `stories.page_id`, `stories.revision`, RLS, touch trigger.
- [x] API: quota counts media elements; `POST /stories` accepts `page`; `PATCH /stories/posts/:id/page`; `DELETE /stories/posts/:id`; `GET /stories/today`; `visible_to_tier = none` (Only me); DTO carries `page`, `revision`, `visibleToTier`; feed tile carries `revision`.
- [x] `packages/ui`: `ScrapbookPage`, `LayoutCarousel`, `CountPill`, `AudiencePicker allowOnlyMe`.
- [x] Mobile data: `createPost` with page, `updatePostPage`, `deletePost`, `listTodayPosts`, `uploadPageMedia`, `audienceToTier` with `only_me`; demo mode mirrors all of it.
- [x] `useScrapbookDraft`: AsyncStorage draft per day, undo (20), today's pages, quota, `post`, `moveMediaTo` (merge / split), `loadFromPost`.
- [x] Screen 1 `CaptureCompose`: full-screen camera, count pill, flash, flip, roll thumb, today's-page thumb, prompts tray.
- [x] Camera-first path (`CameraFirst` / Just shot / optional `CollageEditor`): shutter lands on today's page as a draft; Done posts with last audience; Make it a collage opens the editor; camera roll stays allowed; page fills 8.5 x 11 of the current screen.
- [x] Screen 2 `PageCompose`: page, page strip, selected-photo chips, layout carousel, composer bar, caption / audience / add / customize sheets, flatten + post, product events on confirm.
- [x] Viewer: real pages letterboxed with `ScrapbookPage`; video plays in slot; revision-aware re-light (`markStorySeen(authorId, revision)`).
- [x] Labels: Your collage, Collages (Home title), Collage (profile tab), Start your collage, replies to your collage.
- [x] `app.config.js` purpose strings (camera, photo library), `PrivacyInfo.xcprivacy` + `ios.privacyManifests` PhotosOrVideos.
- [x] Docs: `SCRAPBOOKS.md`, this plan, design brief, `ANALYTICS-TAXONOMY.md`, `PRIVACY.md`, `TERMS.md`, `guide-rules.mdc` §5, `INDEX.md`, `MAGIC-PATTERNS.md`, `STORIES.md` pointer.
- [x] Typecheck passes for `packages/shared`, `packages/ui`, `apps/mobile`, `apps/api`.

### Still to do before Phase 1 is "done"
- [ ] Run migration 0054 against the dev Supabase project and smoke-test: post, add to page, merge, split, Only me with a second account, legacy post still renders.
- [ ] Device test on iOS and Android: camera roll picker (multi-select, video length filter), flash modes, view-shot preview quality, draft restore after app switch.
- [ ] Web build: confirm the composer degrades (no live camera, roll works, preview falls back to first photo).
- [ ] Magic Patterns: design `ScrapbookPage`, `LayoutCarousel`, `CountPill`, `ComposerBar`, `CaptureRail`, `CaptionSheet`, `AudienceSheet`, `CustomizeTray` in the library, then reconcile the RN components to them. (No `PromptsTray`: themed suggested posts removed.)
- [ ] Decide the profile calendar peek for multi-photo pages (today: last post's emoji).
- [ ] Founder review of the flow on device; decide merge to `main` or iterate.

### Verification
- `npm run typecheck` (turbo) green.
- Manual acceptance checklist in `SCRAPBOOKS.md`.
- RLS check: second account cannot read an Only me page or its elements (SQL: `select * from scrapbook_elements` as that user returns none).

---

## Phase 2: Memory context

Goal: the page knows what happened, not just what it looked like.

- [x] Voice note sheet (record in context, play back, optional transcribe). Audio saved as `media.kind = 'audio'`; `POST /stories/transcribe` returns words. `voice` element chip on the page.
- [x] `voice` element: chip placeable on the page (duration + "words" when transcribed).
- [ ] `date` stamp editable (tap: hide / show / move); `place` stamp from coarse geocode (`lib/geocode.ts`), `privacyLevel exact | approximate | hidden`.
- [x] `person` element: pick friends from the roster. Stored as user ids, names rejoin on the phone. Notify `collage_tag` after a confirmed post.
- [ ] Simple `map` element (dots + names) from the day's places.
- [ ] Pull an event photo onto your page (`source: 'event'`), referencing the shared media row.
- [ ] Templates gain optional stamp slots for place / people; families stay intact.
- [ ] Analytics: `caption_recorded`, `people_tagged`, `place_added`, `map_added` (props: counts and enums only). Taxonomy rows.
- [x] PRIVACY.md: audio on a page stored + transcribed server-side; people tags. NOTIFICATIONS.md: `collage_tag` opens `/story/{authorId}`.
- [ ] Coarse places / map / event photo pull still later.

Done when: a page can carry words (typed or spoken), a date, a place, people, and a simple map, all as elements, all removable, and the fast path is still three taps.

---

## Phase 3: Real scrapbooking

Goal: the Customize tray becomes a real editor without touching the fast path.

- [x] Drag to move a selected piece; drop on the bin to delete. `userModified = true`. Resize / rotate handles still later.
- [ ] Non-destructive crop (`data.crop`), z-order (forward / back), duplicate, delete, lock.
- [ ] Customize tray grows to icon tabs: Add · Text · Decorate · Background · Layout.
- [x] Text elements: fonts, sizes, colors, optional box; movable.
- [x] Frames (none / shadow / polaroid / tape / film / torn), colour looks, paper colors, 6 packs. Stickers / doodles still later.
- [ ] `clipping` element (text or image).
- [x] Undo / redo across edits (30-ish page snapshots).
- [ ] Analytics: `element_moved`, `element_resized`, `element_rotated`, `decor_added` (asset ids, never content). Taxonomy rows.

Done when: the creative acceptance test in the design brief passes and a page with 30 elements still posts in under 2 s on a mid-range phone.

---

## Phase 4: Personalization

- [ ] Paste image from clipboard (platform adapters iOS / Android / web), transparency kept.
- [x] Cutouts: on-device subject lift (Vision module on iOS native rebuild) or clean shapes (circle / heart / flower / scallop). No hand-drawn lasso. Source photo untouched.
- [ ] **My Stuff**: `saved_components` table (single element, element group, text style, aesthetic preset); reuse creates new element ids.
- [ ] Save a cutout or sticker to My Stuff; inside-joke saves.
- [ ] Custom fonts (`font_assets`, woff2 / ttf, licensing flag for print). Text stays editable.
- [ ] **My Style** aesthetic profile (`aesthetics` table) + per-page override chip `Style: My Style` inside Customize.
- [ ] Analytics: `component_saved`, `style_applied`, `font_uploaded` (ids only). Taxonomy rows. PRIVACY.md: uploaded fonts and pasted images are user content.

Done when: two people can post the same photo and get visibly different, intentional pages from their own styles.

---

## Phase 5: Intelligence

- [ ] Auto-compose engine (`packages/shared/src/scrapbook/compose.ts`): deterministic first (templates, families, rules, style presets), output is `scrapbook_elements`, never a flattened image.
- [ ] Respect `userModified` and `locked`; least-destructive adjustment when a new photo arrives.
- [ ] "Try another" (Auto 1 / 2 / 3) with page versions.
- [ ] Server-side helpers (no photos to a model unless the founder approves a vision vendor): hero photo pick from metadata, duplicate detection by hash, blur score on device.
- [ ] Contextual suggestions: add map when 3+ places, add people from event attendees.
- [ ] Analytics: `auto_compose_applied`, `auto_compose_rejected`, `suggestion_accepted`. ADMIN.md health entry if any new outbound vendor lands.

Done when: the Disneyland automatic-user test in the design brief passes with zero manual edits.

---

## Phase 6: Events and books

- [ ] Event pages on the same renderer; shared `event_media_pool`; personal event versions referencing shared media.
- [ ] Multi-page scrapbooks (`page_index`), month / year / friendship collections.
- [ ] Print export at print resolution from element data; QR for video and voice.
- [ ] Coffee table book flow (choose scope, auto-assemble, adjust, order).
- [ ] PRIVACY.md / TERMS.md: print partner processing, shared event media rights.

Done when: a month of pages exports to a PDF that matches the on-screen pages.

---

## Log

| Date | Phase | Note |
|---|---|---|
| 2026-09-08 | 1 | Design brief written from the live code; founder decisions taken; Phase 1 built on `feat/scrapbooks`. Device smoke test and migration run still pending. |
