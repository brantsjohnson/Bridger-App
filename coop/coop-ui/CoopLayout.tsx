import { useEffect } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

import { cn } from "../../lib/cn"
import { CoopAuthProvider, useCoopAuth } from "./CoopAuth"

const NAV = [
  { to: "/co-op", label: "Overview", end: true },
  { to: "/co-op/ideas", label: "Ideas" },
  { to: "/co-op/vote", label: "Vote" },
  { to: "/co-op/governance", label: "Co-op Model" },
  { to: "/co-op/cost", label: "Cost" },
]

function TopBar() {
  const { user, isSignedIn, isAdmin, requireSignIn, signOut } = useCoopAuth()
  const nav = isAdmin ? [...NAV, { to: "/co-op/admin", label: "Admin" }] : NAV

  return (
    <header className="coop-topbar">
      {/* Window title bar */}
      <div className="coop-titlebar">
        <NavLink to="/co-op" className="coop-titlebar-name">
          <span className="coop-wordmark">Bridger Co-op</span>
          <span className="coop-titlebar-tag">Phase 0</span>
        </NavLink>
        <div className="coop-titlebar-right">
          {isSignedIn ? (
            <>
              <NavLink to="/co-op/profile" className="coop-titlebar-user">
                {user?.username ?? user?.name}
              </NavLink>
              <button
                type="button"
                className="coop-titlebar-link"
                onClick={signOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              className="coop-titlebar-link"
              onClick={() => requireSignIn()}
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Toolbar / nav */}
      <nav className="coop-toolbar">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : false}
            className={({ isActive }) =>
              cn("coop-toolbar-link", { "coop-toolbar-link--active": isActive })
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => {
    const el = document.querySelector(".coop-portal")
    if (el) el.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function CoopLayout() {
  return (
    <CoopAuthProvider>
      <div className="coop-portal">
        <ScrollReset />
        <div className="coop-frame">
          <TopBar />
          <main className="coop-shell">
            <Outlet />
          </main>
          <footer className="mx-auto max-w-[980px] px-5 pb-8 text-sm text-(--coop-ink-faint)">
            <hr className="coop-divider mb-4" />
            <p>
              Bridger Co-op Preview · This is a design preview. The official
              co-op has not launched and no dues are being collected.
            </p>
          </footer>
        </div>
      </div>
    </CoopAuthProvider>
  )
}
