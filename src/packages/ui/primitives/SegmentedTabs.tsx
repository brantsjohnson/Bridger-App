import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../tokens';
import { spring } from '../motion';

type SegmentedTabsProps = {
  tabs: string[];
  value: string;
  onChange: (tab: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
};

export function SegmentedTabs({
  tabs,
  value,
  onChange,
  variant = 'pill',
  className
}: SegmentedTabsProps) {
  const id = React.useId();

  if (variant === 'underline') {
    return (
      <div role="tablist" className={cn('no-scrollbar flex gap-5 overflow-x-auto border-b border-ink-line', className)}>
        {tabs.map((tab) => {
          const active = tab === value;
          return (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(tab)}
              className={cn(
                'relative whitespace-nowrap pb-2.5 text-[14px] font-bold tracking-tight transition-colors',
                active ? 'text-ink' : 'text-ink-mute hover:text-ink-soft'
              )}>
              
              {tab}
              {active &&
              <motion.span
                layoutId={`${id}-u`}
                transition={spring}
                className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-ink" />

              }
            </button>);

        })}
      </div>);

  }

  return (
    <div
      role="tablist"
      className={cn(
        'no-scrollbar flex gap-1 overflow-x-auto rounded-full border border-ink-line bg-canvas-raised p-1',
        className
      )}>
      
      {tabs.map((tab) => {
        const active = tab === value;
        return (
          <button
            key={tab}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab)}
            className={cn(
              'relative flex-1 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold tracking-tight transition-colors',
              active ? 'text-ink' : 'text-ink-mute hover:text-ink-soft'
            )}>
            
            {active &&
            <motion.span
              layoutId={`${id}-p`}
              transition={spring}
              className="absolute inset-0 rounded-full bg-purple/20" />

            }
            <span className="relative">{tab}</span>
          </button>);

      })}
    </div>);

}