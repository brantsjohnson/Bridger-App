# Bridger — Notifications (spec)

Self-contained. Every in-app alert and every push that can land on a device has one job: **take the person to the right place** when they tap it. This doc is the map.

Maps to the `notifications` module, Home's notifications preview (`HOME.md`), the full **Notifications** page (`app/notifications`), and push delivery. UI design source: Magic Patterns `NotificationsScreen` + `NotificationRow` (title **"Notifications"**). Iterate that screen in Magic Patterns before changing layout.

---

## Nav-bar dots and section title dots

Each floating-nav tab can show a small matching-color **dot** when that page has unread activity.

- **Open the tab** → the **nav-bar dot for that whole tab clears** (acknowledged for the current unread set). A brand-new alert for that tab lights the nav dot again.
- **On the page**, a matching little **dot sits beside the section title** the alert belongs to (Stories, Touch grass, Wants to connect, etc.) so you can see where the news is. Those section dots stay until the underlying alerts are read / cleared (Mark all as read, open the reply chip, etc.).
- **Messages** stay off this system (chat unread is only on the Messages header shortcut).

---

## Notifications page filters & mark all read

The full **Notifications** page (not the Home preview) can filter by the same pages as the floating nav — so you can see **why a nav dot is lit**:

| Filter | What it shows |
|---|---|
| **All** | Every listed alert |
| **Home** | Story replies, recap, polls/activity, quizzes, birthdays / saved dates / check-ins, co-op notes |
| **Friends** | Connect requests, mutual connections, inside jokes, Circle adds, version-quiz taken |
| **Events** | Touch Grass + event invites / reminders / RSVPs / assignments / intros / host notes |
| **Discover** | Discover-related alerts (when present) |

**Messages are not on this page.** Chat unread lives only on the Messages tab (and its own badge). No Messages filter chip.

**Mark all as read** only clears unread on the **filter you are viewing**: All clears every listed alert; Home / Friends / Events / Discover clear that page only. When All or Home is selected, it also clears open Home story-reply chips so Home's nav dot matches. It does not clear Messages unread.

---

## Surfaces

| Surface | What it is |
|---|---|
| **Home preview** | Notifications widget on Home. Shows ~3 recent rows + **"See all"**. |
| **Notifications page** | Full-screen list (header **"Notifications"**, back, unread rows tinted). Opened only from **See all** (or a future deep link). |
| **Push** | OS banner / lock-screen. Same destination map as an in-app row of that `kind`. |

Rules:
- **See all** → always opens the Notifications page (new screen). Never folds the full list into Home.
- **A single row** (preview or full page) → goes to the destination for that notification's `kind` (table below). Never opens the full list.
- **Push tap** → same destination as the matching row. If the payload is missing a target id, fall back to the Notifications page.
- **No notification bell** in the header (see `MAGIC-PATTERNS.md`). Preview + page only.
- **PRIVACY:** notification copy can show a first name in the UI. Analytics never logs names, message text, or caption text. Events carry `kind` + opaque ids only.

---

## Destination map (click + push)

Every kind can be delivered as an in-app row and as a push. **Tap destination is identical** for both.

