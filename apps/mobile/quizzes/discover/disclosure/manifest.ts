// ============================================
// WHAT THIS FILE DOES (plain English):
// Name tag for the Discover pre-quiz. Soft title on purpose: "Behind the
// Scenes." Internal id stays `disclosure` for code and analytics. Optional;
// first-time offer when someone starts a Discover quiz, and always in Connect
// Over / Settings. AI adaptation is off (see moderator.ts).
// ============================================

import {
  DISCLOSURE_ADAPTATION_POLICY,
  DISCLOSURE_MODERATOR_INSTRUCTIONS
} from './moderator';
import { DISCLOSURE_VERSION } from './content';

export const MANIFEST = {
  /** Stable id for matching / analytics (never rename casually). */
  id: 'disclosure' as const,
  slug: 'behind-the-scenes',
  /** User-facing Bridger module title. Gentlest name in the set. */
  title: 'Behind the Scenes',
  blurb: 'A quiet, optional check-in. Private, and only once if you skip.',
  emoji: '🎬',
  accent: 'teal' as const,
  kind: 'quiz' as const,
  /**
   * Intake that can gently inform matching when they opt in (Screen 4).
   * Never shown as reveal evidence.
   */
  matchable: true,
  status: 'live' as const,
  version: DISCLOSURE_VERSION,
  adaptationPolicy: DISCLOSURE_ADAPTATION_POLICY,
  moderatorInstructions: DISCLOSURE_MODERATOR_INSTRUCTIONS
};
