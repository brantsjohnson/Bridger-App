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
| `behind_the_scenes` | archived from Discover list (IDs kept) | Optional disclosure pre-quiz — open then bail? finish vs skip? (`dwell_ms`) |
| `your_vibe` | `discover` (Personality quizzes / `connect_over`) | Personality quiz — open then bail? finish? (`dwell_ms`) |
| `the_friend_zone` | `discover` (Personality quizzes / `connect_over`) | Attachment quiz — open then bail? finish? (`dwell_ms`) |
| `what_gets_you_going` | `discover` (Personality quizzes / `connect_over`) | Values quiz — open then bail? finish? skips? (`dwell_ms`) |
| `your_funny_bone` | `discover` (Personality quizzes / `connect_over`) | Humor taste quiz — open then bail? finish? (`dwell_ms`) |
| `end_quiz_sheet` | `quiz` | Back mid-take: do they confirm End quiz or Keep going? (`dwell_ms`) |
| `quiz_share` | shared `/q/<token>` | friend opened a J-name link: take (no account) vs make account vs add friend |
| `post_composer` | `home` (your collage) | camera-first: shutter then just-shot vs editor? finish? |
| `just_shot` | `post_composer` | after shutter: Done vs Make it a collage vs Retake (`dwell_ms`) |
| `collage_editor` | `post_composer` | optional canvas: add, drag, leave, Next |
| `collage_hub` | `collage_editor` | "+" sheet: which add tile? |
| `collage_paper` | `collage_editor` | paper vs pack |
| `collage_text` | `collage_editor` | type then Done vs dismiss |
| `collage_voice` | `collage_editor` | record / transcribe / add |
| `collage_people` | `collage_editor` | tag friends then Done |
| `collage_cutout` | `collage_editor` | subject lift vs shape |
| `collage_layer` | `collage_editor` | frame / colour / tilt / delete |
| `collage_exit` | `collage_editor` | Save for later vs Discard |
| `collage_finish` | `collage_editor` | save roll / share / Done |
| `collage_packs` | `collage_editor` | Use a pack |
| `collage_layouts` | `collage_editor` | pick a layout |
| `prompts_tray` | `post_composer` | **retired** — themed squares removed from capture (keep historical events) |
| `caption_sheet` | `post_composer` | tap the caption slot then bail vs Done (`dwell_ms`) |
| `audience_sheet` | `post_composer` | opened the who-sees-this sheet; changed or just looked? |
| `add_media_sheet` | `post_composer` | "+": Camera vs Camera roll |
| `customize_tray` | `post_composer` | pencil: paper swatches + Undo; do people open it at all? (`dwell_ms`) |
| `add_friend_sheet` | `friends` | Connect contacts vs QR vs link vs scan (method) |
| `friends_contacts_sheet` | `friends` | pick one on-device contact to save a private card |
| `pending_profile` | `friends` | card you made for someone not on Bridger yet; notes vs invite |
| `add_inside_joke_sheet` | `friends` or `profile` | Full-screen composer: sticky note, color, friend search, event search, co-op photo |
| `invite_access` | post-onboarding gate (demo week) | must invite a friend to unlock app — do they bail? |
| `invite_contacts_sheet` | `invite_access` | pick one contact to text invite link (on-device only) |
| `onboarding_invite_contacts_sheet` | `onboarding` | pick a contact for invite slot #1 / #2 / #3 during onboarding |
| `onboarding_song_search_sheet` | `onboarding` | after Spotify/Apple connect: search + pick the song on repeat |
| `onboarding_privacy_edit_sheet` | `onboarding` | edit one Privacy & Control row’s text; Save writes Supabase |
| `coop_join_sheet` | `coop` | our own paywall: pick pay method (App Store / Google Play / Card), then monthly / yearly — do they open then bail, and on which step? |
| `onboarding_coop_join_sheet` | `onboarding` | same join sheet, launched from the last onboarding step |
| `customize` | `profile.settings` | do they customize at all, and for how long (`dwell_ms`) |
| `friend_options_sheet` | `profile.friend_view` | remove / block / report reach |
| `create_hub` *(retired)* | — | (removed — do not re-add) |
| `reveal` | connection | its own flow (§3) |
| `catch_up` | `story` | the swipe-up sheet |
| `create_event` | `events` | the 4-step create-event wizard — where in Details → Invite → Extras → Preview do hosts drop off? |
| `event_share_sheet` | `events.detail` | native share invoked? |
| `event_people_sheet` | `events.detail` | going / invited people list — open then bail? |
| `event_host_note_sheet` | `events.detail` | host note composer: open then bail vs send? |
| `event_album` | `events.detail` | album viewer: save vs just look? (`dwell_ms`) |
| `circle_connect` | share link / QR | fan connect: drop-off on visibility vs handles? |
| `circles_settings` | `profile.settings` | pause / disconnect vs just look |
| `influencer_portal` | Influencer chrome | query then create event vs bail |
| `influencer_join` | Influencer marketing | pay then confirm vs bail |
| `version_quiz_author` | TBD home | author wizard drop-off |
| `version_quiz_take` | share link | friend take vs abandon |
| `section_info_tooltip` | any screen with section headers | do they open section help then bail? which sections? (`dwell_ms`, `section`) |
| `recap_recorder` | `friends` (Friend Pod) | record the week's 5 answers by voice — do they start and give up? which question do they quit on? (`dwell_ms`) |
| `recap_player` | `friends` (Friend Pod) | full-page weekly podcast — play, speed, filter, week strip, jump voices, react, this week's questions; do they open earlier weeks or bail? (`dwell_ms`) |
| `onboarding_info_note` | `onboarding` | ⓘ claim-and-proof note on New info screens — open then bail? (`dwell_ms`) |
| `add_bucket_sheet` | `profile` (own Bucket list tab) | add a want — do they open then bail? |
| `edit_bucket_sheet` | `profile` (own Bucket list tab) | edit / delete a want — do they open then bail? |
| `profile_intro` | `profile` (own, first visit) | mandatory one-time black welcome before fill (Events/Discover vibe) |
| `profile_search_sheet` | `profile` (own or friend) | search this profile's visible fields — never logs query text |
| `photo_look_sheet` | `profile` (own, Edit) | switch profile photo look (Pop art / Comic / Sepia / X-ray) — open then bail? save? |
| `assistant` | Settings (opt-in only) | relationship Assistant chat — never logs query/note/transcript text |

**Rule:** opening a sheet emits `surface_opened`; closing without acting emits `surface_dismissed` with `dwell_ms`. That single pair answers "do people open this and give up?"

---

## 3 · Flows (named + timed)

A **flow** is a multi-step task. Each emits `flow_started`, `flow_step` (with the step name + `duration_since_screen_load`), and `flow_completed` **or** `flow_abandoned` (with `time_to_complete_ms` and the last step reached). This is how you answer "did this take forever / where do they quit."

| Flow | Steps (order tracked) |
|---|---|
| `welcome` | first-open CRT intro: open → each typed screen (cue + `method` tap\|auto + `page_index`) → complete. Typing is not skippable. Reduce Motion has no auto-advance. |
| `onboarding` | New: name → photo → birthday → why → privacy → product picks → selected features → coop story → welcome-in. Old (demo): confirm profile → … → coop |
| `post_story` | open composer → capture (method photo\|video\|roll) → just_shot → (optional editor) → audience (editor Next) or Done (last audience) → post (server-confirmed) |
| `add_friend` | open sheet → choose method (contacts/qr/link/scan) → send/confirm |
| `customize_profile` | open → each change → save (with total `dwell_ms`) |
| `profile_intro` | open (mandatory once) → continue |
| `touch_grass_send` | open sheet → who → when → why → send |
| `discover_me` | each question in order → finish |
| `reveal` | how-you-met → orbs (strongest) → also-got (quiz scores + commonalities) → see profile |
| `create_event` | details → invite → extras → preview (then `event_created`) |
| `take_quiz` | each question (+ explanation, order tracked) → result → pairs with the `quiz_*` product events (§3b) |
| `connect_circle` | confirm influencer → visibility tier → platforms/handles → create (`circle_connected`) |
| `influencer_join` | pick plan → pay → confirmed (`influencer_joined`) |
| `create_version_quiz` | versions → questions → weights → preview → publish (`version_quiz_published`) |
| `send_event_note` | compose → pick audience → send (`event_host_note_sent`) |
| `behind_the_scenes` | intro cards → conditions → (other label?) → impact per item → match weight → close; pairs with `quiz_*` for `quiz_id=disclosure` (never note/custom-label text) |
| `your_vibe` | intro → each question (multi-select + optional explain) → result; pairs with `quiz_*` for `quiz_id=personality` (never explain text) |
| `the_friend_zone` | intro → each question (multi-select + optional explain) → result; pairs with `quiz_*` for `quiz_id=attachment` (never explain text) |
| `what_gets_you_going` | intro → each question (single pick + optional explain; up to 3 skips) → result; pairs with `quiz_*` for `quiz_id=values` (never explain text) |
| `your_funny_bone` | intro → each question (multi-select + optional explain; media caps) → result; pairs with `quiz_*` for `quiz_id=humor` (never explain text or media titles) |
| `take_recap` | open recorder → preview (all questions) → each question (q1…q5, order tracked) → pick audience → post (then `recap_posted`) |

---

## 3b · Product events (what actually happened, not just what was tapped)

**A tap is not an outcome.** "Clicked the quiz tile" ≠ "completed the quiz." "Clicked a friend row" ≠ "re-tiered that friend." Record the **domain outcome** as its own event, separate from the UI click, with the state that changed. These are the events that tell you if Bridger *works*.

**Timing rule (easy to get wrong):** product events fire on **confirmed outcomes**, never on the tap that *begins* them. Choosing "Share invite link" or "Scan a code" is a `flow_step` (method chosen). `friend_added` + `flow_completed` wait until the connection is actually created (redeem / deep-link / server callback). Same pattern everywhere: open share sheet ≠ `event_shared` until the OS reports a share; open camera ≠ successful scan. If you fire the §3b event on the button press, funnels inflate and method breakdowns (e.g. QR vs link) quietly skew.

