// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Inside Jokes wall on Friends (and later Profile). Loads
// sticky-note quotes and lets you post a new one.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { InsideJoke } from '@bridger/shared';
import {
  addInsideJoke,
  countInsideJokes,
  listInsideJokes,
  type AddInsideJokeInput,
  type InsideJokeFilter
} from '../data/insideJokes';

export function useInsideJokes(initialFilter: InsideJokeFilter = 'all') {
  const [filter, setFilter] = useState<InsideJokeFilter>(initialFilter);
  const [jokes, setJokes] = useState<InsideJoke[]>([]);
  const [counts, setCounts] = useState<Record<InsideJokeFilter, number>>({
    all: 0,
    about: 0,
    by: 0
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (f: InsideJokeFilter = filter) => {
    setLoading(true);
    try {
      const [list, c] = await Promise.all([listInsideJokes(f), countInsideJokes()]);
      setJokes(list);
      setCounts(c);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void refresh(filter);
  }, [filter, refresh]);

  const onAdd = useCallback(
    async (input: AddInsideJokeInput) => {
      await addInsideJoke(input);
      // Stay on the current filter so the Friends preview (all) updates;
      // Profile wall can flip to "by" itself after posting.
      setJokes(await listInsideJokes(filter));
      setCounts(await countInsideJokes());
    },
    [filter]
  );

  return { jokes, counts, filter, setFilter, loading, refresh, onAdd };
}
