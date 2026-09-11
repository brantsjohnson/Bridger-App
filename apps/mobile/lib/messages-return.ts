// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers which screen you were on when you opened Messages from the header
// paper-plane. Messages is a hidden tab, so the normal back stack often has
// nowhere to go and used to dump you on Home every time. We stash the prior
// route here and use it when Back is pressed.
// ============================================

let returnHref: string | null = null;

/** Call right before navigating to Messages. */
export function setMessagesReturnTo(href: string | null | undefined): void {
  if (!href || href.includes('/messages')) {
    returnHref = null;
    return;
  }
  returnHref = href;
}

/** Read + clear the stashed return route (or null if none). */
export function takeMessagesReturnTo(): string | null {
  const next = returnHref;
  returnHref = null;
  return next;
}
