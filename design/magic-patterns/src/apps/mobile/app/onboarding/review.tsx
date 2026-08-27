import React from 'react';
import { Accent, Tier } from '../../../../packages/shared';
import { ACCENTS, Card, cn } from '../../../../packages/ui';
import { OnboardingStep } from '../../components/OnboardingStep';

type Row = {id: string;label: string;value: string;};

const ROWS: Row[] = [
{ id: 'birthday', label: 'Birthday', value: 'March 14' },
{ id: 'hometown', label: 'From', value: 'Boise, ID' },
{ id: 'city', label: 'Lives in', value: 'Portland, OR' },
{ id: 'upto', label: 'Up to', value: 'Building something' },
{ id: 'interests', label: 'Into', value: 'Jazz · Film · Ramen' },
{ id: 'pets', label: 'Pets', value: 'Cat · Miso' },
{ id: 'school', label: 'School', value: 'Reed College' },
{ id: 'nickname', label: 'Nickname', value: 'Ro' },
{ id: 'owl', label: 'Rhythm', value: 'Night owl' }];


/** Each circle owns a color here and everywhere else the tiers appear. */
const LEVELS: {id: Tier;short: string;accent: Accent;}[] = [
{ id: 'close', short: 'Close', accent: 'pink' },
{ id: 'friend', short: 'Friends', accent: 'blue' },
{ id: 'acquaintance', short: 'All', accent: 'teal' }];


/**
 * 7 · The summary, and the first time the tiers are used rather than explained.
 * Everything defaults to all friends.
 */
export function ReviewScreen({ onNext }: {onNext?: () => void;}) {
  const [visibility, setVisibility] = React.useState<Record<string, Tier>>(
    Object.fromEntries(ROWS.map((r) => [r.id, 'friend' as Tier]))
  );

  const setAll = (tier: Tier) =>
  setVisibility(Object.fromEntries(ROWS.map((r) => [r.id, tier])));

  return (
    <OnboardingStep
      step={8}
      total={10}
      purpose="You decide who sees what. Always."
      ask="Set who sees each answer"
      cta="Looks right"
      accent="blue"
      onContinue={onNext}>
      
      <div className="space-y-3">
        <Card>
          <p className="text-[13px] font-semibold leading-snug text-ink-soft">
            Set to all your friends for now. Change any of it, anytime. You'll build custom
            groups later.
          </p>
        </Card>

        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">
            Set all
          </span>
          <span className="flex gap-1.5">
            {LEVELS.map((l) =>
            <button
              key={l.id}
              type="button"
              onClick={() => setAll(l.id)}
              className={cn(
                'rounded-full px-3 py-1 text-[12px] font-bold transition-transform active:scale-95',
                ACCENTS[l.accent].bg,
                ACCENTS[l.accent].text
              )}>
              
                {l.short}
              </button>
            )}
          </span>
        </div>

        <div className="space-y-2">
          {ROWS.map((r) =>
          <div key={r.id} className="rounded-card border border-ink-line bg-white px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">
                  {r.label}
                </span>
                <span className="min-w-0 flex-1 truncate text-right text-[14px] font-semibold text-ink">
                  {r.value}
                </span>
              </div>

              <div
              role="group"
              aria-label={`Who sees ${r.label}`}
              className="mt-2 flex gap-1.5">
              
                {LEVELS.map((l) => {
                const on = visibility[r.id] === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setVisibility((v) => ({ ...v, [r.id]: l.id }))}
                    aria-pressed={on}
                    className={cn(
                      'flex-1 rounded-full px-2 py-1.5 text-[12px] font-bold transition-colors',
                      on ?
                      cn(ACCENTS[l.accent].bg, ACCENTS[l.accent].text) :
                      'border border-ink-line bg-white text-ink-soft'
                    )}>
                    
                      {l.short}
                    </button>);

              })}
              </div>
            </div>
          )}
        </div>
      </div>
    </OnboardingStep>);

}