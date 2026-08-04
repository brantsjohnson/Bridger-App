import React from 'react';
import { motion } from 'framer-motion';
import { Accent } from '../../shared';
import { ACCENTS, cn } from '../tokens';
import { gentle } from '../motion';

export function StepProgress({
  step,
  total,
  accent = 'purple'





}: {step: number;total: number; /** matches the step's color so the bar reads as part of the room */accent?: Accent;}) {
  const pct = Math.min(100, step / total * 100);
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
        
        <motion.div
          className={cn('h-full rounded-full', ACCENTS[accent].bg)}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={gentle} />
        
      </div>
      <span className="font-pixel text-[12px] text-ink-soft">
        {step}/{total}
      </span>
    </div>);

}

export function StoryProgressBars({
  segments,
  active



}: {segments: number;active: number;}) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: segments }).map((_, i) =>
      <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35">
          <span
          className={cn(
            'block h-full rounded-full bg-white transition-all duration-300',
            i < active ? 'w-full' : i === active ? 'w-1/2' : 'w-0'
          )} />
        
        </span>
      )}
    </div>);

}