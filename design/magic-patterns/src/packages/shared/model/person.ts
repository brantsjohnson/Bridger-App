import { Tier } from './tier';

export type Accent =
'purple' |
'coral' |
'teal' |
'amber' |
'pink' |
'blue' |
'green';

export interface Person {
  id: string;
  name: string;
  handle: string;
  emoji: string;
  accent: Accent;
  tier: Tier;
  /** short, real label — not a bio paragraph */
  label: string;
  /** how many friends you share */
  mutuals: number;
  /** a ring on the avatar means they posted; no presence dots anywhere */
  story?: 'unseen' | 'seen';
}