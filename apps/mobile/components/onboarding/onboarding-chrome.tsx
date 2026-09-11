// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared "how this page is dressed" helpers for first-run screens.
// New onboarding (tone set) uses rounded boxes and a page-level emoji
// shower that never blocks scrolling. Old onboarding stays square.
// ============================================
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { View } from 'react-native';
import { HobbyEmojiBurst } from '@bridger/ui';
import { fireEmojiBurstHaptics } from '../../lib/celebration-haptics';

// THIS SECTION DOES: tell fields and buttons whether this is a New screen.
type LookApi = { dressed: boolean };
const LookContext = createContext<LookApi>({ dressed: false });

export function OnboardingLookProvider({
  dressed,
  children
}: {
  dressed: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ dressed }), [dressed]);
  return <LookContext.Provider value={value}>{children}</LookContext.Provider>;
}

/** True on New onboarding (rounded, no outline). False on Old (square boxes). */
export function useOnboardingLook(): LookApi {
  return useContext(LookContext);
}

// THIS SECTION DOES: one shower at a time, painted over the page, never a
// Modal. A Modal would freeze the list until the emojis finished falling.
type Burst = {
  key: number;
  origin: { x: number; y: number };
  emoji: string[];
  count: number;
};

type BurstRequest = {
  origin: { x: number; y: number };
  emoji: string[];
  count?: number;
};

type BurstApi = {
  playBurst: (args: BurstRequest) => void;
};

const BurstContext = createContext<BurstApi | null>(null);

export function useOnboardingBurst(): BurstApi | null {
  return useContext(BurstContext);
}

export function OnboardingBurstHost({ children }: { children: React.ReactNode }) {
  const [bursts, setBursts] = useState<Burst[]>([]);

  const playBurst = useCallback((args: BurstRequest) => {
    const next: Burst = {
      key: Date.now() + Math.floor(Math.random() * 1000),
      origin: args.origin,
      emoji: args.emoji,
      count: args.count ?? 16
    };
    // Keep the last few showers so a fast second tap does not cancel the first.
    setBursts((prev) => [...prev.slice(-2), next]);
  }, []);

  const api = useMemo(() => ({ playBurst }), [playBurst]);

  return (
    <BurstContext.Provider value={api}>
      <View style={{ flex: 1, width: '100%', height: '100%' }}>
        {children}
        <View
          pointerEvents="none"
          accessible={false}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 80 }}
        >
          {bursts.map((b) => (
            <HobbyEmojiBurst
              key={b.key}
              play
              emoji={b.emoji}
              origin={b.origin}
              count={b.count}
              power="boom"
              onPlayStart={fireEmojiBurstHaptics}
              onDone={() => setBursts((prev) => prev.filter((x) => x.key !== b.key))}
            />
          ))}
        </View>
      </View>
    </BurstContext.Provider>
  );
}
