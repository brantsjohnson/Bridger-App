import React from 'react';
import {
  ChevronRightIcon,
  HandCoinsIcon,
  MapPinIcon,
  Share2Icon,
  UserPlusIcon } from
'lucide-react';
import { EventItem } from '../../../../packages/shared';
import {
  Avatar,
  Breathe,
  ButtonSecondary,
  Card,
  Chip,
  CoverArt,
  ListRow,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  Toggle } from
'../../../../packages/ui';
import { EditEventSheet, EventEdits } from '../../components/event/EditEventSheet';
import { EventPeopleSheet } from '../../components/event/EventPeopleSheet';
import { AddCoHostSheet, ShareEventSheet } from '../../components/event/ShareEventSheet';
import { CountButton } from './detail';
import { EVENTS, INTRODUCTIONS, SHARED_ALLERGIES, personById } from '../../state/mock-data';

/** Host dashboard — edit it, see who's coming, set the chip-in, add a co-host. */
export function EventHostScreen({
  eventId = 'e1',
  onBack



}: {eventId?: string;onBack?: () => void;}) {
  const base = EVENTS.find((e) => e.id === eventId) ?? EVENTS[0];
  const [event, setEvent] = React.useState<EventItem>(base);
  const [editing, setEditing] = React.useState(false);
  const [people, setPeople] = React.useState<'going' | 'invited' | null>(null);
  const [share, setShare] = React.useState(false);
  const [coHostOpen, setCoHostOpen] = React.useState(false);
  const [twoDays, setTwoDays] = React.useState(true);
  const [twoHours, setTwoHours] = React.useState(true);

  const invited = event.invitedIds ?? [];
  const coHosts = (event.coHostIds ?? []).map(personById);
  const going = event.goingIds.map(personById);
  /** only what's useful to the host: who you already know, and who's worth meeting */
  const toMeet = going.filter((p) => p.tier === 'none');

  const applyEdits = (edits: EventEdits) => {
    setEvent((e) => ({ ...e, ...edits }));
    setEditing(false);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Hosting"
        onBack={onBack}
        trailing={
        <span className="flex items-center gap-2">
            <ButtonSecondary size="sm" onClick={() => setEditing(true)}>
              Edit
            </ButtonSecondary>
            <button
            type="button"
            onClick={() => setShare(true)}
            aria-label="Share this event"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
            
              <Share2Icon className="h-[17px] w-[17px]" strokeWidth={2.4} />
            </button>
          </span>
        } />
      
      <ScreenBody>
        <Breathe>
          <Card className="overflow-hidden p-0">
            <div className="h-24">
              <CoverArt
                cover={event.cover ?? { kind: 'emoji', value: event.emoji }}
                accent={event.accent} />
              
            </div>
            <div className="p-4">
              <h2 className="text-[20px] font-bold tracking-tight text-ink">{event.title}</h2>
              <p className="mt-1 text-[13px] font-semibold text-ink-soft">
                {event.day} · {event.time} · {event.place}
              </p>
              {event.address &&
              <p className="mt-1.5 flex items-start gap-1.5 text-[12px] font-semibold text-ink-mute">
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                  {event.address}
                </p>
              }

              {/* the counts open — a number alone never answers "who?" */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <CountButton
                  value={going.length}
                  label="going"
                  ids={event.goingIds}
                  onClick={() => setPeople('going')} />
                
                <CountButton
                  value={invited.length}
                  label="invited"
                  ids={invited}
                  onClick={() => setPeople('invited')} />
                
              </div>
            </div>
          </Card>
        </Breathe>

        {/* money first — nobody should have to ask how to send it */}
        <Breathe>
          <section className="mt-6">
            <PixelHeading size="md" className="mb-1.5">
              Chipping in
            </PixelHeading>
            <p className="mb-2.5 text-[12px] font-semibold text-ink-mute">
              Guests pay you directly. We never touch it and never take a cut.
            </p>
            <Card>
              {event.chipInAmount ?
              <div className="flex items-start gap-3">
                  <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DFF3E4] text-success">
                  
                    <HandCoinsIcon className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold text-ink">
                      {event.chipInAmount} per person
                    </span>
                    <span className="block text-[13px] font-semibold text-ink-soft">
                      {event.chipInMethod === 'Cash in person' ?
                    'Cash, in person' :
                    `${event.chipInMethod} to ${event.chipInHandle}`}
                    </span>
                    {event.chipInNote &&
                  <span className="mt-1 block text-[12px] font-medium text-ink-mute">
                        {event.chipInNote}
                      </span>
                  }
                  </span>
                  <ButtonSecondary size="sm" onClick={() => setEditing(true)}>
                    Change
                  </ButtonSecondary>
                </div> :

              <ButtonSecondary full size="md" onClick={() => setEditing(true)}>
                  Ask guests to chip in
                </ButtonSecondary>
              }
            </Card>
          </section>
        </Breathe>

        <Breathe>
          <section className="mt-6">
            <PixelHeading size="md" className="mb-3">
              Co-hosts
            </PixelHeading>
            <button
              type="button"
              onClick={() => setCoHostOpen(true)}
              className="flex w-full items-center gap-3 rounded-card border border-ink-line bg-white px-3.5 py-3 text-left transition-colors hover:bg-[#F1ECFF]">
              
              {coHosts.length > 0 ?
              <>
                  <span aria-hidden="true" className="flex -space-x-2">
                    {coHosts.map((p) =>
                  <Avatar
                    key={p.id}
                    name={p.name}
                    emoji={p.emoji}
                    accent={p.accent}
                    size="sm"
                    className="-ml-1 first:ml-0" />

                  )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-ink">
                      {coHosts.map((p) => p.name.split(' ')[0]).join(' & ')}
                    </span>
                    <span className="block text-[12px] font-semibold text-ink-mute">
                      Can edit and invite
                    </span>
                  </span>
                </> :

              <>
                  <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1ECFF] text-purple">
                  
                    <UserPlusIcon className="h-[18px] w-[18px]" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-bold text-ink-soft">
                    Add a co-host
                  </span>
                </>
              }
              <ChevronRightIcon
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-ink-mute"
                strokeWidth={2.6} />
              
            </button>
          </section>
        </Breathe>

        <Breathe>
          <section className="mt-6">
            <PixelHeading size="md" className="mb-3">
              Who's coming
            </PixelHeading>
            <div className="space-y-2.5">
              {going.map((p) =>
              <ListRow
                key={p.id}
                leading={<Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />}
                label={p.name}
                sublabel={p.tier === 'none' ? 'Worth meeting' : `${p.mutuals} mutual friends`} />

              )}
            </div>
            {toMeet.length > 0 &&
            <p className="mt-2.5 text-[12px] font-semibold text-ink-mute">
                {toMeet.length} of them you haven't met yet.
              </p>
            }
          </section>
        </Breathe>

        <Breathe>
          <section className="mt-6">
            <PixelHeading size="md" className="mb-3">
              Introductions
            </PixelHeading>
            <div className="space-y-2.5">
              {INTRODUCTIONS.map((i) => {
                const a = personById(i.a);
                const b = personById(i.b);
                return (
                  <Card key={`${i.a}-${i.b}`} className="flex items-center gap-3">
                    <span className="flex items-center">
                      <Avatar name={a.name} emoji={a.emoji} accent={a.accent} size="sm" />
                      <span className="-ml-2">
                        <Avatar name={b.name} emoji={b.emoji} accent={b.accent} size="sm" />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold text-ink">
                        {a.name.split(' ')[0]} & {b.name.split(' ')[0]}
                      </span>
                      <span className="block text-[12px] font-medium text-ink-mute">{i.why}</span>
                    </span>
                  </Card>);

              })}
            </div>
          </section>
        </Breathe>

        <Breathe>
          <section className="mt-6">
            <PixelHeading size="md" className="mb-1.5">
              Allergies
            </PixelHeading>
            {/* the promise sits under the header, not inside the box */}
            <p className="mb-2.5 text-[12px] font-semibold text-ink-mute">
              Only you can see these.
            </p>
            <Card>
              <div className="flex flex-wrap gap-2">
                {SHARED_ALLERGIES.map((a) =>
                <Chip key={a} label={a} accent="coral" selected size="sm" />
                )}
              </div>
            </Card>
          </section>
        </Breathe>

        <Breathe>
          <section className="mt-6 space-y-2.5">
            <PixelHeading size="md" className="mb-3">
              Reminders
            </PixelHeading>
            <ListRow
              label="Remind 2 days before"
              action={
              <Toggle checked={twoDays} onChange={setTwoDays} label="Remind 2 days before" />
              } />
            
            <ListRow
              label="Remind 2 hours before"
              action={
              <Toggle checked={twoHours} onChange={setTwoHours} label="Remind 2 hours before" />
              } />
            
          </section>
        </Breathe>
      </ScreenBody>

      <EditEventSheet
        open={editing}
        event={event}
        onClose={() => setEditing(false)}
        onSave={applyEdits} />
      
      <EventPeopleSheet
        open={people !== null}
        initialTab={people ?? 'going'}
        goingIds={event.goingIds}
        invitedIds={invited}
        coHostIds={event.coHostIds}
        onClose={() => setPeople(null)} />
      
      <AddCoHostSheet
        open={coHostOpen}
        goingIds={event.goingIds}
        coHostIds={event.coHostIds ?? []}
        onClose={() => setCoHostOpen(false)}
        onSave={(ids) => {
          setEvent((e) => ({ ...e, coHostIds: ids }));
          setCoHostOpen(false);
        }} />
      
      <ShareEventSheet open={share} event={event} onClose={() => setShare(false)} />
    </Screen>);

}