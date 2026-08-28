# Bridger - Privacy Policy (living draft)

> **WHAT THIS FILE IS:** plain-English master draft of Bridger's Privacy Policy. Lawyers will turn this into the real legal document. Agents and builders **must update this file in the same change** whenever a feature collects, uses, shares, or deletes data (see `.cursor/rules/guide-rules.mdc` §8 and the standing reminders at the top of that file).
>
> **STATUS:** scaffolding + seeded from shipped product truth. Sections marked `TODO (legal)` need counsel wording. Sections marked `TODO (product)` need a builder to fill from code when that area is touched.
>
> **RELATED:** `DATA.md` (zones A/B/C, RLS, deletion), `apps/mobile/PrivacyInfo.xcprivacy` (Apple Privacy Manifest), analytics rules (PostHog consent), `AI-SYSTEM.md`, `complete/COOP.md`.

---

## How to update this file (for Cursor / builders)

1. Find the heading that matches what you just built (account, media, analytics, etc.).
2. Add or edit a short bullet: **what**, **why**, **who sees it**, **how long**, **how the user stops it**.
3. If the product does not do the thing yet, say so honestly (`Not shipped yet` or `Soft stub`).
4. Never invent promises the app cannot keep.
5. Keep copy free of em dashes.

---

## 1 · Who we are

- Bridger is a social app for real-world friendship (Updates, Friends, Events, Discover, Co-op).
- Operator / legal entity name, address, and contact for privacy requests: **TODO (legal): fill company identity and privacy email**.
- This draft covers the mobile apps (iOS / Android), the web build, the NestJS API, and Supabase-backed storage.

---

## 2 · Our privacy promises (product truth)

These are enforced in product and schema (`DATA.md`). Do not weaken them in code without updating this file.

- **Hard delete, not soft delete.** Deleting an account, a fact, or a connection erases it and derived AI rows. Nothing is kept "for training."
- **Zones.** Zone A = identity / PII. Zone B = de-identified facts (opaque IDs). Zone C = derived AI (embeddings / summaries from Zone B only). Matching and models never see Zone A names or photos.
- **Capture-only media**, except the **profile photo** (the one upload exception).
- **No vanity metrics** (no follower counts, view counts, invited totals, streaks, leaderboards).
- **No ad tracking** and no third-party ad SDKs.
- **Product analytics (PostHog)** is first-party, **on by default while signed in**, de-identified, deletable with the account, never sold, never fed into matching.
- **Tier visibility** (Close / Friends / Everyone / custom groups) controls who sees shared content; RLS enforces it.

---

## 3 · What we collect

### 3.1 Account and identity (Zone A)

