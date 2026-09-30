import Link from "next/link";
import { PlusIcon } from "@/components/icons/plus-icon";
import { outlineIconControlClass } from "@/components/ui/control-styles";

export function CreatePlanLink() {
  return (
    <Link href="/plans/new" className={outlineIconControlClass}>
      <PlusIcon />
      Create plan
    </Link>
  );
}
