import React from 'react';
import { Accent, Tier, TIER_LABEL } from '../../shared';
import { ACCENTS, cn } from '../tokens';

type ChipProps = {
  label: string;
  accent?: Accent;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
};

export function Chip({
  label,
  accent = 'purple',
  selected = false,
  onClick,
  icon,
  size = 'md'
}: ChipProps) {
  const token = ACCENTS[accent];
  const classes = cn(
    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold tracking-tight transition-colors',
    size === 'sm' ? 'h-7 px-3 text-[12px]' : 'h-9 px-4 text-[13px]',
    selected ?
    cn(token.bg, token.text, 'border border-transparent') :
    'border border-ink-line bg-canvas-raised text-ink-soft hover:border-ink/25'
  );

  if (!onClick) {
    return (
      <span className={classes}>
        {icon}
        {label}
      </span>);

  }

  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={classes}>
      {icon}
      {label}
    </button>);

}

const TIER_ACCENT: Record<Tier, Accent> = {
  close: 'coral',
  friend: 'purple',
  acquaintance: 'blue',
  none: 'teal'
};

export function TierChip({
  tier,
  selected = true,
  onClick




}: {tier: Tier;selected?: boolean;onClick?: () => void;}) {
  return (
    <Chip
      label={TIER_LABEL[tier]}
      accent={TIER_ACCENT[tier]}
      selected={selected}
      onClick={onClick}
      size="sm" />);


}