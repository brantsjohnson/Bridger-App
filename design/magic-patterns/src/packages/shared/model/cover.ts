/**
 * Cover art for any surface that would otherwise be a bare emoji.
 * A photo fills the frame; an emoji or saved cutout sticker tiles into a pattern.
 */
export type Cover =
{kind: 'photo';url: string;} |
{kind: 'emoji';value: string;} |
{kind: 'sticker';url: string;};

/** Saved cutout in your sticker tray. */
export interface Sticker {
  id: string;
  label: string;
  url: string;
}