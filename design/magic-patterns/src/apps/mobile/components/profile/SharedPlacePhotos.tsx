import { MapPinIcon } from 'lucide-react';
import { ACCENTS, cn } from '../../../../packages/ui';
import { SHARED_PLACES } from '../../state/mock-data';

/**
 * "Wait, you were there too?" When you and a friend have both been somewhere,
 * your photos from that place surface side by side. Co-op only.
 */
export function SharedPlacePhotos({ theirName = 'Them' }: {theirName?: string;}) {
  if (SHARED_PLACES.length === 0) return null;

  return (
    <section>
      <div className="mb-2.5 flex items-center gap-1.5">
        <MapPinIcon aria-hidden="true" className="h-3.5 w-3.5 text-purple" strokeWidth={2.8} />
        <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">
          You have both been here
        </h3>
      </div>

      <div className="space-y-3">
        {SHARED_PLACES.map((s) =>
        <article key={s.id} className="rounded-card border border-ink-line bg-surface p-3">
            <p className="text-[14px] font-bold text-ink">{s.place}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {[
            { who: 'You', shot: s.yours },
            { who: theirName, shot: s.theirs }].
            map(({ who, shot }) =>
            <figure key={who} className="rounded-none border border-ink-line bg-white p-1.5 pb-2">
                  <span
                aria-hidden="true"
                className={cn(
                  'flex h-[92px] items-center justify-center text-[36px]',
                  ACCENTS[shot.accent].tintSolid
                )}>
                
                    {shot.emoji}
                  </span>
                  <figcaption className="mt-1.5 px-0.5">
                    <span className="block truncate text-[11px] font-bold text-ink">{who}</span>
                    <span className="block truncate text-[11px] font-medium text-ink-mute">
                      {shot.caption}
                    </span>
                  </figcaption>
                </figure>
            )}
            </div>
          </article>
        )}
      </div>
    </section>);

}