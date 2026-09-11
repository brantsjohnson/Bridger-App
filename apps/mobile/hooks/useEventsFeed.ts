// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Events tab. Loads the calendar, then lets the screen
// create events and RSVP without caring whether data is demo or live.
// Shows the last calendar right away, then quietly refreshes when you
// land on Events so a new event you just made still shows up.
// ============================================
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { EventItem } from '@bridger/shared';
import {
  createEvent,
  listEvents,
  rsvpEvent,
  type CreateEventInput
} from '../data/events';
import { getTabSnapshot, setTabSnapshot } from '../lib/tab-snapshots';

const SNAP_KEY = 'events';

export function useEventsFeed() {
  const cached = getTabSnapshot<EventItem[]>(SNAP_KEY);
  const [events, setEvents] = useState<EventItem[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async () => {
    const hadCache = Boolean(getTabSnapshot<EventItem[]>(SNAP_KEY));
    if (!hadCache) setLoading(true);
    try {
      const next = await listEvents();
      setEvents(next);
      setTabSnapshot(SNAP_KEY, next);
    } finally {
      setLoading(false);
    }
  }, []);

  // THIS SECTION DOES: quietly refetch when you land on Events (or Home,
  // which also uses this hook for "this week"). Never blank the list first.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const onCreate = useCallback(async (input: CreateEventInput) => {
    await createEvent(input);
    const next = await listEvents();
    setEvents(next);
    setTabSnapshot(SNAP_KEY, next);
  }, []);

  const onRsvp = useCallback(async (id: string, status: 'going' | 'cant') => {
    await rsvpEvent(id, status);
    const next = await listEvents();
    setEvents(next);
    setTabSnapshot(SNAP_KEY, next);
  }, []);

  return { events, loading, refresh, onCreate, onRsvp };
}
