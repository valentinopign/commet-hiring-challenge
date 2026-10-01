import { ComparisonDifference } from "@/components/plan-detail/comparison-difference";
import { PlanAlerts } from "@/components/plan-detail/plan-alerts";
import { getAlertSection } from "@/components/plan-detail/alert-placement";
import { describeExhaustionPolicy, describePackOption } from "@/components/plans/describe-pack-option";
import type { FeatureImpact, PlanDetail } from "@/lib/derive/types";

type Props = { detail: PlanDetail; currency: string; planNames: Map<string, string>; policyDiffers?: boolean; policyImpact?: FeatureImpact | null; packDiffers?: boolean };

export function ComparisonExhaustionValue({ detail, currency, planNames, policyDiffers = false, policyImpact = null, packDiffers = false }: Props) {
  const alerts = detail.alerts.filter((alert) => getAlertSection(alert) === "pricing");
  return <>
    <p className="font-medium">{describeExhaustionPolicy(detail.plan.exhaustionPolicy, currency)}</p>
    {policyDiffers && <p className="mt-2"><ComparisonDifference impact={policyImpact}>Different exhaustion policy</ComparisonDifference></p>}
    <p className="mt-1 text-caption text-ink-muted">{describePackOption(detail.packComparison, currency)}</p>
    {packDiffers && <p className="mt-2"><ComparisonDifference>Different credit pack availability</ComparisonDifference></p>}
    {alerts.length > 0 && <div className="mt-3"><PlanAlerts alerts={alerts} planName={detail.plan.name} planNames={planNames} /></div>}
  </>;
}
