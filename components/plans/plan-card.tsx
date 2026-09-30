import type { AlertCopy } from "@/components/alerts/alert-copy";
import { ArrowUpRightIcon } from "@/components/icons/arrow-up-right-icon";
import { WarningIcon } from "@/components/icons/warning-icon";
import { ExhaustionPolicyLabel } from "@/components/plans/exhaustion-policy-label";
import { PlanMonthlyPrice } from "@/components/plans/plan-monthly-price";
import { PlanNameLink } from "@/components/plans/plan-name-link";
import { PricePerThousand } from "@/components/plans/price-per-thousand";
import { VersionSplitBar } from "@/components/plans/version-split-bar";
import { VisibilityBadge } from "@/components/plans/visibility-badge";
import { NotApplicable } from "@/components/ui/not-applicable";
import { WidgetHeader } from "@/components/ui/widget-header";
import type { LadderRow } from "@/lib/derive/types";
import { formatNumber } from "@/lib/format";

type PlanCardProps = {
  row: LadderRow;
  /** Pending alerts about this plan, already worded. */
  alerts: AlertCopy[];
  currency: string;
};

const BODY = "bg-surface-sunken px-4 py-3";
const SECTION = `${BODY} border-t border-line`;
const TERM = "text-caption text-ink-muted";

/**
 * One rung of the ladder. The card spans six rows of its parent grid through `subgrid` (header,
 * description, price and three sections), so each part lines up with the same part in the
 * neighbouring cards. The price has its own row so every price starts at the same height,
 * whether or not a plan has a step line under it.
 */
export function PlanCard({ row: { plan, step, packComparison }, alerts, currency }: PlanCardProps) {
  return (
    <li className="group relative row-span-6 grid grid-rows-subgrid gap-0 overflow-hidden rounded-card border border-line transition-colors hover:border-line-strong has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-live">
      <WidgetHeader
        title={
          <h3 className="flex min-w-0 items-center gap-2">
            <PlanNameLink code={plan.code} name={plan.name} />
            <VisibilityBadge isPublic={plan.isPublic} />
          </h3>
        }
        trailing={<ArrowUpRightIcon className="size-4 shrink-0 text-ink-muted transition-colors group-hover:text-ink" />}
      />

      {/* The header draws its own bottom border, so description and price need no top border. */}
      <p className={`${BODY} pb-0 text-caption text-ink-muted`}>{plan.description}</p>
      <div className={`${BODY} pt-2.5`}>
        <PlanMonthlyPrice monthly={plan.monthly} step={step} currency={currency} />
      </div>

      <dl className={`${SECTION} grid grid-cols-2 content-start gap-x-3`}>
        <div>
          <dt className={TERM}>Credits / mo</dt>
          <dd className="tabular-nums">
            {plan.monthly ? formatNumber(plan.monthly.includedCredits) : <NotApplicable />}
          </dd>
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
