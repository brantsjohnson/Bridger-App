# Bridger — Profile Customization (co-op)

How a **co-op member** personalizes their profile page — and the two rules that keep it from breaking legibility or accessibility. This is the detailed spec behind the "Personalization (co-op)" note in `PROFILE.md` and the flagship benefit in `COOP.md`.

**Where:** two doors, same editor — Profile → **Edit → "Customize your page"** (the same Edit button that makes your photo, city, song and bio editable in place), and Profile → **Settings → "Customize your page."** Either way the profile itself only ever shows the *result*, never the controls. The option only appears for co-op members. Free members have the clean default page (which is also everyone's fallback — see below).

The goal is plainly **MySpace-level expression with no code**. A background photo, your own colors, a typeface, a corner shape, and your own widgets — every one of them a tappable choice, never a text box you paste CSS into.

---

## What a co-op member can change

Everything below is one screen, with a **live preview** at the top showing exactly what a friend will see.

| Control | Choices |
|---|---|
| **Start with a look** | Six presets: Bridger, Midnight, Garden, Arcade, Scrapbook, Dusk. One tap sets every value below; then change any part of it. |
| **Background photo** | None, five built-in backgrounds (Stars, Flowers, Grid, Paper, Sunset), or upload your own. Plus how much the page sits on top of it: Full photo / Softened / Faded. |
| **Page color** | The canvas behind everything. Swatches plus a full custom color picker. |
| **Card color** | Every panel and card on the page. |
| **Words** | The text color. |
| **Highlights** | The accent: buttons, pins, the Currently panel, chips. |
| **Type** | Clean, Serif, Pixel, Mono, Round. |
| **Corners** | Round, Soft, Square. |
| **Your widgets** | Photos, Text, Quote, Pinned, Link — each dropped into a named slot between two core widgets. |
| **Reset to plain** | One tap back to the default page. |

**How it renders:** `ProfileSkin` wraps the profile and overrides the same design-system theme tokens the whole app already reads (`--canvas`, `--surface`, `--ink`, `--ink-line`, plus `--profile-accent`, `--profile-font`, `--profile-corners`). Every card, border and bit of text inside re-skins itself with no per-component work, exactly the way dark mode works. Derived tones (soft/muted text, hairlines) are computed from the chosen text color, so contrast holds up at both ends of the range. Solid-ink panels take the owner's highlight color instead of raw ink, so white text on them stays legible under a dark skin.

---

## Rule 1 — the core widgets are a fixed, ordered skeleton

The core profile widgets always render **in the same order and the same positions** for everyone:

`Header → Currently → Hobbies → Places map → This-or-that → About me → Favs → Inside jokes`

- Members **cannot reorder** the core widgets, **cannot move** them around the screen, and cannot remove them. The order is the same on every profile.
- **Why:** consistency is what keeps profiles legible. Anyone can find your hobbies or your map in the same place on any profile — customization never makes a page you have to re-learn.

**What members *can* do:** between any two core widgets there's an **insert slot**. Members drop their **custom widgets into those slots** — so personalization lives *in the gaps*, never by rearranging the backbone.

```
[Header]
  + your widget(s)
[Currently]
  + your widget(s)
[Hobbies]
  + your widget(s)
[Places map]
  …and so on
```

### Custom widget types (a defined palette)
Keep it a clean set, not freeform HTML: **Photos / gallery**, **Text note / blurb**, **Pinned quote**, **Pinned favorite** (a book, song, place…), **Link**. (Extendable later.) Each custom widget carries its own tier visibility like any other field.

---

## Rule 2 — the original page is always one tap away (accessibility)

Non-negotiable: **any viewer can always switch a customized profile to the original/default view** — the fixed core widgets, no custom background, default colors, no inserted widgets.

- A persistent control sits **in the header of every customized profile you visit, right beside the message button** — a small sparkle button that toggles the page to its plain version. Same place on every profile, always reachable, and it takes no vertical space away from the page itself.
- It is a **viewer's** control only. It never appears on your own profile: there you simply see your saved look, and **"Reset to plain"** lives in the editor. A viewer's standing "always show plain pages" preference (Settings) applies to other people's pages, not your own.
- Customization is **presentation only** — it never changes the underlying fields or their tier visibility, so who-sees-what is identical in both views.
- **Contrast/readability safeguards:** custom colors/backgrounds should preserve legible text contrast; where a theme can't be made legible, the app still guarantees the original view as the accessible fallback.
- A viewer can also set a **standing preference** to always see original pages (for accessibility or simple taste).

---

## Free vs co-op

| | Free | Co-op |
|---|---|---|
| Profile page | Clean default | Default **+ customization** |
| Background photo | — | ✓ (presets or upload) |
| Page / card / text / accent colors | — | ✓ (swatches + custom picker) |
| Typeface & corner shape | — | ✓ |
| Extra photos / custom widgets | — | ✓ (in the insert slots) |
| Core widget order | Fixed | Fixed (same for all) |
| "View original" for viewers | n/a | Always available |

---

## Data (shapes)

```ts
interface ProfileTheme {              // co-op only; presentation layer
  userId: string;
  backgroundId: string | null;        // preset id, 'upload', or none
  backgroundUrl?: string;
  backgroundVeil: 'clear' | 'soft' | 'heavy';
  pageColor: string;                  // hex
  cardColor: string;
  textColor: string;
  accentColor: string;
  font: 'clean' | 'serif' | 'pixel' | 'mono' | 'round';
  corners: 'round' | 'soft' | 'square';
}

interface CustomWidget {
  id: string;
  userId: string;
  afterCoreWidget: 'header' | 'currently' | 'hobbies' | 'placesMap'
                 | 'thisOrThat' | 'aboutMe' | 'favs' | 'insideJokes'; // the slot it sits after
  order: number;                      // among custom widgets in the same slot
  type: 'photos' | 'text' | 'quote' | 'pinned' | 'link';
  content: unknown;
  visibleToTier: 'close' | 'friend' | 'acquaintance';
}

interface ViewerPref { userId: string; alwaysViewOriginal: boolean; }
```

Core widget order is **not** stored per-user — it's a constant. Only the theme and the custom widgets (with their slot) are stored, so the skeleton can never drift.

---

## Module mapping

| Piece | Backend |
|---|---|
| Customize entry (co-op-gated) | `profiles` + `coop` (membership check) |
| Theme (background, colors, type, corners) | `profiles` |
| Custom widgets + slots | `profiles` |
| "View original" / viewer pref | `profiles` (render toggle) |

---

## Acceptance criteria

- [ ] The "Customize your profile page" option appears only for co-op members, under Profile → Settings.
- [ ] Members can set a background photo (preset or their own), page/card/text/accent colors, a typeface, and a corner shape, and add custom widgets — all from Settings, with a live preview and no code.
- [ ] Presets set a whole look in one tap, and any single value can still be changed afterward.
- [ ] "Reset to plain" returns the page to the default in one tap.
- [ ] Core widgets always render in the same fixed order and positions; members cannot reorder, move, or remove them.
- [ ] Custom widgets can only be inserted into the slots between core widgets.
- [ ] Every customized profile exposes a persistent "View original" that shows the default page; a viewer can also set a standing preference to always view original.
- [ ] Customization is presentation-only — underlying fields and tier visibility are unchanged in either view.
- [ ] Free members have the default page only.
