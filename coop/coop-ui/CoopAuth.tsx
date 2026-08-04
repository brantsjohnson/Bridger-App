import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useSessionSync } from "../../hooks/useSessionSync"
import { setCoopReturn } from "../../lib/coopReturn"
import { CoopButton } from "./ui"

interface CoopUser {
  id: number
  name: string
  username?: string
}

interface CoopAuthValue {
  user: CoopUser | null
  isSignedIn: boolean
  loading: boolean
  isAdmin: boolean
  /** Whether the signed-in member is already on the Bridger waitlist. */
  onWaitlist: boolean
  /** Whether the member has verified a beta access code (a real tester). */
  betaAccessVerified: boolean
  /** Runs `action` if signed in, otherwise opens the sign-in prompt. */
  requireSignIn: (action?: () => void) => void
  signOut: () => void
}

const CoopAuthContext = createContext<CoopAuthValue | null>(null)

const authQueryKey = ["coop", "auth", "me"] as const
const coopMeQueryKey = ["coop", "me"] as const

function authHeaders(): Record<string, string> {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("bridger_token")
      : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchMe(): Promise<CoopUser | null> {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
    headers: authHeaders(),
  })
  if (!res.ok) return null
  const body = (await res.json()) as { user: CoopUser }
  return body.user
}

interface CoopMeStatus {
  isAdmin: boolean
  onWaitlist: boolean
  betaAccessVerified: boolean
}

async function fetchCoopMe(): Promise<CoopMeStatus | null> {
  const res = await fetch("/api/coop/me", {
    credentials: "include",
    headers: authHeaders(),
  })
  if (!res.ok) return null
  return (await res.json()) as CoopMeStatus
}

export function CoopAuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [waitlistDismissed, setWaitlistDismissed] = useState(false)
  const sessionReady = useSessionSync()

  const { data, isLoading } = useQuery({
    queryKey: authQueryKey,
    queryFn: fetchMe,
    enabled: sessionReady,
    staleTime: 5 * 60_000,
  })

  const user = data ?? null

  const { data: coopMe, isLoading: coopMeLoading } = useQuery({
    queryKey: coopMeQueryKey,
    queryFn: fetchCoopMe,
    enabled: sessionReady && !!user,
    staleTime: 60_000,
  })

  const onWaitlist = coopMe?.onWaitlist ?? false
  const betaAccessVerified = coopMe?.betaAccessVerified ?? false
  const isAdmin = coopMe?.isAdmin ?? false
  const authLoading = !sessionReady || isLoading || (!!user && coopMeLoading)

  const requireSignIn = useCallback(
    (action?: () => void) => {
      if (user) {
        action?.()
        return
      }
      // Authentication lives on the main /auth page. Remember where we are in
      // the co-op so we can return the member here once they sign in.
      setCoopReturn(`${location.pathname}${location.search}${location.hash}`)
      navigate("/")
    },
    [user, navigate, location],
  )

  const signOut = useCallback(() => {
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
    })
    localStorage.removeItem("bridger_token")
    localStorage.removeItem("bridger_username")
    setWaitlistDismissed(false)
    void qc.invalidateQueries({ queryKey: authQueryKey })
    void qc.invalidateQueries({ queryKey: ["coop"] })
  }, [qc])

  // Second punch: a signed-in member who is not yet on the waitlist gets the
  // join prompt. This also catches members returning from an SSO redirect.
  const showWaitlist =
    !!user && coopMe != null && !onWaitlist && !waitlistDismissed

  return (
    <CoopAuthContext.Provider
      value={{
        user,
        isSignedIn: !!user,
        loading: authLoading,
        isAdmin,
        onWaitlist,
        betaAccessVerified,
        requireSignIn,
        signOut,
      }}
    >
      {children}
      {showWaitlist && (
        <WaitlistModal onClose={() => setWaitlistDismissed(true)} />
      )}
    </CoopAuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCoopAuth(): CoopAuthValue {
  const ctx = useContext(CoopAuthContext)
  if (!ctx) throw new Error("useCoopAuth must be used within CoopAuthProvider")
  return ctx
}

// --- waitlist modal (step 2) ------------------------------------------------

function WaitlistModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [error, setError] = useState("")

  const join = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/coop/join-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("join_failed")
      return (await res.json()) as { ok: boolean; onWaitlist: boolean }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coopMeQueryKey })
      void qc.invalidateQueries({ queryKey: ["coop", "dues"] })
    },
    onError: () => setError("Something went wrong. Please try again."),
  })

  return (
    <div
      className="coop-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Join the Bridger waitlist"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="coop-modal">
        <p className="coop-hint">Step 2 of 2</p>
        <h2 className="text-xl font-bold">Join the Bridger waitlist</h2>
        <p className="mt-3 text-sm text-(--coop-ink-soft)">
          You are signed in. To take part in the co-op preview, add yourself to
          the Bridger waitlist. This uses the same email as your account, so
          there is nothing else to type.
        </p>
        <p className="mt-2 text-sm text-(--coop-ink-faint)">
          No payment is collected today.
        </p>

        {error && (
          <div className="mt-3 text-sm font-medium text-[#aa3a3a]">{error}</div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <CoopButton
            variant="primary"
            disabled={join.isPending}
            onClick={() => join.mutate()}
          >
            {join.isPending ? "Adding you…" : "Add me to the waitlist"}
          </CoopButton>
          <CoopButton variant="ghost" onClick={onClose}>
            Maybe later
          </CoopButton>
        </div>
      </div>
    </div>
  )
}