| `kind` | Example UI copy (not logged) | Opens | Route / target |
|---|---|---|---|
| `story_reply` | "{Name} replied to your story" | Your story replies while live; Messages thread after expiry | `/story/me?comments=1` (live) · `/messages/{threadId}` (expired) |
| `story_reply_elsewhere` | "{Name} replied to your comment" | That person's update, comments open | `/story/{authorId}?comments=1` |
| `story_prompt` | "Time to post an update" or "📸 Don't forget to capture the mems" (mid-party) | Capture / Your story composer | `/story/capture` or `/story/capture?eventId={eventId}` |
| `collage_tag` | "{Name} tagged you on a collage" | Their collage page (the author who tagged you) | `/story/{authorId}` |
| `connect_request` | "{Name} wants to connect" | Discover → Wants to connect | `/(tabs)/discover` (focus request when `requestId` present). Same destination whether the request came from Discover Add or from reveal Screen 3 FoF Add. |
| `mutual_connection` | "{A} and {B} connected — through you" · or "Joined from your invite" when someone redeems your invite link/QR or makes an account from your J-name quiz share (API may store `connection_accepted`; the app maps it here) | Discover (FoF payoff) · their profile when it was an invite / quiz-share join | `/(tabs)/discover` · `/person/{personId}` · `/quiz/what-j-name` |
| `friend_joined` | "Someone you know joined Bridger" | Their profile (the person whose phone matched your private card) | `/person/{personId}` · `/(tabs)/friends` if id missing |
| `touch_grass_signal` | "{Name} is free tonight" | Their live signal (Events / Home strip) | `/(tabs)/events` (signal focused when `signalId` present) |
| `touch_grass_im_in` | "{Name}'s in" | Your signal / plan | `/(tabs)/events` (own signal / plan) |
| `birthday` | "{Name}'s birthday is Friday" | Their profile | `/person/{personId}` |
| `custom_date` | "{Name}'s graduation · in 1 week" | Their profile | `/person/{personId}` |
| `friend_check_in` | "Check in with {Name}?" | Their profile (your private notes) | `/person/{personId}` |
| `event_invite` | "{Name} invited you" (host or attendee when friends-can-invite) | Event detail | `/event/{eventId}` |
| `event_reminder` | "Starts in 2 hours" | Event detail | `/event/{eventId}` |
| `rsvp_going` | "{Name} is going" | Event detail | `/event/{eventId}` |
| `event_assignment` | "You're on drinks" / assignment change | Event detail (assignments) | `/event/{eventId}` |
| `event_introduction` | Someone at an event you should meet | Event detail (introductions / meet) | `/event/{eventId}` |
| `event_host_note` | "{Name} posted a note on {event}" | Event detail (notes) | `/event/{eventId}` |
| `circle_connected` | "You added {Name} to your Circle" / "{Name} added you" | Fan: Influencer card / In common. Influencer: portal | `/person/{personId}` · `/influencer` |
| `circle_event_invite` | "{Name} invited you (Circle)" | Event detail | `/event/{eventId}` |
| `version_quiz_taken` | "{Name} took your quiz" | Author's version-of-me dashboard | `/me/version-quiz` |
| `poll_activity` | "{Name} posted a poll" / "{Name} answered your poll" | Home Ask-the-group / poll results | `/(tabs)/home` (ask widget; open results when `pollId` present) |
| `quiz_share` | "{Name} shared a quiz with you" | That quiz | `/quiz/{slug}` |
| `jname_link_opened` | "{Name} opened your quiz link" / "Someone opened your quiz link" | Your J-name quiz result / board | `/quiz/what-j-name` |
| `jname_top_match` | "{Name} got {J-name} — one of your top picks" | Your J-name quiz result / board | `/quiz/what-j-name` |
| `friend_nearby` | "{Name} is nearby" (opt-in Local map; coming soon) | Discover Local map / their profile | `/(tabs)/discover` · `/person/{personId}` |
| `friend_city_visit` | "{Name} is in your city" after they opt to share a visit (coming soon) | Their profile / Touch Grass | `/person/{personId}` · `/(tabs)/events` |
| `recap_reaction` | "reacted 🔥 to {Name}'s recap" | Weekly recap player | `/recap` |
| `inside_joke` | "{Name} tagged you in a joke" | Inside Jokes (their / your wall) | `/person/{personId}` (Inside Jokes tab) or Friends wall |
| `message` | "{Name} sent a message" | That conversation | `/messages/{threadId}` |
| `coop_announcement` | Co-op vote / books / call | `/coop/portal` | Public portal hub (join CTAs on write actions) |

Ops (not user push): new portal ideas email `COOP_IDEA_REVIEW_EMAIL` + admin **Co-op portal** queue.
Ops (not user push): Anthropic/OpenAI hard-limit or 429 → admin **Billy / AI economics** `ai_ops_alerts` banner (optional founder email later; users see soft "Billy unavailable", not a top-up CTA).
| `activity_live` | "Notes App Discovery is live" | Side Quest wall | Activity route from `HOME.md` / `ADMIN.md` |
| `delight_gift` | "{Name} emoji-bombed you" | Home (DelightHost plays the gift overlay) | `/(tabs)/home` |

**Fallback:** unknown `kind`, missing ids, or expired target → Notifications page (`/notifications`).

---

## Payload shape (server + client)

Every notification (in-app + push) carries:

