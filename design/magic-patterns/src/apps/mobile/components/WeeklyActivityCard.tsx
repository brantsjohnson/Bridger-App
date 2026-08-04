import React from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { ACCENTS, Avatar, cn } from '../../../packages/ui';
import { WEEKLY_ACTIVITY, personById } from '../state/mock-data';

/**
 * Banner into the hosted collage — no posting from here.
 * Hidden entirely unless an activity is live.
 */
export function WeeklyActivityBanner({ onOpen }: {onOpen?: () => void;}) {
  const activity = WEEKLY_ACTIVITY;
  const token = ACCENTS[activity.accent];
  const faces = activity.posts.slice(0, 4).map((p) => personById(p.personId));

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'relative flex w-full items-center gap-4 overflow-hidden rounded-[40px_16px_40px_16px] px-5 py-5 text-left transition-transform active:scale-[0.99]',
        token.tintSolid
      )}>
      
      <span aria-hidden="true" className="absolute -right-3 -top-4 text-[74px] opacity-25">
        👕
      </span>

      <span className="relative min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-mute">
          This week · {activity.closesIn}
        </span>
        <span className="mt-1 block truncate font-pixel text-[19px] leading-tight text-ink">
          {activity.title}
        </span>
        <span className="mt-0.5 block truncate text-[13px] font-semibold text-ink-soft">
          {activity.prompt}
        </span>

        <span className="mt-3 flex items-center gap-2">
          <span className="flex items-center">
            {faces.map((p, i) =>
            <span key={p.id} className={cn('rounded-full', i > 0 && '-ml-1')}>
                <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
              </span>
            )}
          </span>
          <span className="text-[12px] font-bold text-ink-soft">
            {activity.posts.length} posted
          </span>
        </span>
      </span>

      <ChevronRightIcon className="relative h-5 w-5 shrink-0 text-ink-soft" strokeWidth={2.6} />
    </button>);

}