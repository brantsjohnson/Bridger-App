// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Events tab. Loads the calendar once, then lets the screen
// create events and RSVP without caring whether data is demo or live.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { EventItem } from '@bridger/shared';
import {
  createEvent,
  listEvents,
  rsvpEvent,
  type CreateEventInput
} from '../data/events';

export function useEventsFeed() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await listEvents());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onCreate = useCallback(async (input: CreateEventInput) => {
    await createEvent(input);
    setEvents(await listEvents());
  }, []);

  const onRsvp = useCallback(async (id: string, status: 'going' | 'cant') => {
    await rsvpEvent(id, status);
    setEvents(await listEvents());
  }, []);

  return { events, loading, refresh, onCreate, onRsvp };
}
