// ============================================
// WHAT THIS FILE DOES (plain English):
// Global knobs the admin console edits: the default Home widget layout, which
// quiz is live, and the three themed capture prompts. One row in admin_config.
// ============================================

import type { AssistantAdminConfig } from './assistant';
import type { ThemedPrompt } from './story';
import {
  DEFAULT_STORAGE_CONFIG,
  type StorageConfig
} from './profile-theme';

export type { AssistantAdminConfig, AssistantAccess, AssistantToolName } from './assistant';
export { DEFAULT_ASSISTANT_ADMIN } from './assistant';
export type { StorageConfig };

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
  /** Opt-in Assistant access + tool kills (AGENT.md). */
  assistant?: AssistantAdminConfig;
  /** Co-op included storage + soft overage price (PROFILE-CUSTOMIZATION.md §7). */
  storage?: StorageConfig;
}

/** Parse admin_config.storage jsonb into a typed config (with defaults). */
export function parseStorageConfig(raw: unknown): StorageConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_STORAGE_CONFIG };
  }
  const row = raw as Record<string, unknown>;
  const includedGb =
    typeof row.included_gb === 'number' && row.included_gb > 0
      ? row.included_gb
      : typeof row.includedGb === 'number' && row.includedGb > 0
        ? row.includedGb
        : DEFAULT_STORAGE_CONFIG.includedGb;
  const overageCentsPerGb =
    typeof row.overage_cents_per_gb === 'number'
      ? row.overage_cents_per_gb
      : typeof row.overageCentsPerGb === 'number'
        ? row.overageCentsPerGb
        : DEFAULT_STORAGE_CONFIG.overageCentsPerGb;
  const codeTier = row.code_tier === 'on' || row.codeTier === 'on' ? 'on' : 'off';
  return { includedGb, overageCentsPerGb, codeTier };
}

/** Seeded / fallback Home layout when admin_config is empty. */
export const DEFAULT_HOME_LAYOUT: HomeWidgetDefault[] = [
  { key: 'event', size: 'half' },
  { key: 'alerts', size: 'half' },
  { key: 'comingup', size: 'full' },
  { key: 'ask', size: 'full' },
  { key: 'quiz', size: 'full' },
  { key: 'activity', size: 'full' },
  { key: 'coop', size: 'full' }
];
