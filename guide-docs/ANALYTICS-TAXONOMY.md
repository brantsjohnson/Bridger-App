# ANALYTICS-TAXONOMY.md — the naming master sheet

The **canonical registry of names** for every measurable thing in Bridger — the "architecture doc, but for analytics." It exists so `settings on Home` and `settings on Friends` are always distinguishable, the same element is never named two ways, and **nothing important is silently un-measured.** Pairs with `naming-rules.mdc` (enforcement) and `ANALYTICS-README.md` (plain-English guide).

**Golden rule:** every element — interactive *and* the semantic non-interactive ones (headers, titles, card bodies, placeholders) — has an ID:

```
screen.section.element        + action + properties (at event time)
```

Screen + section make it unique; **element names are reused across screens** (`settings_icon` everywhere), and the `screen`/`surface` field tells you where it happened.

---

## 1 · Every event's properties

| Property | What it captures |
|---|---|
| `id` | `screen.section.element` |
| `action` | `click` `double_click` `long_press` `swipe` `drag` `scroll_v` `scroll_h` `focus` `blur` `submit` `view` · **`dead_click`** `rage_click` (`count`) `misclick` |
| `surface` | the screen **or sheet/overlay** the user is on (see §2) |
| `parent_screen` | if a sheet, what launched it (so "touch-grass sheet from Home" ≠ "from Events") |
| `interaction_index` | 1st, 2nd, 3rd… interaction on this surface (see §4 — order matters) |
| `first_interaction` | true on the very first tap of a surface |
| `method` | how a thing was done — `qr` / `link` / `scan`; `photo` / `video` / `text` / `voice`; `video` / `comment` / `sticker` / `reaction`; `swipe` / `dropdown` (see §5) |
| `flow` / `flow_step` | the named flow + step this belongs to (see §3) |
| `timestamp` | when |
| `duration_since_screen_load` | how long after the surface opened (hesitation) |
| `dwell_ms` | time spent on a component/surface before leaving |
| `time_to_complete_ms` | for a finished flow |
| `platform` `app_version` `session_id` `user_ref` | context (user_ref = opaque, consented; never PII) |

---

## 2 · Surfaces: screens **vs. sheets** (important)

A **sheet / bottom-sheet / modal / overlay is its own `surface`**, not part of the screen behind it — otherwise you can't tell whether people bail *before or after* it opens. Every sheet records `parent_screen` so you know where it was launched.

| Surface (sheet) | Opens from | Why measure separately |
|---|---|---|
| `touch_grass_sheet` | `home` or `events` | "when/who do you want to touch grass?" — do they open it then bail? which parent screen drives more? |
| `grass_signal_sheet` | `home` or `events` | a friend's signal detail — do they say "I'm in" or quietly decline after opening? |
| `ask_sheet` | `home` | create poll / ask question — do they open then bail? |
| `discover_settings_sheet` | `discover` | Discoverable + source toggles — do they open settings then bail? |
| `post_composer` | `home` (your story) | do they use the suggested buttons? finish? |
| `add_friend_sheet` | `friends` | QR vs link vs scan (method) |
| `customize` | `profile.settings` | do they customize at all, and for how long (`dwell_ms`) |
| `friend_options_sheet` | `profile.friend_view` | remove / block / report reach |
| `create_hub` *(retired)* | — | (removed — do not re-add) |
| `reveal` | connection | its own flow (§3) |
| `catch_up` | `story` | the swipe-up sheet |
| `create_event` | `events` | the 4-step create-event wizard — where in Details → Invite → Extras → Preview do hosts drop off? |
| `event_share_sheet` | `events.detail` | native share invoked? |
| `section_info_tooltip` | any screen with section headers | do they open section help then bail? which sections? (`dwell_ms`, `section`) |
| `recap_recorder` | `friends` (Friend Pod) | record the week's 5 answers by voice — do they start and give up? which question do they quit on? (`dwell_ms`) |
| `recap_player` | `friends` / `home` (Friend Pod) | full-page weekly podcast — play, speed, filter, jump voices, react; do they bail? (`dwell_ms`) |