- Sign-in via **Continue with Google** or **Sign in with Apple** on the single Sign in screen (first use creates the account; later visits sign in). Email + password remains for existing password accounts. There is no separate Create account screen.
- **Sign-in prefill (Google / Apple):** when you continue with Google (or Apple on first sign-in), we read the **name** and **profile photo** that provider hands us in the auth session (`user_metadata`) and use them only to **pre-fill** the "Confirm your details" onboarding step. **Why:** so you confirm instead of retyping. **Who sees it:** only you, on your own device, until you save the step; the photo saves the same way as any uploaded profile photo (`media` + `user_identity.avatar_media_id`). You can edit or clear either field before continuing. Nothing is saved to your profile until you tap Continue. Hard-deleted with the account.
- Profile basics collected in onboarding (name/display, and other basics per `ONBOARDING.md` / `PROFILE-MODULES.md`).
- **Connection style (desire step):** during onboarding we may store opaque preference keys for what you want Bridger to prioritize (`frequency` / `depth` / `plans` / `commonality`) plus a named Home layout seed. **Why:** to arrange *your own* Home and lean notification defaults toward what you said. **Who sees it:** only Bridger systems acting for you (never other users, never matching embeddings, never ads). **How long:** until you change it or delete your account (hard-delete). Skippable; skipped desire defaults to a stay-close seed. Analytics may record the opaque keys only, never free-text rants.
- **Friends-of-friends matching preference (new onboarding step):** you may pick what kind of friend you could use right now, as opaque keys only (`workout` / `go_out` / `creative` / `industry` / `travel` / `nearby` / `gets_me`). **Why:** to shape which friends-of-friends the matcher surfaces to *you*. **Who sees it:** only Bridger systems acting for you (never shown to other users as text). Skippable; hard-deleted with the account.
- **Social battery (onboarding step):** an optional number, 0 to 7+, of social events you like to attend in a week. Stored on `user_settings.social_battery`. **Why:** to pace how often Bridger nudges *you* toward plans. **Who sees it:** only your own pacing logic, never shown to others as a number. Skippable.
- **Personal grid color (onboarding ColorStep):** an optional `#RRGGBB` tint stored on `user_settings.profile_color`. **Why:** paints the drifting background grid behind *your* app only. Cosmetic only; no tracking value. Skippable; null falls back to the default purple.
- **Profile intro seen:** a boolean on `user_settings.profile_intro_seen` set when you tap **Hell yeah** on the one-time Profile welcome screen. **Why:** so we never show that intro again for your account. **Who sees it:** only Bridger systems acting for you. Hard-deleted with the account.
- **Onboarding resume point:** while you are still going through onboarding we remember which screen you were on (`user_settings.onboarding_step`) and a snapshot of the answers you have typed so far (`user_settings.onboarding_draft`, JSON). A copy is also kept on your own device (`bridger.onboardingProgress`). **Why:** so a crash, force-quit, reinstall, or new phone drops you back where you left off instead of restarting from the first screen. **Who sees it:** only Bridger systems acting for you (never other users, never matching, never ads). **How long:** wiped the moment you finish onboarding, and hard-deleted with the account. Each real answer is still saved to its normal home as you advance; this is only the resume copy. Analytics never logs the draft contents.
- **Profile photo:** the one upload exception. Stored as `media` + `user_identity.avatar_media_id`. The app loads it via short-lived signed URLs (`avatarUrl` on `/me`, `/me/profile`, and friend cards). Hard-deleted with the account.
- **Profile photo "looks" (filters):** you can style your profile photo with a look (Pop art, **Comic**, **X-ray**, or **Sepia**). **Pop art** is drawn entirely on your own device (nothing leaves the phone to make it). **Comic**, **X-ray**, and **Sepia** are rendered on our own server: the phone uploads your normal photo to your private `media` bucket, then `POST /photo-filters/apply` has the NestJS API read that photo, repaint it with **ImageMagick** (a local image tool, not an outside company and not any AI model), and save the finished picture back as a new owned `media` row. **Why:** those looks need image operations the phone cannot do (edge posterizing for Comic; invert + tone remap for X-ray; sepia matrix + high contrast for Sepia). **Who sees it:** only you until you tap Continue, then it becomes your avatar under the normal tier rules. The photo is never sent to any AI/model or third party for this; the work happens inside our own container. Both the original and the filtered copy are hard-deleted with the account.
- **Notification prefs:** which kinds and which circles (Close / Friends / Acquaintances) can nudge you. Stored as `user_settings.notif_prefs` jsonb `{ kinds, circles }`. Set during onboarding (coarse chips expand to kinds) and editable in Settings → Notifications. Server notify paths check these before writing alert rows. Hard-deleted with the account.
- Contact handles the user chooses to share with friends (e.g. on the contact card in Messages: Phone, Instagram, Email, Website, Substack, or Other) are user-shared, not scraped. Only fields the user enables leave the device on Share contact. Analytics never logs those values.
- **TODO (product):** list exact account fields currently stored (email, auth provider IDs, etc.) when Settings / auth is next touched.

### 3.1b Linked music accounts (Zone A secrets + Zone B picks)

- You may **link Spotify or Apple Music** from Settings (or during onboarding). This is **account linking**, not “sign in with Spotify / Apple Music.” Bridger login stays Google / Sign in with Apple.
- Nest stores **encrypted** refresh/access tokens (Spotify) or the MusicKit **music-user-token** (Apple Music) server-side (`music_connections`). Tokens are never shipped to the mobile client or used as Bridger auth.
- Catalog picks (Listening, song of the week, favorites) store Spotify/Apple ids, titles, artwork, and optional `preview_url` with the same **who sees** + **matchable** rules as other profile facts (`music_picks`).
- Top artists may be synced for “artists in common” on reveal / In common (`music_taste_artists` + matchable `music.artist.*` attributes). Spotify uses Spotify’s top-artists list (up to 50). Apple Music builds a ranked list from heavy rotation, recent plays, and library artists (up to 50). Disconnect deletes tokens and synced taste rows. Account deletion hard-deletes all of the above.
- In-app play today is a short **preview** when Spotify provides one, plus Open in Spotify / Apple Music. Full-track streaming (Premium SDK) is not required for linking.

### 3.2 Profile attributes and quizzes (Zone B)

