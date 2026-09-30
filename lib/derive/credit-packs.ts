import type { Catalog, CreditPack, ExhaustionPolicy } from "@/lib/catalog";
import { getPlanLadder, getPricePerThousandCredits } from "@/lib/derive/plans";
import type {
  CreditPackRow,
  CreditPackSummary,
  PackComparison,
  PackPlanComparison,
} from "@/lib/derive/types";

export function summarizeCreditPack(pack: CreditPack): CreditPackSummary {
  return {
    code: pack.code,
    name: pack.name,
    credits: pack.credits,
    price: pack.price,
    pricePerThousandCredits: getPricePerThousandCredits(pack.price, pack.credits),
    expiresAfterDays: pack.expiresAfterDays,
    planCodes: pack.planCodes,
  };
}

/** Smallest pack first. */
export function summarizeCreditPacks(catalog: Catalog): CreditPackSummary[] {
  return catalog.creditPacks
    .map(summarizeCreditPack)
    .sort((first, second) => first.credits - second.credits);
}

/**
 * How much cheaper a pack is than the plan's overage, as a ratio (0.27 = 27% cheaper).
 * `null` when the plan does not bill overage, so there is nothing to compare against.
 */
export function getSavingsVersusOverage(
  packPricePerThousand: number | null,
  exhaustionPolicy: ExhaustionPolicy,
): number | null {
  if (
    packPricePerThousand === null ||
    exhaustionPolicy.type !== "bill_overage" ||
    exhaustionPolicy.pricePer1000Credits <= 0
  ) {
    return null;
  }
  return 1 - packPricePerThousand / exhaustionPolicy.pricePer1000Credits;
}

/**
 * The cheapest way to buy loose credits on a plan, compared with letting the plan bill
 * overage. Packs expire and overage does not, so the saving is shown, not a verdict.
 */
export function comparePacksWithOverage(
  catalog: Catalog,
  planCode: string,
  exhaustionPolicy: ExhaustionPolicy,
): PackComparison | null {
  const [cheapestPack] = summarizeCreditPacks(catalog)
    .filter((pack) => pack.planCodes.includes(planCode) && pack.pricePerThousandCredits !== null)
    .sort(
      (first, second) =>
        (first.pricePerThousandCredits ?? Infinity) - (second.pricePerThousandCredits ?? Infinity),
    );
  if (!cheapestPack) return null;

  return {
    cheapestPack,
    savingsVersusOverage: getSavingsVersusOverage(cheapestPack.pricePerThousandCredits, exhaustionPolicy),
  };
}

/** Every pack, compared with every plan on the ladder (available or not), cheapest plan first. */
export function getCreditPackRows(catalog: Catalog): CreditPackRow[] {
  const ladder = getPlanLadder(catalog);
  return summarizeCreditPacks(catalog).map((pack) => ({
    pack,
    plans: ladder.map((plan): PackPlanComparison => {
      const isAvailable = pack.planCodes.includes(plan.code);
      return {
        planCode: plan.code,
        planName: plan.name,
        isAvailable,
        exhaustionPolicy: plan.exhaustionPolicy,
        savingsVersusOverage: isAvailable
          ? getSavingsVersusOverage(pack.pricePerThousandCredits, plan.exhaustionPolicy)
          : null,
      };
    }),
  }));
}
