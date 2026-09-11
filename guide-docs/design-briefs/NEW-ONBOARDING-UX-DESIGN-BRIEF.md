# New Onboarding: UX / UI / motion design brief

Status: **preview only**. TestFlight and live accounts still use **Old Onboarding**. This brief is for designing **New Onboarding** (the story tour) so the screens feel structured, researched, and native to Bridger.

---

## Copy-paste prompt (give this to Claude)

```
You are a senior product designer and UX researcher working inside the Bridger repo.

Job: design and implement the VISUAL STRUCTURE, layout, graphics, and motion for NEW ONBOARDING only. The words and screen order already exist. The screens are currently placeholder-y and not structured enough. Make every screen feel like a real product moment, not a stack of text plus a labeled box.

Do NOT restyle Old Onboarding (the current TestFlight 19-step flow). Do NOT change live routing. Real accounts must keep using Old until a human flips the switch.

Name of this work: New Onboarding (code: flowVariant = "new"). Demo password to preview: "onboard". Old Onboarding demo password: "onboardold".

Read first:
1. This brief (guide-docs/design-briefs/NEW-ONBOARDING-UX-DESIGN-BRIEF.md)
2. guide-docs/complete/ONBOARDING.md section "NEW ONBOARDING"
3. guide-docs/DESIGN.md (especially "Onboarding is its own room")
4. guide-docs/MAGIC-PATTERNS.md
5. apps/mobile/components/onboarding/onboarding-new-copy.ts (copy is locked unless a heading is unreadable)
6. apps/mobile/components/onboarding/tour/VisualSlot.tsx (replace every placeholder)
7. apps/mobile/components/onboarding/NewOnboardingDispatcher.tsx

Think like an expert in mobile onboarding UX. Before you invent a pattern, look up current research and name it in a short "Why this" note (plain English, no em dashes):
- first-run completion and drop-off (one job per screen, progress honesty, skip vs required)
- how products teach privacy without a wall of legal text (progressive disclosure, concrete examples)
- choice architecture for multi-select (Co-op 6, Product 2) so empty is allowed but choosing feels rewarding
- story / card pacing, tap-to-advance, and Reduce Motion (WCAG 2.2, prefers-reduced-motion)
- onboarding that educates after a tiny profile, not a 19-step form

Then design the system: type hierarchy, visual slot, CTA rhythm, how story cards differ from explainers, how Groups are shown (nested, not three equal cards shouting "circles"). Match Bridger: eggshell canvas, pixel question headers, square navy-outlined paper, pink Continue, metallic only if DESIGN.md says so. No new gradients. No drop shadows. No em dashes in copy.

Scope: after sign-in (or demo onboard) through landing on Home. That is first name, last name, photo, birthday, why Bridger, privacy-with-birthday, groups, custom-groups, co-op story, optional join/invite, what would help, then only the selected feature tours.

Success: a testers can walk New Onboarding and feel a designed sequence. VisualSlot is no longer a labeled emoji box. Reduce Motion still works. analyticsIds stay. Copy stays. Old Onboarding is untouched.
```

---

## 0. Names (do not mix these up)

| Name | Who sees it | How to open it | Code |
|---|---|---|---|
| **New Onboarding** (story tour) | Design / preview only | Long-press Bridger logo on Sign in, password `onboard` | `flowVariant = 'new'` |
| **Old Onboarding** | TestFlight and live app | Default for real accounts. Demo password `onboardold` | `flowVariant = 'old'` |

Live routing is locked in `apps/mobile/lib/demo.ts`: `getOnboardingFlowVariant()` returns `'old'` unless demo mode is on. Do not flip that while designing.

---

## 1. The problem (why this brief exists)

The New flow's **words and branching already work**. What is weak is the **screen design**:

- Most education screens are heading + paragraph + a `VisualSlot` placeholder (emoji + title in a navy box).
- Story vs explainer vs choice do not have a distinct visual language yet. They mostly share the same stack.
- Groups, nested privacy, Touch Grass, scrapbook pages, and friends-of-friends are **told**, not shown.
- The four profile fields (name, photo, birthday) are closer to done. The long education run after birthday is the design job.

