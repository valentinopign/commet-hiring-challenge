import type { CapacityLimit, CatalogFeature } from "@/lib/catalog";
import type { FeatureValue, ResolvedFeature } from "@/lib/derive/types";

// Fixed locale and UTC so server-rendered and client-rendered text are identical.
const LOCALE = "en-US";

type MoneyOptions = {
  /** `hide` (default) turns $29.00 into $29; `show` keeps the cents, e.g. to align a column. */
  zeroCents?: "hide" | "show";
};

/** The only place cents become currency. Fractional cents are rounded to the nearest cent. */
export function formatMoney(
  amountInCents: number,
  currency: string,
  { zeroCents = "hide" }: MoneyOptions = {},
): string {
  const isWholeAmount = Math.round(amountInCents) % 100 === 0;
  const fractionDigits = zeroCents === "hide" && isWholeAmount ? 0 : 2;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountInCents / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}

/** Short form for tight spaces: 9000 → "9k", 27500 → "27.5k", 3600000 → "3.6M". */
export function formatCompactNumber(value: number): string {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  const oneDecimal = (amount: number) => new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(amount);
  if (absolute >= 1_000_000) return `${sign}${oneDecimal(absolute / 1_000_000)}M`;
  if (absolute >= 1_000) return `${sign}${oneDecimal(absolute / 1_000)}k`;
  return `${sign}${formatNumber(absolute)}`;
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

/** The included part of a capacity limit, for a table column: "25 GB", "Unlimited". */
export function formatCapacityIncluded(limit: CapacityLimit, unit: string): string {
  if (limit.type === "unlimited") return "Unlimited";
  return `${formatNumber(limit.includedAmount)} ${formatUnit(unit, limit.includedAmount)}`;
}

/** What happens past the included amount: "$15 / seat", "Blocked". `null` when there is no limit. */
export function formatCapacityOverage(limit: CapacityLimit, unit: string, currency: string): string | null {
  if (limit.type === "unlimited") return null;
  if (limit.overage.type === "blocked") return "Blocked";
  return `${formatMoney(limit.overage.unitPrice, currency)} / ${unit}`;
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

/**
 * A saving ratio as words. With a reference: "27% less than overage"; without one: "27% less".
 * Anything that rounds to 0% reads as the same price.
 */
export function formatSavings(savingsRatio: number, reference?: string): string {
  const against = reference ? ` than ${reference}` : "";
  if (Math.round(savingsRatio * 100) === 0) return reference ? `same price as ${reference}` : "same price";
  return savingsRatio > 0
    ? `${formatPercent(savingsRatio)} less${against}`
    : `${formatPercent(-savingsRatio)} more${against}`;
}

/** "$" for USD: the prefix money inputs show. */
export function getCurrencySymbol(currency: string): string {
  const parts = new Intl.NumberFormat(LOCALE, { style: "currency", currency }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

/** Cents as text a person edits: 4900 → "49", 4950 → "49.50". No separators, so it parses back. */
export function formatAmountForInput(amountInCents: number): string {
  return amountInCents % 100 === 0 ? String(amountInCents / 100) : (amountInCents / 100).toFixed(2);
}

/** What a person types in a money field ("49", "49.5", "1,299.00") in cents; `null` when it is not an amount. */
export function parseAmount(text: string): number | null {
  const normalized = text.trim().replaceAll(",", "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  // Rounding absorbs float noise such as 0.29 × 100 = 28.999999999999996.
  return Math.round(Number(normalized) * 100);
}

/** A count typed by a person ("12,500"); `null` when it is not a whole number. */
export function parseWholeNumber(text: string): number | null {
  const normalized = text.trim().replaceAll(",", "");
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}
