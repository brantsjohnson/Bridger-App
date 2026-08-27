import React from 'react';
import {
  CalendarPlusIcon,
  ChevronRightIcon,
  ClockIcon,
  HandCoinsIcon,
  MapPinIcon,
  PackageIcon,
  Share2Icon } from
'lucide-react';
import {
  Avatar,
  Badge,
  Breathe,
  ButtonSecondary,
  Card,
  CoverArt,
  ListRow,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  TextField,
  Toggle } from
'../../../../packages/ui';
import { EventPeopleSheet } from '../../components/event/EventPeopleSheet';
import { ShareEventSheet } from '../../components/event/ShareEventSheet';
import { EVENTS, MEET_SUGGESTIONS, personById } from '../../state/mock-data';

/** Invitee view — everything you need to decide, then RSVP and share. */
export function EventDetailScreen({
  eventId = 'e3',
  onBack,
  onOpenDiscover




}: {eventId?: string;onBack?: () => void;onOpenDiscover?: () => void;}) {
  const event = EVENTS.find((e) => e.id === eventId) ?? EVENTS[2];
  const host = personById(event.hostId);
  const coHosts = (event.coHostIds ?? []).map(personById);
  const invited = event.invitedIds ?? [];
  const [rsvp, setRsvp] = React.useState<'going' | 'cant' | null>(null);
  const [shareAllergies, setShareAllergies] = React.useState(false);
  const [allergies, setAllergies] = React.useState('');
  const [people, setPeople] = React.useState<'going' | 'invited' | null>(null);
  const [share, setShare] = React.useState(false);

  /** the address is the one thing that waits until you're on the list */
  const onTheList = rsvp === 'going' || event.role === 'going';

  return (
    <Screen>
      <ScreenHeader
        title="Event"
        onBack={onBack}
        trailing={
        <button
          type="button"
          onClick={() => setShare(true)}
          aria-label="Share this event"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
          
            <Share2Icon className="h-[17px] w-[17px]" strokeWidth={2.4} />
          </button>
        } />
      
      <ScreenBody>
        <Breathe>
          <Card className="overflow-hidden p-0">
            <div className="h-28">
              <CoverArt
                cover={event.cover ?? { kind: 'emoji', value: event.emoji }}
                accent={event.accent} />
              
            </div>
            <div className="p-4">
              {/* Date square + title sit together */}
              <div className="flex items-center gap-3">
                <span
                  aria-label={event.day}
                  className="flex h-14 w-14 shrink-0 flex-col items-center justify-center border-2 border-ink bg-surface"
                >
                  <span className="font-pixel text-[18px] leading-none text-ink">
                    {event.day.split(/\s+/).find((p) => /^\d{1,2}$/.test(p)) ?? ''}
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold uppercase text-ink-mute">
                    {event.day.split(/\s+/)[0]}
                  </span>
                </span>
                <h2 className="min-w-0 text-[22px] font-bold leading-tight tracking-tight text-ink">
                  {event.title}
                </h2>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Avatar name={host.name} emoji={host.emoji} accent={host.accent} size="sm" />
                <span className="min-w-0 text-[13px] font-semibold text-ink">
                  Hosted by {host.name}
                  {coHosts.length > 0 ? (
                    <span className="text-ink-mute">
                      {' '}
                      with {coHosts.map((p) => p.name.split(' ')[0]).join(' & ')}
                    </span>
                  ) : null}
                </span>
              </div>

              {/* Two wide pills — attribution lives in the people sheet */}
              <div className="mt-4 flex gap-2.5">
                <CountButton
                  value={event.goingIds.length}
                  label="going"
                  ids={event.goingIds}
                  onClick={() => setPeople('going')}
                />
                <CountButton
                  value={invited.length}
                  label="invited"
                  ids={invited}
                  onClick={() => setPeople('invited')}
                />
              </div>
            </div>
          </Card>
        </Breathe>

        <Breathe>
          <div className="mt-4 flex gap-2.5">
            <ButtonSecondary
              full
              size="md"
              tone="positive"
              onClick={() => setRsvp('going')}
              className={rsvp === 'going' ? 'bg-[#1F7A42] hover:bg-[#1F7A42]' : undefined}>
              
              {rsvp === 'going' ? "You're going ✓" : "I'm going"}
            </ButtonSecondary>
            <ButtonSecondary
              full
              size="md"
              tone={rsvp === 'cant' ? 'solid' : 'outline'}
              onClick={() => setRsvp('cant')}>
              
              Can't make it
            </ButtonSecondary>
          </div>
        </Breathe>

        {/* the details, plainly, in the order you'd ask them */}
        <Breathe>
          <section className="mt-6">
            <PixelHeading size="md" className="mb-3">
              The details
            </PixelHeading>

            <Card className="space-y-3.5">
              {event.bio &&
              <p className="text-[14px] font-semibold leading-relaxed text-ink">{event.bio}</p>
              }

              <dl className="space-y-3 border-t border-ink-line pt-3.5">
                <DetailRow
                  icon={<ClockIcon className="h-4 w-4" strokeWidth={2.4} />}
                  label="When"
                >
                  {event.day} at {event.time}
                  {/* Flip-tile countdown stand-in (live clock is in the mobile app) */}
                  <span
                    aria-label={event.countdown ?? 'Countdown'}
                    className="mt-2 flex max-w-[280px] gap-1.5"
                  >
                    {['2D', '17H', '40M', '37S'].map((tile) => (
                      <span
                        key={tile}
                        className="relative flex min-w-[44px] flex-1 flex-col items-center justify-center overflow-hidden rounded-[6px] bg-[#1C1B16] px-1.5 py-2"
                      >
                        <span className="absolute inset-x-0 top-1/2 h-px bg-white/15" />
                        <span className="font-pixel text-[15px] leading-none text-white">
                          {tile.slice(0, -1)}
                        </span>
                        <span className="mt-1 text-[9px] font-bold uppercase tracking-wide text-white/70">
                          {tile.slice(-1)}
                        </span>
                      </span>
                    ))}
                  </span>
                </DetailRow>

                <DetailRow
                  icon={<MapPinIcon className="h-4 w-4" strokeWidth={2.4} />}
                  label="Where">
                  
                  {event.place}
                  {event.address ?
                  onTheList ?
                  <span className="mt-0.5 block text-[13px] font-semibold text-ink-soft">
                        {event.address}
                      </span> :

                  <span className="mt-0.5 block text-[13px] font-semibold text-ink-mute">
                        Full address shows once you say you're going.
                      </span> :

                  null}
                </DetailRow>

                {event.bring &&
                <DetailRow
                  icon={<PackageIcon className="h-4 w-4" strokeWidth={2.4} />}
                  label="Bring">
                  
                    {event.bring}
                  </DetailRow>
                }

                {event.chipInAmount &&
                <DetailRow
                  icon={<HandCoinsIcon className="h-4 w-4" strokeWidth={2.4} />}
                  label="Chip in">
                  
                    {event.chipInAmount} each
                    <span className="mt-0.5 block text-[13px] font-semibold text-ink-soft">
                      {event.chipInMethod === 'Cash in person' ?
                    'Cash, in person' :
                    `${event.chipInMethod} to ${event.chipInHandle}`}
                    </span>
                    {event.chipInNote &&
                  <span className="mt-0.5 block text-[12px] font-medium text-ink-mute">
                        {event.chipInNote}
                      </span>
                  }
                  </DetailRow>
                }
              </dl>
            </Card>
          </section>
        </Breathe>

        <Breathe>
          <div className="mt-3 flex gap-2.5">
            <ButtonSecondary
              full
              size="md"
              icon={<CalendarPlusIcon className="h-4 w-4" strokeWidth={2.4} />}>
              
              Add to calendar
            </ButtonSecondary>
            <ButtonSecondary
              full
              size="md"
              icon={<Share2Icon className="h-4 w-4" strokeWidth={2.4} />}
              onClick={() => setShare(true)}>
              
              Share
            </ButtonSecondary>
          </div>
        </Breathe>

        <Breathe>
          <section className="mt-6">
            <PixelHeading size="md" className="mb-1.5">
              Allergies
            </PixelHeading>
            {/* the promise belongs above the control, not buried inside it */}
            <p className="mb-2.5 text-[12px] font-semibold text-ink-mute">
              {host.name.split(' ')[0]} only. Never other guests, never matching.
            </p>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] font-semibold text-ink">
                  Share food allergies with {host.name.split(' ')[0]}?
                </p>
                <Toggle
                  checked={shareAllergies}
                  onChange={setShareAllergies}
                  label="Share allergies" />
                
              </div>
              {shareAllergies &&
              <div className="mt-3">
                  <TextField
                  label="Allergies"
                  value={allergies}
                  onChange={setAllergies}
                  placeholder="Peanuts" />
                
                </div>
              }
            </Card>
          </section>
        </Breathe>

        <Breathe>
          <section className="mt-6">
            <PixelHeading size="md" className="mb-3">
              Who you should meet
            </PixelHeading>
            <div className="space-y-2.5">
              {MEET_SUGGESTIONS.map((s) => {
                const p = personById(s.personId);
                return (
                  <ListRow
                    key={s.personId}
                    leading={<Avatar name={p.name} emoji={p.emoji} accent={p.accent} />}
                    label={p.name}
                    sublabel={s.thread}
                    action={
                    <span className="flex items-center gap-2">
                        <Badge tone={s.status === 'going' ? 'active' : 'neutral'}>
                          {s.status === 'going' ? 'Going' : 'Invited'}
                        </Badge>
                        <ButtonSecondary size="sm" onClick={onOpenDiscover}>
                          Add
                        </ButtonSecondary>
                      </span>
                    } />);


              })}
            </div>
          </section>
        </Breathe>
      </ScreenBody>

      <EventPeopleSheet
        open={people !== null}
        initialTab={people ?? 'going'}
        goingIds={event.goingIds}
        invitedIds={invited}
        coHostIds={event.coHostIds}
        onClose={() => setPeople(null)} />
      
      <ShareEventSheet open={share} event={event} onClose={() => setShare(false)} />
    </Screen>);

}

/** Wide count pill — big display numeral, avatars, chevron into the list. */
export function CountButton({
  value,
  label,
  ids,
  onClick
}: {
  value: number;
  label: string;
  ids: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-ink bg-surface px-3.5 py-3 text-left transition-colors hover:bg-[#F1ECFF]"
    >
      <span className="font-pixel text-[28px] leading-none text-ink">{value}</span>
      <span className="text-[14px] font-bold italic text-ink">{label}</span>
      {ids.length > 0 ? (
        <span aria-hidden="true" className="ml-auto flex -space-x-2">
          {ids.slice(0, 3).map((id) => {
            const p = personById(id);
            return (
              <Avatar
                key={id}
                name={p.name}
                emoji={p.emoji}
                accent={p.accent}
                size="xs"
                className="ring-2 ring-surface"
              />
            );
          })}
        </span>
      ) : null}
      <ChevronRightIcon
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-ink-mute"
        strokeWidth={2.6}
      />
    </button>
  );
}


function DetailRow({
  icon,
  label,
  children




}: {icon: React.ReactNode;label: string;children: React.ReactNode;}) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">{label}</dt>
        <dd className="mt-0.5 text-[14px] font-bold leading-snug text-ink">{children}</dd>
      </span>
    </div>);

}