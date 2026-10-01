import type { Metadata } from "next";
import { NimbusDashboard } from "@/components/organizations/nimbus-dashboard";

export const metadata: Metadata = { title: "Credit packs · Nimbus pricing" };

export default function CreditPacksPage() {
  return <NimbusDashboard path={["credit-packs"]} />;
}
