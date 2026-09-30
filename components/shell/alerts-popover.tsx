import { AlertList } from "@/components/alerts/alert-list";
import { BellIcon } from "@/components/icons/bell-icon";
import { BellRing } from "@/components/shell/bell-ring";
import { PopoverLinkCloser } from "@/components/shell/popover-link-closer";
import { iconControlClass } from "@/components/ui/control-styles";
import { needsAttention } from "@/lib/derive/alerts";
import type { CatalogAlert } from "@/lib/derive/types";

type AlertsPopoverProps = {
  alerts: CatalogAlert[];
  planNames: Map<string, string>;
};

const POPOVER_ID = "alerts-popover";
const POPOVER_TITLE_ID = "alerts-popover-title";

/**
 * Uses the native Popover API (`popover` + `popoverTarget`): the browser handles opening,
 * light dismiss, Escape and stacking, so this stays a Server Component.
 * The badge counts only what needs attention; notes are listed but not counted.
 */
export function AlertsPopover({ alerts, planNames }: AlertsPopoverProps) {
  const pending = alerts.filter(needsAttention);
  const hasCritical = pending.some((alert) => alert.severity === "critical");
  const label =
    pending.length === 0
      ? "Alerts, nothing needs attention"
      : `Alerts, ${pending.length} ${pending.length === 1 ? "needs" : "need"} attention`;

  return (
    <>
      <button
        type="button"
        popoverTarget={POPOVER_ID}
        aria-label={label}
        className={iconControlClass}
      >
        <BellRing shouldRing={pending.length > 0}>
          <BellIcon />
          {pending.length > 0 && (
            <span
              aria-hidden="true"
              data-bell-badge
              className={`absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs leading-none font-semibold text-on-status tabular-nums ${
                hasCritical ? "bg-critical" : "bg-warning"
              }`}
            >
              {pending.length}
            </span>
          )}
        </BellRing>
      </button>

      <div
        id={POPOVER_ID}
        popover="auto"
        role="dialog"
        aria-labelledby={POPOVER_TITLE_ID}
        className="fixed inset-auto top-[calc(var(--spacing-topbar)-0.25rem)] right-3 m-0 w-[min(26rem,calc(100vw-1.5rem))] overflow-hidden rounded-card border border-line-strong bg-surface p-0 text-ink shadow-popover"
      >
        <PopoverLinkCloser>
          <div className="border-b border-line bg-surface-raised px-4 py-2.5">
            <h2 id={POPOVER_TITLE_ID} className="font-semibold">Alerts</h2>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-3">
            <AlertList alerts={alerts} planNames={planNames} />
          </div>
        </PopoverLinkCloser>
      </div>
    </>
  );
}
