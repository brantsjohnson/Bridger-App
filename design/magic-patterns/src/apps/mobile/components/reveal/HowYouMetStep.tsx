import React from 'react';
import { CheckIcon, HandshakeIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { MeetContext } from '../../../../packages/shared';
import { cn } from '../../../../packages/ui';
import { NEARBY_AREA } from '../../state/connections';

/**
 * Reveal screen 0 — asked once, before anything private is shown.
 * Recording the place is opt-in but checked by default, and always coarse.
 */
export function HowYouMetStep({
  context,
  onContext,
  recordPlace,
  onRecordPlace





}: {context: MeetContext | null;onContext: (c: MeetContext) => void;recordPlace: boolean;onRecordPlace: (v: boolean) => void;}) {
  const options: Array<{value: MeetContext;label: string;Icon: typeof HandshakeIcon;}> = [
  { value: 'just-met', label: 'We just met', Icon: HandshakeIcon },
  { value: 'already-know', label: 'We already know each other', Icon: UsersIcon }];


  return (
    <div className="space-y-3">
      {options.map(({ value, label, Icon }) =>
      <button
        key={value}
        type="button"
        onClick={() => onContext(value)}
        aria-pressed={context === value}
        className={cn(
          'flex w-full items-center gap-3 rounded-card border-2 px-4 py-4 text-left transition-colors',
          context === value ?
          'border-ink bg-surface text-ink' :
          'border-ink-line bg-surface/60 text-ink-soft'
        )}>
        
          <Icon className="h-5 w-5 shrink-0" strokeWidth={2.4} />
          <span className="text-[15px] font-bold">{label}</span>
        </button>
      )}

      <div className="rounded-card border border-ink-line bg-surface/70 p-4">
        <button
          type="button"
          onClick={() => onRecordPlace(!recordPlace)}
          aria-pressed={recordPlace}
          className="flex w-full items-center gap-3 text-left">
          
          <span
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
              recordPlace ? 'border-success bg-success text-white' : 'border-ink-line'
            )}>
            
            {recordPlace && <CheckIcon className="h-4 w-4" strokeWidth={3.2} />}
          </span>
          <span className="text-[15px] font-bold text-ink">Record where you met</span>
        </button>

        {recordPlace &&
        <div className="mt-3 flex items-center gap-2 rounded-card bg-[#DFF3E4] px-3 py-2.5">
            <MapPinIcon className="h-4 w-4 shrink-0 text-success" strokeWidth={2.6} />
            <span className="text-[14px] font-semibold text-ink">{NEARBY_AREA} · approximate</span>
          </div>
        }

        <p className="mt-2.5 text-[12px] font-medium text-ink-mute">
          Only you two see it · edit or remove anytime
        </p>
      </div>
    </div>);

}