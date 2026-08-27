import { PlusIcon } from 'lucide-react';
import { Story } from '../../../packages/shared';
import { ACCENTS, cn } from '../../../packages/ui';

/** Rectangular tile, pic in the corner, image fills the tile. */
export function StoryTile({
  story,
  onOpen,
  onAdd,
  mine = false







}: {story: Story;onOpen?: (id: string) => void; /** your own story — a "+" corner adds to it instead of a separate tile */onAdd?: () => void; /** your own story — ringed so the tray reads at a glance */mine?: boolean;}) {
  const token = ACCENTS[story.accent];
  return (
    <div className="relative h-[132px] w-[104px] shrink-0">
      <button
        type="button"
        onClick={() => onOpen?.(story.id)}
        className={cn(
          'relative h-full w-full overflow-hidden rounded-card text-left transition-transform active:scale-[0.98]',
          token.bg,
          /* an inset ring can't be clipped by the scroller the way an offset one was */
          mine && 'ring-[3px] ring-inset ring-ink'
        )}>
        
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-[46px] opacity-90">
          
          {story.emoji}
        </span>
        <span
          className={cn(
            'absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[13px]',
            story.seen ? 'border-white/40 bg-white/70' : 'border-white bg-white'
          )}>
          
          {story.emoji}
        </span>
        <span className="absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-6">
          <span className="block text-[12px] font-bold leading-tight text-white drop-shadow-sm">
            {mine ? 'Your story' : story.authorName}
          </span>
          <span className="block text-[11px] font-medium text-white/80">{story.postedAt}</span>
        </span>
      </button>

      {/* once you've posted, adding more is a "+" on your own tile */}
      {onAdd &&
      <button
        type="button"
        onClick={onAdd}
        aria-label="Add to your story"
        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-canvas bg-ink text-white transition-transform active:scale-90">
        
          <PlusIcon className="h-4 w-4" strokeWidth={3} />
        </button>
      }
    </div>);

}

/** Only shown before you've posted anything today. */
export function AddStoryTile({ onClick }: {onClick?: () => void;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[132px] w-[104px] shrink-0 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-ink-line bg-white text-ink-soft transition-colors hover:border-purple/50 hover:bg-[#F1ECFF] hover:text-purple">
      
      <span aria-hidden="true" className="text-[22px]">
        ＋
      </span>
      <span className="px-2 text-center text-[12px] font-bold leading-tight">Check in</span>
    </button>);

}