// ============================================
// WHAT THIS FILE DOES (plain English):
// AuthProvider holds whether an admin is signed in. login() sends the
// password to the server once, stores only the JWT, then forgets the password.
// checkSession() asks GET /admin/session if the stored token still works.
//
// SECURITY: the password is never written to localStorage or this context.
// ============================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  api,
  clearAdminToken,
  getAdminToken,
  setAdminToken
} from './api';

type AuthState = {
  token: string | null;
  /** False until the first session check finishes. */
  ready: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const [ready, setReady] = useState(false);

  // --- Ask the API if the stored JWT is still good ---
  const checkSession = useCallback(async () => {
    const existing = getAdminToken();
    if (!existing) {
      setToken(null);
      setReady(true);
      return false;
    }
    try {
      await api<{ ok: boolean }>('/admin/session');
      setToken(existing);
      setReady(true);
      return true;
    } catch {
      clearAdminToken();
      setToken(null);
      setReady(true);
      return false;
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  // SECURITY: password is only used for this one POST, then discarded
  const login = useCallback(async (password: string) => {
    const result = await api<{ token: string }>('/admin/login', {
      method: 'POST',
      body: { password },
      auth: false
    });
    setAdminToken(result.token);
    setToken(result.token);
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ token, ready, login, logout, checkSession }),
    [token, ready, login, logout, checkSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used inside AuthProvider');
  }
  return ctx;
}
