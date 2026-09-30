import type { PeriodPricing } from "@/lib/derive/types";
import { formatMoney } from "@/lib/format";

type PricePerThousandProps = { monthly: PeriodPricing | null; currency: string };

/** What 1,000 included credits cost: the number that makes plans of different sizes comparable. */
export function PricePerThousand({ monthly, currency }: PricePerThousandProps) {
  // A free plan's credits have no price, and a plan without credits has nothing to divide.
  if (!monthly || monthly.pricePerThousandCredits === null || monthly.price === 0) {
    return (
      <span className="text-ink-muted">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not applicable</span>
      </span>
    );
  }
  return <span className="tabular-nums">{formatMoney(monthly.pricePerThousandCredits, currency)}</span>;
}
