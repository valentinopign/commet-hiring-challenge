import type { ExhaustionPolicy } from "@/lib/catalog";
import type { PackComparison } from "@/lib/derive/types";
import { formatMoney, formatSavings } from "@/lib/format";

/** "$12 / 1,000": the unit every credit price on the dashboard is compared in. */
export function formatPerThousand(amountInCents: number, currency: string): string {
  return `${formatMoney(amountInCents, currency)} / 1,000`;
}

/** What running out of credits does, in a few words. */
export function describeExhaustionPolicy(policy: ExhaustionPolicy, currency: string): string {
  return policy.type === "block"
    ? "Service stops"
    : `Overage ${formatPerThousand(policy.pricePer1000Credits, currency)}`;
}

/**
 * The cheapest credit pack next to the overage, so it shows when a pack beats paying overage.
 * Shared by the overview card and the plan page so both word it the same way.
 */
export function describePackOption(packComparison: PackComparison | null, currency: string): string {
  if (!packComparison) return "No credit packs";

  const packPrice = packComparison.cheapestPack.pricePerThousandCredits;
  if (packPrice === null) return "No credit packs";

  const price = formatPerThousand(packPrice, currency);
  const savings = packComparison.savingsVersusOverage;
  if (savings === null) return `Packs from ${price}`;
  // The overage price sits right above, so "27% less" needs no reference to be understood.
  return `Packs from ${price} (${formatSavings(savings)})`;
}
