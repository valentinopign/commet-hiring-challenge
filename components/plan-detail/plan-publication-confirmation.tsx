"use client";

import { CheckIcon } from "@/components/icons/check-icon";
import { primaryControlClass } from "@/components/ui/control-styles";
import type { EditPublication } from "@/lib/edit-plan/publication";
import { formatNumber } from "@/lib/format";
import { ReviewDialog } from "./review-dialog";

export function PlanPublicationConfirmation({ publication, persistence, persisted, animate, onClose }: {
  publication: EditPublication; persistence?: "local" | "memory"; persisted: boolean; animate: boolean; onClose: () => void;
}) {
  const title = publication.createsVersion ? `${publication.name} v${publication.version} published`
    : publication.movedCustomers > 0 ? "Customers moved" : "Plan updated";
  return <ReviewDialog open animate={animate} title={title} onClose={onClose}>
    <div role="status" className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-live-soft text-live-ink"><CheckIcon className="size-6" /></span>
        <p className="font-medium text-live-ink">{persisted && persistence !== "memory" ? "Changes saved" : "Changes applied"}</p>
      </div>
      {publication.movedCustomers > 0 ? <div>
        <p className="text-xl font-semibold tabular-nums">{formatNumber(publication.movedCustomers)} customers moved to v{publication.migrationTargetVersion}</p>
        <p className="mt-1 text-caption text-ink-muted">From {publication.fromVersions.map((version) => `v${version}`).join(" and ")} · Applied immediately</p>
      </div> : <p className="text-xl font-semibold">{publication.createsVersion ? "Ready for new customers" : `${publication.name} updated`}</p>}
      {!publication.createsVersion && <p className="text-caption text-ink-muted">No new version.</p>}
      {publication.affectedCustomers > 0 && <p className="text-caption text-ink-muted">Price, credits or exhaustion-policy changes reach all {formatNumber(publication.affectedCustomers)} customers at their next renewal.</p>}
      {publication.createsVersion && <p className="text-caption text-ink-muted">New customers receive v{publication.version}. {publication.movedCustomers > 0 ? "Selected existing customers have moved; everyone else keeps their feature version." : "Existing customers keep their feature version."}</p>}
    </div>
    <div className="space-y-4 border-t border-line pt-4">
      <p className="text-caption text-ink-muted">{persisted
        ? persistence === "memory" ? "Browser storage is unavailable. These changes only last for this session." : "Saved in this browser. Reloading keeps these changes."
        : "This page is a preview. Reloading restores the original catalog."}</p>
      <button type="button" data-dialog-close className={`${primaryControlClass} min-h-11`}>Done</button>
    </div>
  </ReviewDialog>;
}
