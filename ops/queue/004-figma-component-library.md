---
id: 004
title: Build a Figma-ready component library from the Magic Patterns code so the UX designer stops recreating things
owner: claude
status: todo
risk: low
priority: p2
area: design
needs: decision
created: 2026-09-14
updated: 2026-09-14
pr:
bug:
---

## Why

The designer rebuilds Bridger components by hand in Figma. The source of truth already exists in code (`design/magic-patterns/` and `packages/ui`). Turning it into a Figma library means new screens are designed with the real buttons, type floors, and tokens.

## Done means

- [ ] Decide the path with Brant: (a) Figma Dev Mode "Code Connect" mapping from `packages/ui` components, (b) an HTML component sheet published as a Claude Design system and imported to Figma via the html.to.design plugin, or (c) a token export (`DESIGN.md` colors, `TYPOGRAPHY.md` sizes) to Figma variables plus a manually built kit
- [ ] Inventory of components from `MAGIC-PATTERNS.md` with variants and states
- [ ] Deliverable the designer can open today, plus a short README on how it stays in sync

## Notes and handoffs

2026-09-14 claude: needs the designer's Figma workspace and a decision on (a)/(b)/(c). Recommend (b) first (fastest, zero Figma plan requirements), then (a) once the designer is on a paid Figma seat.
