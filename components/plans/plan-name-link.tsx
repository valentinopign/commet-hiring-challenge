import Link from "next/link";
import { VisibilityBadge } from "@/components/plans/visibility-badge";

type PlanNameLinkProps = { code: string; name: string; isPublic: boolean };

/**
 * The single link to a plan's page. Its `::after` stretches over the nearest positioned
 * ancestor (the card), so the whole card is clickable with one tab stop. The card draws the
 * focus ring, so the link hides its own.
 */
export function PlanNameLink({ code, name, isPublic }: PlanNameLinkProps) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Link
        href={`/plans/${code}`}
        className="font-semibold text-ink after:absolute after:inset-0 after:rounded-md focus-visible:outline-none"
      >
        {name}
      </Link>
      <VisibilityBadge isPublic={isPublic} />
    </span>
  );
}
