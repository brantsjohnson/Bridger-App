import React from 'react';
import { ClockIcon } from 'lucide-react';
import { Accent } from '../../shared';
import { ACCENTS, cn } from '../tokens';

export type StatusTone = 'new' | 'matched' | 'nearby' | 'active' | 'neutral';

const tones: Record<StatusTone, string> = {
  new: 'bg-amber text-ink',
  matched: 'bg-purple text-white',
  nearby: 'bg-blue text-white',
  active: 'bg-teal text-white',
  neutral: 'bg-ink/8 text-ink-soft'
};

export function Badge({
  children,
  tone = 'neutral',
  dot




}: {children: React.ReactNode;tone?: StatusTone;dot?: boolean;}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-tight',
        tones[tone]
      )}>
      
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>);

}

export function CountdownChip({ label }: {label: string;}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink-line bg-canvas-raised px-2.5 py-1 text-[11px] font-bold text-ink-soft">
      <ClockIcon className="h-3 w-3" strokeWidth={2.5} />
      {label}
    </span>);

}

export function StorageBar({
  used,
  total,
  accent = 'teal'




}: {used: number;total: number;accent?: Accent;}) {
  const pct = Math.min(100, Math.round(used / total * 100));
  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-1.5 w-full overflow-hidden rounded-full bg-ink-line">
        
        <div className={cn('h-full rounded-full', ACCENTS[accent].bg)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-ink-mute">
        {used} of {total} GB
      </p>
    </div>);

}