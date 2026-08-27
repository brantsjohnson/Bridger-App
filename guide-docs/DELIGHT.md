# Bridger — Delight (umbrella guide for delighters)

Delight is **not one feature** and **not a closed list of easter eggs**.

It is the **umbrella for delighters**: optional things that are **not necessary** for the app to work, but make Bridger feel **enjoyable or exciting**. You will keep inventing new ones. This guide, the admin Surprises backlog, and the code folders exist so those ideas have a home, and so Cursor knows how to add them without risking the core app.

| Term | Meaning |
|---|---|
| **Delight** | The umbrella / guide / system |
| **Delighter** | One optional fun thing under that umbrella |
| **Idea** | Thought of, not built yet (lives in admin + optional CATALOG notes) |
| **Built / live** | Code exists / users can actually get it |

**Worked example in progress:** emoji bombing a friend (gift on their next app open).

Read with `ADMIN.md` (Surprises panel), `NOTIFICATIONS.md` (`delight_gift`), `ARCHITECTURE.md` (folder map), and `apps/mobile/delight/CATALOG.md` (living index).

---

## 1 · What belongs under Delight

A delighter must be **all** of:

- **Optional** — the app fully works with every delighter off or removed
- **Non-load-bearing** — never required to connect, message, RSVP, post, or discover
- **Fail-safe** — a crash inside a delighter is caught; the core app stays up
- **Toggleable** — admin can turn standalone delighters off; ideas cannot go live by accident
- **Motion-safe** — transform/opacity only; respects `prefers-reduced-motion`

Examples of the *kind* of thing that belongs here: gift surprises, seasonal moments, opt-in companions, reusable button bursts, tiny playful overlays.

---

## 2 · What does not belong

- **Core UX** already owned by a feature doc (e.g. story reaction balloons and emoji bursts on Updates stay in `STORIES.md`)
- Anything **required** to use Bridger
- Privacy, matching, payments, or account flows (those need their own docs)
- Heavy product surfaces that deserve their own build doc (put a thin delight hook here, the feature elsewhere)

---

## 3 · How a delighter can show up

| Kind | How it runs | Example |
|---|---|---|
| **Standalone plugin** | `DelightHost` mounts it when admin status is `live`, `enabled`, in schedule, and scope rules match | Gift: emoji-bomb on next open · Global: seasonal overlay · Opt-in: companion the user turned on |
| **Reusable effect** | A real screen **imports** it and triggers it locally (button press, success moment) | Emoji rain over a quiz CTA |

Scopes for **standalone** plugins:

| Scope | Meaning |
|---|---|
| `gift` | One person sends it at another; plays on the recipient's next open |
| `global` | On for everyone when live + enabled (+ schedule) |
| `opt-in` | User turns it on for themselves in Settings |

---

## 4 · Where code and designs live

```
apps/mobile/delight/
├── _host/                      # mounts standalone plugins; fail-safe
├── registry.ts                 # standalone plugins only (slug → lazy load)
├── CATALOG.md                  # living index for humans + Cursor
├── effects/                    # REUSABLE library pieces (import anywhere)
│   ├── README.md
│   └── emoji-rain/
└── plugins/                    # STANDALONE host-mounted delighters
    └── emoji-bomb/
```

**Cursor rule (do not invent folders):**

- New **reusable** motion/design → `apps/mobile/delight/effects/<slug>/`
- New **standalone** surprise → `apps/mobile/delight/plugins/<slug>/` + one `registry.ts` line + admin row
- Feature screens only **import** from `effects/` or rely on the host. Never copy-paste rain/confetti into random feature folders.

React Native uses `StyleSheet` inside each folder (scoped enough for RN). Failures go through `DelightErrorBoundary`.

---

## 5 · How to add a new idea

