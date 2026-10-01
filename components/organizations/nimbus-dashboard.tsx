import { StoredCatalogDashboard } from "@/components/organizations/local-organization-dashboard";
import { NIMBUS_ORGANIZATION_ID } from "@/lib/nimbus-seed";

/** Nimbus uses root URLs and the same seeded browser store as other companies. */
export function NimbusDashboard({ path = [] }: { path?: string[] }) {
  return <StoredCatalogDashboard organizationId={NIMBUS_ORGANIZATION_ID} path={path} />;
}
