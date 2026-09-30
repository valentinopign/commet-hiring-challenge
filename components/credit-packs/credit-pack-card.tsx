import { PackPlanAvailability } from "@/components/credit-packs/pack-plan-availability";
import type { CreditPackRow } from "@/lib/derive/types";
import { formatMoney, formatNumber } from "@/lib/format";

type CreditPackCardProps = { row: CreditPackRow; currency: string };

const SECTION = "border-t border-line px-4 py-3 first:border-t-0";
const TERM = "text-caption text-ink-muted";

/** Spans three rows of its parent grid through `subgrid`, like the plan cards. */
export function CreditPackCard({ row: { pack, plans }, currency }: CreditPackCardProps) {
  return (
    <li className="row-span-3 grid grid-rows-subgrid gap-0 rounded-md border border-line bg-surface">
      <div className={SECTION}>
        <h2 className="font-semibold">{formatNumber(pack.credits)} credits</h2>
        <p className="mt-2 text-base font-medium tabular-nums">{formatMoney(pack.price, currency)}</p>
        <p className="text-caption text-ink-muted">Credits expire {pack.expiresAfterDays} days after purchase</p>
      </div>

      <dl className={SECTION}>
        <dt className={TERM}>Per 1,000 credits</dt>
        <dd className="tabular-nums">
          {pack.pricePerThousandCredits === null ? "–" : formatMoney(pack.pricePerThousandCredits, currency)}
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
