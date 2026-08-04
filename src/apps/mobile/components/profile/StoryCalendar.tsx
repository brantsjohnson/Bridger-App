import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { ButtonSecondary, EmptyState, StorageBar, cn } from '../../../../packages/ui';
import { STORY_CALENDAR } from '../../state/mock-data';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** A memory archive, not a content grid. Dot or thumbnail per posted day. */
export function StoryCalendar({
  empty = false,
  onOpenStory




}: {empty?: boolean; /** a posted day opens that day's story */onOpenStory?: (day: number) => void;}) {
  const [month, setMonth] = React.useState('July 2026');
  const usedPct = empty ? 0 : 100;
  const days: Record<number, string> = empty ? {} : STORY_CALENDAR;

  if (empty) {
    return (
      <EmptyState
        emoji="📸"
        line="No stories yet. Your posts land here as a monthly archive."
        action={<ButtonSecondary size="sm" tone="solid">Post a story</ButtonSecondary>} />);


  }

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-ink-line bg-white p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonth('June 2026')}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F1ECFF]">
            
            <ChevronLeftIcon className="h-4 w-4" strokeWidth={2.6} />
          </button>
          <p className="font-pixel text-[16px] text-ink">{month}</p>

          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonth('July 2026')}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F1ECFF]">
            
            <ChevronRightIcon className="h-4 w-4" strokeWidth={2.6} />
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] font-semibold text-ink-mute">
          Tap a day to watch that story again.
        </p>

        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {DAY_LABELS.map((d, i) =>
          <span key={`${d}-${i}`} className="text-center text-[10px] font-bold text-ink-mute">
              {d}
            </span>
          )}

          {Array.from({ length: 31 }).map((_, i) => {
            const day = i + 1;
            const thumb = days[day];
            return (
              <button
                key={day}
                type="button"
                disabled={!thumb}
                onClick={thumb ? () => onOpenStory?.(day) : undefined}
                aria-label={thumb ? `Open story from July ${day}` : `July ${day}, no story`}
                className={cn(
                  'relative flex aspect-square items-center justify-center rounded-md text-[15px] transition-transform',
                  thumb ?
                  'cursor-pointer bg-purple/15 hover:bg-purple/25 active:scale-95' :
                  'border border-ink-line bg-white text-ink-mute'
                )}>
                
                {thumb ?
                <span aria-hidden="true">{thumb}</span> :

                <span className="text-[10px] font-semibold">{day}</span>
                }
              </button>);

          })}
        </div>
      </div>

      <div className="rounded-card border border-ink-line bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">Storage</p>
          <p className="text-[12px] font-semibold text-ink-soft">Free month · {usedPct}% used</p>
        </div>
        <div className="mt-2.5">
          <StorageBar used={5} total={5} />
        </div>

        {usedPct >= 100 ?
        <div className="mt-3">
            <p className="text-[13px] font-semibold text-ink">
              Your free month is full. Older posts will roll off. Members keep everything.
            </p>
            <div className="mt-3">
              <ButtonSecondary full size="sm" tone="solid">
                Join the co-op
              </ButtonSecondary>
            </div>
          </div> :

        <p className="mt-2 text-[12px] font-medium text-ink-mute">
            Story media older than 30 days rolls off.
          </p>
        }
      </div>
    </div>);

}