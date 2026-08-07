# Bridger — Profile Customization (co-op)

How a **co-op member** personalizes their profile — from simple no-code theming up to **custom CSS and a safe HTML subset** — without ever breaking legibility, accessibility, security, or the "you're not the product" promise. This is the detailed spec behind the "Customize your profile page" note in `PROFILE.md` and a flagship co-op benefit in `COOP.md`. Read with `DATA.md` (canonical data), `INFRASTRUCTURE.md` (WebView/CSP), and the app-store/UGC rules in `CURSOR-RULES.md`.

**Where:** Profile → **Settings → "Customize your profile page"** (co-op only). No-code editing works on mobile; **code editing (CSS/HTML) is desktop-only** (you need a real editor). Free members get the clean native page — which is also everyone's guaranteed fallback.

---

## 0 · The one idea that makes this safe: data is canonical, customization is a skin

The profile's **content** is always canonical structured data in the database (the `attributes`, Top 5, About, etc. from `PROFILE.md`). Customization is a **separate presentation layer** that *restyles and rearranges what Bridger renders* — it can **never author, delete, or hide** the underlying facts.

This resolves the founder's rule — *"they can't delete any information; it all has to be there"* — structurally rather than by policing: the sections are **injected by Bridger**, not written by the user, so a custom theme can move or restyle the "About me" block but cannot remove it or fake its contents. Deleting data is a *different_ action (the user's own right, in the profile editor); **styling is not deletion.**

Two escape hatches guarantee it stays safe:
- **"View original"** is always one tap away on any customized profile — the native, accessible, unstyled layout from `PROFILE.md`.
- Customization is **presentation-only**: it never changes a field's value or its tier visibility. Who-sees-what is identical in both views.

---

## 1 · Three tiers of customization

| Tier | Who | Edits on | What it changes |
|---|---|---|---|
| **Theme (no-code)** | any co-op member | mobile or desktop | accent palette, background (color/image), light/dark, fonts from an allowlist |
| **Layout (no-code)** | any co-op member | mobile or desktop | reorder/place the movable content modules; show/hide *optional* decorative widgets (never core data) |
| **Code (CSS + HTML subset)** | co-op member, **opt-in, admin-gated** | **desktop only** | custom CSS over Bridger's stable classes; a **sanitized, script-free** HTML subset in designated slots |

Ship them in that order. Code tier is behind an **admin flag** (like `AGENT.md`) so it can be tested with a small group before general release — the founder's "I'd like to test it."

---

## 2 · Theme + Layout (no-code — what most people use)

**Theme:** pick an accent from the `DESIGN.md` palette (or a custom color), set a background (solid, gradient from a safe set, or an uploaded image), choose light/dark, and pick a display font from an **allowlisted** set (bundled/hosted by Bridger — never an arbitrary web font URL, see §5). Contrast is auto-checked (§4).

