import type { EditPeriodContext } from "@/lib/edit-plan/pricing-context";
import { formatCredits, formatMoney, formatNumber } from "@/lib/format";

export function EditPricingContext({ context, comparisonReady, currency }: { context: EditPeriodContext; comparisonReady: boolean; currency: string }) {
  const unit = context.interval === "monthly" ? "mo" : "yr";
  return <div className="mt-auto space-y-3 border-t border-line pt-3 text-caption">
    <div>
      <p className="text-ink-muted">Included credit cost</p>
      <p className="mt-0.5 font-medium tabular-nums">{context.includedCreditCost !== null ? `${formatMoney(context.includedCreditCost, currency)} / 1,000 credits` : !context.priceReady || !context.creditsReady ? "Complete price and credits to calculate." : "No credits included."}</p>
    </div>
    <div>
      <p className="mb-1.5 font-medium">Neighbour plans</p>
      {!comparisonReady ? <p className="text-ink-muted">Complete the monthly price to compare.</p> : context.neighbours.length === 0 ? <p className="text-ink-muted">No other plans to compare.</p> : <table className="w-full text-left tabular-nums">
        <caption className="sr-only">{context.interval === "monthly" ? "Monthly" : "Yearly"} values of the neighbouring plans, ordered by monthly price.</caption>
        <thead className="text-ink-muted"><tr><th scope="col" className="pb-1 font-normal">Plan</th><th scope="col" className="pb-1 text-right font-normal">Price / {unit}</th><th scope="col" className="pb-1 pl-2 text-right font-normal">Credits / {unit}</th></tr></thead>
        <tbody className="divide-y divide-line">{context.neighbours.map((neighbour) => <tr key={neighbour.code}>
          <th scope="row" className="py-1.5 pr-2 font-normal [overflow-wrap:anywhere]"><span>{neighbour.name}</span><span className="sr-only">, {neighbour.relation === "below" ? "preceding" : "following"} plan on the monthly price ladder</span>{!neighbour.isPublic && <span className="block text-ink-muted">Private</span>}</th>
          <td className="py-1.5 text-right">{neighbour.pricing ? formatMoney(neighbour.pricing.price, currency) : "Not offered"}</td>
          <td className="py-1.5 pl-2 text-right">{neighbour.pricing ? <span aria-label={formatCredits(neighbour.pricing.includedCredits)}>{formatNumber(neighbour.pricing.includedCredits)}</span> : "—"}</td>
        </tr>)}</tbody>
      </table>}
    </div>
  </div>;
}
