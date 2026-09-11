# Bridger: What version of me (user-authored quiz)

Active build doc. Planned Nest module `user-quizzes`, take/share routes next to existing fun quizzes. Read `complete/QUIZ-ENGINE.md` and `complete/TOUCHGRASS-AND-QUIZ.md` first.

**Status:** docs + schema only in this pass. No Nest/Expo code, no applied migrations. **UI home is not chosen yet.**

This is the quiz a person builds about themselves so friends can take **What version of {FirstName} are you?** Example: Brant publishes versions of himself (photos + labels + questions). Friends get a result version and can compare who landed where.

It is **not** Discover measurement (Your Vibe / personality). It is **not** an admin catalog fun quiz (`quiz_registry`). It does **not** feed matching.

---

## 0 · Product class

| Product | Who authors | Who takes | Feeds matching? |
|---|---|---|---|
| Discover modules (Your Vibe, etc.) | Bridger | The person about themselves | Yes (Zone B, private dims) |
| Home fun quizzes (Which J name, road trip) | Admin | Anyone | Only if dims flagged matchable |
| **What version of me** | The user | Their friends (share link) | **Never** |

Scoring is a **simplified QUIZ-ENGINE subset**: deterministic option → version weights. No AI moderator in v1. No Discover dimensions. Admin `quiz_registry` stays global; user quizzes live in `user_quizzes` so UGC cannot pollute the catalog.

---

## 1 · Home (deferred)

Infra comes first: tables, RLS, API, take/share routes. The tab or module that *launches* authoring is open until a Magic Patterns brief.

Candidate homes (do not implement a picker yet):

- A Profile module / entry on your own card
- Home fun-quiz plugin slot
- Messages / share sheet ("Make a quiz about you")
- Delight library (optional extra)

INDEX §6 records: **home TBD**. Routes can still exist as `/me/version-quiz` (author) and `/q/v/{token}` (take) so later UI only needs an entry point.

---

## 2 · Author wizard (`create_version_quiz`)

Surface: `version_quiz_author`. Multi-step flow.

```
1. Versions: 2 to 6 versions. Each: label, short blurb, photo
2. Questions: 4 to 12 questions. Each: prompt + 2 to 4 answers
3. Weights: each answer points at one or more versions (simple sliders / taps)
4. Preview: take it once as yourself (does not count as a friend result)
5. Publish: status goes live, share link is minted
```

### 2.1 Versions

- Label (required), blurb (optional, short), photo (`media` row).
- Photos are UGC. Capture or camera roll (same in-context permission as Collage). Reportable.
- Version `key` is stable (slug). Label can change; results keep the key.

### 2.2 Questions and weights

- Multiple choice only in v1 (single pick).
- Each option has weights onto version keys (integers, like fun-quiz rubrics). The highest summed version wins. Ties: first version in author order, or a documented "split" label if we add one later.
- Authoring UI should feel like "this answer is very Late-Night Brant" rather than a full Discover rubric editor.
- Optional later: Billy / deidentified lane can suggest version names or questions from the author's **own** visible profile words. Confirm-before-save. Never other people's data. Not required for v1 infra.

### 2.3 Limits

- One **live** version-of-me quiz per person in v1 (retake/edit updates the same quiz; `version` integer bumps).
- Drafts are owner-only.
- Archive unpublishes the share link (takers see "this quiz is no longer up").

---

## 3 · Take and share

- Share link / QR: opaque token (`user_quiz_shares`), like `jname_shares`. Public web view can show the author's first name + "What version of {Name} are you?" and a Take CTA. Taking requires a signed-in Bridger account (friend graph compare needs identity).
- Take surface: `version_quiz_take` (reuse `QuizHost` / `GenericQuizTake` patterns). Flow: `take_quiz` with `quiz_id=version_of_me` plus `author_ref` (opaque).
- Result: version label + photo + blurb. Share card can save to camera roll (add-only photos permission, same as J-name).
- **Who got who:** author (and mutual friends who both took it) can see which friends landed on which version. **No public leaderboard. No counts of how many people took it on any public surface.** Private-to-author tally of "friends who finished" is allowed in the author's own dashboard only (same exception family as host headcount). Do **not** copy J-name's public leaderboard.
- Notifications: existing `quiz_share` when someone sends the link in-app; add `version_quiz_taken` for the author when a friend finishes (prefs toggle).

