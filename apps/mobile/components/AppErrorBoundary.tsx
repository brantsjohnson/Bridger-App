// ============================================
// WHAT THIS FILE DOES (plain English):
// When a screen crashes (a real JS error, not a missing URL), Expo Router
// shows this instead of its black "Something went wrong" page. We show the
// same Magic Patterns Windows 404 dialog ("Error 404 / You're invited to suffer") so the app
// always looks on-brand, and we record the hit as a runtime_error for admin.
// ============================================
import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter, type ErrorBoundaryProps } from 'expo-router';
import { NotFoundScreen } from '@bridger/ui';
import { reportNotFoundHit } from '../lib/route-trail';

/**
 * Drop this in as `export function ErrorBoundary` from the root layout.
 * Expo passes the thrown error + a retry callback.
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reported = useRef(false);

  // Log once: which screen blew up (path only — never the error text as PII).
  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    void reportNotFoundHit({
      missingPath: pathname || '/runtime-error',
      reason: 'runtime_error'
    });
    // Keep a console breadcrumb for local debugging (the dialog itself stays
    // friendly and does not show the raw stack to the user).
    if (__DEV__) {
      console.warn('[AppErrorBoundary]', error?.message ?? error);
    }
  }, [error, pathname]);

  const dismiss = () => {
    // OK sends you Home. Retry alone often re-throws the same crash immediately.
    void retry();
    router.replace('/home');
  };

  return <NotFoundScreen onDismiss={dismiss} />;
}
