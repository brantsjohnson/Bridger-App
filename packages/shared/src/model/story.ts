import { Accent } from './person';
import { Cover } from './cover';
import type { ScrapbookPage } from './scrapbook';
import type { Tier } from './tier';

// THIS SECTION DOES: describe a bundled image/video asset without pulling in
// react-native. `@bridger/shared` is compiled into the server too, so it must
// stay platform-neutral. This shape mirrors the parts of React Native's
// `ImageSourcePropType` we actually use: a require()'d asset (a number) or an
// object with a uri (and optional size). It stays two-way compatible with RN's
// type on the mobile side.
export interface AssetURISource {
  uri?: string;
  width?: number;
  height?: number;
  scale?: number;
}
export type AssetSource = number | AssetURISource | AssetURISource[];

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
  /**
   * Sum of the live pages' revisions. Changes when the author adds to a page
   * after posting, so the tile ring can light again for people who watched
   * an earlier version. Personal watched-state only, never a public count.
   */
  revision?: number;
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
  /** when tagged to an event, shows in that event's photo album */
  eventId?: string;
  createdAt: string;
  /**
   * Local media (a dropped-in photo or video) as a require()'d asset. When set,
   * the player shows this instead of the emoji placeholder. We keep the asset
   * itself (not a URI string) so it works on web and native alike.
   */
  media?: AssetSource;
  /**
   * The editable Scrapbook page behind this post (photos, caption, date stamp
   * with 0..1 positions). Missing on very old demo fixtures; the API always
   * fills it (legacy rows get a one-photo page built at read time).
   */
  page?: ScrapbookPage;
  /** Goes up each time the author changes the page after posting. */
  revision?: number;
  /** Who can see it; the author needs this back to edit the page. */
  visibleToTier?: Tier;
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
  /** the 10-second round video reply — where the clip lives (live / recorded) */
  videoUri?: string;
  /**
   * Bundled demo clip (a require()'d asset), same idea as StoryPost.media.
   * Demo seeds use this so the purple "missing clip" badge does not show.
   * Live replies use videoUri instead.
   */
  videoMedia?: AssetSource;
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