import React from 'react';
import { PlusIcon } from 'lucide-react';
import { EventRole, GrassSignal } from '../../../../packages/shared';
import {
  Breathe,
  ButtonSecondary,
  EmptyState,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader } from
'../../../../packages/ui';
import { EventCard } from '../../components/EventCard';
import { CreateEventSheet } from '../../components/CreateEventSheet';
import { TouchGrassButton } from '../../components/TouchGrassButton';
import { TouchGrassSheet } from '../../components/TouchGrassSheet';
import { FreeNowStrip } from '../../components/FreeNowStrip';
import { FreeSignalCard } from '../../components/FreeSignalCard';
import { GrassSignalSheet } from '../../components/GrassSignalSheet';
import { EVENTS, FREE_SIGNALS } from '../../state/mock-data';

const SECTIONS: Array<{role: EventRole;label: string;}> = [
{ role: 'host', label: 'Hosting' },
{ role: 'going', label: 'Going' },
{ role: 'invited', label: 'Invited' }];


export function EventsScreen({
  empty = false,
  onOpenEvent,
  onOpenHost,
  onOpenThread







}: { /** day one: nothing on the calendar */empty?: boolean;onOpenEvent?: (id: string) => void;onOpenHost?: (id: string) => void; /** saying "I'm in" drops you into the thread to coordinate */onOpenThread?: () => void;}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [rsvp, setRsvp] = React.useState<Record<string, 'going' | 'cant'>>({});
  const [grassOpen, setGrassOpen] = React.useState(false);
  const [live, setLive] = React.useState(false);
  const [signals, setSignals] = React.useState<GrassSignal[]>(empty ? [] : FREE_SIGNALS);
  const [openSignal, setOpenSignal] = React.useState<GrassSignal | null>(null);

  return (
    <Screen>
      <ScreenHeader
        title="Events"
        trailing={
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          aria-label="Create event"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
          
            <PlusIcon className="h-[18px] w-[18px]" strokeWidth={2.6} />
          </button>
        } />
      
      <ScreenBody>
        {/* wanting to do something is the fastest thing on this page */}
        <Breathe>
          <section className="!mt-0">
            {live ?
            <FreeNowStrip when="Tonight" inIds={['maya', 'devon']} onEnd={() => setLive(false)} /> :

            <TouchGrassButton live={false} inIds={[]} onOpen={() => setGrassOpen(true)} />
            }
          </section>
        </Breathe>

        {/* everyone who's free lives here — Home only ever shows the newest one */}
        {signals.length > 0 &&
        <Breathe>
            <section className="mt-5">
              <PixelHeading size="md" className="mb-2">
                Who's free
              </PixelHeading>
              <div className="space-y-2.5">
                {signals.map((s) =>
              <FreeSignalCard
                key={s.id}
                signal={s}
                burstOnMount={false}
                onOpen={() => setOpenSignal(s)}
                onJoined={() => onOpenThread?.()}
                onDismiss={() => setSignals((p) => p.filter((x) => x.id !== s.id))} />

              )}
              </div>
            </section>
          </Breathe>
        }

        {empty &&
        <Breathe>
            <div className="mt-7">
              <EmptyState
              emoji="📅"
              line="Nothing on the calendar. Host something small, even two people counts."
              action={
              <ButtonSecondary size="sm" tone="solid" onClick={() => setCreateOpen(true)}>
                    Create an event
                  </ButtonSecondary>
              } />
            
            </div>
          </Breathe>
        }

        {SECTIONS.map(({ role, label }) => {
          const list = empty ? [] : EVENTS.filter((e) => e.role === role);
          if (list.length === 0) return null;
          return (
            <Breathe key={role}>
              <section className="mt-7">
                <PixelHeading size="md" className="mb-2">
                  {label}
                </PixelHeading>
                <div className="space-y-3">
                  {list.map((e) =>
                  <EventCard
                    key={e.id}
                    event={e}
                    rsvp={rsvp[e.id]}
                    onRsvp={(id, status) => setRsvp((p) => ({ ...p, [id]: status }))}
                    onOpen={(id) => role === 'host' ? onOpenHost?.(id) : onOpenEvent?.(id)} />

                  )}
                </div>
              </section>
            </Breathe>);

        })}

        <Breathe>
          <section className="mt-7">
            <PixelHeading size="md" className="mb-2">
              Community
            </PixelHeading>
            <EmptyState emoji="🏘️" line="Coming soon." />
          </section>
        </Breathe>
      </ScreenBody>

      <CreateEventSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <TouchGrassSheet
        open={grassOpen}
        onClose={() => setGrassOpen(false)}
        onSend={() => {
          setLive(true);
          setGrassOpen(false);
        }} />
      
      <GrassSignalSheet
        signal={openSignal}
        onClose={() => setOpenSignal(null)}
        onJoin={() => {
          setOpenSignal(null);
          onOpenThread?.();
        }} />
      
    </Screen>);

}