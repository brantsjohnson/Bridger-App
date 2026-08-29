# Bridger - Terms of Use / EULA (living draft)

> **WHAT THIS FILE IS:** plain-English master draft of Bridger's Terms of Use and EULA (End User License Agreement). Lawyers will turn this into the real legal document users agree to. Agents and builders **must update this file in the same change** whenever a feature changes user obligations, payments, UGC rules, moderation, age, AI output, or membership (see `.cursor/rules/guide-rules.mdc` §8 and the standing reminders at the top of that file).
>
> **STATUS:** scaffolding + seeded from shipped product truth. `TODO (legal)` = counsel wording. `TODO (product)` = fill when that area is next touched.
>
> **RELATED:** `guide-docs/docs/PRIVACY.md`, `complete/COOP.md`, `complete/COOP-PORTAL.md`, `FRIENDS.md` (report / block), `ADMIN.md` (moderation), App Store Guideline 1.2 (UGC).

---

## How to update this file (for Cursor / builders)

1. Find the heading that matches what you just built.
2. Add a short bullet for the new user-facing rule or obligation.
3. If Apple / Play require a clause (objectionable content, IAP, account deletion), keep that clause visible and accurate.
4. Never invent legal threats or warranties the product does not support.
5. Keep copy free of em dashes.

---

## 1 · Agreement

- By creating an account or using Bridger, you agree to these Terms and the Privacy Policy draft (`PRIVACY.md`).
- **TODO (legal):** governing law, venue, and entity name.
- If you do not agree, do not use the app.

---

## 2 · Who can use Bridger

- You must meet the **minimum age** for a social app: **TODO (legal + product): exact age + age-gate UX**.
- You must provide accurate signup information we actually need (we do not ask for data we do not use).
- One person, one account unless we expressly allow otherwise: **TODO (legal)**.
- We may refuse or terminate accounts that violate these Terms.

---

## 3 · The license (EULA shape)

- Bridger grants a personal, non-exclusive, non-transferable, revocable license to use the app for its intended purpose.
- You do not own the Bridger software, trademarks, or design system; you own your content subject to the license you grant us below.
- **TODO (legal):** standard App Store / Play license wrap language if required for distribution.

---

## 4 · What Bridger is (and is not)

- Bridger helps you stay close to people you choose (Friends tiers, Updates, Events, Touch Grass, quizzes, recap Friend Pod, Discover).
- Account creation is through **Continue with Google** or **Continue with Apple** on Sign in (first use creates the account; next time signs you in). Email sign-in remains for existing password accounts. Completing onboarding after first sign-in is required before using the app.
- The **co-op** is optional membership for richer creation, named groups, and storage. Signup offers **Join the co-op** or **Free Lite**. **Connection is never paywalled** (Discover, adding people, messaging within limits, attending events, viewing content, answering polls stay free on Free Lite). Free Lite limits expression and scale (e.g. rolling ~30-day storage, 5 Close / 30 Friends, photo/text stories), not whether you can meet someone. See `complete/COOP.md`.
- Bridger is not a dating product, not an ad network, and not a blockchain / crypto product. Free Lite and co-op are **ad-free** (no behavioral / third-party ads).
- During onboarding you may set a **connection style** preference (what you want Bridger to prioritize) and a **friends-of-friends matching preference** (workout, go out, creative, industry, travel, nearby, someone who gets me). These only shape *your* Home, notification lean, and which friends-of-friends you are shown. They are never used to sell ads or to match you to strangers.
- Onboarding also asks a few optional, skippable "taste" questions (job, dream job, a song, your towns, a favorite trip that may be placed on your map, a weekly highlight, a grid color, social-events pacing). You choose the audience for each on the Privacy & Control screen, and nothing is required except your name.
- The co-op join screen offers: **invite 3 friends for free access** (with progress if you already shared some links during the contacts step; when all 3 are done, "Continue with free access"), **join directly for a paid membership ($6/mo)** that shares profits, or redeem an **auth code** for a free year. There is no separate "use free tier" skip; free access is only via the invite path (or an auth code for a free year of membership).

---

## 5 · Your account and security

- Keep your login secure; you are responsible for activity under your account unless you promptly report compromise.
- Account deletion is available in Settings and performs a **hard delete** of your data (see Privacy Policy). Deletion also removes you from analytics (PostHog person purge).
- Product analytics is **on while you are signed in**. It records anonymous screen and button names so we can fix confusing flows. It is not ads. It does not include your name, messages, or photos. Demo mode does not send. Deleting your account also erases your analytics person.
- Data export on request: **TODO (product + legal)**.
- **Demo / preview builds:** entering the on-device fake-data walkthrough (logo long-press where enabled) does **not** create a Bridger account. You are not bound as a registered user until you complete a real sign-up / sign-in. Demo fixtures are sample content for exploring the product, not other people's real data.

