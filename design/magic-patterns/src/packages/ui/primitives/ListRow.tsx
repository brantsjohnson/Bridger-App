import React from 'react';
import { ChevronRightIcon, GripVerticalIcon } from 'lucide-react';
import { cn } from '../tokens';

type ListRowProps = {
  leading?: React.ReactNode;
  label: string;
  sublabel?: string;
  trailing?: 'chevron' | 'handle' | 'none';
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export function ListRow({
  leading,
  label,
  sublabel,
  trailing = 'none',
  action,
  onClick,
  className
}: ListRowProps) {
  const content =
  <>
      {leading}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[15px] font-bold tracking-tight text-ink">
          {label}
        </span>
        {sublabel &&
      <span className="block truncate text-[12px] font-medium text-ink-mute">
            {sublabel}
          </span>
      }
      </span>
      {action}
      {trailing === 'chevron' &&
    <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2.5} />
    }
      {trailing === 'handle' &&
    <GripVerticalIcon className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2.5} />
    }
    </>;


  const classes = cn(
    'flex w-full items-center gap-3 rounded-card border border-ink-line bg-white px-3.5 py-3',
    onClick && 'transition-colors hover:border-purple/40 hover:bg-[#F1ECFF]',
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>);

  }
  return <div className={classes}>{content}</div>;
}