- Hobbies, favorites, places, this-or-that, bucket list, deeper questions, Top 5, Current Obsession, life timeline, recommendations, goals, and quiz results tagged with **visibility** (`visibleToTier`) and a separate **`matchable`** flag.
- **New onboarding "taste" facts:** current job, dream job, the song on repeat (typed into canonical `currently_song`, or overridden by a linked music Listening pick), hometown / current town (About Me rows: towns only, never a street address), and favorite place visited (**place name only**; we may **coarsely geocode** it via Photon/OSM to place a pin on your travel map with a FAV flag and approx lat/lng, never a street address). Each is optional/skippable, tagged with its own **visibility** on the Privacy & Control screen (Close / Friends / Acquaintances), and hard-deleted with the account. Geocode query text is never logged to analytics. (Onboarding no longer asks for a weekly recap voice memo; that capture lives on Friend Pod after you are in the app.)
- **Privacy circles (onboarding):** a read-and-continue screen before Privacy & Control that explains what Close / Friends / Acquaintances mean and Free Lite circle sizes (5 / 30 / unlimited). Collects no new data; teaches the tier model before you set `visibleToTier` per answer.
- The hobby bank includes optional culture, advocacy, and wellness labels you can pick (or add your own). Same who-sees and matchable rules as any other hobby. None of these are required.
- Every fill module ends with (1) who can see the answers and (2) an explicit "use this to connect me in Discover?" ask. Visibility and matching are independent consents.
- Sensitive About Me Deeper fields (identity / beliefs) default Close and are never bulk-matchable; each is listed individually in the matchable step.
- A mandatory one-time profile intro (black welcome gate, same vibe as Events / Discover) welcomes you to your profile and notes that you decide what you share with who. Deleting a field still removes it from Bridger's database.
- Profile search only indexes fields the viewer may already see; search query text is never logged.
- Quiz completion can write attributes such as `quiz.<slug>.<dimension>` with `visible_to_tier = none` until the user chooses otherwise (generic quiz path shipped).
- Discover / matching use only **matchable, consented** facts; names rejoin on-device from opaque IDs.
- **Behind the Scenes (disclosure pre-quiz):** optional. People may name conditions (e.g. ADHD, anxiety), rate how much each shapes day to day, add an optional private note, and choose how strongly matching may use it (`use` / `a_little` / `barely`). Stored in owner-only tables (`disclosure_profiles`, `disclosure_items`), separate from fun-quiz scores. **Never shown on a profile. Matches never see or infer it.** Soft toggle can suspend matching use without deleting. Skippable on every screen. Account delete hard-deletes these rows. **TODO (legal):** confirm special-category / health-data obligations (consent, storage, retention) for your operating regions before launch.

### 3.3 Content the user creates (UGC)

- **Updates** (photo / text / video per product rules; capture-only except profile photo).
- **Inside Jokes**, poll questions/votes, Touch Grass signals (audience + when + why), event details, recap voice answers, co-op portal ideas/comments (shown as "A member," no person names on the member portal).
- Reactions, replies, and RSVP / attendance related records as needed to run those features.
- **Message hearts:** double-tap a friend's bubble stores only that you hearted that message id (and that they can see it). Never the message text. A heart is not a sent message and does not use the daily cap. Hard-deleted with the account or the thread.
- **Event invite attribution:** each `event_invites` row may store `invited_by` (who invited that guest). Null means the host invited them (or they joined via an open share link when friends-can-invite is on). Used only so hosts/co-hosts can see "invited by" / "brought by" in the going/invited lists when friends-can-invite is on. Never shown as a vanity total to guests. Hard-deleted with the event or account.
- **Shared event links:** opening an event link when you are not on the invite list shows **basics only** (title, host, when, place name, bio). No going list, meet suggestions, full address, or assignments. If the host turned on friends-can-invite, you may RSVP Going (joins the list, still under the guest cap). If that setting is off, you cannot RSVP until invited.
- **Event recurrence:** optional `events.recurrence` jsonb stores a schedule pattern only (weekly / monthly / yearly + end). Same visibility as the event (people going or invited). Hard-deleted with the event or account. Analytics may record `has_recurrence` / `recurrence_freq` enums only, never the schedule text.
- **Quiz result + share/referral (Which "J" name are you?):** `jname_results` stores your fun result only (a J-name, a percent, and your top J-name picks by score). A `jname_shares` row is one stable share link per person, snapshotting the J-name/percent so the free web page can render it. `jname_referrals` records that someone opened your link so that, if they later make an account, we can connect them to you ("who invited whom"). While a viewer is logged out we keep only an opaque device id (`anon_ref`), never a name. The public web view (`/q/<token>`) needs no account; the "your version of X" friend board requires an account (API `GET /jname/leaderboard`). Notifications: `jname_link_opened` when someone opens your link; `jname_top_match` when a friend lands on a J-name in your top 3 picks. All of these hard-delete with the account.

### 3.4 Friends graph and social graph

- Connections, tiers, blocks, how-you-met context (optional; place is coarse and opt-in when used).
- Blocks cut the graph locally for the blocker (suggestions and mutual bridges).
- **Invite links and QR codes:** opaque tokens only (UUID). Share links live in `invite_links`; QR codes use short-lived `qr_tokens` (about 15 minutes), deleted when redeemed. The QR encodes a Bridger deep link (`bridger://invite/…` or your configured `APP_LINK_BASE`), not a name or photo. Redeeming creates a connection; you cannot redeem your own invite. Tokens are not used for matching or ads.
- **Optional surprises (delights):** if you send a gift delighter (e.g. emoji bomb), we store opaque sender/recipient ids + which surprise (`delight_triggers`) until it plays once on their next open (or the account is deleted). Opt-in companions store chosen plugin slugs on `user_settings.delight_opt_ins`. Surprises are optional fun; the app works with them all off. Analytics may record `delight_slug` only, never names.

### 3.5 Co-op / membership

