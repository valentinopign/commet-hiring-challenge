import type { ReactNode } from "react";
import { ArrowUpIcon } from "@/components/icons/arrow-up-icon";
import { ArrowDownIcon } from "@/components/icons/arrow-down-icon";
import { DiffIcon } from "@/components/icons/diff-icon";
import { TradeOffIcon } from "@/components/icons/trade-off-icon";
import type { FeatureImpact } from "@/lib/derive/types";

type Props = { impact?: FeatureImpact | null; children: ReactNode };

/** Neutral facts use info; customer benefits and costs share the feature-impact tokens. */
export function ComparisonDifference({ impact = null, children }: Props) {
  const iconClass = "mt-0.5 size-3.5 shrink-0";
  const className = impact === "better" ? "text-impact-better" : impact === "worse" ? "text-impact-worse" : impact === "neutral" ? "text-ink-muted" : "text-info";
  return <span className={`flex items-start gap-1.5 text-caption ${className}`}>
    {impact === "better" ? <ArrowUpIcon className={iconClass} /> : impact === "worse" ? <ArrowDownIcon className={iconClass} /> : impact === "neutral" ? <TradeOffIcon className={iconClass} /> : <DiffIcon className={iconClass} />}
    <span><span className="sr-only">{impact === "better" ? "Better for customers: " : impact === "worse" ? "Worse for customers: " : impact === "neutral" ? "Trade-off: " : "Difference: "}</span>{children}</span>
  </span>;
}
