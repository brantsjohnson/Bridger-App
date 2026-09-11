# Foldable + big-screen adaptive layout (iPhone Duo, tablets, web)

Status: [ACTIVE] — foundation shipped, richer layouts planned.

Plain-English summary: Bridger is a phone-first app, but it also runs in a
computer browser and needs to be ready for big folding phones (Apple's iPhone
Duo, announced 2026-09-09, opens into a 7.6-inch tablet-style screen). On any
wide screen our old phone layout stretched edge to edge and looked awkward. The
first fix (already shipped) is a single, shared "comfortable middle": every
screen and the bottom nav now sit in a centered column on big screens instead
of stretching. This brief records that foundation and plans the richer
foldable-only layouts (side controls, two-column views, posture awareness) so a
design agent can pick it up.

Rules that apply here (same as every task): guide-rules (plain-language
comments, accessibility, privacy invariants), naming-rules + analytics-
enforcement (every new interactive element, sheet, flow, and outcome named and
registered in ANALYTICS-TAXONOMY.md), Magic Patterns components only, no em
dashes in copy, and PRIVACY.md / TERMS.md updated in the same change if a phase
touches data or permissions.

---

## The device we are planning for

Apple's iPhone Duo introduces an iPad-inspired adaptive layout for its folding
7.6-inch internal display. The parts that affect app design:

- **Side-mounted controls.** When the phone is open, system controls, docks, and
  menus shift to the side so navigation stays within thumb reach.
- **Split-view multitasking.** Two apps side by side, or two windows of the same
  app, or a video pinned above an app in portrait.
- **iPadOS-style interfaces.** Native apps expand into multi-column layouts,
  sidebars, and extra panels when there is room.
- **Posture-aware adaptation.** Angle sensors shift content away from the center
  fold when the device is held partway open like a book.
- **Saved app pairs.** Tapping the center divider saves a two-app combination for
  quick relaunch.

The device is not released yet, so everything below the "Shipped" section is a
plan, not a promise. We build against screen size and OS signals, never against
"is this specific phone", so the same work also helps tablets and web.

---

## Phase 0 — Foundation (SHIPPED)

Goal: stop stretching on any big screen (web today, foldable/tablet tomorrow)
with the smallest possible change, funneled through the two pieces every screen
already uses.

- [x] `packages/ui/src/layout/responsive.ts` — one shared source of truth.
  - `LAYOUT` constants: `PHONE_MAX = 600`, `EXPANDED_MIN = 600`,
    `LARGE_MIN = 900`, `CONTENT_MAX_WIDTH = 480` (the comfortable column).
  - `useResponsiveLayout()` hook returns live `width` / `height`, a
    `breakpoint` of `phone | expanded | large`, an `isLarge` flag, the
    `contentMaxWidth` to cap at (undefined on phones = unchanged behavior), and
    `isPortrait` for future posture work.
- [x] `Screen.tsx` — the drifting `SynthGrid` background stays full-bleed, but
  the page content now sits in a centered column capped at `contentMaxWidth` on
  big screens. On a phone `contentMaxWidth` is undefined, so the phone
  experience is byte-for-byte the same.
- [x] `FloatingTabBar.tsx` — the bottom nav pill caps at the same
  `contentMaxWidth` and centers, so the nav lines up under the content column
  instead of stretching across a laptop window.
- [x] Exported `responsive` from `@bridger/ui` so any screen can ask
  "big screen or phone?" without re-deriving the math.

Why this shape: `Screen` and `FloatingTabBar` are the two chokepoints every
screen and the navigation flow through, so one change there fixes the whole app
at once and there is a single number (`CONTENT_MAX_WIDTH`) to tune.

Verify: open the web build and widen the window past 600 points — content and
the nav pill sit in a centered ~480-point column with the grid still filling the
background; narrow it back under 600 and the app fills the width exactly like
before. No analytics or data changes in this phase (no new interactive
elements), so the taxonomy is untouched.

Accessibility note: capping width improves readability (line length) and does
not remove any control; tap targets and Dynamic Type behavior are unchanged.

---

## Phase 1 — Two-column master/detail on `expanded` and `large` (PLANNED)

Goal: on a wide screen, use the extra room the way iPadOS does — a list on the
left, the selected item on the right — instead of a single centered strip.
Highest-value candidates (all already list-then-detail on phone):

- **Friends** roster (left) + selected person / reveal (right).
- **Messages** inbox (left) + open thread (right).
- **Discover** results (left) + selected match / connect-over (right).

Design direction:
- Introduce a `TwoPane` layout primitive in `packages/ui/src/layout/` that reads
  `useResponsiveLayout()`: renders a single stack on `phone`, and a
  list-plus-detail split on `expanded` / `large`. Raise `CONTENT_MAX_WIDTH` (or
  add a separate wide cap) only for screens that opt into two panes.
- Keep phone navigation intact: the split is additive, driven off the same
  Expo Router state, so a tap still "opens" the detail — it just lands in the
  right pane on big screens.
- Analytics: the detail pane is the same surface it is today (no rename). If a
  persistent list rail becomes its own navigable region, register its rows and
  the pane as surfaces per naming-rules before shipping.

## Phase 2 — Side-mounted navigation rail (PLANNED)

Goal: match the Duo's side-mounted controls. When the screen is wide and held in
a landscape/open posture, move the floating pill from the bottom to a vertical
rail on the leading side, within thumb reach of the open device.

Design direction:
- Add an orientation-aware branch to `FloatingTabBar` (or a sibling
  `SideTabRail`) chosen by `breakpoint` + `isPortrait`. Same five destinations,
  same accents, same `CHROME.tab_bar.*` analytics ids (reused, never renamed).
- Respect safe areas and keep every tap target 44x44 or larger.

## Phase 3 — Posture-aware content (PLANNED)

Goal: when the Duo is held partway open like a book, keep text and key media out
of the center-fold gutter.

Design direction:
- Read fold posture via the OS API when available (Expo/React Native support to
  be confirmed against the shipping SDK — do not guess the API surface). Fall
  back to width/aspect heuristics from `useResponsiveLayout()` when no posture
  signal exists.
- Add symmetric center padding to `ScreenBody` only in the "book" posture so no
  content sits under the hinge.

## Phase 4 — Split-view and saved pairs (MOSTLY OS-LEVEL)

Split-view, two windows of Bridger, pin-a-video, and saved app pairs are handled
by iOS, not by us. Our job is to not break inside a resized window:
- Everything already keys off `useWindowDimensions`, so a Bridger window in a
  narrow split behaves like a phone and a wide split behaves like `expanded`.
- Verify Billy's floating island, sheets, and full-screen modals reflow inside a
  small split-view window and never trap focus. No saved-pair work is needed on
  our side beyond correct resize behavior.

---

## Where the numbers live

All thresholds and the column width are in
`packages/ui/src/layout/responsive.ts` (`LAYOUT`). Change them there and every
screen plus the nav move together. Do not hard-code widths in individual
screens; call `useResponsiveLayout()` instead so the whole app stays consistent
across phone, foldable, tablet, and web.
