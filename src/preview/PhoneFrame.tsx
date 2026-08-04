import React from 'react';
import { cn } from '../packages/ui';

/** Preview-only: a device frame so the mobile app can be reviewed on the web. */
export function PhoneFrame({
  children,
  label,
  className




}: {children: React.ReactNode;label?: string;className?: string;}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'bg-app-grid relative h-[788px] w-[376px] max-w-full overflow-hidden rounded-[44px] border-[6px] border-ink',
          className
        )}>
        
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 pt-3 text-[11px] font-bold text-ink">
          <span>9:41</span>
          <span aria-hidden="true" className="h-5 w-24 rounded-full bg-ink" />
          <span className="font-pixel text-[11px]">100%</span>
        </div>
        <div className="h-full pt-7">{children}</div>
      </div>
      {label && <span className="font-pixel text-[12px] text-ink-mute">{label}</span>}
    </div>);

}