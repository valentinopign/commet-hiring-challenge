import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { AlertsPopover } from "@/components/shell/alerts-popover";
import { AppShell } from "@/components/shell/app-shell";
import { MobileNavigation } from "@/components/shell/mobile-navigation";
import { SidebarContent } from "@/components/shell/sidebar-content";
import { TopBar } from "@/components/shell/top-bar";
import { catalog } from "@/data/catalog";
import { getCatalogAlerts } from "@/lib/derive/alerts";
import { getNavigationPlans } from "@/lib/derive/navigation";
import { getPlanNames } from "@/lib/derive/plans";
import { currentUser } from "@/lib/session";
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
  const organizationName = catalog.organization.name;
  const sidebar = (
    <SidebarContent
      organizationName={organizationName}
      userName={currentUser.name}
      userInitials={currentUser.initials}
      plans={getNavigationPlans(catalog)}
    />
  );

  return (
    <html lang="en" className={`${plexSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-sm">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <AppShell
          sidebar={sidebar}
          topBar={
            <TopBar
              organizationName={organizationName}
              menu={<MobileNavigation>{sidebar}</MobileNavigation>}
              alerts={<AlertsPopover alerts={getCatalogAlerts(catalog)} planNames={getPlanNames(catalog)} />}
            />
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
