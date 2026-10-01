"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CatalogCreditPacks } from "@/components/credit-packs/catalog-credit-packs";
import { CreatePlanFlow } from "@/components/create-plan/create-plan-flow";
import { PublishConfirmation } from "@/components/create-plan/publish-confirmation";
import CatalogLink from "@/components/organizations/catalog-link";
import { useOrganizations } from "@/components/organizations/organization-provider";
import { PageHeading } from "@/components/page-heading";
import { CatalogPlanDetail } from "@/components/plan-detail/catalog-plan-detail";
import type { Catalog } from "@/lib/catalog";
import { getDraftBases, getDraftLadder, resolveBasePlanCode } from "@/lib/derive/draft-flow";
import { getPlanLadder, summarizeDraft } from "@/lib/derive/plans";
import { getPlanDetail } from "@/lib/derive/plan-detail";
import type { DraftPlan } from "@/lib/derive/types";
import { addOnboardingPlan } from "@/lib/onboarding/add-plan";
import { organizationPath } from "@/lib/organization-routes";

export function StoredCatalogContent({ catalog, path }: { catalog: Catalog; path: string[] }) {
  if (path.length === 1 && path[0] === "credit-packs") return <CatalogCreditPacks catalog={catalog} />;
  return <StoredPlanContent catalog={catalog} path={path} />;
}

function StoredPlanContent({ catalog, path }: { catalog: Catalog; path: string[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const { store, snapshot } = useOrganizations();
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ draft: DraftPlan; persistence: "local" | "memory" } | null>(null);
  const overview = organizationPath(catalog.organization.id);

  function savePlan(draft: DraftPlan) {
    // Read the latest snapshot so publishing cannot overwrite another local update.
    const latest = store.getSnapshot().organizations.find((item) => item.organization.id === catalog.organization.id);
    if (!latest) { setError("This company is no longer available. Return to Nimbus and start again."); return; }
    const updated = addOnboardingPlan(latest, draft, new Date().toISOString());
    if (updated === latest) { setError("That API code is already used. Choose another code before adding this plan."); return; }
    const result = store.saveCatalog(updated);
    if (!result.ok) { setError("The plan could not be saved. Review its configuration and try again."); return; }
    setError("");
    setCreated({ draft: structuredClone(draft), persistence: result.persistence });
  }

  if (path.length === 2 && path[0] === "plans" && path[1] === "new") {
    if (created) {
      // Exclude the stored plan before inserting its highlighted row; it must appear exactly once.
      const summary = summarizeDraft(catalog, created.draft);
      const ladder = getDraftLadder(getPlanLadder(catalog).filter((plan) => plan.code !== created.draft.code), summary, summary.monthly?.price ?? null);
      return <PublishConfirmation planName={created.draft.name} planCode={created.draft.code} persistence={created.persistence}
        entries={ladder.entries} positionText="Your plan is now part of this company’s pricing." currency={catalog.organization.currency}
        onCreateAnother={() => {
          window.history.replaceState(null, "", organizationPath(catalog.organization.id, "/plans/new"));
          setCreated(null);
          setError("");
        }} />;
    }
    const initialBaseCode = resolveBasePlanCode(params.get("from") ?? undefined, getDraftBases(catalog));
    return <>
      <PageHeading title="New plan" />
      {error && <p role="alert" className="mb-4 text-critical">{error}</p>}
      <CreatePlanFlow key={initialBaseCode ?? "scratch"} catalog={catalog} initialBaseCode={initialBaseCode}
        onPublish={savePlan} onCancel={() => router.push(overview)}
        publicationNote={!snapshot.hydrated ? "Publishing saves this plan in this browser when storage is available." : snapshot.persistence === "memory" ? "Browser storage is unavailable. This plan will only last for this session." : "This plan will be saved in this browser."} />
    </>;
  }
  if (path.length === 2 && path[0] === "plans") {
    const detail = getPlanDetail(catalog, path[1]);
    if (detail) return <CatalogPlanDetail catalog={catalog} detail={detail} version={params.get("version") ?? undefined} compare={params.get("compare") ?? undefined} diff={params.get("diff") ?? undefined} editRequested={params.get("edit") === "1" || params.get("edit") === "instant"} animateEditEntry={params.get("edit") !== "instant"}
      schedules={snapshot.scheduledMigrations} onPublish={(request) => store.publishEdit(catalog.organization.id, request)} />;
  }
  return <div className="space-y-4">
    <h1 className="text-xl font-semibold">Page not found</h1>
    <p className="text-ink-muted">This page or plan does not exist in this company.</p>
    <CatalogLink href="/" className="inline-block rounded-control border border-line px-4 py-3">Back to overview</CatalogLink>
  </div>;
}

// Keep the existing import available while both company routes use the neutral component.
export { StoredCatalogContent as LocalOrganizationContent };
