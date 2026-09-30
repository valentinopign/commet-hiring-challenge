import { PackPlanAvailability } from "@/components/credit-packs/pack-plan-availability";
import { PacksIcon } from "@/components/icons/packs-icon";
import { NotApplicable } from "@/components/ui/not-applicable";
import { WidgetHeader } from "@/components/ui/widget-header";
import type { CreditPackRow } from "@/lib/derive/types";
import { formatMoney, formatNumber } from "@/lib/format";

type CreditPackCardProps = { row: CreditPackRow; currency: string };

const BODY = "bg-surface-sunken px-3.5 py-2.5";
const SECTION = `${BODY} border-t border-line`;
const TERM = "text-caption text-ink-muted";

/** Spans four rows of its parent grid through `subgrid` (header plus three sections), like the plan cards. */
export function CreditPackCard({ row: { pack, plans }, currency }: CreditPackCardProps) {
  return (
    <li className="row-span-4 grid grid-rows-subgrid gap-0 overflow-hidden rounded-card border border-line">
      <WidgetHeader
        icon={<PacksIcon className="size-4 shrink-0 text-ink-muted" />}
        title={<h2 className="font-semibold">{formatNumber(pack.credits)} credits</h2>}
      />

      <div className={BODY}>
        <p className="text-base font-semibold tabular-nums">{formatMoney(pack.price, currency)}</p>
        <p className="text-caption text-ink-muted">Credits expire {pack.expiresAfterDays} days after purchase</p>
      </div>

      <dl className={SECTION}>
        <dt className={TERM}>Per 1,000 credits</dt>
        <dd className="tabular-nums">
          {pack.pricePerThousandCredits === null ? (
            <NotApplicable />
          ) : (
            formatMoney(pack.pricePerThousandCredits, currency)
          )}
        </dd>
      </dl>

      <dl className={SECTION}>
        <dt className={`${TERM} mb-1.5`}>Available on</dt>
        <dd>
          <PackPlanAvailability plans={plans} currency={currency} />
        </dd>
      </dl>
    </li>
  );
}
