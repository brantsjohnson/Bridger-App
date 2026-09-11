// ============================================
// WHAT THIS FILE DOES (plain English):
// The layout templates for Scrapbook pages. A template says where each photo
// goes, where the caption sits, and where the little date stamp lives, all as
// fractions of the page. There are five "families" (simple, caption, editorial,
// scrapbook, freeform) for each photo count (1 to 4). When someone adds a
// photo, we stay in the same family so their intent survives.
//
// This is plain data + pure functions. Rendering happens in packages/ui
// (ScrapbookPage). No AI here: Phase 1 is deterministic on purpose.
// ============================================
import {
  SCRAPBOOK_ASPECT_RATIO,
  SCRAPBOOK_DEFAULT_BACKGROUND,
  type LayoutFamily,
  type MediaSource,
  type NormalizedRect,
  type ScrapbookElement,
  type ScrapbookPage
} from '../model/scrapbook';

// THIS SECTION DOES: one photo/video slot in a template.
export interface LayoutSlot extends NormalizedRect {
  rotation?: number;
  frame?: 'none' | 'polaroid' | 'thin';
}

// THIS SECTION DOES: one template.
export interface LayoutTemplate {
  id: string;
  family: LayoutFamily;
  mediaCount: 1 | 2 | 3 | 4;
  /** Screen-reader name, also shown on long-press. Never on the main path. */
  label: string;
  slots: LayoutSlot[];
  /** Where the caption text goes. */
  caption: NormalizedRect & { align?: 'left' | 'center' | 'right'; size?: 'sm' | 'md' | 'lg' };
  /** Simple pages hide the empty caption slot; the others show the placeholder. */
  captionVisibleWhenEmpty: boolean;
  /** Where the small date stamp goes. */
  date: NormalizedRect & { onPhoto?: boolean };
}

/** Bottom-left date stamp used by most templates. */
const DATE_BL: LayoutTemplate['date'] = { x: 0.06, y: 0.935, width: 0.4, height: 0.035 };
/** Top-left stamp drawn over a full-bleed photo (white text). */
const DATE_TL_ON_PHOTO: LayoutTemplate['date'] = {
  x: 0.05,
  y: 0.04,
  width: 0.4,
  height: 0.035,
  onPhoto: true
};