- Membership status, `dues_paid_through`, cancel-at-period-end / cancelled timestamps. Signup offers **Join the co-op** ($6/mo), **invite 3 friends for free access** (Free Lite benefits once invites are complete), or an **auth code** for a free year of membership. There is no separate free-tier skip on the join screen. Free Lite keeps connection essentials with rolling ~30-day story history and 5 Close / 30 Friends (Acquaintances unlimited). Co-op unlocks richer creation, 25 Close / 125 Friends, named groups, and storage. No ads either way.
- Soft-join stub today for demo. **Live on iOS/Android:** co-op membership is sold through **RevenueCat** (StoreKit / Google Play Billing). Entitlement id `social_bridger_app_pro`; packages `monthly` and `yearly`. Bridger stores your opaque user id with RevenueCat so purchases attach to your account. Purchase tokens and subscription status are processed by Apple, Google, and RevenueCat; card numbers never touch Bridger servers. **Card (web / optionally Android):** **Stripe Checkout** (subscription mode). Bridger creates a Checkout Session and Stripe Customer; payment is hosted by Stripe. Webhooks update `coop_memberships` (provider `stripe`, subscription id, paid-through, `stripe_customer_id`). Renewals and expirations also emit de-identified product analytics (`coop_renewed` / `coop_expired`) from the server using your opaque user id only. Card checkout is **not** offered inside the iOS app for digital membership (Apple 3.1.1). Membership rows hard-delete with the account.
- **Auth / promo codes:** an operator can issue a code that grants a **free year** of the co-op with no payment. When you redeem one we store which code you used and when (`coop_promo_redemptions`: opaque `user_id` + `promo_code_id` + timestamp only, never the code text or any payment/PII). This lets the operator see how many uses remain and who redeemed each code. Redemptions are hard-deleted with your account.
- **Ads:** Bridger does not show behavioral or third-party ads on Free Lite or co-op. You are not the product.
- Portal participation (ideas, votes). **Member portal never shows vote tallies or person names**; admin may see aggregates.
- **Profile customization (co-op):** theme (accent, background color/gradient/image assetId, font from allowlist, light/dark) and layout order are presentation-only skins. They never change, hide, or delete canonical attributes or tier visibility. Custom CSS/HTML columns exist but the Code tier is admin-gated OFF (no WebView renderer yet). When enabled later: sanitized; no user JavaScript; no off-Bridger asset URLs (so a profile cannot leak viewer IPs). Assets are Bridger-hosted. "View original" and a viewer "always show plain pages" preference always reach the native accessible layout. Customized profiles are UGC (report / operator revert).
- **Storage meter (stub):** Settings → Storage & plan and the Stories storage bar show used vs included (co-op allotment from admin/config, e.g. a few GB). Overage shows a per-GB price before any charge; the current wave is a soft stub (price visible, no real billing). Deletion frees space. Free Lite accounts keep the rolling ~30-day story window.
- **Greatest hits (co-op):** up to 3 Bridger-hosted profile photos (`profile_greatest_hits` + `media`), each with a placement index, optional section slot, and its own tier visibility. Not sent to AI or matching. Hard-deleted with the account or when the slot / media is removed. Counts toward co-op media storage.

### 3.6 Device permissions (requested in context, never at cold launch)

| Permission | Why we ask | If denied |
|---|---|---|
| Camera | Post Updates, video replies | Feature degrades; app still works |
| Microphone | Video replies, recap voice answers (Friend Pod), Assistant voice questions (opt-in) | Same |
| Photo library (read) | Profile photo only (upload exception) | User can skip / use capture |
| Photo library (add only) | Save a quiz result card you made to your camera roll so you can post it to a story. Requested only when you tap "Save image"; add-only, we never read your existing photos for this. | Skip; you can still share the card straight to another app |
| Notifications | Alerts for friends, Touch Grass, events, etc. | In-app activity still works |
| Contacts | Optional: when you tap **Connect contacts** (onboarding) or **Invite a friend** (demo-week access gate), Bridger asks permission to read contacts **on your device only** so you can pick someone to text your invite link. Onboarding also offers three separate invite slots ("Invite friends #1 / #2 / #3"). We never upload your address book. After contacts load, we tell you we will **notify you if a friend joins from your invite** (when they redeem your link or QR and become connected). That alert uses the same in-app notification prefs as other connection alerts; it is not address-book matching. Counting an invite toward the co-op "invite 3 friends" progress means you opened SMS, completed the system share sheet, or (in a browser with no share sheet) copied the invite link from a slot, not that the friend joined yet. | Skip; you can still use the three invite slots / system share sheet |
| Location (coarse) | Optional "where you met"; future **Local map** (friend radar) will also need coarse, opt-in sharing when that feature ships. Discover currently shows only a Coming soon teaser and does **not** request location for the map. | Skip; app works |

Purpose strings must stay accurate in `app.json` / store listings when permissions land.

