import React from 'react';
import { Accent } from '../../shared';
import { ACCENTS, cn } from '../tokens';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
  onClick?: () => void;
};

/** Flat rounded container: opaque white on the cream grid. Hairline, never a shadow. */
export function Card({ children, className, as: Tag = 'div', onClick }: CardProps) {
  const interactive = Boolean(onClick);
  return (
    <Tag
      {...interactive ? { onClick, role: 'button', tabIndex: 0 } : {}}
      className={cn(
        'rounded-card border border-ink-line bg-white p-5',
        interactive &&
        'cursor-pointer transition-[transform,background-color,border-color] hover:border-purple/40 hover:bg-[#F1ECFF] active:scale-[0.99]',
        className
      )}>
      
      {children}
    </Tag>);

}

/** Solid color variant — the accent delivery vehicle. Tints are opaque. */
export function ColorCard({
  accent,
  children,
  className,
  onClick,
  tint = false
}: CardProps & {accent: Accent;tint?: boolean;}) {
  const token = ACCENTS[accent];
  return (
    <div
      {...onClick ? { onClick, role: 'button', tabIndex: 0 } : {}}
      className={cn(
        'rounded-card p-5',
        tint ? cn(token.tintSolid, 'text-ink') : cn(token.bg, token.text),
        onClick && 'cursor-pointer transition-transform active:scale-[0.99]',
        className
      )}>
      
      {children}
    </div>);

}