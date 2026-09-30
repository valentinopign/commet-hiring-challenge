import type { Metadata } from "next";
import { CreatePlanFlow } from "@/components/create-plan/create-plan-flow";
import { PageHeading } from "@/components/page-heading";
import { catalog } from "@/data/catalog";
import { getDraftBases, resolveBasePlanCode } from "@/lib/derive/draft-flow";

export const metadata: Metadata = { title: `New plan · ${catalog.organization.name} pricing` };

/**
 * The flow derives what it needs from the catalog on the client, where the checks run on every
 * edit; the page only resolves which plan to start from.
 */
export default async function NewPlanPage({ searchParams }: PageProps<"/plans/new">) {
  const { from } = await searchParams;
  const initialBaseCode = resolveBasePlanCode(from, getDraftBases(catalog));

  return (
    <>
      <PageHeading title="New plan" />
      {/* Keyed by the base so following a "Create plan from X" link starts a fresh draft. */}
      <CreatePlanFlow key={initialBaseCode ?? "scratch"} catalog={catalog} initialBaseCode={initialBaseCode} />
    </>
  );
}
