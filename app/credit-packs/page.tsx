import type { Metadata } from "next";
import { CreditPackCardGrid } from "@/components/credit-packs/credit-pack-card-grid";
import { PageHeading } from "@/components/page-heading";
import { catalog } from "@/data/catalog";
import { getCreditPackRows } from "@/lib/derive/credit-packs";

export const metadata: Metadata = { title: `Credit packs · ${catalog.organization.name} pricing` };

export default function CreditPacksPage() {
  return (
    <>
      <PageHeading
        title="Credit packs"
        description="Extra credits a customer buys without changing plan. Each pack is sold only on the plans listed on it, and unlike overage its credits expire."
      />
      <div className="mt-4">
        <CreditPackCardGrid rows={getCreditPackRows(catalog)} currency={catalog.organization.currency} />
      </div>
    </>
  );
}
