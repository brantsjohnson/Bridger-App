// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Friends tab roster. Loads people grouped by tier, and
// lets the screen move someone between circles without caring whether data is
// demo or live.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { Tier } from '@bridger/shared';
import {
  listRoster,
  moveTier,
  type MoveTierResult,
  type RosterSection
} from '../data/friends';

export function useFriends() {
  const [sections, setSections] = useState<RosterSection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (includeEmpty = false) => {
    setLoading(true);
    try {
      setSections(await listRoster({ includeEmpty }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  const onMoveTier = useCallback(
    async (personId: string, tier: Tier, editing = false): Promise<MoveTierResult> => {
      const result = await moveTier(personId, tier);
      setSections(await listRoster({ includeEmpty: editing }));
      return result;
    },
    []
  );

  const total = sections.reduce((n, s) => n + s.people.length, 0);

  return { sections, total, loading, refresh, onMoveTier };
}