```ts
type NotificationKind =
  | 'story_reply'
  | 'story_reply_elsewhere'
  | 'story_prompt'
  | 'collage_tag'
  | 'connect_request'
  | 'mutual_connection'
  | 'friend_joined'
  | 'touch_grass_signal'
  | 'touch_grass_im_in'
  | 'birthday'
  | 'custom_date'
  | 'friend_check_in'
  | 'event_invite'
  | 'event_reminder'
  | 'rsvp_going'
  | 'event_assignment'
  | 'event_introduction'
  | 'event_host_note'
  | 'circle_connected'
  | 'circle_event_invite'
  | 'version_quiz_taken'
  | 'poll_activity'
  | 'quiz_share'
  | 'jname_link_opened'
  | 'jname_top_match'
  | 'recap_reaction'
  | 'inside_joke'
  | 'message'
  | 'coop_announcement'
  | 'activity_live'
  | 'delight_gift';

type AppNotification = {
  id: string;
  kind: NotificationKind;
  /** Person shown in the row avatar / first-name copy. Opaque id only in analytics. */
  personId?: string;
  /** Short body after the name — UI only, never in analytics. */
  text: string;
  time: string;           // relative label for UI ("12m")
  createdAt: string;      // ISO for sort / unread
  unread?: boolean;
  /** Deep-link targets — only the ones that kind needs. */
  target?: {
    authorId?: string;    // story owner
    postId?: string;
    requestId?: string;   // Discover connect request
    signalId?: string;    // touch-grass signal
    eventId?: string;
    pollId?: string;
    quizSlug?: string;
    threadId?: string;
    personId?: string;    // profile / joke owner
    activityId?: string;
  };
};
```

Push payload must include at least `id`, `kind`, and the `target` fields that kind needs so a cold start can route without fetching first.

---

## Screens

### Home preview

- ~3 recent **unread** rows + coral **"{n} new"** chip + purple **See all**.
- Row tap → destination map (above).
- See all → `/notifications`.
- No unread → keep the widget; show **"All caught up!"** (not hidden) + See all.
- **Exclude `story_reply`.** Replies to *your* story already live in the Home **replies row** under Stories. Putting the same alert in the Notifications widget is duplicate noise. `story_reply` still appears on the full Notifications page, still can push, and still mirrors into Messages (below). `story_reply_elsewhere` (someone replied where *you* commented) stays in the Home widget — there is no replies row for that.

### Notifications page

Magic Patterns screen:
- `ScreenHeader` title **Notifications**, back to Home.
- Full list in a `Card`; unread rows use a soft purple wash (`bg-purple/15`) so text stays readable in dark mode.
- Each row = `NotificationRow` (avatar + name + text + time).
- Empty: `EmptyState` — "All caught up! When your people post or reply, it shows up here."
- No vanity counts. Unread is a boolean wash, not a public metric.
- **Includes `story_reply`** (unlike the Home widget).

**Design ownership:** visual layout lives in Magic Patterns (`design/magic-patterns/.../notifications`). Product behavior and the destination table live here. If the list layout changes, update Magic Patterns first, then port.

---

## Story replies — surfaces, DMs, clear, expiry

One coherent path for "someone replied to your story":

| Surface | Shows `story_reply`? |
|---|---|
| Home replies row ("N replies to your story") | **Yes** — primary Home surface |
| Home Notifications widget | **No** — filtered out (`homePreview: false`) |
| Full Notifications page | **Yes** |
| Push | **Yes** (prefs + circle gate) |
| Messages thread with that person | **Yes** — mirrored as a `storyReply` bubble |

### DM mirror (does not burn the 5/day)

When someone replies on your story, Bridger also drops that reply into your **Messages** thread with them, looking like a message from them. Rules (`MESSAGES.md`):

- `kind: 'storyReply'`
- **`countsAgainstCap: false`** — it is not one of their 5 messages to you, and your reply-back in the thread still follows the normal cap when you send a regular text
- Copy can preview the reply text in the thread UI; analytics never logs that text

### Clearing (mark done)

Any of these clears the matching `story_reply` notification(s) **and** drops that person's chip(s) from the Home **replies row**:

1. Tap **one chip** on the Home replies row → clears **that person only**; other chips stay
2. Tap the **header** ("N replies to your story") / open story comments with no person scoped → clears the whole open inbox
3. Open the **mirrored DM** with that person (clears that person)
4. **Reply in the story** (comment / video / sticker back — clears the open inbox on your update)
5. Tap the alert on the **Notifications** page (clears that person)

Clearing is per engaged reply / person when you open a specific chip, DM, or notification. Opening the replies **header** (or comments unscoped) handles everyone currently waiting.

### After the story window (~24h)

Stories expire; media is no longer available to viewers (`STORIES.md` / retention).

