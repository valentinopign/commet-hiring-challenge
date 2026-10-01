import type { ExhaustionPolicy } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";

type ExhaustionPolicyLabelProps = {
  policy: ExhaustionPolicy;
  currency: string;
};

/** Compact overview policy; pack comparisons remain on the detail page. */
export function ExhaustionPolicyLabel({ policy, currency }: ExhaustionPolicyLabelProps) {
  return (
    <span className="tabular-nums">{policy.type === "block" ? "Service stops" : <>Overage {formatMoney(policy.pricePer1000Credits, currency)} / <abbr title="1,000 credits" className="no-underline">1k</abbr></>}</span>
  );
}
