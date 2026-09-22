// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers whether Bridger should ask for Face ID before showing Home.
// The person stays signed in. We only cover the app until they unlock.
// A brand-new phone code still signs them in without a Face ID wall.
// ============================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { trackProduct } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import {
  getBiometricCapability,
  getBiometricUnlockEnabled,
  promptBiometricUnlock,
  setBiometricUnlockEnabled,
  type BiometricCapability
} from '../lib/biometric';
import { useAuth } from './auth-provider';

type BiometricLockValue = {
  /** Cover the app until Face ID (or passcode fallback) succeeds. */
  locked: boolean;
  /** Finished reading the saved toggle + phone capability. */
  ready: boolean;
  /** Settings toggle is on for this account. */
  enabled: boolean;
  capability: BiometricCapability;
  /** Turn the lock on (asks Face ID first) or off. */
  setEnabled: (on: boolean) => Promise<{ error: string | null }>;
  /** Show the system Face ID sheet from the lock screen. */
  unlock: () => Promise<boolean>;
};

const BiometricLockContext = createContext<BiometricLockValue | undefined>(undefined);

export function BiometricLockProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user?.id ?? null;
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const [capability, setCapability] = useState<BiometricCapability>({
    available: false,
    enrolled: false,
    label: 'this device',
    method: 'fingerprint'
  });
  // First time we know "signed in or not" after boot. Restored session can lock.
  const bootDoneRef = useRef(false);
  const relockOnActiveRef = useRef(false);

  // THIS SECTION DOES: load Face ID support and this account's toggle.
  const refresh = useCallback(async (id: string | null) => {
    const cap = await getBiometricCapability();
    setCapability(cap);
    if (!id) {
      setEnabledState(false);
      return { cap, on: false };
    }
    const on = await getBiometricUnlockEnabled(id);
    setEnabledState(on);
    return { cap, on };
  }, []);

  // THIS SECTION DOES: after startup, lock only if a saved session came back
  // and they already turned Face ID on. A fresh SMS sign-in stays open.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    void (async () => {
      const { cap, on } = await refresh(userId);
      if (cancelled) return;
      if (!bootDoneRef.current) {
        bootDoneRef.current = true;
        const shouldLock =
          Boolean(userId) &&
          on &&
          cap.available &&
          cap.enrolled &&
          !isDemoMode();
        setLocked(shouldLock);
        setReady(true);
        return;
      }
      if (!userId) setLocked(false);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, refresh]);

  // THIS SECTION DOES: when they leave the app, ask Face ID on the way back.
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'background') {
        relockOnActiveRef.current = true;
        return;
      }
      if (next !== 'active' || !relockOnActiveRef.current) return;
      relockOnActiveRef.current = false;
      if (isDemoMode() || !userId) return;
      void (async () => {
        const { cap, on } = await refresh(userId);
        if (on && cap.available && cap.enrolled) setLocked(true);
      })();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [userId, refresh]);

  const unlock = useCallback(async () => {
    const result = await promptBiometricUnlock(`Unlock Bridger with ${capability.label}`);
    if (result.ok) {
      setLocked(false);
      trackProduct('biometric_unlock_succeeded', { method: result.method });
      return true;
    }
    trackProduct('biometric_unlock_failed', {
      method: capability.method,
      outcome: result.reason
    });
    return false;
  }, [capability.label, capability.method]);

  const setEnabled = useCallback(
    async (on: boolean) => {
      if (!userId) return { error: 'Sign in first.' };
      if (!on) {
        await setBiometricUnlockEnabled(userId, false);
        setEnabledState(false);
        setLocked(false);
        trackProduct('biometric_unlock_disabled', { method: 'settings' });
        return { error: null };
      }
      const cap = await getBiometricCapability();
      setCapability(cap);
      if (!cap.available) {
        return { error: `${cap.label} is not available on this device.` };
      }
      if (!cap.enrolled) {
        return {
          error: `Turn on ${cap.label} in your phone settings first, then try again.`
        };
      }
      const result = await promptBiometricUnlock(`Turn on ${cap.label} for Bridger`);
      if (!result.ok) {
        trackProduct('permission_result', {
          permission: 'biometric',
          outcome: result.reason === 'cancel' ? 'dismissed' : 'denied',
          context: 'settings_enable'
        });
        if (result.reason === 'cancel') return { error: null };
        return { error: `Could not confirm ${cap.label}. Try again.` };
      }
      await setBiometricUnlockEnabled(userId, true);
      setEnabledState(true);
      trackProduct('permission_result', {
        permission: 'biometric',
        outcome: 'granted',
        context: 'settings_enable'
      });
      trackProduct('biometric_unlock_enabled', { method: result.method });
      return { error: null };
    },
    [userId]
  );

  const value = useMemo<BiometricLockValue>(
    () => ({
      locked,
      ready,
      enabled,
      capability,
      setEnabled,
      unlock
    }),
    [locked, ready, enabled, capability, setEnabled, unlock]
  );

  return (
    <BiometricLockContext.Provider value={value}>{children}</BiometricLockContext.Provider>
  );
}

export function useBiometricLock() {
  const ctx = useContext(BiometricLockContext);
  if (!ctx) {
    throw new Error('useBiometricLock must be used inside <BiometricLockProvider>');
  }
  return ctx;
}
