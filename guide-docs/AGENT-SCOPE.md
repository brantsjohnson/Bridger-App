# AGENT-SCOPE.md — Everything the assistant can do

The **capability catalog** for the Bridger assistant: every action it can take, how the one-question-at-a-time flow works, the inline widget previews, style-aware drafting, the notification/reply triage flow, photo handling, and the voice safeguards. This is the "what it can do and exactly how" companion to `AGENT.md` (which owns the privacy lane, gating, model config, and the hard invariants). **`AGENT.md` wins on any conflict about safety/permissions; this doc details behavior.** Read with `MESSAGES.md`, `EVENTS.md`, `TOUCHGRASS-AND-QUIZ.md`, `FRIENDS.md`, `NOTIFICATIONS.md`, `QUIZ-ENGINE.md`.

> **Two settled forks (from design):** (1) the agent works on **in-Bridger messages only** — never phone/iMessage; (2) **scheduled sends are allowed** because Bridger already supports them, but the agent **drafts + schedules and the user approves the full draft + exact send time before it's queued** — the human-in-the-loop moment moves to schedule time, it is never removed. Style-learning is **on by default** with an off toggle.

---

## 1 · The shape of every interaction

The assistant runs a **fill-in loop**, by voice or text: it works toward a goal by asking **one question at a time** for whatever it still needs, and stops asking the moment it has enough.

1. **Understand the goal + harvest what was already said.** "Make a game night Friday at my place, invite the climbing crew" → goal=create_event, and it pre-fills title-ish, date=Friday, location=my place, invitees=climbing crew (to be disambiguated). It only asks for what's **still missing**.
2. **Ask one question at a time** for each remaining required slot ("What time?" → "Who else besides the climbing crew?"). Optional slots are offered, never forced.
3. **Preview continuously** — the widget (or note/touch-grass card) fills in live as answers land, so the user always sees the thing taking shape (§4).
4. **Confirm before it's real** — the final "Create / Send / Schedule this?" beat. Nothing writes, sends, or queues without it.
5. **Log it** — every completed action lands in the activity log (§9), undoable where possible.

The loop must handle, at any step: **interrupt & correct**, **abandon**, **disambiguate**, and (voice) **read-back** — §3. These are not edge cases; they're most of what makes it usable.

---

## 2 · The action catalog

Grouped by blast radius, which sets how hard the confirmation is (§5). **Read** = no confirm. **Write-private** = quick confirm. **Write-shared** = explicit confirm naming who/how many.

| Action | Type | Confirm | Notes |
|---|---|---|---|
| Answer a question about a friend | read | none | From your notes + their tier-visible profile (`AGENT.md` lane). "I don't have that" if unknown. |
| Who haven't I reached out to? | read | none | Reads recency signals (`FRIENDS.md`); proposes a few with a reason each. |
| Go through notifications / play replies | read → act | per item | The triage flow (§6). |
| **Create an event** | write-shared | full preview + confirm | The flagship widget (§4). Pre-fills the create-event wizard (`EVENTS.md`); notifies invitees only on confirm. |
| **Draft / reply to a Bridger message** | write-shared | full draft + send | Style-aware (§7). Agent never auto-sends — you send. |
| **Schedule a Bridger message** | write-shared | full draft **+ exact send time** | Approve both before it queues. Cancelable from the activity log until it fires. |
| **Send a touch-grass signal** | write-shared | who + when, confirm | Shows the audience before sending (`TOUCHGRASS-AND-QUIZ.md`). |
| Save a note about a friend | write-private | quick confirm | kind `text` (`FRIENDS.md`). Never stores your words as anything but the note. |
| Save a date about a friend | write-private | quick confirm | kind `date` → surfaces in Coming-up. |
| Set a reminder / check-in cadence | write-private | quick confirm | kind `check_in`. |
| Take a quiz by voice | write-private | read-back per answer | Maps spoken answer → option, confirms, runs the moderator (§8). |
| Attach a photo you sent in chat | write (part of another) | shown in preview | Smart-crop + reposition (§10). Only photos you send in the thread; never your camera roll unprompted. |

Anything not in this catalog, the agent doesn't do — it says so and offers the nearest thing it can. The hard refusals in `AGENT.md` §18 (friend surveillance, bulk blasting, impersonation, reading phone texts) still apply even when phrased as one of the above.

---

## 3 · The four things the loop must always handle

