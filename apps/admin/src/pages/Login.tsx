// ============================================
// WHAT THIS FILE DOES (plain English):
// Sign-in screen: one password field. Sends it to POST /admin/login and
// stores only the JWT. The password never lands in localStorage.
// ============================================
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { ApiError } from '../lib/api';
import { useAdminAuth } from '../lib/auth';

export function Login() {
  const { login, token, ready } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? '/quiz-live';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (ready && token) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // SECURITY: password exists only in this local state for the request
      await login(password);
      setPassword('');
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Could not sign in. Check the API is running.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <Card
        className="w-full max-w-md"
        title="Bridger admin"
        description="Enter the admin password to continue."
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            id="admin-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
