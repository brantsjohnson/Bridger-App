// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Stories tab calendar: which days this month had a story,
// plus the storage state that drives the bar under the calendar.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import {
  emptyStorageState,
  getStorageState,
  listStoryDays,
  type StorageState
} from '../data/profile';
import { getTabSnapshot, setTabSnapshot } from '../lib/tab-snapshots';

type ArchiveSnap = {
  days: Record<number, string>;
  storage: StorageState;
};

const SNAP_KEY = 'archive';

export function useStoryArchive() {
  const cached = getTabSnapshot<ArchiveSnap>(SNAP_KEY);
  const [days, setDays] = useState<Record<number, string>>(cached?.days ?? {});
  const [storage, setStorage] = useState<StorageState>(
    cached?.storage ?? emptyStorageState
  );
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async (month?: string) => {
    const hadCache = Boolean(getTabSnapshot<ArchiveSnap>(SNAP_KEY));
    if (!hadCache) setLoading(true);
    try {
      const [d, s] = await Promise.all([listStoryDays(month), getStorageState()]);
      setDays(d);
      setStorage(s);
      setTabSnapshot<ArchiveSnap>(SNAP_KEY, { days: d, storage: s });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { days, storage, loading, refresh };
}
