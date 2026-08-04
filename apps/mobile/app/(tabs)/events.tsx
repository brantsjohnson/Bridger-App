// ============================================
// WHAT THIS FILE DOES (plain English):
// The Events tab — ported from Magic Patterns. Top: Touch Grass (send you're
// free), with a "Touch grass" title that explains who shows up beneath the
// button, then friends' signals under it. Then your calendar by role
// (Hosting / Going / Invited) and a Community "coming soon" slot. Data comes
// from hooks so demo fixtures and the live API use the same screen.
// Analytics: surface=events; create / event cards / Touch Grass use EVENTS.*.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import type { EventRole, GrassSignal } from '@bridger/shared';
import { EVENTS, HOME, openSurface, trackProduct } from '@bridger/shared';
import {
  ButtonSecondary,
  EmptyState,
  Screen,
  ScreenBody,
  ScreenHeader,
  SectionTitle,
  withAnalyticsPress
} from '@bridger/ui';
import { EventCard } from '../../components/EventCard';
import { FreeNowStrip } from '../../components/FreeNowStrip';
import { FreeSignalCard } from '../../components/FreeSignalCard';
import { GrassSignalSheet } from '../../components/GrassSignalSheet';
import { TouchGrassButton } from '../../components/TouchGrassButton';
import { TouchGrassSheet } from '../../components/TouchGrassSheet';
import { startThreadWith } from '../../data/messages';
import { useEventsFeed } from '../../hooks/useEventsFeed';
import { useTouchGrass } from '../../hooks/useTouchGrass';

const SECTIONS: Array<{
  role: EventRole;
  label: string;
  description: string;
  section: 'hosting' | 'going' | 'invited';
  infoAnalyticsId: string;
}> = [
  {
    role: 'host',
    label: 'Hosting',
    description: "Events you're running. Tap one to manage details and see who's coming.",
    section: 'hosting',
    infoAnalyticsId: EVENTS.hosting.info
  },
  {
    role: 'going',
    label: 'Going',
    description: 'Events you said yes to. Tap one for details and updates.',
    section: 'going',
    infoAnalyticsId: EVENTS.going.info
  },
  {
    role: 'invited',
    label: 'Invited',
    description: "Events you've been asked to. RSVP so the host has a headcount.",
    section: 'invited',
    infoAnalyticsId: EVENTS.invited.info
  }
];

export default function EventsScreen() {
  const router = useRouter();
  const { events, onRsvp } = useEventsFeed();
  const { signals, myLive, onSend, onJoin, onDismiss, onEndMine } = useTouchGrass();

  const [rsvp, setRsvp] = useState<Record<string, 'going' | 'cant'>>({});
  const [grassOpen, setGrassOpen] = useState(false);
  const [openSignal, setOpenSignal] = useState<GrassSignal | null>(null);

  // Mark Events as the active analytics surface.
  useEffect(() => {
    openSurface('events');
  }, []);

  const empty = events.length === 0 && signals.length === 0 && !myLive;

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Events"
        titleAnalyticsId={EVENTS.list.page_title}
        profileAnalyticsId={EVENTS.list.profile_icon}
        trailing={
          <Pressable
            onPress={withAnalyticsPress(EVENTS.list.create, () => router.push('/event/create'))}
            accessibilityRole="button"
            accessibilityLabel="Create event"
            className="h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-90"
          >
            <PlusIcon size={18} color="#FFFFFF" strokeWidth={2.6} />
          </Pressable>
        }
      />

      <ScreenBody>
        {/* Touch grass title explains the button + who appears underneath */}
        <View>
          <SectionTitle
            title="Touch grass"
            description="Tap the button to tell your circle you're free. Friends who are also free show up right here."
            infoAnalyticsId={EVENTS.touch_grass.info}
            parentScreen="events"
            section="touch_grass"
            className="mb-2"
          />
          {myLive ? (
            <FreeNowStrip when={myLive.when} inIds={myLive.inIds} onEnd={() => void onEndMine()} />
          ) : (
            <TouchGrassButton live={false} inIds={[]} onOpen={() => setGrassOpen(true)} />
          )}

          {signals.length > 0 ? (
            <View className="mt-3 gap-2.5">
              {signals.map((s, i) => (
                <FreeSignalCard
                  key={s.id}
                  signal={s}
                  burstOnMount={false}
                  analyticsIds={{
                    card:
                      i === 0
                        ? EVENTS.touch_grass.featured_signal
                        : EVENTS.touch_grass.signal_row,
                    imIn: HOME.announcements.touch_grass_im_in,
                    details: HOME.announcements.touch_grass_details,
                    dismiss: HOME.announcements.touch_grass_dismiss
                  }}
                  onOpen={() => setOpenSignal(s)}
                  onJoined={() => {
                    void onJoin(s.id);
                    void (async () => {
                      const id = await startThreadWith(s.personId);
                      router.push({
                        pathname: '/messages/[id]',
                        params: { id, seed: "I'm in" }
                      });
                    })();
                  }}
                  onDismiss={() => void onDismiss(s.id)}
                />
              ))}
            </View>
          ) : null}
        </View>

        {empty ? (
          <View className="mt-7">
            <EmptyState
              emoji="📅"
              line="Nothing on the calendar. Host something small, even two people counts."
              action={
                <ButtonSecondary
                  size="sm"
                  tone="solid"
                  analyticsId={EVENTS.list.create}
                  onPress={() => router.push('/event/create')}
                >
                  Create an event
                </ButtonSecondary>
              }
            />
          </View>
        ) : null}

        {SECTIONS.map(({ role, label, description, section, infoAnalyticsId }) => {
          const list = events.filter((e) => e.role === role);
          if (list.length === 0) return null;
          return (
            <View key={role} className="mt-7">
              <SectionTitle
                title={label}
                description={description}
                infoAnalyticsId={infoAnalyticsId}
                parentScreen="events"
                section={section}
                className="mb-2"
              />
              <View className="gap-3">
                {list.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    rsvp={rsvp[e.id]}
                    onRsvp={(id, status) => {
                      setRsvp((p) => ({ ...p, [id]: status }));
                      void onRsvp(id, status);
                      // Product outcome for the RSVP (separate from the button click).
                      trackProduct(status === 'going' ? 'rsvp_going' : 'rsvp_cant');
                    }}
                    onOpen={() => router.push(`/event/${e.id}`)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <View className="mt-7">
          <SectionTitle
            title="Community"
            description="Public events around you. Coming soon."
            infoAnalyticsId={EVENTS.community.info}
            parentScreen="events"
            section="community"
            className="mb-2"
          />
          <EmptyState emoji="🏘️" line="Coming soon." />
        </View>
      </ScreenBody>

      <TouchGrassSheet
        open={grassOpen}
        parentScreen="events"
        onClose={() => setGrassOpen(false)}
        onSend={(input) => {
          void onSend(input);
          setGrassOpen(false);
        }}
      />
      <GrassSignalSheet
        signal={openSignal}
        parentScreen="events"
        onClose={() => setOpenSignal(null)}
        onDecline={(id) => void onDismiss(id)}
        onJoin={() => {
          if (openSignal) {
            const personId = openSignal.personId;
            void onJoin(openSignal.id);
            trackProduct('touch_grass_answered');
            setOpenSignal(null);
            void (async () => {
              const id = await startThreadWith(personId);
              router.push({
                pathname: '/messages/[id]',
                params: { id, seed: "I'm in" }
              });
            })();
            return;
          }
          setOpenSignal(null);
        }}
      />
    </Screen>
  );
}
