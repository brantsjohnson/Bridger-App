# Bridger — UI & Motion Direction

How Bridger should look and feel. This governs every screen; the page docs say *what* each screen does, this says *how* it's dressed. One-line summary:

> **Playful retro-modern flat UI** — clean, rounded, mostly eggshell, colorful accents, pixel-style headers, occasional 90s-metallic buttons, with synth reserved for Discover.

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
| Main app (home, friends, events, profile, feed) | eggshell / black |
| Onboarding, profile fill modules, empty states | colorful |
| Discover | synth (see below) |
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
- **Flat.** No heavy shadows, no fake depth, no busy textures. A faint hairline or a solid color fill separates surfaces — that's enough.
- Generous whitespace; bold but never cluttered.

---

## Interest & hobby selectors (personality, not a list)

The hobby/interest pickers must **not** feel like a plain checklist or a dating app. Instead: **colorful rounded "blob" pills**, each with a little **character/illustration icon** and a checkmark when selected (think friendly, hand-drawn energy). With ~95 hobbies, this is what keeps a long selection joyful instead of a chore. Color-code by category; let the shapes feel a touch organic.

---

## Discover — the synth exception

Discover is the **one place that goes full 80s synth**, because exploration should feel like an adventure:

- **Subtle animated grid background** — a faint perspective grid that **slowly drifts so it feels alive**, kept **blurred and atmospheric** (low-contrast, soft) so it never competes with content. This moving grid is the *only* part of synth Bridger actually wants — not the neon, not the chrome.
- **But the maps and graphs stay neoclassical.** The friend maps (Map A / Map B in `DISCOVER.md`) and any connection graphs render **clean and modern** — thin lines, tidy nodes, readable — on a crisp eggshell card floating over the grid. The synth is the *stage*; the map is the *content*, and content stays clean.
- Pixel **Discover** header sits on the synth canvas.

Everywhere else, the grid is either absent or barely-there — Discover owns the effect.

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
- [ ] Discover shows a subtle, slowly-drifting, atmospheric grid; its maps/graphs render clean and neoclassical on top.
- [ ] Transitions are smooth and content breathes in; all motion is transform/opacity only and respects `prefers-reduced-motion`.
- [ ] Retro cues stay ~20% of the surface; functional screens remain plain.
