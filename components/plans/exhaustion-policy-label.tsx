import type { ExhaustionPolicy } from "@/lib/catalog";
import type { PackComparison } from "@/lib/derive/types";
import { formatMoney, formatSavings } from "@/lib/format";

type ExhaustionPolicyLabelProps = {
  policy: ExhaustionPolicy;
  packComparison: PackComparison | null;
  currency: string;
};

/**
 * What happens when a customer runs out, next to the cheapest credit pack they could buy
 * instead, so it is visible when a pack beats paying overage.
 */
export function ExhaustionPolicyLabel({ policy, packComparison, currency }: ExhaustionPolicyLabelProps) {
  return (
    <div>
      <span className="tabular-nums">
        {policy.type === "block"
          ? "Service stops"
          : `Overage ${perThousand(policy.pricePer1000Credits, currency)}`}
      </span>
      <p className="text-caption text-ink-muted tabular-nums">
        {describePackOption(packComparison, currency)}
      </p>
    </div>
  );
}

function describePackOption(packComparison: PackComparison | null, currency: string): string {
  if (!packComparison) return "No credit packs";

  const packPrice = packComparison.cheapestPack.pricePerThousandCredits;
  if (packPrice === null) return "No credit packs";

  const price = perThousand(packPrice, currency);
  const savings = packComparison.savingsVersusOverage;
  if (savings === null) return `Packs from ${price}`;
  // The overage price sits right above, so "27% less" needs no reference to be understood.
  return `Packs from ${price} (${formatSavings(savings)})`;
}

/** Non-breaking spaces keep "$12 / 1,000" on one line in narrow cards. */
function perThousand(amountInCents: number, currency: string): string {
  return `${formatMoney(amountInCents, currency)} / 1,000`;
}
