import type { ReactNode } from "react";
import { ArrowDownIcon } from "@/components/icons/arrow-down-icon";
import { ArrowUpIcon } from "@/components/icons/arrow-up-icon";
import { TradeOffIcon } from "@/components/icons/trade-off-icon";
import type { FeatureImpact } from "@/lib/derive/types";

/**
 * "Neutral" only comes out of a change where capacity and overage move in opposite directions
 * (see DECISIONS.md), so it is worded as the trade-off it is.
 */
const IMPACT: Record<FeatureImpact, { label: string; className: string; icon: ReactNode }> = {
  better: { label: "Better for customers", className: "text-impact-better", icon: <ArrowUpIcon className="size-3.5 shrink-0" /> },
  worse: { label: "Worse for customers", className: "text-impact-worse", icon: <ArrowDownIcon className="size-3.5 shrink-0" /> },
  neutral: { label: "Trade-off", className: "text-ink-muted", icon: <TradeOffIcon className="size-3.5 shrink-0" /> },
};

type ImpactLabelProps = { impact: FeatureImpact };

export function ImpactLabel({ impact }: ImpactLabelProps) {
  const { label, className, icon } = IMPACT[impact];
  return (
    <span className={`inline-flex items-center gap-1 text-caption font-medium whitespace-nowrap ${className}`}>
      {icon}
      {label}
    </span>
  );
}
