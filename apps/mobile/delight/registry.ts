// ============================================
// WHAT THIS FILE DOES (plain English):
// The list of standalone delight plugins the host can mount. Effects (reusable
// rains, etc.) are NOT listed here — screens import those from effects/.
// ============================================
import type { ComponentType } from 'react';
import { MANIFEST as emojiBombManifest } from './plugins/emoji-bomb/manifest';

export type DelightPluginProps = {
  /** Attribution line, e.g. "emoji-bombed by Jade". */
  attribution?: string;
  /** Called when the delight finishes (or is skipped for reduced motion). */
  onDone: () => void;
  /** overlay = full-screen play; persistent = stays mounted (opt-in pets later). */
  mode: 'overlay' | 'persistent';
};

export type DelightMountMode = 'overlay_once' | 'persistent';

export type DelightRegistryItem = {
  slug: string;
  scope: 'global' | 'opt-in' | 'gift';
  mountMode: DelightMountMode;
  attributionTemplate?: string;
  load: () => Promise<{ default: ComponentType<DelightPluginProps> }>;
};

export const DELIGHT_REGISTRY: DelightRegistryItem[] = [
  {
    slug: emojiBombManifest.slug,
    scope: emojiBombManifest.scope,
    mountMode: emojiBombManifest.mountMode,
    attributionTemplate: emojiBombManifest.attributionTemplate,
    load: () => import('./plugins/emoji-bomb/Delight')
  }
];

export function findDelightPlugin(slug: string): DelightRegistryItem | undefined {
  return DELIGHT_REGISTRY.find((d) => d.slug === slug);
}
