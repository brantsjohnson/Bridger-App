import React from 'react';
import {
  CheckIcon,
  CopyIcon,
  MessageCircleIcon,
  QrCodeIcon,
  ShareIcon,
  UserPlusIcon } from
'lucide-react';
import { EventItem } from '../../../../packages/shared';
import { Avatar, ButtonSecondary, Sheet, cn } from '../../../../packages/ui';
import { PEOPLE, personById } from '../../state/mock-data';

/**
 * The share sheet people expect on iOS and Android — the event as a preview
 * card at the top, then the ways out of the app.
 */
export function ShareEventSheet({
  open,
  event,
  onClose




}: {open: boolean;event: EventItem;onClose: () => void;}) {
  const [picked, setPicked] = React.useState<string[]>([]);
  const [copied, setCopied] = React.useState(false);
  const host = personById(event.hostId);
  const link = `bridger.app/e/${event.id}`;

  React.useEffect(() => {
    if (!open) {
      setPicked([]);
      setCopied(false);
    }
  }, [open]);

  /** friends who aren't already going or invited — the only useful ones here */
  const invitable = PEOPLE.filter(
    (p) => !event.goingIds.includes(p.id) && !(event.invitedIds ?? []).includes(p.id)
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Share this event"
      footer={
      picked.length > 0 ?
      <ButtonSecondary full size="lg" tone="solid" onClick={onClose}>
            Invite {picked.length} {picked.length === 1 ? 'friend' : 'friends'}
          </ButtonSecondary> :
      undefined
      }>
      
      <div className="space-y-4">
        {/* what the other person will actually see */}
        <div className="flex items-center gap-3 rounded-card border border-ink-line bg-white p-3">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-[#F1ECFF] text-[24px]">
            
            {event.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-bold text-ink">{event.title}</span>
            <span className="block truncate text-[12px] font-semibold text-ink-mute">
              {event.day} · {event.time} · hosted by {host.name.split(' ')[0]}
            </span>
          </span>
        </div>

        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
            Invite friends
          </p>
          <ul className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {invitable.map((p) => {
              const on = picked.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() =>
                    setPicked((v) => on ? v.filter((id) => id !== p.id) : [...v, p.id])
                    }
                    aria-pressed={on}
                    className="flex w-[64px] flex-col items-center gap-1.5">
                    
                    <span className="relative">
                      <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="lg" />
                      {on &&
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-canvas bg-success text-white">
                        
                          <CheckIcon className="h-3 w-3" strokeWidth={3.4} />
                        </span>
                      }
                    </span>
                    <span
                      className={cn(
                        'w-full truncate text-center text-[11px] font-bold',
                        on ? 'text-ink' : 'text-ink-mute'
                      )}>
                      
                      {p.name.split(' ')[0]}
                    </span>
                  </button>
                </li>);

            })}
          </ul>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
            Or send it anywhere
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            <ShareAction
              icon={copied ? <CheckIcon className="h-5 w-5" strokeWidth={2.8} /> : <CopyIcon className="h-5 w-5" strokeWidth={2.4} />}
              label={copied ? 'Copied' : 'Copy link'}
              onClick={() => setCopied(true)} />
            
            <ShareAction
              icon={<MessageCircleIcon className="h-5 w-5" strokeWidth={2.4} />}
              label="Messages" />
            
            <ShareAction icon={<ShareIcon className="h-5 w-5" strokeWidth={2.4} />} label="More" />
            <ShareAction
              icon={<QrCodeIcon className="h-5 w-5" strokeWidth={2.4} />}
              label="QR code" />
            
          </div>
        </section>

        <p className="rounded-card bg-surface p-3 text-[12px] font-semibold leading-snug text-ink-mute">
          <span className="font-bold text-ink">{link}</span> — anyone with the link can see the
          event and RSVP, but the address only shows once they are on the list.
        </p>
      </div>
    </Sheet>);

}

function ShareAction({
  icon,
  label,
  onClick




}: {icon: React.ReactNode;label: string;onClick?: () => void;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-card border border-ink-line bg-white px-1 py-3 text-ink transition-colors hover:bg-[#F1ECFF]">
      
      <span aria-hidden="true">{icon}</span>
      <span className="w-full truncate px-0.5 text-center text-[11px] font-bold">{label}</span>
    </button>);

}

/** Adding a co-host — someone who can edit the event and see the dashboard. */
export function AddCoHostSheet({
  open,
  goingIds,
  coHostIds,
  onClose,
  onSave






}: {open: boolean;goingIds: string[];coHostIds: string[];onClose: () => void;onSave: (ids: string[]) => void;}) {
  const [picked, setPicked] = React.useState(coHostIds);

  React.useEffect(() => {
    if (open) setPicked(coHostIds);
  }, [open, coHostIds]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Co-hosts"
      footer={
      <ButtonSecondary full size="lg" tone="solid" onClick={() => onSave(picked)}>
          Save
        </ButtonSecondary>
      }>
      
      <div className="space-y-3">
        <p className="text-[13px] font-semibold leading-snug text-ink-mute">
          A co-host can edit the event, invite people, and see who is coming. They cannot delete it.
        </p>
        <ul className="space-y-2">
          {goingIds.map((id) => {
            const p = personById(id);
            const on = picked.includes(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setPicked((v) => on ? v.filter((x) => x !== id) : [...v, id])}
                  aria-pressed={on}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-card border px-3.5 py-3 text-left transition-colors',
                    on ?
                    'border-teal bg-[#E6F7F0]' :
                    'border-ink-line bg-white hover:bg-[#F1ECFF]'
                  )}>
                  
                  <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
                    {p.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                      on ? 'border-teal bg-teal text-white' : 'border-ink-line bg-white'
                    )}>
                    
                    {on ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3.4} /> : null}
                  </span>
                </button>
              </li>);

          })}
        </ul>
        {goingIds.length === 0 &&
        <p className="flex items-center gap-2 text-[13px] font-semibold text-ink-mute">
            <UserPlusIcon className="h-4 w-4" strokeWidth={2.4} />
            Nobody has said yes yet — co-hosts come from your guest list.
          </p>
        }
      </div>
    </Sheet>);

}