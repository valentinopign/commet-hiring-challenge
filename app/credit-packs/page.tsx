import type { Metadata } from "next";
import { CatalogCreditPacks } from "@/components/credit-packs/catalog-credit-packs";
import { catalog } from "@/data/catalog";

export const metadata: Metadata = { title: `Credit packs · ${catalog.organization.name} pricing` };

export default function CreditPacksPage() {
  return <CatalogCreditPacks catalog={catalog} />;
}
