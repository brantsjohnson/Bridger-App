import { Accent, Cover } from '../../shared';
import { ACCENTS, cn } from '../tokens';

/** Recommended upload size for a banner — surfaced in the picker. */
export const COVER_PX = '1200 × 480 px';

/**
 * Cover art for events, activities and profiles.
 * A photo fills the frame; a single emoji or sticker tiles into a
 * scattered pattern so one glyph still reads as a designed surface.
 */
export function CoverArt({
  cover,
  accent = 'purple',
  className,
  rounded = false





}: {cover?: Cover;accent?: Accent;className?: string;rounded?: boolean;}) {
  const token = ACCENTS[accent];

  if (cover?.kind === 'photo') {
    return (
      <img
        src={cover.url}
        alt=""
        className={cn('h-full w-full object-cover', rounded && 'rounded-card', className)} />);


  }

  const glyph = cover?.kind === 'emoji' ? cover.value : undefined;
  const sticker = cover?.kind === 'sticker' ? cover.url : undefined;

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden',
        token.tintSolid,
        rounded && 'rounded-card',
        className
      )}>
      
      {(glyph || sticker) && <CoverPattern glyph={glyph} sticker={sticker} />}
    </div>);

}

/** Scattered tiling of one glyph — varied size, rotation and opacity. */
const TILES = [
{ x: 6, y: 18, s: 30, r: -14, o: 0.95 },
{ x: 22, y: 62, s: 20, r: 12, o: 0.6 },
{ x: 34, y: 12, s: 24, r: 8, o: 0.8 },
{ x: 48, y: 55, s: 34, r: -8, o: 1 },
{ x: 62, y: 20, s: 18, r: 20, o: 0.55 },
{ x: 74, y: 66, s: 26, r: -18, o: 0.85 },
{ x: 88, y: 26, s: 22, r: 10, o: 0.7 },
{ x: 14, y: 88, s: 16, r: -6, o: 0.5 },
{ x: 56, y: 88, s: 20, r: 16, o: 0.65 },
{ x: 92, y: 78, s: 28, r: -12, o: 0.9 }];


function CoverPattern({ glyph, sticker }: {glyph?: string;sticker?: string;}) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {TILES.map((t, i) =>
      <span
        key={i}
        className="absolute -translate-x-1/2 -translate-y-1/2 select-none leading-none"
        style={{
          left: `${t.x}%`,
          top: `${t.y}%`,
          fontSize: `${t.s}px`,
          transform: `translate(-50%, -50%) rotate(${t.r}deg)`,
          opacity: t.o
        }}>
        
          {sticker ?
        <img src={sticker} alt="" style={{ width: t.s * 1.6, height: t.s * 1.6 }} /> :

        glyph
        }
        </span>
      )}
    </div>);

}