import { CriticalIcon } from "@/components/icons/critical-icon";

type FieldErrorProps = { id: string; message: string };

/** Icon and text together: the red alone would not say that something is wrong. */
export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p id={id} className="enter-rise mt-1.5 flex items-start gap-1.5 text-caption text-critical">
      <CriticalIcon className="mt-px size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
