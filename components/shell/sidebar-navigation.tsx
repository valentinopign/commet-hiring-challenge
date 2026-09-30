import { OverviewIcon } from "@/components/icons/overview-icon";
import { PacksIcon } from "@/components/icons/packs-icon";
import { PlusIcon } from "@/components/icons/plus-icon";
import { WarningIcon } from "@/components/icons/warning-icon";
import { SidebarNavLink } from "@/components/shell/sidebar-nav-link";
import type { NavigationPlan } from "@/lib/derive/navigation";

type SidebarNavigationProps = { plans: NavigationPlan[] };

export function SidebarNavigation({ plans }: SidebarNavigationProps) {
  return (
    <nav aria-label="Main" className="space-y-4">
      <ul>
        <li>
          <SidebarNavLink href="/" icon={<OverviewIcon />}>Overview</SidebarNavLink>
        </li>
      </ul>

      <div>
        {/*
          A group title, not a page: each plan has its own page and the overview compares them.
          The sidebar is rendered twice (desktop and mobile dialog), so the list is named with
          aria-label rather than an id reference that would be duplicated.
        */}
        <p aria-hidden="true" className="px-2 pb-1 text-caption font-medium text-ink-muted">
          Plans
        </p>
        <ul aria-label="Plans" className="space-y-0.5">
          {plans.map((plan) => (
            <li key={plan.code}>
              <SidebarNavLink
                href={`/plans/${plan.code}`}
                trailing={
                  plan.needsAttention ? (
                    <>
                      <WarningIcon className="size-3.5 shrink-0 text-warning" />
                      <span className="sr-only">(needs attention)</span>
                    </>
                  ) : null
                }
              >
                {plan.name}
              </SidebarNavLink>
            </li>
          ))}
          <li>
            {/* Icon on the right so "New plan" lines up with the plan names, which have none. */}
            <SidebarNavLink href="/plans/new" trailing={<PlusIcon className="size-3.5 shrink-0" />}>
              New plan
            </SidebarNavLink>
          </li>
        </ul>
      </div>

      <ul>
        <li>
          <SidebarNavLink href="/credit-packs" icon={<PacksIcon />}>Credit packs</SidebarNavLink>
        </li>
      </ul>
    </nav>
  );
}