| Product event | Fires when | Key properties |
|---|---|---|
| `quiz_started` | a quiz begins | `quiz_id`, `quiz_version` |
| `quiz_question_answered` | each question | `question_id`, `option_count` (how many selected), `explained` (bool), `is_inserted` (bool — was this a moderator-inserted clarifier vs. an authored question?), `dwell_ms` |
| `quiz_question_skipped` | a question is skipped | `question_id` |
| `quiz_adapted` | moderator rewords/inserts (per `QUIZ-ENGINE.md`) | `reason` (low_confidence/select_all/contradiction) |
| `quiz_abandoned` | left before finishing | `last_question_id`, `percent_complete`, `time_spent_ms` |
| `quiz_completed` | finished | `quiz_id`, `time_to_complete_ms`, `questions_answered`, `method` (`tap` first finish / `retake` fun run). Fun retakes do not overwrite the server result. |
| `quiz_shared` | shared a result | `quiz_id`, `method` (image / link / save_image / copy) — never the result name, card text, or URL |
| `module_started` / `module_completed` | a profile module (basics, hobbies, this-or-that, places, bucket_list, discover_me) | `module`, `items_added`, `time_to_complete_ms` |
| `module_item_added` | one item added (a hobby, a bucket-list item) | `module`, `friend_tagged` (bool), `visibility` |
| `place_favorited` | a travel place is starred FAV (onboarding seed or later toggle) | `—` (never place names) |
| `quick_check_kept` | Announcements quick check: user confirmed the stale fact is still true | `—` (never the question text) |
| `quick_check_removed` | Announcements quick check: user said the fact is no longer true | `—` (never the question text) |
| `friend_added` | a connection is **confirmed** (redeem / server create — not share-sheet or scan-button tap) | `method` (qr/link/scan/suggestion), `via` |
| `connect_requested` | a FoF connect request is **confirmed** from reveal Screen 3 (POST /connections success) | `surface` (`reveal`), `method` (`bridge`), `via_present` (bool) — never names |
| `invite_link_shared` | OS share completed or SMS compose opened with an invite link (not the tap alone; dismiss ≠ share) | `method` (`sms`\|`share`), `context` (`onboarding`\|`invite_access`), optional `slot` (1\|2\|3) — never names/phones |
| `friend_retiered` | a friend moves tiers (**not** just a drag) | `from_tier`, `to_tier` |
| `friend_removed` / `friend_blocked` / `friend_reported` | the action completes | `—` |
| `friend_note_added` | a private note / date / check-in is saved on a friend | `kind` (`text`\|`date`\|`check_in`), `cadence` (check_in only) — **never note text** |
| `friend_note_deleted` | a private note is removed | `—` |
| `friend_check_in_reminded` | a soft check-in nudge fires for the author | `cadence` — **never note text** |
| `story_posted` | a new Collage page posts (server-confirmed) | `method` (photo/video), `media_count`, `layout_id`, `layout_family`, `has_words`, `words_method` (text\|voice\|both\|none), `source_mix` (live\|roll\|mixed), `audience` (only_me\|close\|friend\|everyone\|group), `is_coop`, optional `event_id` |
| `scrapbook_page_updated` | a page posted earlier today changed (photo added, layout, caption, audience, merge, split) and the server confirmed | `revision`, `media_count`, `layout_family`, `added_via` (camera\|roll\|merge\|split) — never captions or images |
| `layout_changed` | tapped a different layout thumbnail | `from_layout_id`, `to_layout_id`, `layout_family`, `method` (tap) |
| `media_imported` | camera-roll import finished (files chosen, not the picker opening) | `count`, `kinds` (photo\|video\|mixed) |
| `scrapbook_page_deleted` | author deleted a page (merge emptied it) | `—` |
| `collage_audio_transcribed` | a voice note was transcribed (server confirmed) | `has_text` (bool). Never the transcript |
| `collage_friend_tagged` | a posted page tagged friends (server confirmed) | `tag_count`. Never person ids or names |
| `party_capture_prompt_sent` | mid-party capture nudge fires (`story_prompt` on, under daily cap) | `event_id` |
| `response_posted` | a reaction/reply posts | `method` (video/comment/sticker/custom_sticker/reaction), `duration_seconds` on video |
| `stories_caught_up` | finished every update in the tray (or a lone author) and the end screen showed | `—` |
| `sticker_created` | someone saves a sticker they made | `method` (photo) — **never the image** |
| `touch_grass_sent` | a signal is sent | `audience`, `when`, `has_why` (bool), `parent_screen` |
| `touch_grass_answered` | someone says I'm in | `—` |
| `touch_grass_declined` | someone quietly declines a signal | `parent_screen` |
| `recap_posted` | a weekly recap is posted | `answers` (count), `audience` — **never the audio** |
| `recap_played` | the weekly podcast is played | `voices` (count), `questions` (count), `is_current` (bool). Never a week label |
| `recap_reaction_sent` | sticker/emoji reaction on a recap | `method` (sticker) — **never the emoji** |
| `recap_question_submitted` | a question is suggested for a future week | `—` (never the question text) |
| `recap_question_voted` | a submitted question is upvoted | `—` |
| `poll_created` / `poll_answered` | poll actions | `—` |
| `event_created` | an event is created | `has_cohost`, `has_chip_in`, `has_cover`, `assignment_count`, `invited_count`, `has_recurrence` (bool), optional `recurrence_freq` (`weekly`\|`monthly`\|`yearly` only — never until/count or schedule prose; never title/bio/address text) |
| `event_assignment_added` | host adds an assignment item | `—` (no item text) |
| `event_assignment_taken` | a guest claims / is assigned an item | `—` (no item text or names) |
| `event_assignment_released` | assignee removes themselves from an item | `—` |
| `event_assignment_done` | assignee or host/co-host checks off (or unchecks) an item | `—` |
| `event_shared` | OS reports the event was shared, or web copied the link when Share was unavailable | `method` (`share_sheet` \| `copy_link`) |
| `event_introduction_notified` | introduction pings sent for an event | `count` (people notified — never names) |
| `event_guest_invited` | a person was added to an event invite list (confirmed server/demo write) | `via` (`host` \| `attendee`) — **never names** |
| `event_host_note_sent` | host/co-host note is stored and delivered | `audience` (`going`\|`invited`\|`both`), `has_photo` (bool) — never text |
| `event_reminder_sent` | scheduled 2d / 2h reminder worker fires | `offset` (`two_days`\|`two_hours`) |
| `event_album_saved` | OS/browser confirmed save or download of an album photo | `method` (`photos`\|`download`) — never the image |
| `event_album_uploaded` | guest album upload stored | `method` (`camera`\|`roll`) — never the image |
| `event_album_quota_hit` | upload blocked because the event pool is full | `—` |
| `event_album_storage_started` | host album add-on purchase confirms | `method` (apple/google/card/soft) — never receipt |
| `circle_connected` | Circle edge is created | `visibility_tier`, `platform_count` — never handles |
| `circle_disconnected` | edge hard-deleted | `—` |
| `circle_visibility_changed` | fan changed the Influencer's visibility tier | `from_tier`, `to_tier` |
| `circle_paused` / `circle_resumed` | fan paused or resumed the edge | `—` |
| `influencer_joined` | Influencer entitlement confirms | `method` (apple/google/card/soft/admin) — never receipt |
| `circle_event_created` | Event created with `audience_kind=circle` | `has_segment` (bool) — never member names |
| `version_quiz_published` | user quiz goes live (share token minted) | `version_count`, `question_count` — never labels/text |
| `version_quiz_completed` | friend finish scored on the server | `quiz_id` (`version_of_me`), `author_ref` — never version label |
| `version_quiz_shared` | OS share or save-image of a version result | `method` (image / link / save_image) |
| `rsvp_going` / `rsvp_cant` | RSVP actions | `—` |
| `inside_joke_posted` | a note is posted | `tagged_people`, `tagged_event` (bool), `has_photo` (bool) — never joke text, names, or the image |
| `bucket_item_checked` | an item is completed | `—` |
| `bucket_item_updated` | an item's text / friends / privacy is saved | `friend_tagged` (bool), `visibility` |
| `bucket_item_deleted` | an item is removed | `method` (`swipe` / `edit_mode` / `sheet`) |
| `profile_customized` | customize is saved | `changes_count`, `dwell_ms` |
| `profile_photo_updated` | profile / About me photo saved after Take or Upload (not sheet open) | `method` (`camera`\|`library`) — never the image |
| `profile_photo_filter_updated` | own profile saved a new photo look from Edit → Photo look sheet (confirmed bake) | `filter` (`pop_art`\|`comic`\|`x_ray`\|`sepia`) — never the image |
| `profile_theme_saved` | Theme tokens saved (accent / background / font / mode) on customize | `accent`, `background`, `font`, `mode`, `dwell_ms` — never CSS or asset URLs |
| `profile_layout_saved` | Layout order of movable modules saved | `module_count`, `dwell_ms` |
| `connection_revealed` | a reveal completes | `recorded_where` (bool), `added_note` (bool), `meet_context` (`just-met` \| `already-know`), `to_tier` — NEVER place/note text or names |
| `music_connected` / `music_disconnected` | Spotify or Apple Music link confirmed / removed | `method` (`spotify`\|`apple_music`) — **never** track titles |
| `music_preview_played` | ~30s preview actually started | `method` (`tap`) — **never** title/artist |
| `music_pick_saved` | Listening / song of week / fav catalog pick saved | `method` (pick `kind`) — **never** title |
| `music_saved_to_library` | Viewer saved a track to their Spotify library | `method` (`spotify`) |
| `music_taste_synced` | Top artists sync completed after connect | `method` (`spotify`\|`apple_music`) |
| `message_sent` | a chat message posts | `counts_against_cap` (bool) — NEVER include message text |
| `message_hearted` | you hearted or unhearted a friend's bubble | `on` (bool), `counts_against_cap` (always false), `method` (`double_tap`\|`a11y`) — NEVER include message text |
| `contact_shared` | contact card shared into a thread | `counts_against_cap` (always false) — NEVER include field values |
| `auth_signed_in` | sign-in succeeds | `method` (phone/google/apple/email) |
| `auth_signed_up` | account create succeeds | `method` (phone/google/apple/email) |
| `auth_signed_out` | Log out confirmed in Profile Settings | `method` (`settings`) |
| `demo_mode_entered` | person confirms logo long-press unlock into fake-data demo | `method` (`logo_long_press`) — no PII |
| `membership_interests_selected` | New onboarding Co-op 6 saved | `count` (opaque ids only) |
| `help_interests_selected` | New onboarding Product 2 saved | `count` (opaque ids only) |
| `pending_person_merged` | server merged pending contact cards into a new phone account | `count` (never phones / names) |
| `pending_person_saved` | you saved a private card for someone not on Bridger yet | `already_had` (bool, demo) — never phones / names |
| `demo_mode_left` | person leaves runtime demo from Settings | `method` (`settings`) |
| `screen_not_found` | unmatched route or broken connection path shows the 404 dialog | `missing_path`, `path_trail` (joined routes, no PII), `reason` (`unmatched_route`\|`connection_error`\|`runtime_error`) |
| `assistant_enabled` / `assistant_disabled` | Settings toggle | `method` (`setting`) |
| `assistant_opened` | Billy surface opens | `entry` (`settings`\|`home`\|`voice`\|`island`) |
| `billy_allowance_exhausted` | User hit monthly Billy USD allowance | `plan` (`taste`\|`plus`) |
| `billy_plus_started` | Billy+ activated (stub/admin/iap) | `method` (`stub`\|`admin`\|`iap`) |
| `billy_plus_cancel_scheduled` | Billy+ cancel at period end | — |
| `billy_vendor_outage_seen` | Client showed org outage (503) | — (once per session max) |
| `assistant_query` | a turn is sent | `mode` (`text`\|`voice`) — **never the query text** |
| `assistant_tool_proposed` | an act preview is shown | `tool` |
| `assistant_action_confirmed` / `assistant_action_cancelled` / `assistant_action_undone` | confirm / cancel / undo | `tool` when known |
| `delight_gifted` | someone sends a gift delight | `delight_slug` (never names) |
| `delight_played` | a gift delight finishes playing for the recipient | `delight_slug` |
| `activity_posted` | someone posts into the weekly activity | `—` |
| `activity_hearted` | someone hearts an activity post | `—` |
| `home_layout_saved` | user finishes editing their Home layout | `widget_count` |
| `connection_style_set` | onboarding desire step is confirmed (rank / primary saved) | `primary` (`frequency`\|`depth`\|`plans`\|`commonality`), `home_layout_seed` (`stay_close`\|`go_deeper`\|`make_plans`\|`meet_people`) — never free text |
| `onboarding_tier_chosen` | join screen choice is confirmed (soft Free Lite pick, or co-op soft-join / IAP path selected and accepted) | `method` (`coop`\|`free_lite`) — never receipt or PII |
| `coop_joined` | store purchase, card checkout, or promo code completes | `method` (apple/google/card/soft/promo), `plan` (monthly/yearly) — never receipt or PII |
| `coop_renewed` | RevenueCat `RENEWAL` / `UNCANCELLATION`, or Stripe `invoice.paid` on a renewal cycle (not the first invoice) | `method` (apple/google/card), `plan` (monthly/yearly when known), `provider` — server webhook only; never receipt or PII |
| `coop_expired` | RevenueCat `EXPIRATION` / `SUBSCRIPTION_PAUSED`, or Stripe subscription deleted / inactive | `method` (apple/google/card), `provider` — server webhook only; never receipt or PII |
| `coop_promo_redeemed` | server confirms an auth / promo code granted a free year | `method` (`promo`) — never the code text or PII |
| `coop_cancel_scheduled` | member schedules period-end cancel | `—` (perks stay until paid-through) |
| `coop_left` | membership ends (period elapsed or hard leave) | `—` |
| `notification_received` | a notification is delivered to the device/app | `kind`, `source` (`push` \| `in_app`) — NEVER text or names |
| `notification_opened` | user opens a notification (preview, list, or push) | `kind`, `source` (`preview` \| `list` \| `push`) — NEVER text or names |
| `notification_see_all` | user opens the full Notifications page from Home | `—` |
| `notifications_marked_read` | Mark all as read on the Notifications page (scoped to active `filter`) | `filter` (`all`\|`home`\|`friends`\|`events`\|`discover`) |
| `notification_pref_changed` | user flips a Settings kind or circle toggle | `pref` (kind or circle id), `pref_scope` (`kind` \| `circle`), `enabled` (bool) |
| `permission_result` | an OS permission prompt is answered | `permission` (`camera`\|`mic`\|`contacts`\|`notifications`\|`photos`\|`location`\|`calendar`), `outcome` (`granted`\|`denied`\|`dismissed`), `context` (e.g. `assistant`, `assistant_calendar`) — never content |
| `analytics_opted_in` | (legacy / unused in UI) was Settings toggle on | `method` (`settings`) |
| `analytics_opted_out` | (legacy / unused in UI) was Settings toggle off | `method` (`settings`) |
| `interests_share_toggled` | opt-in interests export saved (server-confirmed, not the tap) | `enabled` (bool), `hobbies` / `movies` / `books` / `currently_reading` (bool). Never taste values, slug, or token |

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
| `welcome` | `next` (appears after typing; `method=tap`), **`brand` (dead)**, **`beat_body` (dead)**, **`progress_bar` (dead, fill is painted on `next`)**. Typing is not skippable. Wait-out uses `welcome` flow_step `method=auto` (no click). Reduce Motion: `next` only, no auto-advance. Surface `auth`, parent `welcome`. |
| `sign_in` | **`page_title` (dead)**, `brand_logo` (long-press unlock when build allows), `phone`, `send_code`, `otp_code`, `verify`, `resend_otp`, `google` (method=google), `apple` (method=apple), `manual_link` (reveals email form), `email`, `password`, `submit`, `switch_to_sign_up` (**retired**: Create account merged into Sign in OAuth) |
| `sign_up` | **retired surface** (route redirects to `sign_in`); IDs kept for historical events only |
| `sign_up` | **`page_title` (dead)**, `google` (method=google), `apple` (method=apple), `manual_link` (reveals email form), `email`, `password`, `confirm_password`, `submit`, `switch_to_sign_in` |

