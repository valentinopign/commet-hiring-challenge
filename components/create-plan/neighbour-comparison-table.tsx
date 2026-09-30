import { VisibilityBadge } from "@/components/plans/visibility-badge";
import { NotApplicable } from "@/components/ui/not-applicable";
import { WidgetHeader } from "@/components/ui/widget-header";
import type { NeighbourPlans, PeriodPricing } from "@/lib/derive/types";
import { formatMoney, formatNumber } from "@/lib/format";

type Row = {
  key: string;
  name: string;
  isPublic: boolean;
  isDraft: boolean;
  relation: string;
  monthly: PeriodPricing | null;
};

type NeighbourComparisonTableProps = {
  draftName: string;
  draftIsPublic: boolean;
  draftMonthly: PeriodPricing | null;
  position: NeighbourPlans | null;
  currency: string;
};

/** The draft between the plan just below and just above it, on the numbers that set its place. */
export function NeighbourComparisonTable({ draftName, draftIsPublic, draftMonthly, position, currency }: NeighbourComparisonTableProps) {
  const rows: Row[] = [];
  if (position?.below) {
    const { below } = position;
    rows.push({ key: below.code, name: below.name, isPublic: below.isPublic, isDraft: false, relation: "costs less", monthly: below.monthly });
  }
  rows.push({ key: "draft", name: draftName || "This plan", isPublic: draftIsPublic, isDraft: true, relation: "draft", monthly: draftMonthly });
  if (position?.above) {
    const { above } = position;
    rows.push({ key: above.code, name: above.name, isPublic: above.isPublic, isDraft: false, relation: "costs more", monthly: above.monthly });
  }

  const emptyNote = position === null
    ? "Enter a monthly price to see where the plan falls."
    : !position.below && !position.above
      ? "No other plans to compare with yet."
      : null;

  return (
    <section aria-labelledby="neighbours-heading" className="overflow-hidden rounded-card border border-line">
      <WidgetHeader title={<h3 id="neighbours-heading" className="font-medium">Compared with the plans around it</h3>} />
      <div className="overflow-x-auto bg-surface-card px-4 py-2">
        <table className="w-full text-left tabular-nums">
          <caption className="sr-only">Monthly price and included credits of this plan and its neighbours</caption>
          <thead className="text-caption text-ink-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 font-normal">Plan</th>
              <th scope="col" className="py-2 pr-3 font-normal">Price / mo</th>
              <th scope="col" className="py-2 pr-3 font-normal">Credits / mo</th>
              <th scope="col" className="py-2 font-normal">Per 1,000</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={`border-b border-line last:border-b-0 ${row.isDraft ? "font-medium" : "text-ink-muted"}`}>
                <th scope="row" className="py-2 pr-3 font-medium">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={row.isDraft ? "text-ink" : ""}>{row.name}</span>
                    {row.isDraft ? (
                      <span className="rounded-mark border border-dashed border-line-strong px-1.5 text-xs text-ink-muted">Draft</span>
                    ) : (
                      <span className="text-caption font-normal">{row.relation}</span>
                    )}
                    <VisibilityBadge isPublic={row.isPublic} />
                  </span>
                </th>
                <td className="py-2 pr-3">{row.monthly ? formatMoney(row.monthly.price, currency) : <NotApplicable />}</td>
                <td className="py-2 pr-3">{row.monthly ? formatNumber(row.monthly.includedCredits) : <NotApplicable />}</td>
                <td className="py-2">
                  {row.monthly?.pricePerThousandCredits != null
                    ? formatMoney(row.monthly.pricePerThousandCredits, currency)
                    : <NotApplicable />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {emptyNote && <p className="py-2 text-caption text-ink-muted">{emptyNote}</p>}
      </div>
    </section>
  );
}
