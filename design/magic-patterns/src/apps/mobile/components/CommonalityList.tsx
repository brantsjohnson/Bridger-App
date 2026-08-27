import { StarIcon } from 'lucide-react';
import { ACCENTS, cn } from '../../../packages/ui';

const ACCENT_CYCLE = ['amber', 'teal', 'pink', 'blue', 'purple', 'coral'] as const;
const GLYPHS = ['🎤', '🗼', '🌅', '🎧', '🍜', '📚'];

type Commonality = {
  key: string;
  label: string;
  strongest?: boolean;
  /** a shared hobby pairs both follow-up answers, which is the whole point */
  yours?: string;
  theirs?: string;
};

/**
 * Things two people share. One color per row, but a single honest card shape
 * so long answers always fit: pale accent fill, ink text, and the paired
 * follow-ups in a plain white panel underneath.
 */
export function CommonalityList({
  items,
  theirName = 'They'



}: {items: Commonality[];theirName?: string;}) {
  return (
    <ul className="space-y-2.5">
      {items.map((c, i) => {
        const token = ACCENTS[ACCENT_CYCLE[i % ACCENT_CYCLE.length]];
        const paired = Boolean(c.yours && c.theirs);

        return (
          <li
            key={c.key}
            className={cn('overflow-hidden rounded-card border border-ink-line', token.tintSolid)}>
            
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px]',
                  token.bg,
                  token.text
                )}>
                
                {c.strongest ?
                <StarIcon className="h-4 w-4" strokeWidth={2.6} fill="currentColor" /> :

                GLYPHS[i % GLYPHS.length]
                }
              </span>
              <p className="min-w-0 flex-1 text-[14px] font-bold leading-snug text-ink">
                {c.label}
              </p>
            </div>

            {paired &&
            <dl className="mx-3 mb-3 space-y-2 rounded-[14px] bg-white px-3.5 py-3">
                <Answer who="You" text={c.yours as string} hex={token.hex} />
                <Answer who={theirName} text={c.theirs as string} hex={token.hex} />
              </dl>
            }
          </li>);

      })}
    </ul>);

}

/** Name over answer, so a long answer wraps to the full width instead of a column. */
function Answer({ who, text, hex }: {who: string;text: string;hex: string;}) {
  return (
    <div className="min-w-0">
      <dt
        className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color: hex }}>
        
        {who}
      </dt>
      <dd className="text-[13px] font-semibold leading-snug text-ink">{text}</dd>
    </div>);

}