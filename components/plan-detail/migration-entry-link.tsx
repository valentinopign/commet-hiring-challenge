import CatalogLink from "@/components/organizations/catalog-link";

/** Query state survives company scoping and enters the current version's editing controls. */
export function MigrationEntryLink({ planCode, currentVersion, sourceVersion }: { planCode: string; currentVersion: number; sourceVersion?: number }) {
  const query = new URLSearchParams({ version: String(currentVersion), edit: "instant", migrate: sourceVersion === undefined ? "all" : String(sourceVersion) });
  return <CatalogLink href={`/plans/${encodeURIComponent(planCode)}?${query}#customer-migration`} scroll={false} className="inline-flex min-h-11 items-center text-caption font-medium text-live-ink underline underline-offset-4" aria-label={sourceVersion === undefined ? "Migrate customers" : `Migrate customers from v${sourceVersion}`}>
    Migrate customers <span aria-hidden="true" className="ml-1">→</span>
  </CatalogLink>;
}
