import { SidebarNavigation } from "@/components/shell/sidebar-navigation";
import type { NavigationPlan } from "@/lib/derive/navigation";

type SidebarContentProps = { plans: NavigationPlan[] };

/**
 * Shared by the fixed desktop sidebar and the mobile navigation dialog. Navigation only: the
 * organisation and the user live in the top bar.
 */
export function SidebarContent({ plans }: SidebarContentProps) {
  return (
    <div className="px-3 pt-1 pb-3">
      <SidebarNavigation plans={plans} />
    </div>
  );
}
