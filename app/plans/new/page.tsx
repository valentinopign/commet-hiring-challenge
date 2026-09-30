import type { Metadata } from "next";
import { CreatePlanFlow } from "@/components/create-plan/create-plan-flow";
import { PageHeading } from "@/components/page-heading";
import { catalog } from "@/data/catalog";
import { getDraftBases, resolveBasePlanCode } from "@/lib/derive/draft-flow";

export const metadata: Metadata = { title: `New plan · ${catalog.organization.name} pricing` };

export default async function NewPlanPage({ searchParams }: PageProps<"/plans/new">) {
  const { from } = await searchParams;
  const bases = getDraftBases(catalog);
  const initialBaseCode = resolveBasePlanCode(from, bases);

  return (
    <>
      <PageHeading title="New plan" />
      {/* Keyed by the base so following a "Create plan from X" link starts a fresh draft. */}
      <CreatePlanFlow
        key={initialBaseCode ?? "scratch"}
        bases={bases}
        initialBaseCode={initialBaseCode}
        existingPlans={catalog.plans.map(({ code, name }) => ({ code, name }))}
        currency={catalog.organization.currency}
      />
    </>
  );
}
