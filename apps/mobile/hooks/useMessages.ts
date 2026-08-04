// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Messages inbox list. Loads conversations and filters
// them by the Find-a-friend search box. Screens never import fixtures.
// ============================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listThreads, type ThreadRow } from '../data/messages';

export function useMessages() {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setThreads(await listThreads());
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
