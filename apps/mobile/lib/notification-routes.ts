// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns a notification into the screen path it should open. Same map for
// Home preview taps, Notifications list taps, and (later) push. Spec: NOTIFICATIONS.md.
// If we don't know where to go, we send them to the Notifications page.
// ============================================
import type { AppNotification } from '@bridger/shared';

/** Expo Router path string for a notification destination. */
export type NotificationHref = string;

/**
 * Where this notification should take the person.
 * PRIVACY: only uses opaque ids from the payload — never copies UI text into the path.
 */
export function pathForNotification(n: AppNotification): NotificationHref {
  const t = n.target ?? {};

  switch (n.kind) {
    case 'story_reply':
      return '/story/me?comments=1';
    case 'story_reply_elsewhere': {
      const author = t.authorId ?? n.personId;
      return author ? `/story/${author}?comments=1` : '/notifications';
    }
    case 'connect_request':
    case 'mutual_connection':
      return '/(tabs)/discover';
    case 'touch_grass_signal':
    case 'touch_grass_im_in':
      return '/(tabs)/events';
    case 'birthday':
    case 'custom_date':
    case 'friend_check_in':
    case 'inside_joke': {
      const person = t.personId ?? n.personId;
      return person ? `/person/${person}` : '/notifications';
    }
    case 'event_invite':
    case 'event_reminder':
    case 'rsvp_going':
    case 'event_assignment':
    case 'event_introduction':
      return t.eventId ? `/event/${t.eventId}` : '/notifications';
    case 'poll_activity':
      return '/(tabs)/home';
    case 'quiz_share':
      return t.quizSlug ? `/quiz/${t.quizSlug}` : '/notifications';
    case 'recap_reaction':
      return '/recap';
    case 'message':
      return t.threadId ? `/messages/${t.threadId}` : '/(tabs)/messages';
    case 'coop_announcement':
      // Portal redirects non-members to /coop benefits.
      return '/coop/portal';
    case 'activity_live':
      return '/activity';
    default:
      return '/notifications';
  }
}
