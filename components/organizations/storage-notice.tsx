"use client";

import { useOrganizations } from "./organization-provider";

export function StorageNotice() {
  const { snapshot } = useOrganizations();
  if (!snapshot.hydrated) return null;
  const memory = snapshot.persistence === "memory";
  const recovered = snapshot.recovery !== "none";
  if (!memory && !recovered) return null;
  return <div role="status" className="mb-5 rounded-control border border-warning/30 bg-warning-soft p-3 text-caption text-ink">
    {memory && <p>Browser storage is unavailable. Changes made in this session will not survive a reload. Previously saved browser data may still exist.</p>}
    {recovered && <p>{snapshot.recovery === "seed-changed" ? "Nimbus was restored to the updated demo seed. Saved local companies and their pending moves were kept." : "Some saved demo data could not be loaded. Invalid or unsupported data was ignored."}</p>}
  </div>;
}
