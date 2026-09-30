import { CoinsIcon } from "@/components/icons/coins-icon";
import { GaugeIcon } from "@/components/icons/gauge-icon";
import { InfoIcon } from "@/components/icons/info-icon";
import { KeyIcon } from "@/components/icons/key-icon";
import { FeatureGroupTable } from "@/components/plan-detail/feature-group-table";
import { describeVersionStatus } from "@/components/plan-detail/version-status";
import type { FeatureRowsByType, TimelineEntry } from "@/lib/derive/types";
import { formatNumber } from "@/lib/format";

type FeatureConfigurationProps = {
  viewed: TimelineEntry;
  currentVersion: number;
  rows: FeatureRowsByType;
  currency: string;
};

const ICON_CLASS = "size-4 shrink-0 text-ink-muted";

function describeViewedVersion(viewed: TimelineEntry, currentVersion: number): string {
  if (viewed.isCurrent) return `v${viewed.version} is the current version: what new customers get.`;
  const customers =
    viewed.subscriptions === 0
      ? "No customers are on it."
      : `${formatNumber(viewed.subscriptions)} ${viewed.subscriptions === 1 ? "customer is" : "customers are"} still on it.`;
  return `Viewing v${viewed.version}, ${describeVersionStatus(viewed).label.toLowerCase()}. ${customers} Where it differs, v${currentVersion}'s value is shown under the feature.`;
}

export function FeatureConfiguration({ viewed, currentVersion, rows, currency }: FeatureConfigurationProps) {
  const comparedTo = viewed.isCurrent ? null : currentVersion;
  return (
    <div>
      <p className="flex items-start gap-1.5 text-caption text-ink-muted">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>{describeViewedVersion(viewed, currentVersion)}</span>
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <FeatureGroupTable group="credit" icon={<CoinsIcon className={ICON_CLASS} />} rows={rows.credit} currency={currency} currentVersion={comparedTo} />
        <FeatureGroupTable group="capacity" icon={<GaugeIcon className={ICON_CLASS} />} rows={rows.capacity} currency={currency} currentVersion={comparedTo} />
        {/* Six on/off rows: full width on two columns so it doesn't leave a hole beside it. */}
        <div className="md:col-span-2 xl:col-span-1">
          <FeatureGroupTable group="boolean" icon={<KeyIcon className={ICON_CLASS} />} rows={rows.boolean} currency={currency} currentVersion={comparedTo} />
        </div>
      </div>
    </div>
  );
}
