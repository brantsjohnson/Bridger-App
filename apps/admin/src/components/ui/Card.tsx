// ============================================
// WHAT THIS FILE DOES (plain English):
// White rounded panel used to group a section of the admin console.
// Flat surface, hairline border, no shadow (DESIGN.md).
// ============================================
import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
  children: ReactNode;
  as?: 'section' | 'div' | 'article';
};

export function Card({
  title,
  description,
  children,
  className = '',
  as: Tag = 'section',
  ...rest
}: Props) {
  return (
    <Tag
      className={[
        'rounded-card border border-line bg-surface p-5',
        className
      ].join(' ')}
      {...rest}
    >
      {(title || description) && (
        <header className="mb-4">
          {title ? (
            <h2 className="font-pixel text-xl text-ink">{title}</h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </header>
      )}
      {children}
    </Tag>
  );
}
