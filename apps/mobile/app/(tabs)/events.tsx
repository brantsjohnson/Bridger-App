// ============================================
// WHAT THIS FILE DOES (plain English):
// The Events tab — ported from Magic Patterns. Top: Touch Grass (send you're
// free). Then who's free. Then your calendar by role (Hosting / Going /
// Invited) and a Community "coming soon" slot. Data comes from hooks so demo
// fixtures and the live API use the same screen.
// ============================================
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import type { EventRole, GrassSignal } from '@bridger/shared';
import {
  ButtonSecondary,
  EmptyState,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader
} from '@bridger/ui';
import { CreateEventSheet } from '../../components/CreateEventSheet';
import { EventCard } from '../../components/EventCard';
import { FreeNowStrip } from '../../components/FreeNowStrip';
import { FreeSignalCard } from '../../components/FreeSignalCard';
import { GrassSignalSheet } from '../../components/GrassSignalSheet';
import { TouchGrassButton } from '../../components/TouchGrassButton';
import { TouchGrassSheet } from '../../components/TouchGrassSheet';
import { useEventsFeed } from '../../hooks/useEventsFeed';
import { useTouchGrass } from '../../hooks/useTouchGrass';

const SECTIONS: Array<{ role: EventRole; label: string }> = [
  { role: 'host', label: 'Hosting' },
  { role: 'going', label: 'Going' },
  { role: 'invited', label: 'Invited' }
];

export default function EventsScreen() {
  const { events, onCreate, onRsvp } = useEventsFeed();
  const { signals, myLive, onSend, onJoin, onDismiss, onEndMine } = useTouchGrass();

  const [createOpen, setCreateOpen] = useState(false);
  const [rsvp, setRsvp] = useState<Record<string, 'going' | 'cant'>>({});
  const [grassOpen, setGrassOpen] = useState(false);
  const [openSignal, setOpenSignal] = useState<GrassSignal | null>(null);

  const empty = events.length === 0 && signals.length === 0 && !myLive;

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Events"
        messagesDormant
        trailing={
          <Pressable
            onPress={() => setCreateOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Create event"
            className="h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-90"
          >
            <PlusIcon size={18} color="#FFFFFF" strokeWidth={2.6} />
          </Pressable>
        }
      />

      <ScreenBody>
        {/* wanting to do something is the fastest thing on this page */}
        <View>
          {myLive ? (
            <FreeNowStrip when={myLive.when} inIds={myLive.inIds} onEnd={() => void onEndMine()} />
          ) : (
            <TouchGrassButton live={false} inIds={[]} onOpen={() => setGrassOpen(true)} />
          )}
        </View>

        {/* everyone who's free — Home only ever shows the newest one */}
        {signals.length > 0 ? (
          <View className="mt-5">
            <PixelHeading size="md" className="mb-2">
              Who's free
            </PixelHeading>
            <View className="gap-2.5">
              {signals.map((s) => (
                <FreeSignalCard
                  key={s.id}
                  signal={s}
                  burstOnMount={false}
                  onOpen={() => setOpenSignal(s)}
                  onJoined={() => {
                    void onJoin(s.id);
                    Alert.alert("You're in", 'Messages will open here when chat ships.');
                  }}
                  onDismiss={() => void onDismiss(s.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {empty ? (
          <View className="mt-7">
            <EmptyState
              emoji="📅"
              line="Nothing on the calendar. Host something small, even two people counts."
              action={
                <ButtonSecondary size="sm" tone="solid" onPress={() => setCreateOpen(true)}>
                  Create an event
                </ButtonSecondary>
              }
            />
          </View>
        ) : null}

        {SECTIONS.map(({ role, label }) => {
          const list = events.filter((e) => e.role === role);
          if (list.length === 0) return null;
          return (
            <View key={role} className="mt-7">
              <PixelHeading size="md" className="mb-2">
                {label}
              </PixelHeading>
              <View className="gap-3">
                {list.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    rsvp={rsvp[e.id]}
                    onRsvp={(id, status) => {
                      setRsvp((p) => ({ ...p, [id]: status }));
                      void onRsvp(id, status);
                    }}
                    onOpen={() =>
                      Alert.alert(
                        role === 'host' ? 'Host view' : 'Event',
                        'Event detail ships next.'
                      )
                    }
                  />
                ))}
              </View>
            </View>
          );
        })}

        <View className="mt-7">
          <PixelHeading size="md" className="mb-2">
            Community
          </PixelHeading>
          <EmptyState emoji="🏘️" line="Coming soon." />
        </View>
      </ScreenBody>

      <CreateEventSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={onCreate}
      />
      <TouchGrassSheet
        open={grassOpen}
        onClose={() => setGrassOpen(false)}
        onSend={(input) => {
          void onSend(input);
          setGrassOpen(false);
        }}
      />
      <GrassSignalSheet
        signal={openSignal}
        onClose={() => setOpenSignal(null)}
        onJoin={() => {
          if (openSignal) void onJoin(openSignal.id);
          setOpenSignal(null);
          Alert.alert("You're in", 'Messages will open here when chat ships.');
        }}
      />
    </Screen>
  );
}
