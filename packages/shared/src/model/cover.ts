/**
 * Cover art for events and other surfaces.
 * Photo fills the frame (optional banner text on top). Emoji uses a vibrant bg.
 * Color / text / sticker kinds stay for older covers and the sticker tray.
 */
export type Cover =
  | {
      kind: 'photo';
      url: string;
      /** optional words drawn over the photo */
      bannerText?: string;
    }
  | { kind: 'emoji'; value: string; /** optional hex wash behind the emoji */ bg?: string }
  | { kind: 'text'; value: string; bg: string }
  | { kind: 'color'; bg: string }
  | { kind: 'sticker'; url: string };

/** Saved cutout in your sticker tray. */
export interface Sticker {
  id: string;
  label: string;
  url: string;
}
