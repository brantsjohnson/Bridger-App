import React from 'react';
import { LinkIcon } from 'lucide-react';
import { CustomWidget } from '../../../../packages/shared';
import { ACCENTS, cn } from '../../../../packages/ui';

/** A member's own widget, sitting in the gap between two core widgets. */
export function CustomWidgetCard({ widget }: {widget: CustomWidget;}) {
  if (widget.type === 'quote') {
    return (
      <blockquote className="rounded-[26px_10px_26px_10px] bg-[#FDEFD3] px-5 py-4">
        <p className="text-[15px] font-bold leading-snug text-ink">{widget.body}</p>
        {widget.title &&
        <cite className="mt-1.5 block text-[12px] font-semibold not-italic text-ink-mute">
            {widget.title}
          </cite>
        }
      </blockquote>);

  }

  if (widget.type === 'photos') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {['🌊', '🌵', '🛼'].map((e, i) =>
        <span
          key={e}
          aria-hidden="true"
          className={cn(
            'flex aspect-square items-center justify-center rounded-card text-[28px]',
            ACCENTS[(['teal', 'amber', 'pink'] as const)[i]].bg
          )}>
          
            {e}
          </span>
        )}
      </div>);

  }

  if (widget.type === 'link') {
    return (
      <a
        href="#"
        className="flex items-center gap-2.5 rounded-card border border-ink-line bg-white px-4 py-3 text-[14px] font-bold text-ink hover:bg-[#F1ECFF]">
        
        <LinkIcon className="h-4 w-4 text-purple" strokeWidth={2.6} />
        {widget.title ?? 'My site'}
      </a>);

  }

  if (widget.type === 'pinned') {
    return (
      <div className="flex items-center gap-3 rounded-card bg-[#D5C2FF] px-4 py-3.5">
        <span aria-hidden="true" className="text-[24px]">
          {widget.emoji ?? '📌'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-onaccent/70">
            Pinned
          </span>
          <span className="block truncate text-[14px] font-bold text-onaccent">
            {widget.title}
          </span>
        </span>
      </div>);

  }

  return (
    <div className="rounded-card border border-ink-line bg-white px-4 py-3.5">
      {widget.title &&
      <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">
          {widget.title}
        </p>
      }
      <p className="mt-1 text-[14px] font-semibold leading-snug text-ink">{widget.body}</p>
    </div>);

}