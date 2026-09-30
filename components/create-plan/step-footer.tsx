import Link from "next/link";
import { outlineControlClass, primaryControlClass, touchTargetClass } from "@/components/ui/control-styles";

type StepFooterProps = {
  onBack: (() => void) | null;
  /** `null` on the last step, whose own action (publish) replaces "Continue". */
  continueLabel: string | null;
};

/** "Continue" submits the step's form, so Enter in any field moves on too. */
export function StepFooter({ onBack, continueLabel }: StepFooterProps) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
      {onBack ? (
        <button type="button" onClick={onBack} className={`${outlineControlClass} ${touchTargetClass} relative`}>
          Back
        </button>
      ) : (
        <Link href="/" className={`${outlineControlClass} ${touchTargetClass} relative`}>
          Cancel
        </Link>
      )}
      {continueLabel && (
        <button type="submit" className={primaryControlClass}>
          {continueLabel}
        </button>
      )}
    </div>
  );
}