**Rule:** opening a sheet emits `surface_opened`; closing without acting emits `surface_dismissed` with `dwell_ms`. That single pair answers "do people open this and give up?"

---

## 3 · Flows (named + timed)

A **flow** is a multi-step task. Each emits `flow_started`, `flow_step` (with the step name + `duration_since_screen_load`), and `flow_completed` **or** `flow_abandoned` (with `time_to_complete_ms` and the last step reached). This is how you answer "did this take forever / where do they quit."

| Flow | Steps (order tracked) |
|---|---|
| `onboarding` | privacy → notifications → name → photo → basics → meet → review → coop → welcome |
| `post_story` | open composer → capture/type/voice → (suggested used?) → post → (add another "+"?) |
| `add_friend` | open sheet → choose method (qr/link/scan) → send/confirm |
| `customize_profile` | open → each change → save (with total `dwell_ms`) |
| `touch_grass_send` | open sheet → who → when → why → send |
| `discover_me` | each question in order → finish |
| `reveal` | how-you-met → orbs (strongest) → also-got (quiz scores + commonalities) → see profile |
| `create_event` | details → invite → extras → preview (then `event_created`) |
| `take_quiz` | each question (+ explanation, order tracked) → result → pairs with the `quiz_*` product events (§3b) |
| `take_recap` | open recorder → preview (all questions) → each question (q1…q5, order tracked) → pick audience → post (then `recap_posted`) |

---

## 3b · Product events (what actually happened, not just what was tapped)

**A tap is not an outcome.** "Clicked the quiz tile" ≠ "completed the quiz." "Clicked a friend row" ≠ "re-tiered that friend." Record the **domain outcome** as its own event, separate from the UI click, with the state that changed. These are the events that tell you if Bridger *works*.

