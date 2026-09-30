import type { Dispatch } from "react";
import type { Catalog } from "@/lib/catalog";
import type { DraftFlowAction, DraftFlowState } from "@/lib/create-plan/draft-reducer";
import type { ExistingPlan, StepIssue } from "@/lib/create-plan/steps";
import type { YearlyReference } from "@/lib/derive/draft-flow";
import type {
  CreditPackSummary,
  DraftBase,
  DraftSummary,
  DraftWarning,
  NeighbourPlans,
  PlanSummary,
} from "@/lib/derive/types";

/** What the flow derives once from the catalog: it does not change while the person edits. */
export type CreatePlanData = {
  catalog: Catalog;
  currency: string;
  ladder: PlanSummary[];
  bases: DraftBase[];
  existingPlans: ExistingPlan[];
  planNames: Map<string, string>;
  yearlyReference: YearlyReference | null;
  packs: CreditPackSummary[];
};

/** What changes with every edit, derived from the draft on each render. */
export type DraftDerived = {
  summary: DraftSummary;
  /** `null` until the draft has a monthly price to place it with. */
  position: NeighbourPlans | null;
  warnings: DraftWarning[];
};

export type StepProps = {
  state: DraftFlowState;
  dispatch: Dispatch<DraftFlowAction>;
  data: CreatePlanData;
  derived: DraftDerived;
  issues: StepIssue[];
  /** After a "Continue" with something missing, every problem in the step shows. */
  showAllIssues: boolean;
};

export function issueMessage(issues: StepIssue[], field: StepIssue["field"], show: boolean): string | undefined {
  return show ? issues.find((issue) => issue.field === field)?.message : undefined;
}
