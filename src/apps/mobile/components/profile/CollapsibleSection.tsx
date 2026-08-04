import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '../../../../packages/ui';

/** Calm container for sections that can hold 3 items or 300. */
export function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  action,
  children






}: {title: string;count?: number;defaultOpen?: boolean;action?: React.ReactNode;children: React.ReactNode;}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <section className="rounded-card border border-ink-line bg-white">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left">
          
          <ChevronDownIcon
            className={cn('h-4 w-4 shrink-0 text-ink-mute transition-transform', !open && '-rotate-90')}
            strokeWidth={2.6} />
          
          <span className="truncate font-pixel text-[15px] text-ink">{title}</span>
          {typeof count === 'number' &&
          <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-bold text-ink-soft">
              {count}
            </span>
          }
        </button>
        {action}
      </div>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>);

}

/** Long list that stays scannable — shows a slice until asked for the rest. */
export function ShowAllList({
  items,
  total,
  initial = 4




}: {items: string[];total: number;initial?: number;}) {
  const [all, setAll] = React.useState(false);
  const shown = all ? items : items.slice(0, initial);

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {shown.map((item) =>
        <li
          key={item}
          className="rounded-full border border-ink-line bg-white px-3 py-1.5 text-[13px] font-semibold text-ink">
          
            {item}
          </li>
        )}
      </ul>
      {total > initial &&
      <button
        type="button"
        onClick={() => setAll((v) => !v)}
        className="mt-2.5 text-[12px] font-bold text-purple">
        
          {all ? 'Show less' : `Show all ${total}`}
        </button>
      }
    </div>);

}