### `chrome` (floating tab bar — global)
| section | elements |
|---|---|
| `tab_bar` | `tab_home`, `tab_friends`, `tab_events`, `tab_discover` (globe/"www" icon), `tab_news` (Lucide Newspaper), `profile_icon` (single-person line icon on the far-right of the pill — opens Profile; selected = ink pill like the other tabs; moved here from the header, replaces `*.top_nav.profile_icon`); **`tab_messages` retired from the pill** — Messages now opens from the header (`*.top_nav.messages_icon`) |

### `onboarding`
**New flow (preview `onboard`):** name → photo → birthday → why (2) → privacy (claim, two profiles, birthday Groups including Only Me) → product picks (10 features) → one screen per pick → co-op story → welcome-in → Home. Progress bar counts the six required actions. Co-op is optional. There is no join / invite fork. Copy: `onboarding-new-copy.ts`.

**Old flow (demo `onboardold`):** confirm profile → birthday → [feed stat] → contacts → [isolation stat] → friends of friends → [retention stat] → notifications → taste intro → right now → obsession → social battery → color → places → privacy circles → privacy & control → [screentime stat] → [co-op intro] → co-op. The four stat interstitials and the co-op intro splash do not count in the progress bar. Finishing Co-op completes onboarding and lands on Home, which plays the one-time welcome fireworks (own surface `welcome_celebration`). The old "You're in" screen (`welcome_in`) was removed 2026-08-28. The onboarding Recap voice step is archived; weekly recaps stay on Friend Pod.

| section | elements |
|---|---|
| `chrome` | `continue`, `skip`, `back`, `progress_bar`, **`step_title` (dead)**, `info_note` (opens surface `onboarding_info_note`) |
| `confirm_profile` | `first_input`, `last_input`, `photo_square` (opens system Take / Upload sheet), `take`, `upload`, `retake`, `filter_pop_art`, `filter_x_ray`, `filter_comic`, `filter_sepia`, `local_processing_badge` (dead — shown for Pop art, Comic, Sepia, and X-ray while the on-device preview is up), `photo_skip` (New: "Add one later") |
| `name` | `first_input`, `last_input`, `first_next`, `last_next`, `birthday_next` |
| `why` | `next_1`, `next_2`, **`visual` (dead)** |
| `privacy` | `acknowledge` (legacy), `next_1`, `next_2`, `save_audience`, `group_option`, `next_4`, `next_5`, `next_7`, **`visual` (dead)** |
| `groups` | `invite` (legacy), **`tier_card` (dead)**, `next_1`, `next_2`, `next_3`, **`visual` (dead)** |
| `custom_groups` | `to_coop`, `member_interest`, **`visual` (dead)** |
| `route` | `custom_groups_join`, `custom_groups_free`, `vote_join`, `vote_later`, `no_ads_join`, `no_ads_invite`, **`visual` (dead)** |
| `free` | `choose_friends`, `continue`, `skip`, **`visual` (dead)** |
| `product` | `next_1`, `save_help`, `option`, **`visual` (dead)**, `feature_next`, `see_more` |
| `plans` | `next_1`, `next_2`, `branch_next`, **`visual` (dead)** |
| `friendsb` | `next_1`, `next_2`, `branch_next`, **`visual` (dead)** |
| `memories` | `next_1`, `next_2`, `next_3`, `branch_next`, `option`, **`visual` (dead)** |
| `discover` | `next_1`, `next_2`, `branch_suggest`, `branch_browse`, **`visual` (dead)** |
| `basics` | `answer` (birthday) |
| `stat` | `info` (opens sources sheet from the "i" beside "A quick reality check", `variant`), `bridge` ("Let's try again", `variant`), `advance` (screentime only: tap to the next life-story beat, `page_index`), `band` (screentime only: tap a filled year-band to open/close its years accordion, `page_index`), **`adjust` (deprecated — hours picker removed)**, **`visual` (dead — animated art)**, **`headline` (dead — display-font title)**, **`caption` (dead — changing "you'll spend X years" line)** |
| `contacts` | `sync`, `invite` (legacy single-button), `invite_slot` (`slot` 1\|2\|3), `contact_row` (sheet pick), `contacts_cancel`, `contact_search` (focus search in invite sheet; never query text), **`awesome_banner` (dead — "AWESOME! We'll notify you when friends join.")**, `skip` |
| `friends_of_friends` | `style` (opaque key via `style`: `workout`\|`go_out`\|`creative`\|`industry`\|`travel`\|`nearby`\|`gets_me`), `all` ("All of the above"), `skip` |
| `notifications` | `pref` (`pref`: `birthdays`\|`life_updates`\|`meet`\|`activities`\|`messages`\|`reconnect`; method `on`\|`off` via Toggle), `all` ("All of the above") |
| `taste` | `start`, **`preview_list` (dead — excited headline)**, `current_input`, `dream_input`, `spotify`, `apple`, `song_input`, `song_search` / `song_result` / `song_search_cancel` (post-connect picker sheet; never query/title), `nights_option` (`nights`), `color_swatch` (`color`, method=`spectrum`), `color_slider` (`color`, method=`slider` — saturation fine-tune under the spectrum), `hometown_input`, `hometown_privacy` (method=`private`\|`close`), `current_town_input`, `current_town_privacy` (method=`private`\|`close`), `favorite_place_input`, `favorite_place_privacy` (method=`private`\|`close`), `place_search` (focus favorite-place search; never logs query text), **`place_pick_hint` (dead — "Tap a place to pin it")**, `place_result` (confirmed pick; never place names), **`recap_record` / `recap_play` / `recap_type` (archived — onboarding Recap step removed; Friend Pod keeps live recap)**, `skip` |
| `circles` | **`lock` (dead — animated padlock)**, **`tier_card` (dead — Close / Friends / Acquaintances meaning + Free Lite caps)** |
| `review` | `row_audience` (`field`, `tier`), `set_all` (`tier`), `row_edit` / `row_edit_save` / `row_edit_cancel` (`field`; never content), `terms`, `privacy_policy` |
| `coop_intro` | `continue` (green "See what you get" → join page), **`body` (dead — the "what a co-op is" explainer paragraphs)** |
| `coop` | `invite_free` (Option A; props `invites_sent` 0–2; 3rd invite finishes Old onboarding → Home), `join_paid` (Option B; opens the join sheet; long-press 10s reveals auth link), `apple_pay` / `google_pay` (In-App Purchase method in the join sheet; not the Apple Pay / Google Pay marks), `card` (Stripe Checkout method; web / Android only), `plan_monthly` / `plan_yearly` (pick billing period in the join sheet, then pay), `use_free` (when 3 invites already filled from Contacts: "Continue with free access"), `see_more` (expand/collapse the Free vs Co-op table; prop `expanded`), `redeem_open` (hidden until 10s hold on Join; redeem finishes → Home), `redeem_input`, `redeem_submit`, **`plan_compare` (dead — Free vs Co-op comparison table body)**, **`perks_grid` (dead — legacy member perk bullet list)**, `next_1`…`next_5`, `save_interests`, `interest_option`, `skip_to_product`, **`visual` (dead)**, `see_more_benefits`, `benefit_support`, `benefit_early` |
| `welcome_in` | `lets_go`, **`next_cards` (dead)** — archived. New flow ends on `onboarding.coop` join / invite. Home plays `welcome_celebration`. |
| _legacy (retired screens, ids kept so old events parse)_ | `privacy.acknowledge`, `photo.*`, `meet.*`, onboarding `recap` step (`taste.recap_*`), older New keys (`first-name`, `last-name`, `product-2`, groups / route / free) |

Flow tracking uses `flow_started` / `flow_step` / `flow_completed` with `flow='onboarding'`. Each screen emits `flow_step` with the step key. The screentime stat also emits `flow_step` with `flow_step=stat-screentime` and `page_index` for each life-story beat (0 life, 1 sleep, 2 upkeep, 3 devices, 4 social, 5 cta). Co-op emits `flow_step` with `step=coop` and `method` for the button tapped; confirmed outcome emits `onboarding_tier_chosen` (`coop`\|`free_lite`) and, when membership actually starts, `coop_joined`. Friends-of-friends confirmed save emits `connection_style_set` with the opaque keys only. New onboarding confirmed chips emit `membership_interests_selected` / `help_interests_selected`.

