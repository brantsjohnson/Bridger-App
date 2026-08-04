import React from 'react';
import { ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { GrassSignal } from '../../../packages/shared';
import { Avatar, ButtonSecondary, Sheet } from '../../../packages/ui';
import { GrassBurst } from './GrassBurst';
import { personById } from '../state/mock-data';

/**
 * The whole point: enough to decide whether you want in without having to
 * message and ask. What, when, roughly where, and who's already said yes.
 */
export function GrassSignalSheet({
  signal,
  onClose,
  onJoin




}: {signal: GrassSignal | null;onClose: () => void;onJoin?: (id: string) => void;}) {
  const [joined, setJoined] = React.useState(false);

  React.useEffect(() => {
    if (signal) setJoined(false);
  }, [signal]);

  if (!signal) return null;

  /* grass explodes, then straight into the thread to sort out the details */
  const join = () => {
    if (joined) return;
    setJoined(true);
    window.setTimeout(() => onJoin?.(signal.id), 850);
  };

  const person = personById(signal.personId);
  const first = person.name.split(' ')[0];
  const inPeople = (signal.inIds ?? []).map(personById);

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${first} touched grass`}
      footer={
      <ButtonSecondary
        full
        size="lg"
        tone="positive"
        disabled={joined}
        onClick={join}>
        
          {joined ? "You're in ✓" : "I'm in"}
        </ButtonSecondary>
      }>
      
      <div className="relative space-y-4">
        <GrassBurst play={joined} />
        <div className="flex items-center gap-3">
          <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="lg" />
          <span className="min-w-0">
            <span className="block text-[16px] font-bold tracking-tight text-ink">{person.name}</span>
            <span className="block text-[12px] font-semibold text-ink-mute">
              {signal.postedAt ? `${signal.postedAt} · ` : ''}told {signal.audience?.toLowerCase() ?? 'friends'}
            </span>
          </span>
        </div>

        {/* the part that makes it a real invitation instead of a ping */}
        {signal.what &&
        <p className="rounded-card bg-[#EEF8E3] p-3.5 text-[14px] font-semibold leading-snug text-ink">
            {signal.what}
          </p>
        }

        <dl className="space-y-2.5">
          <Detail icon={<ClockIcon className="h-4 w-4" strokeWidth={2.4} />} label="When">
            {signal.when}
          </Detail>
          {signal.where &&
          <Detail icon={<MapPinIcon className="h-4 w-4" strokeWidth={2.4} />} label="Where">
              {signal.where}
            </Detail>
          }
          <Detail icon={<UsersIcon className="h-4 w-4" strokeWidth={2.4} />} label="Who's in">
            {inPeople.length === 0 ?
            <span className="text-ink-mute">Nobody yet — you would be first.</span> :

            <span className="flex items-center gap-2">
                <span aria-hidden="true" className="flex -space-x-2">
                  {inPeople.map((p) =>
                <Avatar
                  key={p.id}
                  name={p.name}
                  emoji={p.emoji}
                  accent={p.accent}
                  size="xs"
                  className="" />

                )}
                </span>
                {inPeople.map((p) => p.name.split(' ')[0]).join(' & ')}
              </span>
            }
          </Detail>
        </dl>

        <p className="text-[12px] font-semibold leading-snug text-ink-mute">
          Saying you're in tells {first} only. Nobody else is notified.
        </p>
      </div>
    </Sheet>);

}

function Detail({
  icon,
  label,
  children




}: {icon: React.ReactNode;label: string;children: React.ReactNode;}) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">{label}</dt>
        <dd className="mt-0.5 text-[14px] font-bold text-ink">{children}</dd>
      </span>
    </div>);

}