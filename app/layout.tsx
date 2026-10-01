import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { RouteShell } from "@/components/shell/route-shell";
import { NIMBUS_ORGANIZATION_ID } from "@/lib/nimbus-seed";
import { themeInitScript } from "@/lib/theme";
import { OrganizationProvider } from "@/components/organizations/organization-provider";
import { SetupHandoffProvider } from "@/components/onboarding/setup-handoff-provider";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

export const metadata: Metadata = {
  title: "Pricing dashboard",
  description: "Manage plans, credits and customer versions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script may set data-theme before React hydrates; that difference is expected.
    <html lang="en" className={`${plexSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full font-sans text-sm">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2">
          Skip to content
        </a>
        <OrganizationProvider builtInOrganizationId={NIMBUS_ORGANIZATION_ID}>
          <SetupHandoffProvider>
            <RouteShell>{children}</RouteShell>
          </SetupHandoffProvider>
        </OrganizationProvider>
      </body>
    </html>
  );
}
