// ============================================
// WHAT THIS FILE DOES (plain English):
// Sits high in the app tree. Plays gift overlays, then optional global
// one-shots, and can mount persistent opt-in plugins when any exist. Each
// plugin runs inside an error boundary so a bad animation is skipped.
// ============================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { DelightEntry, DelightTrigger } from '@bridger/shared';
import { trackProduct } from '@bridger/shared';
import { isDemoMode } from '../../lib/demo';
import { useAuth } from '../../providers/auth-provider';
import {
  listActive,
  listTriggers,
  markPlayed,
  fetchDelightOptIns,
  subscribeDelightDemo
} from '../../data/delight';
import { personById } from '../../data/people';
import {
  findDelightPlugin,
  type DelightPluginProps
} from '../registry';
import { DelightErrorBoundary } from './DelightErrorBoundary';

type Playing = {
  slug: string;
  triggerId?: string;
  attribution?: string;
  Comp: React.ComponentType<DelightPluginProps>;
  isGift: boolean;
};

type PersistentMount = {
  slug: string;
  Comp: React.ComponentType<DelightPluginProps>;
};

/** Mount once near the root so gifts can play over any screen. */
export function DelightHost() {
  const { session, loading } = useAuth();
  const [queue, setQueue] = useState<Playing[]>([]);
  const [active, setActive] = useState<Playing | null>(null);
  const [persistent, setPersistent] = useState<PersistentMount[]>([]);
  const globalPlayed = useRef(false);
  /** True once we have looked for a global overlay this session (even if none). */
  const globalChecked = useRef(false);
  const seenTriggerIds = useRef(new Set<string>());

  // Demo mode and signed-in live mode both may have pending gifts.
  const ready = !loading && (isDemoMode() || !!session);

  const load = useCallback(async () => {
    if (!ready) return;

    let activeList: DelightEntry[] = [];
    let triggers: DelightTrigger[] = [];
    let optIns: string[] = [];
    try {
      [activeList, triggers, optIns] = await Promise.all([
        listActive(),
        listTriggers(),
        fetchDelightOptIns()
      ]);
    } catch {
      return;
    }

    const enabledSlugs = new Set(activeList.map((d) => d.slug));
    const next: Playing[] = [];

    // THIS SECTION DOES: queue gift overlays first (skip ones we already queued).
    for (const t of triggers) {
      if (seenTriggerIds.current.has(t.id)) continue;
      const slug =
        t.delightSlug ?? activeList.find((d) => d.id === t.delightId)?.slug;
      if (!slug || !enabledSlugs.has(slug)) continue;
      const entry = findDelightPlugin(slug);
      if (!entry) continue;

      try {
        const mod = await entry.load();
        const fromName =
          t.fromName ??
          (t.fromUserId ? personById(t.fromUserId).name.split(' ')[0] : 'a friend');
        const template =
          entry.attributionTemplate ?? 'surprise from {name}';
        seenTriggerIds.current.add(t.id);
        next.push({
          slug,
          triggerId: t.id,
          attribution: template.replace('{name}', fromName),
          Comp: mod.default,
          isGift: true
        });
      } catch {
        // Skip plugins that fail to load.
      }
    }

    // THIS SECTION DOES: one global overlay_once per JS session after gifts clear.
    if (!globalChecked.current && next.length === 0) {
      globalChecked.current = true;
      const globalEntry = activeList.find((d) => d.scope === 'global');
      if (globalEntry && enabledSlugs.has(globalEntry.slug)) {
        const reg = findDelightPlugin(globalEntry.slug);
        if (reg && reg.mountMode === 'overlay_once') {
          try {
            const mod = await reg.load();
            next.push({
              slug: globalEntry.slug,
              Comp: mod.default,
              isGift: false
            });
            globalPlayed.current = true;
          } catch {
            // skip
          }
        }
      }
    }

    if (next.length) {
      setQueue((q) => [...q, ...next]);
    }

    // THIS SECTION DOES: mount persistent opt-in plugins (none yet is fine).
    const persist: PersistentMount[] = [];
    for (const d of activeList) {
      if (d.scope === 'opt-in' && !optIns.includes(d.slug)) continue;
      if (d.scope === 'gift') continue;
      const reg = findDelightPlugin(d.slug);
      if (!reg || reg.mountMode !== 'persistent') continue;
      try {
        const mod = await reg.load();
        persist.push({ slug: d.slug, Comp: mod.default });
      } catch {
        // skip
      }
    }
    setPersistent(persist);
  }, [ready]);

  useEffect(() => {
    void load();
  }, [load]);

  // Demo QA: when Settings queues a gift, reload without remounting the app.
  useEffect(() => {
    if (!isDemoMode()) return;
    return subscribeDelightDemo(() => {
      void load();
    });
  }, [load]);

  // Play the next item in the queue.
  useEffect(() => {
    if (active || !queue.length) return;
    const [first, ...rest] = queue;
    setActive(first);
    setQueue(rest);
  }, [queue, active]);

  // After gifts finish, try a global one-shot once (if we have not checked yet).
  useEffect(() => {
    if (active || queue.length || !ready || globalChecked.current) return;
    void load();
  }, [active, queue.length, ready, load]);

  const finish = useCallback(async (playing: Playing) => {
    if (playing.triggerId) {
      try {
        await markPlayed(playing.triggerId);
      } catch {
        // Still clear locally so we do not loop forever.
      }
    }
    if (playing.isGift) {
      trackProduct('delight_played', { delight_slug: playing.slug });
    }
    setActive(null);
  }, []);

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
      {persistent.map((p) => (
        <DelightErrorBoundary key={`p-${p.slug}`} onSkip={() => undefined}>
          <p.Comp attribution={undefined} onDone={() => undefined} mode="persistent" />
        </DelightErrorBoundary>
      ))}

      {active ? (
        <DelightErrorBoundary
          key={active.triggerId ?? active.slug}
          onSkip={() => void finish(active)}
        >
          <active.Comp
            attribution={active.attribution}
            onDone={() => void finish(active)}
            mode="overlay"
          />
        </DelightErrorBoundary>
      ) : null}
    </View>
  );
}
