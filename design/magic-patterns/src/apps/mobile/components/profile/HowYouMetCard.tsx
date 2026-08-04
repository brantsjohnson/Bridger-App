import React from 'react';
import { CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { HowYouMet } from '../../../../packages/shared';
import { PixelHeading, cn } from '../../../../packages/ui';
import { HOW_YOU_MET } from '../../state/connections';

const ICON = { event: CalendarIcon, via: UsersIcon, place: MapPinIcon };
const TINT = {
  event: 'bg-[#EDE6FF] text-purple',
  via: 'bg-[#FFE1D2] text-coral',
  place: 'bg-[#DFF3E4] text-success'
};

const title = (m: HowYouMet) =>
m.kind === 'place' ? `Met in ${m.label}` : m.kind === 'via' ? `Met through ${m.label}` : `Met at ${m.label}`;

/** A shared memory on their profile — either of you can edit or remove it. */
export function HowYouMetCard({ personId }: {personId: string;}) {
  const records = HOW_YOU_MET[personId] ?? [];
  if (records.length === 0) return null;

  return (
    <section>
      <PixelHeading size="sm">How you met</PixelHeading>
      <div className="mt-2 space-y-2">
        {records.map((m) => {
          const Icon = ICON[m.kind];
          return (
            <div
              key={`${m.kind}-${m.label}`}
              className="flex items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3">
              
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-card',
                  TINT[m.kind]
                )}>
                
                <Icon className="h-5 w-5" strokeWidth={2.4} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-bold text-ink">{title(m)}</span>
                <span className="block truncate text-[13px] font-semibold text-ink-mute">
                  {m.date}
                  {m.viaName ? ` · via ${m.viaName}` : ''}
                  {m.approximate ? ' · approximate' : ''}
                </span>
              </span>
            </div>);

        })}
      </div>
      <p className="mt-2 text-[12px] font-medium text-ink-mute">
        A shared memory · either of you can edit or remove it
      </p>
    </section>);

}