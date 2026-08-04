import React from 'react';
import { SparklesIcon } from 'lucide-react';
import { cn } from '../../../../packages/ui';

/**
 * A viewer's control, and only ever a viewer's: it sits in the header of a
 * customized profile you visit, right beside the message button, so the plain
 * version is always one tap away. It never appears on your own page — there
 * you just see your look, and "Reset to plain" lives in the editor.
 *
 * Customization is presentation only, so who-sees-what is identical either way.
 */
export function ViewOriginalToggle({
  original,
  onChange,
  accent = '#6D3BEB',
  className







}: { /** true when the plain version is showing */original: boolean;onChange: (v: boolean) => void; /** the page owner's highlight color */accent?: string;className?: string;}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!original)}
      aria-pressed={!original}
      aria-label={original ? 'Show their page design' : 'View the plain version'}
      title={original ? 'Show their page design' : 'View the plain version'}
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors',
        original ?
        'border-ink-line bg-white text-ink-mute' :
        'border-transparent text-white',
        className
      )}
      style={original ? undefined : { backgroundColor: accent }}>
      
      <SparklesIcon className="h-[18px] w-[18px]" strokeWidth={2.3} />
      {original &&
      <span
        aria-hidden="true"
        className="absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 rotate-45 rounded-full bg-ink-mute" />

      }
    </button>);

}