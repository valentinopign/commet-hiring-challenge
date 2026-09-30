import type { ReactNode } from "react";
import { FieldError } from "@/components/create-plan/field-error";

/** Spread onto the control so its label, hint and error are all announced with it. */
export type ControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type FormFieldProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (control: ControlProps) => ReactNode;
};

export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="font-medium">{label}</label>
      <div className="mt-1.5">
        {children({ id, "aria-describedby": describedBy, ...(error ? { "aria-invalid": true } : {}) })}
      </div>
      {hint && hintId && <div id={hintId} className="mt-1.5 text-caption text-ink-muted">{hint}</div>}
      {error && errorId && <FieldError id={errorId} message={error} />}
    </div>
  );
}
