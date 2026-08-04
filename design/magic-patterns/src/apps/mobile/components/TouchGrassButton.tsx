import React from 'react';
import { SproutIcon } from 'lucide-react';
import { Avatar, cn } from '../../../packages/ui';
import { GrassBurst } from './GrassBurst';
import { personById } from '../state/mock-data';

/** The big green bat-signal. One tap opens the quick sheet. */
export function TouchGrassButton({
  live,
  inIds,
  onOpen




}: {live: boolean;inIds: string[];onOpen: () => void;}) {
  return (
    <div className="relative">
      <GrassBurst play={live} />
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-[40px_16px_40px_16px] px-6 py-8 text-white transition-transform active:scale-[0.99]',
          live ? 'bg-success' : 'bg-green'
        )}>
        
        <SproutIcon className="h-8 w-8" strokeWidth={2.2} />
        <span className="font-pixel text-[26px] leading-none">TOUCH GRASS</span>
        <span className="text-[13px] font-semibold text-white/85">
          {live ? "you're free" : "tell friends you're free"}
        </span>
      </button>

      {live &&
      <div className="mt-2.5 flex items-center gap-2 px-1">
          {inIds.length > 0 ?
        <>
              <span className="flex items-center">
                {inIds.map((id, i) => {
              const p = personById(id);
              return (
                <span key={id} className={cn('rounded-full', i > 0 && '-ml-1')}>
                      <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
                    </span>);

            })}
              </span>
              <span className="text-[12px] font-bold text-ink-soft">
                {inIds.length} in
              </span>
            </> :

        <span className="text-[12px] font-semibold text-ink-mute">No one yet</span>
        }
        </div>
      }
    </div>);

}