import { VisibilityBadge } from "@/components/plans/visibility-badge";

type PlanHeaderProps = { name: string; isPublic: boolean };

/** The visible name lives in the top bar; the <h1> stays here for headings and the skip link. */
export function PlanHeader({ name, isPublic }: PlanHeaderProps) {
  return (
    <>
      <h1 className="sr-only">{name}</h1>
      {!isPublic && (
        <div>
          <VisibilityBadge isPublic={isPublic} />
        </div>
      )}
    </>
  );
}