---

## 6 · Acceptable use and UGC (App Store 1.2)

**No tolerance for objectionable content or abusive users.** You agree not to:

- Post illegal, hateful, harassing, sexual-involving-minors, graphic-violent, or otherwise objectionable content.
- Impersonate others, spam, scam, or attempt to break the service (scraping, reverse engineering beyond fair use, attacking infrastructure).
- Share others' private information without consent.
- Use Bridger to track or advertise to people without consent.
- Circumvent blocks, bans, tier limits, or rate limits (e.g. Messages 5/day per conversation).

**Content license:** you keep ownership of content you post. You grant Bridger a limited license to host, display, and deliver that content to the audiences you chose, and to operate moderation and safety features.

**Report and block:** you can report **content** (Updates, messages, Inside Jokes, comments, AI-written summaries when those ship) and block people. Blocks create a hole in *your* graph only.

**Moderation:** we may remove content or restrict accounts that violate these Terms. Reported content should reach a human review path (admin console). **TODO (legal + product): stated response-time commitment** once the pipeline is live.

---

## 7 · Features with special rules

### 7.1 Updates (stories)

- Capture-only media except profile photo.
- Audience is chosen per post (concentric tiers + optional exclusions).
- No view counts.
- Optional **BeReal-like reminders** (1–3 notifications a day) are opt-in only. You can turn them off from the capture screen or Settings → Notifications.

### 7.2 Touch Grass

- **Send** from the **Events** page only. Home shows friends' signals to answer ("I'm in" / dismiss).
- Signals notify Close or Friends only (Friends includes Close). Acquaintances never get a Touch Grass blast. No vanity view counts.

### 7.3 Friend Pod / recap

- Lives on the **Friends** tab (`/recap`), not Home.
- Voice answers are shared with the audience you pick; rolling retention with purge.
- The recap player supports **background playback**: it keeps playing when you background the app or lock your phone, and offers standard lock-screen / Control Center controls. The lock-screen card shows only the current friend's first name and a "Bridger · Weekly recap" label, never the question or answer content.

### 7.4 Quizzes and polls

- Taking quizzes and **answering** polls is free.
- **Creating** polls / "ask the group" is a co-op perk.
- Quiz "who got who" / "your versions" is friends-only where implemented (account required to see friend results).
- **Sharing your result:** you can save your result card image to your phone or send the image / a result link to other apps (Instagram, Snapchat, Messages, etc.). Once you share it off Bridger you are responsible for it, and the app you send it to has its own terms. Result links you share are meant to invite friends to take the quiz; do not use them to spam.

### 7.4b Optional surprises (delights)

- Fun extras (gift surprises, seasonal moments, reusable effects) are optional and can be turned off.
- Gift surprises (e.g. emoji bomb) may only go to people you are connected with. Duplicate unplayed gifts to the same person are rejected.
- Do not use surprises to harass. We may disable a delighter or accounts that abuse them.

### 7.5 Co-op portal

- Public read; member write.
- Ideas, mission, economics, votes. Comments appear as **"A member"** (no person names on the member portal).
- Vote **tallies are not shown** on the member portal (admin may see aggregates).
- Display dues: **$6/month** or **$60/year** (yearly is 2 months free). You pick the billing period in the join sheet before paying. Cancel is **period-end** (`cancel_at_period_end`); perks continue until `dues_paid_through`, then membership reconciles to free / rolling ~30-day storage.
- **Billy+** is an optional monthly add-on for more Billy assistant time (metered in USD of model cost). Taste allowance for members who enable Billy does not roll over; Billy+ unused credit may roll up to a capped bank (see `AGENT.md`). Period-end cancel forfeits remaining balance after the paid-through date.

### 7.6 Messages

- Intentionally limited (e.g. 5 messages per person per day) to encourage real-world contact exchange.
- Share contact posts your contact card (the fields you chose: Phone, Instagram, Email, Website, Substack, or Other). It does not count against the daily cap.
- Double-tap a friend's message to heart it. Hearts are reactions, not sent messages, and do not count against the cap.
- There is no Make a plan action inside a thread. Plans belong on Events / Touch Grass.

### 7.6b Adding friends (invite link / QR)

- Invite links and QR codes are **instant** connections (no request/accept) when redeemed by a signed-in Bridger user. The person who shared the invite gets an in-app alert that someone joined from their invite.
- Do not spam, sell, or publicly post invite links for abuse. QR invites expire quickly; treat them like handing someone your phone number in person.
- You cannot redeem your own invite. Report / block still apply after connect.

