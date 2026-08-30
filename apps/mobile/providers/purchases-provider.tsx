// ============================================
// WHAT THIS FILE DOES (plain English):
// Starts RevenueCat when someone is signed in, and ties their purchases to
// their Bridger user id. On sign-out it returns RevenueCat to an anonymous id
// so the next account does not inherit the previous person's subscription.
//
// Mount this once under AuthProvider in the root layout.
// ============================================
import { useEffect, type ReactNode } from 'react';
import { configurePurchases } from '../lib/purchases';
import { useAuth } from './auth-provider';

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // THIS SECTION DOES: configure / re-login RevenueCat whenever auth settles.
  useEffect(() => {
    // #region agent log
    const body = JSON.stringify({
      sessionId: '1e6bf9',
      runId: 'pre-fix',
      hypothesisId: 'B',
      location: 'purchases-provider.tsx:effect',
      message: 'PurchasesProvider auth settled',
      data: { loading, hasUser: Boolean(user?.id) },
      timestamp: Date.now()
    });
    const headers = {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '1e6bf9'
    };
    for (const host of ['127.0.0.1', '192.168.20.206']) {
      fetch(`http://${host}:7342/ingest/5893d51f-0bb0-4f73-ad67-eda076bc0ba4`, {
        method: 'POST',
        headers,
        body
      }).catch(() => {});
    }
    // #endregion
    if (loading) return;
    void configurePurchases(user?.id ?? null);
  }, [user?.id, loading]);

  return <>{children}</>;
}
