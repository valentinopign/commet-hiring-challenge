import { InfoIcon } from "@/components/icons/info-icon";
import { formatNumber } from "@/lib/format";

type PricingScopeNoteProps = { totalCustomers: number };

/**
 * Only features are versioned. Price, credits and the exhaustion policy belong to the plan, so
 * the page says who a change would reach before anyone thinks of changing them.
 */
export function PricingScopeNote({ totalCustomers }: PricingScopeNoteProps) {
  const audience =
    totalCustomers === 0
      ? "every future customer, on every version"
      : `all ${formatNumber(totalCustomers)} ${totalCustomers === 1 ? "customer" : "customers"}, on every version`;
  return (
    <p className="flex items-start gap-1.5">
      <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Price, included credits and what happens when credits run out apply to {audience}. A change
        reaches them at their next renewal. Only features are versioned.
      </span>
    </p>
  );
}
