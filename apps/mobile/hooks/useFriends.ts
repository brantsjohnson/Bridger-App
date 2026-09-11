// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Friends tab roster. Loads people grouped by tier, and
// lets the screen move someone between circles without caring whether data
// is demo or live. Shows the last roster right away, then quietly refreshes.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { Tier } from '@bridger/shared';
import {
  listRoster,
  moveTier,
  type MoveTierResult,
  type RosterSection
} from '../data/friends';
import { getTabSnapshot, setTabSnapshot } from '../lib/tab-snapshots';

const SNAP_KEY = 'friends';

export function useFriends() {
  const cached = getTabSnapshot<RosterSection[]>(SNAP_KEY);
  const [sections, setSections] = useState<RosterSection[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async (includeEmpty = false) => {
    const hadCache = Boolean(getTabSnapshot<RosterSection[]>(SNAP_KEY));
    if (!hadCache) setLoading(true);
    try {
      const next = await listRoster({ includeEmpty });
      setSections(next);
      // Edit-mode empty drop zones are a temporary view, not the saved roster.
      if (!includeEmpty) setTabSnapshot(SNAP_KEY, next);
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
      const next = await listRoster({ includeEmpty: editing });
      setSections(next);
      if (!editing) setTabSnapshot(SNAP_KEY, next);
      return result;
    },
    []
  );

  const total = sections.reduce((n, s) => n + s.people.length, 0);

  return { sections, total, loading, refresh, onMoveTier };
}
