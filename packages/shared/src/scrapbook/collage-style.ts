// ============================================
// WHAT THIS FILE DOES (plain English):
// The looks a Collage page can wear: paper colors, "packs" (a paper plus
// photo frames and a colour filter), and the named font chips in the text
// composer. This is plain data so the phone and the server share the same
// ids. Drawing happens in the UI, not here.
// ============================================
import type {
  CollageFilter,
  CollageFrame,
  ScrapbookElement,
  ScrapbookPage
} from '../model/scrapbook';

/** One paper color you can pick for the page. */
export type CollagePaperId =
  | 'eggshell'
  | 'kraft'
  | 'white'
  | 'newsprint'
  | 'sage'
  | 'sky'
  | 'lavender'
  | 'butter'
  | 'peach'
  | 'pink'
  | 'blue'
  | 'ink'
  | 'black'
  | 'pinboard';

export type CollagePaper = {
  id: CollagePaperId;
  /** Hex color of the sheet. */
  color: string;
  /** Spoken name (also used as the accessibility label). */
  label: string;
};

/** The 14 papers from the collage handoff. */
export const COLLAGE_PAPERS: ReadonlyArray<CollagePaper> = [
  { id: 'eggshell', color: '#F4F1E7', label: 'Eggshell' },
  { id: 'kraft', color: '#C9A97A', label: 'Kraft' },
  { id: 'white', color: '#FCFBF7', label: 'White' },
  { id: 'newsprint', color: '#E8E3D3', label: 'Newsprint' },
  { id: 'sage', color: '#B7BEB2', label: 'Sage' },
  { id: 'sky', color: '#B9CFE0', label: 'Sky' },
  { id: 'lavender', color: '#D7CDEB', label: 'Lavender' },
  { id: 'butter', color: '#F1E39B', label: 'Butter' },
  { id: 'peach', color: '#F4C7AE', label: 'Peach' },
  { id: 'pink', color: '#FF3E8A', label: 'Pink' },
  { id: 'blue', color: '#1D6FE8', label: 'Blue' },
  { id: 'ink', color: '#2B2825', label: 'Ink' },
  { id: 'black', color: '#141310', label: 'Black' },
  { id: 'pinboard', color: '#8B6B4A', label: 'Pinboard' }
];

export function paperById(id: string | undefined): CollagePaper {
  return COLLAGE_PAPERS.find((p) => p.id === id) ?? COLLAGE_PAPERS[0]!;
}

export function paperIdFromColor(color: string | undefined): CollagePaperId {
  const hit = COLLAGE_PAPERS.find(
    (p) => p.color.toLowerCase() === (color ?? '').toLowerCase()
  );
  return hit?.id ?? 'eggshell';
}

/** A pack recodes the paper and restyles every photo on the page. */
export type CollagePackId =
  | 'polaroid_wall'
  | 'zine_xerox'
  | 'taped_in'
  | 'film_35mm'
  | 'torn'
  | 'riso';

export type CollagePack = {
  id: CollagePackId;
  title: string;
  subtitle: string;
  paperId: CollagePaperId;
  frame: CollageFrame;
  filter: CollageFilter;
  /** Extra degrees per photo slot (0, 1, 2…). */
  rotations: number[];
};

export const COLLAGE_PACKS: ReadonlyArray<CollagePack> = [
  {
    id: 'polaroid_wall',
    title: 'Polaroid Wall',
    subtitle: 'Sage paper, instant prints',
    paperId: 'sage',
    frame: 'polaroid',
    filter: 'none',
    rotations: [-3, 2, -2, 3]
  },
  {
    id: 'zine_xerox',
    title: 'Zine Xerox',
    subtitle: 'Newsprint, high contrast',
    paperId: 'newsprint',
    frame: 'thin',
    filter: 'mono',
    rotations: [0, 0, 0, 0]
  },
  {
    id: 'taped_in',
    title: 'Taped In',
    subtitle: 'Kraft, tape mounts, warm',
    paperId: 'kraft',
    frame: 'tape',
    filter: 'retro',
    rotations: [-4, 3, -2, 4]
  },
  {
    id: 'film_35mm',
    title: '35mm',
    subtitle: 'Black paper, film frames',
    paperId: 'black',
    frame: 'film',
    filter: 'dramatic',
    rotations: [0, -1, 1, 0]
  },
  {
    id: 'torn',
    title: 'Torn',
    subtitle: 'Eggshell, torn edges',
    paperId: 'eggshell',
    frame: 'torn',
    filter: 'none',
    rotations: [-2, 3, -3, 2]
  },
  {
    id: 'riso',
    title: 'Riso',
    subtitle: 'Pink paper, ink look',
    paperId: 'pink',
    frame: 'thin',
    filter: 'mono',
    rotations: [2, -2, 3, -1]
  }
];

