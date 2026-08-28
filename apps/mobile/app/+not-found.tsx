// ============================================
// WHAT THIS FILE DOES (plain English):
// Expo Router's catch-all when a URL does not match any screen. Shows the
// Magic Patterns "Error 404 / You're invited to suffer" Windows dialog, records the path trail
// for the admin page, and OK / close send you Home.
// ============================================
import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { NotFoundScreen } from '@bridger/ui';
import { reportNotFoundHit } from '../lib/route-trail';

export default function NotFoundRoute() {
  const router = useRouter();
  const pathname = usePathname();
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    void reportNotFoundHit({
      missingPath: pathname || '/unknown',
      reason: 'unmatched_route'
    });
  }, [pathname]);

  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/home');
  };

  return <NotFoundScreen onDismiss={dismiss} />;
}