// THIS SECTION DOES: the template list. Order inside each count = family order,
// which is also the order of the layout carousel.
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  // ---- 1 photo ----
  {
    id: '1a',
    family: 'simple',
    mediaCount: 1,
    label: 'Full page photo',
    slots: [{ x: 0, y: 0, width: 1, height: 1 }],
    caption: { x: 0.06, y: 0.86, width: 0.88, height: 0.1, size: 'md' },
    captionVisibleWhenEmpty: false,
    date: DATE_TL_ON_PHOTO
  },
  {
    id: '1b',
    family: 'caption',
    mediaCount: 1,
    label: 'Photo with caption',
    slots: [{ x: 0.06, y: 0.06, width: 0.88, height: 0.64 }],
    caption: { x: 0.08, y: 0.74, width: 0.84, height: 0.17, size: 'md' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  },
  {
    id: '1c',
    family: 'editorial',
    mediaCount: 1,
    label: 'Editorial, photo and open space',
    slots: [{ x: 0.06, y: 0.1, width: 0.62, height: 0.48 }],
    caption: { x: 0.06, y: 0.64, width: 0.88, height: 0.24, size: 'lg' },
    captionVisibleWhenEmpty: true,
    date: { x: 0.72, y: 0.1, width: 0.22, height: 0.035 }
  },
  {
    id: '1d',
    family: 'scrapbook',
    mediaCount: 1,
    label: 'Polaroid',
    slots: [{ x: 0.13, y: 0.14, width: 0.74, height: 0.56, rotation: -3, frame: 'polaroid' }],
    caption: { x: 0.16, y: 0.76, width: 0.68, height: 0.12, align: 'center', size: 'md' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  },
  {
    id: '1e',
    family: 'freeform',
    mediaCount: 1,
    label: 'Free page',
    slots: [{ x: 0.1, y: 0.12, width: 0.8, height: 0.54, frame: 'thin' }],
    caption: { x: 0.12, y: 0.72, width: 0.76, height: 0.14, size: 'md' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  },

  // ---- 2 photos ----
  {
    id: '2a',
    family: 'simple',
    mediaCount: 2,
    label: 'Two stacked photos',
    slots: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 }
    ],
    caption: { x: 0.06, y: 0.88, width: 0.88, height: 0.08, size: 'sm' },
    captionVisibleWhenEmpty: false,
    date: DATE_TL_ON_PHOTO
  },
  {
    id: '2b',
    family: 'caption',
    mediaCount: 2,
    label: 'Big photo, small photo, caption',
    slots: [
      { x: 0.06, y: 0.06, width: 0.88, height: 0.48 },
      { x: 0.06, y: 0.58, width: 0.4, height: 0.28 }
    ],
    caption: { x: 0.5, y: 0.58, width: 0.44, height: 0.28, size: 'md' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  },
  {
    id: '2c',
    family: 'editorial',
    mediaCount: 2,
    label: 'Editorial, two offset photos',
    slots: [
      { x: 0.06, y: 0.06, width: 0.56, height: 0.38 },
      { x: 0.38, y: 0.42, width: 0.56, height: 0.34 }
    ],
    caption: { x: 0.06, y: 0.8, width: 0.88, height: 0.12, size: 'md' },
    captionVisibleWhenEmpty: true,
    date: { x: 0.68, y: 0.06, width: 0.26, height: 0.035 }
  },
  {
    id: '2d',
    family: 'scrapbook',
    mediaCount: 2,
    label: 'Two Polaroids',
    slots: [
      { x: 0.06, y: 0.07, width: 0.54, height: 0.4, rotation: -4, frame: 'polaroid' },
      { x: 0.4, y: 0.45, width: 0.54, height: 0.4, rotation: 3, frame: 'polaroid' }
    ],
    caption: { x: 0.08, y: 0.88, width: 0.84, height: 0.08, size: 'sm' },
    captionVisibleWhenEmpty: true,
    date: { x: 0.06, y: 0.5, width: 0.3, height: 0.035 }
  },
  {
    id: '2e',
    family: 'freeform',
    mediaCount: 2,
    label: 'Free page, two photos',
    slots: [
      { x: 0.08, y: 0.1, width: 0.6, height: 0.4, frame: 'thin' },
      { x: 0.34, y: 0.5, width: 0.58, height: 0.34, frame: 'thin' }
    ],
    caption: { x: 0.08, y: 0.88, width: 0.84, height: 0.08, size: 'sm' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  },

  // ---- 3 photos ----
  {
    id: '3a',
    family: 'simple',
    mediaCount: 3,
    label: 'One big photo over two',
    slots: [
      { x: 0, y: 0, width: 1, height: 0.56 },
      { x: 0, y: 0.56, width: 0.5, height: 0.44 },
      { x: 0.5, y: 0.56, width: 0.5, height: 0.44 }
    ],
    caption: { x: 0.06, y: 0.9, width: 0.88, height: 0.07, size: 'sm' },
    captionVisibleWhenEmpty: false,
    date: DATE_TL_ON_PHOTO
  },
  {
    id: '3b',
    family: 'caption',
    mediaCount: 3,
    label: 'Three photos with caption',
    slots: [
      { x: 0.06, y: 0.06, width: 0.88, height: 0.44 },
      { x: 0.06, y: 0.53, width: 0.42, height: 0.26 },
      { x: 0.52, y: 0.53, width: 0.42, height: 0.26 }
    ],
    caption: { x: 0.06, y: 0.82, width: 0.88, height: 0.1, size: 'md' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  },
  {
    id: '3c',
    family: 'editorial',
    mediaCount: 3,
    label: 'Editorial column with notes',
    slots: [
      { x: 0.06, y: 0.06, width: 0.56, height: 0.27 },
      { x: 0.06, y: 0.365, width: 0.56, height: 0.27 },
      { x: 0.06, y: 0.67, width: 0.56, height: 0.27 }
    ],
    caption: { x: 0.66, y: 0.06, width: 0.28, height: 0.7, size: 'sm' },
    captionVisibleWhenEmpty: true,
    date: { x: 0.66, y: 0.9, width: 0.28, height: 0.035 }
  },
  {
    id: '3d',
    family: 'scrapbook',
    mediaCount: 3,
    label: 'Scattered Polaroids',
    slots: [
      { x: 0.05, y: 0.05, width: 0.5, height: 0.36, rotation: -5, frame: 'polaroid' },
      { x: 0.46, y: 0.28, width: 0.49, height: 0.35, rotation: 4, frame: 'polaroid' },
      { x: 0.1, y: 0.56, width: 0.5, height: 0.36, rotation: -2, frame: 'polaroid' }
    ],
    caption: { x: 0.62, y: 0.7, width: 0.33, height: 0.18, size: 'sm' },
    captionVisibleWhenEmpty: true,
    date: { x: 0.62, y: 0.92, width: 0.33, height: 0.035 }
  },
  {
    id: '3e',
    family: 'freeform',
    mediaCount: 3,
    label: 'Free page, three photos',
    slots: [
      { x: 0.06, y: 0.08, width: 0.52, height: 0.34, frame: 'thin' },
      { x: 0.44, y: 0.3, width: 0.5, height: 0.32, frame: 'thin' },
      { x: 0.1, y: 0.58, width: 0.5, height: 0.32, frame: 'thin' }
    ],
    caption: { x: 0.62, y: 0.72, width: 0.32, height: 0.16, size: 'sm' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  },

  // ---- 4 photos ----
  {
    id: '4a',
    family: 'simple',
    mediaCount: 4,
    label: 'Four photo grid',
    slots: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
    ],
    caption: { x: 0.06, y: 0.9, width: 0.88, height: 0.07, size: 'sm' },
    captionVisibleWhenEmpty: false,
    date: DATE_TL_ON_PHOTO
  },
  {
    id: '4b',
    family: 'caption',
    mediaCount: 4,
    label: 'Four photos with caption',
    slots: [
      { x: 0.05, y: 0.05, width: 0.44, height: 0.34 },
      { x: 0.51, y: 0.05, width: 0.44, height: 0.34 },
      { x: 0.05, y: 0.41, width: 0.44, height: 0.34 },
      { x: 0.51, y: 0.41, width: 0.44, height: 0.34 }
    ],
    caption: { x: 0.05, y: 0.79, width: 0.9, height: 0.13, size: 'md' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  },
  {
    id: '4c',
    family: 'editorial',
    mediaCount: 4,
    label: 'Editorial, one big and three small',
    slots: [
      { x: 0.06, y: 0.06, width: 0.88, height: 0.4 },
      { x: 0.06, y: 0.49, width: 0.27, height: 0.19 },
      { x: 0.365, y: 0.49, width: 0.27, height: 0.19 },
      { x: 0.67, y: 0.49, width: 0.27, height: 0.19 }
    ],
    caption: { x: 0.06, y: 0.72, width: 0.88, height: 0.18, size: 'md' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  },
  {
    id: '4d',
    family: 'scrapbook',
    mediaCount: 4,
    label: 'Four scattered Polaroids',
    slots: [
      { x: 0.04, y: 0.04, width: 0.48, height: 0.32, rotation: -5, frame: 'polaroid' },
      { x: 0.48, y: 0.1, width: 0.48, height: 0.32, rotation: 4, frame: 'polaroid' },
      { x: 0.06, y: 0.42, width: 0.48, height: 0.32, rotation: 3, frame: 'polaroid' },
      { x: 0.46, y: 0.5, width: 0.48, height: 0.32, rotation: -3, frame: 'polaroid' }
    ],
    caption: { x: 0.08, y: 0.86, width: 0.84, height: 0.08, size: 'sm', align: 'center' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  },
  {
    id: '4e',
    family: 'freeform',
    mediaCount: 4,
    label: 'Free page, four photos',
    slots: [
      { x: 0.06, y: 0.06, width: 0.46, height: 0.3, frame: 'thin' },
      { x: 0.5, y: 0.12, width: 0.44, height: 0.3, frame: 'thin' },
      { x: 0.08, y: 0.42, width: 0.46, height: 0.3, frame: 'thin' },
      { x: 0.48, y: 0.5, width: 0.46, height: 0.3, frame: 'thin' }
    ],
    caption: { x: 0.08, y: 0.86, width: 0.84, height: 0.08, size: 'sm' },
    captionVisibleWhenEmpty: true,
    date: DATE_BL
  }
];

// THIS SECTION DOES: look-ups.

/** Templates for this many photos, in carousel order. */
export function layoutsFor(mediaCount: number): LayoutTemplate[] {
  const n = Math.min(4, Math.max(1, Math.round(mediaCount)));
  return LAYOUT_TEMPLATES.filter((t) => t.mediaCount === n);
}

export function findLayout(id: string | undefined): LayoutTemplate | undefined {
  if (!id) return undefined;
  return LAYOUT_TEMPLATES.find((t) => t.id === id);
}

/** The template in `family` for this many photos (falls back to caption family). */
export function layoutForFamily(mediaCount: number, family: LayoutFamily | undefined): LayoutTemplate {
  const list = layoutsFor(mediaCount);
  return list.find((t) => t.family === family) ?? list.find((t) => t.family === 'caption') ?? list[0]!;
}

// THIS SECTION DOES: ids without any platform dependency (no uuid on RN by default).
export function newElementId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** "Sep 8" style date stamp text. */
export function formatScrapbookDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// THIS SECTION DOES: a fresh, empty page ready for the composer.
export function emptyPage(): ScrapbookPage {
  return {
    id: newElementId(),
    aspectRatio: SCRAPBOOK_ASPECT_RATIO,
    background: { kind: 'solid', color: SCRAPBOOK_DEFAULT_BACKGROUND },
    elements: [],
    revision: 1
  };
}

/** A photo or video waiting to be placed (what capture / camera roll hand us). */
export interface PendingMedia {
  id?: string;
  kind: 'photo' | 'video';
  uri?: string;
  mediaId?: string;
  source: MediaSource;
  durationMs?: number;
}

// THIS SECTION DOES: the heart of re-layout. Given a page and a template, put
// every photo into its slot, keep the caption text, keep the date stamp, and
// leave anything the person moved by hand exactly where it is.
export function applyLayout(
  page: ScrapbookPage,
  template: LayoutTemplate,
  media?: PendingMedia[]
): ScrapbookPage {
  const existingMedia = page.elements
    .filter((e) => e.type === 'photo' || e.type === 'video')
    .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99) || a.zIndex - b.zIndex);
  const existingCaption = page.elements.find((e) => e.type === 'text' && e.data.role === 'caption');
  const existingDate = page.elements.find((e) => e.type === 'date');
  const others = page.elements.filter(
    (e) =>
      e.type !== 'photo' &&
      e.type !== 'video' &&
      e.type !== 'date' &&
      !(e.type === 'text' && e.data.role === 'caption')
  );

  // Photos: existing ones first (by slot order), then any new media handed in.
  const pool: Array<ScrapbookElement | PendingMedia> = [...existingMedia, ...(media ?? [])];
  const mediaElements: ScrapbookElement[] = [];
  template.slots.forEach((slot, i) => {
    const item = pool[i];
    if (!item) return;
    const isElement = 'zIndex' in item;
    if (isElement && item.userModified) {
      // Hand-placed: leave it alone, only update its slot bookkeeping.
      mediaElements.push({ ...item, slot: i });
      return;
    }
    const base: ScrapbookElement = isElement
      ? item
      : {
          id: item.id ?? newElementId(),
          type: item.kind,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          rotation: 0,
          zIndex: 0,
          source: item.source,
          mediaId: item.mediaId,
          uri: item.uri,
          data: item.durationMs ? { durationMs: item.durationMs } : {}
        };
    mediaElements.push({
      ...base,
      x: slot.x,
      y: slot.y,
      width: slot.width,
      height: slot.height,
      rotation: slot.rotation ?? 0,
      zIndex: 10 + i,
      slot: i,
      data: { ...base.data, frame: slot.frame ?? 'none' }
    });
  });

  // Caption: one text element flagged role=caption. Text survives re-layout.
  const caption: ScrapbookElement = existingCaption?.userModified
    ? existingCaption
    : {
        id: existingCaption?.id ?? newElementId(),
        type: 'text',
        x: template.caption.x,
        y: template.caption.y,
        width: template.caption.width,
        height: template.caption.height,
        rotation: 0,
        zIndex: 50,
        data: {
          ...existingCaption?.data,
          role: 'caption',
          text: existingCaption?.data.text ?? '',
          placeholder: 'Add something…',
          align: template.caption.align ?? 'left',
          size: template.caption.size ?? 'md',
          font: existingCaption?.data.font ?? 'sans',
          visibleWhenEmpty: template.captionVisibleWhenEmpty,
          onPhoto: template.family === 'simple'
        }
      };

  // Date stamp: small, auto-filled, movable later.
  const date: ScrapbookElement = existingDate?.userModified
    ? existingDate
    : {
        id: existingDate?.id ?? newElementId(),
        type: 'date',
        x: template.date.x,
        y: template.date.y,
        width: template.date.width,
        height: template.date.height,
        rotation: 0,
        zIndex: 60,
        data: {
          ...existingDate?.data,
          text: existingDate?.data.text ?? formatScrapbookDate(),
          onPhoto: !!template.date.onPhoto,
          size: 'sm'
        }
      };

  return {
    ...page,
    layoutId: template.id,
    layoutFamily: template.family,
    elements: [...mediaElements, caption, date, ...others]
  };
}

/** Re-lay a page after its photo count changed, staying in the same family. */
export function relayoutForCount(page: ScrapbookPage, mediaCount: number, extra?: PendingMedia[]): ScrapbookPage {
  const template = layoutForFamily(mediaCount, page.layoutFamily);
  return applyLayout(page, template, extra);
}

// THIS SECTION DOES: backward compatibility. An old-style post (one photo, no
// page) becomes a one-element full-bleed page at read time. No data migration.
export function legacyStoryToScrapbookPage(input: {
  storyId: string;
  type: 'photo' | 'video';
  mediaUri?: string | null;
  mediaId?: string | null;
}): ScrapbookPage {
  const template = LAYOUT_TEMPLATES.find((t) => t.id === '1a')!;
  const slot = template.slots[0]!;
  return {
    id: `legacy-${input.storyId}`,
    storyId: input.storyId,
    aspectRatio: SCRAPBOOK_ASPECT_RATIO,
    background: { kind: 'solid', color: '#000000' },
    layoutId: template.id,
    layoutFamily: template.family,
    revision: 1,
    elements: [
      {
        id: `legacy-${input.storyId}-media`,
        type: input.type,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        rotation: 0,
        zIndex: 10,
        slot: 0,
        source: 'bridger_camera',
        mediaId: input.mediaId ?? undefined,
        uri: input.mediaUri ?? undefined,
        data: { frame: 'none' }
      }
    ]
  };
}
