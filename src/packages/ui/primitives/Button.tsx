import React from 'react';
import { Loader2Icon } from 'lucide-react';
import { cn, METAL_BEVEL } from '../tokens';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  type?: 'button' | 'submit';
  className?: string;
};

const sizes = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-[14px]',
  lg: 'h-[52px] px-7 text-[15px]'
};

const base =
'relative inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-[transform,background-color,opacity] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

/**
 * Primary CTA — old-Windows metallic. Always SQUARE: the bevel is the point.
 */
export function ButtonPrimary({
  children,
  onClick,
  disabled,
  loading,
  full,
  size = 'lg',
  icon,
  type = 'button',
  className
}: ButtonProps) {
  const inert = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={inert}
      aria-busy={loading || undefined}
      className={cn(
        base,
        sizes[size],
        full && 'w-full',
        inert ?
        'cursor-not-allowed rounded-none border-2 border-ink-line bg-metal-face/50 text-ink-mute' :
        cn(
          METAL_BEVEL,
          'hover:bg-[#E6E4DA] active:border-t-metal-lo active:border-l-metal-lo active:border-b-metal-hi active:border-r-metal-hi active:bg-[#D3D1C7]'
        ),
        className
      )}>
      
      {/* the old-Windows focus dashes — always on for standalone metallic CTAs */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-[3px] border border-dotted',
          inert ? 'border-ink/20' : 'border-ink/70'
        )} />
      
      {loading ? <Loader2Icon className="relative h-4 w-4 animate-spin" strokeWidth={3} /> : icon}
      <span className="relative">{loading ? 'Working' : children}</span>
    </button>);

}

/** Everything else stays flat and rounded. */
export function ButtonSecondary({
  children,
  onClick,
  disabled,
  loading,
  full,
  size = 'md',
  icon,
  type = 'button',
  tone = 'outline',
  className
}: ButtonProps & {tone?: 'outline' | 'solid' | 'ghost' | 'positive';}) {
  const inert = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={inert}
      aria-busy={loading || undefined}
      className={cn(
        base,
        'rounded-full',
        sizes[size],
        full && 'w-full',
        tone === 'outline' && 'border border-ink-line bg-white text-ink hover:bg-[#F1ECFF]',
        tone === 'solid' && 'bg-ink text-white hover:bg-ink-soft',
        tone === 'ghost' && 'text-ink hover:bg-[#F1ECFF]',
        tone === 'positive' && 'bg-success text-white hover:bg-[#268C4B]',
        inert && 'cursor-not-allowed opacity-40',
        className
      )}>
      
      {loading ? <Loader2Icon className="h-4 w-4 animate-spin" strokeWidth={3} /> : icon}
      {children}
    </button>);

}