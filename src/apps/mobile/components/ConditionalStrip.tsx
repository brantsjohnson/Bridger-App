import React from 'react';
import { PixelHeading } from '../../../packages/ui';

type ConditionalStripProps = {
  title?: string;
  action?: React.ReactNode;
  empty?: boolean;
  children: React.ReactNode;
};

/** Renders nothing when empty — the Home hub stays quiet on quiet days. */
export function ConditionalStrip({
  title,
  action,
  empty = false,
  children
}: ConditionalStripProps) {
  if (empty) return null;
  return (
    <section className="mt-7">
      {(title || action) &&
      <div className="section-title mb-2 flex items-center justify-between gap-3">
          {title && <PixelHeading size="md">{title}</PixelHeading>}
          {action}
        </div>
      }
      {children}
    </section>);

}

export function SeeAll({ onClick }: {onClick?: () => void;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] font-bold text-ink-mute hover:text-ink">
      
      See all
    </button>);

}