// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny decorative idea card for the Events marketing gate (Magic Patterns).
// Touch Grass marks use the same green Sprout look as the big TG button.
// ============================================
import { Sprout } from 'lucide-react';
import { CoverArt, cn } from '../../../../packages/ui';

export type EventIdea = {
  id: string;
  title: string;
  emoji: string;
  accent: 'purple' | 'coral' | 'teal' | 'amber' | 'pink' | 'blue' | 'green';
  kind: 'idea' | 'touch_grass';
};

export function EventIdeaChip({ idea }: { idea: EventIdea }) {
  const isGrass = idea.kind === 'touch_grass';
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex h-24 w-[118px] shrink-0 flex-col overflow-hidden rounded-card border border-ink-line',
        isGrass ? 'bg-[#E8F6E9]' : 'bg-surface'
      )}
    >
      {isGrass ? (
        <div className="flex h-[42px] w-full items-center justify-center bg-green">
          <Sprout size={22} color="#FFFFFF" strokeWidth={2.2} />
        </div>
      ) : (
        <div className="h-[42px] w-full overflow-hidden">
          <CoverArt
            cover={{ kind: 'emoji', value: idea.emoji }}
            accent={idea.accent}
          />
        </div>
      )}
      <div className="flex flex-1 items-center px-2 py-1.5">
        <p
          className={cn(
            'line-clamp-2 text-[11px] font-bold leading-snug',
            isGrass ? 'text-[#1F7A42]' : 'text-ink'
          )}
        >
          {idea.title}
        </p>
      </div>
    </div>
  );
}
