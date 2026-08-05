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
- The **co-op** is optional membership for richer creation and organization tools. **Connection is never paywalled** (Discover, adding friends, messaging within limits, attending events, viewing content, answering polls stay free). See `complete/COOP.md`.
- Bridger is not a dating product, not an ad network, and not a blockchain / crypto product.

---

## 5 · Your account and security

- Keep your login secure; you are responsible for activity under your account unless you promptly report compromise.
- Account deletion is available in Settings and performs a **hard delete** of your data (see Privacy Policy). Deletion also removes you from analytics (PostHog person purge).
- Data export on request: **TODO (product + legal)**.

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

### 7.2 Touch Grass

- **Send** from the **Events** page only. Home shows friends' signals to answer ("I'm in" / dismiss).
- Signals notify the chosen circle; no vanity view counts.

### 7.3 Friend Pod / recap

- Lives on the **Friends** tab (`/recap`), not Home.
- Voice answers are shared with the audience you pick; rolling retention with purge.

### 7.4 Quizzes and polls

- Taking quizzes and **answering** polls is free.
- **Creating** polls / "ask the group" is a co-op perk.
- Quiz "who got who" is friends-only where implemented.

### 7.5 Co-op portal

- Public read; member write.
- Ideas, mission, economics, votes. Comments appear as **"A member"** (no person names on the member portal).
- Vote **tallies are not shown** on the member portal (admin may see aggregates).
- Display dues **$24/year**. Cancel is **period-end** (`cancel_at_period_end`); perks continue until `dues_paid_through`, then membership reconciles to free / rolling ~30-day storage.

### 7.6 Messages

- Intentionally limited (e.g. 5 messages per person per day) to encourage real-world contact exchange.
- Share-contact / make-a-plan style actions may be uncounted per `MESSAGES.md`.

### 7.7 Events and chip-in

- Hosts may show chip-in amount + method (Venmo / Cash App etc.) as **peer-to-peer text links**. Bridger does **not** process those payments.
- Guest caps: free vs co-op per `COOP.md` / `EVENTS.md`.

### 7.8 AI-generated text (when enabled)

- Summaries and similar output are model-assisted but must not show "AI" chrome in the product voice.
- Harmful or objectionable model output can be reported like other content.
- AI is deferred for several jobs; the app must work with AI off.

---

## 8 · Membership, payments, and cancel

- One annual co-op membership (display **$24/year**). Standalone micro-SKUs (old storage add-on, etc.) are retired.
- **Joining is always skippable.** Declining keeps the free app.
- **Planned payment methods** in the join flow: Apple Pay / Google Pay via platform IAP where required, plus an in-app third-party card processor for cards. **Current wave: soft-join stub** (no live StoreKit / Play / Stripe). That is intentional.
- Do not steer iOS users to an external web checkout for membership in a way that violates Apple rules.
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
| 2026-08-05 | Initial scaffolding: UGC zero-tolerance clause, report/block, co-op $24 + period-end cancel + soft join, skippable membership, Touch Grass Events-only, Friend Pod on Friends, portal no names/tallies, chip-in peer links, PostHog not ads, AI deferred but reportable when live. |