**Layout:** the founder wants members to control **where widgets sit**. So the old "fixed skeleton" softens into **anchored-but-movable**:
- **Anchored (cannot move):** the **header** (photo/name/city/tier control) stays at top, and the **tab bar** stays under it. These are the navigation spine.
- **Movable:** the content modules — Top 5, About me, Current Obsession, Favorites, Places, Recommendations, Life timeline, Greatest hits — can be **reordered and placed** by the owner.
- **Never hidable:** a module that contains data can be *moved* but not *removed* from the page (removing data happens only in the profile editor, and even then it's deletion of the data itself, not a customization). Empty/optional decorative widgets can be added or removed freely.

Because reordering trades away "every profile has hobbies in the same spot," the **"View original"** native layout is the consistency guarantee for anyone who wants it — and a viewer can set a **standing preference to always see original** (taste or accessibility).

---

## 3 · Code tier — custom CSS and a safe HTML subset

This is the MySpace-nostalgia, "could-become-a-huge-deal" tier. It is powerful **and** it is the highest-risk feature in the app, because a profile renders on **other people's devices**. The design below is what makes it safe; none of it is optional.

### 3a · What's allowed

- **Custom CSS** — full CSS scoped to the member's profile, applied over Bridger's **stable, documented class names and slots** (Bridger publishes a "profile stylesheet API": `.bp-header`, `.bp-top5`, `.bp-obsession`, `.bp-card`, slot markers, etc.). This alone gives enormous range — colors, type, spacing, backgrounds, layout, transitions.
- **HTML subset** — a **sanitized, allowlisted** set of tags in designated **content slots** (between sections): headings, paragraphs, `div`/`span`, lists, `img` (Bridger-hosted only), sanitized `a` links, basic formatting. This lets a member add their own captions, dividers, little bespoke blocks.

### 3b · What is forbidden (hard, non-negotiable)

- **No JavaScript, ever** — no `<script>`, no `on*` handlers, no `javascript:` URLs, no `<iframe>`, no `<object>/<embed>`, no `<form>`, no CSS that can execute (no `expression()`, no `-moz-binding`). User content **cannot run code**. This is the line that prevents a profile from stealing data from, phishing, or tracking its viewers.
- **No external network requests** — no external image/font/CSS URLs, no `@import`, no `url()` pointing off-Bridger. **Every asset is uploaded to and served by Bridger** (or proxied). Reason is both security *and* privacy: an external `url()` would leak every viewer's IP/User-Agent to a third-party server the profile owner (or an attacker) controls — a tracking vector that directly violates "you're not the product." All assets same-origin.
- **No overlaying/obscuring** the **"View original"** control, the tab bar, or report/block affordances; the sanitizer/renderer enforces a reserved z-layer for those.

### 3c · How it's enforced (defense in depth)

1. **Sanitize on save** — server-side allowlist sanitizer (tags, attributes, CSS properties/values); anything off-list is stripped and the member sees exactly what was removed. Save is rejected if it can't be made safe.
2. **Sanitize again on render** — never trust stored content; re-sanitize at compose time.
3. **Content Security Policy** — the render context ships a strict CSP: `script-src 'none'`, `default-src 'self'`, `img-src 'self'`, `style-src 'self' 'unsafe-inline'` (inline styles only, no remote), `connect-src 'none'`, `frame-src 'none'`. (`INFRASTRUCTURE.md`.)
4. **Sandboxed render context** — see §6; the WebView runs with JS disabled for user content and no bridge exposed to user markup.
5. **Size + rate limits** — caps on CSS/HTML length and asset count/size (§7).
6. **It's UGC** — a custom profile renders to others, so it's **user-generated content**: it's covered by report/block and human review (`CURSOR-RULES.md` UGC rules). A reported profile can be reverted to native instantly by an operator (`ADMIN.md`).

> **Recommendation to the founder:** ship **custom CSS first**, and treat the HTML subset as a later, smaller addition. CSS over stable classes gets ~95% of the creative payoff (the whole "make it *yours*" feeling) with a far smaller attack surface than markup. You can absolutely test the "huge deal" hypothesis on CSS alone.

---

## 4 · Accessibility (the guarantees customization can't break)

- **"View original"** is always present and can't be obscured — the native, screen-reader-friendly, Dynamic-Type-respecting layout from `PROFILE.md`.
- **Standing preference:** a viewer can choose to always render profiles as original.
- **Contrast checks:** no-code themes run an automatic text-contrast check (≥ 4.5:1); code-tier profiles that fail contrast still fall back cleanly via View original, and the editor warns the author.
- **Reduce Motion:** any CSS animation respects `prefers-reduced-motion` (the renderer injects the media query; user CSS can't opt out of it).
- The customized view is an enhancement layer; **the accessible native view is the source of truth** and is always reachable.

---

## 5 · Assets are Bridger-hosted (security + privacy + storage)

Every custom asset — background images, the allowlisted display fonts, gallery/Greatest-hits photos, Current-Obsession images, module images — is **uploaded to Bridger storage and served same-origin** (or proxied through Bridger). No profile ever references an off-Bridger URL. This one rule delivers three things at once: it closes the external-request tracking/exfiltration hole (§3b), it keeps the CSP simple, and it makes **storage measurable** (§7).

---

## 6 · Rendering: the "mini browser," done as a hybrid

The founder's ask: profiles should feel like they "load in a mini browser," and **the user should never notice it's HTML/CSS inside React.** The safe way to do this is a **hybrid**, not a WebView-everything rewrite:

- **Default / non-customized / "View original" → native.** The profile renders as native React Native components (fast, fully accessible, fully instrumented for analytics). This is the vast majority of views.
- **Code-tier customized profiles → sandboxed WebView.** Only when a profile has custom CSS/HTML do we render it inside a **locked-down `react-native-webview`**: JS disabled for user content, the strict CSP from §3c, same-origin assets only, no native bridge exposed to user markup, chrome hidden so it looks like a seamless page (no address bar, no browser affordances). Bridger generates the canonical HTML (from the same canonical data) and injects the sanitized CSS/HTML — so even here the **content is Bridger's; only the skin is the user's.**

Why hybrid: WebViews are heavier, less accessible, and harder to instrument, so we don't make everyone pay that cost — only opted-in custom profiles use it, and every viewer can drop back to native with View original. Analytics for custom profiles fall back to coarse surface-level events (opened/viewed/view-original) since fine-grained element instrumentation lives in the native path (`ANALYTICS-TAXONOMY.md`).

---

## 7 · Storage: shown honestly, charged fairly

Customization (and co-op media generally) consumes storage, and Bridger shows it plainly rather than hiding the cost — consistent with co-op transparent economics (`COOP-PORTAL.md`).

- **Included allotment:** every co-op member gets a **reasonable included storage amount** (set in `ADMIN.md`/config; e.g. a few GB) covering normal use — background, fonts, a sensible number of photos.
- **Always visible:** Settings → Storage & plan shows **used vs. included**, with the biggest consumers listed, so there are no surprises. The Stories storage bar (`PROFILE.md`) reads from the same meter.
- **Overage is opt-in and transparent:** if a member exceeds the allotment, they're shown the **per-unit overage price before** anything is charged, and can either prune assets or approve the overage. No silent charges, no dark-pattern nudging. (This replaces the retired standalone storage SKU with an included allotment + honest overage.)
- **Deletion frees it immediately** and cascades (`DATA.md`); pruning an asset drops its bytes at once.

Billing reuses the `payments` surface (same as the events cap / co-op dues).

---

## 8 · Free vs co-op

| | Free | Co-op |
|---|---|---|
| Native profile | ✓ (clean default) | ✓ |
| Theme (colors/background/font) | — | ✓ |
| Layout (reorder movable modules) | — | ✓ |
| Custom CSS | — | ✓ (opt-in, admin-gated) |
| HTML subset (sanitized) | — | ✓ (opt-in, admin-gated, later) |
| Greatest-hits photos | — | ✓ (≤3) |
| Storage | rolling free month (stories) | included allotment + honest overage |
| "View original" for viewers | n/a (already native) | always available |

---

## 9 · Data (shapes)

```ts
interface ProfileTheme {                    // no-code; presentation only
  userId: string;
  palette: string;                          // accent/vibe (or custom hex)
  background?: { kind: 'color' | 'gradient' | 'image'; value: string; assetId?: string };
  mode?: 'light' | 'dark';
  fontId?: string;                          // from Bridger's allowlisted, hosted fonts
}

interface ProfileLayout {                   // no-code; order of MOVABLE modules only
  userId: string;
  order: MovableModule[];                    // header + tab bar are fixed, not listed
  decorativeWidgets: DecorWidget[];          // optional, addable/removable (no core data)
}

interface ProfileCustomCode {               // code tier; opt-in, admin-gated
  userId: string;
  css?: string;                              // sanitized, scoped to .bp-* classes
  htmlBlocks?: { slot: SlotId; html: string }[];  // sanitized subset, in slots
  sanitizedAt: string;                       // set by server sanitizer; render trusts nothing
  status: 'active' | 'reverted';             // operators can revert to native
}

interface StorageMeter {
  userId: string;
  usedBytes: number;
  includedBytes: number;                     // co-op allotment (config)
  overageBytes: number;                      // billable, only after explicit opt-in
}

interface ViewerPref { userId: string; alwaysViewOriginal: boolean; }
```

Core content is **not** stored here — it stays in `attributes`/`profiles`. This layer only stores the **skin** (theme, layout order, sanitized code) and the **meter**, so canonical data and tier visibility can never drift from a customization.

---

## 10 · Module mapping

| Piece | Backend |
|---|---|
| Customize entry (co-op-gated) | `profiles` + `coop` (membership) |
| Theme / layout (no-code) | `profiles` |
| Custom CSS/HTML (opt-in) | `profiles` + sanitizer service + admin flag |
| Sanitization (save + render) | server allowlist sanitizer + CSP |
| Sandboxed WebView render | `react-native-webview` + CSP (`INFRASTRUCTURE.md`) |
| Assets (same-origin) | Storage + asset proxy |
| Storage meter + overage | storage meter + `payments` |
| "View original" / viewer pref | `profiles` (render toggle) |
| Report / revert a custom profile | UGC report path + `ADMIN.md` |

---

## 11 · Acceptance criteria

- [ ] Customization is **presentation-only**: it never changes, hides, or deletes canonical fields or their tier visibility; core sections are injected by Bridger and cannot be removed by a theme.
- [ ] **"View original"** is present, unobscurable, and one tap away on every customized profile; a viewer can set a standing "always original" preference.
- [ ] No-code **Theme** (palette, background, light/dark, allowlisted hosted font) and **Layout** (reorder movable modules; header + tab bar anchored) work on mobile.
- [ ] **Code tier is desktop-only, opt-in, and admin-gated**; ships after no-code, CSS before the HTML subset.
- [ ] Custom **CSS** is scoped to Bridger's stable classes; custom **HTML** is a sanitized allowlisted subset in slots.
- [ ] **No JavaScript** from user content (no scripts, handlers, `javascript:`, iframes, forms, CSS execution); enforced by sanitizer + CSP + JS-disabled render.
- [ ] **No external requests**: no off-Bridger URLs, `@import`, or remote `url()`; **all assets are Bridger-hosted/proxied same-origin** (closes the viewer-tracking hole).
- [ ] Content is **sanitized on save and again on render**; the editor shows what was stripped; unsafe saves are rejected.
- [ ] Customized code-tier profiles render in a **sandboxed WebView** with strict CSP and hidden chrome; default/original profiles render **native**.
- [ ] Accessibility guarantees hold: contrast checks, `prefers-reduced-motion` enforced by the renderer, native original as the accessible source of truth.
- [ ] **Storage** shows used vs. included with top consumers; overage price is shown **before** any charge and is opt-in; deletion frees space immediately.
- [ ] A custom profile is treated as **UGC**: covered by report/block + human review, and operator-revertible to native.
