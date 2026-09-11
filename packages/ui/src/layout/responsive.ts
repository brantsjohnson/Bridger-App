// ============================================
// WHAT THIS FILE DOES (plain English):
// This is Bridger's one place for "how wide is the screen right now, and what
// shape should the app take because of it?". Bridger is a phone-first app, but
// it also runs on the web (a computer browser) and needs to be ready for big
// folding phones like Apple's iPhone Duo, which open up into a tablet-sized
// screen.
//
// The problem this solves: on a wide screen (a laptop, or a foldable held
// open) our phone-sized layout used to stretch edge to edge, so cards and text
// looked awkwardly wide. This file gives every screen a single, shared answer:
// "you are on a big screen, so sit in a comfortable centered column instead of
// stretching."
//
// Two things live here:
//  1. LAYOUT — the plain numbers (where a "phone" ends and a "big screen"
//     begins, and how wide the comfortable reading column is).
//  2. useResponsiveLayout() — a tiny hook any component can call to get the
//     live width and a ready-made answer about what to do with it.
//
// The two shared pieces that actually USE this are Screen.tsx (the page
// scaffold) and FloatingTabBar.tsx (the bottom nav pill), so every screen and
// the navigation stay lined up in the same centered column automatically.
// (Foldable multi-column layouts and side-mounted controls are planned in
// guide-docs/design-briefs/FOLDABLE-DUO-ADAPTIVE-DESIGN-BRIEF.md and will build
// on top of the `breakpoint` value this hook returns.)
// ============================================
import { useWindowDimensions } from 'react-native';

// --- THE NUMBERS: the width thresholds and the comfortable column width ---
// These are the load-bearing sizes. Change them here and every screen + the
// nav pill move together.
export const LAYOUT = {
  // A screen narrower than this is treated as a normal phone: the app fills the
  // whole width, exactly like before. 600 points is the classic phone/tablet
  // dividing line (a folded phone or any handset stays under it; an unfolded
  // iPhone Duo interior, an iPad, or a browser window goes over it).
  PHONE_MAX: 600,

  // A screen this wide or wider (an unfolded foldable, a small tablet) is where
  // we will later grow into two-column / master-detail layouts. For now it just
  // means "definitely a big screen, use the centered column".
  EXPANDED_MIN: 600,

  // A large tablet or a desktop browser window.
  LARGE_MIN: 900,

  // How wide the single, phone-shaped column is allowed to get before we stop
  // stretching it and just center it with empty space on both sides. This is
  // the "comfortable middle" — wide enough to feel roomy, narrow enough that
  // our phone-tuned cards still look right. Tweak this one number to make the
  // web app column wider or narrower.
  CONTENT_MAX_WIDTH: 480
} as const;

// --- THE SHAPE NAME: a friendly label for the current width bucket ---
// Screens can branch on this later (e.g. show a sidebar only on 'expanded' or
// 'large') without re-deriving the math themselves.
export type LayoutBreakpoint = 'phone' | 'expanded' | 'large';

export type ResponsiveLayout = {
  /** Live window width in points (updates on rotate / fold / window resize). */
  width: number;
  /** Live window height in points. */
  height: number;
  /** Which width bucket we are in right now. */
  breakpoint: LayoutBreakpoint;
  /**
   * True when the screen is wider than a phone (a foldable held open, a tablet,
   * or a browser). This is the flag most components care about: "am I on a big
   * screen, so should I stop stretching and sit in the centered column?".
   */
  isLarge: boolean;
  /**
   * How wide the content column should be. On a phone this is `undefined`,
   * which means "no cap, fill the width exactly like before" (so nothing about
   * the phone experience changes). On a big screen it is the comfortable middle
   * width from LAYOUT.CONTENT_MAX_WIDTH.
   */
  contentMaxWidth: number | undefined;
  /**
   * Whether the device is currently taller than it is wide (portrait). Handy
   * later for posture-aware foldable layouts.
   */
  isPortrait: boolean;
};

// --- THE HOOK: ask "what should this screen do at the current width?" ---
// Any component can call this. It re-runs whenever the window changes size
// (rotating a phone, unfolding a Duo, or dragging a browser window), so the
// layout always matches the real screen.
export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  // Pick the width bucket. Anything under PHONE_MAX behaves exactly like the
  // old phone layout; the two larger buckets unlock the centered column now and
  // richer foldable/tablet layouts later.
  const breakpoint: LayoutBreakpoint =
    width >= LAYOUT.LARGE_MIN
      ? 'large'
      : width >= LAYOUT.EXPANDED_MIN
        ? 'expanded'
        : 'phone';

  const isLarge = breakpoint !== 'phone';

  return {
    width,
    height,
    breakpoint,
    isLarge,
    // Only cap the width once we are past a phone. On a phone we return
    // undefined so callers leave their layout untouched.
    contentMaxWidth: isLarge ? LAYOUT.CONTENT_MAX_WIDTH : undefined,
    isPortrait: height >= width
  };
}
