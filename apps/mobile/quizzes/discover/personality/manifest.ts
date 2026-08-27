// ============================================
// WHAT THIS FILE DOES (plain English):
// Name tag for the personality Discover quiz. People see "Your Vibe";
// code and matching use id `personality`. Big Five + assertiveness split.
// ============================================

import { PERSONALITY_DIMENSIONS } from './dimensions';
import {
  PERSONALITY_ADAPTATION_POLICY,
  PERSONALITY_MODERATOR_INSTRUCTIONS
} from './moderator';

export const MANIFEST = {
  id: 'personality' as const,
  slug: 'your-vibe',
  title: 'Your Vibe',
  blurb: 'How you move through people, plans, and energy.',
  emoji: '✨',
  accent: 'amber' as const,
  kind: 'quiz' as const,
  matchable: true,
  status: 'live' as const,
  version: 1,
  dimensions: PERSONALITY_DIMENSIONS.map((d) => ({
    key: d.key,
    label: d.label,
    matchMode: d.matchMode,
    matchable: d.matchable
  })),
  adaptationPolicy: PERSONALITY_ADAPTATION_POLICY,
  moderatorInstructions: PERSONALITY_MODERATOR_INSTRUCTIONS
};
