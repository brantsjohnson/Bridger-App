import React from 'react';
import { CheckIcon, MicIcon, SquareIcon } from 'lucide-react';
import { Tier } from '../../../../packages/shared';
import { ButtonPrimary, ButtonSecondary, Sheet, cn } from '../../../../packages/ui';
import { RECAP_WEEK } from '../../state/pod';

const AUDIENCE: Array<{label: string;tier: Tier;}> = [
{ label: 'Close', tier: 'close' },
{ label: 'Friends', tier: 'friend' },
{ label: 'Everyone', tier: 'acquaintance' }];


/** Five questions, recorded in-app. About 45s each. */
export function RecapRecorder({ open, onClose }: {open: boolean;onClose: () => void;}) {
  const [step, setStep] = React.useState(0);
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [done, setDone] = React.useState<number[]>([]);
  const [tier, setTier] = React.useState<Tier>('friend');

  const last = step === RECAP_WEEK.questions.length;
  const recorded = done.includes(step);

  React.useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => Math.min(45, s + 1)), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  React.useEffect(() => {
    if (!open) {
      setStep(0);
      setDone([]);
      setSeconds(0);
      setRecording(false);
    }
  }, [open]);

  const stop = () => {
    setRecording(false);
    setSeconds(0);
    setDone((p) => p.includes(step) ? p : [...p, step]);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Your recap">
      {last ?
      <div className="space-y-4">
          <div>
            <p className="mb-2 text-[12px] font-bold text-ink-soft">Share with</p>
            <div className="flex gap-2">
              {AUDIENCE.map((a) =>
            <button
              key={a.tier}
              type="button"
              onClick={() => setTier(a.tier)}
              aria-pressed={tier === a.tier}
              className={cn(
                'flex-1 rounded-full px-3 py-2.5 text-[13px] font-bold transition-colors',
                tier === a.tier ?
                'bg-success text-white' :
                'border border-ink-line bg-white text-ink-soft hover:bg-[#F1ECFF]'
              )}>
              
                  {a.label}
                </button>
            )}
            </div>
          </div>

          <ButtonPrimary full onClick={onClose}>
            Post
          </ButtonPrimary>
        </div> :

      <div className="space-y-4">
          <div className="flex items-center gap-1.5">
            {RECAP_WEEK.questions.map((_, i) =>
          <span
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full',
              done.includes(i) ? 'bg-success' : i === step ? 'bg-purple' : 'bg-ink/12'
            )} />

          )}
          </div>

          <div className="rounded-card bg-[#EDE6FF] px-5 py-6 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">
              Q{step + 1} of {RECAP_WEEK.questions.length}
            </p>
            <p className="mt-1.5 text-[19px] font-bold leading-snug tracking-tight text-ink">
              {RECAP_WEEK.questions[step]}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <button
            type="button"
            onClick={() => recording ? stop() : setRecording(true)}
            aria-label={recording ? 'Stop' : 'Record'}
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full text-white transition-colors',
              recording ? 'bg-coral' : recorded ? 'bg-success' : 'bg-ink'
            )}>
            
              {recording ?
            <SquareIcon className="h-7 w-7" strokeWidth={2.6} /> :
            recorded ?
            <CheckIcon className="h-8 w-8" strokeWidth={3} /> :

            <MicIcon className="h-8 w-8" strokeWidth={2.4} />
            }
            </button>
            <p className="mt-2.5 text-[12px] font-bold text-ink-mute">
              {recording ? `0:${String(seconds).padStart(2, '0')} · 45s max` : recorded ? 'Recorded' : 'Tap to record'}
            </p>
          </div>

          <div className="flex gap-2.5">
            {recorded &&
          <ButtonSecondary full onClick={() => setDone((p) => p.filter((i) => i !== step))}>
                Re-record
              </ButtonSecondary>
          }
            <ButtonSecondary
            full
            tone="solid"
            disabled={!recorded}
            onClick={() => setStep((s) => s + 1)}>
            
              Next
            </ButtonSecondary>
          </div>
        </div>
      }
    </Sheet>);

}