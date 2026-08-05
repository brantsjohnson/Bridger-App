// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared button for the admin console. Primary uses the 90s metallic bevel
// from DESIGN.md. Secondary stays flat. All hit targets are at least 44px.
// ============================================
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const VARIANT_CLASS: Record<Variant, string> = {
  // Metallic bevel: lighter top/left, darker bottom/right, silver face
  primary:
    'bg-metal-face text-ink border-t-metal-hi border-l-metal-hi border-b-metal-lo border-r-metal-lo border-2 font-medium',
  secondary:
    'bg-surface text-ink border border-line font-medium hover:bg-canvas',
  danger: 'bg-surface text-danger border border-danger font-medium',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-canvas'
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'inline-flex min-h-tap min-w-tap items-center justify-center gap-2 rounded-pill px-4 py-2 text-sm transition-opacity',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASS[variant],
        className
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
