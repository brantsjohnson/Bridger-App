// ============================================
// WHAT THIS FILE DOES (plain English):
// A tiny one-time flag that says "this person JUST finished onboarding, so play
// the welcome fireworks the next time Home is ready." Onboarding sets it at the
// finish line; Home reads it once and clears it, so the fireworks play exactly
// once and never again on later visits (including after posting an update).
//
// It lives in memory (not storage) on purpose: the app stays running through
// the hop from the onboarding screen to Home, and we never want the party to
// replay after a real app restart.
//
// Two guards keep it from firing at the wrong time:
//  1. `playedWelcome` latches the moment Home consumes the flag, so a later
//     remount (closing the post composer, Fast Refresh, etc.) cannot replay.
//  2. Listeners let an already-mounted Home react the instant onboarding marks
//     the flag (mount-only effects would miss that and leave the flag pending
//     until a later remount, which looked like "posting triggered the party").
// ============================================

// THIS SECTION DOES: hold the "show the party" flag for the current app run.
let pendingWelcome = false;
// THIS SECTION DOES: remember we already handed the party to Home this run.
let playedWelcome = false;
// THIS SECTION DOES: Home subscribes here so a mark wakes it up immediately.
const listeners = new Set<() => void>();

// THIS SECTION DOES: onboarding calls this at the very end so Home knows to party.
export function markWelcomeCelebration(): void {
  // Never re-arm after the party has already been handed off once.
  if (playedWelcome) return;
  pendingWelcome = true;
  for (const notify of listeners) notify();
}

// THIS SECTION DOES: Home calls this when it is ready to show the party; it
// returns true a single time, then latches so the fireworks never replay.
export function consumeWelcomeCelebration(): boolean {
  if (playedWelcome || !pendingWelcome) return false;
  pendingWelcome = false;
  playedWelcome = true;
  return true;
}

// THIS SECTION DOES: let Home wake up the moment onboarding marks the flag,
// even if the Home screen was already mounted under the onboarding stack.
export function subscribeWelcomeCelebration(onMark: () => void): () => void {
  listeners.add(onMark);
  return () => {
    listeners.delete(onMark);
  };
}
