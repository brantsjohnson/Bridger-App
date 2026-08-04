# Bridger — Profile Customization (co-op)

How a **co-op member** personalizes their profile page — and the two rules that keep it from breaking legibility or accessibility. This is the detailed spec behind the "Personalization (co-op)" note in `PROFILE.md` and the flagship benefit in `COOP.md`.

**Where:** Profile → **Settings → "Customize your profile page."** The option only appears for co-op members. Free members have the clean default page (which is also everyone's fallback — see below).

---

## What a co-op member can change

- **Background image** — set a custom background for their profile page (or a solid/coloured backdrop).
- **Colors / vibe** — pick an accent palette / theme so the page feels like them.
- **More photos** — add photo/gallery widgets beyond the single header photo.
- **Custom widgets** — insert their own widgets **into the gaps between the core widgets** (see the order rule).

---

## Rule 1 — the core widgets are a fixed, ordered skeleton

The core profile widgets always render **in the same order and the same positions** for everyone:

`Header → Currently → Hobbies → Places map → This-or-that → About me → Favs → Inside Jokes`

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

- A persistent **"View original"** control sits on every customized profile.
- Customization is **presentation only** — it never changes the underlying fields or their tier visibility, so who-sees-what is identical in both views.
- **Contrast/readability safeguards:** custom colors/backgrounds should preserve legible text contrast; where a theme can't be made legible, the app still guarantees the original view as the accessible fallback.
- A viewer can also set a **standing preference** to always see original pages (for accessibility or simple taste).

---

## Free vs co-op

| | Free | Co-op |
|---|---|---|
| Profile page | Clean default | Default **+ customization** |
| Background / colors | — | ✓ |
| Extra photos / custom widgets | — | ✓ (in the insert slots) |
| Core widget order | Fixed | Fixed (same for all) |
| "View original" for viewers | n/a | Always available |

---

## Data (shapes)

```ts
interface ProfileTheme {              // co-op only; presentation layer
  userId: string;
  backgroundImageId?: string;         // or a solid color
  palette: string;                    // accent/vibe
}

interface CustomWidget {
  id: string;
  userId: string;
  afterCoreWidget: 'header' | 'currently' | 'hobbies' | 'placesMap'
                 | 'thisOrThat' | 'aboutMe' | 'favs' | 'quips';   // the slot it sits after
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
| Theme (background, palette) | `profiles` |
| Custom widgets + slots | `profiles` |
| "View original" / viewer pref | `profiles` (render toggle) |

---

## Acceptance criteria

- [ ] The "Customize your profile page" option appears only for co-op members, under Profile → Settings.
- [ ] Members can set a background image, an accent/vibe palette, add photos, and add custom widgets.
- [ ] Core widgets always render in the same fixed order and positions; members cannot reorder, move, or remove them.
- [ ] Custom widgets can only be inserted into the slots between core widgets.
- [ ] Every customized profile exposes a persistent "View original" that shows the default page; a viewer can also set a standing preference to always view original.
- [ ] Customization is presentation-only — underlying fields and tier visibility are unchanged in either view.
- [ ] Free members have the default page only.
