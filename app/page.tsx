import { CatalogOverview } from "@/components/overview/catalog-overview";
import { catalog } from "@/data/catalog";

export default function OverviewPage() {
  return <CatalogOverview catalog={catalog} />;
}
