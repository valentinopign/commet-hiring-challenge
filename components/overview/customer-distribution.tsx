import { getRampStep } from "@/lib/derive/customer-distribution";
import type { CustomerDistribution as Distribution, CustomerSegment } from "@/lib/derive/types";
import { formatNumber } from "@/lib/format";

type CustomerDistributionProps = { distribution: Distribution };

// Full class names, so Tailwind finds them in the source.
const PAID_RAMP = ["bg-segment-paid-1", "bg-segment-paid-2", "bg-segment-paid-3", "bg-segment-paid-4"];

function swatchClass(segment: CustomerSegment, paidPlanCount: number): string {
  if (segment.paidRank === null) return "bg-segment-free";
  return PAID_RAMP[getRampStep(segment.paidRank, paidPlanCount, PAID_RAMP.length)];
}

/** A plan with customers never reads "0%", even when its share rounds down to it. */
function describePercent(segment: CustomerSegment): string {
  return segment.customers > 0 && segment.percent === 0 ? "<1%" : `${segment.percent}%`;
}

/**
 * Customers split by plan, free against paid. The bar is decorative: the legend under it says
 * the same in text, plan by plan, so the bar is hidden from assistive technology.
 */
export function CustomerDistribution({ distribution }: CustomerDistributionProps) {
  const { segments, paidPlanCount, totalCustomers } = distribution;

  if (totalCustomers === 0) {
    return <div className="mt-3 h-2.5 rounded-mark bg-line" aria-hidden="true" />;
  }

  return (
    <div className="mt-3">
      <div className="flex h-2.5 gap-0.5" aria-hidden="true">
        {segments
          .filter((segment) => segment.customers > 0)
          .map((segment) => (
            <div
              key={segment.planCode}
              // A floor of 2px keeps a plan with a handful of customers visible as a sliver.
              className={`min-w-0.5 rounded-mark ${swatchClass(segment, paidPlanCount)}`}
              style={{ flex: `0 1 ${segment.share * 100}%` }}
            />
          ))}
      </div>
      <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption">
        {segments.map((segment) => (
          <li key={segment.planCode} className="flex items-center gap-1.5 tabular-nums">
            <span className={`size-2 shrink-0 rounded-mark ${swatchClass(segment, paidPlanCount)}`} aria-hidden="true" />
            <span className="text-ink">{segment.planName}</span>
            <span className="text-ink-muted">
              {formatNumber(segment.customers)} · {describePercent(segment)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
