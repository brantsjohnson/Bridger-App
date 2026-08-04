import {
  buildCostExplanation,
  buildCostPython,
  type CostModelInputs,
  type CostModelResult,
} from "../../lib/coop-math/costModel"

export function CostCalculationDetails({
  inputs,
  result,
}: {
  inputs: CostModelInputs
  result: CostModelResult
}) {
  const explanation = buildCostExplanation(inputs, result)

  return (
    <>
      <p className="text-sm font-semibold text-(--coop-ink)">
        How it is calculated
      </p>
      <div className="mt-2 flex flex-col gap-2 text-sm text-(--coop-ink-soft)">
        {explanation.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold text-(--coop-ink)">
        Python code
      </p>
      <p className="coop-hint mt-1">
        Paste into any Python interpreter to reproduce the figures.
      </p>
      <pre className="coop-code mt-2">
        <code>{buildCostPython(inputs)}</code>
      </pre>
    </>
  )
}
