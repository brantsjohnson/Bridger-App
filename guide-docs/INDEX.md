# INDEX.md — The Bridger doc set (start here)

24 documents = the complete contract for building Bridger. **`CURSOR-RULES.md` governs how to work; this file is the map.**

## Reading order for a fresh build

1. `CURSOR-RULES.md` — standing rules (re-read every session)
2. `INFRASTRUCTURE.md` — stack, hosting, secrets, no-blockchain, build order
3. `ARCHITECTURE.md` — monorepo, modules, routes, the tagged-attribute idea
4. `DATA.md` — full schema, privacy zones A/B/C, RLS, deletion
5. `DESIGN.md` + `MAGIC-PATTERNS.md` — visual language + component library
6. Then feature docs as you build each surface.

## The docs

| Doc | What it owns |
|---|---|
| `CURSOR-RULES.md` | Standing agent rules: stack lock, Magic Patterns UI law, accessibility/app-store compliance, plain-language comments, privacy invariants |
| `analytics-rules.mdc` | Analytics engineering standard (always-on Cursor rule): every component measurable + auto-instrumented; first-party, consented, de-identified, deletable |
| `naming-rules.mdc` | Always-on rule: every element gets a unique `screen.section.element` ID, registered in the taxonomy |
| `analytics-enforcement.mdc` | Always-on **conformance gate**: every code change must pass the naming/taxonomy checklist and emit PostHog-ready events before it's done |
| `ANALYTICS-TAXONOMY.md` | The naming master sheet — canonical registry of every screen, section, and element ID (source of truth) |
| `ANALYTICS-README.md` | Plain-English analytics guide for the PM (frustration map, funnels, the privacy promise) |
| `INDEX.md` | This map + canonical decisions |
| `INFRASTRUCTURE.md` | Expo→iOS/Android/web, NestJS on AWS App Runner, Supabase, server-side AI keys, IaC/CI, 10-step build order |
| `ARCHITECTURE.md` | Monorepo layout, domain modules, mobile routes, connect/reveal flow, build phases |
| `DATA.md` | Schema (all tables), Zones A/B/C, RLS, blocks, deletion cascades, AI de-identification |
| `DESIGN.md` | Retro-modern flat UI: eggshell/black, pixel headers, metallic bevels, floating nav, Discover grid, motion rules |
| `MAGIC-PATTERNS.md` | Component inventory + screen→doc map (the UI library contract) |
| `complete/ONBOARDING.md` | **Shipped.** One-ask-per-screen flow (single progress bar, Back button): privacy → name first (first+last) → photo → nudges → explain the 3 circles + invite a friend → meet (same-city Coming soon / anywhere, city required) → birthday → who-sees birthday+city → co-op (Apple/Google Pay/Card, "Use Free Limited Version") → you're in; root gate blocks the app until done |
| `complete/HOME.md` | **Shipped.** Announcements carousel, stories + "what people said," touch grass, ask-the-group (co-op), this-week, inside-jokes strip, cold start |
| `complete/STORIES.md` | **Shipped.** Updates framing, capture rules, viewer + reaction rail, the Catch-Up (compact top → week hero → answered), pre-generated word-only AI summaries |
| `complete/PROFILE.md` | **Shipped.** Shared card (one card, two views), tabs incl. Bucket List, hobbies 2-view widget, this-or-that columns, places 2-view, Inside Jokes wall, stories calendar, notes & reminders, settings |
| `PROFILE-QUESTIONS.md` | The full question bank: basics, ~95 hobby follow-ups, favs, places, this-or-that, bucket list, deeper questions |
| `PROFILE-CUSTOMIZATION.md` | Co-op personalization: fixed core-widget skeleton + insert slots + always-available "View original" |
| `complete/FRIENDS.md` | **Shipped.** Tiered roster, circle caps (free 10/25/∞ · co-op unlimited+groups), birthdays, how-you-met, remove/block ("hole in your graph"), add sheet |
| `complete/DISCOVER.md` | **Shipped.** Overlap-first suggestion cards (Bridger's picks, "you both know X"), Discover Me questionnaire, friend maps, block exclusion, friends-of-friends today / nearby later |
| `complete/REVEAL.md` | **Shipped.** Connection reveal: Screen 0 how-you-met (+ record-where default-on) → Venn → also-got → "You two should click."; re-openable as In common on person/[id] |
| `complete/EVENTS.md` | **Shipped.** Rich detail (cover, address, share sheet), tappable counts, editable host view (co-host, chip-in amount+method), allergies, touch grass on Events, 35/100 caps |
| `complete/MESSAGES.md` | **Shipped.** 5-per-person/day chat, contact card, maxed-out notice, share-contact/make-a-plan uncounted; E2EE at rest (staff cannot read plaintext) |
| `RECAP-PODCAST.md` | Weekly 5-question voice recap stitched into one podcast with speaker pop-ups |
| `TOUCHGRASS-AND-QUIZ.md` | Touch Grass mechanics (Home + Events, featured+list, why) + quiz share / who-got-who dashboard |
| `QUIZ-ENGINE.md` | Deterministic rubric scoring + AI moderator (confidence, low-quality flags, bounded adaptation, per-quiz instructions) |
| `COOP.md` | Membership benefits + never-pay-to-connect guardrails + single annual membership |
| `COOP-PORTAL.md` | The governance portal (ideas CRM, beta votes, mission, economics, roles, dues poll) — public view / member participate |
| `ADMIN.md` | Organizer console (separate repo), isolated quiz/delight plugins, themed prompts, weekly activity hosting |
| `DELIGHT.md` | Easter-egg plugin system (isolated, flag-gated, fail-safe) |

## Canonical decisions (if any doc seems to disagree, these win)

- **User-facing names:** "Updates" (not stories), "Inside Jokes" (not quips), "Touch Grass," "The Catch-Up." Internal module names unchanged.
- **Payments:** one annual co-op membership; standalone SKUs (storage $2/mo, per-event fees) are **retired**.
- **Never gate connection**; anyone can view co-op content; answering polls free, creating them co-op.
- **No vanity metrics** anywhere; events show "you know going" + "to meet" (host also sees invited).
- **Privacy:** capture-only (profile photo = the one upload exception); summaries from words never photos, pre-generated at post time; matching on de-identified opaque IDs; blocks cut the graph locally; hard deletes.
- **Home top = announcements carousel** (touch grass · quick check · co-op · coming up), hidden when empty; TOUCH GRASS send button always visible.
- **Profile tabs:** Profile · Stories · Inside Jokes · Bucket List (+ Settings gear). No polls on the profile.
- **Co-op portal** is integrated at `/co-op` (not external); reads public, writes member.
- **Analytics** is required on every component (auto-instrumented) but **first-party, consented, de-identified, deletable, never sold or fed to matching** — see `analytics-rules.mdc`.
- **Every element is uniquely named** `screen.section.element`, registered in `ANALYTICS-TAXONOMY.md` (the naming source of truth); element names are reused across screens, never screen-prefixed.
- **No blockchain.**