1. **Park it in Admin → Surprises** with name, slug, kind (`standalone` or `effect`), scope (if standalone), and notes ("might put on quiz button"). Status stays `idea`. Cannot enable.
2. When ready to code: run `pnpm delight:scaffold -- <slug> --kind …` (creates the right folder stub).
3. Build inside that folder. Flip admin status to `built`, then `live` when you want users to get a standalone plugin. Effects are catalog truth; screens import them when ready.
4. Optionally add a line to `apps/mobile/delight/CATALOG.md` when code lands.

This list of ideas is **incomplete on purpose**. New whims do not require rewriting this whole guide.

---

## 6 · How Cursor should work

1. Read **this guide** + `apps/mobile/delight/CATALOG.md` before adding any delighter.
2. Prefer extracting shared motion into `effects/` so multiple screens can reuse it.
3. Wrap host-mounted plugins in the existing error boundary path.
4. Register analytics IDs in `ANALYTICS-TAXONOMY.md` for new interactive surfaces (send sheets, settings toggles).
5. Gift sends emit product events on **confirmed** send/play (`delight_gifted` / `delight_played`) with `delight_slug` only — never names.
6. Update PRIVACY/TERMS if a delighter stores new user data (gifts already do via `delight_triggers`).

---

## 7 · Worked example: emoji-bomb (gift)

**Parked (off).** Built, not shown on profiles. Restore with `EMOJI_BOMB_LIVE = true` in `apps/mobile/data/delight.ts` plus admin `enabled` + `status=live`.

- **Send:** friend profile → Emoji bomb → confirm sheet → `POST /delights/triggers`
- **Rules:** friends only, no self, no duplicate unplayed trigger; delight must be `live` + `enabled` + scope `gift`
- **Notify:** `delight_gift` → Home (`NOTIFICATIONS.md`)
- **Play:** recipient's next open via `DelightHost`; attribution like `emoji-bombed by {firstName}`
- **Reuse:** rain lives in `effects/emoji-rain`; the plugin is a thin gift wrapper

---

## 8 · Open backlog (examples only)

Examples you might see in admin or CATALOG — **not commitments**:

- pet-cat (opt-in companion)
- confetti-moment (global seasonal)
- emoji-rain (reusable effect)

Add more anytime.

---

## 9 · Admin control

Admin **Surprises** (`ADMIN.md`):

- Open backlog: `idea` / `built` / `live` + notes + kind
- For standalone live rows: toggle enabled, scope, schedule
- Ideas cannot be enabled
- Scaffold is a **repo script** (`pnpm delight:scaffold`); admin shows the command (App Runner cannot write into the mobile package)

---

## 10 · Data shapes

```ts
type DelightStatus = 'idea' | 'built' | 'live';
type DelightKind = 'standalone' | 'effect';
type DelightScope = 'global' | 'opt-in' | 'gift';

interface DelightEntry {
  id: string;
  slug: string;
  name: string;
  status: DelightStatus;
  kind: DelightKind;
  notes: string;
  enabled: boolean;              // standalone live only
  scope: DelightScope;
  schedule?: { from?: string; to?: string };
}

interface DelightTrigger {       // gift only
  delightId: string;
  fromUserId: string;
  toUserId: string;
  played: boolean;
}
```

Opt-in prefs: `user_settings.delight_opt_ins` (plugin slugs).

---

## Acceptance criteria (system + first delighter)

- [x] DELIGHT.md is an umbrella guide: optional fun, open-ended, where code lives, how to add ideas, Cursor rules.
- [x] Admin Surprises is an open backlog (idea / built / live + notes); ideas cannot go live.
- [x] `effects/` + `plugins/` layout exists; CATALOG.md indexes what we know so far (incomplete on purpose).
- [x] Emoji rain is a reusable effect; emoji-bomb plugin uses it.
- [x] Emoji bombing a friend works end-to-end with attribution, notification kind, and analytics.
- [x] Host gift path is solid; global/opt-in paths exist and no-op safely with zero plugins of those scopes.
- [x] A failing delighter cannot take down the app.
- [x] Motion for shipped delighter code is transform/opacity only and respects reduce motion.

Verified: 2026-08-07 (system + emoji-bomb). Umbrella stays [BUILDING] in INDEX; ideas remain open forever.
