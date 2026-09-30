import type { CSSProperties } from "react";
import { CreditPackCard } from "@/components/credit-packs/credit-pack-card";
import type { CreditPackRow } from "@/lib/derive/types";

type CreditPackCardGridProps = { rows: CreditPackRow[]; currency: string };

/** Same layout rules as the plan cards: aligned sections, stacked below `md`. */
export function CreditPackCardGrid({ rows, currency }: CreditPackCardGridProps) {
  if (rows.length === 0) {
    return <p className="text-ink-muted">No credit packs. Customers can only get more credits by upgrading.</p>;
  }

  // CSS custom properties are not in React's style typings; the cast only adds this one key.
  const columnCount = { "--pack-count": rows.length } as CSSProperties;

  return (
    <div className="-m-1 overflow-x-auto p-1">
      <ol
        style={columnCount}
        className="grid grid-cols-1 gap-3 md:grid-cols-[repeat(var(--pack-count),minmax(15rem,1fr))]"
      >
        {rows.map((row) => (
          <CreditPackCard key={row.pack.code} row={row} currency={currency} />
        ))}
      </ol>
    </div>
  );
}
