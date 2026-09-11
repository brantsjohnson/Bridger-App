# Typography (tokens — mobile + web)

**Status:** [PERMANENT] · **Authority:** this file + `DESIGN.md` (fonts / personality). Size floors here win when they conflict with ad-hoc `text-[Npx]` in UI code.

Bridger is often hard to read when body copy, form fields, or primary labels dip below these sizes. **Do not invent a smaller size because a layout feels tight.** Shrink the layout (padding, measure, number of lines) instead.

---

## Size classes (how tokens resolve)

Type tokens resolve from the live layout class in `packages/ui/src/layout/responsive.ts`:

| Doc name (this table) | Bridger `breakpoint` | Typical device |
|---|---|---|
| Mobile: compact / medium | `phone` | Handset, folded foldable, narrow split view |
| Desktop: expanded / wide | `expanded` / `large` | Unfolded foldable, tablet, desktop browser |

On big screens, content still sits in the centered column (`CONTENT_MAX_WIDTH`). Do not stretch a sentence across the full browser width just because the window is wide. Cap reading measure (see below).

---

## Token scale

| Token | Mobile (`phone`) | Desktop (`expanded` / `large`) | Rules |
|---|---|---|---|
| `body` | **16px** (min, never below) | 16–18px | Body never &lt; 16px anywhere (phone, tablet, web). Primary reading copy. |
| `body-lg` | 18px | 18–20px | Intros, lead paragraphs, short explainer blurb under a heading. |
| `caption` | 13–14px | 13–14px | Secondary only (meta, helper, timestamps). Never the main thing someone must read to act. |
| `input` | **16px** (min) | 16px | Text fields, search, OTP, chat composer. **Prevents iOS/Android auto-zoom on focus.** Never 14px or 15px in an editable field. |
| `h1` | **24–32px** | 36–48px+ | Screen / step titles. Mobile compresses so titles do not dominate. Pixel headers (`FeloniaPixel`) still obey this size band for the *rendered* size. |
| `h2` | 20–24px | 28–36px | Section titles inside a screen. |
| `h3` | 18–20px | 22–28px | Card / module titles, sheet titles. |
| `line-height` (body) | **1.6×** | **1.5×** | Mobile leads slightly looser for dense scanning. |
| `measure` (line length) | **30–40 chars** | **50–70 chars** | Cap the text container width so lines stay scannable. Do not full-bleed long paragraphs on desktop. |

### Hard floors (non-negotiable)

1. **Body ≥ 16px** on every platform, every screen, every mode (including onboarding, sheets, empty states).
2. **Inputs ≥ 16px** on every platform (stops Safari/Chrome zoom-on-focus).
3. **Caption is secondary.** If the user must understand it to continue, it is `body` or larger, not caption.
4. **No `text-[10px]` / `text-[11px]` / `text-[12px]` for readable copy.** 12px is only for tiny chrome (badge counts, legal micro-print the product already treats as non-primary). Prefer 13–14px caption when you need small.
5. **Do not “fix” overflow by shrinking type.** Wrap, truncate with a clear affordance, scroll, or reflow with `useResponsiveLayout()`.

---

## Font families (from DESIGN.md — unchanged)

- **Section / onboarding question headers:** FeloniaPixel (pixel). Loud personality; still sized per `h1` / `h2` above.
- **Body, labels, descriptions, buttons:** Plus Jakarta Sans (clean). Never pixel in body.
- **Big Shoulders Display:** only the four onboarding reality-check ("quick recap") screens.
- Sentence case for UI labels; pixel headers may stay product-styled (often all caps in onboarding).

---

## Tailwind / NativeWind mapping (use these, not one-off sizes)

Until a shared token module ships, map like this in RN / NativeWind classes:

| Token | Prefer class / style |
|---|---|
| `body` | `text-[16px] leading-[26px]` (≈ 1.6) on phone; up to `text-[18px] leading-[27px]` on large |
| `body-lg` | `text-[18px]` … `text-[20px]` |
| `caption` | `text-[13px]` or `text-[14px]` only |
| `input` | `text-[16px]` (always) |
| `h1` | `text-[24px]`–`text-[32px]` phone; larger on `expanded` / `large` |
| `h2` | `text-[20px]`–`text-[24px]` phone |
| `h3` | `text-[18px]`–`text-[20px]` phone |

If you need a size that is not in this table, **stop and ask** (or add a row here in the same PR). Do not silently invent `text-[15px]` for body.

---

## Where this applies

- Every screen and sheet in `apps/mobile`
- Shared primitives in `packages/ui`
- Admin web copy that mirrors product UI (same floors)
- Magic Patterns ports: when a design uses 12–14px body, **raise it to 16px** on implement unless the brief explicitly marks it caption/meta

---

## Checklist (definition of done for UI)

- [ ] No primary reading copy below 16px
- [ ] Every `TextInput` / field is ≥ 16px
- [ ] Captions are clearly secondary (meta), not instructions or CTAs
- [ ] Long text is measure-capped on large screens
- [ ] Body line-height ≈ 1.6 on phone, ≈ 1.5 on large
- [ ] Pixel font only on headers; body stays sans

---

## Related

- `DESIGN.md` — visual system, which fonts where
- `responsive-adaptive.mdc` / `packages/ui/src/layout/responsive.ts` — size class / breakpoint
- `MAGIC-PATTERNS.md` — components; still obey these floors when porting
