// ============================================
// WHAT THIS FILE DOES (plain English):
// Global knobs the admin console edits: the default Home widget layout, which
// quiz is live, and the three themed capture prompts. One row in admin_config.
// ============================================

import type { ThemedPrompt } from './story';

/** Keys for the Home widgets people can rearrange. */
export type HomeWidgetKey =
  | 'event'
  | 'alerts'
  | 'ask'
  | 'comingup'
  | 'activity'
  | 'quiz'
  | 'coop';

export interface HomeWidgetDefault {
  key: HomeWidgetKey;
  size: 'half' | 'full';
}

export interface HomeDefaults {
  layout: HomeWidgetDefault[];
}

/** The single admin_config row, shaped for the wire. */
export interface AdminConfig {
  homeDefaults: HomeDefaults;
  liveQuizSlug: string | null;
  themedPrompts: ThemedPrompt[];
}

/** Seeded / fallback Home layout when admin_config is empty. */
export const DEFAULT_HOME_LAYOUT: HomeWidgetDefault[] = [
  { key: 'event', size: 'half' },
  { key: 'alerts', size: 'half' },
  { key: 'comingup', size: 'full' },
  { key: 'ask', size: 'full' },
  { key: 'activity', size: 'full' },
  { key: 'quiz', size: 'full' },
  { key: 'coop', size: 'full' }
];
