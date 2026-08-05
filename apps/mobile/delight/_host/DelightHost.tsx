// ============================================
// WHAT THIS FILE DOES (plain English):
// Sits high in the app tree and plays pending delight gifts (and any global
// active delights that need mounting). Each plugin runs inside an error
// boundary so a bad animation is skipped. After play we mark the trigger done.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import type { DelightEntry, DelightTrigger } from '@bridger/shared';
import { isDemoMode } from '../../lib/demo';
import { useAuth } from '../../providers/auth-provider';
import {
  listActive,
  listTriggers,
  markPlayed
} from '../../data/delight';
import { personById } from '../../data/people';
import { findDelightPlugin, type DelightPluginProps } from '../registry';
import { DelightErrorBoundary } from './DelightErrorBoundary';

type Playing = {
  slug: string;
  triggerId?: string;
  attribution?: string;
  Comp: React.ComponentType<DelightPluginProps>;
};

/** Mount once near the root so gifts can play over any screen. */
export function DelightHost() {
  const { session, loading } = useAuth();
  const [queue, setQueue] = useState<Playing[]>([]);
  const [active, setActive] = useState<Playing | null>(null);

  // Demo mode and signed-in live mode both may have pending gifts.
  const ready = !loading && (isDemoMode() || !!session);

  const load = useCallback(async () => {
    if (!ready) return;

    let activeList: DelightEntry[] = [];
    let triggers: DelightTrigger[] = [];
    try {
      [activeList, triggers] = await Promise.all([listActive(), listTriggers()]);
    } catch {
      return;
    }

    const enabledSlugs = new Set(activeList.map((d) => d.slug));
    const next: Playing[] = [];

    for (const t of triggers) {
      const slug = t.delightSlug ?? activeList.find((d) => d.id === t.delightId)?.slug;
      if (!slug || !enabledSlugs.has(slug)) continue;
      const entry = findDelightPlugin(slug);
      if (!entry) continue;

      try {
        const mod = await entry.load();
        const fromName =
          t.fromName ??
          (t.fromUserId ? personById(t.fromUserId).name.split(' ')[0] : 'a friend');
        next.push({
          slug,
          triggerId: t.id,
          attribution: `emoji-bombed by ${fromName}`,
          Comp: mod.default
        });
      } catch {
        // Skip plugins that fail to load.
      }
    }

    // Global (non-gift) active delights can mount without a trigger later;
    // for now we only auto-play gift triggers so Home stays calm.

    if (next.length) {
      setQueue(next);
    }
  }, [ready]);

  useEffect(() => {
    void load();
  }, [load]);

  // Play the next item in the queue.
  useEffect(() => {
    if (active || !queue.length) return;
    const [first, ...rest] = queue;
    setActive(first);
    setQueue(rest);
  }, [queue, active]);

  const finish = useCallback(
    async (playing: Playing) => {
      if (playing.triggerId) {
        try {
          await markPlayed(playing.triggerId);
        } catch {
          // Still clear locally so we do not loop forever.
        }
      }
      setActive(null);
    },
    []
  );

  if (!active) return null;

  const { Comp, attribution, triggerId } = active;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      <DelightErrorBoundary
        key={triggerId ?? active.slug}
        onSkip={() => void finish(active)}
      >
        <Comp
          attribution={attribution}
          onDone={() => void finish(active)}
        />
      </DelightErrorBoundary>
    </View>
  );
}