**Background audio (co-op weekly recap):** the recap Friend Pod player keeps playing when the app is backgrounded or the phone is locked, and shows standard lock-screen / Control Center playback controls. This uses the OS audio background mode (iOS) and a media-playback foreground service (Android); it does not collect any new data. The lock-screen "now playing" card shows only the current friend's first name plus a "Bridger · Weekly recap" label. Recap question text and answer audio content are deliberately kept off the lock screen. No location, no microphone, and no new permission is involved in playback (the microphone permission covers recording your own answer only).

**Haptics (first-open intro + UI feedback):** the app can play short vibrations through the device's built-in haptics (via `expo-haptics`). The first-open CRT intro uses this to make typing, "screen wipe," glitch, and shut-off moments feel physical. Haptics collect no data, send nothing off the device, and use no location or microphone. On Android we use the OS haptic constants (no `VIBRATE` permission required); on iOS this is the standard Taptic Engine. Reduce Motion trims the intense bursts. There is no separate haptics permission prompt.

### 3.7 Analytics (PostHog)

- UI events (`click`, `dead_click`, `swipe`, …) with structured `screen.section.element` ids.
- Named product events (e.g. quiz completed, story posted, co-op cancel scheduled, quick-check kept/removed).
- Properties are snake_case taxonomy fields only; **no PII**, no message/caption/quiz-explanation text, **no quick-check question text**.
- `distinct_id` = opaque account id while signed in. Logged-out and demo modes do not send.
- **On by default** for signed-in accounts (no Settings off-switch in the current build). We do **not** use Apple ATT: this is first-party product analytics, not cross-app tracking (no ads, no IDFA).
- Session replay, SDK autocapture, surveys, and geo-IP are off. Demo mode never sends.
- Deleting the account must purge the PostHog person plus our DB.

### 3.8 Diagnostics / ops

- Server logs and infra metrics as needed to run the API (no intentional PII in analytics properties).
- **TODO (product):** document any error-reporting SDK if one is added.

### 3.9 AI / matching

- All model calls go through one server-side **gateway** (`packages/ai`, `AI-SYSTEM.md`). Clients never hold AI keys.
- **Deidentified lane** (summaries, quiz moderator, embeddings, freshness): opaque IDs only; scrubber rejects names, emails, phones, handles, and all media. Summaries are built from the person's **own words / transcripts only**, never photos or likeness.
- **Matching / learning:** Nest scores FoF suggestions on opaque IDs using de-identified Zone B/C facts. Suggestion card “why” titles only cite Everyone+matchable shared facts. Private (`none`+matchable) quiz/personality signals may affect scores silently and never appear as evidence titles. Outcomes land in `matching_feedback` (features + label weights only; no message content, names, or UX-analytics). Opting out of Discoverable or deleting an account purges suggestions, feedback pair-rows, and Zone C embeddings. Feedback snapshots age out (~18 months).
- **Disclosure in matching:** additive only (shared-experience affinity / pace), never a filter that hides or excludes anyone. The person’s Screen 4 weight is a hard control (`barely` ≈ store only). Condition keys, notes, and custom labels never appear as reveal evidence titles. Analytics never include note text or custom labels.
- **Disclosure rides with measurement quizzes:** when someone takes Your Vibe, The Friend Zone, What Gets You Going, or Your Funny Bone, the quiz moderator may receive a de-identified slice (condition keys + impact + match-weight preference only) so it can ask whether an answer is preference or capacity. Free-text disclosure notes never enter that prompt. Optional explain text on quiz answers is author-owned, private, never analytics, never shown to matches.
- **The Friend Zone:** stores continuous friendship attachment anxiety / avoidance plus a derived style for a hand-authored match matrix. Social-evaluation sensitivity is interpretive only. Not a clinical diagnosis. Never on a profile; matches never see answers.
- **What Gets You Going:** stores relative Schwartz-inspired priority scores and matching dials (adventure/stability, giving/striving, hedonism). Politics are not asked. Loyalty/honesty friendship norms are a separate future add-on. Optional explain text private. Never on a profile; matches never see answers.
- **Your Funny Bone:** stores a private humor *taste* vector (five bipolar axes plus a breadth score from comedy clusters). Matching uses similarity of taste and a wider/narrower band from breadth. How someone jokes socially (style) may be stored as soft hints for a later layer and does not drive matches yet. Optional explain text and free-text "other" are private, never analytics, never shown to matches. Backend axis names are never shown in the product UI.
- **Personal-agent lane** (Billy / Assistant): may see the requester's own visible data only (notes, tier-visible friend facts, upcoming, events, own Bridger message style). Off by default; admin-gated (`founder_only` ships first); confirmed acts only (`AGENT.md` / `AGENT-SCOPE.md`). Never feeds matching.
- **Billy allowances:** we store per-user **estimated USD of model cost** spent/granted (`billy_balances`, `billy_ledger`) and plan status. Never the chat text in the ledger. Deleted with the account. Used to enforce monthly taste / Billy+ limits; org vendor outages are separate admin alerts.
- Surfaces when opted in: Home AgentWidget, full-screen AgentScreen, AgentIsland when live off Home. Hidden when off.
- Playbooks under `guide-docs/playbooks/` are global procedure docs (no PII); the agent reads them; only humans edit them.
- **Style profile** (optional, on by default for agent users): how-you-write features learned from the user's own sent Bridger messages only (cadence/length/tone), not a log of message content to whom. Toggle off in Settings. Deleted with the account / when Assistant is disabled.
- Assistant sessions store turn text server-side for the open conversation only; turns are deleted on close or when the user disables Assistant. Private `assistant_memory_chunks` are per-user only (not Zone C matching embeddings) and cascade on account delete.
- Playbook id + version (which task manual Billy followed) may be stored on turns/activity as method metadata only. Playbooks contain no personal data.
- Voice transcripts for Assistant are used in-request only; never written to analytics or used for training.
- While Billy is listening, supporting web browsers may show **live captions** via the browser's speech recognizer (often a platform service such as Google or Apple). Final answer turns still use our server Whisper path. Live caption text is display-only, not logged to analytics. On native, live captions may be unavailable until the clip is sent.
- Scheduled Bridger messages the user approves (draft + exact send time) are cancelable until they fire; the agent never sends without that approve.
- Calendar: OS permission requested in context the first time the user confirms an Assistant calendar act. Purpose: add dates and reminders the user confirms. Denial degrades to a calendar handoff.
- Foundation models: API-only under **no-training / zero-retention** terms. We do **not** fine-tune on user content. RAG + our own ranking (later) supply knowledge; content is discarded per request.
- Fail silent: if a job is disabled, over budget, or fails quality/grounding checks, the surface hides. The app stays fully usable with AI off.
- Cost metadata (job, tokens, latency) may be logged for ops; **never** prompt or answer content.
- Matching v1 is friends-of-friends + attribute overlap; embeddings (Zone C) feed matching v2 when enabled.
- Opting out of Discover / account deletion drops Zone C (embeddings, summaries, module notes, freshness prompts) in the same cascade.

