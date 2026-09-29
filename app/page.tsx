import { catalog } from "@/data/catalog";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-lg font-semibold">Nimbus pricing catalog</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        This is the starting point, not a suggestion: every field is printed raw
        and in the order it happens to be stored. Replace this page.
      </p>
      <pre className="mt-6 overflow-x-auto bg-neutral-100 p-4 text-xs">
        {JSON.stringify(catalog, null, 2)}
      </pre>
    </main>
  );
}
