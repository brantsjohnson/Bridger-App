import { Link } from "react-router-dom"

import { useCoopAuth } from "../../components/coop-ui/CoopAuth"
import { statusMeta } from "../../components/coop-ui/labels"
import {
  Badge,
  Card,
  CoopButton,
  SectionTitle,
  Stat,
} from "../../components/coop-ui/ui"
import { useParticipation } from "../../lib/api/coop"

export default function CoopProfilePage() {
  const { isSignedIn, user, requireSignIn, loading } = useCoopAuth()
  const { data } = useParticipation(isSignedIn)

  if (loading) {
    return <p className="text-(--coop-ink-faint)">Loading…</p>
  }

  if (!isSignedIn) {
    return (
      <div>
        <SectionTitle
          eyebrow="Your participation"
          title="Sign in to see your participation"
          subtitle="Track the ideas you've submitted and supported, your beta votes, and mission principles you've backed."
        />
        <Card>
          <CoopButton variant="primary" onClick={() => requireSignIn()}>
            Sign in
          </CoopButton>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Your participation"
        title={`Welcome, ${user?.username ?? user?.name ?? "member"}`}
        subtitle="A record of how you've taken part in shaping Bridger so far."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <Stat
            value={data?.ideasSubmitted.length ?? 0}
            label="Ideas submitted"
          />
        </Card>
        <Card>
          <Stat
            value={data?.ideasSupported.length ?? 0}
            label="Ideas supported"
          />
        </Card>
        <Card>
          <Stat value={data?.betaVotes.length ?? 0} label="Beta reviews" />
        </Card>
        <Card>
          <Stat
            value={data?.missionPrinciplesSupported ?? 0}
            label="Principles supported"
          />
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="text-lg font-bold">Need something else?</h2>
        <p className="mt-1 text-sm text-(--coop-ink-soft)">
          For questions, accessibility needs, partnerships, or anything not
          covered here, email us and we will follow up.
        </p>
        <a
          href="mailto:hello@bridger.social"
          className="coop-btn mt-4 inline-flex w-full justify-center sm:w-auto"
        >
          hello@bridger.social
        </a>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Ideas you submitted</h2>
          <div className="mt-3 flex flex-col gap-2">
            {data?.ideasSubmitted.length ? (
              data.ideasSubmitted.map((i) => {
                const meta = statusMeta(i.status)
                return (
                  <Link
                    key={i.id}
                    to={`/co-op/ideas/${i.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-[#eef0f5]"
                  >
                    <span className="font-medium">{i.title}</span>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </Link>
                )
              })
            ) : (
              <p className="text-sm text-(--coop-ink-faint)">
                You haven&apos;t submitted any ideas yet.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Ideas you support</h2>
          <div className="mt-3 flex flex-col gap-2">
            {data?.ideasSupported.length ? (
              data.ideasSupported.map((i) => (
                <Link
                  key={i.ideaId}
                  to={`/co-op/ideas/${i.ideaId}`}
                  className="rounded-lg p-2 font-medium hover:bg-[#eef0f5]"
                >
                  {i.title}
                </Link>
              ))
            ) : (
              <p className="text-sm text-(--coop-ink-faint)">
                You haven&apos;t supported any ideas yet.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
