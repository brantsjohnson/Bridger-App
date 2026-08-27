import React from 'react';
import { XIcon } from 'lucide-react';
import { ButtonSecondary } from '../../../../packages/ui';

/**
 * A single re-check when the profile looks stale. One question, announcement
 * style, never a chore. Answering refreshes the match signals behind the scenes.
 */
export function FreshnessCard({ question = 'Still into beatboxing?' }: {question?: string;}) {
  const [state, setState] = React.useState<'ask' | 'kept' | 'gone' | 'dismissed'>('ask');

  // X: just close — do not show "Kept it."
  if (state === 'dismissed') return null;

  if (state !== 'ask') {
    return (
      <div className="rounded-[26px_10px_26px_10px] bg-[#DFF3E4] px-5 py-4">
        <p className="text-[14px] font-bold text-ink">
          {state === 'kept' ? 'Kept it.' : 'Removed. Thanks for the update.'}
        </p>
      </div>);

  }

  return (
    <div className="relative rounded-[26px_10px_26px_10px] bg-[#FDEFD3] px-5 py-4">
      <button
        type="button"
        onClick={() => setState('dismissed')}
        aria-label="Dismiss"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-mute hover:bg-white">
        
        <XIcon className="h-4 w-4" strokeWidth={2.6} />
      </button>

      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">Quick check</p>
      <p className="mt-1 pr-8 text-[16px] font-bold leading-snug tracking-tight text-ink">
        {question}
      </p>

      <div className="mt-3 flex gap-2.5">
        <ButtonSecondary full size="sm" tone="positive" onClick={() => setState('kept')}>
          Yes
        </ButtonSecondary>
        <ButtonSecondary full size="sm" onClick={() => setState('gone')}>
          Not anymore
        </ButtonSecondary>
      </div>
    </div>);

}