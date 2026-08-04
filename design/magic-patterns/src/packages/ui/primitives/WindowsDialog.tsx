import React from 'react';
import { XIcon } from 'lucide-react';
import { cn, METAL_BEVEL } from '../tokens';

type WindowsDialogProps = {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
};

/** Old-Windows chrome: square, beveled, blue title bar. Used sparingly. */
export function WindowsDialog({ title, children, onClose, className }: WindowsDialogProps) {
  return (
    <div
      role="dialog"
      aria-label={title}
      className={cn(
        'w-full max-w-[300px] border-2 border-t-metal-hi border-l-metal-hi border-b-metal-lo border-r-metal-lo bg-metal-face p-[3px]',
        className
      )}>
      
      <div className="flex items-center justify-between bg-blue px-2 py-1">
        <span className="font-pixel text-[13px] leading-none text-white">{title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={cn(METAL_BEVEL, 'flex h-4 w-4 items-center justify-center')}>
          
          <XIcon className="h-2.5 w-2.5" strokeWidth={4} />
        </button>
      </div>
      <div className="px-4 py-5">{children}</div>
    </div>);

}

/** Square metallic button matching the dialog chrome. */
export function WindowsButton({
  children,
  onClick,
  autoFocusRing = false




}: {children: React.ReactNode;onClick?: () => void;autoFocusRing?: boolean;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        METAL_BEVEL,
        'relative min-w-[84px] px-4 py-1.5 text-[13px] font-bold active:border-t-metal-lo active:border-l-metal-lo active:border-b-metal-hi active:border-r-metal-hi'
      )}>
      
      {autoFocusRing &&
      <span aria-hidden="true" className="pointer-events-none absolute inset-[2px] border border-dotted border-ink/70" />
      }
      {children}
    </button>);

}