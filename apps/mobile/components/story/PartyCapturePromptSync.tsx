// ============================================
// WHAT THIS FILE DOES (plain English):
// Invisible helper that watches for live parties you are going to and schedules
// the one-time "capture the mems" notification. Mount once near the app root.
// ============================================
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../../providers/auth-provider';
import {
  stopPartyCapturePrompts,
  syncPartyCapturePrompts
} from '../../data/party-capture-prompts';

const POLL_MS = 60_000;

export function PartyCapturePromptSync() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session) {
      stopPartyCapturePrompts();
      return;
    }

    let cancelled = false;
    const tick = () => {
      if (!cancelled) void syncPartyCapturePrompts();
    };

    tick();
    const interval = setInterval(tick, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
      stopPartyCapturePrompts();
    };
  }, [session]);

  return null;
}
