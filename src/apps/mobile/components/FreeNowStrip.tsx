import React from 'react';
import { SproutIcon, XIcon } from 'lucide-react';
import { Avatar, cn } from '../../../packages/ui';
import { personById } from '../state/mock-data';

/** Sits above the stories while your signal is live — impossible to miss. */
export function FreeNowStrip({
  when,
  inIds,
  onEnd




}: {when: string;inIds: string[];onEnd?: () => void;}) {
  return (
    <div className="flex items-center gap-3 rounded-[28px_10px_28px_10px] bg-success px-4 py-3 text-white">
      <SproutIcon className="h-5 w-5 shrink-0" strokeWidth={2.4} />
      <span className="min-w-0 flex-1">
        <span className="block font-pixel text-[14px] leading-none">YOU TOUCHED GRASS</span>
        <span className="block text-[12px] font-semibold text-white/80">{when}</span>
      </span>

      {inIds.length > 0 &&
      <span className="flex items-center">
          {inIds.map((id, i) => {
          const p = personById(id);
          return (
            <span key={id} className={cn('rounded-full ring-2 ring-success', i > 0 && '-ml-2')}>
                <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
              </span>);

        })}
          <span className="ml-2 text-[12px] font-bold">{inIds.length} in</span>
        </span>
      }

      <button
        type="button"
        onClick={onEnd}
        aria-label="End signal"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 hover:bg-white/30">
        
        <XIcon className="h-4 w-4" strokeWidth={2.6} />
      </button>
    </div>);

}