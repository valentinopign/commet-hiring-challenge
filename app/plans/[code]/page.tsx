import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPlanDetail } from "@/components/plan-detail/catalog-plan-detail";
import { catalog } from "@/data/catalog";
import { getPlanDetail } from "@/lib/derive/plan-detail";

export async function generateMetadata({ params }: PageProps<"/plans/[code]">): Promise<Metadata> {
  const { code } = await params;
  const detail = getPlanDetail(catalog, code);
  return { title: `${detail?.plan.name ?? "Plan"} · ${catalog.organization.name} pricing` };
}

export default async function PlanPage({ params, searchParams }: PageProps<"/plans/[code]">) {
  const { code } = await params;
  const { version } = await searchParams;
  const detail = getPlanDetail(catalog, code);
  if (!detail) notFound();
  return <CatalogPlanDetail catalog={catalog} detail={detail} version={version} />;
}
