import Link from "next/link";
import { PlusIcon } from "@/components/icons/plus-icon";
import { outlineControlClass } from "@/components/ui/control-styles";

export function CreatePlanLink() {
  return (
    <Link href="/plans/new" className={outlineControlClass}>
      <PlusIcon />
      Create plan
    </Link>
  );
}
