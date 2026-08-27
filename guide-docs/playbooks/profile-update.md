# playbook: profile-update

**Goal:** walk the user through editing their own profile (modules and fields). Feature doc that owns the screens: `../PROFILE.md` / `../PROFILE-MODULES.md`. Blast radius: **write-private** (own data).

> Read-only to the agent · contains no PII · versioned (bottom). Placeholder names below illustrate flow only.

---

## 1 · Goal & trigger

The user wants help updating their own profile. Triggers: "update my hobbies", "add a place I've been", "change my about me."

## 2 · Slots

**Required:** `module_or_field` · `new_value` (as appropriate to the module).
**Optional:** visibility choice when the module ends in Review & share.

Placeholder until v1 fills types and ask copy.

## 3 · Ask order (and harvest first)

1. Harvest which module/field and any new value from the opening utterance.
2. Ask only for what's missing, one question at a time (same one-per-screen spirit as profile modules).
3. Preview the change, then confirm before write.

## 4 · Disambiguation

If two modules could match ("favs" vs "hobbies"), ask which. Never edit another person's profile.

## 5 · Preview

Show the field/module change inline (what will change) before commit. Prefer the real profile module UI language where possible.

## 6 · Confirm

Write-private quick confirm on the user's own data. Visibility still follows `../PROFILE.md` review rules when applicable.

## 7 · Voice read-back

Read back the field name and new value before saving.

## 8 · Failure & edge cases

- Unknown module: say what Billy can edit; offer the nearest module.
- Model/voice down: discard half-built edit; normal Profile edit still works.
- Save fails: say so, offer retry.
- Abandon: cancel = never happened (no partial orphaned data).

## 9 · Refusals

Won't edit anyone else's profile. Won't invent answers to "finish faster." Standard `../AGENT.md` §18 refusals apply.

## 10 · Feature doc

`../PROFILE.md` and `../PROFILE-MODULES.md` own modules, fields, and review. This playbook owns only the conversational fill-logic.

## 11 · Version

- **v0 stub** (2026-08-07) - shape only; slots and ask copy TBD.