- The author can still answer a late reply: that answer goes as a normal **DM** to the replier (counts against the author's 5/day like any text).
- The replier **cannot** open the expired story anymore — there is nothing left to deep-link into.
- Tap destinations for stale `story_reply` rows fall back to the Messages thread (or Notifications page if no thread id).

---

## Prefs & push

### Where prefs live

| Surface | Behavior |
|---|---|
| **Onboarding · Stay in touch** | Coarse multi-select chips (`birthdays`, `life_updates`, `meet`, `activities`, `messages`, `reconnect`). Each chip expands into the individual kinds below when onboarding finishes. Client expands locally, then `PATCH /me/notification-prefs` with full `{ kinds, circles }`. |
| **Profile → Settings → Notifications** | Chevron (not a master toggle). Two layers: **who** (Close / Friends / Acquaintances) and **what** (one toggle per `kind`). Reads `GET /me/notification-prefs`; writes partial `PATCH` merges. |

**Storage:** `user_settings.notif_prefs` jsonb = `{ kinds: Record<NotificationKind, boolean>, circles: Record<NotificationCircleId, boolean> }`. Legacy `{ selected: prefIds[] }` blobs are normalized on read.

**API:**
- `GET /me/notification-prefs` → `{ kinds, circles }` (defaults filled in)
- `PATCH /me/notification-prefs` accepts `{ kinds? }`, `{ circles? }`, and/or legacy `{ prefIds? }` (expands server-side)

**Gating:** `NotificationsService.notifyIfAllowed` reads prefs before inserting a `notifications` row (story replies, connect requests, and other call sites as they migrate). Kind must be on; circle-gated kinds also need the actor's circle on. Prefs gate **delivery** of those rows; there is still no separate device-push pipeline beyond this insert path today.

There is **no** single Settings master switch. Per-kind + per-circle toggles only.

### Who can nudge you (circle filters)

| Circle id | Label | Default |
|---|---|---|
| `close` | Close | on |
| `friend` | Friends | on |
| `acquaintance` | Acquaintances | **off** |

For kinds marked `circleGated` in the shared list, push also requires the actor's circle toggle to be on. System notes (co-op, activity live, etc.) skip the circle check.

Canonical list: `NOTIFICATION_CIRCLE_OPTIONS` in `@bridger/shared`.

### What we nudge you about (per kind)

Settings shows one row per `kind` (not a bucket like "Events"). Section headers are for reading only.

| Kind | Label | Onboarding chip | Circle-gated | Home widget | Default |
|---|---|---|---|---|---|
| `story_reply` | Replies to your update | close | yes | **no** (replies row) | on |
| `story_reply_elsewhere` | Replies to your comments | close | yes | yes | on |
| `recap_reaction` | Recap reactions | close | yes | yes | on |
| `story_prompt` | BeReal-like reminders (1–3 / day) | — | no | **no** (push / Notifications page) | **off** |
| `birthday` | Birthdays | birthdays | yes | yes | on |
| `custom_date` | Saved dates | birthdays | yes | yes | on |
| `friend_check_in` | Check-in nudges | birthdays | yes | yes | on |
| `mutual_connection` | Friends connecting through you | moments | no | yes | off |
| `friend_joined` | Someone you know joined | meet | no | yes | on |
| `inside_joke` | Inside jokes | moments | yes | yes | off |
| `activity_live` | Weekly activities | moments | no | yes | off |
| `delight_gift` | Surprises from friends | moments | yes | yes | on |
| `event_invite` | Event invites | events | yes | yes | off |
| `event_reminder` | Event reminders | events | no | yes | off |
| `rsvp_going` | RSVP updates | events | yes | yes | off |
| `event_assignment` | Event assignments | events | no | yes | off |
| `event_introduction` | Event introductions | events | no | yes | on |
| `event_host_note` | Event notes from the host | events | no | yes | on |
| `circle_connected` | Circle adds | — | no | yes | on |
| `circle_event_invite` | Circle event invites | events | no | yes | on |
| `version_quiz_taken` | Friend finished your quiz | — | yes | yes | on |
| `touch_grass_signal` | Touch Grass signals | — | yes | yes | on |
| `touch_grass_im_in` | Touch Grass — I'm in | — | yes | yes | on |
| `connect_request` | Connection requests | — | no | yes | on |
| `message` | Messages | — | yes | yes | on |
| `poll_activity` | Poll activity | — | yes | yes | on |
| `quiz_share` | Quizzes shared with you | — | yes | yes | on |
| `jname_link_opened` | Quiz link opens | — | yes | yes | on |
| `jname_top_match` | Friend matched your J pick | — | yes | yes | on |
| `coop_announcement` | Co-op | — | no | yes | on |

Canonical list: `NOTIFICATION_KIND_PREFS` in `@bridger/shared` (must stay in lockstep with this table).

### Rules

- Prefs gate **push** delivery only. The in-app Alerts list can still show what happened while they were in the app.
- Turning a pref off must not delete past in-app notifications.
- New notify-able outcomes: add the `kind` to the destination map **and** a row in `NOTIFICATION_KIND_PREFS` in the same change.
- Push must stay tier-aware and RLS-safe: you only get notified about people/events you are allowed to see (`DATA.md`).
- Push gate: kind on **and** (if circle-gated) actor's circle on.

---

## Analytics

| Surface | IDs |
|---|---|
| Home preview | `home.notifications_preview.row` · `see_all` · `section_header` (dead) · `empty_body` (dead — All caught up) · `info` |
| Notifications page | `notifications.top_nav.page_title` (dead) · `back` · `notifications.list.row` · `empty_body` (dead) · `filter` · `mark_all_read` |
| Notification prefs (Settings) | `profile.settings.notifications` (opens prefs) · `notification_prefs.top_nav.page_title` (dead) · `back` · `intro_body` (dead) · `who_header` (dead) · `section_header` (dead) · `toggle` |

Product events (when useful):
- `notification_opened` — `kind`, `source` (`preview` \| `list` \| `push`). Never text/names.
- `notification_see_all` — opened the full page from Home.
- `notification_pref_changed` — `pref` (kind or circle id), `pref_scope` (`kind` \| `circle`), `enabled` (bool). Never labels as free text beyond the id.
- `notifications_marked_read` — Mark all as read for the active filter; `filter` (`all` \| `home` \| …).

Register IDs in `ANALYTICS-TAXONOMY.md` in the same PR as UI.

---

## Acceptance criteria

- [ ] **See all** opens the full Notifications page as its own screen.
- [ ] Tapping a preview row or a list row routes by `kind` per the destination map (not to the list).
- [ ] Push taps use the same destination map; missing target → Notifications page.
- [ ] Every shippable notification kind has a row in the destination map before it can send push.
- [ ] UI matches Magic Patterns Notifications screen; no header bell. Unread tint works in dark mode (contrast ≥ 4.5:1).
- [ ] Analytics: preview + page IDs registered; no PII/content in events.
- [ ] Notifications page can filter by All / Home / Friends / Events / Discover (no Messages); Mark all as read clears unread for the active filter only (+ Home reply chips when All or Home).
- [ ] Empty state on the full page when there is nothing to show.
- [ ] Prefs respect onboarding (coarse → kinds) + Settings per-kind and per-circle toggles (no master switch); Acquaintances off by default; push is tier/RLS safe.
- [ ] Settings → Notifications is a chevron into the prefs screen; each kind and circle has its own toggle in this doc.
- [ ] `story_reply` is **absent** from the Home Notifications widget (Home replies row owns that) but **present** on the full Notifications page.
- [ ] `story_reply` also mirrors into Messages as `storyReply` with `countsAgainstCap: false`.
- [ ] Opening one replies-row **chip** clears only that person; opening the **header** (or comments unscoped), the mirrored DM, or replying in the story clears matching `story_reply` notifications **and** drops those chips from the Home replies row.
- [ ] After story expiry, late replies go to DMs; the expired story is not openable.

---

## Related docs

- **`INDEX.md`** — lists this doc under **Always review** (checked every task)
- `HOME.md` — preview zone on Home
- `STORIES.md` — reply notification kinds
- `DISCOVER.md` — connect request + mutual-connection payoff
- `TOUCHGRASS-AND-QUIZ.md` — signal + "I'm in"
- `EVENTS.md` — invites, reminders, assignments, RSVP, host notes, album
- `CIRCLES.md` — Circle connected + Circle event invite
- `VERSION-OF-ME.md` — friend finished your quiz
- `MESSAGES.md` — message pushes
- `RECAP-PODCAST.md` — recap reactions
- `complete/COOP.md` / `complete/COOP-PORTAL.md` — co-op announcements
- `MAGIC-PATTERNS.md` — `NotificationRow` + screen map
