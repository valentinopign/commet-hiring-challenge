import Link from "@/components/organizations/catalog-link";
import { PlusIcon } from "@/components/icons/plus-icon";
import { VisibilityBadge } from "@/components/plans/visibility-badge";
import { outlineIconControlClass } from "@/components/ui/control-styles";
import type { ReactNode } from "react";

type PlanHeaderProps = { code: string; name: string; isPublic: boolean; beforeActions?: ReactNode; actions?: ReactNode };

/** The visible name lives in the top bar; the <h1> stays here for headings and the skip link. */
export function PlanHeader({ code, name, isPublic, beforeActions, actions }: PlanHeaderProps) {
  return (
    <>
      <h1 className="sr-only">{name}</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VisibilityBadge isPublic={isPublic} />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {beforeActions}
          <Link href={{ pathname: "/plans/new", query: { from: code } }} className={outlineIconControlClass}>
            <PlusIcon />
            Create plan from {name}
          </Link>
          {actions}
        </div>
      </div>
    </>
  );
}