| Product event | Fires when | Key properties |
|---|---|---|
| `quiz_started` | a quiz begins | `quiz_id`, `quiz_version` |
| `quiz_question_answered` | each question | `question_id`, `option_count` (how many selected), `explained` (bool), `dwell_ms` |
| `quiz_question_skipped` | a question is skipped | `question_id` |
| `quiz_adapted` | moderator rewords/inserts (per `QUIZ-ENGINE.md`) | `reason` (low_confidence/select_all/contradiction) |
| `quiz_abandoned` | left before finishing | `last_question_id`, `percent_complete`, `time_spent_ms` |
| `quiz_completed` | finished | `quiz_id`, `time_to_complete_ms`, `questions_answered` |
| `module_started` / `module_completed` | a profile module (basics, hobbies, this-or-that, places, bucket_list, discover_me) | `module`, `items_added`, `time_to_complete_ms` |
| `module_item_added` | one item added (a hobby, a bucket-list item) | `module`, `friend_tagged` (bool), `visibility` |
| `friend_added` | a connection is made | `method` (qr/link/scan/suggestion), `via` |
| `friend_retiered` | a friend moves tiers (**not** just a drag) | `from_tier`, `to_tier` |
| `friend_removed` / `friend_blocked` / `friend_reported` | the action completes | `—` |
| `story_posted` | an update posts | `method` (photo/video/text/voice), `is_coop` |
| `response_posted` | a reaction/reply posts | `method` (video/comment/sticker/custom_sticker/reaction), `duration_seconds` on video |
| `sticker_created` | someone saves a sticker they made | `method` (photo) — **never the image** |
| `touch_grass_sent` | a signal is sent | `audience`, `when`, `has_why` (bool), `parent_screen` |
| `touch_grass_answered` | someone says I'm in | `—` |
| `touch_grass_declined` | someone quietly declines a signal | `parent_screen` |
| `recap_posted` | a weekly recap is posted | `answers` (count), `audience` — **never the audio** |
| `recap_played` | the weekly podcast is played | `voices` (count), `questions` (count) |
| `recap_reaction_sent` | sticker/emoji reaction on a recap | `method` (sticker) — **never the emoji** |
| `recap_question_submitted` | a question is suggested for a future week | `—` (never the question text) |
| `recap_question_voted` | a submitted question is upvoted | `—` |
| `poll_created` / `poll_answered` | poll actions | `—` |
| `event_created` | an event is created | `has_cohost`, `has_chip_in`, `has_cover`, `assignment_count`, `invited_count` (booleans + counts only — never title/bio/address text) |
| `event_assignment_added` | host adds an assignment item | `—` (no item text) |
| `event_assignment_taken` | a guest claims / is assigned an item | `—` (no item text or names) |
| `event_assignment_released` | assignee removes themselves from an item | `—` |
| `event_assignment_done` | assignee checks off (or unchecks) their item | `—` |
| `event_shared` | event shared from its detail page | `method` (share_sheet / copy_link) |
| `rsvp_going` / `rsvp_cant` | RSVP actions | `—` |
| `inside_joke_posted` | a note is posted | `tagged_people`, `tagged_event` (bool) |
| `bucket_item_checked` | an item is completed | `—` |
| `profile_customized` | customize is saved | `changes_count`, `dwell_ms` |
| `connection_revealed` | a reveal completes | `recorded_where` (bool), `added_note` (bool), `meet_context` (`just-met` \| `already-know`), `to_tier` — NEVER place/note text or names |
| `message_sent` | a chat message posts | `counts_against_cap` (bool) — NEVER include message text |
| `contact_shared` | contact card shared into a thread | `counts_against_cap` (always false) — NEVER include field values |
| `auth_signed_in` | sign-in succeeds | `method` (google/apple/email) |
| `auth_signed_up` | account create succeeds | `method` (google/apple/email) |
| `screen_not_found` | unmatched route or broken connection path shows the 404 dialog | `missing_path`, `path_trail` (joined routes, no PII), `reason` (`unmatched_route`\|`connection_error`\|`runtime_error`) |
| `delight_gifted` | someone sends a gift delight | `delight_slug` (never names) |
| `delight_played` | a gift delight finishes playing for the recipient | `delight_slug` |
| `activity_posted` | someone posts into the weekly activity | `—` |
| `activity_hearted` | someone hearts an activity post | `—` |
| `home_layout_saved` | user finishes editing their Home layout | `widget_count` |

**The rule:** if a click changes data or advances the user toward a real goal, emit a **named product event** alongside the UI event — never rely on the click alone. The click lives in the taxonomy below; the outcome lives here.

## 4 · Order & sequence (what they touch first)

Every surface stamps each interaction with `interaction_index` and flags `first_interaction`. This answers:
- **"On Profile, what do people tap first?"** → filter `surface=profile`, `first_interaction=true`, group by `element`.
- **"In what order do they view interests / places?"** → `page_viewed` events carry `page_index`; read them in sequence.
- **"Do they open and close lots of dropdowns?"** → count `expand` / `collapse` per surface per session.

---

## 5 · Swipe vs. tap, carousels, and "view method"

For anything with two ways to navigate (a dropdown *and* a swipe), record **which one they used** via `method: swipe | dropdown`, plus how far they got:
- `page_viewed` with `page_index` (which page of a carousel/widget became visible).
- `carousel_depth` (max index reached) — **"do they even swipe to see more announcements?"**
- `cards_became_visible` vs `cards_clicked_after_view` — seen-but-ignored.

Applies to: `hobbies_widget` (dropdown vs swipe to interests), `places_map` (map vs list swipe), `announcements` carousel, `this_or_that`, stories row.

---

## 6 · Screen × section × element registry

*Interactive unless marked **(dead)** = tag `interactive:false` so a tap logs `dead_click`. Add rows here in the same PR as the UI.*

