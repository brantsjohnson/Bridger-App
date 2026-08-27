import React from 'react';
import { ChevronRightIcon, ClockIcon, XIcon } from 'lucide-react';
import { GrassSignal } from '../../../packages/shared';
import { Avatar, ButtonSecondary } from '../../../packages/ui';
import { GrassBurst } from './GrassBurst';
import { personById } from '../state/mock-data';

/** Prefer the short title they typed; fall back to the longer plan line. */
function activityLine(signal: GrassSignal): string {
  const title = (signal.note ?? signal.what ?? '').trim();
  return title || 'wants to hang';
}

/**
 * A friend touched grass. Shows WHEN (with a clock) and WHAT they want to do
 * (the short title they typed) — not how many people are in. Tap for detail;
 * I'm in, or dismiss.
 */
export function FreeSignalCard({
  signal,
  onDismiss,
  onOpen,
  onJoined,
  burstOnMount = true
}: {
  signal: GrassSignal;
  onDismiss?: () => void;
  onOpen?: () => void;
  /** saying yes lands you in the thread with them, to sort out the details */
  onJoined?: () => void;
  /** only the pinned one on Home earns the confetti */
  burstOnMount?: boolean;
}) {
  const person = personById(signal.personId);
  const first = person.name.split(' ')[0];
  const [joined, setJoined] = React.useState(false);
  const [burst, setBurst] = React.useState(burstOnMount);
  const activity = activityLine(signal);

  const join = () => {
    if (joined) return;
    setJoined(true);
    setBurst(true);
    if (onJoined) window.setTimeout(onJoined, 850);
  };

  return (
    <article className="relative overflow-visible rounded-card border border-ink-line bg-[#EEF8E3] px-4 py-3.5">
      <GrassBurst play={burst} onDone={() => setBurst(false)} />

      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        aria-label={`${first} touched grass. ${signal.when}. ${activity}`}
        className="relative flex w-full items-center gap-3 pr-8 text-left"
      >
        <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold tracking-tight text-ink">
            <span aria-hidden="true">🌱</span> {first} touched grass
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-ink-mute">
            <ClockIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
            <span className="truncate">
              {signal.when} · {activity}
            </span>
          </span>
        </span>
        {onOpen ? (
          <ChevronRightIcon
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-ink-mute"
            strokeWidth={2.6}
          />
        ) : null}
      </button>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-ink-mute hover:bg-white"
        >
          <XIcon className="h-4 w-4" strokeWidth={2.6} />
        </button>
      ) : null}

      <div className="relative mt-3">
        <ButtonSecondary full size="sm" tone="positive" onClick={join} disabled={joined}>
          {joined ? "You're in ✓" : "I'm in"}
        </ButtonSecondary>
      </div>
    </article>
  );
}
