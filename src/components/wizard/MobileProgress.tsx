"use client";

import { useState, useEffect, useRef } from "react";
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

export function MobileProgress() {
  const { state, goToStep } = useWizard();
  const { currentStep, completedSteps, inputs } = state;

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Focus trap: when overlay opens, move focus inside and trap Tab within it.
  // When overlay closes, return focus to the trigger button.
  useEffect(() => {
    if (!overlayOpen) {
      triggerRef.current?.focus();
      return;
    }

    const overlay = document.getElementById("progress-overlay");
    if (!overlay) return;

    // Focus the close button (first focusable element)
    const focusable = Array.from(
      overlay.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    focusable[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOverlayOpen(false);
        return;
      }
      if (e.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [overlayOpen]);

  // Key inputs for the pull-up summary sheet
  const summaryItems: string[] = [];
  if (inputs.age !== undefined) summaryItems.push(`Age ${inputs.age}`);
  if (inputs.state) summaryItems.push(inputs.state);
  if (inputs.coverage_type) {
    const labels: Record<string, string> = {
      employer_group: "Employer",
      cobra: "COBRA",
      aca: "ACA",
      none: "No coverage",
    };
    summaryItems.push(labels[inputs.coverage_type] ?? inputs.coverage_type);
  }
  if (inputs.irmaa_bracket && inputs.irmaa_bracket !== "base") {
    summaryItems.push("IRMAA applies");
  }

  const completedCount = completedSteps.size;

  return (
    <>
      {/* Sticky header — visible on mobile only */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden print:hidden">
        <button
          ref={triggerRef}
          onClick={() => setOverlayOpen(true)}
          className="flex flex-1 items-center gap-2 min-h-[44px]"
          aria-label={`Progress: step ${currentStep} of ${TOTAL_STEPS}. Open overview.`}
        >
          {/* Step indicator dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const step = i + 1;
              const isCompleted = completedSteps.has(step);
              const isCurrent = step === currentStep;
              return (
                <span
                  key={step}
                  className={[
                    "rounded-full transition-all",
                    isCurrent
                      ? "h-2.5 w-2.5 bg-blue-600"
                      : isCompleted
                      ? "h-2 w-2 bg-green-500"
                      : "h-2 w-2 bg-gray-300",
                  ].join(" ")}
                />
              );
            })}
          </div>
          <span className="text-sm font-medium text-gray-700 truncate">
            {STEP_LABELS[currentStep]}
          </span>
        </button>
        <span className="text-xs text-gray-400 shrink-0" aria-hidden="true">
          {completedCount}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Full-screen progress overlay (tap dots to open) */}
      {overlayOpen && (
        <div
          id="progress-overlay"
          className="fixed inset-0 z-50 bg-white overflow-y-auto md:hidden"
          role="dialog"
          aria-modal={true}
          aria-labelledby="progress-overlay-title"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
            <h2 id="progress-overlay-title" className="text-lg font-semibold text-gray-900">Your progress</h2>
            <button
              onClick={() => setOverlayOpen(false)}
              className="rounded-md p-2 min-h-[44px] min-w-[44px] text-gray-500 hover:bg-gray-100"
              aria-label="Close progress overview"
            >
              ✕
            </button>
          </div>
          <ol className="px-4 py-4 flex flex-col gap-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const step = i + 1;
              const isCompleted = completedSteps.has(step);
              const isCurrent = step === currentStep;
              const isClickable = isCompleted;

              return (
                <li key={step}>
                  <button
                    onClick={() => {
                      if (isClickable) {
                        goToStep(step);
                        setOverlayOpen(false);
                      }
                    }}
                    disabled={!isClickable && !isCurrent}
                    aria-current={isCurrent ? "step" : undefined}
                    className={[
                      "w-full flex items-center gap-3 rounded-md px-3 py-3 text-left min-h-[44px]",
                      isCurrent
                        ? "bg-blue-50 text-blue-800 font-semibold"
                        : isCompleted
                        ? "text-gray-700"
                        : "text-gray-400",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border",
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
        </div>
      )}

      {/* Pull-up bottom sheet — running summary */}
      <div className="fixed bottom-0 left-0 right-0 z-20 md:hidden print:hidden">
        <button
          onClick={() => setSummaryOpen((v) => !v)}
          className="w-full flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 min-h-[44px]"
          aria-expanded={summaryOpen}
          aria-label={summaryOpen ? "Collapse summary" : "Expand summary"}
        >
          <span className="text-sm text-gray-600">
            {summaryOpen
              ? "Hide summary"
              : `${completedCount} of ${TOTAL_STEPS} completed`}
          </span>
          <span className="text-gray-400 text-xs" aria-hidden="true">
            {summaryOpen ? "▼" : "▲"}
          </span>
        </button>
        {summaryOpen && (
          <div className="bg-white border-t border-gray-100 px-4 pb-5 pt-2">
            {summaryItems.length > 0 ? (
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {summaryItems.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">
                Your key inputs will appear here as you complete each step.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