### `auth`
| section | elements |
|---|---|
| `welcome` | **`brand` (dead)**, **`beat_body` (dead)**, **`progress_bar` (dead)** |
| `sign_in` | **`page_title` (dead)**, `google` (method=google), `apple` (method=apple), `email`, `password`, `submit`, `switch_to_sign_up` |
| `sign_up` | **`page_title` (dead)**, `google` (method=google), `apple` (method=apple), `email`, `password`, `submit`, `switch_to_sign_in` |

### `chrome` (floating tab bar — global)
| section | elements |
|---|---|
| `tab_bar` | `tab_home`, `tab_friends`, `tab_messages`, `tab_events`, `tab_discover` |

### `onboarding`
| section | elements |
|---|---|
| `chrome` | `continue`, `skip`, `back`, `progress_bar`, **`step_title` (dead)** |
| `privacy` | `acknowledge` |
| `name` | `first_input`, `last_input` |
| `photo` | `take`, `upload`, `retake`, `skip` |
| `notifications` | `pref` |
| `groups` | `invite`, **`tier_card` (dead)** |
| `meet` | `nearby`, `anywhere`, `city_input`, `skip` |
| `basics` | `answer` (birthday) |
| `review` | `row_audience`, `set_all` |
| `coop` | `join`, `apple_pay`, `google_pay`, `card`, `use_free` |
| `welcome_in` | `lets_go` |

Flow tracking uses `flow_started` / `flow_step` / `flow_completed` with `flow='onboarding'`.

### `home`
| section | elements |
|---|---|
| `top_nav` | `search`, `messages_icon`, **`header_logo` (dead)**, **`page_title` (dead)**, `profile_icon`, `edit_layout` |
| `announcements` | `carousel` (swipe, `carousel_depth`), `card`, `touch_grass_im_in`, `touch_grass_details`, `touch_grass_dismiss`, `quick_check_yes`, `quick_check_edit`, `coop_card`, `coming_up_card`, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `stories_row` | `your_story` (opens `post_composer`), `story_tile`, `tier_filter`, `add_after_post` (the "+"), **`stories_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `responses` | `response`, `reply`, **`responses_header` (dead)** |
| `touch_grass_button` | `send` (opens `touch_grass_sheet`) |
| `notifications_preview` | `row`, `see_all`, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `inside_jokes_strip` | `note`, `add`, **`sticky_note_body` (dead — do they tap the note itself?)** |
| `ask_the_group` | `create_poll`, `ask_question`, `see_previous_polls`, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `this_week` | `play_recap`, `add_recap`, `take_quiz`, `next_event`, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `coming_up` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `activity` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), `open`, `heart`, `post` |
| `quiz` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), `take`, `open_result`, `share` |
| `coop` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), `open_portal`, `join`, `use_free` |
| `cold_start` | **`body` (dead)**, `cta` (method=link/qr/scan) |

### `section_info_tooltip` *(surface)*
| section | elements |
|---|---|
| `chrome` | `dismiss` |
| `body` | **`body` (dead)** |

### `touch_grass_sheet` *(surface)*
| section | elements |
|---|---|
| `who` | `close`, `friends`, `everyone` |
| `when` | `now`, `tonight`, `weekend` |
| `why` | `input` |
| `actions` | `send`, `dismiss` |

### `grass_signal_sheet` *(surface)*
| section | elements |
|---|---|
| `actions` | `im_in`, `quietly_decline`, `dismiss` |

### `post_composer` *(surface)*
| section | elements |
|---|---|
| `capture` | `photo`, `hold_video`, `switch_camera` |
| `caption` | `type`, `voice_to_text` |
| `suggested` | `suggested_prompt` (**do they ever use these?**) |
| `audience` | `close`, `friends`, `everyone`, `group` |
| `actions` | `post`, `add_another`, `discard` |

### `discover`
| section | elements |
|---|---|
| `top_nav` | `settings_icon`, `messages_icon`, **`page_title` (dead)**, `profile_icon` |
| `wants_to_connect` | `card`, `approve`, `decline`, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `people_to_meet` | `suggestion_card`, `add`, `dismiss`, `spotlight_card`, **`shared_thread_headline` (dead)**, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `discover_me` | `answer`, `image_option`, `continue` |
| `connect_over` | **`section_header` (dead)**, `module_tile` (opens a private module; `module` id), `see_more` (opens `connect_over` screen), `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `in_common` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) — connection detail overlaps before Accept/Add |
| `maps` | `node`, `map_toggle` (swipe/dropdown) |
| `gate` | **`body` (dead)**, `get_started` |
| `settings_sheet` | `discoverable_toggle`, `source_toggle`, `dismiss` (surface=`discover_settings_sheet`) |