You are not being asked to invent a new product story. You are being asked to make the existing story **look and move like Bridger**.

---

## 2. What already exists (start here, do not rewrite the engine)

| Piece | File |
|---|---|
| Screen order + locked copy | `apps/mobile/components/onboarding/onboarding-new-copy.ts` |
| Paints the right archetype | `apps/mobile/components/onboarding/NewOnboardingDispatcher.tsx` |
| Explainer | `OnboardingExplainerStep.tsx` |
| Story card (tap + timed advance, Reduce Motion off) | `OnboardingStoryCard.tsx` |
| Multi / single choice | `OnboardingChoiceStep.tsx` |
| Birthday Groups picker | `OnboardingPrivacyPickerStep.tsx` |
| Placeholder art | `apps/mobile/components/onboarding/tour/VisualSlot.tsx` |
| Shared chrome (back, progress, pink CTA, paper) | `OnboardingStep.tsx`, `onboarding-ui.tsx`, `onboarding-theme.ts` |
| Brain | `apps/mobile/hooks/useOnboarding.ts` |
| Room | `apps/mobile/app/onboarding/index.tsx` |
| Spec | `guide-docs/complete/ONBOARDING.md` |

Reuse existing Bridger chrome where it is cheap and true: nested group language, Touch Grass button (non-interactive snapshot), mini tab bar, scrapbook page frame. Mark still-temporary art with `// TODO: replace with Magic Patterns visual <id>`.

---

## 3. Locked product rules (do not "improve" these away)

1. **One idea per screen.** Copy is already written that way. Do not merge screens to shorten the run.
2. **Progress bar counts the six required actions** (name, photo, birthday, birthday audience, feature picks, what matters). Information screens hide the bar.
3. **Name** is first + last on one screen. Photo has an explicit "Add one later".
4. User-facing word is **Groups** (Close Friends / Friends / Acquaintances). Never "circles" or "tiers" in UI copy.
5. Co-op is optional. No paywall. Free Lite is a valid end.
6. Branch tours are educational. Do not open live sheets (Touch Grass, notes, capture) mid-flow. Deep links happen after Home.
7. **No em dashes** in any copy you write.
8. **Reduce Motion:** no auto-advance, no decorative motion. CTA stays visible.
9. Accessibility: labels, 44pt taps, Dynamic Type, do not convey meaning by color alone.
10. Analytics: keep existing `analyticsId`s. New interactive bits need taxonomy rows. Visuals stay `interactive:false` so taps log `dead_click`.

---

## 4. Screen map (design every visualId)

Replace the placeholder in `VisualSlot` (and/or inline chrome) for:

| visualId | Used on | Job of the picture |
|---|---|---|
| `fragmented-life` | why-1 | Life split across apps / chats / photos |
| `swiss-knife` | why-2 | One toolkit, not another feed |
| `birthday-groups` | privacy-1, groups-1 | Birthday sitting inside Groups |
| `birthday-field-with-audience` | privacy-2 | A field plus who can see it |
| `nested-visibility` | privacy-3, privacy-4, groups-2 | Closer groups can see it too |
| `audience-toggle-anim` | privacy-5, groups-3 | Change it later (motion, or a still if Reduce Motion) |
| `fields-with-groups` | privacy-7 | Other profile fields use the same Groups idea |
| `default-plus-custom` | custom-groups-1, routing, free-1 | Three defaults plus a member custom group |
| `ads-vs-friends` | coop-1, route-no-ads | Friends, not ads |
| `members-fund` | coop-2 | Members fund it |
| `members-own` | coop-3 | Members own it |
| `member-vote-card` | coop-4, route-vote | A vote |
| `benefit-tray` | coop-5 | Member benefits tray |
| `group-chat-expands` | product-1 | Group chat plus the other friendship tools |
| `plans-availability` | plans-1, plans-2 | When people are free |
| `touch-grass` | plans-3 | Touch Grass (use real button chrome, non-interactive) |
| `friend-notes` | friends-1..3 | Private notes on a friend |
| `scattered-memories` | memories-1 | Memories stuck in other apps |
| `scrapbook-page` | memories-2, memories-3 | A page from your life (user-facing: page / collage, never "stories") |
| `friends-of-friends` | discover-1..3 | Friends of friends, not strangers |

