# 08 · Open questions

Each one is a choice for Brant. The recommendation is what the plan assumes until you say otherwise. Phases that would change user-visible behavior do not ship on the assumption. They wait.

---

## 1. Cohort size k for extension aggregates

**Choice:** k = 5, k = 10, or k = 20.

**Recommendation:** k = 10. Under k, the aggregate is omitted, not returned as zero.

**Privacy:** k = 5 is close to the free Close cap (5). A count over a Close circle can name the whole circle. k = 20 means almost no Bridger circle ever returns a number. k = 10 blocks the Close circle and still often returns nothing for Friends (free cap 30, typical groups smaller). Empty is the safe failure.

**Product pressure:** charts and "how many friends did this" become vanity metrics if we lower k to fill them. The plan refuses that.

---

## 2. Derivations that need a model

**Choice:**

- A. No derivations. Placeholder plus the original. `derivable_to` stays empty.
- B. On-device OS transcription only, and only after the poster allows it.
- C. A narrow Bridger job (words only, existing AI gateway, poster opt-in), same idea as `day_summaries`.

**Recommendation:** A until you pick. Do not expand `stories.transcript` or `day_summaries` as part of this plan.

**Privacy:**

- A sends nothing new to a model.
- B is only private if the OS API stays on device. Apple and Google speech APIs often do not. Treat B as "audio may leave the phone" unless we prove otherwise for the API we call.
- C puts the words in a model vendor's request. It conflicts with "no AI" unless you write an exception into `INDEX.md` §6. Photos still must not be sent. That part is already the rule.

---

## 3. When a friend's format does not match what you want

**Choice:** show a one-line placeholder with a way to open the original, or hide the item.

**Recommendation:** placeholder. Copy shape: "Sam shared a voice update." One control opens the original. No transcript in the placeholder.

**Privacy:** the audience check already passed, so they were allowed to see it. Hiding is not a grant change. Hiding makes the share look like it never happened, which cuts the friendship loop. Placeholder does not reveal content beyond the modality. Modality can still feel sensitive (a voice note versus a photo). If you want voice hidden with no placeholder, say so, and we will treat voice as `sensitive` modality rather than as a normal update.

**Default until you answer:** no receive filter. Everyone sees the original they are already allowed to see. Columns can land empty before that (`06` Phase 5).

---

## 4. Grandfather existing consent, or ask again

**Choice:** keep current flags as the grant (`discoverable`, `assistant_enabled`, `visible_to_tier`, `matchable`, `notif_prefs`), or show every person a new consent screen before those keep working.

**Recommendation:** grandfather. New receipts start on the next change and on every extension data point. Do not block TestFlight on a re-prompt. We do not have the historical words they were shown. The receipt for old flags should record `source: grandfathered` and the column that holds the truth, not a fake quote.

**Privacy cost:** we cannot prove what sentence they saw. Re-prompting is cleaner and will stall people mid-build. Extension data does not get this exception.

**Notification default:** if a kind defaults to on inside `notif_prefs`, say whether that default is `core_required` or `opt_in` that they can turn off. Recommendation: `opt_in` with default on, because Settings already has the switches, and Phase 3 will actually honor them on the paths that skip `notifyIfAllowed` today.

---

## 5. Signed-in `USING (true)` on user content

These are real policies. Any account can read them. Anon cannot, except mission, economics, and roles (those three are public co-op copy, and the plan keeps them).

**Choice, per row:** keep, or tighten to the author plus people `can_view` allows.

| Policy | What leaks | Recommendation |
|---|---|---|
| `activity_posts_select`, `activity_hearts_select` | Captions, emoji, who posted, hearts | Tighten to friends. A community-wide prompt does not require the whole user base to read every caption. |
| `recap_submitted_questions_select` | The text a friend typed, plus vote totals | Tighten to friends, or to co-op members if the vote is meant to be co-op-wide. Vote totals are a number. Do not show them on a profile. |
| `coop_beta_votes_select` | `user_id` and `choice` | Tighten. A public tally can be aggregate_only with k = 10. Raw rows should be the voter and admins. |
| `coop_idea_comments_select`, `coop_idea_supports_select` | Comments and who supported | Keep if the portal is meant to be readable by every member. Confirm. Do not extend this pattern to messages or notes. |

**Privacy:** leaving them is an existence oracle for "this person wrote this" to any logged-in stranger. Tightening changes the product for anyone who used the wide read. That is why it is not in the silent Phase 1.

---

## 6. Message moderation vs ciphertext

**Choice:** server never decrypts (spec today), or a moderation path can decrypt.

**Recommendation:** never decrypt on the server. Report and block stay on metadata and on a user-supplied report reason, not on the body. If the store review forces a content scan, stop and redesign with you in the room. Do not add a plaintext column "for trust and safety" in Phase 6.

**Privacy:** decryption on the server ends the E2E promise in `complete/MESSAGES.md` and puts bodies where the service role already bypasses RLS.

---

## 7. Media fence timing

**Choice:** tighten `media_select` and add storage policies in the first enforce slice, or leave the acquaintance-wide media read until after messages.

**Recommendation:** tighten media before any extension install. It is a current hole, not a future one. Dual-run the upload path so old TestFlight builds still post. Avatar reads for acquaintances must keep working, because `user_identity_select` is acquaintance and the avatar is a `media` id.

**Privacy:** waiting leaves Close-only files visible as rows to acquaintances for longer. Shipping the tighten without a dual path breaks older binaries.

---

## Not questions (already decided in the ADRs)

These are the plan unless you reject the ADR. They are listed so a later session does not relitigate them by accident.

- Policy layer in Nest. RLS is the second fence, not the API fence. `adr/0001`.
- Extensions are declarative. No server-side extension code. `adr/0002`.
- Catalog JSON in git is the source of truth. `adr/0003`.
- Denied fields are omitted. Consent is per data point, with an append-only receipt. `adr/0004`.
- Old onboarding stays, including `user_settings.onboarding_complete`.
