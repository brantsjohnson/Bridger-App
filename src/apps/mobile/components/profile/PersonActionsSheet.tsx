import React from 'react';
import {
  BellOffIcon,
  FlagIcon,
  ShieldOffIcon,
  UserMinusIcon,
  UsersIcon } from
'lucide-react';
import { Tier, TIER_LABEL } from '../../../../packages/shared';
import { ButtonSecondary, Sheet, cn } from '../../../../packages/ui';

const TIERS: Tier[] = ['close', 'friend', 'acquaintance'];

export type PersonAction = 'remove' | 'block';

/** What each destructive action actually does, in plain words. */
const CONFIRM: Record<
  PersonAction,
  {title: string;body: (name: string) => string;cta: string;}> =
{
  remove: {
    title: 'Remove from your circles?',
    body: (n) =>
    `${n} moves out of your circles. They stop seeing anything you share, and you stop seeing theirs. They are not told. You can add them again later.`,
    cta: 'Remove'
  },
  block: {
    title: 'Block them?',
    body: (n) =>
    `${n} is removed from your circles and cannot find you, message you, or see anything you post. They are not told. Undo it anytime in Settings → Blocked people.`,
    cta: 'Block'
  }
};

/**
 * Everything you can do about a person, in one place. Leaving is as easy as
 * arriving — no maze, no guilt screen, and nobody is ever notified.
 */
export function PersonActionsSheet({
  open,
  name,
  tier,
  muted,
  onClose,
  onChangeTier,
  onToggleMute,
  onRemove,
  onBlock,
  onReport











}: {open: boolean;name: string;tier: Tier;muted: boolean;onClose: () => void;onChangeTier: (tier: Tier) => void;onToggleMute: () => void;onRemove: () => void;onBlock: () => void;onReport?: () => void;}) {
  const [confirm, setConfirm] = React.useState<PersonAction | null>(null);

  const close = () => {
    setConfirm(null);
    onClose();
  };

  const commit = () => {
    if (confirm === 'remove') onRemove();
    if (confirm === 'block') onBlock();
    close();
  };

  if (confirm) {
    const c = CONFIRM[confirm];
    return (
      <Sheet open={open} onClose={close} title={c.title}>
        <p className="text-[14px] font-semibold leading-snug text-ink-soft">{c.body(name)}</p>
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={commit}
            className="h-12 w-full rounded-card bg-coral text-[15px] font-bold text-white transition-transform active:scale-[0.99]">
            
            {c.cta} {name}
          </button>
          <ButtonSecondary full tone="ghost" onClick={() => setConfirm(null)}>
            Never mind
          </ButtonSecondary>
        </div>
      </Sheet>);

  }

  return (
    <Sheet open={open} onClose={close} title={name}>
      <div className="space-y-5">
        {/* the gentlest option first: move them, don't remove them */}
        <section>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
            <UsersIcon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.8} />
            Their circle
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TIERS.map((t) =>
            <button
              key={t}
              type="button"
              onClick={() => onChangeTier(t)}
              aria-pressed={tier === t}
              className={cn(
                'rounded-card border px-2 py-2.5 text-[13px] font-bold transition-colors',
                tier === t ?
                'border-purple bg-purple text-onaccent' :
                'border-ink-line bg-surface text-ink hover:bg-[#F1ECFF]'
              )}>
              
                {TIER_LABEL[t]}
              </button>
            )}
          </div>
          <p className="mt-2 text-[12px] font-semibold leading-snug text-ink-mute">
            Moving someone out is quieter than removing them, and they are never told.
          </p>
        </section>

        <section className="space-y-2">
          <ActionRow
            icon={<BellOffIcon className="h-4 w-4" strokeWidth={2.5} />}
            label={muted ? `Unmute ${name}` : `Mute ${name}`}
            line={
            muted ?
            'Their updates show up again' :
            'Stay friends, stop seeing their updates'
            }
            onClick={onToggleMute} />
          
          <ActionRow
            icon={<UserMinusIcon className="h-4 w-4" strokeWidth={2.5} />}
            label="Remove from your circles"
            line="You both stop seeing each other. They are not told."
            danger
            onClick={() => setConfirm('remove')} />
          
          <ActionRow
            icon={<ShieldOffIcon className="h-4 w-4" strokeWidth={2.5} />}
            label="Block"
            line="They cannot find you, message you, or see anything"
            danger
            onClick={() => setConfirm('block')} />
          
          <ActionRow
            icon={<FlagIcon className="h-4 w-4" strokeWidth={2.5} />}
            label="Report a problem"
            line="A person reads every report"
            onClick={onReport} />
          
        </section>
      </div>
    </Sheet>);

}

function ActionRow({
  icon,
  label,
  line,
  danger,
  onClick






}: {icon: React.ReactNode;label: string;line: string;danger?: boolean;onClick?: () => void;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3 text-left transition-colors',
        danger ? 'hover:border-coral/40 hover:bg-[#FFEDE4]' : 'hover:bg-[#F1ECFF]'
      )}>
      
      <span
        aria-hidden="true"
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          danger ? 'bg-coral/15 text-coral' : 'bg-ink/5 text-ink-soft'
        )}>
        
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-[14px] font-bold',
            danger ? 'text-coral' : 'text-ink'
          )}>
          
          {label}
        </span>
        <span className="block truncate text-[12px] font-semibold text-ink-mute">{line}</span>
      </span>
    </button>);

}