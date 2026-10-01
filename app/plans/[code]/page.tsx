import type { Metadata } from "next";
import { NimbusDashboard } from "@/components/organizations/nimbus-dashboard";

// Saved plan names/codes exist only in this browser. The dashboard sets the hydrated title
// and handles missing codes; a seed-only server lookup would reject newly created plans.
export const metadata: Metadata = { title: "Plan · Nimbus pricing" };

export default async function PlanPage({ params, searchParams }: PageProps<"/plans/[code]">) {
  const { code } = await params;
  // Resolve query-dependent rendering on the server; the shared client reads the same URL.
  await searchParams;
  return <NimbusDashboard path={["plans", code]} />;
}