export function packById(id: string | undefined): CollagePack | undefined {
  return COLLAGE_PACKS.find((p) => p.id === id);
}

/**
 * Recolor the paper and restyle every photo / cutout with the pack's frame
 * and filter. Hand-placed positions stay put.
 */
export function applyPackToPage(page: ScrapbookPage, pack: CollagePack): ScrapbookPage {
  const paper = paperById(pack.paperId);
  let mediaIndex = 0;
  return {
    ...page,
    background: { kind: 'solid', color: paper.color },
    elements: page.elements.map((el) => {
      if (el.type !== 'photo' && el.type !== 'video' && el.type !== 'cutout') {
        return el;
      }
      const rot = pack.rotations[mediaIndex % pack.rotations.length] ?? 0;
      mediaIndex += 1;
      return {
        ...el,
        rotation: el.userModified ? el.rotation : rot,
        data: { ...el.data, frame: pack.frame, filter: pack.filter }
      };
    })
  };
}

// THIS SECTION DOES: turn a font key into a real, loaded typeface name.
// Both the little "Aa" chips in the composer AND the words drawn on the page
// use this same map, so the preview always matches the result (and the saved
// PNG matches the screen). These families are the ones loaded in _layout.tsx.
type CollageFontKey = NonNullable<ScrapbookElement['data']['font']>;

const COLLAGE_FONT_FAMILY: Record<CollageFontKey, string> = {
  sans: 'PlusJakartaSans_600SemiBold',
  sans_bold: 'PlusJakartaSans_800ExtraBold',
  condensed: 'Antonio_700Bold',
  display: 'BigShouldersDisplay_900Black',
  retro: 'Jersey25_400Regular',
  mono: 'AnonymousPro_700Bold',
  pixel: 'FeloniaPixel',
  caps: 'PlusJakartaSans_800ExtraBold',
  // Back-compat for pages saved before the font set grew.
  serif: 'BigShouldersDisplay_900Black',
  hand: 'Jersey25_400Regular'
};

/** The real font family string to hand to a Text component. */
export function collageFontFamily(font: string | undefined): string {
  return COLLAGE_FONT_FAMILY[(font as CollageFontKey) ?? 'sans'] ?? COLLAGE_FONT_FAMILY.sans;
}

/** Fonts that should always render in ALL CAPS. */
export function collageFontIsCaps(font: string | undefined): boolean {
  return font === 'caps';
}

/** Text chips in the composer. Each renders its own real typeface. */
export type CollageFontChip = {
  id: string;
  label: string;
  /** Maps onto ScrapbookElementData.font */
  font: CollageFontKey;
};

// The font tray, in the order it shows. Each is visibly different so people
// can actually tell the styles apart (the old list rendered the same face).
export const COLLAGE_FONTS: ReadonlyArray<CollageFontChip> = [
  { id: 'sans', label: 'Aa', font: 'sans' },
  { id: 'sans_bold', label: 'Aa', font: 'sans_bold' },
  { id: 'condensed', label: 'Aa', font: 'condensed' },
  { id: 'display', label: 'Aa', font: 'display' },
  { id: 'retro', label: 'Aa', font: 'retro' },
  { id: 'mono', label: 'Aa', font: 'mono' },
  { id: 'pixel', label: 'Aa', font: 'pixel' },
  { id: 'caps', label: 'AA', font: 'caps' }
];

// Starter swatches shown before the spectrum picker. The spectrum picker adds
// any color a person mixes as a reusable chip on top of these.
export const COLLAGE_TEXT_COLORS = [
  '#1C1B16',
  '#FFFFFF',
  '#FF3E8A',
  '#1D6FE8',
  '#F2B705',
  '#22B07D',
  '#D64A3A',
  '#7A5CD0'
] as const;
