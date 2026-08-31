# Deep-link association files (`.well-known`)

## WHAT THESE FILES DO (plain English)

These two files are what let a tapped `https://bridger.app/...` link open the
Bridger app directly (instead of the browser). This is how a friend's "add me"
invite link (`https://bridger.app/invite/<token>`), a shared quiz result
(`/q/<token>`), or an event link (`/e/<id>`) can open the app and, for invites,
add the two people as friends and show their connection reveal.

- `apple-app-site-association` — iOS Universal Links (no file extension, served
  as JSON).
- `assetlinks.json` — Android App Links.

The matching app-side config lives in `apps/mobile/app.config.js`
(`ios.associatedDomains` and `android.intentFilters` with `autoVerify: true`).

## BEFORE THESE WORK: two values must be filled in, then rebuild

Both files ship with clearly marked placeholders because the real values are
account secrets that cannot live in source control blindly.

1. **`apple-app-site-association` → `REPLACE_WITH_APPLE_TEAM_ID`**
   Your 10-character Apple Developer Team ID (App Store Connect → Membership,
   or `eas credentials -p ios`). The `appIDs` value must read
   `<TEAMID>.social.bridger.app`.

2. **`assetlinks.json` → `REPLACE_WITH_ANDROID_SHA256_CERT_FINGERPRINT`**
   The SHA-256 fingerprint of the app-signing certificate. Run
   `eas credentials -p android` (or Google Play Console → Setup → App signing)
   and copy the `SHA256 Fingerprint` value (colon-separated hex).

## HOSTING REQUIREMENTS (must be true for verification)

- Both files must be served from the **same domain the invite links use**
  (`bridger.app`), over **HTTPS**, at exactly:
  - `https://bridger.app/.well-known/apple-app-site-association`
  - `https://bridger.app/.well-known/assetlinks.json`
- `assetlinks.json` must be served with `Content-Type: application/json`.
- The AASA file must be served as JSON with **no redirects**.

## AFTER hosting + filling the values

- Set the invite link base to https so links become tappable:
  - Mobile: `EXPO_PUBLIC_APP_LINK_BASE=https://bridger.app`
  - API: `APP_LINK_BASE=https://bridger.app`
  (Until this is set, invites use the `bridger://` scheme, which already opens
  the installed app but is not always a tappable link in every messaging app.)
- Rebuild the native apps with EAS so iOS/Android re-fetch the association
  files. Verification can take a few seconds on Android after install.
