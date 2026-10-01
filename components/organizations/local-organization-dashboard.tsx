"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CatalogOverview } from "@/components/overview/catalog-overview";
import { StoredCatalogContent } from "@/components/organizations/local-organization-content";
import { useOrganizations } from "@/components/organizations/organization-provider";
import { StorageNotice } from "@/components/organizations/storage-notice";
import { ResetDemo } from "@/components/organizations/reset-demo";
import { AlertsPopover } from "@/components/shell/alerts-popover";
import { AppShell } from "@/components/shell/app-shell";
import { Avatar } from "@/components/shell/avatar";
import { MobileNavigation } from "@/components/shell/mobile-navigation";
import { OrganizationSwitcher } from "@/components/shell/organization-switcher";
import { PageTitle } from "@/components/shell/page-title";
import { SidebarContent } from "@/components/shell/sidebar-content";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { TopBar } from "@/components/shell/top-bar";
import { getCatalogAlerts } from "@/lib/derive/alerts";
import { getNavigationPlans } from "@/lib/derive/navigation";
import { getPlanNames } from "@/lib/derive/plans";
import { getPageTitle } from "@/lib/page-titles";
import { NIMBUS_ORGANIZATION_ID } from "@/lib/nimbus-seed";

export function StoredCatalogDashboard({ organizationId, path }: {
  organizationId: string;
  path: string[];
}) {
  const { snapshot } = useOrganizations();
  const catalog = snapshot.organizations.find((organization) => organization.organization.id === organizationId);
  const planNames = catalog ? getPlanNames(catalog) : new Map<string, string>();
  const title = getPageTitle(`/${path.join("/")}`, Object.fromEntries(planNames));
  const documentTitle = catalog ? `${title ?? "Company"} · ${catalog.organization.name} pricing` : "Company pricing";

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  if (!snapshot.hydrated && organizationId !== NIMBUS_ORGANIZATION_ID) {
    return <main id="main" className="p-8"><p role="status" className="text-ink-muted">Loading your company…</p></main>;
  }
  if (!catalog) {
    return <main id="main" className="mx-auto max-w-page space-y-4 p-8">
      <h1 className="text-xl font-semibold">Company not found</h1>
      <p className="text-ink-muted">This company is not saved in this browser. It may have been reset, or created on another device.</p>
      <StorageNotice />
      <Link href="/" className="inline-block rounded-control border border-line px-4 py-3">Back to Nimbus</Link>
      <Link href="/onboarding" className="ml-3 inline-block rounded-control border border-line px-4 py-3">Create a company</Link>
    </main>;
  }
  const sidebar = <SidebarContent plans={getNavigationPlans(catalog)} />;
  return <div data-organization-dashboard><AppShell sidebar={sidebar} topBar={<TopBar
    organization={<OrganizationSwitcher organizations={snapshot.organizations.map(({ organization }) => ({ id: organization.id, name: organization.name }))} currentId={organizationId} />}
    menu={<MobileNavigation>{sidebar}</MobileNavigation>}
    alerts={<AlertsPopover alerts={getCatalogAlerts(catalog)} planNames={planNames} />}
    themeToggle={<ThemeToggle />}
    pageTitle={<PageTitle planNames={Object.fromEntries(planNames)} />}
    user={<Avatar name={`${catalog.organization.name} admin`} initials={catalog.organization.name.slice(0, 2).toUpperCase()} />}
  />}>
    <StorageNotice />
    {/* Rebase initial drafts once on hydration; later publications retain their controller state. */}
    {path.length === 0 ? <CatalogOverview catalog={catalog} /> : <StoredCatalogContent key={`${organizationId}:${path.join("/")}:${snapshot.hydrated ? "stored" : "seed"}`} catalog={catalog} path={path} />}
    <ResetDemo />
  </AppShell></div>;
}