---

## 4 · How we use data

- Run the core app: friends, Updates, Events, Messages (limited), Discover, quizzes, Touch Grass, recap Friend Pod, co-op portal.
- Enforce tiers, blocks, and membership perks.
- Send in-app (and later push) notifications the user has allowed.
- **Random update nudges** (`story_prompt`): optional. When you turn the toggle on (capture screen or Settings → Notifications), Bridger may send about **1–3 prompts a day** at random times asking you to post an update, including **one mid-party nudge** when you are hosting or going to a live event (skipped if you already posted 3 updates that day). Party nudges open capture with the event pre-tagged so the photo can land in that event's album. Tapping opens the in-app capture screen. Off by default; turn off anytime in the same places. No one else sees that you enabled this.
- Improve the product via PostHog analytics (anonymous screen/button names; not ads, not sold).
- Moderate reported content and enforce Terms.
- Process membership payments via RevenueCat (Apple / Google) and Stripe (card Checkout).
- **We do not** sell personal data. **We do not** use third-party ad networks. **We do not** train foundation models on user content.

---

## 5 · Who we share with

- **Other users**, only as the user chose (tier / audience / public co-op portal reads).
- **Service providers** that host or process data for us: Supabase (DB/Auth/Storage), AWS (API host), PostHog (product analytics), AI providers (Anthropic / OpenAI) **server-side only** through the PII firewall when AI is enabled, **RevenueCat** (IAP entitlements), and **Stripe** (card membership Checkout / Customer Portal; card numbers stay with Stripe).
- **Law enforcement / legal** when required by law: **TODO (legal): standard compulsion language**.
- Co-op portal public pages are readable without membership; writes require membership. Portal comments display as "A member," not a name.
- **Apps you choose to share to:** when you tap "Share to story" / "Share link" on a quiz result, your phone's own share sheet hands the image or link to whatever app you pick (Instagram, Snapchat, Messages, etc.). That app's own privacy policy then governs it. We do not post on your behalf and we send nothing to those apps unless you pick them.

---

## 6 · Retention and deletion

- Account deletion: hard-delete cascade across Zones A/B/C, media, and derived rows (`DATA.md`). Also purge PostHog person.
- Story / Update storage: Free Lite rolling ~30 days; co-op members keep longer while membership is active (perks until `dues_paid_through` after cancel-at-period-end).
- Recap answers: rolling window with lazy purge on playlist load (see `complete/RECAP-PODCAST.md`).
- Export on request: **TODO (product + legal): document how a user requests export**.
- In-app account deletion must remain reachable from Settings (App Store requirement).

---

## 7 · Children's privacy / age

- Minimum age appropriate to a social app; age gate at signup: **TODO (legal + product): set exact age (e.g. 13+ / 16+ / 18+) and questionnaire**.
- We do not knowingly collect data from children below that age.

---

## 8 · User choices and controls

