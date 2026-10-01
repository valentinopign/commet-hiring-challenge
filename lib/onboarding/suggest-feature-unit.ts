import type { CatalogFeature } from "@/lib/catalog";

/** Clearing a manual or accepted value restores automatic suggestions. */
export function measurementOverride(value: string): string | null {
  return value.trim() ? value : null;
}

/** Suggest only familiar measurements; unknown features keep a neutral, editable fallback. */
export function suggestFeatureUnit(name: string, type: CatalogFeature["type"]): string {
  if (type === "boolean") return "";
  const normalizedName = name.trim().toLowerCase();
  const suggestions: [RegExp, string][] = type === "credit"
    ? [
        [/\bapi\b|\bcalls?\b/, "call"],
        [/\bgenerat\w*\b/, "generation"],
        [/\brender\w*\b/, "render"],
        [/\bexports?\b/, "export"],
        [/\bmessages?\b/, "message"],
      ]
    : [
        [/\bstorage\b|\bgigabytes?\b|\bgb\b/, "GB"],
        [/\busers?\b|\bmembers?\b/, "user"],
        [/\bseats?\b/, "seat"],
        [/\bworkspaces?\b/, "workspace"],
        [/\bprojects?\b/, "project"],
      ];
  return suggestions.find(([pattern]) => pattern.test(normalizedName))?.[1]
    ?? (type === "credit" ? "use" : "item");
}
