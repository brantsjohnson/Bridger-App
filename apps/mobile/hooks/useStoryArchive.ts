// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Stories tab calendar: which days this month had a story,
// plus the storage state that drives the bar under the calendar.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import { getStorageState, listStoryDays, type StorageState } from '../data/profile';

export function useStoryArchive() {
  const [days, setDays] = useState<Record<number, string>>({});
  const [storage, setStorage] = useState<StorageState>({ usedPct: 0, plan: 'free' });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (month?: string) => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([listStoryDays(month), getStorageState()]);
      setDays(d);
      setStorage(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { days, storage, loading, refresh };
}
