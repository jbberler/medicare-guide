"use client";

import { useState, useEffect } from "react";
import { useWizard } from "@/components/wizard/WizardShell";
import { computeScenarios, LookupError } from "@/lib/engine";
import type { ScenarioResults } from "@/lib/engine";
import { WizardInputsSchema } from "@/lib/schemas";
import { ComparisonTable } from "@/components/scenarios/ComparisonTable";
import { ScenarioTabs } from "@/components/scenarios/ScenarioTabs";
import { RecommendationPanel } from "@/components/scenarios/RecommendationPanel";

type LoadState =
  | { phase: "loading" }
  | { phase: "success"; results: ScenarioResults }
  | { phase: "error"; message: string };

export function ScenariosStep() {
  const { state, advance, goBack } = useWizard();
  const [loadState, setLoadState] = useState<LoadState>({ phase: "loading" });

  // 2-second loading interstitial — intentional trust mechanism, not real async work.
  // Instant results feel like templates; this brief pause signals the tool is reasoning
  // through the user's specific inputs rather than serving a generic answer.
  useEffect(() => {
    const timer = setTimeout(() => {
      const parsed = WizardInputsSchema.safeParse(state.inputs);

      if (!parsed.success) {
        setLoadState({
          phase: "error",
          message:
            "Some required information is missing. Please go back and complete all steps.",
        });
        return;
      }

      try {
        const results = computeScenarios(parsed.data);
        setLoadState({ phase: "success", results });
      } catch (err) {
        if (err instanceof LookupError) {
          setLoadState({
            phase: "error",
            message:
              "Something went wrong processing your data. Your information is saved — try refreshing.",
          });
        } else {
          setLoadState({
            phase: "error",
            message:
              "An unexpected error occurred. Your data is saved — try refreshing.",
          });
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [state.inputs]);

  if (loadState.phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-80 gap-6">
        <div
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
          role="status"
          aria-label="Analyzing your situation"
        />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Analyzing your situation...
          </h2>
          <p className="text-gray-500 text-sm max-w-xs">
            Reviewing your income, coverage, and health preferences to model
            your three scenarios.
          </p>
        </div>
      </div>
    );
  }

  if (loadState.phase === "error") {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {loadState.message}
        </div>
        <button
          onClick={() => goBack()}
          className="px-4 py-2 min-h-[44px] text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const { results } = loadState;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Your scenarios</h2>
        <p className="text-gray-600 mt-1">
          Based on your situation, here are your three Medicare options
          side-by-side.
        </p>
      </div>

      {/* Desktop: comparison table; mobile: tabbed view */}
      <div className="hidden md:block -mx-8">
        <ComparisonTable results={results} />
      </div>
      <div className="md:hidden">
        <ScenarioTabs results={results} />
      </div>

      <RecommendationPanel results={results} />

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={() => goBack()}
          className="px-4 py-2 min-h-[44px] text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => advance()}
          className="px-6 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue to your memo →
        </button>
      </div>
    </div>
  );
}
