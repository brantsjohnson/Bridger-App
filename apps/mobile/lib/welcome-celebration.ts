// ============================================
// WHAT THIS FILE DOES (plain English):
// A tiny one-time flag that says "this person JUST finished onboarding, so play
// the welcome fireworks the next time Home opens." Onboarding sets it at the
// finish line; Home reads it once and clears it, so the fireworks play exactly
// once and never again on later visits.
//
// It lives in memory (not storage) on purpose: the app stays running through
// the hop from the onboarding screen to Home, and we never want the party to
// replay after a real app restart.
// ============================================

// THIS SECTION DOES: hold the "show the party" flag for the current app run.
let pendingWelcome = false;

// THIS SECTION DOES: onboarding calls this at the very end so Home knows to party.
export function markWelcomeCelebration(): void {
  pendingWelcome = true;
}

// THIS SECTION DOES: Home calls this once on open; it returns true a single
// time, then resets so the fireworks never replay.
export function consumeWelcomeCelebration(): boolean {
  const was = pendingWelcome;
  pendingWelcome = false;
  return was;
}
