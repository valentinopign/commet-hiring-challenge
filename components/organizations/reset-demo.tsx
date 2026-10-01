"use client";

import { useRouter } from "next/navigation";
import { useOrganizations } from "@/components/organizations/organization-provider";

export function ResetDemo() {
  const { store, snapshot } = useOrganizations();
  const router = useRouter();
  if (!snapshot.hydrated || (snapshot.organizations.length === 0 && snapshot.recovery === "none")) return null;
  return <details className="mt-8 border-t border-line pt-4 text-sm">
    <summary className="w-fit cursor-pointer rounded-control px-2 py-2 text-ink-muted">Reset demo</summary>
    <p className="mt-3 max-w-xl text-ink-muted">Remove all companies created in this browser and return to Nimbus. Nimbus and your theme stay unchanged. This cannot be undone.</p>
    <button type="button" className="mt-3 min-h-11 rounded-control border border-line px-4 py-2 font-medium" onClick={() => {
      store.resetDemo();
      router.push("/");
    }}>Remove created companies</button>
  </details>;
}
