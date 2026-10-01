import type { Metadata } from "next";
import { StoredCatalogDashboard } from "@/components/organizations/local-organization-dashboard";

export const metadata: Metadata = { title: "Company pricing" };

export default async function OrganizationPage({ params }: PageProps<"/organizations/[organizationId]/[[...path]]">) {
  const { organizationId, path } = await params;
  return <StoredCatalogDashboard organizationId={organizationId} path={path ?? []} />;
}
