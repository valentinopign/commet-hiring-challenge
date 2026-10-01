import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { AlertsPopover } from "@/components/shell/alerts-popover";
import { AppShell } from "@/components/shell/app-shell";
import { Avatar } from "@/components/shell/avatar";
import { MobileNavigation } from "@/components/shell/mobile-navigation";
import { OrganizationSwitcher } from "@/components/shell/organization-switcher";
import { PageTitle } from "@/components/shell/page-title";
import { SidebarContent } from "@/components/shell/sidebar-content";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { TopBar } from "@/components/shell/top-bar";
import { RouteShell } from "@/components/shell/route-shell";
import { catalog } from "@/data/catalog";
import { getCatalogAlerts } from "@/lib/derive/alerts";
import { getNavigationPlans, getOrganizations } from "@/lib/derive/navigation";
import { getPlanNames } from "@/lib/derive/plans";
import { currentUser } from "@/lib/session";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

export const metadata: Metadata = {
  title: `${catalog.organization.name} pricing`,
  description: `How ${catalog.organization.name} charges its customers.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const planNames = getPlanNames(catalog);
  const sidebar = <SidebarContent plans={getNavigationPlans(catalog)} />;

  return (
    // The inline script may set data-theme before React hydrates; that difference is expected.
    <html lang="en" className={`${plexSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full font-sans text-sm">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <RouteShell dashboard={<AppShell
          sidebar={sidebar}
          topBar={
            <TopBar
              organization={<OrganizationSwitcher organizations={getOrganizations(catalog)} currentId={catalog.organization.id} />}
              menu={<MobileNavigation>{sidebar}</MobileNavigation>}
              alerts={<AlertsPopover alerts={getCatalogAlerts(catalog)} planNames={planNames} />}
              themeToggle={<ThemeToggle />}
              pageTitle={<PageTitle planNames={Object.fromEntries(planNames)} />}
              user={<Avatar name={currentUser.name} initials={currentUser.initials} />}
            />
          }
        >
          {children}
        </AppShell>}>
          {children}
        </RouteShell>
      </body>
    </html>
  );
}