### `connect_over` (full list of private modules)
| section | elements |
|---|---|
| `list` | **`page_title` (dead)**, `back`, `module_tile` (opens a private module; `module` id) |

### `friends`
| section | elements |
|---|---|
| `top_nav` | `settings_icon`, `search`, **`page_title` (dead)**, `profile_icon`, `add`, `edit` |
| `roster` | `row`, `drag_handle`, **`tier_header` (dead)**, `birthday_row`, `info` (opens `section_info_tooltip`, method=hover\|tap; `tier` prop) |
| `add_sheet` | `invite_link` (method=link), `qr` (method=qr), `scan` (method=scan) |
| `inside_jokes` | `note` (tap → meta), `add`, **`note_body` (dead)**, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `pod` | `play` (opens `recap_player`), `record` (opens `recap_recorder`), `submit_question`, `vote_question`, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |

### `profile` (own)
| section | elements |
|---|---|
| `tabs` | `profile`, `stories`, `inside_jokes`, `bucket_list`, `settings_gear` (record `first_interaction` → what they open first) |
| `header` | `avatar`, `name`, `song` (covers the "currently listening / currently reading" pair in the identity block), `overflow`, **`header_bg` (dead)** |
| `card` | `currently`, `hobbies_widget` (expand/collapse counts; method swipe/dropdown; `page_viewed`), `this_or_that_row` (tap + **dead** on the row body), `places_map` (swipe/list, `page_viewed`), `about_me` (**dead** — do they tap it?), `favs`, `add_details`, `add_hobbies`, `add_favs`, `add_places`, `take_this_or_that`, `add_module` |
| `module` | `audience_set_all`, `audience_row`, `hobby_select` |
| `stories_calendar` | `day` (opens story), `month_nav`, `storage_bar` |
| `inside_jokes` | `note` (tap → meta), `add`, `filter`, **`note_body` (dead)** |
| `bucket_list` | `item`, `add`, `check_off` |
| `quizzes` | `untaken_row`, **`section_header` (dead)** |
| `settings` | `who_sees_what`, `customize_profile` (opens `customize`), `discover_toggle`, `coop`, `notifications`, `account`, `delete_account`, `analytics_toggle`, `log_out`, `appearance`, `blocked_people` |
| `top_nav` | **`page_title` (dead)**, `edit`, `back` |

### `profile` (friend view)
| section | elements |
|---|---|
| `tabs` | `about_them`, `in_common`, `inside_jokes`, `bucket_list` (their list, read-only — rows reuse `profile.bucket_list.item` as a **dead** target) |
| `about_them` | `about_me` (**dead** — do they tap it expecting more?), `this_or_that_row` (**dead**), `hobbies_widget` |
| `in_common` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `actions` | `message` (the "Message <name>" pill in the header — there is no separate button any more), `how_you_met`, `private_note`, `overflow` (opens `friend_options_sheet`) |

