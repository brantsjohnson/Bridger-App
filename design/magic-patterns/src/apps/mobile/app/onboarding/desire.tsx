import React from 'react';
import { CheckIcon } from 'lucide-react';
import { ACCENTS, cn } from '../../../../packages/ui';
import { OnboardingStep } from '../../components/OnboardingStep';

/**
 * Desire / connection-style step.
 * Rank (or pick) what Bridger should prioritize; seeds a named Home layout.
 * Opaque keys only. No free-text. No model.
 */
const OPTIONS = [
  {
    id: 'frequency',
    label: 'Stay close with people I already have',
    emoji: '💬',
    accent: 'teal',
    seed: 'stay_close'
  },
  {
    id: 'depth',
    label: 'Go deeper with my people',
    emoji: '🌊',
    accent: 'purple',
    seed: 'go_deeper'
  },
  {
    id: 'plans',
    label: 'Actually make plans happen',
    emoji: '📅',
    accent: 'green',
    seed: 'make_plans'
  },
  {
    id: 'commonality',
    label: 'Meet the right people through friends',
    emoji: '🤝',
    accent: 'amber',
    seed: 'meet_people'
  }
] as const;

export type DesireKey = (typeof OPTIONS)[number]['id'];

export function DesireScreen({
  onNext,
  onSkip
}: {
  onNext?: (primary: DesireKey) => void;
  onSkip?: () => void;
}) {
  // Primary pick first; taps after that reorder by putting the tapped option first.
  const [ranking, setRanking] = React.useState<DesireKey[]>([]);

  const pick = (id: DesireKey) => {
    setRanking((prev) => {
      if (prev[0] === id) return prev;
      const rest = prev.filter((x) => x !== id);
      return [id, ...rest];
    });
  };

  return (
    <OnboardingStep
      step={2}
      total={10}
      purpose="It decided what you saw. Here, you decide."
      ask="What do you want most from Bridger?"
      accent="purple"
      ctaDisabled={ranking.length === 0}
      onContinue={() => onNext?.(ranking[0])}
      onSkip={onSkip}>
      <div className="space-y-3">
        <p className="text-[13px] font-semibold text-ink-mute">
          Tap your top priority first. You can change the order anytime.
        </p>
        {OPTIONS.map((opt, i) => {
          const rankIndex = ranking.indexOf(opt.id);
          const on = rankIndex >= 0;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => pick(opt.id)}
              aria-pressed={on}
              className={cn(
                'relative flex w-full items-center gap-3 px-4 py-4 text-left transition-transform active:scale-[0.98]',
                i % 2 === 0
                  ? 'rounded-[28px_10px_28px_10px]'
                  : 'rounded-[10px_28px_10px_28px]',
                on
                  ? cn(ACCENTS[opt.accent].bg, 'text-onaccent')
                  : 'border border-ink-line bg-white text-ink'
              )}>
              <span aria-hidden="true" className="text-[26px]">
                {opt.emoji}
              </span>
              <span className="flex-1 text-[15px] font-bold leading-tight">{opt.label}</span>
              {on && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-[12px] font-bold text-ink">
                  {rankIndex === 0 ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3.5} /> : rankIndex + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </OnboardingStep>
  );
}
