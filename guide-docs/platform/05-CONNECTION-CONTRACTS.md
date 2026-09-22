# 05 · Connection contracts

How someone shares, and how a friend wants to receive it. A receive preference is a filter on what the recipient may already see. It never grants access.

Permission comes from the poster's audience (`visible_to_tier`, `audience_tier`, connection) and from consent. "I only want visual updates" means: of the things my friends have shared with me, show the visual ones and any derivation the poster allowed. It does not mean: show me visuals of things they did not share.

---

## Canonical item

Every shared item has:

| Part | Meaning |
|---|---|
| `source_modality` | What the poster actually made. |
| `audience` | The existing tier or audience column. Unchanged by this spec. |
| `derived[]` | Zero or more representations. Each exists only if the catalog `derivable_to` lists it and the poster allowed it. |
| `poster_derivation` | Default empty. Empty means no derivation, including summary. |

Derived items inherit the source audience exactly. They are deleted when the source is deleted (`deletion_cascade`).

Modalities that exist in the schema today:

| Modality | Where |
|---|---|
| `text` | `stories.update_text`, `quips.text`, `reactions` kind `text`, poll text, attribute keys. Message text is spec-only (ciphertext later). |
| `photo` | `media_kind` / `story_type` `photo`. Quip `photo_media_id`. |
| `video` | `story_type` `video`. Reaction `circleVideo`. |
| `audio` | `story_type` `audio`, `media_kind` `audio`, `recap_answers` voice. |
| `sticker` | `reaction_kind` `sticker`. |
| `prompt` | `recap_questions`, `weekly_activities`, quiz questions. The prompt is catalog copy. The answer is the user's item. |

Not found: a receive-preference column. Not found: a poster derivation flag. Both are added as catalog fields in Phase 5 so later work does not redesign the model.

---

## Compatibility

Three outcomes per cell: **native**, **derivation** (only if allowed), **none**.

Phase 1 enforces three buckets, not every cell. The catalog still has the full matrix so the other cells turn on without a migration.

Buckets: `text`, `visual` (photo, video, sticker), `voice` (audio, recap).

| Poster bucket | Receiver wants text | Receiver wants visual | Receiver wants voice | Receiver wants any (default) |
|---|---|---|---|---|
| text | native | none | none | native |
| visual | none | native | none | native |
| voice | derivation `transcript` if allowed, else none | derivation `waveform_card` or `still_frame` if allowed, else none | native | native |

`summary` and `text_to_speech` stay in `derivable_to` and stay off. They change meaning. Default remains off even after Phase 5.

`none` is not a hidden row. See degradation.

---

## Degradation

**Recommendation:** the recipient sees a short honest placeholder and one control that opens the original.

Example copy (no second sentence under it): "Sam shared a voice update." The control plays the original. The placeholder does not include a transcript, a summary, or a hint about content the derivation would have extracted.

Why: the poster shared it with them. Dropping it with no trace breaks the friendship loop and looks like the friend went quiet.

**Alternative:** hide the item completely. Cost: the recipient cannot tell a share happened, so they do not respond, and the poster thinks they were ignored. Also an existence question: hiding can be safer when the modality itself is sensitive. Voice versus text is not that case, because the audience check already passed. Allergies, phone numbers, and exact location are not "modalities" and are never rewritten into a placeholder. They stay omitted under `03`.

This recommendation is question 3 in `08-OPEN-QUESTIONS.md` because it changes what friends see. The catalog fields ship either way. Enforcement waits for the answer. Until then, behavior stays as it is now: if you can see the story, you see the original modality.

---

## Where it lives

| Fact | Storage (proposed) | Enforced |
|---|---|---|
| Source modality | Already on the row (`story_type`, `media.kind`, `reaction_kind`). | Now, by those columns. |
| Audience | Existing tier columns. | Now, by `can_view` and (after the enforce flip) the policy layer. |
| Poster allows a derivation | New `stories.derivation_allow text[]` default `'{}'`, same idea on `recap_answers` and `quips` when those types need it. Catalog `derivable_to` is the ceiling. The array cannot exceed it. | Phase 5, server-side, at query time. |
| Receiver bucket | New table `receive_preferences` (`user_id`, `other_id` nullable, `buckets text[]`). Null `other_id` is the default for everyone. A row with `other_id` overrides for that friend. | Phase 5, in the policy layer, after the audience check. |
| Catalog ceiling | `derivable_to` on the source entry. | Compiler. Empty means the column cannot be set. |

Do not store this only on the phone. A second client would ignore it and show everything again.

`user_settings` already has 29 columns. The preference is a new table so that row does not grow another jsonb bag. `notif_prefs` stays the notification document. It is not the receive-modality document.

---

## AI and derivations

Bridger's product principle is no AI. Transcription, summarization, and text-to-speech are model work even when they are "just a convenience."

This spec does not turn them on. Options for Brant are question 2 in `08`:

| Option | What ships | Privacy |
|---|---|---|
| No derivations | Placeholders only. `derivable_to` stays empty in the enforcing catalog. | Nothing new leaves the device or hits a model. Voice and text friends see the placeholder and can open the original. |
| On-device OS transcription | The phone may attach a transcript the poster explicitly allowed. Server stores it as a derived field with lineage to the story. | Depends on the OS. Apple and Google may send audio off the device for their speech API. That is not "stays on the phone" unless we verify the API. Treat as a data leave until proven otherwise. |
| Narrow Bridger exception | A named job in the existing AI gateway, words only, poster opt-in, same firewall as `day_summaries` (no photos). | A model sees the words. Conflicts with "no AI" unless Brant carves it out in `INDEX.md` §6. |

`day_summaries` and `stories.transcript` already exist. This plan does not delete them and does not expand them. New derivations wait.

---

## Phase 1 subset

Ships without changing what TestFlight shows:

- Catalog properties `derivable_to`, `inference_risk_with`, poster derivation, receive buckets.
- Database columns and `receive_preferences`, defaults empty / null.
- Policy layer ignores them until the founder answers questions 2 and 3.

After that answer, enforce the three buckets only. Cells outside the buckets stay `none` with the placeholder rule, or native if the default is "any." The default for existing users is **any**, so nobody's feed changes until they set a preference.