### 7.6d Linked music (Spotify / Apple Music)

- Linking Spotify or Apple Music is optional and is **not** how you sign into Bridger.
- You must have the right to connect that account under Spotify’s or Apple’s terms. Bridger uses the link to help you pick tracks (Spotify catalog search today), show short previews when available, open tracks in Spotify/Apple Music, optionally save to your Spotify library, and (when you allow matchable taste) show shared artists with friends from synced listening taste.
- Disconnect anytime in Settings; Bridger then deletes stored tokens and synced taste data. You remain responsible for content you choose to display from catalog picks (titles/artwork are UGC on your profile).

### 7.6c Profile and customization

- You control who sees each profile fact (Close / Friends / Everyone) and, separately, whether Discover may use it for matching.
- Hobby picks (including optional culture, advocacy, or wellness labels, or a hobby you add yourself) are profile facts you choose. They are not required. The same who-sees and matchable rules apply.
- You may delete any field; deletion removes it from Bridger's store.
- Co-op profile customization is a **skin** only: it cannot invent, hide, or delete your facts. Theme and Layout are no-code. Custom CSS/HTML (Code tier) is admin-gated and not generally available yet; when it ships it must not include scripts, tracking pixels, or off-Bridger assets. Customized profiles are UGC and may be reverted to the native layout after a report.
- Co-op **Greatest hits** photos are UGC you upload to Bridger-hosted storage (up to 3). Same report / revert expectations as other profile media; they are not off-platform hotlinks.
- **Profile photo "looks"** (Pop art, Comic, X-ray, Sepia) are cosmetic filters you apply to your own photo. Pop art is drawn on your device; Comic, X-ray, and Sepia are rendered on Bridger's own servers with a standard image tool (no AI, no third party). A filtered photo is still your content and the same acceptable-use, who-sees, report, and deletion rules apply.
- Viewers may always choose "View original" or a standing "always show plain pages" preference.
- **Storage meter:** co-op members see used vs included media storage. Going over shows an overage price before any charge (current wave: display stub only; no silent charges). Free accounts use the rolling story window.

### 7.7 Events and chip-in

- Hosts may mark events as repeating (weekly / monthly / yearly). You are responsible for the series you publish. Cancel or update the series from the event page.

- Hosts may show chip-in amount + method (Venmo / Cash App etc.) as **peer-to-peer text links**. Bridger does **not** process those payments.
- Guest caps: Free Lite 35 / co-op 100. Co-hosts, allergy collection, and assignments are co-op host tools. Hosting itself is never paywalled. See `COOP.md` / `EVENTS.md`.
- When a host turns on "let friends invite friends," going attendees may invite people they are connected with. Those invites are attributed to the inviter for the host's planning lists. Do not spam event invites.

### 7.8 AI-generated text (when enabled)

- Day/week summaries and similar ambient text are model-assisted. Bridger does **not** label them as "AI" in the product voice; they must read as Bridger being attentive.
- Summaries are grounded in your own words/transcripts. Thin days may show no summary. You can delete Updates (and their derived summaries) at any time.
- Bridger does **not** guarantee that model-assisted text is complete or free of error. Harmful or objectionable model output can be reported like other content.
- Discover suggestions use what you marked matchable; you can turn Discoverable off anytime. We do not use time-in-app or click analytics to rank people. Turning Discover off or deleting your account removes matching data about you.
- A future **Local map** (friend radar on Discover) will be opt-in only and for people you already know who choose to share nearby presence. It is not live yet (Discover shows Coming soon only). It is not a stranger or dating map.
- **Behind the Scenes** is optional. You may share private context (for example mental-health related) to help matching go at your pace. It never appears on your profile and other people never see it. You choose how strongly matching may use it, you can skip it, and you can edit or remove it in Settings. Bridger does not use it to exclude or hide you from others.
- **Your Vibe** and other Discover quizzes are optional private modules. Results help introductions; they are not shown on your profile. Optional written explanations stay private. Emotional-sensitivity style signals are not used to block who you can meet.
- **The Friend Zone** is an optional friendship-pattern quiz (not a clinical attachment diagnosis). Results stay private and may gently inform introductions.
- **What Gets You Going** is an optional values quiz about relative priorities (not a moral ranking). It does not ask about political parties. Results stay private and may inform introductions by similarity.
- **Your Funny Bone** is an optional humor-taste quiz (what you laugh at, not a comedy skill grade). Results stay private and may inform introductions by similar taste. How you joke with friends may be noted for later product use and does not currently gate matches.
- The optional relationship assistant (**Billy**) is off by default, admin-gated, and never acts without your confirm. It drafts Bridger messages and events; you approve send, schedule (full draft + exact send time), or create. It does not use your phone texts. Style-aware drafting (optional, on by default) learns how you write from your own Bridger messages, not what you said to whom. Voice questions are optional and transcribed only to answer you. After you speak, Billy may auto-send when it hears a few seconds of silence; you can also stop and discard from the Island stop square. On some browsers, live captions while listening may use the platform speech service. People who have not opted in should not see Widget, Screen, or Island. You are responsible for messages you send or schedule and events you publish after a Billy draft.
- The app must remain fully usable with every AI job disabled.

