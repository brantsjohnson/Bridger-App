// ============================================
// WHAT THIS FILE DOES (plain English):
// Name tag for What Gets You Going. Internal id `values`. Load-bearing
// similarity quiz: Schwartz forced-choice → adventure/stability, giving/
// striving, hedonism dials. Loyalty/honesty add-on later.
// ============================================

import { VALUES_DIALS, VALUES_MATCH_MODE } from './dimensions';
import {
  VALUES_ADAPTATION_POLICY,
  VALUES_MODERATOR_INSTRUCTIONS
} from './moderator';

export const MANIFEST = {
  id: 'values' as const,
  slug: 'what-gets-you-going',
  title: 'What Gets You Going',
  blurb: 'What you care about when it actually counts.',
  emoji: '🧭',
  accent: 'purple' as const,
  kind: 'quiz' as const,
  matchable: true,
  status: 'live' as const,
  version: 1,
  matchMode: VALUES_MATCH_MODE,
  dials: VALUES_DIALS.map((d) => ({
    key: d.key,
    label: d.label,
    matchable: d.matchable,
    pending: 'pending' in d ? d.pending : false
  })),
  adaptationPolicy: VALUES_ADAPTATION_POLICY,
  moderatorInstructions: VALUES_MODERATOR_INSTRUCTIONS
};
