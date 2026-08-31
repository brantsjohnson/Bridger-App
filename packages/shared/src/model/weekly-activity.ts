// ============================================
// WHAT THIS FILE DOES (plain English):
// Shapes for the Home Side Quest (weekly activity) and the posts people add
// to it. Admin turns one on; everyone can post and heart. Cover art works
// the same way as events (photo fills the card). Some quests ask for a
// photo polaroid; others ask for a text blurb (like Notes App Discovery).
// ============================================

import type { Cover } from './cover';

/** How people contribute: a photo polaroid wall, or a text-note wall. */
export type ActivityPostMode = 'photo' | 'text';

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
  /** photo = polaroid capture; text = notes-style blurb input. */
  postMode?: ActivityPostMode;
}

/** One person's contribution to the weekly activity collage. */
export interface ActivityPost {
  id: string;
  activityId: string;
  authorId: string;
  mediaId?: string;
  heartsCount: number;
  createdAt: string;
  /** Display helpers (emoji + caption / blurb). */
  emoji?: string;
  caption?: string;
  personId?: string;
}
