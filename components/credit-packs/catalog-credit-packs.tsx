import type { Catalog } from "@/lib/catalog";
import { CreditPackCardGrid } from "./credit-pack-card-grid";
import { PageHeading } from "@/components/page-heading";
import { getCreditPackRows } from "@/lib/derive/credit-packs";

export function CatalogCreditPacks({ catalog }: { catalog: Catalog }) {
  return <><PageHeading title="Credit packs" /><div className="mt-4"><CreditPackCardGrid rows={getCreditPackRows(catalog)} currency={catalog.organization.currency} /></div></>;
}
