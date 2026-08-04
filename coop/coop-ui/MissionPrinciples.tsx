import { useMission, useToggleMissionSupport } from "../../lib/api/coop"
import { useCoopAuth } from "./CoopAuth"
import { Card, CoopButton, SectionTitle } from "./ui"

export function MissionPrinciples() {
  const { data: principles } = useMission()
  const { requireSignIn } = useCoopAuth()
  const toggle = useToggleMissionSupport()

  return (
    <div id="mission" className="scroll-mt-24">
      <SectionTitle
        title="Mission principles"
        subtitle="These commitments will be baked into Bridger's charter. Supporting them does not change the charter directly, it just signals what the community is most eager to protect. Have a principle in mind that is not here? Add it on the Ideas tab."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {principles?.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <h3 className="font-bold">{p.title}</h3>
            <p className="mt-1 flex-1 text-sm text-(--coop-ink-soft)">
              {p.description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-(--coop-ink-faint)">
                {p.supportCount} supporting
              </span>
              <CoopButton
                size="sm"
                variant={p.viewerSupports ? "default" : "primary"}
                onClick={() => requireSignIn(() => toggle.mutate(p.id))}
              >
                {p.viewerSupports ? "Supporting" : "Support"}
              </CoopButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
