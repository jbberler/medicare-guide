// Step 1 (Welcome screen) is built in Phase 3 — app/page.tsx will be replaced
// with the Medicare Decision Map hero, optional name field, and CTA.
// See BUILD_PLAN.md Step 3A.

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Medicare Guidepost
        </h1>
        <p className="text-gray-500 text-lg">
          Foundation layer complete. Welcome screen coming in Phase 3.
        </p>
        <p className="text-sm text-gray-400">
          Rates current for 2026 · Last updated March 2026
        </p>
      </div>
    </main>
  );
}
