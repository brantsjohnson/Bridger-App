# Bridger — UI & Motion Direction

How Bridger should look and feel. This governs every screen; the page docs say *what* each screen does, this says *how* it's dressed. One-line summary:

> **Playful retro-modern flat UI** — clean, mostly rounded (some have corners more rounded, some corners are all rounded and one edge is pointed-- mix it up), mostly eggshell, colorful accents, pixel-style headers, occasional 90s-metallic buttons, with synth reserved for Discover.

The guiding ratio: **80% clean modern product, 20% retro personality.** The 20% is the signature; if retro takes over, the app feels dated and hard to use. Retro is seasoning, not the meal.

*(Living doc — more Pinterest references to come; treat this as the direction, not the final pixel spec.)*

---

## Canvas & color

- **Main app canvas: eggshell white** (a warm off-white, ~`#F4F1E7`), **black/near-black in dark mode** (~`#0E0E0E`). The classier, calmer canvas makes colorful, fun elements pop — that's the whole reason for it.
- **Onboarding & fill-out flows: colorful.** Full-color backgrounds (soft purples, pastels) are welcome where people are being introduced or filling things in — it's warmer and less clinical than the main app.
- **Accents** come from a playful palette (purple, coral, teal, amber, pink, blue, green) delivered through **cards, chips, icons, category blocks, selected states** — never through the whole background.
- Color energy is **neo-brutalist-adjacent** (bold, saturated, confident) but rendered **flat** — no thick black outlines, no hard offset shadows.

| Context | Background |
|---|---|
| Main app (home, friends, events, profile, feed) | eggshell / black, with the drifting grid behind it |
| Onboarding, profile fill modules, empty states | colorful |
| Discover | the same grid, turned up (see below) |
| Settings, forms, account | plainest — eggshell, minimal decoration |

---

## Typography

- **Section headers** (Home, Friends, Discover, Events, This week…) use a **pixel / retro-computer font** (e.g. Pixelify Sans). This is the single loudest retro cue — it carries the personality so the rest can stay clean.
- **Body, labels, descriptions:** clean, highly readable sans-serif. Never pixel — pixel body copy is a readability sin.
- **Buttons/UI labels:** simple sans, sentence case.
- Two weights, generous line-height, sentence case everywhere.

---

## Buttons

- **Primary CTAs** (Continue, Get started, Join, Send, Confirm) get the **90s-metallic** treatment: light silver-gray surface, a subtle **bevel via border** (lighter top/left, darker bottom/right — the classic old-computer frame), black text, modern rounded proportions. Decorative enough to feel special, not clunky.
- **Everything else** stays flat: pill or rounded-rect, hairline border or solid fill, no bevel.
- Reserve the metallic look for **key progression moments** (onboarding, primary actions) so it stays a treat. Not every button.

---

## Shape & surfaces

- Rounded rectangles, pill buttons, soft cards, clean modular blocks. Radius ~12–24px on cards, pill radius on chips/buttons.
- **Floating nav bar.** The bottom navigation is a **detached, rounded pill** inset from the screen edge — Apple's newer dynamic/"liquid-glass" style: translucent where possible, subtly dynamic (may shrink or tuck away on scroll), active destination shown as a filled circle. Not a full-width bar flush to the bottom edge.
- **Page title headers scroll with the page.** Home / Friends / Events / etc. title rows are not sticky and do not slide back when you scroll up mid-page. They leave only as content pushes them off the top, and they return only when you scroll all the way back to the top (`ScreenHeader` + `ScreenBody` in `packages/ui`).
- **Flat.** No heavy shadows, no fake depth, no busy textures. A faint hairline or a solid color fill separates surfaces — that's enough.
- **White is the default container; color is earned.** `surface` is plain white. Color does not come from tinting every card a pale shade — a pastel wash everywhere reads muted, not playful. It comes from making the things that matter **fully vivid**: the Touch Grass button, Connect Over cards, message rows, the event banner. When in doubt: white base, loud feature.
- **Never the toned-down yellow.** Pale/dusty yellow is out of the palette. Yellow appears only as the vivid "you" tier color.
- **Shapes lean.** A card should not be a rectangle with sanded corners. `funShape(id)` in tokens gives each card one hard-curved corner pair and one tight pair, picked from its own id — stable per card, varied down a list. Some things stay plain on purpose: story tiles, notifications, and anything in a tight grid.
- Generous whitespace; bold but never cluttered.

---

## Interest & hobby selectors (personality, not a list)

The hobby/interest pickers must **not** feel like a plain checklist or a dating app. Instead: **colorful rounded "blob" pills**, each with a little **character/illustration icon** and a checkmark when selected (think friendly, hand-drawn energy). With ~95 hobbies, this is what keeps a long selection joyful instead of a chore. Color-code by category; let the shapes feel a touch organic.

---

## The drifting grid — Bridger's backdrop

The slowly-drifting perspective grid is **the app's background everywhere**, not a Discover-only trick. It is the one part of synth Bridger actually wants — not the neon, not the chrome.

- **Every screen gets it.** `Screen` renders `SynthGrid` behind the content. Only `tone="plain"` screens skip it (the story player and anything drawn edge to edge over a photo, where a grid just looks like dirt).
- **Discover gets the boldest version** (`strength="bold"`); everywhere else is one step down. It still has to stay behind the content — text on top must read comfortably.
- **The maps and graphs stay neoclassical.** The friend maps (Map A / Map B in `DISCOVER.md`) and any connection graphs render **clean and modern** — thin lines, tidy nodes, readable — on a crisp card floating over the grid. The grid is the *stage*; the map is the *content*, and content stays clean.
- Pixel **Discover** header sits on the synth canvas.

