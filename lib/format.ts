import type { CapacityLimit, CatalogFeature } from "@/lib/catalog";
import type { FeatureValue, ResolvedFeature } from "@/lib/derive/types";

// Fixed locale and UTC so server-rendered and client-rendered text are identical.
const LOCALE = "en-US";

/** The only place cents become currency. Fractional cents are rounded to the nearest cent. */
export function formatMoney(amountInCents: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency }).format(amountInCents / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}

export function formatCredits(credits: number): string {
  return `${formatNumber(credits)} ${credits === 1 ? "credit" : "credits"}`;
}

/** Takes a ratio (0.85), not a percentage (85). */
export function formatPercent(ratio: number): string {
  return new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0 }).format(ratio);
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

/** Abbreviated units written in capitals (GB) do not take a plural. */
export function formatUnit(unit: string, count: number): string {
  if (count === 1 || unit === unit.toUpperCase()) return unit;
  return `${unit}s`;
}

export function formatCapacityLimit(limit: CapacityLimit, unit: string, currency: string): string {
  if (limit.type === "unlimited") return "Unlimited";
  const included = `${formatNumber(limit.includedAmount)} ${formatUnit(unit, limit.includedAmount)}`;
  if (limit.overage.type === "blocked") return `${included}, then blocked`;
  return `${included}, then ${formatMoney(limit.overage.unitPrice, currency)} / ${unit}`;
}

export function getFeatureUnit(feature: CatalogFeature): string | null {
  return feature.type === "boolean" ? null : feature.unit;
}

export function formatFeatureValue(
  { feature, value }: ResolvedFeature,
  currency: string,
): string {
  return formatValue(value, getFeatureUnit(feature) ?? "unit", currency);
}

/** Short form used in diffs, e.g. `ai_generation: 6 → 5 credits`. */
export function formatFeatureTransition(
  feature: CatalogFeature,
  before: FeatureValue,
  after: FeatureValue,
  currency: string,
): string {
  const unit = getFeatureUnit(feature) ?? "unit";
  if (before.kind === "credit" && after.kind === "credit") {
    return `${before.creditsPerUnit} → ${formatCredits(after.creditsPerUnit)}`;
  }
  return `${formatValue(before, unit, currency)} → ${formatValue(after, unit, currency)}`;
}

function formatValue(value: FeatureValue, unit: string, currency: string): string {
  switch (value.kind) {
    case "not_included":
      return "Not included";
    case "boolean":
      return value.enabled ? "Included" : "Not included";
    case "credit":
      return `${formatCredits(value.creditsPerUnit)} / ${unit}`;
    case "capacity":
      return formatCapacityLimit(value.limit, unit, currency);
  }
}
