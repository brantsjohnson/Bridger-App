// ============================================
// WHAT THIS FILE DOES (plain English):
// Gate for every admin page. Waits for the session check, then either shows
// the page or sends the person to /login.
// ============================================
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAdminAuth } from '../lib/auth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token, ready } = useAdminAuth();
  const location = useLocation();

  // --- Still asking GET /admin/session ---
  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-canvas p-6 text-sm text-muted"
        role="status"
        aria-live="polite"
      >
        Checking session…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