---

## 8 · Membership, payments, and cancel

- One co-op membership sold as auto-renewing **monthly** ($6/mo) and **yearly** ($60/yr, 2 months free) products. On iPhone/iPad this is App Store In-App Purchase; on Android it is Google Play Billing; on the web it is a card via Stripe Checkout. The person chooses the pay method (by device) and the billing period in an in-app join sheet. Standalone micro-SKUs are retired. The free path is **Free Lite** (invite 3 friends, or stay free with smaller circle caps).
- **Joining is always skippable.** Choosing Free Lite / inviting friends keeps the essentials to stay connected (no ads).
- **Payment methods:** Apple / Google via **RevenueCat** + platform IAP on iOS and Android. Card via **Stripe Checkout** on web (and optionally Android). Card payment for digital membership is **not** offered inside the iOS app (Apple rules). Demo builds may still soft-join.
- Subscriptions auto-renew until cancelled in App Store / Google Play (Customer Center) or via Bridger's period-end cancel. Refunds follow the store's rules.
- Do not steer iOS users to an external web checkout for membership in a way that violates Apple rules.
- **Auth / promo codes:** we may issue codes that grant a **free year** of the co-op at no charge. A code can be used a limited number of times (set by the operator) and each person may use a given code once; codes may be turned off or expire, and giving one out is a courtesy, not a permanent entitlement. When the free year ends, membership returns to normal (renew to keep perks, or drop to Free Lite). We record which account redeemed which code (opaque id only) to enforce these limits.
- Cancel schedules end-of-period; you keep member perks until paid-through, then return to free limits.
- Refunds: **TODO (legal):** align with Apple / Google / card-processor policies when live payments ship.
- Chip-in handles on events are not Bridger charges.

---

## 9 · Intellectual property

- Bridger name, logo, Magic Patterns-derived UI, and code are owned by Bridger (or licensed to it).
- You may not copy the app, scrape profiles for competing products, or misuse trademarks.
- **TODO (legal):** DMCA / notice-and-takedown contact.

---

## 10 · Disclaimers and liability

- Bridger is provided "as is" to the extent allowed by law.
- We do not guarantee matches, friendships, event outcomes, or uninterrupted service.
- **TODO (legal):** limitation of liability, indemnity, and consumer-law carve-outs by jurisdiction.

---

## 11 · Termination

- You may delete your account anytime from Settings.
- We may suspend or terminate for Terms violations, illegal activity, or risk to others.
- Surviving sections (IP, disclaimers, etc.): **TODO (legal)**.

---

## 12 · Changes to these Terms

- We may update these Terms as the product evolves.
- Material changes: **TODO (legal):** notice method (in-app, email) and effective date rules.
- Builders update this draft whenever product obligations change; do not wait for a legal rewrite to record the facts.

---

## 13 · Contact

- Terms / trust & safety: **TODO (legal): email**.
- Report objectionable content via in-app report flows (and admin pipeline when live).

---

## Changelog (builders keep this short)

