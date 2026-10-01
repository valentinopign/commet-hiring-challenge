import Link from "@/components/organizations/catalog-link";
import type { ReactNode } from "react";
import { outlineControlClass, primaryControlClass, touchTargetClass } from "@/components/ui/control-styles";

type StepFooterProps = {
  onBack: (() => void) | null;
  onCancel?: () => void;
  primaryLabel: string;
  /** Only the publish button is ever disabled, and `note` then says why next to it. */
  primaryDisabled?: boolean;
  note?: ReactNode;
};

/** The primary button submits the step's form, so Enter in any field moves on too. */
export function StepFooter({ onBack, onCancel, primaryLabel, primaryDisabled = false, note }: StepFooterProps) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
      {onBack ? (
        <button type="button" onClick={onBack} className={`${outlineControlClass} ${touchTargetClass} relative`}>
          Back
        </button>
      ) : onCancel ? (
        <button type="button" onClick={onCancel} className={`${outlineControlClass} ${touchTargetClass} relative`}>Cancel</button>
      ) : (
        <Link href="/" className={`${outlineControlClass} ${touchTargetClass} relative`}>
          Cancel
        </Link>
      )}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
        {note && <p id="step-footer-note" className="text-caption text-ink-muted">{note}</p>}
        <button
          type="submit"
          disabled={primaryDisabled}
          aria-describedby={note ? "step-footer-note" : undefined}
          className={`${primaryControlClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
