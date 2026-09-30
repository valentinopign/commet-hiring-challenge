import { SidebarNavigation } from "@/components/shell/sidebar-navigation";
import { SidebarOrganization } from "@/components/shell/sidebar-organization";
import { SidebarUser } from "@/components/shell/sidebar-user";
import type { NavigationPlan } from "@/lib/derive/navigation";

type SidebarContentProps = {
  organizationName: string;
  userName: string;
  userInitials: string;
  plans: NavigationPlan[];
};

/** Shared by the fixed desktop sidebar and the mobile navigation dialog. The user sits at the bottom. */
export function SidebarContent({ organizationName, userName, userInitials, plans }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col gap-3 px-3 pb-3">
      <SidebarOrganization organizationName={organizationName} />
      <SidebarNavigation plans={plans} />
      <div className="mt-auto">
        <SidebarUser name={userName} initials={userInitials} />
      </div>
    </div>
  );
}
