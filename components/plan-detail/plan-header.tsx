import Link from "@/components/organizations/catalog-link";
import { PlusIcon } from "@/components/icons/plus-icon";
import { VisibilityBadge } from "@/components/plans/visibility-badge";
import { outlineIconControlClass } from "@/components/ui/control-styles";

type PlanHeaderProps = { code: string; name: string; isPublic: boolean };

/** The visible name lives in the top bar; the <h1> stays here for headings and the skip link. */
export function PlanHeader({ code, name, isPublic }: PlanHeaderProps) {
  return (
    <>
      <h1 className="sr-only">{name}</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VisibilityBadge isPublic={isPublic} />
        <Link href={{ pathname: "/plans/new", query: { from: code } }} className={`${outlineIconControlClass} ml-auto`}>
          <PlusIcon />
          Create plan from {name}
        </Link>
      </div>
    </>
  );
}
