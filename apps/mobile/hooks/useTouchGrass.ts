// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for Touch Grass on Home and Events: who's free, send your signal,
// join / dismiss, and whether your own signal is live.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { GrassSignal } from '@bridger/shared';
import {
  dismissSignal,
  endMySignal,
  getMyLiveSignal,
  joinSignal,
  listSignals,
  sendSignal,
  type SendSignalInput
} from '../data/touchgrass';

export function useTouchGrass() {
  const [signals, setSignals] = useState<GrassSignal[]>([]);
  const [myLive, setMyLive] = useState<{ when: string; inIds: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, live] = await Promise.all([listSignals(), getMyLiveSignal()]);
      setSignals(list);
      setMyLive(live);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSend = useCallback(async (input: SendSignalInput) => {
    await sendSignal(input);
    await refresh();
  }, [refresh]);

  const onJoin = useCallback(
    async (id: string) => {
      await joinSignal(id);
      await refresh();
    },
    [refresh]
  );

  const onDismiss = useCallback(
    async (id: string) => {
      await dismissSignal(id);
      await refresh();
    },
    [refresh]
  );

  const onEndMine = useCallback(async () => {
    await endMySignal();
    await refresh();
  }, [refresh]);

  return { signals, myLive, loading, refresh, onSend, onJoin, onDismiss, onEndMine };
}
