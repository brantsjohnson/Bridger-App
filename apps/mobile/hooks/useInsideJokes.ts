// ============================================
// WHAT THIS FILE DOES (plain English):
// Loads the Inside Jokes wall for Friends or one person's Profile. When
// anyone posts a note, every open wall refreshes so Friends and Profile
// stay in sync.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { InsideJoke } from '@bridger/shared';
import {
  addInsideJoke,
  countInsideJokes,
  listInsideJokes,
  subscribeInsideJokes,
  type AddInsideJokeInput,
  type InsideJokeFilter
} from '../data/insideJokes';
import { getTabSnapshot, setTabSnapshot } from '../lib/tab-snapshots';

type JokesSnap = {
  jokes: InsideJoke[];
  counts: Record<InsideJokeFilter, number>;
};

function jokesSnapKey(personId: string, filter: InsideJokeFilter): string {
  return `jokes:${personId}:${filter}`;
}

export function useInsideJokes(
  initialFilter: InsideJokeFilter = 'all',
  personId = 'me'
) {
  const [filter, setFilter] = useState<InsideJokeFilter>(initialFilter);
  const cached = getTabSnapshot<JokesSnap>(jokesSnapKey(personId, initialFilter));
  const [jokes, setJokes] = useState<InsideJoke[]>(cached?.jokes ?? []);
  const [counts, setCounts] = useState<Record<InsideJokeFilter, number>>(
    cached?.counts ?? {
      all: 0,
      about: 0,
      by: 0
    }
  );
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(
    async (f: InsideJokeFilter = filter) => {
      const key = jokesSnapKey(personId, f);
      const hadCache = Boolean(getTabSnapshot<JokesSnap>(key));
      if (!hadCache) setLoading(true);
      try {
        const [list, c] = await Promise.all([
          listInsideJokes(f, personId),
          countInsideJokes(personId)
        ]);
        setJokes(list);
        setCounts(c);
        setTabSnapshot<JokesSnap>(key, { jokes: list, counts: c });
      } finally {
        setLoading(false);
      }
    },
    [filter, personId]
  );

  useEffect(() => {
    void refresh(filter);
  }, [filter, refresh]);

  useEffect(() => subscribeInsideJokes(() => {
    void refresh(filter);
  }), [filter, refresh]);

  const onAdd = useCallback(
    async (input: AddInsideJokeInput) => {
      await addInsideJoke(input);
      await refresh(filter);
    },
    [filter, refresh]
  );

  return { jokes, counts, filter, setFilter, loading, refresh, onAdd };
}
