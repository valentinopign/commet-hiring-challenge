import Link from "next/link";
import { AlertList } from "@/components/alerts/alert-list";
import { BellIcon } from "@/components/icons/bell-icon";
import { PopoverLinkCloser } from "@/components/shell/popover-link-closer";
import { needsAttention } from "@/lib/derive/alerts";
import type { CatalogAlert } from "@/lib/derive/types";

type AlertsPopoverProps = {
  alerts: CatalogAlert[];
  planNames: Map<string, string>;
};

const POPOVER_ID = "alerts-popover";

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
        className="relative inline-flex size-9 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink"
      >
        <BellIcon className="size-5" />
        {pending.length > 0 && (
          <span
            aria-hidden="true"
            className={`absolute top-0.5 right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs leading-none font-semibold text-surface tabular-nums ${
              hasCritical ? "bg-critical" : "bg-warning"
            }`}
          >
            {pending.length}
          </span>
        )}
      </button>

      <div
        id={POPOVER_ID}
        popover="auto"
        aria-label="Alerts"
        className="fixed inset-auto top-13 right-4 m-0 w-[min(26rem,calc(100vw-2rem))] rounded-md border border-line bg-surface p-0 text-ink shadow-popover"
      >
        <PopoverLinkCloser>
          <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
            <h2 className="font-semibold">Alerts</h2>
            <Link href="/" className="text-caption text-ink-muted underline underline-offset-2 hover:text-ink">
              Open overview
            </Link>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-3">
            <AlertList alerts={alerts} planNames={planNames} compact />
          </div>
        </PopoverLinkCloser>
      </div>
    </>
  );
}