Field screens (first-name, last-name, photo, birthday) already use real inputs. Tighten hierarchy and Required\* only. Do not turn them into explainers.

---

## 5. Design principles for THIS flow

1. **Structure before decoration.** Each archetype needs a repeating layout skeleton (where the visual sits, how much of the screen it owns, where the CTA lives). If two screens of the same archetype look unrelated, the system failed.
2. **Show, then name.** The picture should make the next sentence obvious. If the visual needs the paragraph to make sense, the visual is wrong.
3. **Onboarding is its own room** (`DESIGN.md`). Square paper, hard navy outline, pink Continue, pixel question headers. Color is allowed here. Do not import Home's floating pill as the main chrome.
4. **80% product, 20% retro.** Personality in the visual and the header font. Body stays readable sans.
5. **Honor the question the CTA is asking.** CTAs are written as the user's next question ("How does Bridger work?"). The visual on that screen should answer the *current* header, not the next one.
6. **Research in public.** For each major pattern (story auto-advance, nested Groups, multi-select with allow-empty, privacy-by-example), add a 2 to 4 line "Why this" comment or brief note citing the practice (Nielsen progressive disclosure, WCAG 2.2 Reduce Motion, first-run completion research). No fake citations. If you cannot find a source, say you used Bridger's own docs instead.

---

## 6. Suggested research questions (use the web)

Look these up and let them change the layout, not the product rules:

- What completion-rate patterns show up when onboarding is "profile then education" vs a long form?
- How do strong apps teach audience / privacy with one concrete example (birthday) instead of a settings dump?
- Best practices for **story cards** vs static explainers on mobile (timing, tap-to-skip, when a persistent CTA is required).
- How to visualize **nested visibility** (Friends includes Close Friends) without a Venn-diagram lecture.
- Empty-allowed multi-select: how to make "Save what matters to me" feel done even if they pick nothing.
- First-run illustration vs real UI chrome: when a snapshot of the actual control beats a metaphor.

---

## 7. Out of scope

- Old Onboarding screens (`StatScreen`, privacy circles, taste, places, co-op hard gate).
- Flipping TestFlight onto New.
- Rewriting `onboarding-new-copy.ts` except tiny readability fixes (still no em dashes).
- New product features, new backend, opening live sheets mid-flow.
- Full Magic Patterns library rebuild. Prefer shipping structured visuals in-app; flag net-new components with `// TODO: replace with Magic Patterns component <Name>`.

---

## 8. Definition of done for this design pass

- [ ] Every New Onboarding screen has a structured layout, not heading + blob + button.
- [ ] Every `visualId` is a real visual (chrome snapshot, simple diagram, or motion that respects Reduce Motion), not an emoji label card.
- [ ] Story, explainer, choice, and privacy-picker are distinguishable in 1 second.
- [ ] Groups look nested. Privacy 3 and 4 reflect the picked group.
- [ ] Reduce Motion: no auto-advance, no required animation.
- [ ] VoiceOver labels and 44pt targets still work. Required\* remains on profile fields.
- [ ] Old Onboarding and live `getOnboardingFlowVariant()` are unchanged.
- [ ] Short "Why this" notes exist for the main pattern choices, grounded in research or Bridger docs.
- [ ] New interactive elements (if any) are in `ANALYTICS-TAXONOMY.md` with `analyticsId`s.

---

## 9. How to preview

1. Run the mobile app.
2. On Sign in, long-press the Bridger mark.
3. Password `onboard` (New) or `onboardold` (Old).
4. Walk first name through Home. For New, pick at least one "what would help" chip so a branch tour appears.
