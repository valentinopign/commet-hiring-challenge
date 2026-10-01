import type { Metadata } from "next";
import { NimbusDashboard } from "@/components/organizations/nimbus-dashboard";

export const metadata: Metadata = { title: "New plan · Nimbus pricing" };

export default async function NewPlanPage({ searchParams }: PageProps<"/plans/new">) {
  // The base and step come from the URL and are resolved against the seeded/stored catalog.
  await searchParams;
  return <NimbusDashboard path={["plans", "new"]} />;
}
