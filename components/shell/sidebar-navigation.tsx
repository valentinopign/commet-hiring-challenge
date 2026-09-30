import { ChevronRightIcon } from "@/components/icons/chevron-right-icon";
import { LayersIcon } from "@/components/icons/layers-icon";
import { OverviewIcon } from "@/components/icons/overview-icon";
import { PacksIcon } from "@/components/icons/packs-icon";
import { PlusIcon } from "@/components/icons/plus-icon";
import { WarningIcon } from "@/components/icons/warning-icon";
import { SidebarDot } from "@/components/shell/sidebar-dot";
import { SidebarNavLink } from "@/components/shell/sidebar-nav-link";
import type { NavigationPlan } from "@/lib/derive/navigation";

type SidebarNavigationProps = { plans: NavigationPlan[] };

export function SidebarNavigation({ plans }: SidebarNavigationProps) {
  return (
    <nav aria-label="Main">
      <ul className="space-y-0.5">
        <li>
          <SidebarNavLink href="/" icon={<OverviewIcon />}>Overview</SidebarNavLink>
        </li>

        <li>
          {/*
            A native disclosure: "Plans" is a toggle, not a page, so it gets a chevron instead of
            looking like the links around it. <details> needs no client code, and the
            browser announces it as expanded or collapsed. Open by default so plan warnings are seen.
          */}
          <details open className="group/plans disclosure-animated">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-control px-2.5 py-1.5 text-ink-muted select-none hover:bg-surface-raised/60 hover:text-ink [&::-webkit-details-marker]:hidden">
              <LayersIcon />
              <span className="flex-1">Plans</span>
              <ChevronRightIcon className="size-3.5 shrink-0 transition-transform duration-150 ease-emphasized group-open/plans:rotate-90 group-open/plans:duration-200 motion-reduce:transition-none" />
            </summary>

            {/*
              Indented one step under Plans, with a dot instead of an icon, so the plans read as
              children of the group without drawing lines. The sidebar is rendered twice (desktop
              and mobile dialog), so the list is named with aria-label rather than a duplicated id.
            */}
            <ul aria-label="Plans" className="mt-0.5 ml-4 space-y-0.5">
              {plans.map((plan) => (
                <li key={plan.code}>
                  <SidebarNavLink
                    href={`/plans/${plan.code}`}
                    icon={<SidebarDot />}
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
                <SidebarNavLink href="/plans/new" icon={<PlusIcon />}>
                  New plan
                </SidebarNavLink>
              </li>
            </ul>
          </details>
        </li>

        <li>
          <SidebarNavLink href="/credit-packs" icon={<PacksIcon />}>Credit packs</SidebarNavLink>
        </li>
      </ul>
    </nav>
  );
}
