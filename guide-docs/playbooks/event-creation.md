# playbook: event-creation

**Goal:** create an event by voice or text. **Reference implementation of the standard playbook shape** (see `README.md`). Feature doc that owns the screens: `../EVENTS.md`. Blast radius: **write-shared** (notifies invitees on confirm).

> Read-only to the agent · contains no PII · versioned (bottom). The examples below use placeholder names/times purely to illustrate flow — they are not data.

---

## 1 · Goal & trigger

The user wants to make an event. Triggers: "make an event," "throw a game night," "let's do dinner Friday," "set up a birthday thing for {friend}."

## 2 · Slots

**Required:** `title` · `date` · `time` · `location` (address or place) · `invitees`.
**Optional (offered, never forced):** `cover` (photo/emoji/color) · `bio/description` · `co-host` · `chip_in` (amount + method + handle) · `assignments` (what to bring) · `guest_cap`.

Each maps 1:1 to a create-event wizard field (`../EVENTS.md`) — the playbook fills the same slots a person would tap.

## 3 · Ask order (and harvest first)

1. **Harvest the opening utterance** into slots before asking anything. "Throw a game night Friday at my place, invite the climbing crew" → title≈"Game night", date=Friday, location=my place, invitees=climbing crew(→disambiguate). Ask only for what's still empty.
2. Fill **required** slots in this order, one question at a time: title → date → time → location → invitees.
3. Then **offer** optional slots as a single light pass: "Want a cover photo, a co-host, a chip-in, or a bring-list? Or skip to review." Never march through optionals one-by-one unless the user engages.
4. Move to **preview + confirm** as soon as required slots are filled.

## 4 · Disambiguation

- **Invitees by name:** resolve each against the user's friends. Two matches → "Sam Park or Sam Diaz?" Zero matches → "I don't see a Sam in your friends — skip, or is it someone else?"
- **Group references** ("the climbing crew," "the usual"): propose the inferred member list and **confirm it before using** — "That's Priya, Sam Park, and Dev — right?" Wrong-person is worse than missing-info, so the list is always confirmed, never silently assumed.
- **Relative dates/times:** resolve "Friday," "next week," "tonight" to an explicit date and read it back (§7). Ambiguous ("this weekend") → ask which day.
- **"My place":** map to the user's saved address if known, else ask.

## 5 · Preview (the widget)

- The **event card renders inline (chat) or above the voice transcript** and **fills in live** as slots land — "here's the event so far," fields greying in.
- It is the **one fixed event template** — the real create-event card (`../AGENT-SCOPE.md` §4), not a bespoke layout.
- Any field is **tappable to edit**; a photo the user sent in the thread renders smart-cropped with a reposition handle (`../AGENT-SCOPE.md` §10).
- A **Create** button on the card is the final confirm.

## 6 · Confirm

- **Write-shared gate:** the confirm names the blast radius — "This creates 'Game night' and invites 9 people. Create it?" The invite count is front-and-center.
- Nothing is written and **no invitee is notified** until Create is tapped (or, by voice, an explicit "yes, create it" after read-back).
- Bulk ceiling: an unusually large invite list prompts an extra "that's {N} people — still good?" (`../AGENT-SCOPE.md` §5).

## 7 · Voice read-back (mandatory before commit)

Before creating, say back the commit-critical slots: **"Game night, Saturday June 14 at 7pm, at your place, inviting Erin Cole and 8 others — create it?"** Names, the resolved date, the time, and the invite count must be read back; a mis-heard name or time is caught here, not after 9 people get pinged.

## 8 · Failure & edge cases

- **Missing required slot the user won't give:** can't create without it; explain which ("I still need a time") — don't invent one.
- **Model/voice down:** say it can't right now; the half-built event is discarded, not saved broken; the app's normal create-event screen still works.
- **Create fails (didn't save):** say so plainly, offer retry; never claim it was created.
- **Abandon:** "never mind / cancel / stop" discards the in-progress event immediately; nothing is saved.
- **Interrupt/correct mid-flow:** "make it Saturday not Friday" updates the slot + the card, confirms ("moved to Saturday"), continues.

## 9 · Refusals

- Won't invite people the user isn't connected to (no cold outreach).
- Won't mass-invite beyond the ceiling silently, or fabricate details to "finish faster."
- Photo with other people going wider than the subject's tier → quick "ok to share this publicly?" (`../AGENT-SCOPE.md` §10).
- Standard `../AGENT.md` §18 refusals still apply.

## 10 · Feature doc

`../EVENTS.md` owns the create-event wizard, its fields, validation, and the event detail/host views. This playbook owns only the conversational fill-logic that produces the same result.

## 11 · Version

- **v1** (2026-08-06) — initial. Slots, ask order, group-confirm disambiguation, one-template live preview, write-shared confirm with invite count, voice read-back of names/date/time/count.

*Changelog rule: any change to the create-event flow's fields/validation (`../EVENTS.md`) updates this playbook in the same commit (`../CURSOR-RULES.md`).*
