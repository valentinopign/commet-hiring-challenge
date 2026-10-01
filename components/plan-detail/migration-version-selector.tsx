"use client";

import type { Catalog, Plan, ReleaseFeature } from "@/lib/catalog";
import { getMigrationOptions, type ScheduledMigration } from "@/lib/edit-plan/publication";
import { formatCount } from "@/lib/format";
import { FeatureChangeRow } from "./feature-change-row";

/** Source selection + source-to-target impact can also serve a standalone migration review. */
export function MigrationVersionSelector({ catalog, plan, targetVersion, targetFeatures, schedules, selectedVersions, onChange }: {
  catalog: Catalog; plan: Plan; targetVersion: number; targetFeatures: ReleaseFeature[]; schedules: readonly ScheduledMigration[];
  selectedVersions: number[]; onChange: (versions: number[]) => void;
}) {
  const options = getMigrationOptions(catalog, plan, targetFeatures, schedules, true).filter((option) => option.version < targetVersion && option.customers > 0);
  return <fieldset className="space-y-3">
    <legend className="font-semibold">Move existing customers to v{targetVersion}</legend>
    <p className="text-caption text-ink-muted">Optional. Customers keep their version unless selected. Confirmed moves apply immediately.</p>
    {options.map((option) => {
      const checked = selectedVersions.includes(option.version);
      const worse = option.changes.filter((change) => change.impact === "worse");
      const other = option.changes.filter((change) => change.impact !== "worse");
      return <div key={option.version} className={`rounded-control border p-3 ${checked ? "border-live bg-live-soft" : "border-line"}`}>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" className="size-4 accent-live" checked={checked} disabled={option.disabled} onChange={(event) => onChange(event.target.checked ? [...selectedVersions, option.version] : selectedVersions.filter((version) => version !== option.version))} />
          <span className="font-medium">v{option.version}{option.current ? " · Current today" : " · Retired"} <span className="text-caption text-ink-muted">— {formatCount(option.customers, "customer")}</span></span>
        </label>
        {option.scheduled.length > 0 && <p className="text-caption text-info">Previously scheduled for v{option.scheduled.map((item) => item.toVersion).join(", v")}. Confirming this move replaces that pending operation.</p>}
        {checked && <div className="mt-2 border-t border-line pt-3">
          <h4 className="text-caption font-medium">v{option.version} → v{targetVersion}</h4>
          {worse.length > 0 && <section className="mt-2 rounded-control border border-critical/35 bg-critical-soft px-3 py-2">
            <h5 className="text-caption font-semibold text-critical">Worse for these customers</h5>
            <ul className="divide-y divide-line">{worse.map((change) => <FeatureChangeRow key={change.feature.code} change={change} currency={catalog.organization.currency} />)}</ul>
          </section>}
          <ul className="divide-y divide-line">{other.map((change) => <FeatureChangeRow key={change.feature.code} change={change} currency={catalog.organization.currency} />)}</ul>
          {option.changes.length === 0 && <p className="mt-2 text-caption text-ink-muted">Same feature values; only the assigned version changes.</p>}
        </div>}
      </div>;
    })}
  </fieldset>;
}
