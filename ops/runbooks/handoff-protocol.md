# Runbook: handing work to another agent

Use this when you (any agent) cannot finish something because it belongs to a different lane.

1. **Do not stop silently.** Write what you found so far in the queue file's notes.
2. **Append to `ops/HANDOFFS.md`** at the top: date, from, the tag of who you need, a subject line, two to five sentences, and the queue or bug id.
3. **Reassign** the queue file: `owner:` to the new agent, `status: todo` (or `blocked` with `needs:` set if a human is required).
4. **If it is for Cursor and it is p0/p1**, also open a GitHub issue with label `agent:cursor` and the same title so Cursor cloud agents can pick it up without Brant.
5. **If it is for Brant**, set `needs: brant` so it lands at the top of the nightly report.
6. **When you receive a handoff**, reply under the entry (`> reply DATE · agent: ...`) even if the reply is "picked up".

Handoff quality bar: the receiver should be able to start in under two minutes without asking a question. Include the file paths, the repro, and the acceptance criteria.