## Tier color — one color per circle, everywhere

How close someone is is shown as a color, and it is the SAME color everywhere they appear:

| Circle | Color |
|---|---|
| You | yellow |
| Close | green |
| Friend | blue |
| Acquaintance | orange |

- **Story tile rings** use the gradient version (`TIER_GRADIENT` + `GradientRing`) — a ring is the one place a gradient earns its keep.
- **Message rows** use the FLAT version (`TIER_COLOR`). No gradient: **deep = it's your turn to reply**, **light = you already replied and are waiting on them**. That single dark/light split is the whole point of the inbox, and a gradient blurs it.

Do not hand-roll a gradient anywhere else, and never use one for depth or shine.

**ACCESSIBILITY:** color is never the only signal — the name, the tier heading, the card shape, and the spoken label all say the same thing.

## Whimsy — the app should feel awake

Life comes from `packages/ui/src/lib/whimsy.tsx`. Use these rather than hand-rolling animation:

| Piece | What it's for |
|---|---|
| `Reveal` | content fades and lifts into place; pass `index` in a list so rows cascade |
| `Peel` | a sticky note pressing onto the wall (Inside Jokes) |
| `Wiggle` | an unfinished thing nudging itself every few seconds ("To do" tags) |
| `Sparkles` | confetti popping off something worth celebrating (birthdays) |
| `Glow` | a slow breath on a play button, so the eye finds it |
| `GradientRing spin` | the tier gradient travelling around a story ring (Instagram-style) while an update is unseen — it **travels, it does not pulse** |
| `useCountdown` | a live clock — "2d 4h 11m 06s" ticking, not a rounded-off "in 2 days" |
| `GrassGrow` | grass rising inside the Touch Grass button, holding, sinking, repeating |

Rules: transform and opacity only · every one checks Reduce Motion and goes still · motion never carries meaning on its own · decorative motion is hidden from screen readers.

---

## Motion & transitions

The flow should **breathe and move** — seamless, never janky, never static-and-dead:

- **Screen transitions** are smooth (slide/fade/shared-element), with spring-like easing — things ease in and settle, they don't snap.
- **Elements breathe** on entry: a subtle fade + slight rise or scale as content loads, so screens feel alive rather than popping into place.
- **Playful micro-motion**: the drifting Discover grid, floating comment balloons and emoji bursts on stories (`STORIES.md`), sticker pops, the delight system (`DELIGHT.md`).
- **Rules:** animate **transform and opacity only**; keep durations short; **always respect `prefers-reduced-motion`** (motion is opt-out). Delight, never a performance or accessibility tax.

---

## Design tokens (starting point)

```
--canvas-light:  #F4F1E7   (eggshell)
--canvas-dark:   #0E0E0E
--ink:           #1C1B16   (near-black text on eggshell)
--metal-face:    #DEDCD2   (button surface)
--metal-hi:      #FFFFFF   (bevel top/left)
--metal-lo:      #A7A498   (bevel bottom/right)
accents: purple #7F77DD · coral #F0997B · teal #1D9E75 · amber #EF9F27 · pink #ED93B1 · blue #378ADD · green #97C459
fonts:  headers = pixel (Pixelify Sans);  body = clean sans
radius: cards 12–24px · chips/buttons = pill
```

---

## What to avoid

- Heavy shadows, fake depth, busy textures.
- Too many retro references at once (pick pixel headers + metallic CTAs + Discover grid; not every trick everywhere).
- Dark backgrounds in the main app (dark mode is intentional black, not muddy).
- Pixel font in body copy; more than two type styles.
- Over-decorated functional screens (settings/forms stay plain).
- Anything that reads as "art project" over "product." Clean product first, personality second.

---

## Acceptance criteria

- [ ] Main app renders on an eggshell canvas (light) / near-black (dark); onboarding and fill flows may use full color.
- [ ] Section headers use the pixel font; body copy is clean sans and never pixel.
- [ ] Primary CTAs use the beveled retro-metallic style; other buttons stay flat. The treatment is reserved, not universal.
- [ ] Surfaces are flat and rounded — no heavy shadows or textures.
- [ ] Interest/hobby selectors are colorful illustrated blobs, not a plain checklist.
- [ ] The slowly-drifting grid sits behind every screen (Discover boldest, `tone="plain"` screens excepted); maps/graphs render clean and neoclassical on top.
- [ ] White is the base; color arrives as fully vivid feature blocks, never as a pale tint on everything. No dusty yellow anywhere.
- [ ] Cards lean — `funShape(id)` — except story tiles, notifications, and tight grids.
- [ ] Tier color is consistent everywhere: gradient on story rings, flat on message rows (deep = your turn, light = waiting on them).
- [ ] Yellow is always the saturated amber. The dusty, washed-out yellow is not in the palette.
- [ ] Animations use `NATIVE_DRIVER` from `whimsy`, never a bare `useNativeDriver: true` — the web build silently drops rotations on the native driver.
- [ ] Pages arrive with `Reveal`; unfinished things `Wiggle`; celebrations get `Sparkles`; live times use `useCountdown`, not a rounded label.
- [ ] Transitions are smooth and content breathes in; all motion is transform/opacity only and respects `prefers-reduced-motion`.
- [ ] Retro cues stay ~20% of the surface; functional screens remain plain.
