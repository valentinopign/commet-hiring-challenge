import { CheckIcon } from "@/components/icons/check-icon";
import { CREATE_PLAN_STEPS, stepIndex, type StepId } from "@/lib/create-plan/steps";

type StepListProps = {
  current: StepId;
  /** The furthest step the draft allows; later ones are shown but cannot be opened yet. */
  furthest: StepId;
  onSelect: (step: StepId) => void;
};

/**
 * Every step is listed so the whole path is visible from the start. Reachable steps are buttons;
 * the rest are plain text, since there is nothing to do with them yet. On a phone only the numbers
 * show: the step's title is right below, and a long one would wrap the list onto two lines.
 */
export function StepList({ current, furthest, onSelect }: StepListProps) {
  const currentIndex = stepIndex(current);
  const furthestIndex = stepIndex(furthest);

  return (
    <nav aria-label="Steps">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {CREATE_PLAN_STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isDone = index < currentIndex;
          const isReachable = index <= furthestIndex;
          const marker = (
            <span
              aria-hidden="true"
              className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${
                isCurrent
                  ? "border-live bg-live text-on-live"
                  : isDone
                    ? "border-line-strong text-ink"
                    : "border-line text-ink-muted"
              }`}
            >
              {isDone ? <CheckIcon className="size-3.5" /> : index + 1}
            </span>
          );
          const label = (
            <span className={`sr-only sm:not-sr-only ${isCurrent ? "font-medium text-ink" : ""}`}>
              {step.title}
              {isDone && <span className="sr-only"> (done)</span>}
            </span>
          );
          const content = <>{marker}{label}</>;
          const itemClass = "flex items-center gap-2 rounded-control px-1.5 py-1";

          return (
            <li key={step.id} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true" className="h-px w-3 bg-line-strong sm:w-5" />}
              {isCurrent ? (
                <span aria-current="step" className={itemClass}>{content}</span>
              ) : isReachable ? (
                <button
                  type="button"
                  onClick={() => onSelect(step.id)}
                  className={`${itemClass} text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink`}
                >
                  {content}
                </button>
              ) : (
                <span className={`${itemClass} text-ink-muted`}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
