// ============================================
// WHAT THIS FILE DOES (plain English):
// Name tag for The Friend Zone. Internal id `attachment`. Measures anxiety +
// avoidance (friendship), derives a gentle style, matches via a style matrix.
// ============================================

import { ATTACHMENT_DIMENSIONS } from './dimensions';
import {
  ATTACHMENT_ADAPTATION_POLICY,
  ATTACHMENT_MODERATOR_INSTRUCTIONS
} from './moderator';

export const MANIFEST = {
  id: 'attachment' as const,
  slug: 'the-friend-zone',
  title: 'The Friend Zone',
  blurb: 'How you show up when friendship gets real.',
  emoji: '🤝',
  accent: 'blue' as const,
  kind: 'quiz' as const,
  matchable: true,
  status: 'live' as const,
  version: 1,
  dimensions: ATTACHMENT_DIMENSIONS.map((d) => ({
    key: d.key,
    label: d.label,
    matchable: d.matchable
  })),
  matchMode: 'matrix' as const,
  adaptationPolicy: ATTACHMENT_ADAPTATION_POLICY,
  moderatorInstructions: ATTACHMENT_MODERATOR_INSTRUCTIONS
};
