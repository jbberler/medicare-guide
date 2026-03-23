"use client";

import { useWizard, TOTAL_STEPS } from "./WizardShell";

const STEP_LABELS: Record<number, string> = {
  1: "Welcome",
  2: "Your household",
  3: "Your insurance",
  4: "Your income",
  5: "Your health",
  6: "Your timeline",
  7: "Your scenarios",
  8: "Your decision memo",
};

function formatCoverageType(ct: string): string {
  const map: Record<string, string> = {
    employer_group: "Employer group",
    cobra: "COBRA",
    aca: "ACA marketplace",
    none: "No coverage",
  };
  return map[ct] ?? ct;
}

function formatIrmaaBracket(b: string): string {
  const map: Record<string, string> = {
    base: "Income ≤$206K",
    tier1: "Income $206K–$258K",
    tier2: "Income $258K–$322K",
    tier3: "Income $322K–$386K",
    tier4: "Income $386K–$750K",
    tier5: "Income >$750K",
  };
  return map[b] ?? b;
}

export function ProgressRail() {
  const { state, goToStep } = useWizard();
  const { currentStep, completedSteps, inputs } = state;

  const summaryItems: string[] = [];
  if (inputs.name) summaryItems.push(`Hi, ${inputs.name}`);
  if (inputs.age !== undefined) summaryItems.push(`Age ${inputs.age}`);
  if (inputs.state) summaryItems.push(inputs.state);
  if (inputs.marital_status)
    summaryItems.push(
      inputs.marital_status === "married" ? "Married" : "Single"
    );
  if (inputs.coverage_type)
    summaryItems.push(formatCoverageType(inputs.coverage_type));
  if (inputs.irmaa_bracket)
    summaryItems.push(formatIrmaaBracket(inputs.irmaa_bracket));
  if (inputs.health_status) {
    const healthLabels: Record<string, string> = {
      healthy: "Generally healthy",
      managing_conditions: "Managing conditions",
      frequent_care: "Frequent care",
    };
    summaryItems.push(healthLabels[inputs.health_status] ?? inputs.health_status);
  }

  return (
    <nav
      aria-label="Wizard progress"
      className="flex flex-col w-full px-4 py-6 overflow-y-auto"
    >
      <ol className="flex flex-col gap-0.5" role="list">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const step = i + 1;
          const isCompleted = completedSteps.has(step);
          const isCurrent = step === currentStep;
          const isClickable = isCompleted;

          return (
            <li key={step}>
              <button
                onClick={() => isClickable && goToStep(step)}
                disabled={!isClickable && !isCurrent}
                aria-current={isCurrent ? "step" : undefined}
                className={[
                  "w-full flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  isCurrent
                    ? "bg-blue-50 text-blue-800 font-semibold"
                    : isCompleted
                    ? "text-gray-700 hover:bg-gray-100 cursor-pointer"
                    : "text-gray-400 cursor-default",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold border",
                    isCurrent
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isCompleted
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 text-gray-400",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {isCompleted ? "✓" : step}
                </span>
                <span>{STEP_LABELS[step]}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {summaryItems.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Your summary
          </p>
          <ul className="flex flex-col gap-1.5">
            {summaryItems.map((item, i) => (
              <li key={i} className="text-sm text-gray-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