- Audience / tier pickers on posts, polls, recap share (Close / Friends / Everyone). Touch Grass send is Close / Friends only.
- Discoverable / matching opt-out (drops Zone C).
- Analytics consent toggle (Settings; ATT on iOS when required).
- Block and report (person and content).
- Cancel co-op at period end; keep perks until paid-through date.
- Unlock Free Lite by inviting 3 friends (or redeem an auth code for a free year of co-op) instead of paying; keep connection essentials either way (no ads).
- "View original" on customized profiles (accessibility / contrast).
- **Internal / preview demo mode:** some non-App-Store builds let you long-press the Bridger logo on Sign in to walk the app with **on-device fake fixtures** (no real account, no real friends graph). Demo data stays on the device and is not a Bridger account. Leaving demo (Settings) or signing in for real uses the normal account path. Production App Store builds keep this unlock off unless we intentionally turn it on later.

---

## 9 · International transfers / security

- **TODO (legal):** hosting regions, SCCs / transfer language if needed.
- RLS on every table; secrets only server-side (Secrets Manager); clients never hold AI or service keys.

---

## 10 · Changes to this policy

- **TODO (legal):** how we notify users of material changes.
- Builders: when product behavior changes, update this draft the same day; do not wait for counsel.

---

## 11 · Contact

- Privacy requests / deletion / export: **TODO (legal): email and mailing address**.

---

## Changelog (builders keep this short)

