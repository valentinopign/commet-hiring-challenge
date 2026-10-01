import type { Metadata } from "next";
import { LocalOrganizationDashboard } from "@/components/organizations/local-organization-dashboard";
import { catalog } from "@/data/catalog";
import { getOrganizations } from "@/lib/derive/navigation";

export const metadata: Metadata = { title: "Company pricing" };

export default async function OrganizationPage({ params }: PageProps<"/organizations/[organizationId]/[[...path]]">) {
  const { organizationId, path } = await params;
  return <LocalOrganizationDashboard organizationId={organizationId} path={path ?? []} builtInOrganizations={getOrganizations(catalog)} />;
}
