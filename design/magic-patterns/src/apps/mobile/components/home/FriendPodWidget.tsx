import React from 'react';
import { ChevronRightIcon, MicIcon, PlayIcon, PlusIcon } from 'lucide-react';
import { Avatar, cn } from '../../../../packages/ui';
import { RECAP_ANSWERS, RECAP_WEEK } from '../../state/pod';
import { personById } from '../../state/mock-data';
import { WidgetSize } from './HomeWidget';

/** Compact entry into the weekly podcast. Opens the full player. */
export function FriendPodWidget({
  size,
  onPlay,
  onRecord,
  onSubmitQuestion





}: {size: WidgetSize;onPlay: () => void;onRecord: () => void;onSubmitQuestion: () => void;}) {
  const voices = Array.from(new Set(RECAP_ANSWERS.map((a) => a.authorId))).map(personById);
  const minutes = Math.round(RECAP_ANSWERS.reduce((n, a) => n + a.duration, 0) / 60);

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={onPlay}
        className={cn(
          'flex w-full items-center gap-4 rounded-[28px_10px_28px_10px] bg-ink px-5 py-5 text-left text-white transition-transform active:scale-[0.99]'
        )}>
        
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink">
          <PlayIcon className="ml-0.5 h-6 w-6" strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-pixel text-[17px]">Your friends' week</span>
          <span className="block truncate text-[12px] font-semibold text-white/70">
            {voices.length} recaps · {minutes} min
          </span>
        </span>
        <span className="flex shrink-0 items-center">
          {voices.slice(0, 3).map((p, i) =>
          <span key={p.id} className={cn('rounded-full ring-2 ring-ink', i > 0 && '-ml-2')}>
              <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
            </span>
          )}
        </span>
      </button>

      {size === 'full' &&
      <>
          <button
          type="button"
          onClick={onRecord}
          className="flex w-full items-center gap-3 rounded-card border border-ink-line bg-white px-4 py-3.5 text-left transition-colors hover:border-purple/40 hover:bg-[#F1ECFF]">
          
            <MicIcon className="h-5 w-5 shrink-0 text-purple" strokeWidth={2.4} />
            <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
              Add your recap
            </span>
            <span className="shrink-0 text-[12px] font-semibold text-ink-mute">
              {RECAP_WEEK.questions.length} questions · 45s
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2.6} />
          </button>

          <button
          type="button"
          onClick={onSubmitQuestion}
          className="flex w-full items-center gap-3 rounded-card border border-ink-line bg-white px-4 py-3 text-left transition-colors hover:border-purple/40 hover:bg-[#F1ECFF]">
          
            <PlusIcon className="h-4 w-4 shrink-0 text-purple" strokeWidth={3} />
            <span className="text-[13px] font-bold text-ink">Submit a question</span>
          </button>
        </>
      }
    </div>);

}