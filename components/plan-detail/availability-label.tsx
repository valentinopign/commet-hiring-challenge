import { CheckIcon } from "@/components/icons/check-icon";
import { CloseIcon } from "@/components/icons/close-icon";

type AvailabilityLabelProps = { isAvailable: boolean };

/**
 * "Not included" gets the same weight as "Included": a missing credit feature and a boolean set
 * to false are both unavailable, and both must read as clearly as a feature that is there.
 */
export function AvailabilityLabel({ isAvailable }: AvailabilityLabelProps) {
  return isAvailable ? (
    <span className="inline-flex items-center gap-1.5">
      <CheckIcon className="size-3.5 shrink-0 text-ink-muted" />
      Included
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-ink-muted">
      <CloseIcon className="size-3.5 shrink-0" />
      Not included
    </span>
  );
}
