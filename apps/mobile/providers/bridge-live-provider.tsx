// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers whether Bridge is live (listening / thinking / needs you) so the
// Island can follow you off Home. Hidden entirely when Assistant is off.
// ============================================
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';
import type { AssistantUiStatus } from '@bridger/shared';

type BridgeLiveState = {
  /** Personal opt-in from Settings. */
  enabled: boolean;
  status: AssistantUiStatus;
  /** One short line for the Island capsule. */
  line: string;
  /** Open Nest session to resume from Island / Screen when set. */
  sessionId: string | null;
  setEnabled: (on: boolean) => void;
  setSessionId: (id: string | null) => void;
  setLive: (patch: {
    status?: AssistantUiStatus;
    line?: string;
  }) => void;
  /** Clear result / needs-you back to idle. */
  dismiss: () => void;
};

const BridgeLiveContext = createContext<BridgeLiveState | null>(null);

export function BridgeLiveProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<AssistantUiStatus>('idle');
  const [line, setLine] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const setLive = useCallback(
    (patch: { status?: AssistantUiStatus; line?: string }) => {
      if (patch.status !== undefined) setStatus(patch.status);
      if (patch.line !== undefined) setLine(patch.line);
    },
    []
  );

  const dismiss = useCallback(() => {
    setStatus('idle');
    setLine('');
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      status,
      line,
      sessionId,
      setEnabled,
      setSessionId,
      setLive,
      dismiss
    }),
    [enabled, status, line, sessionId, setLive, dismiss]
  );

  return (
    <BridgeLiveContext.Provider value={value}>
      {children}
    </BridgeLiveContext.Provider>
  );
}

export function useBridgeLive(): BridgeLiveState {
  const ctx = useContext(BridgeLiveContext);
  if (!ctx) {
    return {
      enabled: false,
      status: 'idle',
      line: '',
      sessionId: null,
      setEnabled: () => undefined,
      setSessionId: () => undefined,
      setLive: () => undefined,
      dismiss: () => undefined
    };
  }
  return ctx;
}