### `events`
| section | elements |
|---|---|
| `list` | `tab`, `event_card` (opens `events.detail`), **`page_title` (dead)**, `create` (opens `create_event`), `profile_icon` |
| `detail` | `back`, `share` (native share, method=share_sheet), `copy_link` (method=copy_link), `going` (starts countdown), `cant`, `going_count`, `to_meet_count`, `map`, `add_to_calendar`, `assignment_row`, **`cover_image` (dead)** |
| `host` | `edit`, `going_count`, `invited_count`, `add_cohost`, `chip_in_edit`, `reminders_toggle` |
| `touch_grass` | `send` (opens `touch_grass_sheet`, parent=events), `featured_signal`, `signal_row`, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `hosting` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `going` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `invited` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `community` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |

### `create_event` *(surface — 4-step wizard, parent=`events`)*
| section | elements |
|---|---|
| `chrome` | `back`, `next`, `close`, **`step_title` (dead)** |
| `details` | `title`, `bio`, `date`, `time`, `date_picker`, `time_picker`, `address`, `address_result`, `cohost_toggle`, `cohost_search`, `cohost_row`, `chip_in_toggle`, `chip_in_amount`, `chip_in_method`, `chip_in_handle`, `friends_invite_toggle`, `guest_cap` |
| `invite` | `search`, `invite_row` (method on/off), `suggest_row` (method on/off) |
| `extras` | `add_cover`, `cover_mode`, `cover_emoji`, `cover_color`, `cover_text`, `add_assignment`, `assignment_row`, `assign_name` |
| `preview` | **`summary` (dead)**, `create` |

### `story` (viewer)
| section | elements |
|---|---|
| `viewer` | `tap_next`, `tap_prev`, `tap_pause` (center of media), `progress_bar` (**dead**), `author` (opens overflow), `overflow`, `close`, `caption_body` (**dead**) |
| `reaction_rail` | `sticker` (method=sticker, opens `sticker_tray`), `comment` (method=comment), `record` (method=video, opens `circle_recorder`), `reaction` (method=reaction). Order on screen: emoji → comment → record (red dot), bottom-right beside the caption. |

### `sticker_tray` *(surface — parent `story`)*
The emoji strip that unrolls sideways from the reaction rail.

| section | elements |
|---|---|
| `picker` | `strip` (**dead**), `emoji` (method=`sticker` for a built-in, `custom_sticker` for one they made), `custom_sticker` (opens `sticker_studio`), `dismiss` |

### `sticker_studio` *(surface — parent `sticker_tray`)*
Making your own sticker out of a photo you take. Capture only; no library picker.

| section | elements |
|---|---|
| `capture` | `shutter` (method=photo), `switch_camera`, `retake`, `use_it`, `dismiss` |

### `circle_recorder` *(surface — parent `story`)*
The 10-second round video reply.

| section | elements |
|---|---|
| `capture` | `record` (method=video), `stop`, `retake`, `send`, `switch_camera`, `permission_prompt`, `dismiss` |

### `recap_recorder` *(surface — parent `friends`)*
Record the week's 5 recap answers by voice, then pick who hears it. Pairs with the `take_recap` flow (§3) and the `recap_posted` product event (§3b). Never put audio in analytics.

| section | elements |
|---|---|
| `question` | **`body` (dead)**, **`list` (dead — full preview before recording)** |
| `record` | `start` (method=voice), `stop`, `rerecord`, `next` |
| `audience` | `close`, `friends`, `everyone` |
| `actions` | `start` (preview → Q1), `post`, `dismiss` |

### `recap_player` *(surface — parent `friends` / `home`; full page, not a sheet)*
Play the stitched weekly podcast. Pairs with `recap_played` + `recap_reaction_sent` (§3b).

| section | elements |
|---|---|
| `transport` | `play`, `pause`, `back`, `skip`, `scrub`, `speed` (method=`1`\|`1.3`\|`1.5`\|`2`) |
| `filter` | `chip` (method=`close`\|`friend`\|`acquaintance`; default Close) |
| `speaker` | **`body` (dead)** |
| `expiry` | **`label` (dead)** — days left until that person's clips expire |
| `in_this_week` | **`body` (dead)**, `voice` (tap to jump / relisten) |
| `react` | `open`, `emoji` (method=`sticker`) |
| `actions` | `dismiss` |