Product events: `version_quiz_published` (live), `version_quiz_completed` (taker, server-confirmed), `version_quiz_shared` (`method` only). Question text, version labels, and photos never go in analytics.

---

## 4 · Privacy, UGC, safety

- Quiz title, questions, answers, version labels, blurbs, and photos are **UGC**. Same no-tolerance / report / block as Updates (`TERMS.md`).
- Report the quiz content, not only the person.
- AI (if used later for suggestions) stays on the author's own words, deidentified lane, confirm-before-save. Results are never matching features.
- Hard-delete: account delete cascades quizzes, versions, media, responses, results, share tokens.
- Author can delete the quiz; taker results go with it.
- Optional explain text on answers: owner-only, never analytics, never shown to the author of the quiz.

---

## 5 · Data (shapes)

Planned tables in `DATA.md` (not migrated yet).

```ts
interface UserQuiz {
  id: string;
  ownerId: string;
  slug: string;
  title: string;            // default "What version of {FirstName} are you?"
  status: 'draft' | 'live' | 'archived';
  version: number;
}

interface UserQuizVersion {
  id: string;
  quizId: string;
  key: string;
  label: string;
  blurb?: string;
  photoMediaId?: string;
}

interface UserQuizResult {
  quizId: string;
  takerId: string;
  versionKey: string;
  completedAt: string;
}
```

RLS (when migrated):

- Owner reads/writes draft + live quiz and sees friend results for people they are connected with.
- Taker can read a `live` quiz by share token and write their own response/result.
- Weights are needed to score on the server; clients receive labels only on take (same as admin quizzes hiding weights).

---

## 6 · API sketch (not implemented)

Module: `apps/api/src/user-quizzes/`

- `GET /me/version-quiz`: own draft/live
- `PUT /me/version-quiz`: save draft
- `POST /me/version-quiz/publish`: mint/refresh share token
- `GET /user-quizzes/shared/:token`: public card
- `POST /user-quizzes/:id/complete`: score + store result
- `GET /user-quizzes/:id/friends`: who-got-who for author + mutual friends (no public totals)

Scoring stays in Nest (deterministic). Do not score only on the client.

---

## 7 · Analytics

Flow: `create_version_quiz` (versions → questions → weights → preview → publish).

Surfaces: `version_quiz_author`, `version_quiz_take`, `version_quiz_result`, `version_quiz_share`.

Product events: `version_quiz_published`, `version_quiz_completed`, `version_quiz_shared`, plus existing `quiz_started` / `quiz_question_answered` / `quiz_abandoned` with `quiz_id=version_of_me`.

IDs in `ANALYTICS-TAXONOMY.md`.

---

## 8 · Magic Patterns

**TO DESIGN:** `VersionQuizAuthor`, `VersionCard`, `VersionQuizTake`, `VersionResultCard`, `VersionWhoGotWho`. Do not invent a one-off look. Flag in `MAGIC-PATTERNS.md`.

---

## Acceptance criteria

- [ ] A user can author versions (labels + photos), questions, and answer→version weights; publish mints a share link.
- [ ] Friends take via link; scoring is deterministic on the server; result is one version.
- [ ] Who-got-who is private to the author and mutual friends. No public leaderboard or take-count vanity.
- [ ] Separate tables from `quiz_registry`. Results never write matchable Discover attributes.
- [ ] Report / block apply to quiz UGC and photos. Hard-delete cascades.
- [ ] UI home is documented as TBD; routes may exist without a tab entry.
- [ ] Analytics + PRIVACY / TERMS updated in the same change when code ships. This doc pass already stubs them.
- [ ] Magic Patterns components listed before UI build.

---

## Changelog

| Date | Change |
|---|---|
| 2026-09-09 | First contract: user-authored version quiz, simplified scoring, home TBD, no public leaderboard. Docs only. |
