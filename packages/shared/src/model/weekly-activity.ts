// ============================================
// WHAT THIS FILE DOES (plain English):
// Shapes for the weekly Home activity (e.g. "Band Tee Week") and the posts
// people add to it. Admin turns one on; everyone can post and heart. Cover
// art works the same way as events (photo fills the card).
// ============================================

import type { Cover } from './cover';

/** The themed weekly challenge shown on Home while active. */
export interface WeeklyActivity {
  id: string;
  title: string;
  /** Little description under the title (what people should post). */
  prompt: string;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  /** Short label like "ends Sunday" for the "This week · …" line. */
  closesIn?: string;
  /** Big emoji accent on the card when there is no photo cover. */
  emoji?: string;
  /** Same cover art model as events: photo fills the frame. */
  cover?: Cover;
  accent?: string;
}

/** One person's contribution to the weekly activity collage. */
export interface ActivityPost {
  id: string;
  activityId: string;
  authorId: string;
  mediaId?: string;
  heartsCount: number;
  createdAt: string;
  /** Demo / display helpers (emoji + caption). */
  emoji?: string;
  caption?: string;
  personId?: string;
}
