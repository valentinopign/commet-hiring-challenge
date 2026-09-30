import type { AlertCopy } from "@/components/alerts/alert-copy";
import { WarningIcon } from "@/components/icons/warning-icon";
import { ExhaustionPolicyLabel } from "@/components/plans/exhaustion-policy-label";
import { PlanMonthlyPrice } from "@/components/plans/plan-monthly-price";
import { PlanNameLink } from "@/components/plans/plan-name-link";
import { PricePerThousand } from "@/components/plans/price-per-thousand";
import { VersionSplitBar } from "@/components/plans/version-split-bar";
import type { LadderRow } from "@/lib/derive/types";
import { formatNumber } from "@/lib/format";

type PlanCardProps = {
  row: LadderRow;
  /** Pending alerts about this plan, already worded. */
  alerts: AlertCopy[];
  currency: string;
};

const SECTION = "border-t border-line px-3.5 py-2.5 first:border-t-0";
const TERM = "text-caption text-ink-muted";

/**
 * One rung of the ladder. The card spans four rows of its parent grid through `subgrid`,
 * so each section lines up with the same section in the neighbouring cards.
 */
export function PlanCard({ row: { plan, step, packComparison }, alerts, currency }: PlanCardProps) {
  return (
    <li className="relative row-span-4 grid grid-rows-subgrid gap-0 rounded-md border border-line bg-surface transition-colors hover:border-line-strong has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-live">
      <div className={`${SECTION} flex flex-col`}>
        <h3>
          <PlanNameLink code={plan.code} name={plan.name} isPublic={plan.isPublic} />
        </h3>
        <p className="text-caption text-ink-muted">{plan.description}</p>
        {/* Pushed to the bottom so prices line up even when descriptions wrap differently. */}
        <div className="mt-auto pt-2">
          <PlanMonthlyPrice monthly={plan.monthly} step={step} currency={currency} />
        </div>
      </div>

      <dl className={`${SECTION} grid grid-cols-2 content-start gap-x-3`}>
        <div>
          <dt className={TERM}>Credits / mo</dt>
          <dd className="tabular-nums">{plan.monthly ? formatNumber(plan.monthly.includedCredits) : "–"}</dd>
        </div>
        <div>
          <dt className={TERM}>Per 1,000</dt>
          <dd><PricePerThousand monthly={plan.monthly} currency={currency} /></dd>
        </div>
      </dl>

      <dl className={SECTION}>
        <dt className={TERM}>When credits run out</dt>
        <dd>
          <ExhaustionPolicyLabel
            policy={plan.exhaustionPolicy}
            packComparison={packComparison}
            currency={currency}
          />
        </dd>
      </dl>

      <dl className={SECTION}>
        <div className="flex items-baseline justify-between gap-2">
          <dt className={TERM}>Customers</dt>
          <dd className="font-medium tabular-nums">{formatNumber(plan.totalSubscriptions)}</dd>
        </div>
        <dd className="mt-1.5">
          <VersionSplitBar versions={plan.versionSplit} />
          {alerts.map((alert) => (
            <p key={alert.short} className="mt-1.5 flex items-center gap-1.5 text-caption text-warning">
              <WarningIcon className="size-3.5 shrink-0" />
              <span>
                <span className="sr-only">Warning: </span>
                {alert.short}
              </span>
            </p>
          ))}
        </dd>
      </dl>
    </li>
  );
}