| Date | What was added / changed |
|---|---|
| 2026-08-28 | Co-op paywall: custom in-app join sheet (pick method by device, then monthly $6 / yearly $60 with 2 months free); Apple Pay / Google Pay marks not used (IAP methods). Yearly price set to $60. Server webhooks emit coop_renewed / coop_expired (opaque user id only). |
| 2026-08-28 | Co-op payments: RevenueCat (Apple/Google) + Stripe Checkout for card on web; card not offered inside iOS for digital membership |
| 2026-08-27 | Apple Music link (optional): not Bridger login; MusicKit authorize; taste sync for shared artists; disconnect deletes tokens + taste; Apple Music / Spotify ToS apply to each link |
| 2026-08-21 | Recap Friend Pod: background audio playback (locked phone / backgrounded app) with lock-screen controls; lock-screen shows friend first name + "Bridger · Weekly recap" only |
| 2026-08-21 | Messages: contact card share + double-tap hearts (not sends); no Make a plan in-thread |
| 2026-08-21 | Touch Grass send: Close / Friends only |
| 2026-08-14 | Co-op vs Free Lite restated: 5/30 vs 25/125 circles; named groups, video posting, daily recaps, unlimited storage, host extras (co-hosts/allergies/assignments) are co-op; connection stays free |
| 2026-08-11 | Onboarding: two-tier join (co-op / Free Lite), connection-style preference for own-Home only, ad-free both tiers; membership display $72/yr |
| 2026-08-07 | Optional delights: friends-only gifts; no harassment via surprises; can be disabled |
| 2026-08-07 | Spotify link (optional): not Bridger login; catalog picks / previews / open-in-app; disconnect deletes tokens + taste; Spotify ToS apply to the link |
| 2026-08-06 | AI System: ambient summaries/moderation/embeddings via server gateway; fail silent; optional assistant still off by default when that ships |
| 2026-08-06 | Assistant: opt-in, confirm-before-act; drafts only (you send/create); voice optional |
| 2026-08-07 | Billy: schedule with approve; in-Bridger messages only; style drafting toggle |
| 2026-08-07 | Billy act tools: notes/reminders, message/event drafts, Touch Grass confirm send, queued schedule cancel until fire |
| 2026-08-07 | Events: friends-can-invite attribution; no spam event invites |
| 2026-08-08 | Events: hosts may publish repeating series; responsible for cancel/update from the event page |
| 2026-08-08 | Behind the Scenes optional disclosure: private, skippable, never shown to matches; not used to exclude anyone |
| 2026-08-08 | Your Vibe / Discover quizzes: optional private modules; explain text private; emotional sensitivity not a meet-gate |
| 2026-08-08 | The Friend Zone: optional friendship-pattern quiz; private results; not a clinical diagnosis |
| 2026-08-08 | What Gets You Going: optional values priorities; politics-free; private; similarity matching |
| 2026-08-08 | Your Funny Bone: optional humor taste; private; similarity + breadth; style not a match gate yet |
| 2026-08-08 | Local map (friend radar): Coming soon teaser only; future opt-in friends nearby, not strangers or dating |
| 2026-08-07 | Billy D1: Widget / Screen / Island surfaces; playbook-guided fill loop; confirm-before-act unchanged |
| 2026-08-07 | Billy voice: shared mic across Home / Island / Screen; silence auto-send; Island stop discards |
| 2026-08-07 | Co-op display dues $72/yr; Billy taste + Billy+ add-on; capped rollover on plus; allowance vs vendor outage |
| 2026-08-06 | Discover matching: matchable consent; opt-out/delete purges; no engagement ranking |
| 2026-08-07 | Storage meter stub: used vs included; overage price shown before charge (no silent billing) |
| 2026-08-07 | Co-op Greatest hits photos: Bridger-hosted UGC (≤3), reportable like other profile media |
| 2026-08-06 | Profile: per-field visibility + separate matchable consent; co-op customize is presentation-only UGC with View original; no scripts or off-Bridger assets in custom skins |
| 2026-08-28 | Invite redeem: inviter gets an in-app "Joined from your invite" alert |
| 2026-08-06 | Invite link / QR: instant connect when redeemed; no self-redeem; no spam/abuse of invite links |
| 2026-08-20 | Product analytics on while signed in; no Settings off-switch in this build; purge on account delete |
| 2026-08-20 | Quiz result sharing: save card image or send image/result link to other apps; user owns/responsible once shared off Bridger; links are quiz invites, not for spam |
| 2026-08-20 | J-name share links: stable per-person link; opening one may connect a later signup to the friend who invited them; free public web view, but seeing your friends' results needs an account |
| 2026-08-21 | J-name "your versions" board is friends-only (account required); alerts when someone opens your quiz link or a friend lands on one of your top J picks |
| 2026-08-21 | Hobby bank includes optional culture / advocacy / wellness labels plus add-your-own; same visibility and matchable rules; none required |
| 2026-08-19 | Product analytics opt-in in Settings; opt-out stops capture and purges the PostHog person |
| 2026-08-27 | Onboarding invite progress carries into co-op: invite 3 friends CTA shows N/3 already invited, or drops when all 3 slots are filled |
| 2026-08-05 | Initial scaffolding: UGC zero-tolerance clause, report/block, co-op $24 + period-end cancel + soft join, skippable membership, Touch Grass Events-only, Friend Pod on Friends, portal no names/tallies, chip-in peer links, PostHog not ads, AI deferred but reportable when live. |