- **Interrupt & correct.** At any step: "actually make it Saturday," "no, not that Sam." The agent updates the slot and the preview, confirms the change ("moved to Saturday"), and continues — it never forces a restart.
- **Abandon.** "Never mind / cancel / stop" (a **stop word** that works instantly, especially by voice) drops the in-progress action, writes nothing, and says so. Half-built events are discarded, not saved.
- **Disambiguate.** Two Sams → "Sam Park or Sam Diaz?" A vague group ("the usual crew") → it proposes the members it inferred and asks you to confirm the list before using it. **Wrong-person is worse than missing-info**, so identity gets its own confirm even when the agent is fairly sure.
- **Read-back (voice, mandatory for names/times/audiences).** Voice mis-transcribes constantly ("Aaron"/"Erin", "at ten"/"at two"). Before committing anything that names a person, a time, or an audience, the agent says it back: "inviting Erin Cole, Saturday at 7 — right?" No read-back → no commit.

---

## 4 · Inline widget previews (the "artifact" moment)

As the agent works, it renders the thing it's building **inline in the chat, or above the voice transcript** — filling in live as slots get answered, tappable to edit, with the final confirm on the widget itself. This is the artifact pattern, constrained to Bridger's own templates.

- **Event = the flagship, ONE fixed template.** The event card renders with title, date/time, place, cover, invitees, chip-in, assignments — greying in as they're filled ("here's the event so far"). Tapping any field edits it. A **Create** button on the card is the final confirm. It is the real create-event card (`EVENTS.md`), not a bespoke layout — one template only.
- **Other previews use the same visual language, lighter:** a **note** shows as a small note card (who it's about, the text); a **touch-grass** shows the signal + its audience; a **scheduled message** shows the draft bubble + the send time; a **reminder** shows the date it'll fire. Every "about to do" has a consistent little card so the agent's actions are always *seen*, never invisible.
- **Voice parity:** in a voice session the same cards appear on screen as it talks, so "who's invited?" is answered against a visible list, not held in your head.

The previews are Bridger UI rendered from canonical data — never free-form HTML, never a second event layout.

---

## 5 · Confirmation by blast radius

The preview *is* the confirmation, sized to the stakes:

- **Read** → no confirm (it's showing you your own data).
- **Write-private** (note/date/reminder) → quick confirm; low stakes, just don't do it silently.
- **Write-shared** (event, message, schedule, touch-grass) → **explicit confirm that names who it reaches**: "This invites 9 people," "This texts Maya now," "This schedules for Sat 9:00am." The bigger the audience, the more the number is front-and-center.
- **Bulk ceiling.** Anything that would touch many people at once (a touch-grass to a whole circle, several events) hits a sane cap and asks first; the agent never fans out silently. True mass-send stays a refusal (`AGENT.md` §18) — "happy holidays to everyone" becomes per-person drafts, a few at a time.

---

## 6 · Notification & reply triage (the voice inbox)

"Go through my notifications / play me the replies" runs a small state machine, newest-first by default:

1. **Present one item** — read the notification, or **play the reply video / read the text reply** (`STORIES.md` responses, `MESSAGES.md`).
2. **You act by voice or tap:** **reply** (speak it → style-aware draft → confirm → send, §7), **react**, **skip** (next), **save for later**, or **dismiss**.
3. **Advance** to the next; you can say "stop" / "that's enough" any time.
4. **Wrap-up:** "That's the last one — 3 replied, 2 saved." Nothing was sent without a per-item confirm.

It never auto-plays 40 things at you or auto-replies; each item is present → you act → next. "Save for later" keeps it unread.

---

## 7 · Style-aware drafting

The agent drafts Bridger messages **in your voice** — short vs. wordy, punctuation, greetings, emoji habits.

- **Learned from your own sent Bridger messages**, read on the single-user `personal_agent` lane (`AGENT.md`) — your data, your app.
- **Style, not surveillance:** it builds a *how-you-write* profile (cadence, length, tone), **not** a log of what you said to whom. Drafts mimic your style; they never quote your history back at people.
- **On by default** for agent users, with an off toggle in the assistant settings (`AGENT.md` §2). Off → clean neutral drafts.
- **You always see the full draft** before it sends or schedules (settled fork). Good style makes approval usually one tap — it never removes the confirm.
- **Ramp, honestly:** a new user has no sent history, so early drafts are clean-and-neutral and get more "you" over time. The agent never fakes familiarity it hasn't earned.

---

## 8 · Taking a quiz by voice

- The agent reads each question and its options, captures your spoken answer, and **maps it to an actual option** — then **reads it back**: "so that's 'I recharge alone' — right?" before it counts. Rambly answers ("uh, the second one, no wait the first") resolve to one option via read-back.
- The quiz's **moderator still runs** on those answers (confidence, quality flags, adaptation per `QUIZ-ENGINE.md`) — voice input doesn't bypass scoring integrity. Spoken answers are messier, so the moderator's low-confidence/contradiction handling matters more, not less.
- Explanations you speak are treated as content (used in-request, not logged/trained — `AGENT.md`).
- Result feeds matching exactly as a tapped quiz would; internal quiz ids unchanged (`QUIZ-ENGINE.md`).

---

## 9 · The activity log (the receipt)

Every action the agent takes lands in a plain-language, per-user log — essential now that a 5-minute session can create an event, two notes, and a scheduled message:

- Each entry: what happened, when, who it touched ("Drafted a message to Maya · you sent it"; "Scheduled 'happy birthday' to Sam · Sat 9:00am"; "Created 'Game night' · 9 invited").
- **Undo where the platform allows** (delete the note, cancel the scheduled message before it fires, cancel the event). Scheduled messages are cancelable from here until they send.
- This is the audit trail behind `AGENT.md`'s confirmation model — the user can always see and reverse what the agent did.

---

## 10 · Photo handling

When you send a photo **in the chat** for use in something (mainly an event cover):

- **Smart-crop toward the subject** to fit the target's aspect ratio — never a dumb center-crop that decapitates someone; plus a **reposition** tap because it'll sometimes get it wrong.
- **Shown in the preview** before the action commits — you see the cropped result on the event card and can adjust or replace.
- **Only photos you send in the thread.** The agent never reaches into your camera roll unprompted.
- **Faces/other people:** an event *cover* photo may show others; a photo attached to something that goes wider than its subject's tier should prompt a quick "ok to share this publicly?" The agent doesn't quietly broadcast a photo with other people in it.
- Inappropriate-content and UGC rules apply (`CURSOR-RULES.md`); a rejected image fails gracefully with a plain reason.

---

## 11 · When it can't (graceful failure with write actions)

- **Missing data:** "I don't have Maya's sister's name — want to save it?" (never fabricate — sev-1, `AGENT.md`).
- **Model/voice down:** the agent says it can't right now and the app stays fully usable; a half-built action is held or discarded, never left in a broken half-state.
- **Action fails (event didn't save, message didn't queue):** say so plainly and offer to retry — never claim success it didn't achieve.
- **Mis-heard (voice):** caught by read-back (§3) before commit; if unsure, it asks again rather than guessing a name/time.

---

## 12 · Changes to `AGENT.md` (do in the same pass)

- §3 (Answer + Act): broaden Act to the full §2 catalog (events, Bridger-message reply + **schedule**, touch-grass, quiz-by-voice, notification triage, photo attach) — reference this doc.
- §6 (tools): add `send_touch_grass`, `schedule_message`, `reply_message`, `run_notification_triage`, `take_quiz_voice`, `attach_photo`; all keep the propose→preview→confirm rule; `schedule_message` shows **draft + exact send time**.
- §7 (connections): note messages are **in-Bridger only**; scheduled send reuses Bridger's existing scheduler.
- Add **style-aware drafting** (on by default + toggle) to the assistant settings and the model registry (a fast style-profile read on the `personal_agent` lane).
- §12 invariants: keep "never reads phone texts"; refine "never sends without confirm" to "**never sends or schedules without an approved full draft (+ send time if scheduled)**."
- Acceptance criteria: add interrupt/abandon/disambiguate/read-back, inline widget previews (one event template), triage flow, style toggle, photo smart-crop, activity-log undo incl. canceling scheduled sends.

---

## Acceptance criteria

- [ ] The agent runs a one-question-at-a-time fill loop that harvests what was already said and only asks for what's missing, by voice or text.
- [ ] Every action matches the §2 catalog; anything outside it is declined with the nearest offer; `AGENT.md` §18 refusals still hold.
- [ ] The loop handles **interrupt/correct, abandon (instant stop word), disambiguate (wrong-person guarded), and voice read-back** for names/times/audiences — no commit without read-back on voice.
- [ ] Actions render **inline widget previews** that fill live and confirm on the card; the **event uses one fixed template** (the real create-event card), and notes/touch-grass/scheduled-messages/reminders use the same lighter card language.
- [ ] Confirmation scales by blast radius; write-shared confirms name who/how many; bulk hits a ceiling and asks; mass-send stays a refusal.
- [ ] **Messages are in-Bridger only**; **scheduled sends show the full draft + exact send time and are approved before queuing**, and are cancelable from the activity log until they fire.
- [ ] **Style-aware drafting** is on by default with a toggle, learned only from the user's own Bridger messages on the personal_agent lane, as a style profile (not a content log); every draft is still shown before send/schedule; degrades to neutral for new users.
- [ ] Notification/reply triage presents one item at a time (plays reply videos, reads text replies), supports reply/react/skip/save/dismiss, and never auto-plays-all or auto-replies.
- [ ] Voice quiz-taking maps spoken answers to options with read-back and runs the moderator normally.
- [ ] Photos are used only from the chat thread, smart-cropped toward the subject with reposition, shown in preview, with a share-scope check when a photo would go wider than its subject; camera roll is never accessed unprompted.
- [ ] The activity log records every action with who it touched and supports undo/cancel where possible.
- [ ] Graceful failure for missing data, model-down, and failed writes; never fabricates, never claims false success.
