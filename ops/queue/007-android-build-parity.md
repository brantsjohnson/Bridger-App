---
id: 007
title: Finish Android parity so an internal-test build can ship
owner: cursor
status: todo
risk: high
priority: p1
area: mobile
needs:
created: 2026-09-14
updated: 2026-09-14
pr:
bug:
---

## Why

Brant says Android is "almost hooked up". Public release needs both stores.

## Done means

- [ ] EAS Android build profile produces an installable internal-test AAB
- [ ] Sign-in (Apple sign-in fallback, Google, phone OTP per the Sept decisions) works on a Pixel and a Samsung
- [ ] Keyboard avoiding, safe areas, and back-gesture behavior match iOS on onboarding, composer, and messages
- [ ] Play Data safety form draft matches `PRIVACY.md`
- [ ] Known gaps written to `ops/BUGS.md`

## Notes and handoffs

2026-09-14 claude: filed from Brant's brief; Cursor owns because it needs the emulator. Claude will do the Play Data safety draft when asked.
