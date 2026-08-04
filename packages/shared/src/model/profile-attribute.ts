import { Tier } from './tier';

export type Layer = 'essential' | 'profile' | 'connection';

export interface ProfileAttribute<T = unknown> {
  id: string;
  ownerId: string;
  key: string;
  value: T;
  layer: Layer;
  /** TAG 1 — the lowest tier that may see it. */
  visibleToTier: Tier;
  /** TAG 2 — may the matchmaker read it? */
  matchable: boolean;
  updatedAt: string;
}