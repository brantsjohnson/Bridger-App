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
    if (loading) return;
    void configurePurchases(user?.id ?? null);
  }, [user?.id, loading]);

  return <>{children}</>;
}
