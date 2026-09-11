// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for Touch Grass on Home and Events: who's free, send your signal,
// join / dismiss, and whether your own signal is live. Keeps the last list
// on screen and quietly refreshes.
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
import { getTabSnapshot, setTabSnapshot } from '../lib/tab-snapshots';

type TouchGrassSnap = {
  signals: GrassSignal[];
  myLive: { when: string; inIds: string[] } | null;
};

const SNAP_KEY = 'touchgrass';

export function useTouchGrass() {
  const cached = getTabSnapshot<TouchGrassSnap>(SNAP_KEY);
  const [signals, setSignals] = useState<GrassSignal[]>(cached?.signals ?? []);
  const [myLive, setMyLive] = useState<{ when: string; inIds: string[] } | null>(
    cached?.myLive ?? null
  );
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async () => {
    const hadCache = Boolean(getTabSnapshot<TouchGrassSnap>(SNAP_KEY));
    if (!hadCache) setLoading(true);
    try {
      const [list, live] = await Promise.all([listSignals(), getMyLiveSignal()]);
      setSignals(list);
      setMyLive(live);
      setTabSnapshot<TouchGrassSnap>(SNAP_KEY, { signals: list, myLive: live });
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
