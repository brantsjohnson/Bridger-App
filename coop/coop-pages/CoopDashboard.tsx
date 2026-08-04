import { useNavigate } from "react-router-dom"

import { Card, CoopButton, InfoTip } from "../../components/coop-ui/ui"
import { useDues } from "../../lib/api/coop"

function WaitlistCountCard() {
  const { data } = useDues()
  const count = data?.waitlistCount ?? null
  return (
    <Card className="flex h-full flex-col justify-center text-center">
      <div className="coop-stat-label text-xs sm:text-sm">
        People on the waitlist
      </div>
      <div className="coop-stat-value text-2xl tabular-nums sm:text-4xl">
        {count === null ? "…" : count.toLocaleString()}
      </div>
      <p className="coop-hint mt-1">Updates live as people sign up.</p>
    </Card>
  )
}

function Banner() {
  return (
    <div className="coop-banner h-full">
      <h1 className="text-lg font-bold text-[#243349]">
        Bridger Co-op Preview
      </h1>
      <p className="mt-2 text-sm/relaxed">
        The official Bridger co-op has not launched yet. This portal shows how
        the future co-op is being designed, how members will participate, how
        governance will evolve, and what it takes to make the platform
        sustainable.
      </p>
      <p className="mt-2 text-sm/relaxed">
        Membership dues are not currently being collected. When the formal co-op
        launches, members will be invited to join under the governance structure
        in place at that time.
      </p>
    </div>
  )
}

interface GuideCardProps {
  index: string
  title: string
  description: string
  info: string
  to: string
}

function GuideCard({ index, title, description, info, to }: GuideCardProps) {
  const navigate = useNavigate()
  return (
    <Card hover className="flex flex-col">
      <div className="mb-2 flex items-center gap-3">
        <span className="coop-card-index">{index}</span>
        <h2 className="text-xl font-bold">{title}</h2>
        <InfoTip label={`More about ${title}`}>{info}</InfoTip>
      </div>
      <p className="flex-1 text-(--coop-ink-soft)">{description}</p>
      <div className="mt-5">
        <CoopButton variant="primary" onClick={() => navigate(to)}>
          Go →
        </CoopButton>
      </div>
    </Card>
  )
}

export default function CoopDashboard() {
  return (
    <div>
      <div className="mb-8 flex flex-row items-stretch gap-3 sm:gap-5">
        <div className="min-w-0 flex-3">
          <Banner />
        </div>
        <div className="min-w-0 flex-1">
          <WaitlistCountCard />
        </div>
      </div>

      <div className="mb-8 max-w-2xl">
        <h2 className="text-2xl font-bold">What you can do here</h2>
        <p className="mt-2 text-(--coop-ink-soft)">
          Each tab does something different. Here is what you can do in each
          one, tap the i for more, or use Next to jump in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <GuideCard
          index="01"
          title={'What is the "Ideas" tab?'}
          description="Suggest features you want in Bridger and support the ones you like. Every idea gets a clear status, so you can follow exactly what happens to it."
          info="Ideas focus on the problem first, then the solution. Declined or deferred ideas stay visible with a reason, and this is also where you suggest new mission principles."
          to="/co-op/ideas"
        />

        <GuideCard
          index="02"
          title={'What is the "Vote" tab?'}
          description="Try each new beta version and vote on whether it ships to the public. You can also vote on membership dues and support mission principles here."
          info="Voting on a version is open for one week after release. Yes ships it, No holds it back, and Extend keeps voting open another week. Sign in with your Bridger account to vote."
          to="/co-op/vote"
        />

        <GuideCard
          index="03"
          title={'What is the "Co-op Model" tab?'}
          description="See how Bridger is becoming a member-owned co-op: the phases it grows through, and the mission principles and roles behind it."
          info="A co-op gives the people who believe in Bridger a real role in protecting its mission. Participation expands over time, growing toward fuller member governance."
          to="/co-op/governance"
        />

        <GuideCard
          index="04"
          title={'What is the "Cost" tab?'}
          description="See what it actually takes to run Bridger. Use the simulator to model how members, dues, and revenue affect whether the platform stays sustainable."
          info="The goal is not profit, it is sustainability. The Cost tab makes the tradeoffs visible so members can understand what keeping Bridger healthy requires."
          to="/co-op/cost"
        />
      </div>
    </div>
  )
}
