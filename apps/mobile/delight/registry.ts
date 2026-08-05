// ============================================
// WHAT THIS FILE DOES (plain English):
// The list of delight (easter-egg) plugins the app can mount. DelightHost
// looks up a slug here and lazy-loads the animation component.
// ============================================
import type { ComponentType } from 'react';

export type DelightPluginProps = {
  /** Attribution line, e.g. "emoji-bombed by Jade". */
  attribution?: string;
  /** Called when the delight finishes (or is skipped for reduced motion). */
  onDone: () => void;
};

export type DelightRegistryItem = {
  slug: string;
  load: () => Promise<{ default: ComponentType<DelightPluginProps> }>;
};

export const DELIGHT_REGISTRY: DelightRegistryItem[] = [
  {
    slug: 'emoji-bomb',
    load: () => import('./emoji-bomb/Delight')
  }
];

export function findDelightPlugin(slug: string): DelightRegistryItem | undefined {
  return DELIGHT_REGISTRY.find((d) => d.slug === slug);
}
