# Bridger — Delight & Easter Eggs

A system for adding quirky, joyful little extras — pet companions, emoji bombs, seasonal surprises — **without any risk to the core app or its UI**. Same isolation philosophy as the quiz plugins (`ADMIN.md`): each easter egg is a self-contained, flag-gated plugin you can build, toggle, or delete on its own.

This is deliberately separate from the always-on story reaction motion (floating comment balloons, emoji bursts) in `STORIES.md` — that's core. Delight is the layer of **optional, toggleable surprises** on top.

---

## The rule: quirks can never break the app

Every delight lives in its own folder behind its own flag. The core app renders normally whether a delight is on, off, half-built, or removed. You can hand an AI "build a pet-cat companion" and it works entirely inside one folder with zero blast radius — exactly like a quiz.

```
apps/mobile/delight/
├── _host/                      # mounts enabled delights; a no-op when none are on
├── registry.ts                 # list of delights + on/off flag + scope
├── pet-cat/
│   ├── manifest.ts             # id, name, flag, scope (global | opt-in | gift)
│   ├── Delight.tsx             # the effect, fully self-contained
│   └── styles.module.css       # SCOPED — cannot leak into the app
├── emoji-bomb/
└── confetti-moment/
```

- **New delight = new folder.** Nothing outside it changes.
- **Scoped styles + isolated component.** A delight can't restyle or break the app UI.
- **The registry** is the one shared file — a list of `{ id, enabled, scope }`. Adding a delight appends one entry; disabling it flips one flag.
- **Fail-safe:** if a delight errors, it's caught and skipped — the app never goes down for a bit of fun.
- Motion follows the same rules as everywhere: transform/opacity only, `prefers-reduced-motion` respected.

---

## Kinds of delight (scope)

| Scope | Meaning | Example |
|---|---|---|
| `global` | On for everyone when enabled | seasonal confetti, a holiday theme |
| `opt-in` | A user turns it on for themselves | a **pet cat** companion on your profile/home |
| `gift` | One user triggers it *at* another | **emoji bomb** — "you've been emoji-bombed by Priya" rains emojis when they open the app |

---

## Admin control

The admin console (`ADMIN.md`) has a **Delights** panel:
- Toggle each registered delight on/off.
- Set its scope and any schedule (e.g. confetti only in December).
- Scaffold a **new delight** (creates a fresh folder).

Because it's all flags over isolated folders, you can experiment on a live app safely — flip something on, see if people love it, flip it off if not.

---

## Data (shapes)

```ts
interface DelightEntry {
  id: string;
  name: string;
  enabled: boolean;
  scope: 'global' | 'opt-in' | 'gift';
  schedule?: { from: string; to: string };  // optional window
}

interface DelightTrigger {          // for 'gift' delights
  delightId: string;
  fromUserId: string;
  toUserId: string;                 // plays on their next app open
}
```

---

## Module mapping

| Piece | Where |
|---|---|
| Delight plugins + host + registry | `apps/mobile/delight/*` |
| Enable/disable, scope, schedule, scaffold | admin console (`ADMIN.md`) |
| Gift triggers (emoji bomb, etc.) | `notifications` / a small `delight` API surface |

---

## Acceptance criteria

- [ ] Each delight is its own folder with scoped styles; building/removing one never affects the app or other delights.
- [ ] The registry is the only shared file; toggling a delight flips one flag.
- [ ] A failing delight is caught and skipped — it can never take down the app.
- [ ] Delights support global, opt-in, and gift scopes.
- [ ] Gift delights (e.g. emoji bomb) play on the recipient's next app open with attribution ("emoji-bombed by {name}").
- [ ] The admin console can toggle, scope, schedule, and scaffold delights.
- [ ] All delight motion is transform/opacity only and respects `prefers-reduced-motion`.
