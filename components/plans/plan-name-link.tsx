import Link from "next/link";

type PlanNameLinkProps = { code: string; name: string };

/**
 * The single link to a plan's page. Its `::after` stretches over the nearest positioned
 * ancestor (the card), so the whole card is clickable with one tab stop. The card draws the
 * focus ring, so the link hides its own.
 */
export function PlanNameLink({ code, name }: PlanNameLinkProps) {
  return (
    <Link
      href={`/plans/${code}`}
      className="font-semibold text-ink after:absolute after:inset-0 after:rounded-card focus-visible:outline-none"
    >
      {name}
      {/* "Free" alone is ambiguous in a screen reader's list of links. */}
      <span className="sr-only"> plan</span>
    </Link>
  );
}
