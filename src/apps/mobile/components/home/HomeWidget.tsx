import React from 'react';
import { GripVerticalIcon, Maximize2Icon, Minimize2Icon } from 'lucide-react';
import { PixelHeading, cn } from '../../../../packages/ui';

export type WidgetSize = 'half' | 'full';

/** Shell every Home widget shares. In edit mode it becomes a drop target. */
export function HomeWidget({
  title,
  action,
  size,
  editing,
  dragging,
  dropTarget,
  onToggleSize,
  onDragStart,
  onDragEnter,
  onDragEnd,
  children












}: {title: string;action?: React.ReactNode;size: WidgetSize;editing: boolean;dragging?: boolean;dropTarget?: boolean;onToggleSize?: () => void;onDragStart?: () => void;onDragEnter?: () => void;onDragEnd?: () => void;children: React.ReactNode;}) {
  return (
    <section
      draggable={editing}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => editing && e.preventDefault()}
      onDrop={(e) => {
        if (!editing) return;
        e.preventDefault();
        onDragEnd?.();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        '!mt-0 flex min-w-0 flex-col',
        size === 'full' ? 'col-span-2' : 'col-span-1',
        editing && 'cursor-grab rounded-card border border-dashed border-purple/40 bg-white/60 p-2.5',
        dragging && 'opacity-40',
        dropTarget && 'border-solid border-purple bg-[#F1ECFF]'
      )}>
      
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {editing &&
          <GripVerticalIcon
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-purple"
            strokeWidth={2.6} />

          }
          <PixelHeading size="md" className="truncate">
            {title}
          </PixelHeading>
        </span>

        {editing ?
        <button
          type="button"
          onClick={onToggleSize}
          aria-label={size === 'full' ? 'Make half width' : 'Make full width'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-line bg-white text-ink">
          
            {size === 'full' ?
          <Minimize2Icon className="h-3.5 w-3.5" strokeWidth={3} /> :

          <Maximize2Icon className="h-3.5 w-3.5" strokeWidth={3} />
          }
          </button> :

        action
        }
      </div>

      <div className="min-h-0 flex-1">{children}</div>
    </section>);

}