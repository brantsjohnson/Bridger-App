// ============================================
// WHAT THIS FILE DOES (plain English):
// On/off switch with a real checkbox underneath so keyboard and screen
// readers work. Used for enabling activities, delights, and similar flags.
// ============================================
import type { InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  id: string;
};

export function Toggle({ label, id, checked, className = '', ...rest }: Props) {
  return (
    <label
      htmlFor={id}
      className={[
        'inline-flex min-h-tap cursor-pointer items-center gap-3 text-sm text-ink',
        className
      ].join(' ')}
    >
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          aria-checked={checked}
          className="peer sr-only"
          {...rest}
        />
        {/* Track */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-pill border border-line bg-canvas transition-colors peer-checked:bg-accent-teal peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
        />
        {/* Thumb */}
        <span
          aria-hidden="true"
          className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full border border-line bg-surface transition-transform peer-checked:translate-x-5"
        />
      </span>
      <span>{label}</span>
    </label>
  );
}
