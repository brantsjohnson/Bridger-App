import React from 'react';
import { cn } from '../tokens';

type EmptyStateProps = {
  emoji?: string;
  line: string;
  action?: React.ReactNode;
  className?: string;
};

/** Icon + one short line + action. Nothing more. */
export function EmptyState({ emoji = '🛰️', line, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card border border-dashed border-ink-line bg-canvas-raised px-6 py-10 text-center',
        className
      )}>
      
      <span aria-hidden="true" className="text-[30px]">
        {emoji}
      </span>
      <p className="mt-3 text-[14px] font-semibold text-ink-soft">{line}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>);

}