### `home`
| section | elements |
|---|---|
| `top_nav` | `search`, `messages_icon`, **`header_logo` (dead)**, **`page_title` (dead)**, `profile_icon`, `edit_layout` |
| `announcements` | `carousel` (swipe, `carousel_depth`), `card`, `touch_grass_im_in`, `touch_grass_details`, `touch_grass_dismiss`, `quick_check_yes`, `quick_check_edit`, `quick_check_dismiss` (X closes with no answer), **`quick_check_body` (dead)**, **`quick_check_result` (dead — "Kept it." / "Removed…" banner)**, `intro_card` (one-time explainer; tap dismisses), `intro_dismiss` (X), **`intro_body` (dead)**, `coop_card`, `coming_up_card`, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `assistant` | `open`, `mic`, `stop_listen`, `suggestion`, `dismiss`, `draft_approve`, `draft_edit`, `event_approve`, `composer`, `send`, `confirm`, `cancel`, **`mark` (dead)**, **`body` (dead)**, **`event_preview` (dead)**, **`transcript` (dead)**, **`empty_state` (dead)**, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap); legacy `open_card` unused |
| `stories_row` | `your_story` (opens `post_composer`), `story_tile`, `tier_filter`, `add_after_post` (the "+"), **`stories_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), `post_prompt` (empty Stories CTA: "Post a story!") |
| `responses` | `response`, `reply`, `responses_header` (opens your story replies / comments) |
| `touch_grass_button` | `send` (opens `touch_grass_sheet`) |
| `notifications_preview` | `row`, `see_all` (card body or See all → Notifications page), **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), **`empty_body` (dead — "All caught up!")**, `example_row` (seeded Notification Example; self-hides after tap), **`example_badge` (dead — "Example" pill)** |
| `inside_jokes_strip` | `note`, `add`, **`sticky_note_body` (dead — do they tap the note itself?)** |
| `ask_the_group` | `create_poll`, `ask_question`, `see_previous_polls`, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `this_week` | `play_recap`, `add_recap`, `take_quiz`, `next_event`, `open_events` (empty This week → Events tab), `example_card` (seeded Event Example; self-hides after tap), **`example_badge` (dead — "Example" pill)**, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `coming_up` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), **`empty_body` (dead — blue teach card when nothing is due)**, `empty_dismiss` (X hides Coming up until real items) |
| `activity` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), `open`, `heart`, `post` |
| `quiz` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), `take`, `open_result`, `share`, `take_prompt` (standing "Which J name are you?" when no live quiz payload) |
| `coop` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), `open_portal`, `join`, `use_free` |
| `cold_start` | **`body` (dead)**, `cta` (method=link/qr/scan) |

### `welcome_celebration` *(surface — parent `home`; plays once right after onboarding)*
Black see-through overlay with fireworks + "You did it! Welcome to Bridger!!!" and firework haptics. Shown one time when Home opens right after Co-op finishes onboarding, tap anywhere to continue. Emits `surface_opened` / `surface_dismissed` (`dwell_ms`). Reduce Motion shows the words only (no fireworks, no haptics).
| section | elements |
|---|---|
| `overlay` | `continue` (tap anywhere / the "Tap to continue" hint), **`body` (dead — fireworks + celebration words)** |

### `section_info_tooltip` *(surface)*
| section | elements |
|---|---|
| `chrome` | `dismiss` |
| `body` | **`body` (dead)** |

### `touch_grass_sheet` *(surface)*
| section | elements |
|---|---|
| `who` | `close`, `friends` (`everyone` retired, id kept) |
| `when` | `now`, `tonight`, `weekend` |
| `why` | `input` |
| `actions` | `send`, `dismiss` |

### `grass_signal_sheet` *(surface)*
| section | elements |
|---|---|
| `actions` | `im_in`, `quietly_decline`, `dismiss` |

### `post_composer` *(surface — Collage capture + compose, two screens)*
| section | elements |
|---|---|
| `capture` | `photo`, `hold_video`, `switch_camera` (`method` button\|double_tap; double-tap on the preview flips the camera), `flash` (`flash_mode` off\|on\|auto), `roll` (opens OS picker; `media_imported` fires on files chosen), `today_page_thumb` (opens a page you made today), `zoom` (`zoom_factor` 0.5\|1\|2\|4; only chips the phone supports), **`count_pill` (dead — "2 photos", not step progress)**. Retired: `prompts_tray_open` |
| `caption` | `type`, `voice_to_text`, `done` |
| `page` | **`canvas` (dead — paper with nothing under the finger)**, `photo_slot` (`element_type`), `caption_slot`, `stamp`, `replace`, `remove`, `move_to_page` |
| `layouts` | `thumb` (`method` tap\|swipe, `page_index`, `carousel_depth`, `layout_id`, `layout_family`) |
| `pages` | `page_thumb` (another page from today), `new_page` (split a photo onto a new page) |
| `suggested` | **retired from capture:** `suggested_prompt`, `random_nudges_toggle`, **`random_nudges_label` (dead)**. Still used if present: `event_tag_label` (dead), `event_tag_clear` |
| `audience` | `chip` (legacy; compose now uses Next → sheet), `only_me`, `close`, `friends`, `everyone`, `group` |
| `actions` | `next` (opens `audience_sheet` to choose who), `post` (confirm "Post to Friends" / Close / Only me / Everyone inside the sheet), `done` (just-shot: post with last audience), `make_collage`, `retake`, `save_roll`, `add_another`, `discard`, `add` (opens `add_media_sheet`), `add_camera`, `add_roll`, `customize` (opens `customize_tray`), `background_swatch` (`paper`), `undo`, `back`, `info` (opens `section_info_tooltip`), `info_dismiss`, **`info_body` (dead)** |
| `just_shot` | **`on_page` (dead)**, `photo` |

### `collage_editor` *(surface — optional canvas after just-shot or today's-page thumb)*
| section | elements |
|---|---|
| `chrome` | `close`, `undo`, `redo`, `menu`, `next`, **`title` (dead)** |
| `menu` | `save_roll`, `learn`, `change_pack`, `clear`, `delete_page` |
| `page` | **`canvas` (dead)**, `piece` (`element_type`), `bin` |
| `rail` | `delete`, `duplicate`, `edit`, `rotate`, `bring_front` |
| `toolbar` | `text`, `add`, `camera`, `packs`, `voice` |

### `collage_hub` / `collage_paper` / `collage_text` / `collage_voice` / `collage_people` / `collage_cutout` / `collage_layer` / `collage_exit` / `collage_finish` / `collage_packs` / `collage_layouts` *(surfaces, parent `collage_editor` or `post_composer`)*
| surface | elements |
|---|---|
| `collage_hub` | `grid.text` / `camera` / `roll` / `voice` / `people` / `layout` / `paper` / `cutout` / `sticker`, **`chrome.title` (dead)**, `chrome.dismiss` |
| `collage_paper` | `swatch.paper` (`paper`), `swatch.pack` (`pack_id`), `swatch.spectrum` (open custom color), `chrome.done`, `chrome.dismiss`, **`chrome.title` (dead)** |
| `collage_text` | `field.type` (never log text), `tools.size` / `font` / `color` / `spectrum` (open custom color) / `box`, `chrome.done`, `chrome.dismiss`, **`chrome.title` (dead)** |
| `collage_voice` | `capture.record` / `stop` / `play` / `transcribe` / `add` / `permission_prompt`, `chrome.dismiss`, **`chrome.title` (dead)** |
| `collage_people` | `list.friend`, **`list.empty` (dead)**, `chrome.done`, `chrome.dismiss`, **`chrome.title` (dead)** |
| `collage_cutout` | `tools.subject` / `shape` (`clip`) / `add`, `chrome.dismiss`, **`chrome.title` (dead)** |
| `collage_layer` | `tabs.more` / `tilt` / `colour` / `frame`, `pick.option` / `swap` / `duplicate` / `delete`, `chrome.done`, `chrome.dismiss`, **`chrome.title` (dead)** |
| `collage_exit` | `actions.discard` / `save`, **`chrome.title` (dead)**, **`chrome.body` (dead)** |
| `collage_finish` | `actions.save_roll` / `share` / `done`, **`chrome.title` (dead)**, **`chrome.page` (dead)** |
| `collage_packs` | `list.use` (`pack_id`), `list.card`, `chrome.dismiss`, **`chrome.title` (dead)** |
| `collage_layouts` | `list.thumb`, `chrome.done`, `chrome.dismiss`, **`chrome.title` (dead)** |

### `prompts_tray` / `caption_sheet` / `audience_sheet` / `add_media_sheet` / `customize_tray` *(surfaces, parent `post_composer`)*
| surface | elements |
|---|---|
| `prompts_tray` | **retired** (`tray.dismiss` historical only) |
| `caption_sheet` | `tabs.type`, `tabs.record` (Phase 2), `actions.done`, `actions.dismiss` |
| `audience_sheet` | `actions.dismiss` (+ `post_composer.audience.*` fire inside it) |
| `add_media_sheet` | `actions.dismiss` (+ `post_composer.actions.add_camera` / `add_roll`) |
| `customize_tray` | `actions.dismiss` (+ `post_composer.actions.background_swatch` / `undo`) |

### `add_inside_joke_sheet` *(surface — Add an Inside Joke, full screen)*
| section | elements |
|---|---|
| `form` | `sticky_note` (square; photo starts quote ↔ photo flip, not an event), `quote_input`, **`color_header` (dead)**, `color_swatch` (`option` = accent key), `photo_add` / `photo_remove` / `photo_locked`, **`who_header` (dead)**, `who_search`, `who_chip`, **`who_empty` (dead)**, **`event_header` (dead)**, `event_search`, `where_input` (kept; free-text place retired), `where_event_chip` |
| `actions` | `post` (product `inside_joke_posted` after save: `tagged_people`, `tagged_event`, `has_photo`), `never_mind` |
| `chrome` | `close` |

### `ask_sheet` *(surface)*
| section | elements |
|---|---|
| `fields` | `prompt`, `option` (focus only; never log text) |
| `actions` | `add_option`, `remove_option`, `post` |

### `discover`
| section | elements |
|---|---|
| `top_nav` | `settings_icon`, `messages_icon`, **`page_title` (dead)**, `profile_icon` |
| `wants_to_connect` | `card`, `approve`, `decline`, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `people_to_meet` | `suggestion_card`, `add`, `dismiss`, `spotlight_card`, **`shared_thread_headline` (dead)**, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `local_map` | **`section_header` (dead)**, **`teaser_card` (dead)** (coming-soon friend-radar preview), `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `discover_me` | `answer`, `image_option`, `continue` |
| `connect_over` | **`section_header` (dead)** (user-facing title: Personality quizzes), `module_tile` (opens a private quiz; `module` id), `see_more` (opens `connect_over` screen), `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `in_common` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) — connection detail overlaps before Accept/Add |
| `maps` | `node`, `map_toggle` (swipe/dropdown) |
| `gate` | **`body` (dead)**, `get_started`, **`cta_loading` (dead)** (charging bar shown for the first 15 cumulative seconds before `get_started` unlocks) |
| `settings_sheet` | `discoverable_toggle`, `source_toggle`, `about_me_toggle` (per category), `dismiss` (surface=`discover_settings_sheet`) |

### `connect_over` (full Personality quizzes list; user-facing name only)
| section | elements |
|---|---|
| `list` | **`page_title` (dead)**, `back`, `module_tile` (opens a private module; `module` id) |

### `behind_the_scenes` (disclosure pre-quiz — archived from Discover list; IDs kept)
| section | elements |
|---|---|
| `chrome` | `back`, `skip`, **`progress` (dead)** |
| `intro` | **`card_body` (dead)**, `next`, `share`, `skip` |
| `conditions` | `option` (method = opaque condition_key enum only), `continue` |
| `other_label` | `input` (focus only; never logs text), `continue` |
| `impact` | `option` (method = impact level 1–4), `note_input` (focus only; never logs text), `continue` |
| `match_weight` | `option` (method = use\|a_little\|barely), `continue` |
| `close` | **`body` (dead)**, `start_fun`, `support_link` |

### `your_vibe` (personality quiz — own surface)
| section | elements |
|---|---|
| `chrome` | `back`, **`progress` (dead)** |
| `intro` | **`body` (dead)**, `start` |
| `take` | `option` (method = option id a–e only), `explain` (focus only; never logs text), `next`, `options_more` (method = prev\|next), `note_toggle` |
| `result` | **`body` (dead)**, `done` |

### `the_friend_zone` (attachment quiz — own surface)
| section | elements |
|---|---|
| `chrome` | `back`, **`progress` (dead)** |
| `intro` | **`body` (dead)**, `start` |
| `take` | `option` (method = option id a–d only), `explain` (focus only; never logs text), `next`, `options_more` (method = prev\|next), `note_toggle` |
| `result` | **`body` (dead)**, `done` |

### `what_gets_you_going` (values quiz — own surface)
| section | elements |
|---|---|
| `chrome` | `back`, **`progress` (dead)** |
| `intro` | **`body` (dead)**, `start` |
| `take` | `option` (method = option id a–d only; display order shuffled), `explain` (focus only; never logs text), `next`, `skip`, `options_more` (method = prev\|next), `note_toggle` |
| `result` | **`body` (dead)**, `done` |

### `your_funny_bone` (humor taste quiz — own surface)
| section | elements |
|---|---|
| `chrome` | `back`, **`progress` (dead)** |
| `intro` | **`body` (dead)**, `start` |
| `take` | `option` (method = option id / media id only — never titles), `explain` (focus only; never logs text), `next`, `options_more` (method = prev\|next), `note_toggle` |
| `result` | **`body` (dead)**, `done` |

### `invite_access` (demo week gate)
| section | elements |
|---|---|
| `main` | **`body` (dead)**, `invite_button` |
| `contacts_sheet` | `contact_row`, `cancel`, `contact_search` (focus; never query text) |

### `friends`
| section | elements |
|---|---|
| `top_nav` | `settings_icon`, `search` (retired in UI; search now lives under Your circle as `roster.search`), `messages_icon`, **`page_title` (dead)**, `profile_icon`, `add` (labeled "Add friend"), `edit` (retired in UI; Edit now lives beside Your circle as `roster.edit`) |
| `roster` | `row`, `drag_handle`, **`tier_header` (dead)**, `birthday_row`, `info` (opens `section_info_tooltip`, method=hover\|tap; `tier` prop), `add` (same Add friend control beside Your circle), `edit` (Edit / Done beside Your circle), `pending_row`, `pending_header` (info on Not on Bridger yet), `search` (under Your circle; never logs query text) |
| `add_sheet` | `invite_link` (method=link), `qr` (method=qr), `scan` (method=scan, camera viewfinder / demo sample), `scan_enable` (turn-on-camera / Open Settings when permission is off), `connect_contacts` (method=contacts), `contact_row`, `contacts_cancel` |
| `cold_start` | **`body` (dead)**, `connect_contacts` (method=contacts), `cta` (method=link\|qr\|scan) |
| `inside_jokes` | `note` (tap → next face; `page_index` 0 quote / 1 photo / 2 credits; auto flip is not an event), `add`, **`note_body` (dead)**, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `pod` | `play` (opens `recap_player` and starts audio), `open` (chevron / card: opens `recap_player` paused), `record` (opens `recap_recorder`), `submit_question`, `vote_question`, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |

### `profile` (own)
| section | elements |
|---|---|
| `tabs` | `profile`, `stories`, `inside_jokes`, `bucket_list` (record `first_interaction` → what they open first) |
| `header` | `avatar` (friend view: tap opens their story when `method=story` / ring present), `name`, **`city` (dead)**, `mutuals` (friend view — opens In common), `play_recap`, `story_tile`, `post_prompt` (own only: empty dashed story tile → opens `post_composer`), `tier_control`, `edit` (rearrange mode + opens Photo look sheet), `settings_gear` (own only: gear next to Edit → Settings), `view_as`, `search` (action-row search; never logs query text), `customize_look` (opens `customize`), `filter_pop_art` / `filter_comic` / `filter_sepia` / `filter_x_ray` (Photo look pills), `photo_look_save`, `photo_look_dismiss`, **`header_bg` (dead)**. `overflow` and `song` retired (see Renames) |
| `card` | `mutuals`, `top5`, `top5_row`, `about_me` (**dead**), `about_me_toggle`, `about_me_edit`, `about_me_bio_more`, `about_me_field_edit`, `about_me_reorder` (method=`up`\|`down`), `about_me_photo` (own Edit: Take/Upload; updates avatar), `upcoming`, `upcoming_row`, `obsession`, `obsession_square`, `favorites`, `favorites_tile`, `favorites_to_start`, `see_all` (pill under top-4 grids), `greatest_hits`, `greatest_hits_photo` (**dead**), `where_met`, `hobbies_widget` (method swipe/dropdown; `page_viewed`), `this_or_that_row` (tap + **dead** on the row body), `places_map` (swipe/list, `page_viewed`), `places_pin`, `favs`, `add_details`, `add_hobbies`, `add_favs`, `add_places`, `take_this_or_that`, `add_module`, `widget_edit` (pencil on a widget box), `widget_reorder` (method=`up`\|`down`). `currently` retired (see Renames) |
| `module` | `audience_set_all`, `audience_row`, `matchable_toggle`, `matchable_row`, `continue`, `cancel`, `hobby_select`, `hobby_search` (focus search; never logs query text), **`hobby_category` (dead)**, `hobby_add_own`, `hobby_custom_name`, `hobby_custom_emoji`, `hobby_custom_save`, `hobby_custom_remove`, `place_search` (focus search; never logs query text), `place_result` (picked a geocoded hit; no place names) |
| `intro` *(surface `profile_intro`)* | **`body` (dead)**, `continue` (visible label: Hell yeah; dismisses once forever) |
| `stories_calendar` | `day` (opens story), `month_nav`, `storage_bar` |
| `inside_jokes` | `note` (tap → next face; `page_index` 0 quote / 1 photo / 2 credits; auto flip is not an event), `add`, `filter`, **`note_body` (dead)** |
| `bucket_list` | `item`, `add`, `check_off`, `edit` (Edit/Done toggle), `edit_item` (open edit sheet), `delete` (method=`swipe`\|`edit_mode`\|`sheet`), `save` |
| `quizzes` | `untaken_row`, **`section_header` (dead)**, **`taken_row` (dead — finished quiz card body)**, `see_result`, `share`, `retake`, **`share_url` (dead)**, `copy_link`, `preview_link` |
| `settings` | `who_sees_what`, `customize_profile` (opens `customize`), `discover_toggle`, `coop`, `circles` (opens `circles_settings`; planned), `notifications` (opens `notification_prefs`), `account`, `delete_account`, `analytics_toggle` (**removed from Settings UI**; product analytics is on by default while signed in), `log_out`, `appearance`, `blocked_people`, `storage_plan`, `always_original`, `share_interests` (opt-in interests export; pairs with `interests_share_toggled`), `connect_spotify`, `disconnect_spotify`, `connect_apple_music`, `disconnect_apple_music`, `assistant_toggle`, `assistant_open`, **`billy_status` (dead)**, `billy_plus_cta`, `billy_plus_cancel`, **`surprises_header` (dead)**, `play_emoji_bomb`, `preview_emoji_rain`, `leave_demo` |
| `music` | `preview_play`, `preview_pause`, `open_spotify`, `open_apple_music`, `add_playlist`, `track_search` (never logs query text), `track_result`, `pick_save` |
| `top_nav` | **`page_title` (dead)**, `edit`, `back`, `search` (searches this profile's visible fields; never logs query text) |

### `music_track_sheet` *(surface)*
| section | elements |
|---|---|
| `chrome` | **`body` (dead)** |
| `actions` | `dismiss` |

### `customize` *(surface)*
| section | elements |
|---|---|
| `top_nav` | **`page_title` (dead)**, `back` |
| `style` | **`intro_body` (dead)**, `accent_option`, `background_option`, `font_option`, `mode_option`, **`preview` (dead)** |
| `layout` | `module_row`, `reorder` |
| `actions` | `save`, `view_original` |

### `profile` (friend view)
| section | elements |
|---|---|
| `tabs` | `about_them`, `in_common`, `inside_jokes`, `bucket_list` (their list, read-only — rows reuse `profile.bucket_list.item` as a **dead** target), `notes` (opens your private Notes & reminders) |
| `about_them` | `about_me` (**dead** — do they tap it expecting more?), `this_or_that_row` (**dead**), `hobbies_widget`, `places_map` (swipe/list on a friend's map) |
| `in_common` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), `mutual_row` (opens that mutual's profile), **`empty_body` (dead)**, `personality_quizzes` (opens `connect_over`; click only) |
| `actions` | `message` (the "Message <name>" pill in the header — there is no separate button any more), `emoji_bomb` (opens `send_delight`), `how_you_met`, `private_note`, `overflow` (opens `friend_options_sheet`) |
| `notes_reminders` | **`section_header` (dead)**, `kind` (Note\|Date\|Check in), `cadence` (week\|biweek\|month), `add`, `delete` — never log note body text |

### `news`
| section | elements |
|---|---|
| `top_nav` | **`page_title` (dead)**, `messages_icon` (header shortcut), `profile_icon` |
| `feed` | **`empty_body` (dead — the "coming soon" placeholder)** |

### `events`
| section | elements |
|---|---|
| `list` | `tab`, `event_card` (opens `events.detail`), **`page_title` (dead)**, `create` (opens `create_event`), `messages_icon` (header shortcut), `profile_icon` |
| `gate` | **`headline` (dead)**, **`body` (dead)**, **`idea_wall` (dead)**, **`idea_chip` (dead)**, **`touch_grass_mark` (dead)**, `explore` (dismisses gate into Events list), **`cta_loading` (dead)** (charging bar shown for the first 15 cumulative seconds before `explore` unlocks). `create` retired |
| `detail` | `back`, `share` (header only; native share sheet, web falls back to copy link; method=`share_sheet`\|`copy_link`), `going`, `cant`, `going_count`, `to_meet_count`, `meet_row`, `map`, `add_to_calendar`, `assignment_row`, `assign_name`, `album_open`, `album_save`, `album_upload`, **`album_title` (dead)**, **`host_note_body` (dead)**, **`title_body` (dead)**, **`date_chip` (dead)**, **`countdown` (dead)**, **`details_body` (dead)**, **`cover_image` (dead)**. `copy_link` element id retired as a separate button |
| `host` | `edit`, `going_count`, `invited_count`, `add_cohost`, `chip_in_edit`, `reminders_toggle`, **`reminders_header` (dead)**, `introduction_row`, **`introductions_header` (dead)**, `host_note_compose`, `album_storage_add`. `brought_count` retired (attribution lives in `event_people_sheet`) |
| `touch_grass` | `send` (opens `touch_grass_sheet`, parent=events), `end` (ends your live signal; button stays the big green control), `featured_signal`, `signal_row`, **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `hosting` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `going` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `invited` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap) |
| `community` | **`section_header` (dead)**, `info` (opens `section_info_tooltip`, method=hover\|tap), **`teaser_card` (dead — Coming soon street illustration, same layout as Discover Local map)** |

### `event_people_sheet` *(surface — parent `events.detail`)*
| section | elements |
|---|---|
| `tabs` | `going`, `invited` |
| `list` | `row` (**dead** — names not logged; when friends-can-invite is on, row may show attribution copy in UI only) |
| `actions` | `dismiss` |

### `event_host_note_sheet` *(surface — parent `events.detail`)*
One-way host note composer. Pairs with `send_event_note` + `event_host_note_sent`.

| section | elements |
|---|---|
| `compose` | **`title` (dead)**, `text_input` (never log text), `add_photo`, `audience`, `send`, `cancel` |

### `event_album` *(surface — parent `events.detail`)*
Full-screen album viewer. Pairs with `event_album_saved` / `event_album_uploaded`.

| section | elements |
|---|---|
| `viewer` | `photo`, `save`, `close`, `upload`, **`empty_body` (dead)** |

### `create_event` *(surface — 4-step wizard, parent=`events`)*
| section | elements |
|---|---|
| `chrome` | `back`, `next`, `close`, **`step_title` (dead)** |
| `details` | `title`, `bio`, `date`, `time`, `date_picker`, `time_picker`, `address`, `address_result`, `repeats_toggle`, `repeats_freq`, `repeats_interval`, `repeats_weekday`, `repeats_monthly_mode`, `repeats_monthday`, `repeats_setpos`, `repeats_ends`, `repeats_until`, `repeats_count`, `cohost_toggle`, `cohost_search`, `cohost_row`, `chip_in_toggle`, `chip_in_amount`, `chip_in_method`, `chip_in_handle`, `friends_invite_toggle`, `guest_cap` |
| `invite` | `search`, `invite_row` (method on/off), `suggest_row` (method on/off) |
| `extras` | `add_cover`, `cover_mode`, `cover_emoji`, `cover_color`, `cover_text`, `add_assignment`, `assignment_row`, `assign_name` |
| `preview` | **`summary` (dead)**, `create` |

### `story` (viewer)
| section | elements |
|---|---|
| `viewer` | `tap_next`, `tap_prev`, `tap_pause` (center of media), `progress_bar` (**dead**), `author` (opens overflow), `overflow`, `close`, `caption_body` (**dead**), `caught_up_body` (**dead** — "You're all caught up" end screen), `caught_up_done` (Done / X on that screen) |
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

### `pending_profile` *(screen — parent `friends`)*
Card you made for someone not on Bridger yet. Notes reuse `profile.notes_reminders.*`. Never log phones or note text.

| section | elements |
|---|---|
| `top_nav` | **`page_title` (dead)**, `back` |
| `header` | **`name` (dead)**, **`status` (dead)** |
| `notes` | **`section_header` (dead)** |
| `actions` | `invite` |

### `recap_recorder` *(surface — parent `friends`)*
Record the week's 5 recap answers by voice, then pick who hears it. Pairs with the `take_recap` flow (§3) and the `recap_posted` product event (§3b). Never put audio in analytics.

Now a three-phase flow: **record → review → posted**. The five questions are a swipeable deck (skipping is expected); each take can be heard back (`record.play`/`pause`) or redone before Review. The posted confirmation stays put and closes only on `actions.done`.

| section | elements |
|---|---|
| `question` | **`body` (dead)**, **`list` (dead — full preview before recording)**, `segment` (jump to a question in the deck; method=`tap`\|`swipe`, `page_index`) |
| `record` | `start` (method=voice), `stop`, `play`, `pause`, `rerecord`, `next` |
| `audience` | `close`, `friends`, `everyone` (chip label is Acquaintances; id stays `everyone`) |
| `actions` | `start` (preview → Q1), `review` (record → review), `back` (review → questions), `post`, `done` (close the confirmation), `dismiss` |

### `recap_player` *(surface — parent `friends` / `home`; full page, not a sheet)*
Play the stitched weekly podcast. Pairs with `recap_played` + `recap_reaction_sent` (§3b).

| section | elements |
|---|---|
| `transport` | `play`, `pause`, `back`, `skip`, `scrub`, `speed` (a pill that opens a slider; method=the chosen rate `1`–`2.5`; saved on device as the default for every listen and next week) |
| `filter` | `chip` (method=`close`\|`friend`\|`acquaintance`; default Close) |
| `weeks` | **`body` (dead)**, `row` (method=`current`\|`past`; never the week label), `join` (Free Lite → co-op) |
| `speaker` | **`body` (dead)** |
| `expiry` | **`label` (dead)** — days left until that person's clips expire |
| `in_this_week` | **`body` (dead)**, `voice` (tap to jump / relisten) |
| `react` | `open`, `emoji` (method=`sticker`) |
| `questions` | **`body` (dead)**, **`row` (dead)** — this week's five questions on the page |
| `suggest` | `input` (focus; never question text), `send`, `vote` |
| `actions` | `record` ("Add your recap" → opens `recap_recorder`), `record_another` (posted panel), `dismiss` |

### `catch_up` *(surface)*
| section | elements |
|---|---|
| `chrome` | `peek`, `handle`, `dismiss` |
| `top` | `poll`, `event`, `going`, `question` |
| `week` | `day_card` (`page_viewed`, `page_index`, `dwell_ms`) |
| `currently` | `listening`, `reading` (**dead**), `preview_play` |
| `bottom` | `answered_row` (**dead** — receipt, no results), `reply` |

### `messages`
| section | elements |
|---|---|
| `top_nav` | `page_title` (**dead**), `new_message`, `search`, `profile_icon` |
| `conversation` | `row`, `section_header` (**dead**), `contact_card_row` (toggles dropdown; `method: dropdown`), `contact_card_chip` (expands shared-card bubble; `method: dropdown`; never opens `tel:`), `cap_note` (**dead**), `bubble` (**dead** single tap), `heart` (double-tap; product `message_hearted`), `share_contact`, `make_a_plan` (retired, id kept), `back`, `maxed_notice` |
| `composer` | `input`, `send` |
| `contact_card` | surface opened under Messages dropdown (`parent_screen: messages`); `field_toggle`, `field_input` (focus only; never logs value), `field_row` (**dead**, retired), `edit` / `share` (**retired** — share is `conversation.share_contact`) |

### `notifications` *(Notifications page — See all from Home)*
| section | elements |
|---|---|
| `top_nav` | **`page_title` (dead)**, `back` |
| `list` | `row` (opens destination by `kind`; never opens nested list), **`empty_body` (dead)**, `filter` (All\|Home\|Friends\|Events\|Discover), `mark_all_read` (product `notifications_marked_read`) |

### `activity` *(Side Quest wall — opened from Home Side Quest card)*
| section | elements |
|---|---|
| `top_nav` | **`page_title` (dead)**, `back` |
| `prompt` | **`prompt_card` (dead)** |
| `chrome` | `post` ("Post yours" button) |
| `grid` | **`polaroid` (dead)** (single-tap, photo quests), **`text_note` (dead)** (single-tap, text quests), `heart` (double-tap; product `activity_hearted`), `dash_post`, **`empty_body` (dead)** |

### `activity_capture` *(surface — capture / blurb sheet over the wall)*
| section | elements |
|---|---|
| `chrome` | `shutter` (photo quests), `caption_input` (photo caption), `blurb_input` (text quests; never logs text), `audience_picker`, `post` (product `activity_posted`), `close` |

### `notification_prefs` *(Profile → Settings → Notifications)*
| section | elements |
|---|---|
| `top_nav` | **`page_title` (dead)**, `back` |
| `list` | **`intro_body` (dead)**, **`who_header` (dead)**, **`section_header` (dead)**, `toggle` (per kind or circle id + `pref_scope`; product event `notification_pref_changed`) |

### `new_message_sheet` *(surface)*
| section | elements |
|---|---|
| `search` | `input` |
| `list` | `friend_row` |
| `chrome` | `dismiss` |

### `assistant` *(opt-in Billy surface — full Screen; Home Widget; Island when live off Home)*
| section | elements |
|---|---|
| `chat` | **`header` (dead)**, **`transcript` (dead)**, **`composer` (dead)**, **`empty_state` (dead)**, **`mark` (dead)**, **`working` (dead)**, `send`, `voice`, `close`, `suggestion` |
| `proposal` | **`preview` (dead)**, `confirm`, `cancel` |
| `draft` | **`body` (dead)**, **`outcome` (dead)**, `edit`, `approve`, `voice_edit` |
| `event` | **`body` (dead)**, `approve` |
| `island` | `open`, `stop` (stop square while listening; discard, no send), **`mark` (dead)**, **`line` (dead)** |
| `activity` | `row`, `undo` |

Settings: `profile.settings.assistant_toggle`, `profile.settings.assistant_open`. Home Widget: `home.assistant.*` → `assistant_opened` with `entry=home`. Island: `assistant.island.open` when Billy is live and you are not on Home. Never log query, note, or transcript text.

### `reveal` *(surface/flow)*
| section | elements |
|---|---|
| `flow` | `how_you_met_choice`, `record_place_toggle`, `tier_choice`, `meet_note`, `meet_note_toggle`, `continue`, `see_profile`, `tap_next` (story forward), `tap_prev` (story back), `close` (X → new connection's profile), **`progress` (dead)**, **`orbs` (dead)**, **`venn` (dead, legacy)** |
| `quiz_matches` | `info` (opens `section_info_tooltip`, method=hover\|tap — "From the quizzes you both took") |
| `suggestions` | **`title` (dead)** ("People you might click with"), **`card` (dead)** (FoF card body), `add` (Add FoF), `optin_toggle` (Turn on Discover) |
| `thin` | **`body` (dead)** ("Nothing to line up yet"), `personality_quizzes` (opens `connect_over`; click only. `quiz_completed` later) |

Pairs with product events `connection_revealed` (beat 0 commit) and `connect_requested` (Screen 3 Add, confirmed POST only).

### `coop` (benefits + multi-page portal)
| section | elements |
|---|---|
| `benefits` | `page_title`, `info`, `free_info`, `unlocks_info`, `hero` (dead), `join`, `use_free`, `open_portal`, `redeem_open`, `redeem_input`, `redeem_submit`, `restore` |
| `portal` | `page_title`, `info`, `hero` (dead), `nav_overview`, `guide_card`, `join_cta`, `feedback`, `spend_body` (dead), `shipped_body` (dead) |
| `mission` | `nav`, `info`, `page_title`, `section_header` (dead), `principle_card` (dead), `support` |
| `model` | `nav`, `info`, `roadmap_info`, `compare_info`, `page_title`, `section_header` (dead), `phase_card` (dead), `comparison` (dead) |
| `ideas` | `nav`, `info`, `section_header` (dead), `idea_card`, `support`, `comment`, `submit`, `open_submit` |
| `vote` | `nav`, `info`, `section_header` (dead), `verify`, `beta_vote`, `dues_vote` (retired in UI), `mission_support` |
| `cost` | `nav`, `info`, `books_info`, `sim_info`, `roles_info`, `page_title`, `section_header` (dead), `books` (dead), `slider`, `reset`, `role_card` |
| `manage` | `info`, `page_title`, `open`, `cancel`, `confirm_cancel`, `customer_center` |

### `quiz` (take / result surface)
| section | elements |
|---|---|
| `take` | `option`, `explain`, `next`, `back`, **`progress` (dead)**, **`question` (dead)**, **`commentary` (dead)** |
| `result` | **`label` (dead)**, `share`, `who_got_who`, `see_more`, `done`, **`connect_header` (dead)**, **`connect_body` (dead)**, `share_link`, `share_story`, `save_image`, `view_first`, `view_fun`, `retake`, **`fun_note` (dead)**, **`empty_board` (dead)**, `invite_friends`, **`duo_card` (dead)**, `make_account`, `add_friend`, **`share_url` (dead)**, `copy_link`, `preview_link` |

Pairs with product events `quiz_started` / `quiz_question_answered` / `quiz_adapted` / `quiz_abandoned` / `quiz_completed` (§3b). Never put explanation text in analytics. `quiz.take.back` is the X on every take and commentary screen (no back arrow). It opens `end_quiz_sheet` while a take is in progress. `quiz_abandoned` fires only if they confirm End quiz. First J-name finish is `method=tap` and writes the server result. A later run is `quiz_started` / `quiz_completed` with `method=retake` and stays on-device. `view_first` / `view_fun` record flipping between those two cards. A logged-out take from a share link can finish without an account (`make_account` is the CTA). `quiz_shared.method=copy` is a confirmed clipboard write of the invite URL (never the URL itself). `friend_added` with `method=link` fires only after the server confirms the quiz-share friendship.

### `quiz_share` *(surface — public `/q/<token>` page; `parent_screen` = `quiz`)*
| section | elements |
|---|---|
| `body` | **`headline` (dead)**, **`card` (dead)**, **`note` (dead)** |
| `actions` | `take`, `make_account`, `add_friend` |

No-account take is allowed. `friend_added` waits for server confirm on `add_friend` or signup resolve. Never log the token or URL.

### `end_quiz_sheet` *(surface)*
| section | elements |
|---|---|
| `body` | **`body` (dead)** |
| `actions` | `end` (leaves; product `quiz_abandoned`), `stay`, `dismiss` |

### `delight`
| section | elements |
|---|---|
| `gift` | **`attribution` (dead)**, `dismiss` |

### `send_delight` *(surface — gift confirm sheet; `parent_screen` = person)*
| section | elements |
|---|---|
| `sheet` | **`body` (dead)**, `send`, `cancel` |

Pairs with product events `delight_gifted` / `delight_played` (`delight_slug` only, never names).

### `not_found` *(surface — Magic Patterns Windows 404 dialog)*
| section | elements |
|---|---|
| `chrome` | `dismiss` (title-bar X) |
| `dialog` | **`body` (dead)** ("You're invited to suffer"), `ok` (visible label: OK) |

### `circle_connect` *(surface — Influencer share link / QR)*
| section | elements |
|---|---|
| `confirm` | **`name_body` (dead)**, **`not_a_friend_note` (dead)**, `continue` |
| `visibility` | `tier` (`acquaintance`\|`friend`\|`close`), `continue` |
| `handles` | `platform`, `handle_input` (never log values), `skip`, `continue` |
| `actions` | `connect` (outcome `circle_connected`), `cancel` |

### `circles_settings` *(surface — parent `profile`)*
| section | elements |
|---|---|
| `top_nav` | **`page_title` (dead)**, `back` |
| `list` | `row`, `visibility`, `edit_handles`, `pause`, `disconnect`, **`empty_body` (dead)** |

### `influencer_portal` *(surface)*
| section | elements |
|---|---|
| `top_nav` | **`page_title` (dead)**, `back` |
| `query` | `filter`, `run` (never log filter values), **`count_body` (dead — private size)** |
| `members` | `row` |
| `actions` | `create_event` |

### `influencer_join` *(surface)*
| section | elements |
|---|---|
| `plan` | `monthly`, `yearly`, `join` (outcome `influencer_joined`) |

### `version_quiz_author` *(surface)*
| section | elements |
|---|---|
| `versions` | `add`, `photo`, `label_input` (never log text), `continue` |
| `questions` | `add`, `option`, `continue` |
| `weights` | `weight`, `continue` |
| `preview` | `take`, `continue` |
| `actions` | `publish` (outcome `version_quiz_published`), `save_draft` |

### `version_quiz_take` / `version_quiz_result` *(surfaces)*
Reuse `quiz.take` / `quiz.result` element names. `quiz_id=version_of_me`. Result share uses `quiz.result.share` / `save_image`.

### `admin` (operator console)
| section | elements |
|---|---|
| `login` | `password`, `submit` |
| `nav` | `live_quiz`, `registry`, `activity`, `coop`, `portal`, `members`, `promo_codes`, `home_defaults`, `prompts`, `delights`, `not_found_hits`, `logout` |
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
- **Thin reveal / In common empty copy** (`reveal.thin.body`, `profile.in_common.empty_body`).
- **J-name result extras** (`quiz.result.connect_header`, `quiz.result.connect_body`, `quiz.result.fun_note`, `quiz.result.empty_board`, `quiz.result.duo_card`, `quiz.result.share_url`, `profile.quizzes.taken_row`, `profile.quizzes.share_url`, `quiz_share.body.headline` / `card` / `note`).
- **Circles empty list** (`circles_settings.list.empty_body`) and **not-a-friend note** (`circle_connect.confirm.not_a_friend_note`).
- **Event album title** and **host note body** (`events.detail.album_title`, `events.detail.host_note_body`).
- **Influencer portal private count** (`influencer_portal.query.count_body`).
- **New onboarding VisualSlot pictures** (`onboarding.why.visual`, `privacy.visual`, `groups.visual`, `custom_groups.visual`, `route.visual`, `free.visual`, `coop.visual`, `product.visual`, `plans.visual`, `friendsb.visual`, `memories.visual`, `discover.visual`) — placeholders until Magic Patterns art ships.

Keep to **semantic regions**, not every pixel — enough to learn intent without noise.

---

## 8 · Method breakdowns (so you can compare choices)

| Where | `method` values | Answers |
|---|---|---|
| `quiz` product events | `tap` · `retake` | first J-name finish vs a later fun run |
| `friends.add_sheet` | `qr` · `link` · `scan` | "QR vs link when adding friends?" |
| `circle_connect` | `link` · `qr` | how fans add an Influencer (v1) |
| `event_album` | `camera` · `roll` · `photos` · `download` | upload source vs save path |
| `post_composer` | `photo` · `video` · `roll` · `text` · `voice` | what people post most; live capture vs camera roll |
| `post_composer.layouts.thumb` | `tap` · `swipe` | do they swipe the layout row or take what is on screen? |
| `story.reaction_rail` | `video` · `comment` · `sticker` · `reaction` | **"videos vs comments vs reactions?"** |
| `hobbies_widget` / `places_map` | `swipe` · `dropdown` | do they swipe or use the dropdown |
| `onboarding.desire.option` | `frequency` · `depth` · `plans` · `commonality` | which desire leads? |
| `onboarding.coop` / `onboarding_tier_chosen` | `coop` · `free_lite` | **"do people pick Free Lite or co-op?"** |
| `*.*.info` (section titles) | `hover` · `tap` | do people discover help by hovering (web) or tapping? |
| `auth.welcome.next` / `welcome` flow | `tap` · `auto` | do people tap Next or wait out the five-second fill? |

> **Note on `hover`:** the `hover` method exists only on web. iOS/Android have no hover state, so `*.*.info` on native emits only `tap`. Don't compare hover rates across platforms — treat `hover` as a web-only discovery signal.

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
- **"Do they use the suggested buttons when posting?"** → retired 2026-09-09 (themed OOTD / Hot take squares removed from capture).
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
- **"How do people usually add friends?"** → `friend_added`, group by `method`. Count **only** confirmed connections — never share/scan button taps (`flow_step` is the begin; `friend_added` is the finish).
- **"Do quizzes need adapting a lot?"** → `quiz_adapted`, group by `reason` (lots of `select_all` = the questions are unclear).
- **"Do the AI's inserted questions actually help?"** → `quiz_question_answered`, compare `explained` rate + `dwell_ms` where `is_inserted=true` vs `false`; pair with `quiz_completed` to see if adapted quizzes finish more often.
- **"Which notification types are worth sending?"** → `notification_opened` ÷ `notification_received`, group by `kind`; low open-rate kinds are candidates to cut or soften.
- **"Where are we losing people to permission denials?"** → `permission_result` where `outcome=denied`, group by `permission` + `context`; a high deny rate on a given prompt means the ask is mistimed or the purpose string is weak.
- **"What do they never use?"** (kill-list) → any `id` with near-zero `click`/product-event but real impressions/dead_clicks → candidate to cut.

---

## 11 · Renames log (append-only)

| Date | Old ID | New ID | Reason |
|---|---|---|---|
| 2026-09-09 | — | `*.inside_jokes.note` tap may send `page_index` (0 quote / 1 photo / 2 credits) | Square notes; photo notes auto-flip quote ↔ photo (not an event) |
| 2026-09-09 | `friends.top_nav.edit` | `friends.roster.edit` (beside Your circle). `top_nav.edit` kept for history | Edit sits with the roster it changes, not the page header |
| 2026-09-09 | — | `add_inside_joke_sheet.form.sticky_note` / `color_header` / `color_swatch` / `photo_add` / `photo_remove` / `photo_locked` / `who_header` / `who_search` / `event_header` / `event_search`; `inside_joke_posted.has_photo` | Full-screen Inside Joke composer (note, color, friend/event search, co-op photo). Never joke text. |
| 2026-09-09 | — | `friends.pod.open` | Friend Pod card: arrow opens player paused; `play` starts audio |
| 2026-09-09 | — | `recap_player.weeks.body` / `row` / `join`; `recap_played.is_current` | Friend Pod earlier weeks (co-op). `row.method` is current\|past, never the week label |
| 2026-09-09 | — | `recap_recorder.question.segment`; `recap_recorder.actions.review` / `back` / `done` | Recorder is now record → review → posted with a swipeable question deck; `speed` is a slider up to 2.5x saved on device (method = the rate) |
| 2026-09-09 | `friends.pod.record` / `submit_question` (rows removed from the widget; ids kept for history) | `recap_player.actions.record` / `record_another` | "Add your recap" + suggest-a-question moved onto the recap page; the Friends widget is now just the play card |
| 2026-09-09 | New `welcome_in` arrival | archived again; New last step is `coop-join` (`onboarding.coop.*`) | Join / invite finishes → Home `welcome_celebration` |
| 2026-09-09 | — | `onboarding.chrome.info_note`; `onboarding.product.feature_next` / `see_more`; `onboarding.coop.see_more_benefits` / `benefit_support` / `benefit_early`; surface `onboarding_info_note`; `recap_player.questions.*` / `recap_player.suggest.*` | Magic Patterns New onboarding + Friend Pod questions on the page |
| 2026-09-09 | — | `quiz.result.connect_header` / `connect_body` / `share_link` / `share_story` / `save_image` / `view_first` / `view_fun` / `retake` / `fun_note` / `empty_board` / `invite_friends`; `profile.quizzes.taken_row` / `see_result` / `share` / `retake` | J-name dual result + first/fun flip + Profile lasting quiz card |
| 2026-09-09 | — | `quiz_share` surface; `quiz.result.duo_card` / `make_account` / `add_friend` / `share_url` / `copy_link` / `preview_link`; `profile.quizzes.share_url` / `copy_link` / `preview_link`; `quiz_shared.method` adds `copy` | Guest J-name take (no account) + visible invite URL + signup adds the sharer as a friend |
| 2026-09-09 | — | `reveal.thin.body` / `reveal.thin.personality_quizzes`; `profile.in_common.empty_body` / `profile.in_common.personality_quizzes` | Thin reveal + In common empty: Personality quizzes CTA (click only). User-facing "Connect Over" → Personality quizzes; analytics ids stay `connect_over`. Behind the Scenes archived from Discover list (IDs kept). |
| 2026-09-08 | — | `auth.sign_in.phone` / `send_code` / `otp_code` / `verify` / `resend_otp`; New onboarding `why.*` `privacy.*` `groups.next_*` `custom_groups.*` `route.*` `free.*` `product.*` `plans.*` `friendsb.*` `memories.*` `discover.*`; `membership_interests_selected` / `help_interests_selected` / `pending_person_merged` | Phone OTP + New onboarding education flow |
| 2026-08-30 | — | `add_inside_joke_sheet.*` | Inside Joke composer: Who said it + where text field |
| 2026-08-30 | — | `activity.grid.text_note`, `activity_capture.chrome.blurb_input` | Text Side Quests (Notes App Discovery) |
| 2026-08-30 | `*.top_nav.profile_icon` (header avatar, all tabs) | `chrome.tab_bar.profile_icon` (pill far-right) | Global nav update: profile face moved from the top-left header to the far-right of the bottom nav pill; titles now sit flush left. Old `top_nav.profile_icon` ids kept, retired |
| 2026-08-05 | `home.responses.responses_header` (dead) | `home.responses.responses_header` (interactive) | Header row opens story replies; matched Magic Patterns + HOME.md |
| 2026-08-05 | — | `notifications.*` surface + `notification_opened` / `notification_see_all` | Notifications page + destination map (`NOTIFICATIONS.md`) |
| 2026-08-05 | — | `home.notifications_preview.empty_body` | Home Notifications "All caught up!" null state |
| 2026-08-05 | — | `notifications.list.filter` / `mark_all_read` + `notifications_marked_read` | Page filters (no Messages) + mark all read |
| 2026-08-05 | `profile.settings.notifications` (toggle) | opens `notification_prefs` + `notification_pref_changed` | Per-group prefs instead of master switch |
| 2026-08-05 | group pref ids (`close`, `events`, …) | per-`kind` + circle prefs (`pref_scope`) | Individual kinds + Close/Friends/Acquaintances (acq off by default) |
| 2026-08-05 | `home.this_week.play_recap` on ActivityWidget | `home.activity.open` | Activity card opens collage, not recap |
| 2026-08-05 | — | `activity` + `activity_capture` surfaces | Weekly activity collage + capture sheet |
| 2026-08-05 | — | `profile.header.mutuals`, `profile.in_common.mutual_row` | Friend header mutuals → In common faces |
| 2026-08-05 | `events.detail.copy_link` | retired (id kept) | One Share opens native sheet; copy lives inside it |
| 2026-08-05 | — | `event_people_sheet.*`, `events.host.brought_count`, `events.detail.assign_name` / `meet_row`, `event_introduction_notified` | Event detail people sheet, assignments dropdown, introductions |
| 2026-08-05 | — | `profile.bucket_list.edit` / `edit_item` / `delete` / `save` + `add_bucket_sheet` / `edit_bucket_sheet` + `bucket_item_updated` / `bucket_item_deleted` | Bucket list swipe-to-delete + Edit mode |
| 2026-08-05 | — | `profile.notes_reminders.*` + `friend_note_added` / `friend_note_deleted` / `friend_check_in_reminded` + `friend_check_in` notify kind | Private friend notes, date reminders, check-in nudges |
| 2026-08-05 | — | `profile.tabs.notes` | Notes moved into friend profile tab bar |
| 2026-08-06 | `event_people_sheet` (5 stray sections) | moved `touch_grass`/`hosting`/`going`/`invited`/`community` to `events` screen | Surface boundary fix — those are Events list tabs, not the people sheet |
| 2026-08-06 | `quiz_question_answered` | + `is_inserted` (bool) | Measure authored vs. moderator-inserted questions |
| 2026-08-06 | — | `notification_received` | Denominator for notification open-rate per kind |
| 2026-08-06 | — | `permission_result` | Capture OS permission granted/denied/dismissed + context |
| 2026-08-06 | — | §8 `hover` web-only note | Prevent cross-platform misreads of hover data |
| 2026-08-05 | Events `FreeNowStrip` replacing button | keep big `TouchGrassButton` + `events.touch_grass.end` | Live signal must not shrink the send button into a thin strip |
| 2026-08-06 | `friend_added` / `add_friend` complete on tap | complete on connection confirm only | Tap begins method (`flow_step`); outcome waits for redeem/server — stops link/scan inflation |
| 2026-08-06 | `event_shared` on share-sheet open | only when `Share.sharedAction` | Same timing rule: dismiss/cancel is not a share |
| 2026-08-06 | `profile.header.song`, `profile.card.currently` | `profile.header.play_recap` + `profile.card.obsession` / `obsession_square` | Spotify-artist profile: Listening/Reading absorbed into Current Obsession |
| 2026-08-07 | — | `send_delight` surface, `profile.actions.emoji_bomb`, `profile.settings.play_emoji_bomb` / `preview_emoji_rain` / `surprises_header` | Delight umbrella + emoji-bomb gift |
| 2026-08-27 | — | `profile.settings.connect_apple_music` / `disconnect_apple_music`; `music_taste_synced` method includes `apple_music` | Apple Music account link + taste sync (never titles) |
| 2026-08-07 | — | `profile_theme_saved` / `profile_layout_saved` product events | Phase B Theme + Layout customize outcomes |
| 2026-08-07 | — | `profile.card.greatest_hits_photo` | Greatest hits photo body (dead_click) |
| 2026-08-06 | — | `profile.card.top5`, `favorites_*`, `upcoming_*`, `mutuals`, `where_met`, `greatest_hits`, `about_me_toggle`, `see_all` | Spotify layout sections (PROFILE.md) |
| 2026-08-06 | — | `profile.card.about_me_edit`, `about_me_bio_more`, `about_me_field_edit`, `about_me_reorder` | About me stays open; Rest of bio; per-field Edit when Edit is on |
| 2026-08-06 | — | `profile.header.city`, `story_tile`, `tier_control`, `edit`, `view_as`, `profile.top_nav.search` | Header chrome for Spotify-artist profile |
| 2026-08-06 | — | `profile.module.matchable_toggle` / `matchable_row` + `profile_intro` surface | Module Discover consent + mandatory one-time intro |
| 2026-08-06 | — | `customize.style.font_option` / `mode_option`, `customize.layout.*` | Co-op Theme + Layout customize |
| 2026-08-06 | `profile.header.overflow`, `profile.top_nav.search` as primary | `profile.header.search` in action row | Search moved beside compact tier / View as pill |
| 2026-08-06 | — | `profile.header.customize_look`, `profile.card.widget_edit`, `widget_reorder` | Edit = rearrange widgets + per-box content pencil |
| 2026-08-06 | — | `assistant` surface + `assistant_*` product events + `profile.settings.assistant_*` + `permission_result` calendar | Opt-in relationship Assistant (AGENT.md) |
| 2026-08-06 | — | `home.announcements.assistant_card` | Assistant entry under Home Announcements when opted in |
| 2026-08-06 | `home.announcements.assistant_card` | `home.assistant.open_card` (+ `home.assistant.info` / `section_header`) | Moved Assistant doorway under Stories |
| 2026-08-06 | `home.assistant.open_card` | `home.assistant.composer` / `send` / `transcript` / `empty_state` / `confirm` / `cancel` | Home Assistant is an inline chat box |
| 2026-08-07 | — | `home.assistant.open` / `mic` / `stop_listen` / `suggestion` / `dismiss` / `draft_*` / `mark` / `body`; `assistant.draft.*`; `assistant.island.*`; `assistant.chat.suggestion` / `mark` / `working` | Phase D1 Billy Widget / Screen / Island |
| 2026-08-07 | — | `home.assistant.event_preview` / `event_approve`; `assistant.event.body` / `approve` | Phase D2 event template preview card |
| 2026-08-07 | — | `assistant.island.stop` | Shared Billy mic: Island stop square (discard take; silence auto-sends) |
| 2026-08-07 | — | `home.announcements.quick_check_dismiss` / `quick_check_body` / `quick_check_result` + `quick_check_kept` / `quick_check_removed` | X dismisses without answer; Yes/Not anymore are outcomes (never question text) |
| 2026-08-07 | `events.host.brought_count` (counts row) | retired (id kept); attribution in `event_people_sheet` | Host event page: two wide pills (going/invited); brought moves into list rows |
| 2026-08-07 | — | `events.detail.date_chip`, `events.detail.countdown` + `event_guest_invited` (`via` host\|attendee) | Date square in header; flip-tile countdown; invite attribution |
| 2026-08-08 | — | `events.gate.*` | Events marketing gate (memories wall) before first host create |
| 2026-08-11 | — | `post_composer.suggested.random_nudges_toggle` / `random_nudges_label` + `story_prompt` kind | Opt-in BeReal-like reminders (1–3 / day) on capture |
| 2026-08-23 | — | `post_composer.suggested.event_tag_label` / `event_tag_clear`; `events.detail.photo_album_header` / `photo_album_tile`; `party_capture_prompt_sent` | Mid-party capture nudge + event album tagging |
| 2026-08-25 | `auth.welcome` text beats (`brand`/`beat_body`/`progress_bar`, now dead) | one-off CRT terminal intro (surface `auth`, non-interactive, no skip) | First-open experience replaced by the CRT intro (plays once per install, then sign-in) |
| 2026-08-25 | `demo_mode_entered` `method: logo_password` | added `method: logo_onboard` (3-tap logo → password `onboard`) | Demo bypass straight into a fresh onboarding run (dev/preview only); reuses `auth.sign_in.brand_logo` |
| 2026-08-08 | — | `create_event.details.repeats_*` + `event_created.has_recurrence` / `recurrence_freq` | Recurring events create Details + product outcome (freq enum only) |
| 2026-08-11 | `onboarding` steps … → notifications → … | privacy → **desire** → notifications → … → coop → welcome | Desire / connection_style step seeds Home |
| 2026-08-11 | `chrome.tab_bar.tab_messages` (pill) | `chrome.tab_bar.tab_news` + `*.top_nav.messages_icon` on every tab; `tab_discover` icon = globe | Pill = Home/Friends/Events/Discover/News; Messages moved to header top-right, profile photo moved left of the title (tab_messages id kept, retired) |
| 2026-08-11 | `onboarding.coop.use_free` | `onboarding.coop.free_lite` (alias kept) | Two-tier join: co-op or Free Lite |
| 2026-08-11 | — | `onboarding.desire.*` + `connection_style_set` + `onboarding_tier_chosen` | Desire rank + confirmed join tier (`method` coop\|free_lite) |
| 2026-08-13 | — | `auth.sign_in.brand_logo`, `profile.settings.leave_demo`, `demo_mode_entered` / `demo_mode_left` | Branded Sign in + channel-gated demo unlock |
| 2026-08-20 | — | `event_shared.method` `copy_link` on web fallback; outsider shared-link visibility | Share stays one header control; open-link RSVP only when friends-can-invite |
| 2026-08-21 | — | `quiz.take.question` (dead) | Fun-quiz brutalist question slab |
| 2026-08-21 | — | `quiz.take.commentary` (dead) | Fun-quiz yellow commentary body |
| 2026-08-21 | — | `end_quiz_sheet` + `end` / `stay` / `dismiss` | Mid-quiz Back asks before leaving; `quiz_abandoned` on confirm only |
| 2026-08-21 | `messages.conversation.make_a_plan` | retired (id kept) | Messages no longer has Make a plan; Share contact + double-tap heart |
| 2026-08-21 | — | `messages.conversation.heart` + `message_hearted` | Double-tap a friend's bubble; never counts as a send |
| 2026-08-21 | `touch_grass_sheet.who.everyone` | retired (id kept) | Touch Grass who-to-tell is Close / Friends only |
| 2026-08-21 | — | `reveal.flow.meet_note_toggle` | Add a note - optional opens the how-you-met box |
| 2026-08-20 | — | Product analytics always on while signed in; Settings `analytics_toggle` removed from UI; `analytics_opted_in` / `analytics_opted_out` unused |
| 2026-08-20 | — | `story.viewer.caught_up_body` / `caught_up_done` + `stories_caught_up` | End-of-tray "You're all caught up" screen with confetti |
| 2026-08-19 | — | `analytics_opted_in` / `analytics_opted_out` | Settings product-analytics consent (PostHog SDK; default off) |
| 2026-08-27 | — | `onboarding.contacts.invite_slot` / `contact_row` / `contacts_cancel` + surface `onboarding_invite_contacts_sheet` + `invite_link_shared` | Three Link 1/2/3 slots; co-op progress from confirmed SMS/share |
| 2026-08-27 | — | `onboarding.stat.advance` + **`caption` (dead)** + screentime `page_index` beats | 80-year life story plays one beat at a time; tap skips ahead |
| 2026-08-28 | `profile.tabs.settings_gear` | `profile.header.settings_gear` | Settings moved from tab bar to gear next to Edit on the photo |
| 2026-08-28 | — | `onboarding.taste.place_search` / `place_result` | Favorite place map search seeds Places traveled FAV pin |
| 2026-08-28 | — | `onboarding.taste.place_pick_hint` | Dead-click hint above place search matches ("Tap a place to pin it") |
| 2026-08-28 | — | `onboarding.stat.band` | Screentime year-band tap opens/closes the years accordion |
| 2026-08-28 | FoF `style` keys `humor`\|`values`\|`personality`\|`hobbies`\|`communication` | `workout`\|`go_out`\|`creative`\|`industry`\|`travel`\|`nearby`\|`gets_me` | Friends-of-friends ask reframed as "what kind of friend" |
| 2026-08-28 | — | `onboarding.notifications.all` | All of the above + emoji burst on notifications step |
| 2026-08-28 | `messages.contact_card` full screen + `edit`/`share` | Messages list dropdown surface `contact_card` (`parent_screen: messages`); share stays `conversation.share_contact` | Setup expands inline; no Share button on the card editor |
| 2026-08-28 | — | `messages.conversation.contact_card_chip` | Shared-card bubble: Contact card label + message icon; expands fields (`method: dropdown`); never `tel:` |
| 2026-08-28 | — | `home.this_week.open_events` | Empty This week widget tap opens the Events tab |
| 2026-08-28 | — | `home.coming_up.empty_body` | Coming up null line: "Add friends to get reminders." |
| 2026-08-30 | `home.coming_up.empty_body` copy "Add friends to get reminders." | soft announcement card: birthdays / custom dates will show here | Same dead-click id; clearer empty state for new accounts |
| 2026-08-30 | Coming up empty soft card | blue row + calendar icon + grammar fix + `empty_dismiss` (X) | Matches real Coming up capsules; section hides until items exist |
| 2026-08-28 | onboarding step `recap` (between places and privacy-control) | archived; progress bar 14→13 question screens | Voice recap stays on Friend Pod; `taste.recap_*` ids kept for history |
| 2026-08-28 | onboarding `welcome_in` screen (`welcome_in.lets_go` / `next_cards`) | removed; new Home surface `welcome_celebration` (`overlay.continue` / dead `overlay.body`) | "You're in" screen replaced by one-time fireworks party on Home; `welcome_in.*` ids kept for history |
| 2026-08-28 | — | `onboarding.circles.lock` / `tier_card`; step `privacy-circles` before `privacy-control` | Teach Close / Friends / Acquaintances + Free Lite caps; progress bar 13→14 |
| 2026-08-28 | onboarding step `welcome-in` | archived; Co-op finishes → Home `welcome_celebration` | Pay, invite 3, or auth code set `onboardingComplete`; `welcome_in.*` ids kept |
| 2026-08-28 | — | `home.announcements.intro_card` / `intro_dismiss` / **`intro_body` (dead)** | One-time Announcements explainer when nothing live; tap or X dismisses forever |
| 2026-08-29 | — | `onboarding.contacts.awesome_banner` (dead) | Green success banner after contacts sync / invite: "AWESOME! We'll notify you when friends join." |
| 2026-08-29 | — | `onboarding.taste.song_search` / `song_result` / `song_search_cancel` + surface `onboarding_song_search_sheet` | After music connect, sheet to search + pick the song on repeat |
| 2026-08-29 | — | `onboarding.review.row_edit` / `row_edit_save` / `row_edit_cancel` + surface `onboarding_privacy_edit_sheet` | Privacy & Control corner Edit updates text + Supabase immediately |
| 2026-08-29 | — | `profile.card.about_me_photo` + `profile_photo_updated` | About me card uses live avatar; Edit → Take/Upload updates profile photo |
| 2026-08-30 | — | `home.this_week.example_card` / **`example_badge` (dead)**; `home.notifications_preview.example_row` / **`example_badge` (dead)**; `home.quiz.take_prompt`; `home.stories_row.post_prompt` | Empty Home sections show seeded Examples that self-hide after tap; Quiz always shows J-name prompt; Stories CTA "Post a story!" |
| 2026-08-30 | — | `profile.header.post_prompt` | Own empty dashed story tile opens post composer |
| 2026-08-30 | — | `reveal.suggestions.title` / `card` (dead), `add`, `optin_toggle` + `connect_requested` | Reveal Screen 3 FoF suggestions (who + why + Add) or Discover opt-in nudge |
| 2026-08-30 | — | `reveal.quiz_matches.info` | i-tip on "How you line up": "From the quizzes you both took" (footer line removed) |
| 2026-08-30 | Reveal close 🎉 emoji + bottom "Tap right…" hint | fireworks backdrop behind close; no tap hint | Same story tap zones; close feels like welcome party |
| 2026-08-30 | — | `profile.header.filter_*` / `photo_look_save` / `photo_look_dismiss` + surface `photo_look_sheet` + `profile_photo_filter_updated` | Edit opens Photo look sheet to switch among the four baked looks |
| 2026-09-08 | `post_composer` was one screen (camera + caption + audience) | Scrapbooks: `post_composer.capture.flash` / `roll` / `today_page_thumb` / `prompts_tray_open` / `count_pill` (dead); `page.*`; `layouts.thumb`; `pages.*`; `audience.chip` / `only_me`; `actions.add` / `add_camera` / `add_roll` / `customize` / `background_swatch` / `undo` / `back` / `info*`; surfaces `prompts_tray`, `caption_sheet`, `audience_sheet`, `add_media_sheet`, `customize_tray`; product `scrapbook_page_updated`, `layout_changed`, `media_imported`, `scrapbook_page_deleted`; `story_posted` gains page props; `permission_result.permission = photos` | Updates become Collage pages (8.5 x 11, 1 to 4 pages a day, 4 photos/videos across them, camera roll allowed, Only me audience). `post_story` flow steps renamed |
| 2026-09-09 | Compose `Post` + top audience chip; count `2/4`; sparkle prompts; no zoom | `actions.next` opens who-sees; confirm is `actions.post` labeled "Post to Friends"; count pill says "2 photos"; prompts use lightbulb; `capture.zoom` (`zoom_factor`) | Clarity: who you post to, photos not steps, prompts ≠ AI, device zoom chips |
| 2026-09-11 | (new) | `profile.settings.share_interests` + product `interests_share_toggled` | Opt-in interests export to your own website (off by default). Never logs taste values, slug, or token |
| 2026-09-09 | User-facing Scrapbook | Collage (tile, tab, Home title, empty states). Product events / tables still `scrapbook_*` | Founder rename |
| 2026-09-09 | Capture lightbulb + OOTD / Hot take / Take 0.5 tray | Themed suggested posts removed from capture; `prompts_tray` / `suggested_prompt` / `prompts_tray_open` retired (IDs kept for history) | Founder: suggested posts are not good |
| 2026-09-09 | — | Circles / event album / version-of-me stubs: flows `connect_circle`, `influencer_join`, `create_version_quiz`, `send_event_note`; surfaces `circle_connect`, `circles_settings`, `influencer_portal`, `influencer_join`, `event_host_note_sheet`, `event_album`, `version_quiz_author`; product events `circle_*`, `influencer_joined`, `event_host_note_sent`, `event_album_*`, `version_quiz_*` | Docs only. Never log handles, note text, quiz copy, or photos. |
| 2026-09-09 | `friends.top_nav.add` as ink `+` circle only | labeled "Add friend" in header + `friends.roster.add` beside Your circle; `friends.top_nav.search` live (roster name/handle filter) | Same sheet; search never logs query text |
| 2026-09-09 | `friends.top_nav.search` at the top of Friends | `friends.roster.search` directly under Your circle (`top_nav.search` kept for history) | Search filters the roster, not Friend Pod / Inside Jokes |
| 2026-09-09 | — | `friends.add_sheet.connect_contacts` / `contact_row` / `contacts_cancel`; `friends.cold_start.*`; `friends.roster.pending_row` / `pending_header`; surfaces `friends_contacts_sheet`, `pending_profile`; product `pending_person_saved` | Friends is where you connect contacts and make a private card; merge still never logs phones |
| 2026-09-09 | — | `onboarding.contacts.contact_search` + `invite_access.contacts_sheet.contact_search` | Search in invite contacts sheet (never logs query / names / phones) |
| 2026-09-09 | Capture went straight to compose | Camera-first: `just_shot` + `actions.done` / `make_collage` / `retake` / `save_roll`; surfaces `collage_editor`, `collage_hub`, `collage_paper`, `collage_text`, `collage_voice`, `collage_people`, `collage_cutout`, `collage_layer`, `collage_exit`, `collage_finish`, `collage_packs`, `collage_layouts`; product `collage_audio_transcribed`, `collage_friend_tagged`; notify kind `collage_tag` | Camera is the front door. Collage tools are optional. Camera roll stays allowed. Never log captions, transcripts, or tagged names |
| 2026-09-09 | CRT welcome auto-advanced after typing (no button) | `auth.welcome.next` + flow `welcome` (`method` tap\|auto, `page_index`) | People could not finish reading each typed screen |
| 2026-09-09 | Collage editing was thin (basic colors, one font, no move/resize for text) | `collage_editor.rail.rotate`; `collage_text.tools.spectrum`; `collage_paper.swatch.spectrum` (full spectrum color picker, real fonts, drag/pinch to move/resize/rotate any piece incl. text) | Never log the mixed hex as content; color is a style choice, no PII |

