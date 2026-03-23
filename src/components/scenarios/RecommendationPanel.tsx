"use client";

import type { ScenarioResults } from "@/lib/engine";

type Props = {
  results: ScenarioResults;
};

export function RecommendationPanel({ results }: Props) {
  const { scenarios, recommended, cobraAcaWarning, cobraAcaMessage } = results;
  const rec = recommended ? scenarios.find((s) => s.id === recommended) : null;

  return (
    <div className="space-y-4">
      {cobraAcaWarning && cobraAcaMessage && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-sm text-red-800">
          {cobraAcaMessage}
        </div>
      )}

      {rec ? (
        <div className="p-5 bg-blue-50 border-2 border-blue-400 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-blue-600 text-xl leading-none" aria-hidden="true">
              ✓
            </span>
            <div>
              <h3 className="font-semibold text-blue-900 text-base">
                Recommended: Scenario {rec.id} — {rec.label}
              </h3>
              {rec.tagReason && (
                <p className="text-blue-800 text-sm mt-1">{rec.tagReason}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          <p className="font-semibold">
            Your situation has trade-offs in multiple directions.
          </p>
          <p className="mt-1">
            Review all three options and discuss with your SHIP counselor for
            personalized guidance.
          </p>
        </div>
      )}
    </div>
  );
}
