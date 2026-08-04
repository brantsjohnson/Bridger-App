import React from 'react';
import { cn } from '../tokens';

/** One short "social media should ___" line above every onboarding ask. */
export function PurposeLine({
  children,
  className



}: {children: React.ReactNode;className?: string;}) {
  return (
    <p className={cn('text-[13px] font-semibold leading-snug text-ink-soft', className)}>
      {children}
    </p>);

}

export function SectionCount({ label, count }: {label: string;count: number;}) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-pixel text-[21px] text-ink">{label}</span>
      <span className="text-[12px] font-bold text-ink-mute">{count}</span>
    </span>);

}