import { describeVersionStatus } from "@/components/plan-detail/version-status";
import type { VersionShare } from "@/lib/derive/types";
import type { PlanChanges } from "@/lib/edit-plan/changes";
import { formatNumber } from "@/lib/format";

export function EditCustomerContext({ versions, changes, migration }: { versions: VersionShare[]; changes: PlanChanges; migration?: { operationCount: number; customers: number; targetVersion: number } }) {
  const scopeClass = "rounded-control border border-live bg-live-soft px-2.5 py-2";
  return <>
    <table className="w-full text-caption tabular-nums">
      <caption className="sr-only">Customers on each feature version</caption>
      <thead><tr className="text-xs text-ink-muted">
        <th scope="col" className="pb-1 text-left font-normal">Version</th>
        <th scope="col" className="pb-1 text-left font-normal">Status</th>
        <th scope="col" className="pb-1 text-right font-normal">Customers</th>
        <th scope="col" className="pb-1 pl-2 text-right font-normal">Share</th>
      </tr></thead>
      <tbody>{versions.map((version) => <tr key={version.version} className="border-t border-line">
        <th scope="row" className="py-2 text-left font-medium">v{version.version}</th>
        <td className="py-2 text-ink-muted">{describeVersionStatus(version).label}</td>
        <td className="py-2 text-right">{formatNumber(version.subscriptions)}</td>
        <td className="py-2 pl-2 text-right text-ink-muted">{version.subscriptions > 0 && version.percent === 0 ? "<1%" : `${version.percent}%`}</td>
      </tr>)}</tbody>
    </table>
    <section className="border-t border-line pt-3" aria-labelledby="edit-customer-scope-heading">
      <h3 id="edit-customer-scope-heading" className="text-caption font-medium">Who your changes reach</h3>
      <div className="mt-2 space-y-1 text-caption" role="status" aria-live="polite" aria-atomic="true">
        {changes.changeCount === 0 && !migration?.operationCount && <p className="text-ink-muted">No changes yet</p>}
        {changes.affectsAllCustomers && <p className={scopeClass}>
          <span className="sr-only">Price, credits or policy changed: </span>
          <span className="font-medium">{formatNumber(changes.totalCustomers)} customers · at renewal</span>
        </p>}
        {changes.createsVersion && <p className={scopeClass}>
          <span className="sr-only">Features changed: </span>
          <span className="font-medium">New customers receive v{changes.nextVersion}</span>
        </p>}
        {migration && migration.operationCount > 0 && <p className={scopeClass}><span className="sr-only">Migration selected: </span><span className="font-medium">{formatNumber(migration.customers)} customers · move to v{migration.targetVersion} at renewal</span></p>}
        {changes.changeCount > 0 && !changes.affectsAllCustomers && !changes.createsVersion && <p className="pt-1 text-ink-muted">Name or visibility only; subscriptions stay active.</p>}
      </div>
    </section>
  </>;
}