| Date | What was added / changed |
|---|---|
| 2026-08-28 | Co-op membership: RevenueCat on iOS/Android (entitlement `social_bridger_app_pro`, packages monthly/yearly). Public SDK key in the app; webhook syncs renewals/cancels to `coop_memberships`. Card via Stripe Checkout + webhook on web (not inside iOS for digital membership). Soft-join remains for demo. |
| 2026-08-28 | Onboarding co-op: "Have an auth code?" reveals after holding Join the co-op for 10s (not a screen timer). |
| 2026-08-28 | Contact card fields: Phone, Instagram, Email, Website, Substack, Other. Values editable in Edit; only enabled fields leave on Share contact; analytics never logs values. |
| 2026-08-28 | Onboarding no longer collects a weekly recap voice memo; mic for recap remains Friend Pod only. Taste facts + Privacy & Control rows drop the onboarding recap row. |
| 2026-08-27 | Profile-photo "looks": Pop art on-device; Comic, X-ray, and Sepia server-side via `POST /photo-filters/apply` + ImageMagick in our NestJS container (no AI, no third party). Original + filtered copy hard-deleted with the account. |
| 2026-08-27 | Apple Music account link (MusicKit): encrypted music-user-token server-side; taste sync from heavy rotation / recent plays / library (up to 50 artists); Spotify top-artist sync raised to 50; disconnect / account delete hard-deletes tokens + taste |
| 2026-08-25 | First-open experience replaced by a one-off CRT terminal intro (plays once per install, then sign-in). Adds `expo-haptics` for synchronized vibration; collects no data, no new permission (Android uses permission-free haptic constants), Reduce Motion trims the intense bursts. |
| 2026-08-25 | Onboarding capture went live: profile-photo pick (camera/library via expo-image-picker, permission in context) uploads to the private `media` bucket then `PATCH /me { avatarMediaId }`; 20s recap voice memo (expo-audio) uploads to `media` and stores only the `mediaId` on the `weekly_recap` attribute; native notification permission (expo-notifications) asked once after the Notifications step, only if a nudge was chosen, denial never dead-ends |
| 2026-08-21 | Messages: contact-card share (not a raw number); double-tap heart on a friend's bubble (id only, not a send); no Make a plan in-thread |
| 2026-08-21 | Touch Grass send: Close / Friends only (acquaintances never get a signal) |
| 2026-08-14 | Co-op vs Free Lite: circle caps 5/30 vs 25/125; named groups and extra place photos are co-op; viewing custom profiles and co-op video stays free |
| 2026-08-11 | Onboarding desire / connection_style: opaque keys + Home layout seed for own-Home only; deletable; not used for matching or ads; Free Lite vs co-op two-tier join (no ads) |
| 2026-08-06 | AI System gateway: deidentified lane jobs, cost log, fail silent, Zone C cascade; personal_agent lane reserved for opt-in assistant |
| 2026-08-06 | Assistant (opt-in): sessions/turns/private memory; calendar + mic in context; voice transcripts in-request only; no analytics content |
| 2026-08-07 | Billy surfaces (Widget/Screen/Island); playbooks (no PII); playbook id/version on turns/activity (metadata only); style profile toggle; schedule with approve draft+time |
| 2026-08-07 | Billy scheduled messages queue (`assistant_scheduled_messages`): body + send time after dual approve; cancelable until fire; hard-delete with account; Touch Grass send via confirm uses existing signal path |
| 2026-08-07 | Home Announcements quick check: `quick_check_kept` / `quick_check_removed` product events + dead-click body/result ids; never logs the question text |
| 2026-08-06 | Matching v1: Nest FoF scorer + matching_feedback; Everyone+matchable evidence; silent none+matchable for quiz/embeddings; Discoverable off purges |
| 2026-08-07 | Profile customize Phase B: Theme + Layout presentation; storage meter stub (used vs included + soft overage price); Code tier columns reserved, flag OFF |
| 2026-08-07 | Greatest hits (co-op): ≤3 Bridger-hosted photos with placement index + tier; hard-delete with account/media; not used for AI/matching |
| 2026-08-07 | Optional delights: gift triggers (opaque ids + slug, play-once); opt-in slug list on settings; analytics `delight_slug` only |
| 2026-08-07 | Spotify account link (not login): encrypted tokens server-side; music picks + top-artist sync; ~30s preview + open/save; hard-delete on disconnect/account delete |
| 2026-08-07 | Billy allowances: USD grant/spend ledger (no chat content); taste / Billy+; deleted with account; org vendor alerts separate |
| 2026-08-07 | Billy shared mic (Home / Island / Screen); silence auto-send; Island stop discards; web live captions via browser speech (display-only, not analytics) |
| 2026-08-07 | Event invite attribution (`event_invites.invited_by`): host-only planning; analytics `event_guest_invited` with `via` host\|attendee, never names |
| 2026-08-08 | Event recurrence (`events.recurrence` jsonb): schedule pattern only; same visibility as event; analytics `has_recurrence` / `recurrence_freq` only |
| 2026-08-08 | Behind the Scenes (disclosure): optional owner-only sensitive context; additive matching only; never on profile / never to matches; skippable; hard-delete with account |
| 2026-08-08 | Your Vibe (personality): Big Five + assertiveness; private dials; neuroticism not matchable; disclosure keys+impact may inform moderator confidence only |
| 2026-08-08 | The Friend Zone (attachment): friendship anxiety/avoidance dials + style matrix matching; SES interpretive only; explain text private; disclosure rides along for moderator |
| 2026-08-08 | What Gets You Going (values): forced-choice priorities; similarity dials; politics-free; explain text private; loyalty/honesty add-on later |
| 2026-08-08 | Your Funny Bone (humor): private taste vector + breadth; similarity matching; style hints not matched yet; explain/other text private |
| 2026-08-06 | Spotify-style profile: Top 5 / Current Obsession / Favorites; per-module who-sees + matchable consent; profile intro; co-op Theme + Layout customize; View original / always-plain preference; storage meter honesty |
| 2026-08-06 | Invite links / QR: opaque UUID tokens; QR short-lived (~15m) and deleted on redeem; deep link encodes token only (no name/photo) |
| 2026-08-20 | Shared event links: outsider basics-only view; RSVP via link only when friends-can-invite is on; no guest list leak |
| 2026-08-20 | Product analytics on by default while signed in; Settings toggle removed; still no PII / replay / ATT; purge on account delete |
| 2026-08-20 | Quiz result sharing: add-only Photo library permission (save card on tap, never reads existing photos); OS share sheet hands image/link to apps you pick; `quiz_shared` analytics carries `method` only, never the result name/text |
| 2026-08-20 | J-name share links + referrals: `jname_results` / `jname_shares` / `jname_referrals`; stable per-person link; opaque `anon_ref` for logged-out opens; who-invited-whom resolved after signup; free public web view at `/q/<token>` (friend results still need an account); all hard-delete with the account |
| 2026-08-21 | J-name leaderboard + alerts: friends grouped by J-name result ("your version of X"); top 3 on Home teaser, grows as friends take it; `jname_link_opened` / `jname_top_match` notifications (opaque ids + quiz slug only) |
| 2026-08-21 | Co-op weekly recap background audio: playback continues when the app is backgrounded / phone locked, with lock-screen controls; iOS audio background mode + Android media foreground service; no new data collected; lock-screen shows friend first name + "Bridger · Weekly recap" only, never question/answer content |
| 2026-08-19 | PostHog SDK wired: Settings opt-in (default off), no ATT, no session replay / geo-IP, opaque id after consent, person purge on opt-out and account delete |
| 2026-08-28 | Onboarding contacts: Connect contacts shows "Contacts loaded" + promise we notify when a friend joins from your invite; invite redeem writes `connection_accepted` (via=invite) for the inviter |
| 2026-08-27 | Onboarding contacts: Connect contacts (on-device) + three invite slots ("Invite friends #1 / #2 / #3"); co-op invite CTA shows N/3 progress or hides when complete; share/SMS open (or clipboard copy where no share sheet exists) counts toward progress, not friend join |
| 2026-08-27 | Co-op join screen: removed early "use free tier" skip; free access only after invite 3 friends (Continue with free access) or via auth code; member perk bullets shared with Co-op page; promise copy is "No ads." |
| 2026-08-27 | Onboarding notification preferences now start **all off**; the user opts in to each kind. Nothing is pre-selected on their behalf |
| 2026-08-27 | Onboarding recap is voice-memo only (no typing option on that screen); still skippable; mic asked in context |
| 2026-08-05 | Initial scaffolding seeded from shipped co-op portal, soft join, PostHog analytics rules, Touch Grass Events-only send, Friend Pod on Friends, quiz-without-AI, polls, profile customize MVP, hard-delete / zones promises. |
