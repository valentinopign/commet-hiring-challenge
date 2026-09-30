import Link from "next/link";
import { PlusIcon } from "@/components/icons/plus-icon";

export function CreatePlanLink() {
  return (
    <Link
      href="/plans/new"
      className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 font-medium text-surface hover:bg-ink/85"
    >
      <PlusIcon />
      Create plan
    </Link>
  );
}
