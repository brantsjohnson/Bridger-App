// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns the notification choices you made in onboarding into a real, native
// permission ask. After you pick which nudges you want, this shows the iOS /
// Android system dialog once. If you say no, the app keeps working — the
// choices are still saved and can be re-enabled later in Settings.
//
// PRIVACY: this is first-party only (reminders about your own friends and
// events). No ad tracking, no third-party push SDK. We only ever ask for the
// permission; we never read anything from the OS here.
// ============================================
import * as Notifications from 'expo-notifications';

/** The result of asking: did the OS end up granting notification permission? */
export type NotifPermissionResult = 'granted' | 'denied' | 'undetermined';

/**
 * Ask the OS for notification permission, but only if we have not asked before
 * (iOS only lets the system dialog show once). Safe to call with no choices —
 * it simply no-ops so we never nag someone who wants zero reminders.
 */
export async function requestNotificationPermission(
  wantsAny: boolean
): Promise<NotifPermissionResult> {
  // Nobody asked for any nudges: don't pop a permission dialog at all.
  if (!wantsAny) return 'undetermined';

  try {
    // If the OS already decided (granted or denied), respect that and stop.
    const current = await Notifications.getPermissionsAsync();
    if (current.status !== 'undetermined') {
      return current.status === 'granted' ? 'granted' : 'denied';
    }

    // First time: show the native dialog in context, right after they chose.
    const asked = await Notifications.requestPermissionsAsync();
    return asked.status === 'granted' ? 'granted' : 'denied';
  } catch {
    // Notifications module missing (e.g. running in a bare web build): degrade.
    return 'undetermined';
  }
}
