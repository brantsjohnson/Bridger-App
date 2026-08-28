# Co-op payments setup (what is left outside the code)

> Living checklist for finishing real co-op membership. The Nest + mobile code
> path is already built. Use this page when wiring dashboards and prod secrets.

## Already done in code / Stripe test

- Custom `JoinCoopSheet` (method → monthly $6 / yearly $60)
- RevenueCat SDK + `purchaseCoopPlan`
- Stripe Checkout + webhooks + Customer Portal
- Product events: `coop_joined`, `coop_renewed`, `coop_expired`
- Stripe **test** prices: monthly `price_1U9XpdRqab61mUCxyH2VFyqm`, yearly `price_1U9XsZRqab61mUCxH9A9nFrM`
- Local `stripe listen` signing secret in `apps/api/.env` (`STRIPE_WEBHOOK_SECRET`)

## Public API base URL

```
https://jiyzei8qqu.us-east-1.awsapprunner.com
```

Deploy the latest API to App Runner **before** pointing production webhooks at it.
Today a POST to `/coop/webhooks/revenuecat` may 404 until that deploy lands.

---

## 1 · RevenueCat webhook

1. Deploy the API with `REVENUECAT_WEBHOOK_SECRET` set to the same value as in
   `apps/api/.env` (starts with `rcwh_…`).
2. RevenueCat → **Integrations → Webhooks → New**:
   - URL: `https://jiyzei8qqu.us-east-1.awsapprunner.com/coop/webhooks/revenuecat`
   - Authorization: the **exact** `REVENUECAT_WEBHOOK_SECRET` value (with or without
     `Bearer `; our API accepts both).
3. Send a test event; expect HTTP 200.
4. Confirm a known test user flips in `coop_memberships`.

Do **not** put the public SDK key (`test_…` / `appl_` / `goog_`) or the secret
API key (`sk_…`) in the webhook Authorization field.

---

## 2 · App Store Connect + Google Play + RevenueCat products

### App Store Connect

1. Paid Apps agreement + tax + banking complete.
2. Subscription group (e.g. "Bridger Co-op").
3. Products:
   - `coop_monthly` — $5.99 or $6.00 / month
   - `coop_yearly` — $60.00 / year
4. Localization + review screenshot.
5. Sandbox tester account for device testing.

### Google Play Console

1. Subscription with **base plans**: monthly ($6) and yearly ($60).
2. Activate the subscription.
3. Service account JSON for RevenueCat.
4. Internal / license tester.

### RevenueCat

1. Attach store products to offering `default`:
   - Monthly package `$rc_monthly`
   - Annual package `$rc_annual`
2. Entitlement remains `social_bridger_app_pro`.
3. Replace Test Store key in `apps/mobile/.env`:
   - `EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_…`
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_…`
4. Do **not** attach a RevenueCat Paywall template (we use our own sheet).

---

## 3 · Stripe production (live)

Already created via Stripe CLI (live mode):

| Item | Id |
|------|-----|
| Product | `prod_V9sRA0DQe9vDXW` |
| Monthly $6 | `price_1U9YgCRustzNlpGb4OsSG1tk` |
| Yearly $60 | `price_1U9YgCRustzNlpGbKf130Otr` |
| Webhook endpoint | `we_1U9YgNRustzNlpGbDwjA89AR` |
| Webhook URL | `https://jiyzei8qqu.us-east-1.awsapprunner.com/coop/webhooks/stripe` |
| Payment method domain | `bridger.social` (Apple Pay + Google Pay **active**) |

Signing secret and live price ids are in the local (gitignored) file:

`apps/api/.env.live.snippet`

**Prod env (App Runner / Secrets Manager) must set:**

- `STRIPE_SECRET_KEY` = live secret or restricted `rk_live_…`
- `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY` = live price ids above
- `STRIPE_WEBHOOK_SECRET` = live `whsec_…` from the snippet
- `APP_WEB_URL` = `https://bridger.social`
- `POSTHOG_PROJECT_API_KEY` = public `phc_…` (for `coop_renewed` / `coop_expired`)

Keep **test** keys in local `apps/api/.env` for day-to-day development.

---

## 4 · EAS / device test

In-app purchases do **not** work in Expo Go. Use an EAS development build on a
real device (Sandbox Apple ID / Play license tester).

```bash
cd apps/mobile
npx eas-cli login   # if needed
npx eas-cli build --profile development_device --platform ios
# and/or
npx eas-cli build --profile development_device --platform android
```

Then:

1. Install the build; sign in to Bridger.
2. Join → App Store / Play sheet → confirm.
3. Confirm `coop_memberships` and (after deploy) webhook sync.
4. Web card path: open Checkout with test card `4242…` against the **test** API.

---

## Acceptance checklist

- [ ] App Runner running the webhook routes
- [ ] RevenueCat webhook 200 + membership flip
- [ ] Store SKUs linked in RevenueCat offering
- [ ] Live Stripe env on App Runner; test Checkout still uses test keys locally
- [ ] Device EAS build: Apple + Google purchase sheets work
- [ ] `coop_renewed` / `coop_expired` appear in PostHog after a renewal / cancel test