### `catch_up` *(surface)*
| section | elements |
|---|---|
| `chrome` | `peek`, `handle`, `dismiss` |
| `top` | `poll`, `event`, `going`, `question` |
| `week` | `day_card` (`page_viewed`, `page_index`, `dwell_ms`) |
| `bottom` | `answered_row` (**dead** — receipt, no results), `reply` |

### `messages`
| section | elements |
|---|---|
| `top_nav` | `page_title` (**dead**), `new_message`, `search`, `profile_icon` |
| `conversation` | `row`, `section_header` (**dead**), `contact_card_row`, `cap_note` (**dead**), `bubble`, `share_contact`, `make_a_plan`, `back`, `maxed_notice` |
| `composer` | `input`, `send` |
| `contact_card` | `edit`, `field_toggle`, `share`, `field_row` (**dead**) |

### `new_message_sheet` *(surface)*
| section | elements |
|---|---|
| `search` | `input` |
| `list` | `friend_row` |
| `chrome` | `dismiss` |

### `reveal` *(surface/flow)*
| section | elements |
|---|---|
| `flow` | `how_you_met_choice`, `record_place_toggle`, `tier_choice`, `meet_note`, `continue`, `see_profile`, `tap_next` (story forward), `tap_prev` (story back), `close` (X → new connection's profile), **`progress` (dead)**, **`orbs` (dead)**, **`venn` (dead, legacy)** |

### `coop` (portal)
| section | elements |
|---|---|
| `ideas` | `idea_card`, `support`, `comment`, `submit` |
| `vote` | `beta_vote`, `dues_vote`, `mission_support` |

### `quiz` (take / result surface)
| section | elements |
|---|---|
| `take` | `option`, `explain`, `next`, `back`, **`progress` (dead)** |
| `result` | **`label` (dead)**, `share`, `who_got_who`, `see_more`, `done` |

Pairs with product events `quiz_started` / `quiz_question_answered` / `quiz_adapted` / `quiz_abandoned` / `quiz_completed` (§3b). Never put explanation text in analytics.

### `delight`
| section | elements |
|---|---|
| `gift` | **`attribution` (dead)**, `dismiss` |

### `not_found` *(surface — Magic Patterns Windows 404 dialog)*
| section | elements |
|---|---|
| `chrome` | `dismiss` (title-bar X) |
| `dialog` | **`body` (dead)**, `ok` |

### `admin` (operator console)
| section | elements |
|---|---|
| `login` | `password`, `submit` |
| `nav` | `live_quiz`, `registry`, `activity`, `coop`, `members`, `home_defaults`, `prompts`, `delights`, `not_found_hits`, `logout` |
| `actions` | `set_live_quiz`, `new_quiz`, `save_quiz_design`, `save_activity`, `toggle_activity`, `publish_announcement`, `save_home_defaults`, `save_prompts`, `toggle_delight`, `new_delight` |

---

## 7 · Dead-click catalog (tag these `interactive:false`)

The high-value "what did they *expect*" signals. Tag every one so a tap logs `dead_click`:
- **All page/section headers & titles** (`*.top_nav.page_title`, `*.*.section_header`, `onboarding.chrome.step_title`) — your "do they touch the headers?" question.
- **Section info tooltip body** (`section_info_tooltip.body.body`) — taps on the explanation text itself.
- **Sticky-note bodies** (`home.inside_jokes_strip.sticky_note_body`, `profile.inside_jokes.note_body`).
- **About Me** on friend pages (`profile.about_them.about_me`).
- **This-or-That row bodies** (`profile.*.this_or_that_row` body).
- **Card bodies / whitespace** (suggestion cards, event cover, profile header bg).
- **Empty-state graphics & illustrations.**

Keep to **semantic regions**, not every pixel — enough to learn intent without noise.

---

## 8 · Method breakdowns (so you can compare choices)

| Where | `method` values | Answers |
|---|---|---|
| `friends.add_sheet` | `qr` · `link` · `scan` | "QR vs link when adding friends?" |
| `post_composer` | `photo` · `video` · `text` · `voice` | what people post most |
| `story.reaction_rail` | `video` · `comment` · `sticker` · `reaction` | **"videos vs comments vs reactions?"** |
| `hobbies_widget` / `places_map` | `swipe` · `dropdown` | do they swipe or use the dropdown |
| `*.*.info` (section titles) | `hover` · `tap` | do people discover help by hovering (web) or tapping? |

---

## 9 · Timing catalog (record these durations)

- `time_to_complete_ms` on every flow in §3 (onboarding, post_story, add_friend, customize_profile, touch_grass_send…).
- `dwell_ms` on `customize` (**"how long do they customize?"**), on each `catch_up.day_card`, on sheets.
- `duration_since_screen_load` on every event (hesitation before first tap).
- `session_duration` + last event before `screen_exited` (**rage-quit detection**).

---

## 10 · PM cheatsheet (your exact questions → queries)

- **"Do people touch the headers?"** → `action=dead_click`, `element` ends in `page_title`/`section_header`, group by `screen`.
- **"Do they tap sticky notes?"** → `id=*.inside_jokes*.note*`, split `click` vs `dead_click`.
- **"Do they use the suggested buttons when posting?"** → `id=post_composer.suggested.suggested_prompt`, `action=click` vs post-composer completions.
- **"Do they get the '+' after posting?"** → `home.stories_row.add_after_post` click rate.
- **"Is the touch-grass sheet its own thing?"** → yes: `surface=touch_grass_sheet`, split by `parent_screen` (home vs events); `surface_dismissed` dwell = opened-then-bailed.
- **"Do they customize, and how long?"** → `flow=customize_profile` completion rate + `customize` `dwell_ms`.
- **"What do they open first on Profile?"** → `surface=profile`, `first_interaction=true`, group by `element`.
- **"Dropdown vs swipe for interests?"** → `hobbies_widget`, group by `method`; order via `page_viewed.page_index`.
- **"Do they tap About Me / This-or-That on a friend's page?"** → `dead_click` on `profile.about_them.about_me` / `this_or_that_row`.
- **"Announcement touch-grass vs going to Events?"** → `home.announcements.touch_grass_im_in` vs navigation to `events`; `carousel_depth` = do they even swipe to see more.
- **"Do they open notifications?"** → `home.notifications_preview.*` + `notifications` screen views.
- **"Videos vs comments vs reactions?"** → `story.reaction_rail`, group by `method`.
- **"QR vs link when adding friends?"** → `add_friend` flow, group by `method`.
- **"Which quizzes get started but never finished?"** → `quiz_started` vs `quiz_completed`, group by `quiz_id`; `quiz_abandoned.percent_complete` shows where they drop.
- **"Which modules do people actually complete?"** → `module_started` vs `module_completed`, group by `module` (a module clicked but never completed is a friction flag).
- **"Do people re-tier friends, or just view them?"** → `friend_retiered` count vs `friends.roster.row` clicks — big gap = they open friends but never organize.
- **"How do people usually add friends?"** → `friend_added`, group by `method`.
- **"Do quizzes need adapting a lot?"** → `quiz_adapted`, group by `reason` (lots of `select_all` = the questions are unclear).
- **"What do they never use?"** (kill-list) → any `id` with near-zero `click`/product-event but real impressions/dead_clicks → candidate to cut.

---

## 11 · Renames log (append-only)

| Date | Old ID | New ID | Reason |
|---|---|---|---|
| — | — | — | — |
