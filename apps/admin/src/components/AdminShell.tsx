// ============================================
// WHAT THIS FILE DOES (plain English):
// Left-nav chrome around every signed-in admin page. Links to each console
// section and a Logout button that clears the JWT.
// ============================================
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../lib/auth';
import { Button } from './ui/Button';

const NAV = [
  { to: '/quiz-live', label: "This week's quiz" },
  { to: '/quizzes', label: 'All quizzes' },
  { to: '/activity', label: 'Weekly activity' },
  { to: '/recap', label: 'Weekly recap' },
  { to: '/coop', label: 'Co-op announcements' },
  { to: '/members', label: 'Co-op members' },
  { to: '/home-defaults', label: 'Home starting layout' },
  { to: '/prompts', label: 'Photo prompts' },
  { to: '/delights', label: 'Surprises' },
  { to: '/broken-paths', label: 'Broken paths' }
] as const;

export function AdminShell() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* --- Left nav --- */}
      <aside
        className="flex w-60 shrink-0 flex-col border-r border-line bg-surface"
        aria-label="Admin sections"
      >
        <div className="border-b border-line px-4 py-5">
          <p className="font-pixel text-2xl text-ink">Bridger</p>
          <p className="text-xs text-muted">Admin console</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex min-h-tap items-center rounded-xl px-3 text-sm',
                  isActive
                    ? 'bg-canvas font-medium text-ink'
                    : 'text-muted hover:bg-canvas hover:text-ink'
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* --- Page content --- */}
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
