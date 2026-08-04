import React from 'react';
import { CheckIcon } from 'lucide-react';
import { Accent } from '../../shared';
import { ACCENTS, BLOBS, cn } from '../tokens';

export type Interest = {
  id: string;
  label: string;
  emoji: string;
  accent: Accent;
  shape?: number;
};

type InterestBlobProps = {
  interest: Interest;
  selected: boolean;
  onToggle: (id: string) => void;
  index?: number;
  size?: 'sm' | 'md';
};

export function InterestBlob({
  interest,
  selected,
  onToggle,
  index = 0,
  size = 'md'
}: InterestBlobProps) {
  const token = ACCENTS[interest.accent];
  const shape = BLOBS[(interest.shape ?? index) % BLOBS.length];
  const small = size === 'sm';

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(interest.id)}
      className={cn(
        'relative flex w-full items-center text-left transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 active:scale-[0.97]',
        small ? 'min-h-[58px] gap-2 px-2.5 py-2' : 'min-h-[72px] gap-2.5 px-3 py-2.5',
        shape,
        token.bg,
        token.text,
        selected && 'ring-2 ring-ink ring-offset-2'
      )}>
      
      <span
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-white/70',
          small ? 'h-8 w-8 text-[15px]' : 'h-10 w-10 text-[19px]'
        )}>
        
        {interest.emoji}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 font-bold leading-[1.15]',
          small ? 'text-[12px] pr-1' : 'text-[13px] pr-5'
        )}>
        
        {interest.label}
      </span>
      {selected && !small &&
      <span
        aria-hidden="true"
        className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink">
        
          <CheckIcon className="h-3.5 w-3.5" strokeWidth={3.5} />
        </span>
      }
    </button>);

}

/** Read-only version for profiles — same organic shapes, no toggle. */
export function InterestBadge({
  interest,
  index = 0



}: {interest: Interest;index?: number;}) {
  const token = ACCENTS[interest.accent];
  const shape = BLOBS[(interest.shape ?? index) % BLOBS.length];

  return (
    <span
      className={cn(
        'flex min-h-[52px] items-center gap-2 px-2.5 py-2',
        shape,
        token.bg,
        token.text
      )}>
      
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-[15px]">
        
        {interest.emoji}
      </span>
      <span className="min-w-0 flex-1 text-[12px] font-bold leading-[1.15]">{interest.label}</span>
    </span>);

}

export function InterestGrid({
  interests,
  selected,
  onToggle,
  size = 'md'





}: {interests: Interest[];selected: string[];onToggle: (id: string) => void;size?: 'sm' | 'md';}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {interests.map((interest, i) =>
      <InterestBlob
        key={interest.id}
        interest={interest}
        index={i}
        size={size}
        selected={selected.includes(interest.id)}
        onToggle={onToggle} />

      )}
    </div>);

}

export function InterestBadgeGrid({ interests }: {interests: Interest[];}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {interests.map((interest, i) =>
      <InterestBadge key={interest.id} interest={interest} index={i} />
      )}
    </div>);

}