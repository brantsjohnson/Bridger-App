import type { ImageSourcePropType } from 'react-native';
import { Accent } from './person';
import { Cover } from './cover';

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  emoji: string;
  accent: Accent;
  /** short prompt label, e.g. "Golden hour" */
  prompt: string;
  postedAt: string;
  seen: boolean;
  segments: number;
}

export interface StoryPost {
  id: string;
  authorId: string;
  type: 'photo' | 'video';
  emoji: string;
  accent: Accent;
  /** text layered on AFTER capture */
  overlayText?: string;
  caption?: string;
  /** set when posted through a themed prompt */
  themeSlug?: string;
  createdAt: string;
  /**
   * Local media (a dropped-in photo or video) as a require()'d asset. When set,
   * the player shows this instead of the emoji placeholder. We keep the asset
   * itself (not a URI string) so it works on web and native alike.
   */
  media?: ImageSourcePropType;
}

export type ReactionKind = 'circleVideo' | 'text' | 'sticker';

export interface Reaction {
  id: string;
  postId: string;
  authorId: string;
  kind: ReactionKind;
  text?: string;
  /** an emoji from the standard strip, e.g. "🔥" */
  stickerId?: string;
  /** a sticker they made themselves — where the image lives */
  stickerUri?: string;
  /** the 10-second round video reply — where the clip lives */
  videoUri?: string;
  /** how long that clip runs, capped at 10 */
  videoSeconds?: number;
  parentReactionId?: string;
  at: string;
}

export type CatchUpKind = 'poll' | 'question' | 'event' | 'currently' | 'weekSummary';

export interface CatchUpItem {
  /** events carry the same cover art they wear everywhere else */
  cover?: Cover;
  /** how long until an event starts, so saying yes can start a live countdown */
  startsInMinutes?: number;
  id: string;
  kind: CatchUpKind;
  title: string;
  /** poll/question/event the viewer hasn't answered yet */
  actionable: boolean;
  answeredByViewer?: boolean;
  countdown?: string;
  options?: string[];
  detail?: string;
  emoji?: string;
  accent: Accent;
  day?: string;
}

export interface ThemedPrompt {
  slug: string;
  label: string;
  icon: string;
}

export interface WeekSummary {
  id: string;
  label: string;
  days: Array<{day: string;emoji?: string;}>;
}