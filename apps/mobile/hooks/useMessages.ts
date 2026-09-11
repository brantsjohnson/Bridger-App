// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Messages inbox list. Loads conversations and filters
// them by the Find-a-friend search box. Screens never import fixtures.
// ============================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listThreads, type ThreadRow } from '../data/messages';
import { getTabSnapshot, setTabSnapshot } from '../lib/tab-snapshots';

const SNAP_KEY = 'messages';

export function useMessages() {
  const cached = getTabSnapshot<ThreadRow[]>(SNAP_KEY);
  const [threads, setThreads] = useState<ThreadRow[]>(cached ?? []);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async () => {
    const hadCache = Boolean(getTabSnapshot<ThreadRow[]>(SNAP_KEY));
    if (!hadCache) setLoading(true);
    try {
      const next = await listThreads();
      setThreads(next);
      setTabSnapshot(SNAP_KEY, next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => t.name.toLowerCase().includes(q));
  }, [threads, query]);

  return {
    threads: filtered,
    allThreads: threads,
    query,
    setQuery,
    loading,
    refresh,
    empty: !loading && threads.length === 0
  };
}
